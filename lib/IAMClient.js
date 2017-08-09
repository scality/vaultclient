'use strict'; // eslint-disable-line

const errors = require('arsenal').errors;
const auth = require('arsenal').auth;
const assert = require('assert');
const werelogs = require('werelogs');
const http = require('http');
const https = require('https');
const parseString = require('xml2js').parseString;
const queryString = require('querystring');

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
     * @param {Werelogs.API} [logApi] - object providing a constructor function
     *                                  for the Logger object
     * @param {string} [path] - prefix requests with this path
     */
    constructor(host, port, useHttps, key, cert, ca, ignoreCa,
                accessKey, secretKeyValue, logApi, path) {
        assert(typeof host === 'string' && host !== '', 'host is required');
        assert(port === undefined || typeof port === 'number',
               'port must be a number');
        assert(key === undefined || typeof key === 'string',
                'key must be a string');
        assert(cert === undefined || typeof cert === 'string',
                'cert must be a string');
        assert(ca === undefined || typeof ca === 'string',
                'ca must be a string');
        assert(path === undefined ||
            (typeof path === 'string' && path.startsWith('/')),
            'path must be a string and start with a "/"');
        this.serverHost = host;
        this.serverPort = port || 8600;
        this._key = key;
        this._cert = cert;
        this._ca = ca;
        this.useHttps = (useHttps === true);
        if (this.useHttps) {
            this._agent = new https.Agent({
                ca: ca ? [ca] : undefined,
                keepAlive: true,
                requestCert: true,
                rejectUnauthorized: !(ignoreCa === true),
            });
        } else {
            this._agent = new http.Agent({
                keepAlive: true,
            });
        }
        this.accessKey = accessKey;
        this.secretKeyValue = secretKeyValue;
        this.logApi = logApi || werelogs;
        this.log = new this.logApi.Logger('VaultClient');
        this._path = path;
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
     * @param {string} options.password - account password
     * @param {VaultClient~requestCallback} callback - callback
     * @returns {undefined}
     */
    createAccount(accountName, options, callback) {
        assert(typeof accountName === 'string' && accountName !== '',
               'accountName is required');
        assert(typeof options.email === 'string' && options.email !== '',
               'options.email is required');

        this.request('POST', '/', true, (err, result) => {
            if (err) {
                return callback(err);
            }
            return callback(null, {
                account: result.account.data,
            });
        }, {
            Action: 'CreateAccount',
            Version: '2010-05-08',
            name: accountName,
            emailAddress: options.email,
        });
    }

    /**
     * Generate a new access key for the account
     *
     * @param {string} accountName - account name
     * @param {VaultClient~requestCallback} callback - callback
     * @returns {undefined}
     */
    generateAccountAccessKey(accountName, callback) {
        assert(typeof accountName === 'string' && accountName !== '',
               'accountName is required');

        this.request('POST', '/', true, (err, result) => {
            if (err) {
                return callback(err);
            }
            return callback(null, result.data);
        }, {
            Action: 'GenerateAccountAccessKey',
            Version: '2010-05-08',
            AccountName: accountName,
        });
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
        if (typeof options.marker !== 'undefined') {
            const marker = options.marker;
            assert.notStrictEqual(isNaN(marker) || marker === '', true,
                'Marker must be a number');
            assert(Number(marker) >= 0, 'Marker must be >= 0');
            data.Marker = marker;
        }
        if (typeof options.maxItems !== 'undefined') {
            assert.strictEqual(typeof options.maxItems, 'number',
                'maxItems need to be a number');
            assert.notStrictEqual(isNaN(options.maxItems), true,
                'maxItems must be a number');
            assert(options.maxItems > 0 && options.maxItems <= 1000,
                'maxItems need to be a value between 1 and 1000 included');
            data.MaxItems = options.maxItems;
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
     * @param {string} region - the region where the user wants authentication
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
        assert(typeof region === 'string' && region !== '',
               'region is required');
        assert(typeof scopeDate === 'string' && scopeDate !== '',
               'scopeDate is required');
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
        assert(typeof requestContextParams === 'object',
            'need requestContextParams');
        assert(typeof requestContextParams.constantParams === 'object',
            'need constantParams');
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

    healthcheck(reqUid, callback) {
        this.request('GET', '/_/healthcheck', false, callback, null,
            reqUid, null);
    }

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
        const log = reqUid ?
            this.log.newRequestLoggerFromSerializedUids(reqUid) :
            this.log.newRequestLogger();
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
        const req = this.useHttps ?
            https.request(options) : http.request(options);
        if (iamAuthenticate) {
            auth.client.generateV4Headers(req, data,
                    this.accessKey, this.secretKeyValue, 'iam');
        }
        if (method === 'POST') {
            if (contentType === 'application/json') {
                req.setHeader('Content-Type', contentType);
                req.write(JSON.stringify(data));
            } else {
                req.write(queryString.stringify(data));
            }
        }

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
                return callback(errors.InternalError);
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
            return callback(errors.InternalError);
        });
        req.end();
    }

    /**
     * This function will parse the json result
     *
     * @param {string} ret - Result from request
     * @return {object|Error} Object parse or the error
     */
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
     * @param {VaultClient~requestCallback} callback - callback
     * @returns {undefined}
     */
    handleResponse(res, ret, log, callback) {
        this.getObj(ret, (err, obj) => {
            if (err) {
                log.error('error from vault', {
                    error: err,
                    method: 'VaultClient.handleResponse',
                });
                return callback(err, null, res.statusCode);
            }
            /* This is not an error */
            if (res.statusCode < 400) {
                return callback(null, obj, res.statusCode, res.statusMessage);
            }

            // Load the error from errors(arsenal)
            if (obj && obj.ErrorResponse && obj.ErrorResponse.Error) {
                log.debug('error from vault', {
                    error: obj,
                    method: 'VaultClient.handleResponse',
                });
                return callback(
                    errors[obj.ErrorResponse.Error.Code], null, res.statusCode);
            }
            if (obj && obj.InternalError) {
                return callback(errors.InternalError, null, res.statusCode);
            }
            log.error('unable to translate error from vault', {
                error: obj,
                method: 'VaultClient.handleResponse',
            });
            return callback(errors.InternalError
                .customizeDescription('unable to translate error from vault'));
        });
    }
}

module.exports = VaultClient;
