const assert = require('assert');
const IAMClient = require('../../lib/IAMClient');

describe('updateAccountQuota', () => {
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

    it('should call the request method with the correct parameters when options are provided', () => {
        client = createClient(true);
        const quota = 100;
        const accountName = 'exampleAccount';

        const expectedData = {
            Action: 'UpdateAccountQuota',
            Version: '2010-05-08',
            quotaMax: quota,
            AccountName: 'exampleAccount',
        };

        client.updateAccountQuota(accountName, quota, () => {});
        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, expectedData);
    });

    it('should call the request method with the correct parameters when options are not provided', () => {
        client = createClient(true);
        const quota = 100;

        const expectedData = {
            Action: 'UpdateAccountQuota',
            Version: '2010-05-08',
            quotaMax: quota,
        };

        client.updateAccountQuota(undefined, quota, () => {});
        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, expectedData);
    });

    it('should throw an error if the quota is not a positive number', () => {
        client = createClient(true);
        const quota = -100;

        assert.throws(() => {
            client.updateAccountQuota(undefined, quota, () => {});
        }, /Quota must be a positive number/);
    });

    it('should not throw an error even when the quota is not a positive number if ci is true', () => {
        client = createClient(false);
        const quota = -100;

        const expectedData = {
            Action: 'UpdateAccountQuota',
            Version: '2010-05-08',
            quotaMax: quota,
        };

        client.updateAccountQuota(undefined, quota, () => {});
        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, expectedData);
    });


    it('should not throw an error even when the quota is 0 if ci is true', () => {
        client = createClient(false);
        const quota = 0;

        const expectedData = {
            Action: 'UpdateAccountQuota',
            Version: '2010-05-08',
            quotaMax: quota,
        };

        client.updateAccountQuota(undefined, quota, () => {});
        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, expectedData);
    });

    it('should throw an error if accountName is not a string', () => {
        client = createClient(true);
        const quota = 100;
        const accountName = 123;

        assert.throws(() => {
            client.updateAccountQuota(accountName, quota, () => {});
        }, /the account name, if set, should be a string/);
    });
});
