const httpClientFreeSocketTimeout = 55000;

const InternalError = {
    code: 500,
    description: 'We encountered an internal error. Please try again.',
    InternalError: true,
};

module.exports = {
    httpClientFreeSocketTimeout,
    InternalError,
};
