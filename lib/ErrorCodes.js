'use strict'; // eslint-disable-line

const errorCode = {
    WrongFormat: {
        code: 400,
        message: "Data entered by the user has a wrong format."
    },

    Forbidden: {
        code: 403,
        message: "Authentication failed."
    },

    EntityDoesNotExist: {
        code: 404,
        message: "Not found."
    },

    EntityAlreadyExists: {
        code: 409,
        message: "The request was rejected because it attempted to create" +
            "a resource that already exists."
    },

    ServiceFailure: {
        code: 500,
        message: "Server error: the request processing has failed because" +
            "of an unknown error, exception or failure."
    },
};

module.exports = errorCode;
