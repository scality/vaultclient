const assert = require('assert');
const IAMClient = require('../../lib/IAMClient');

describe('IAMClient - deleteAccountQuota', () => {
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
        const accountName = 'exampleAccount';
        client.deleteAccountQuota(accountName, () => {});

        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, {
            Action: 'DeleteAccountQuota',
            Version: '2010-05-08',
            AccountName: 'exampleAccount',
        });
    });

    it('should call the request method with the correct params when wrong options are provided and ci is true', () => {
        client = createClient(false);
        const accountName = 123;

        client.deleteAccountQuota(accountName, () => {});

        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, {
            Action: 'DeleteAccountQuota',
            Version: '2010-05-08',
            AccountName: 123,
        });
    });

    it('should call the request method with the correct parameters when options are not provided', () => {
        client = createClient(true);
        client.deleteAccountQuota(undefined, () => {});

        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, {
            Action: 'DeleteAccountQuota',
            Version: '2010-05-08',
        });
    });

    it('should throw an error if accountName is not a string', () => {
        client = createClient(true);
        const accountName = 123;
        assert.throws(() => {
            client.deleteAccountQuota(accountName, () => {});
        }, /the account name, if set, should be a string/);
    });
});
