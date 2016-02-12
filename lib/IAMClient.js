'use strict'; // eslint-disable-line

const assert = require('assert');
const http = require('http');

const requestUidKey = 'x-scal-request-uids';

class IAMClient {
    /**
     * @param {string} host - hostname or IP of the Vault server
     * @param {number} [port=8500] - port of the Vault server
     * @returns {IAMClient}
     */
    constructor(host, port) {
        assert(typeof host === 'string' && host !== '', 'host is required');
        assert(port === undefined || typeof port === 'number',
               'port must be a number');

        this.serverHost = host;
        this.serverPort = port || 8500;
        this.keepAlive = new http.Agent({ keepAlive: true });
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

        this.request('DELETE', `/account/${accountName}`, callback);
    }

    /**
     * Create an user
     *
     * @param {string} accountName - account associated with the user
     * @param {string} userName - user name
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

        this.request('DELETE', `/account/${accountName}/user/${userName}`,
                     callback);
    }

    /**
     * Create an access key
     *
     * @param {string} accountName - account associated with the access key
     * @param {string} [userName] - user associated with the access key
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
        data[requestUidKey] = options.reqUid;
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
            port: this.serverPort,
            agent: this.keepAlive,
        };
        let ret = '';
        const req = http.request(options);

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
        req.on('response', (res) => {
            // response events
            res.on('data', (receivedData) => {
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
                callback(err);
            }
        } else if (res.statusCode === 204) {
            obj = { message: { code: 204, message: 'No content.' } };
        }

        /* This is not an error */
        if (res.statusCode < 400) {
            return callback(null, obj);
        }

        /* This is an error */
        const err = new Error();

        // The message, code and body are inherited from the JSON response,
        // so the actual Error object has a valid message and code.
        Object.keys(obj.message).forEach(prop => {
            err[prop] = obj.message[prop];
        });

        callback(err);
    }
}

module.exports = IAMClient;
