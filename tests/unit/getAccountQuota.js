const assert = require('assert');
const IAMClient = require('../../lib/IAMClient');
const VaultClient = require('../../lib/IAMClient');
const sinon = require('sinon');

describe('GetAccountQuota', () => {
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
        const callback = () => {};
        client.getAccountQuota(accountName, callback);
        const expectedData = {
            Action: 'GetAccountQuota',
            Version: '2010-05-08',
            AccountName: 'exampleAccount',
        };
        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, expectedData);
    });

    it('should call the request method with default parameters when options are not provided', () => {
        client = createClient(true);
        const callback = () => {};
        client.getAccountQuota(undefined, callback);
        const expectedData = {
            Action: 'GetAccountQuota',
            Version: '2010-05-08',
        };
        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, expectedData);
    });

    it('should throw an error if accountName is not a string', () => {
        client = createClient(true);
        const accountName = 123;
        const callback = () => {};
        assert.throws(() => {
            client.getAccountQuota(accountName, callback);
        }, /the account name, if set, should be a string/);
    });

    it('should not throw an error if accountName is not a string and ci is true', () => {
        client = createClient(false);
        const accountName = 123;
        const callback = () => {};
        client.getAccountQuota(accountName, callback);
        const expectedData = {
            Action: 'GetAccountQuota',
            Version: '2010-05-08',
            AccountName: 123,
        };
        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, expectedData);
    });
});

describe('GetAccountQuota Response Parsing', () => {
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
        // Configure request stub to simulate API response
        requestStub.callsFake((method, path, auth, callback) => {
            callback(null, { quota: '9007199254740992' }); // max safe integer + 1
        });

        client.getAccountQuota('testAccount', (err, response) => {
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

        client.getAccountQuota('testAccount', (err, response) => {
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

        client.getAccountQuota('testAccount', (err, response) => {
            assert.strictEqual(err, null);
            assert.strictEqual(typeof response.quota, 'bigint');
            assert.strictEqual(response.quota, BigInt(0));
            done();
        });
    });

    it('should handle empty string quota in response', done => {
        requestStub.callsFake((method, path, auth, callback) => {
            callback(null, { quota: '' });
        });

        client.getAccountQuota('testAccount', (err, response) => {
            assert.strictEqual(err, null);
            assert.strictEqual(typeof response.quota, 'bigint');
            assert.strictEqual(response.quota, BigInt(0));
            done();
        });
    });

    it('should handle invalid string quota in response', done => {
        requestStub.callsFake((method, path, auth, callback) => {
            callback(null, { quota: 'not-a-number' });
        });

        try {
            client.getAccountQuota('testAccount', () => {
                done('Should throw an error');
            });
        } catch (err) {
            assert.strictEqual(err.message, 'Cannot convert not-a-number to a BigInt');
            done();
        }
    });

    it('should handle large quota values without precision loss', done => {
        const largeQuota = '9007199254740991'; // Maximum safe integer in JavaScript
        requestStub.callsFake((method, path, auth, callback) => {
            callback(null, { quota: largeQuota });
        });

        client.getAccountQuota('testAccount', (err, response) => {
            assert.strictEqual(err, null);
            assert.strictEqual(typeof response.quota, 'bigint');
            assert.strictEqual(response.quota, BigInt(largeQuota));
            assert.strictEqual(response.quota.toString(), largeQuota);
            done();
        });
    });

    it('should propagate error from request', done => {
        const testError = new Error('Request failed');
        testError.code = 'RequestError';

        requestStub.callsFake((method, path, auth, callback) => {
            callback(testError);
        });

        client.getAccountQuota('testAccount', (err, response) => {
            assert.strictEqual(err.code, 'RequestError');
            assert.strictEqual(response, undefined);
            done();
        });
    });

    it('should handle zero quota value', done => {
        requestStub.callsFake((method, path, auth, callback) => {
            callback(null, { quota: '0' });
        });

        client.getAccountQuota('testAccount', (err, response) => {
            assert.strictEqual(err, null);
            assert.strictEqual(typeof response.quota, 'bigint');
            assert.strictEqual(response.quota, BigInt(0));
            done();
        });
    });

    it('should handle negative quota value', done => {
        requestStub.callsFake((method, path, auth, callback) => {
            callback(null, { quota: '-1000' });
        });

        client.getAccountQuota('testAccount', (err, response) => {
            assert.strictEqual(err, null);
            assert.strictEqual(typeof response.quota, 'bigint');
            assert.strictEqual(response.quota, BigInt(-1000));
            done();
        });
    });

    it('should verify request parameters', () => {
        requestStub.callsFake((method, path, auth, callback) => {
            callback(null, { quota: '1000' });
        });

        client.getAccountQuota('testAccount', () => {});

        assert(requestStub.calledOnce);
        const args = requestStub.firstCall.args;
        assert.strictEqual(args[0], 'POST');
        assert.strictEqual(args[1], '/');
        assert.strictEqual(args[2], true);
        assert.deepStrictEqual(args[4], {
            Action: 'GetAccountQuota',
            Version: '2010-05-08',
            AccountName: 'testAccount'
        });
    });
});
