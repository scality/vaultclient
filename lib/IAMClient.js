/* eslint-disable comma-dangle */
/* eslint-disable no-underscore-dangle */
'use strict'; // eslint-disable-line

const { SignatureV4 } = require('@smithy/signature-v4');
const { Sha256 } = require('@aws-crypto/sha256-universal');
const assert = require('assert');
const werelogs = require('werelogs');
const http = require('http');
const https = require('https');
const { parseString } = require('xml2js');
const queryString = require('querystring');
const { http: HttpAgent, https: HttpsAgent } = require('httpagent');
const { httpClientFreeSocketTimeout, InternalError } = require('./constants');

const regexAccountId = /^[0-9]{12}$/;
const regexCanonicalId = /^[A-Za-z0-9]{64}$/;
const regexpAccessKey = /^[A-Z0-9]{20}$/;
const regexpSecretKey = /^[A-Za-z0-9/+=]{40}$/;

class VaultClient {
    /**
     * @constructor
     * @param {string} host - hostname or IP of the Vault server
     * @param {number} [port=8500] - port of the Vault server
     * @param {boolean} [useHttps] - whether to use https or not
     * @param {string} [key] - Https private key content
     * @param {string} [cert] - Https public certificate content
     * @param {string} [ca] - Https authority certificate content
     * @param {boolean} [ignoreCa] - Ignore authority
     * @param {string} [accessKey] - accessKey for v4 signature
     * @param {string} [secretKeyValue] - secretKeyValue for v4 signature
     * @param {werelogs.API} [logApi] - object providing a constructor function
     *                                  for the Logger object
     * @param {string} [path] - prefix requests with this path
     * @param {string} [sessionToken] - session token for v4 signature
     */
    constructor(host, port, useHttps, key, cert, ca, ignoreCa,
        accessKey, secretKeyValue, logApi, path, sessionToken) {
        assert(typeof host === 'string' && host !== '', 'host is required');
        assert(port === undefined || typeof port === 'number',
            'port must be a number');
        assert(key === undefined || typeof key === 'string',
            'key must be a string');
        assert(cert === undefined || typeof cert === 'string',
            'cert must be a string');
        assert(ca === undefined || typeof ca === 'string',
            'ca must be a string');
        assert(path === undefined || path === null
            || (typeof path === 'string' && path.startsWith('/')),
        'path must be a string and start with a "/"');
        this.serverHost = host;
        this.serverPort = port || 8600;
        this._key = key;
        this._cert = cert;
        this._ca = ca;
        this.useHttps = (useHttps === true);
        if (this.useHttps) {
            this._agent = new HttpsAgent.Agent({
                ca: ca ? [ca] : undefined,
                keepAlive: true,
                requestCert: true,
                rejectUnauthorized: !(ignoreCa === true),
                freeSocketTimeout: httpClientFreeSocketTimeout,
            });
        } else {
            this._agent = new HttpAgent.Agent({
                keepAlive: true,
                freeSocketTimeout: httpClientFreeSocketTimeout,
            });
        }
        this.accessKey = accessKey;
        this.secretKeyValue = secretKeyValue;
        this.sessionToken = sessionToken;
        this.logApi = logApi || werelogs;
        this.log = new this.logApi.Logger('VaultClient');
        this._path = path;
        this.useAuthenticatedAdminRoutes = false;
    }

    setCustomEndpointForSignature(host, path) {
        this._host = host;
        this.__path = path;
    }

    enableIAMOnAdminRoutes() {
        this.useAuthenticatedAdminRoutes = true;
        return this;
    }

    /**
     * Set the configuration for the werelogs logger
     * @param {object} config - A configuration object for werelogs
     * @returns {undefined}
     */
    setLoggerConfig(config) {
        this.logApi.configure(config);
    }

    getServerHost() {
        return this.serverHost;
    }

    getServerPort() {
        return this.serverPort;
    }

    /**
     * @callback VaultClient~requestCallback
     * @param {Error} - The encountered error, if any. Its 'code' and 'message'
     *                  properties contain useful information.
     * @param {object} - The message returned by the vault server. Its 'code',
     *                   'message' and 'body' properties contain useful
     *                   information.
     */

