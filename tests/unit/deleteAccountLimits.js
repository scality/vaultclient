const assert = require('assert');
const IAMClient = require('../../lib/IAMClient');

describe('IAMClient - deleteAccountLimits', () => {
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
        client.deleteAccountLimits(accountName, () => {});

        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, {
            Action: 'DeleteAccountLimits',
            Version: '2010-05-08',
            AccountName: 'exampleAccount',
        });
    });

    it('should call the request method with the correct parameters when accountName is not provided', () => {
        client = createClient(true);
        client.deleteAccountLimits(undefined, () => {});

        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, {
            Action: 'DeleteAccountLimits',
            Version: '2010-05-08',
        });
    });

    it('should throw an error if accountName is not a string', () => {
        client = createClient(true);
        const accountName = 123;
        assert.throws(() => {
            client.deleteAccountLimits(accountName, () => {});
        }, /the account name, if set, should be a string/);
    });

    it('should call the request method when wrong options are provided and parameterValidation is false', () => {
        client = createClient(false);
        const accountName = 123;

        client.deleteAccountLimits(accountName, () => {});

        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, {
            Action: 'DeleteAccountLimits',
            Version: '2010-05-08',
            AccountName: 123,
        });
    });
});
