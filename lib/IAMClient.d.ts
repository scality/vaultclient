export = VaultClient;
declare class VaultClient {
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
     * @param {string} [sessionToken] - session token for v4 signature
     */
    constructor(host: string, port?: number, useHttps?: boolean, key?: string, cert?: string, ca?: string, ignoreCa?: boolean, accessKey?: string, secretKeyValue?: string, logApi?: Werelogs.API, path?: string, sessionToken?: string);
    serverHost: string;
    serverPort: number;
    _key: string;
    _cert: string;
    _ca: string;
    useHttps: boolean;
    _agent: HttpAgent.Agent | HttpsAgent.Agent;
    accessKey: string;
    secretKeyValue: string;
    sessionToken: string;
    logApi: any;
    log: any;
    _path: string;
    useAuthenticatedAdminRoutes: boolean;
    enableIAMOnAdminRoutes(): VaultClient;
    /**
     * Set the configuration for the werelogs logger
     * @param {object} config - A configuration object for werelogs
     * @returns {undefined}
     */
    setLoggerConfig(config: object): undefined;
    getServerHost(): string;
    getServerPort(): number;
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
    createAccount(accountName: string, options: {
        email: string;
        quota?: string;
    }, callback: any): undefined;
    /**
     * Create a password for an account
     *
     * @param {string} accountName - account name
     * @param {string} password - account password
     * @param {VaultClient~requestCallback} callback - callback
     * @returns {undefined}
     */
    generateAccountPassword(accountName: string, password: string, callback: any): undefined;
    /**
     * Generate a new access key for the account
     *
     * @param {string} accountName - account name
     * @param {VaultClient~requestCallback} callback - callback
     * @param {object} options - additional creation params
     * @returns {undefined}
     */
    generateAccountAccessKey(accountName: string, callback: any, options: object): undefined;
    /**
     * Delete an account
     *
     * @param {string} accountName - account name
     * @param {VaultClient~requestCallback} callback - callback
     * @returns {undefined}
     */
    deleteAccount(accountName: string, callback: any): undefined;
    /**
     * Update Quota of an account
     *
     * @param {string} accountName - account name
     * @param {integer} quota - maximum quota for the account
     * @param {VaultClient~requestCallback} callback - callback
     * @returns {undefined}
     */
    updateAccountQuota(accountName: string, quota: integer, callback: any): undefined;
    /**
     * Delete Quota of an account
     *
     * @param {string} accountName - account name
     * @param {VaultClient~requestCallback} callback - callback
     * @returns {undefined}
     */
    deleteAccountQuota(accountName: string, callback: any): undefined;
    /**
     * Update account custom attributes
     *
     * @param {string} name - account name
     * @param {object} customAttributes - custom attributes
     * @param {VaultClient~requestCallback} callback - callback
     * @returns {undefined}
     */
    updateAccountAttributes(name: string, customAttributes: object, callback: any): undefined;
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
    addAccountAttribute(reqParams: {
        accountName?: string;
        accountId?: string;
        arn?: string;
        canonicalId?: string;
        key?: string;
        value?: string;
    }, callback: Function): undefined;
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
    deleteAccountAttribute(reqParams: {
        accountName?: string;
        accountId?: string;
        arn?: string;
        canonicalId?: string;
        key?: string;
    }, callback: Function): undefined;
    /**
     * Get accounts using account ids, canonical ids or email addresses
     *
     * @param {array|undefined} accountIds - Account ids, exclusive with
     *  emailAddresses and canonicalIds
     * @param {array|undefined} emailAddresses - Email addresses, exclusive
     *  with account ids and canonicalIds
     * @param {array|undefined} canonicalIds - Canonical ids, exclusive with
     *  account ids and emailAddresses
     * @param {object} options - Options
     * @param {string} [options.reqUid] - Request uid
     * @param {function} callback - Callback(err, result)
     * @return {undefined}
     */
    getAccounts(accountIds: any[] | undefined, emailAddresses: any[] | undefined, canonicalIds: any[] | undefined, options: {
        reqUid?: string;
    }, callback: Function): undefined;
    /**
     * List accounts
     *
     * @param {object} options - Additional search params
     * @param {string} [options.marker] - Marker for pagination
     * @param {number} [options.maxItems] - Max items for pagination
     * @param {function} callback - callback
     * @return {undefined}
     */
    listAccounts(options: {
        marker?: string;
        maxItems?: number;
    }, callback: Function): undefined;
    /**
     * Get account
     *
     * @param {object} options - Additional search params
     * @param {string} [options.name] - Account Name
     * @param {string} [options.accountId] - Account ID
     * @param {string} [options.canonicalId] - Canonical ID
     * @param {string} [options.emailAddress] - E-mail Address
     * @param {function} callback - callback
     * @return {undefined}
     */
    getAccount(options: {
        name?: string;
        accountId?: string;
        canonicalId?: string;
        emailAddress?: string;
    }, callback: Function): undefined;
    assumeRoleBackbeat(roleArn: any, roleSessionName: any, options: any, callback: any): void;
    getRolesForWebIdentity(webIdentityToken: any, options: any, callback: any): void;
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
    verifySignatureV2(string: string, signature: string, accessKey: string, options: {
        algo?: string;
        reqUid?: string;
        requestContext?: string;
        securityToken?: string;
    }, callback: any): undefined;
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
    verifySignatureV4(stringToSign: string, signature: string, accessKey: string, region?: string, scopeDate: string, options: {
        reqUid?: string;
        requestContext?: string;
        securityToken?: string;
    }, callback: any): undefined;
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
    getEmailAddresses(canonicalIds: string[], options: {
        reqUid: string;
    }, callback: Function): undefined;
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
    getCanonicalIds(emailAddresses: string[], options: {
        reqUid: string;
    }, callback: Function): undefined;
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
    getCanonicalIdsByAccountIds(accountIds: string[], options: {
        reqUid: string;
        logger?: werelogs.RequestLogger;
    }, callback: Function): undefined;
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
    getAccountIds(canonicalIds: string[], options: {
        reqUid: string;
        logger?: werelogs.RequestLogger;
    }, callback: Function): undefined;
    /**
     * Get policy evaluation (without authentication first)
     * @param {Object} requestContextParams - parameters needed to construct
     * requestContext in Vault, can be an array of request contexts
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
    checkPolicies(requestContextParams: {
        constantParams: any;
        paramaterize?: any;
    }, userArn: string, options: {
        reqUid: string;
    }, callback: Function): undefined;
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
    getUsersById(userIds: string[], options: {
        reqUid: string;
        logger?: werelogs.RequestLogger;
    }, callback: Function): undefined;
    healthcheck(reqUid: any, callback: any): void;
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
    request(method: string, path: string, iamAuthenticate: boolean, callback: any, data: object, reqUid?: string, contentType?: string): undefined;
    /**
     * This function will parse the json result
     *
     * @param {string} ret - Result from request
     * @return {object|Error} Object parse or the error
     */
    parseObj(ret: string): object | Error;
    /**
     * This function will return an object from the request result
     *
     * @param {string} ret - Result from request
     * @param {function} cb - Callback(err, obj)
     * @return {undefined}
     */
    getObj(ret: string, cb: Function): undefined;
    /**
     * @param {object} res - response to the request
     * @param {string} ret - content (data and/or metadata) returned after the
     *                       request has been processed
     * @param {object} log - werelogs request logger
     * @param {VaultClient~requestCallback} cb - callback
     * @returns {undefined}
     */
    handleResponse(res: object, ret: string, log: object, cb: any): undefined;
}
import { http as HttpAgent } from "httpagent";
import { https as HttpsAgent } from "httpagent";
//# sourceMappingURL=IAMClient.d.ts.map