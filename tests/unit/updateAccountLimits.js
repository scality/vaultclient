const assert = require('assert');
const IAMClient = require('../../lib/IAMClient');

describe('updateAccountLimits', () => {
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

    it('should call the request method with the correct parameters when accountName and limits are provided', () => {
        client = createClient(true);
        const accountName = 'exampleAccount';
        const limits = { rateLimit: 1000 };

        const expectedData = {
            Action: 'UpdateAccountLimits',
            Version: '2010-05-08',
            limits: JSON.stringify(limits),
            AccountName: 'exampleAccount',
        };

        client.updateAccountLimits(accountName, limits, () => {});
        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, expectedData);
    });

    it('should throw when accountName is not provided', () => {
        client = createClient(true);
        const limits = { rateLimit: 1000 };
        assert.throws(
            () => client.updateAccountLimits(undefined, limits, () => {})
            , /the account name should be a string/
        );
    });

    it('should handle complex limits object correctly', () => {
        client = createClient(true);
        const accountName = 'exampleAccount';
        const limits = {
            rateLimit: 1000,
            maxBuckets: 100,
            maxObjects: 10000,
        };

        const expectedData = {
            Action: 'UpdateAccountLimits',
            Version: '2010-05-08',
            limits: JSON.stringify(limits),
            AccountName: 'exampleAccount',
        };

        client.updateAccountLimits(accountName, limits, () => {});
        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, expectedData);
    });

    it('should throw an error if limits is not an object', () => {
        client = createClient(true);
        const accountName = 'exampleAccount';
        const limits = 'not an object';

        assert.throws(() => {
            client.updateAccountLimits(accountName, limits, () => {});
        }, /limits must be an object/);
    });

    it('should throw an error if limits is null', () => {
        client = createClient(true);
        const accountName = 'exampleAccount';
        const limits = null;

        assert.throws(() => {
            client.updateAccountLimits(accountName, limits, () => {});
        }, /limits must be an object/);
    });

    it('should not throw an error if limits is not an object and parameterValidation is false', () => {
        client = createClient(false);
        const accountName = 'exampleAccount';
        const limits = 'not an object';

        const expectedData = {
            Action: 'UpdateAccountLimits',
            Version: '2010-05-08',
            limits: JSON.stringify(limits),
            AccountName: 'exampleAccount',
        };

        client.updateAccountLimits(accountName, limits, () => {});
        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, expectedData);
    });

    it('should throw an error if accountName is not a string', () => {
        client = createClient(true);
        const accountName = 123;
        const limits = { rateLimit: 1000 };

        assert.throws(() => {
            client.updateAccountLimits(accountName, limits, () => {});
        }, /the account name should be a string/);
    });

    it('should not throw an error if accountName is not a string and parameterValidation is false', () => {
        client = createClient(false);
        const accountName = 123;
        const limits = { rateLimit: 1000 };

        const expectedData = {
            Action: 'UpdateAccountLimits',
            Version: '2010-05-08',
            limits: JSON.stringify(limits),
            AccountName: 123,
        };

        client.updateAccountLimits(accountName, limits, () => {});
        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, expectedData);
    });

    it('should handle empty limits object', () => {
        client = createClient(true);
        const accountName = 'exampleAccount';
        const limits = {};

        const expectedData = {
            Action: 'UpdateAccountLimits',
            Version: '2010-05-08',
            limits: JSON.stringify(limits),
            AccountName: 'exampleAccount',
        };

        client.updateAccountLimits(accountName, limits, () => {});
        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, expectedData);
    });
});