    /**
     * Create an account
     *
     * @param {string} accountName - account name
     * @param {object} options - additional creation params
     * @param {string} options.email - account email
     * @param {string} [options.quota] - maximum quota for the account
     * @param {VaultClient~requestCallback} callback - callback
     * @returns {undefined}
     */
    createAccount(accountName, options, callback) {
        assert(typeof accountName === 'string' && accountName !== '',
            'accountName is required');
        assert(typeof options.email === 'string' && options.email !== '',
            'options.email is required');
        const data = {
            Action: 'CreateAccount',
            Version: '2010-05-08',
            name: accountName,
            emailAddress: options.email,
        };
        const {
            quota,
            externalAccountId,
            externalCanonicalId,
            customAttributes,
            disableSeed,
        } = options;

        if (quota) {
            const conv = Number.isNaN(Number.parseInt(quota, 10));
            assert(typeof quota === 'number'
                && !conv
                && quota >= 0, 'Quota must be a non-negative number');
            data.quotaMax = quota;
        }
        if (externalAccountId) {
            const conv = Number.isNaN(Number.parseInt(externalAccountId, 10));
            assert(typeof externalAccountId === 'string'
                && !conv
                && regexAccountId.test(externalAccountId),
            'invalid account id supplied');
            data.externalAccountId = externalAccountId;
        }
        if (externalCanonicalId) {
            assert(typeof externalCanonicalId === 'string'
                && regexCanonicalId.test(externalCanonicalId),
            'invalid account id supplied');
            data.externalCanonicalId = externalCanonicalId;
        }
        if (customAttributes) {
            assert(typeof customAttributes === 'object');
            data.customAttributes = JSON.stringify(customAttributes);
        }

        if (disableSeed) {
            assert(typeof disableSeed === 'boolean');
            data.disableSeed = disableSeed;
        }

        this.request('POST', '/', true, (err, result) => {
            if (err) {
                return callback(err);
            }
            return callback(null, {
                account: result.account.data,
            });
        }, data);
    }

    /**
     * Create a password for an account
     *
     * @param {string} accountName - account name
     * @param {string} password - account password
     * @param {VaultClient~requestCallback} callback - callback
     * @returns {undefined}
     */
    generateAccountPassword(accountName, password, callback) {
        assert(typeof accountName === 'string' && accountName !== '',
            'accountName is required');
        assert(typeof password === 'string' && password !== '',
            'password is required');
        const data = {
            Action: 'GenerateAccountPassword',
            Version: '2010-05-08',
            name: accountName,
            Password: password,
        };
        this.request('POST', '/', true, err => {
            if (err) {
                return callback(err);
            }
            return callback(null, {});
        }, data);
    }

    /**
     * Generate a new access key for the account
     *
     * @param {string} accountName - account name
     * @param {VaultClient~requestCallback} callback - callback
     * @param {object} options - additional creation params
     * @returns {undefined}
     */
    generateAccountAccessKey(accountName, callback, options) {
        assert(typeof accountName === 'string' && accountName !== '',
            'accountName is required');
        const data = {
            Action: 'GenerateAccountAccessKey',
            Version: '2010-05-08',
            AccountName: accountName,
        };
        if (options !== undefined) {
            const {
                externalAccessKey,
                externalSecretKey,
                durationSeconds,
            } = options;
            if (externalAccessKey) {
                assert(typeof externalAccessKey === 'string'
                    && regexpAccessKey.test(externalAccessKey)
                    && externalAccessKey !== '',
                'invalid access key supplied');
                data.externalAccessKey = externalAccessKey;
            }
            if (externalSecretKey) {
                assert(typeof externalSecretKey === 'string'
                    && regexpSecretKey.test(externalSecretKey)
                    && externalSecretKey !== '',
                'invalid secret key supplied');
                data.externalSecretKey = externalSecretKey;
            }
            if (durationSeconds) {
                assert(typeof durationSeconds === 'string'
                    && Number.parseInt(durationSeconds, 10)
                    && Number.parseInt(durationSeconds, 10) > 0,
                'invalid expiration time supplied');
                data.DurationSeconds = durationSeconds;
            }
        }
        this.request('POST', '/', true, (err, result) => {
            if (err) {
                return callback(err);
            }
            return callback(null, result.data);
        }, data);
    }

    /**
     * Delete an account
     *
     * @param {string} accountName - account name
     * @param {VaultClient~requestCallback} callback - callback
     * @returns {undefined}
     */
    deleteAccount(accountName, callback) {
        assert(typeof accountName === 'string' && accountName !== '',
            'accountName is required');

        this.request('POST', '/', true, callback, {
            Action: 'DeleteAccount',
            Version: '2010-05-08',
            AccountName: accountName,
        });
    }

    /**
     * Update Quota of an account
     *
     * @param {string} accountName - account name
     * @param {number} quota - maximum quota for the account
     * @param {VaultClient~requestCallback} callback - callback
     * @returns {undefined}
     */
    updateAccountQuota(accountName, quota, callback) {
        const conv = Number.isNaN(Number.parseInt(quota, 10));
        assert(typeof accountName === 'string' && accountName !== '',
            'accountName is required');
        assert(typeof quota === 'number' && !conv
            && quota >= 0, 'Quota must be a non-negative number');
        this.request('POST', '/', true, callback, {
            Action: 'UpdateAccountQuota',
            Version: '2010-05-08',
            AccountName: accountName,
            quotaMax: quota,
        });
    }

