require('./es6-compat.js');

module.exports = {
    default: require('./lib/IAMClient.js').default,
    errorCode: require('./lib/ErrorCodes.js').errorCode,
};
