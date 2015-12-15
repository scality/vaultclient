import http from 'http';

const ip = '127.0.0.1';
const port = '8500';

/** @constant
 *   @type {Object} - path for every command
 * The path will contain variable content in future routes, ex:
 * 'create-access-key': (data) => `/accessKey/${data.accountId}`
 */
const pathForRequests = {
    'authenticate-v2': () => '/auth/v2/',
    'create-account': () => '/account',
    'create-user': () => '/user',
    'create-access-key': () => '/accessKey',
    'delete-account': (metadata) => `/account/${metadata.name}`,
};

export default class IAMClient {

    /**
     *  @returns {String} - returns ip string
     */
    getIp() {
        return ip;
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
     * @param {String} command - command that initiates the request
     * @param {Object} data - data sent as headers
     * @param {Object} metadata - metadata needed to send request
     * @param {Function} callback - callback of the request
     * @returns {void}
     */
    get(command, data, metadata, callback) {
        const path = pathForRequests[command](metadata);
        this.request('GET', path, callback, {additionaldata: data});
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
            host: ip,
            port,
        };
        let ret = '';
        const req = http.request(options);

        if (method === 'POST' && typeof data === 'object') {
            req.write(JSON.stringify(data));
        } else if (method === 'GET' && typeof data === 'object') {
            Object.keys(data).forEach(key => {
                req.setHeader(key, JSON.stringify(data[key]));
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
                console.log('error: ', e);
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