    /**
     * Delete Quota of an account
     *
     * @param {string} accountName - account name
     * @param {VaultClient~requestCallback} callback - callback
     * @returns {undefined}
     */
    deleteAccountQuota(accountName, callback) {
        assert(typeof accountName === 'string' && accountName !== '',
            'accountName is required');
        this.request('POST', '/', true, callback, {
            Action: 'DeleteAccountQuota',
            Version: '2010-05-08',
            AccountName: accountName,
        });
    }

    /**
     * Update account custom attributes
     *
     * @param {string} accountName - account name
     * @param {object} customAttributes - custom attributes
     * @param {VaultClient~requestCallback} callback - callback
     * @returns {undefined}
     */
    updateAccountAttributes(accountName, customAttributes, callback) {
        assert(typeof accountName === 'string' && accountName !== '',
            'name parameter is required for account name');
        assert(typeof customAttributes === 'object');
        this.request('POST', '/', true, callback, {
            Action: 'UpdateAccountAttributes',
            Version: '2010-05-08',
            name: accountName,
            customAttributes: JSON.stringify(customAttributes),
        });
    }

    /**
     * Add account attribute
     *
     * @param {object} reqParams - request parameters
     * @param {string} [reqParams.accountName] - Account Name
     * @param {string} [reqParams.accountId] - Account ID
     * @param {string} [reqParams.arn] - Account ARN
     * @param {string} [reqParams.canonicalId] - Canonical ID
     * @param {string} [reqParams.key] - Account attribute key
     * @param {string} [reqParams.value] - Account attribute value
     * @param {function} callback - callback
     * @return {undefined}
     */
    addAccountAttribute(reqParams, callback) {
        const {
            accountArn,
            accountName,
            accountId,
            canonicalId,
            key,
            value,
        } = reqParams;
        if (accountArn === undefined
            && accountName === undefined
            && accountId === undefined
            && canonicalId === undefined) {
            assert(false, 'account-name, account-id, account-arn or canonical-id'
                + ' need to be specified');
        }
        if (key === undefined) {
            assert(false, 'key needs to be specified');
        }
        assert((accountArn, typeof accountArn === 'string'
            || 'arn should be a string'));
        assert((accountName, typeof accountName === 'string'
            || 'name should be a string'));
        assert((accountId, typeof accountId === 'string'
            || 'id should be a string'));
        assert((canonicalId, typeof canonicalId === 'string'
            || 'canonicalId should be a string'));
        assert((key, typeof key === 'string'
            || 'key should be a string'));
        const data = {
            Action: 'AddAccountAttribute',
            Version: '2010-05-08',
            key,
        };
        if (accountArn) {
            data.accountArn = accountArn;
        }
        if (accountName) {
            data.accountName = accountName;
        }
        if (accountId) {
            data.accountId = accountId;
        }
        if (canonicalId) {
            data.canonicalId = canonicalId;
        }
        if (value) {
            assert((value, typeof value === 'string'
            || 'value should be a string'));
            data.value = value;
        }
        this.request('POST', '/', true, callback, data);
    }

    /**
     * Delete account attribute
     *
     * @param {object} reqParams - request parameters
     * @param {string} [reqParams.accountName] - Account Name
     * @param {string} [reqParams.accountId] - Account ID
     * @param {string} [reqParams.arn] - Account ARN
     * @param {string} [reqParams.canonicalId] - Canonical ID
     * @param {string} [reqParams.key] - Account attribute key
     * @param {function} callback - callback
     * @return {undefined}
     */
    deleteAccountAttribute(reqParams, callback) {
        const {
            accountArn,
            accountName,
            accountId,
            canonicalId,
            key,
        } = reqParams;
        if (accountArn === undefined
            && accountName === undefined
            && accountId === undefined
            && canonicalId === undefined) {
            assert(false, 'account-name, account-id, account-arn or canonical-id'
                + ' need to be specified');
        }
        if (key === undefined) {
            assert(false, 'key needs to be specified');
        }
        assert((accountArn, typeof accountArn === 'string'
        || 'arn should be a string'));
        assert((accountName, typeof accountName === 'string'
        || 'name should be a string'));
        assert((accountId, typeof accountId === 'string'
        || 'id should be a string'));
        assert((canonicalId, typeof canonicalId === 'string'
        || 'canonicalId should be a string'));
        assert((key, typeof key === 'string'
        || 'key should be a string'));
        const data = {
            Action: 'DeleteAccountAttribute',
            Version: '2010-05-08',
            key,
        };
        if (accountArn) {
            data.accountArn = accountArn;
        }
        if (accountName) {
            data.accountName = accountName;
        }
        if (accountId) {
            data.accountId = accountId;
        }
        if (canonicalId) {
            data.canonicalId = canonicalId;
        }
        this.request('POST', '/', true, callback, data);
    }

