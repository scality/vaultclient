const httpClientFreeSocketTimeout = 55000;

const InternalError = {
    code: 500,
    description: 'We encountered an internal error. Please try again.',
    InternalError: true,
};

const InvalidParameterValue = {
    code: 400,
    description: 'An invalid or out-of-range value was supplied for the input parameter.',
    InvalidParameterValue: true,
};

const Forbidden = {
    code: 403,
    description: 'Authentication failed.',
    Forbidden: true,
};

const WrongFormat = {
    code: 400,
    description: 'Data entered by the user has a wrong format.',
    WrongFormat: true,
};

module.exports = {
    httpClientFreeSocketTimeout,
    InternalError,
    InvalidParameterValue,
    Forbidden,
    WrongFormat,
};
