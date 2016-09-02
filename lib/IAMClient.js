'use strict'; // eslint-disable-line

const errors = require('arsenal').errors;
const auth = require('arsenal').auth;
const assert = require('assert');
const http = require('http');
const https = require('https');
const requestUidKey = 'x-scal-request-uids';

class IAMClient {
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
     */
    constructor(host, port, useHttps, key, cert, ca, ignoreCa,
                accessKey, secretKeyValue) {
        assert(typeof host === 'string' && host !== '', 'host is required');
        assert(port === undefined || typeof port === 'number',
               'port must be a number');
        assert(key === undefined || typeof key === 'string',
                'key must be a string');
        assert(cert === undefined || typeof cert === 'string',
                'cert must be a string');
        assert(ca === undefined || typeof ca === 'string',
                'ca must be a string');
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
    }

    getServerHost() {
        return this.serverHost;
    }

    getServerPort() {
        return this.serverPort;
    }

    /**
     * @callback IAMClient~requestCallback
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
     * @param {IAMClient~requestCallback} callback - callback
     * @returns {undefined}
     */
    createAccount(accountName, options, callback) {
        assert(typeof accountName === 'string' && accountName !== '',
               'accountName is required');
        assert(typeof options.email === 'string' && options.email !== '',
               'options.email is required');
        assert(typeof options.password === 'string' && options.password !== '',
               'options.password is required');

        this.request('POST', '/account', callback, {
            name: accountName,
            emailAddress: options.email,
            saltedPwd: options.password,
        });
    }

    /**
     * Delete an account
     *
     * @param {string} accountName - account name
     * @param {IAMClient~requestCallback} callback - callback
     * @returns {undefined}
     */
    deleteAccount(accountName, callback) {
        assert(typeof accountName === 'string' && accountName !== '',
               'accountName is required');

        const encodedAccountName = encodeURIComponent(accountName);
        this.request('DELETE', `/account/${encodedAccountName}`, callback);
    }