    /**
     * Get accounts using account ids or names, canonical ids or email addresses
     *
     * @param {array|undefined} accounts - Account ids or names (depending on options.accountNames),
     * exclusive with emailAddresses and canonicalIds
     * @param {array|undefined} emailAddresses - Email addresses, exclusive
     *  with account ids or names and canonicalIds
     * @param {array|undefined} canonicalIds - Canonical ids, exclusive with
     *  account ids or names and emailAddresses
     * @param {object} options - Options
     * @param {string} [options.reqUid] - Request uid
     * @param {boolean} [options.accountNames] - Flag to consider first arg `accounts`
     * as `accountNames` instead of `accountIds`
     * @param {function} callback - Callback(err, result)
     * @return {undefined}
     */
    getAccounts(accounts, emailAddresses, canonicalIds, options, callback) {
        assert((accounts && Array.isArray(accounts)) || !accounts,
            'accounts should be an array');
        assert((emailAddresses && Array.isArray(emailAddresses))
            || !emailAddresses, 'emailAddresses should be an array');
        assert((canonicalIds && Array.isArray(canonicalIds)) || !canonicalIds,
            'canonicalIds should be an array');
        if (
            (accounts && (emailAddresses || canonicalIds))
            || (emailAddresses && (accounts || canonicalIds))
            || (canonicalIds && (accounts || emailAddresses))) {
            assert(false, 'accounts, emailAddresses and canonicalIds '
                + 'ids are exclusive');
        }
        const data = {
            Action: 'GetAccounts',
            Version: '2010-05-08',
        };
        if (accounts) {
            data[options.accountNames ? 'accountNames' : 'accountIds'] = accounts;
        }
        if (canonicalIds) {
            data.canonicalIds = canonicalIds;
        }
        if (emailAddresses) {
            data.emailAddresses = emailAddresses;
        }

        const verb = this.useAuthenticatedAdminRoutes ? 'POST' : 'GET';

        this.request(verb, '/', this.useAuthenticatedAdminRoutes, callback, data, options.reqUid, null);
    }

    /**
     * List accounts
     *
     * @param {object} options - Additional search params
     * @param {string} [options.marker] - Marker for pagination
     * @param {number} [options.maxItems] - Max items for pagination
     * @param {function} callback - callback
     * @return {undefined}
     */
    listAccounts(options, callback) {
        const data = {
            Action: 'ListAccounts',
            Version: '2010-05-08',
        };
        const {
            marker,
            maxItems,
            filterKey,
            filterKeyStartsWith,
        } = options;
        if (typeof marker !== 'undefined') {
            assert(typeof marker === 'string', 'Marker must be a string');
            data.Marker = marker;
        }
        if (typeof maxItems !== 'undefined') {
            assert.strictEqual(typeof maxItems, 'number',
                'maxItems need to be a number');
            const conv = Number.isNaN(Number.parseInt(maxItems, 10));
            assert.notStrictEqual(conv, true,
                'maxItems must be a number');
            assert(maxItems > 0 && maxItems <= 1000,
                'maxItems need to be a value between 1 and 1000 included');
            data.MaxItems = maxItems;
        }
        if (filterKey && filterKeyStartsWith) {
            assert(false,
                'filterKey and filterKeyStartsWith parameters are exclusive');
        }

        if (filterKey && filterKey.length !== 0) {
            assert(typeof filterKey === 'string',
                'filterKey should be a string');
            data.filterKey = filterKey;
        }
        if (filterKeyStartsWith && filterKeyStartsWith.length !== 0) {
            assert(typeof filterKeyStartsWith === 'string',
                'filterKeyStartsWith should be a string');
            data.filterKeyStartsWith = filterKeyStartsWith;
        }
        this.request('POST', '/', true, callback, data);
    }

