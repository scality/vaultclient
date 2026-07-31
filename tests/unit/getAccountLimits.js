const assert = require('assert');
const IAMClient = require('../../lib/IAMClient');

describe('GetAccountLimits', () => {
    let client;
    let lastRequestData;

    const createClient = parameterValidation => {
        client = new IAMClient('127.0.0.1', 8500, undefined, undefined, undefined,
            undefined, undefined, undefined, undefined, undefined, undefined, undefined, parameterValidation);
        lastRequestData = null;
        client.request = (method, path, iamAuthenticate, callback, data, reqUid, contentType) => {
            lastRequestData = { method, path, iamAuthenticate, data, reqUid, contentType };
            callback();
        };
        return client;
    };

    it('should call the request method with the correct parameters when accountName is provided', () => {
        client = createClient(true);
        const accountName = 'exampleAccount';
        const callback = () => {};
        client.getAccountLimits(accountName, callback);
        const expectedData = {
            Action: 'GetAccountLimits',
            Version: '2010-05-08',
            AccountName: 'exampleAccount',
        };
        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, expectedData);
    });

    it('should throw an error when accountName is not provided', () => {
        client = createClient(true);
        const callback = () => {};
        assert.throws(() => {
            client.getAccountLimits(undefined, callback);
        }, /the account name should be a string/);
    });

    it('should throw an error if accountName is not a string', () => {
        client = createClient(true);
        const accountName = 123;
        const callback = () => {};
        assert.throws(() => {
            client.getAccountLimits(accountName, callback);
        }, /the account name should be a string/);
    });

    it('should not throw an error if accountName is not a string and parameterValidation is false', () => {
        client = createClient(false);
        const accountName = 123;
        const callback = () => {};
        client.getAccountLimits(accountName, callback);
        const expectedData = {
            Action: 'GetAccountLimits',
            Version: '2010-05-08',
            AccountName: 123,
        };
        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, expectedData);
    });
});
