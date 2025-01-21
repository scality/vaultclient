const assert = require('assert');
const IAMClient = require('../../lib/IAMClient');
const sinon = require('sinon');
const VaultClient = require('../../lib/IAMClient');

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
        const quota = BigInt(100);
        const accountName = 'exampleAccount';

        const expectedData = {
            Action: 'UpdateAccountQuota',
            Version: '2010-05-08',
            quotaMax: quota.toString(),
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
        const quota = BigInt(100);

        const expectedData = {
            Action: 'UpdateAccountQuota',
            Version: '2010-05-08',
            quotaMax: quota.toString(),
        };

        client.updateAccountQuota(undefined, quota, () => {});
        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, expectedData);
    });

    it('should throw an error if the quota is not a strictly positive number', () => {
        client = createClient(true);
        const quota = BigInt(-100);

        assert.throws(() => {
            client.updateAccountQuota(undefined, quota, () => {});
        }, /Quota must be a strictly positive bigint/);
    });


    it('should throw an error if the quota provided is 0', () => {
        client = createClient(true);
        const quota = BigInt(0);

        assert.throws(() => {
            client.updateAccountQuota(undefined, quota, () => {});
        }, /Quota must be a strictly positive bigint/);
    });

    it('should not throw an error even when the quota is not a strictly positive number if ci is true', () => {
        client = createClient(false);
        const quota = BigInt(-100);

        const expectedData = {
            Action: 'UpdateAccountQuota',
            Version: '2010-05-08',
            quotaMax: quota.toString(),
        };

        client.updateAccountQuota(undefined, quota, () => {});
        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, expectedData);
    });


    it('should not throw an error even when the quota is 0 if ci is true', () => {
        client = createClient(false);
        const quota = BigInt(0);

        const expectedData = {
            Action: 'UpdateAccountQuota',
            Version: '2010-05-08',
            quotaMax: quota.toString(),
        };

        client.updateAccountQuota(undefined, quota, () => {});
        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, expectedData);
    });

    it('should throw an error if accountName is not a string', () => {
        client = createClient(true);
        const quota = BigInt(100);
        const accountName = 123;

        assert.throws(() => {
            client.updateAccountQuota(accountName, quota, () => {});
        }, /the account name, if set, should be a string/);
    });
});

describe('UpdateAccountQuota Response Parsing', () => {
    let client;
    let requestStub;

    beforeEach(() => {
        client = new VaultClient('127.0.0.1', 8500);
        requestStub = sinon.stub(client, 'request');
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should properly parse bigint quota value from response', done => {
        requestStub.callsFake((method, path, auth, callback) => {
            callback(null, { quota: '9007199254740992' }); // max safe integer + 1
        });

        client.updateAccountQuota('testAccount', BigInt(100), (err, response) => {
            assert.strictEqual(err, null);
            assert.strictEqual(typeof response.quota, 'bigint');
            assert.strictEqual(response.quota, BigInt('9007199254740992'));
            done();
        });
    });

    it('should handle null quota in response', done => {
        requestStub.callsFake((method, path, auth, callback) => {
            callback(null, { quota: null });
        });

        client.updateAccountQuota('testAccount', BigInt(100), (err, response) => {
            assert.strictEqual(err, null);
            assert.strictEqual(typeof response.quota, 'bigint');
            assert.strictEqual(response.quota, BigInt(0));
            done();
        });
    });

    it('should handle undefined quota in response', done => {
        requestStub.callsFake((method, path, auth, callback) => {
            callback(null, {});
        });

        client.updateAccountQuota('testAccount', BigInt(100), (err, response) => {
            assert.strictEqual(err, null);
            assert.strictEqual(typeof response.quota, 'bigint');
            assert.strictEqual(response.quota, BigInt(0));
            done();
        });
    });
});