    /**
     * Get account
     *
     * @param {object} options - Additional search params
     * @param {string} [options.accountName] - Account Name
     * @param {string} [options.accountId] - Account ID
     * @param {string} [options.canonicalId] - Canonical ID
     * @param {string} [options.emailAddress] - E-mail Address
     * @param {function} callback - callback
     * @return {undefined}
     */
    getAccount(options, callback) {
        const {
            accountArn,
            accountName,
            accountId,
            canonicalId,
            emailAddress,
        } = options;
        if (accountArn === undefined
            && accountName === undefined
            && accountId === undefined
            && canonicalId === undefined
            && emailAddress === undefined) {
            assert(false, 'account-name, account-id, email or canonical-id'
                + ' need to be specified');
        }
        assert((accountArn, typeof accountArn === 'string'
            || 'arn should be a string'));
        assert((accountName, typeof accountName === 'string'
            || 'name should be a string'));
        assert((accountId, typeof accountId === 'string'
            || 'id should be a string'));
        assert((canonicalId, typeof canonicalId === 'string'
            || 'canonicalId should be a string'));
        assert((emailAddress, typeof emailAddress === 'string'
            || 'emailAddress should be a string'));
        const data = {
            Action: 'GetAccount',
            Version: '2010-05-08',
        };
        if (accountArn) {
            data.accountArn = accountArn;
        }
        if (accountName) {
            data.accountName = accountName;
        }
        if (accountId) {
            data.accountId = accountId;
        }
        if (canonicalId) {
            data.canonicalId = canonicalId;
        }
        if (emailAddress) {
            data.emailAddress = emailAddress;
        }
        if (Object.values(data).length > 3) {
            assert(false, 'arn, name, id, emailAddress and canonicalId IDs'
                + ' are exclusive');
        }
        this.request('POST', '/', true, callback, data);
    }

    assumeRoleBackbeat(roleArn, roleSessionName, options, callback) {
        const data = {
            Action: 'AssumeRoleBackbeat',
            RoleArn: roleArn,
            RoleSessionName: roleSessionName,
        };
        this.request('POST', '/', false, (err, data, code) => {
            if (err) {
                return callback(err);
            }
            return callback(null, {
                data,
                code,
            });
        }, data, options.reqUid, null);
    }

    getRolesForWebIdentity(webIdentityToken, options, callback) {
        const data = {
            Action: 'GetRolesForWebIdentity',
            WebIdentityToken: webIdentityToken,
        };
        const {
            marker,
            maxItems,
        } = options;
        if (typeof marker !== 'undefined') {
            assert(typeof marker === 'string', 'Marker must be a string');
            data.Marker = marker;
        }
        if (typeof maxItems !== 'undefined') {
            assert.strictEqual(typeof maxItems, 'number',
                'maxItems need to be a number');
            const conv = Number.isNaN(Number.parseInt(maxItems, 10));
            assert.notStrictEqual(conv, true,
                'maxItems must be a number');
            assert(maxItems > 0 && maxItems <= 1000,
                'maxItems need to be a value between 1 and 1000 included');
            data.MaxItems = maxItems;
        }
        this.request('POST', '/', false, (err, data, code) => {
            if (err) {
                return callback(err);
            }
            return callback(null, {
                data,
                code,
            });
        }, data, options.reqUid, null);
    }

    /**
     * Verify AWS request signature using V2 auth
     *
     * @param {string} string - string to sign as built from the request
     * @param {string} signature - the user-computed signature as provided by
     *                             the request, base64-encoded
     * @param {string} accessKey - the id of the key as provided by the request
     * @param {object} options - additional verification params
     * @param {string} [options.algo] - either 'sha1' 'sha256'
     * @param {string} [options.reqUid] - the request UID
     * @param {string} [options.requestContext] - the requestContext to perform
     * @param {string} [options.securityToken] - Token for temporary credentials
     * authorization against IAM policies. This is a stringified version of a
     * RequestContext class.  See Arsenal for class details.
     * @param {VaultClient~requestCallback} callback - callback
     * @returns {undefined}
     */
    verifySignatureV2(string, signature, accessKey, options, callback) {
        assert(typeof string === 'string' && string !== '',
            'string is required');
        assert(typeof signature === 'string' && signature !== '',
            'signature is required');
        assert(typeof accessKey === 'string' && accessKey !== '',
            'accessKey is required');
        const algo = options.algo || 'sha256';
        assert(algo === 'sha1' || algo === 'sha256',
            'options.algo must be sha1 or sha256');

        const data = {
            Action: 'AuthV2',
            stringToSign: string,
            signatureFromRequest: signature,
            hashAlgorithm: algo,
            accessKey,
        };
        if (options.requestContext) {
            data.requestContext = options.requestContext;
        }
        if (options.securityToken) {
            data.securityToken = options.securityToken;
        }
        this.request('GET', '/', false, (err, data, code) => {
            if (err) {
                return callback(err);
            }
            return callback(null, {
                message: {
                    message: 'Authentication successful',
                    body: data,
                    code,
                },
            });
        }, data, options.reqUid, null);
    }

