'use strict'; // eslint-disable-line

/**
 * This function retrieve the arsenal error name from the error object
 *
 * @param {object} err - Error to retrieve
 * @return {string} Arsenal error name
 */
module.exports = err => {
    // Here, we go through the error and find the boolean field to
    // 'true', and then we keep the field name to return it
    let code = 'Unknown';
    Object.keys(err).forEach(key => {
        if (err[key] === true) {
            code = key;
        }
    });
    return code;
};
