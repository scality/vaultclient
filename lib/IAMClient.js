import http from 'http';

const ip = '127.0.0.1';
const port = '8500';

/** @constant
 *   @type {Object} - path for every command
 * The path will contain variable content in future routes, ex:
 * 'create-access-key': (data) => `/accessKey/${data.accountId}`
 */
const pathForRequests = {
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
}