    /**
     * Verify AWS request signature using V4 auth (contrary to v2, hash is
     * always sha256)
     *
     * @param {string} stringToSign - string to sign as built from the request
     * @param {string} signature - the user-computed signature as provided by
     *                             the request, base64-encoded
     * @param {string} accessKey - the id of the key as provided by the request
     * @param {string} [region] - the region where the user wants authentication
     * @param {string} scopeDate - the date from which the signature is valid
     * @param {object} options - additional verification params
     * @param {string} [options.reqUid] - the request UID
     * @param {string} [options.requestContext] - the requestContext to perform
     * @param {string} [options.securityToken] - Token for temporary credentials
     * authorization against IAM policies. This is a stringified version of a
     * RequestContext class.  See Arsenal for class details.
     * @param {VaultClient~requestCallback} callback - callback
     * @returns {undefined}
     */
    verifySignatureV4(stringToSign, signature, accessKey, region, scopeDate,
        options, callback) {
        assert(typeof stringToSign === 'string' && stringToSign !== '',
            'stringToSign is required');
        assert(typeof signature === 'string' && signature !== '',
            'signature is required');
        assert(typeof accessKey === 'string' && accessKey !== '',
            'accessKey is required');
        assert(typeof scopeDate === 'string' && scopeDate !== '',
            'scopeDate is required');
        if (typeof region !== 'string') {
            // eslint-disable-next-line no-param-reassign
            region = '';
        }
        const data = {
            Action: 'AuthV4',
            stringToSign,
            signatureFromRequest: signature,
            accessKey,
            region,
            scopeDate,
        };
        if (options.requestContext) {
            data.requestContext = options.requestContext;
        }
        if (options.securityToken) {
            data.securityToken = options.securityToken;
        }
        this.request('GET', '/', false, (err, data, code) => {
            if (err) {
                return callback(err);
            }
            return callback(null, {
                message: {
                    message: 'Authentication successful',
                    body: data,
                    code,
                },
            });
        }, data, options.reqUid, null);
    }

    /**
     * A getter for Account email addresses provided a dictionary of canonical
     * IDs of interest
     * @param{String[]} canonicalIds - An array containing strings
     * representing Account.canonicalId
     * @param {Object} options - additional arguments
     * @param{String} options.reqUid - the request UID
     * @param{Function} callback - the callback handling the array of objects
     * and the error, if there is one
     * @returns{undefined}
     */
    getEmailAddresses(canonicalIds, options, callback) {
        assert(Array.isArray(canonicalIds), 'canonicalIds are required');
        const data = {
            Action: 'AclEmailAddresses',
            canonicalIds,
        };
        this.request('GET', '/', false, (err, data, code) => {
            if (err) {
                return callback(err);
            }
            return callback(null, {
                message: {
                    body: data,
                    code,
                    message: 'Attributes retrieved',
                },
            });
        }, data, options.reqUid, null);
    }

    /**
     * A getter for Account canonical IDs provided a dictionary of email
     * addresses of interest
     * @param{String[]} emailAddresses - An array containing strings
     * representing Account.emailAddresses
     * @param {Object} options - additional arguments
     * @param {string} options.reqUid - the request UID
     * @param{Function} callback - the callback handling the array of objects
     * and the error, if there is one
     * @returns{undefined}
     */
    getCanonicalIds(emailAddresses, options, callback) {
        assert(Array.isArray(emailAddresses), 'emailAddresses are required');
        const data = {
            Action: 'AclCanonicalIds',
            emailAddresses,
        };
        this.request('GET', '/', false, (err, data, code) => {
            if (err) {
                return callback(err);
            }
            return callback(null, {
                message: {
                    body: data,
                    code,
                    message: 'Attributes retrieved',
                },
            });
        }, data, options.reqUid, null);
    }

    /**
     * A getter for account canonical IDs given a list of account IDs
     * @param{String[]} accountIds - list of account IDs
     * @param {Object} options - additional arguments
     * @param {string} options.reqUid - the request UID
     * @param {werelogs.RequestLogger} [options.logger] - Logger instance
     * @param{Function} callback - the callback handling the array of objects
     * and the error, if there is one
     * @returns{undefined}
     */
    getCanonicalIdsByAccountIds(accountIds, options, callback) {
        assert(Array.isArray(accountIds), 'accountIds must be an array');
        accountIds.every(item => assert(typeof item === 'string'),
            'each entry in accountIds must be a string');
        const data = {
            Action: 'AccountsCanonicalIds',
            accountIds,
        };
        this.request('GET', '/', false, (err, data, code) => {
            if (err) {
                return callback(err);
            }
            return callback(null, {
                message: {
                    body: data,
                    code,
                    message: 'Attributes retrieved',
                },
            });
        }, data, options.reqUid, null, options.logger);
    }