    /**
     * List users of an account
     *
     * @param {string} accountName - Account name
     * @param {object} options - additional search params
     * @param {string} [options.marker] - Marker for pagination of search
     * @param {number} [options.maxItems] - Max items for pagination
     * @param {string} [options.pathPrefix] - Path prefix for arn search
     * @param {function} callback - callback
     * @return {undefined}
     */
    listAccountUsers(accountName, options, callback) {
        assert(typeof accountName === 'string' && accountName !== '',
                'accountName is required');
        const data = {
            name: accountName,
        };
        if (typeof options.marker !== 'undefined') {
            assert.strictEqual(typeof options.marker, 'string',
                'marker need to be a string');
            assert.notStrictEqual(options.marker, '',
                'Marker cannot be empty');
            data.marker = options.marker;
        }
        if (typeof options.maxItems !== 'undefined') {
            assert.strictEqual(typeof options.maxItems, 'string',
                'maxItems need to be a string');
            const maxItems = parseInt(options.maxItems, 10);
            assert.strictEqual(isNaN(maxItems), false,
                'maxItems is not a number');
            assert(maxItems > 0 && maxItems <= 1000,
                'maxItems need to be a value between 1 and 1000 included');
            data.maxItems = maxItems;
        }
        if (typeof options.pathPrefix !== 'undefined') {
            assert.strictEqual(typeof options.pathPrefix, 'string',
                'pathPrefix need to be a string');
            assert.strictEqual(options.pathPrefix.indexOf('/'), 0,
                'pathPrefix cannot be empty and need start with \'/\'');
            data.pathPrefix = options.pathPrefix;
        }
        this.request('GET', '/users', callback, {
            additionaldata: data,
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
        if (typeof options.marker !== 'undefined') {
            const marker = parseInt(options.marker, 10);
            assert.notStrictEqual(isNaN(marker), true,
                'Marker must be a number');
            assert(marker >= 0, 'Marker must be >= 0');
        }
        if (typeof options.maxItems !== 'undefined') {
            assert.strictEqual(typeof options.maxItems, 'number',
                'maxItems need to be a number');
            assert.notStrictEqual(isNaN(options.maxItems), true,
                'maxItems must be a number');
            assert(options.maxItems > 0 && options.maxItems <= 1000,
                'maxItems need to be a value between 1 and 1000 included');
        }
        this.request('GET', '/accounts', callback, { additionaldata: options });
    }

    /**
     * Create an user
     *
     * @param {string} accountName - account associated with the user
     * @param {string} userName - user name
     * @param {object} options - additional creation params
     * @param {string} options.email - user email
     * @param {string} options.password - user password
     * @param {IAMClient~requestCallback} callback - callback
     * @returns {undefined}
     */
    createUser(accountName, userName, options, callback) {
        assert(typeof accountName === 'string' && accountName !== '',
               'accountName is required');
        assert(typeof userName === 'string' && userName !== '',
               'userName is required');
        assert(typeof options.email === 'string' && options.email !== '',
               'options.email is required');

        this.request('POST', '/user', callback, {
            accountName,
            name: userName,
            emailAddress: options.email,
            saltedPasswd: options.password,
        });
    }

    /**
     * Delete an user
     *
     * @param {string} accountName - account associated with the user
     * @param {string} userName - user name
     * @param {IAMClient~requestCallback} callback - callback
     * @returns {undefined}
     */
    deleteUser(accountName, userName, callback) {
        assert(typeof accountName === 'string' && accountName !== '',
               'accountName is required');
        assert(typeof userName === 'string' && userName !== '',
               'userName is required');

        const encodedAccountName = encodeURIComponent(accountName);
        const encodedUserName = encodeURIComponent(userName);
        this.request('DELETE',
                     `/account/${encodedAccountName}/user/${encodedUserName}`,
                     callback);
    }

    /**
     * Create an access key
     *
     * @param {string} accountName - account associated with the access key
     * @param {string} [userName] - user associated with the access key
     * @param {object} options - additional creation params (none for now)
     * @param {IAMClient~requestCallback} callback - callback
     * @returns {undefined}
     */
    createAccessKey(accountName, userName, options, callback) {
        assert(typeof accountName === 'string' && accountName !== '',
               'accountName is required');
        assert(userName === undefined
               || (typeof userName === 'string' && userName !== ''),
               'if provided, userName must be a string');

        this.request('POST', '/accessKey', callback, {
            accountName,
            userName,
        });
    }

    /**
     * List access keys of an account or an user
     *
     * @param {string} accountName - Account name
     * @param {object} options - Additional fields
     * @param {string} [options.userName] - User name
     * @param {number} [options.marker] - Marker for pagination
     * @param {number} [options.maxItems] - Max items wanted as result
     * @param {IAMClient~requestCallback} callback - callback
     * @return {undefined}
     */
    listAccessKeys(accountName, options, callback) {
        const data = {
            accountName,
        };
        assert.strictEqual(typeof accountName, 'string',
            'accountName must be a string');
        if (typeof options.userName !== 'undefined') {
            assert.strictEqual(typeof options.userName, 'string',
                'userName must be a string');
            data.name = options.userName;
        }
        if (typeof options.marker !== 'undefined') {
            const marker = parseInt(options.marker, 10);
            assert.notStrictEqual(isNaN(marker), true,
                'marker need to be a number');
            assert(marker >= 0, 'marker must be >= 0');
            data.marker = marker.toString();
        }
        if (typeof options.maxItems !== 'undefined') {
            assert.strictEqual(typeof options.maxItems, 'number',
                'maxItems need to be a number');
            assert(options.maxItems > 0 && options.maxItems <= 1000,
                'maxItems need to be a value between 1 and 1000 included');
            data.maxItems = options.maxItems;
        }
        this.request('GET', '/accessKeys', callback, {
            additionalData: data,
        });
    }

    /**
     * Delete an access key
     *
     * @param {string} accessKeyId - access key identifier
     * @param {IAMClient~requestCallback} callback - callback
     * @returns {undefined}
     */
    deleteAccessKey(accessKeyId, callback) {
        assert(typeof accessKeyId === 'string' && accessKeyId !== '',
               'accessKeyId is required');

        this.request('DELETE', `/accessKey/${accessKeyId}`, callback);
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
     * @param {IAMClient~requestCallback} callback - callback
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

        const data = { additionaldata: { stringToSign: string,
                                         signatureFromRequest: signature,
                                         hashAlgorithm: algo,
                                         accessKey } };
        if (options.reqUid !== undefined) {
            data[requestUidKey] = options.reqUid;
        }
        this.request('GET', '/auth/v2', callback, data);
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
     * @param {IAMClient~requestCallback} callback - callback
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
        const data = { additionaldata: { stringToSign,
                                         signatureFromRequest: signature,
                                         accessKey,
                                         region,
                                         scopeDate } };
        if (options.reqUid !== undefined) {
            data[requestUidKey] = options.reqUid;
        }
        this.request('GET', '/auth/v4', callback, data);
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
        const data = { additionaldata: { canonicalIds } };
        if (options.reqUid !== undefined) {
            data[requestUidKey] = options.reqUid;
        }
        this.request('GET', '/acl/emailAddresses', callback, data);
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
        const data = { additionaldata: { emailAddresses } };
        if (options.reqUid !== undefined) {
            data[requestUidKey] = options.reqUid;
        }
        this.request('GET', '/acl/canonicalIds', callback, data);
    }

    /**
     * @param {string} method - CRUD method chosen for the request
     * @param {string} path - RESTful URL for the request
     * @param {IAMClient~requestCallback} callback - callback
     * @param {object} data - object containing data to be sent through the req
     *                        (while metadata is sent in the URL); data may or
     *                        may not be present depending on the type of
     *                        request
     * @returns {undefined}
     */
    request(method, path, callback, data) {
        const options = {
            method,
            path,
            host: this.serverHost,
            hostname: this.serverHost,
            port: this.serverPort,
            agent: this._agent,
        };

        if (this._key && this._cert) {
            options.key = this._key;
            options.cert = this._cert;
        }

        let ret = '';
        const req = this.useHttps ?
            https.request(options) : http.request(options);

        if (!path.startsWith('/acl/') && !path.startsWith('/auth/')) {
            auth.generateV4Headers(req, JSON.stringify(data),
                                   this.accessKey, this.secretKeyValue);
        }

        if (method === 'POST' && typeof data === 'object') {
            req.write(JSON.stringify(data));
        } else if (method === 'GET' && typeof data === 'object') {
            Object.keys(data).forEach(key => {
                let value = data[key];
                if (typeof value === 'object') {
                    value = JSON.stringify(value);
                }
                req.setHeader(key, value);
            });
        }


        // request events
        req.on('response', res => {
            // response events
            res.on('data', receivedData => {
                ret += receivedData.toString();
            })

            .on('error', callback)

            .on('end', () => {
                this.handleResponse(res, ret, callback);
            });
        });
        req.on('error', callback);
        req.end();
    }

    /**
     * @param {object} res - response to the request
     * @param {string} ret - content (data and/or metadata) returned after the
     *                       request has been processed
     * @param {IAMClient~requestCallback} callback - callback
     * @returns {undefined}
     */
    handleResponse(res, ret, callback) {
        let obj = {};
        if (ret !== '') {
            try {
                obj = JSON.parse(ret);
            } catch (error) {
                const err = new Error(`cannot decode vault response: ${error}`);
                err.raw = ret;
                return callback(err);
            }
        } else if (res.statusCode === 204) {
            obj = { message: { code: 204, message: 'No content.' } };
        }
        /* This is not an error */
        if (res.statusCode < 400) {
            return callback(null, obj);
        }

        /* This is an error */
        let err;

        // Load the error from errors(arsenal)
        Object.keys(obj.message).forEach(prop => {
            if (obj.message[prop] === true) {
                err = errors[prop];
            }
        });

        callback(err);
    }
}

module.exports = IAMClient;
