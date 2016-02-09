'use strict'; // eslint-disable-line

const http = require('http');

/** @constant
 *   @type {Object} - path for every command
 * The path will contain variable content in future routes, ex:
 * 'create-access-key': (data) => `/accessKey/${data.accountId}`
 */
const pathForRequests = {
    'authenticate-v2': () => '/auth/v2',
    'create-account': () => '/account',
    'create-user': () => '/user',
    'create-access-key': () => '/accessKey',
    'delete-account': (metadata) => `/account/${metadata.name}`,
    'delete-user': (metadata) =>
        `/account/${metadata.accountName}/user/${metadata.userName}`,
    'delete-access-key': (metadata) => `/accessKey/${metadata.id}`,
};

const requestUidKey = 'x-scal-request-uids';

class IAMClient {
    /**
     * @param{object} server - hostname/port of the Vault server
     * @param{string} server.host - hostname or ip of the Vault server
     * @param{string} server.port - port of the Vault server
     * @returns {undefined}
     */
    constructor(server) {
        if (server) {
            this.serverHost = server.host;
            this.serverPort = server.port;
        } else {
            this.serverHost = 'localhost';
            this.serverPort = '8500';
        }
    }

    getServerHost() {
        return this.serverHost;
    }

    getServerPort() {
        return this.serverPort;
    }

    /**
     *  @param {String} command - command that initiates the request
     *  @param {Object} data - parameters needed to send request
     *  @param {Object} metadata - metadata needed to send request
     *  @param {Function} callback - callback of the request
     *  @returns {void}
     */
    create(command, data, metadata, callback) {
        const path = pathForRequests[command](metadata);
        this.request('POST', path, callback, data);
    }

    /**
     * @param {String} command - command that initiates the request
     * @param {Object} data - data sent as headers
     * @param {Object} metadata - metadata needed to send request
     * @param {Function} callback - callback of the request
     * @returns {void}
     */
    get(command, data, metadata, callback) {
        const path = pathForRequests[command](metadata);

        const finalData = { additionaldata: data };
        if (data[requestUidKey] !== undefined) {
            finalData[requestUidKey] = data[requestUidKey];
            delete data[requestUidKey];
        }

        this.request('GET', path, callback, finalData);
    }

    /**
     *  @param {String} command - command that initiates the request
     *  @param {Object} data - data needed to send request
     *  @param {Object} metadata - metadata needed to send request
     *  @param {Function} callback - callback of the request
     *  @returns {void}
     */
    delete(command, data, metadata, callback) {
        const path = pathForRequests[command](metadata);
        this.request('DELETE', path, callback, data);
    }

    /**
     *  @param {String} method - CRUD method chosen for the request
     *  @param {String} path - RESTful URL for the request
     *  @param {Function} callback - callback of the request
     *  @param {Object} data - object containing data to be sent through the req
     *  (while metadata is sent in the URL); data may or may not be present
     *  depending on the type of request
     *  @returns {void}
     */
    request(method, path, callback, data) {
        const options = {
            method,
            path,
            host: this.serverHost,
            port: this.serverPort,
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
                this.endResponse(res, ret, callback);
            });
        });
        req.on('error', callback);
        req.end();
    }

    /**
     *  @param {Object} res - response to the request
     *  @param {String} ret - content (data and/or metadata) returned after the
     *  request has been processed
     *  @param {Function} callback - callback contains a stringified version of
     *  ret upon success, or an error upon failure
     *  @returns {void}
     */
    endResponse(res, ret, callback) {
        const code = res.statusCode;
        if (code === 204) {
            callback(null,
                JSON.stringify({message: {code: 204, message: 'No content.'}}));
        } else if (code <= 206) {
            callback(null, ret);
        } else {
            try {
                callback(ret);
            } catch (e) {
                callback(e);
            }
        }
    }

    /**
     * A simple wrapper for signature verification
     * @param{Object} dict - dictionary containing all required arguments:
     * @param{String} dict.stringToSign - string to sign as built from the
     *  request
     * @param{String} dict.signatureFromRequest - the user-computed signature as
     *  provided by the request, base64-encoded
     * @param{String} dict.hashAlgorithm - either 'sha1' 'sha256'
     * @param{String} dict.accessKey - the id of the secret key as provided by
     *  the request
     * @param{Function} callback - accepts (err, response), where:
     *  -error can be null, 401, 403, 404, 500 (see lib/ErrorCodes)
     *  -response.message includes one of the two:
     *   -{arn, canonicalID, shortid, email, accountDisplayName} if the key is
     *    owned by an account; all values refer to the account
     *   -{arn, canonicalID, shortid, email, accountDisplayName, IAMdisplayName}
     *    if the key is owned by a user; canonicalID and accountDisplayName
     *    refer to the user's parent account, while the rest refer to the user
     * @returns{undefined}
     */
    verifySignatureV2(dict, callback) {
        this.get('authenticate-v2', dict, '', callback);
    }

}

module.exports = IAMClient;