    /**
     * A getter for accountIds given a list of canonicalIDs
     * @param {String[]} canonicalIds - list of canonicalIDs
     * @param {Object} options - additional arguments
     * @param {string} options.reqUid - the request UID
     * @param {werelogs.RequestLogger} [options.logger] - Logger instance
     * @param {Function} callback - the callback handling the response object
     * and the error, if there is one
     * @returns {undefined}
     */
    getAccountIds(canonicalIds, options, callback) {
        this.getAccounts(null, null, canonicalIds, options,
            (err, res, code) => {
                if (err) {
                    return callback(err);
                }
                const body = res.reduce((accounts, account) => {
                    // eslint-disable-next-line no-param-reassign
                    accounts[account.canId] = account.id;
                    return accounts;
                }, {});

                return callback(null, {
                    message: {
                        body,
                        code,
                        message: 'Attributes retrieved',
                    },
                });
            });
    }

    /**
     * Get policy evaluation (without authentication first)
     * @param {Object} requestContextParams - parameters needed to construct
     * requestContext in Vault
     * @param {Object} requestContextParams.constantParams -
     * params that have the
     * same value for each requestContext to be constructed in Vault
     * @param {Object} [requestContextParams.paramaterize] - params that have
     * arrays as values since a requestContext needs to be constructed with
     * each option in Vault
     * @param {string} userArn - arn of requesting user
     * @param {Object} options - additional arguments
     * @param{String} options.reqUid - the request UID
     * @param{Function} callback - callback with either error or an array
     * of authorization results
     * @returns{undefined}
     */
    checkPolicies(requestContextParams, userArn, options, callback) {
        if (Array.isArray(requestContextParams)) {
            requestContextParams.forEach(rc => {
                assert.strictEqual(typeof rc, 'object');
                assert.strictEqual(typeof rc.constantParams, 'object');
            });
        } else {
            assert.strictEqual(typeof requestContextParams, 'object');
            assert.strictEqual(typeof requestContextParams.constantParams, 'object');
        }

        assert(typeof userArn === 'string', 'need user arn');
        const data = {
            Action: 'CheckPolicies',
            requestContextParams,
            userArn,
        };
        this.request('POST', '/', false, (err, data, code) => {
            if (err) {
                return callback(err);
            }
            return callback(null, {
                message: {
                    body: data,
                    code,
                    message: 'Policies checked',
                },
            });
        }, data, options.reqUid, 'application/json');
    }

    /**
     * A getter for account canonical IDs given a list of account IDs
     * @param{String[]} userIds - list of account IDs
     * @param {Object} options - additional arguments
     * @param {string} options.reqUid - the request UID
     * @param {werelogs.RequestLogger} [options.logger] - Logger instance
     * @param{Function} callback - the callback handling the array of objects
     * and the error, if there is one
     * @returns{undefined}
     */
    getUsersById(userIds, options, callback) {
        assert(Array.isArray(userIds), 'userIds must be an array');
        userIds.every(item => assert(typeof item === 'string'),
            'each entry in userIds must be a string');
        const data = {
            Action: 'GetUsersById',
            userIds,
        };
        this.request('GET', '/', false, (err, data, code) => {
            if (err) {
                return callback(err);
            }
            return callback(null, {
                message: {
                    body: data,
                    code,
                    message: 'Attributes retrieved',
                },
            });
        }, data, options.reqUid, null, options.logger);
    }

    healthcheck(reqUid, callback) {
        this.request('GET', '/_/healthcheck', false, callback, null,
            reqUid, null);
    }

    /* eslint-disable no-param-reassign */
    async _signRequest(iamAuthenticate, req, options, path) {
        if (iamAuthenticate) {
            options.headers = {
                Host: this._host || options.host,
            };
            if (this._host && this.__path) {
                options.path = this.__path;
                options.host = this._host;
            }
            const signer = new SignatureV4({
                credentials: {
                    accessKeyId: this.accessKey,
                    secretAccessKey: this.secretKeyValue,
                    sessionToken: this.sessionToken,
                },
                region: 'us-east-1',
                service: 'iam',
                sha256: Sha256,
                host: this._host ? this._host : options.host,
            });
            const signedReq = await signer.sign(options);
            Object.keys(signedReq.headers).forEach(key => {
                req.setHeader(key, signedReq.headers[key]);
            });
            if (this._host && this.__path) {
                req._headers.host = {
                    name: 'host',
                    value: options.host,
                };
                options.path = this._path || path;
            }
        }
    }
    /* eslint-enable no-param-reassign */

