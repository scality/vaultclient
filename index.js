require('./es6-compat.js');

modules.export = {
    default: require('./lib/IAMClient.js').default,
    errorCode: require('./lib/ErrorCodes.js').errorCode,
};
