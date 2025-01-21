const assert = require('assert');
const sinon = require('sinon');
const VaultClient = require('../../lib/IAMClient');

describe('CreateAccount', () => {
    let client;
    let lastRequestData;

    const createClient = parameterValidation => {
        client = new VaultClient('127.0.0.1', 8500, undefined, undefined, undefined,
            undefined, undefined, undefined, undefined, undefined, undefined, undefined, parameterValidation);
        lastRequestData = null;
        client.request = (method, path, iamAuthenticate, callback, data, reqUid, contentType) => {
            lastRequestData = { method, path, iamAuthenticate, data, reqUid, contentType };
            callback();
        };
        return client;
    };

    it('should call request with correct parameters for basic account creation', () => {
        client = createClient(true);
        const accountName = 'testAccount';
        const options = { email: 'test@example.com' };

        client.createAccount(accountName, options, () => {});

        const expectedData = {
            Action: 'CreateAccount',
            Version: '2010-05-08',
            name: accountName,
            emailAddress: options.email,
        };

        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, expectedData);
    });

    it('should include quota when provided', () => {
        client = createClient(true);
        const accountName = 'testAccount';
        const options = {
            email: 'test@example.com',
            quota: BigInt(1000),
        };

        client.createAccount(accountName, options, () => {});

        const expectedData = {
            Action: 'CreateAccount',
            Version: '2010-05-08',
            name: accountName,
            emailAddress: options.email,
            quotaMax: '1000',
        };

        assert.deepStrictEqual(lastRequestData.data, expectedData);
    });

    it('should include all optional parameters when provided', () => {
        client = createClient(true);
        const accountName = 'testAccount';
        const options = {
            email: 'test@example.com',
            quota: BigInt(1000),
            externalAccountId: '123456789012',
            externalCanonicalId: 'a'.repeat(64),
            customAttributes: { key: 'value' },
            disableSeed: true,
        };

        client.createAccount(accountName, options, () => {});

        const expectedData = {
            Action: 'CreateAccount',
            Version: '2010-05-08',
            name: accountName,
            emailAddress: options.email,
            quotaMax: '1000',
            externalAccountId: '123456789012',
            externalCanonicalId: 'a'.repeat(64),
            customAttributes: JSON.stringify({ key: 'value' }),
            disableSeed: true,
        };

        assert.deepStrictEqual(lastRequestData.data, expectedData);
    });

    it('should throw error for missing account name', () => {
        client = createClient(true);
        const options = { email: 'test@example.com' };

        assert.throws(() => {
            client.createAccount('', options, () => {});
        }, /accountName is required/);
    });

    it('should throw error for missing email', () => {
        client = createClient(true);
        const options = {};

        assert.throws(() => {
            client.createAccount('testAccount', options, () => {});
        }, /options.email is required/);
    });

    it('should throw error for invalid quota type', () => {
        client = createClient(true);
        const options = {
            email: 'test@example.com',
            quota: 'invalid',
        };

        assert.throws(() => {
            client.createAccount('testAccount', options, () => {});
        }, /Quota must be a number or a bigint/);
    });

    it('should throw error for negative quota when validation enabled', () => {
        client = createClient(true);
        const options = {
            email: 'test@example.com',
            quota: BigInt(-1),
        };

        assert.throws(() => {
            client.createAccount('testAccount', options, () => {});
        }, /Quota must be a non-negative number/);
    });

    it('should allow negative quota when validation disabled', () => {
        client = createClient(false);
        const options = {
            email: 'test@example.com',
            quota: BigInt(-1),
        };

        client.createAccount('testAccount', options, () => {});

        const expectedData = {
            Action: 'CreateAccount',
            Version: '2010-05-08',
            name: 'testAccount',
            emailAddress: 'test@example.com',
            quotaMax: '-1',
        };

        assert.deepStrictEqual(lastRequestData.data, expectedData);
    });
});

describe('CreateAccount Response Parsing', () => {
    let client;
    let requestStub;

    beforeEach(() => {
        client = new VaultClient('127.0.0.1', 8500);
        requestStub = sinon.stub(client, 'request');
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should properly parse account data with quotaMax', done => {
        const mockResponse = {
            account: {
                data: {
                    name: 'testAccount',
                    quotaMax: '9007199254740992', // max safe integer + 1
                }
            }
        };

        requestStub.callsFake((method, path, auth, callback) => {
            callback(null, mockResponse);
        });

        client.createAccount('testAccount', { email: 'test@example.com' }, (err, response) => {
            assert.strictEqual(err, null);
            assert.strictEqual(typeof response.account.quotaMax, 'bigint');
            assert.strictEqual(response.account.quotaMax, BigInt('9007199254740992'));
            done();
        });
    });

    it('should handle null quotaMax in response', done => {
        const mockResponse = {
            account: {
                data: {
                    name: 'testAccount',
                    quotaMax: null,
                }
            }
        };

        requestStub.callsFake((method, path, auth, callback) => {
            callback(null, mockResponse);
        });

        client.createAccount('testAccount', { email: 'test@example.com' }, (err, response) => {
            assert.strictEqual(err, null);
            assert.strictEqual(typeof response.account.quotaMax, 'bigint');
            assert.strictEqual(response.account.quotaMax, BigInt(0));
            done();
        });
    });

    it('should handle missing quotaMax in response', done => {
        const mockResponse = {
            account: {
                data: {
                    name: 'testAccount',
                }
            }
        };

        requestStub.callsFake((method, path, auth, callback) => {
            callback(null, mockResponse);
        });

        client.createAccount('testAccount', { email: 'test@example.com' }, (err, response) => {
            assert.strictEqual(err, null);
            assert.strictEqual(typeof response.account.quotaMax, 'bigint');
            assert.strictEqual(response.account.quotaMax, BigInt(0));
            done();
        });
    });

    it('should handle error response', done => {
        const testError = new Error('Account creation failed');
        testError.code = 'CreateError';

        requestStub.callsFake((method, path, auth, callback) => {
            callback(testError);
        });

        client.createAccount('testAccount', { email: 'test@example.com' }, (err, response) => {
            assert.strictEqual(err.code, 'CreateError');
            assert.strictEqual(response, undefined);
            done();
        });
    });
});