    /**
     * @param {string} method - CRUD method chosen for the request
     * @param {string} path - RESTful URL for the request
     * @param {boolean} iamAuthenticate - whether to add iam authentication
     * headers to request
     * @param {VaultClient~requestCallback} callback - callback
     * @param {object} data - object containing data to be sent through the req
     *                        (while metadata is sent in the URL); data may or
     *                        may not be present depending on the type of
     *                        request
     * @param {string} [reqUid] - Request logger uid, to trace request
     * @param {string} [contentType] - content type of body
     * @returns {undefined}
     */
    request(method, path, iamAuthenticate, callback, data, reqUid,
        contentType) {
        const log = reqUid
            ? this.log.newRequestLoggerFromSerializedUids(reqUid)
            : this.log.newRequestLogger();
        const options = {
            method,
            path: this._path || path,
            host: this.serverHost,
            hostname: this.serverHost,
            port: this.serverPort,
            agent: this._agent,
        };

        if (this._key && this._cert) {
            options.key = this._key;
            options.cert = this._cert;
        }
        if (reqUid) {
            options.headers = {
                'x-scal-request-uids': reqUid,
            };
        }
        let ret = '';
        if (method === 'GET') {
            options.path += `?${queryString.stringify(data)}`;
        }
        const req = this.useHttps
            ? https.request(options) : http.request(options);

        // request events
        req.on('response', res => {
            // response events
            res.on('data', receivedData => {
                ret += receivedData.toString();
            })
                .on('error', err => {
                    log.debug('error receiving data', {
                        component: 'vaultclient',
                        method: 'VaultClient:request()',
                        error: err.message,
                        errorStack: err.stack,
                    });
                    return callback(InternalError);
                })
                .on('end', () => {
                    this.handleResponse(res, ret, log, callback);
                });
        });
        req.on('error', err => {
            log.debug('error during request', {
                component: 'vaultclient',
                method: 'VaultClient:request()',
                error: err.message,
                errorStack: err.stack,
            });
            return callback(InternalError);
        });

        this._signRequest(iamAuthenticate, req, options, path)
            .catch(() => callback(InternalError))
            .then(() => {
                if (method === 'POST') {
                    if (contentType === 'application/json') {
                        req.setHeader('Content-Type', contentType);
                        req.write(JSON.stringify(data));
                    } else {
                        req.write(queryString.stringify(data));
                    }
                }
                req.end();
            });
    }

    /**
     * This function will parse the json result
     *
     * @param {string} ret - Result from request
     * @return {object|Error} Object parse or the error
     */
    // eslint-disable-next-line class-methods-use-this
    parseObj(ret) {
        let obj = null;
        let err = null;
        try {
            obj = JSON.parse(ret);
        } catch (error) {
            err = error;
        }
        return err || obj;
    }

    /**
     * This function will return an object from the request result
     *
     * @param {string} ret - Result from request
     * @param {function} cb - Callback(err, obj)
     * @return {undefined}
     */
    getObj(ret, cb) {
        if (ret.length === 0) {
            return cb(null, {});
        }
        if (ret[0] !== '{' && ret[0] !== '[') {
            return parseString(ret, {
                explicitArray: false,
            }, (err, result) => {
                if (err) {
                    return cb(err);
                }
                return cb(null, result);
            });
        }
        const result = this.parseObj(ret);
        return (result instanceof Error) ? cb(result) : cb(null, result);
    }

    /**
     * @param {object} res - response to the request
     * @param {string} ret - content (data and/or metadata) returned after the
     *                       request has been processed
     * @param {object} log - werelogs request logger
     * @param {VaultClient~requestCallback} cb - callback
     * @returns {undefined}
     */
    handleResponse(res, ret, log, cb) {
        this.getObj(ret, (err, obj) => {
            if (err) {
                log.error('error from vault', {
                    error: err,
                    method: 'VaultClient.handleResponse',
                });
                return cb(err, null, res.statusCode);
            }
            /* This is not an error */
            if (res.statusCode < 400) {
                return cb(null, obj, res.statusCode, res.statusMessage);
            }

            // Load the error from errors(arsenal)
            if (obj && obj.ErrorResponse && obj.ErrorResponse.Error) {
                log.debug('error from vault', {
                    error: obj,
                    method: 'VaultClient.handleResponse',
                });
                return cb({
                        code: obj.ErrorResponse.Error.Code,
                        description: obj.ErrorResponse.Error.Message,
                    },
                    null,
                    res.statusCode
                );
            }
            if (obj && obj.InternalError) {
                return cb(InternalError, null, res.statusCode);
            }
            log.error('unable to translate error from vault', {
                error: obj,
                method: 'VaultClient.handleResponse',
            });
            return cb(InternalError);
        });
    }
}

module.exports = VaultClient;
