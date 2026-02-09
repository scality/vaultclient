'use strict';

const assert = require('assert');
const IAMClient = require('../../lib/IAMClient');
const sinon = require('sinon');

describe('updateAccountQuota', () => {
    let client;
    let requestStub;

    beforeEach(() => {
        client = new IAMClient('127.0.0.1', 8500);
        client.parameterValidation = true;
        requestStub = sinon.stub(client, 'request');
    });

    afterEach(() => sinon.restore());

    it('should call the request method with the correct parameters when options are provided', () => {
        const quota = 100;
        const accountName = 'exampleAccount';

        requestStub.callsFake((method, path, iamAuthenticate, cb, data) => {
            assert.strictEqual(method, 'POST');
            assert.strictEqual(path, '/');
            assert.strictEqual(iamAuthenticate, true);
            assert.deepStrictEqual(data, {
                Action: 'UpdateAccountQuota',
                Version: '2010-05-08',
                quotaMax: '100',
                AccountName: 'exampleAccount',
            });
            cb();
        });

        client.updateAccountQuota(accountName, quota, () => {});
    });

    it('should call the request method with bigint quota', () => {
        const quota = 9007199254740993n; // larger than Number.MAX_SAFE_INTEGER
        const accountName = 'exampleAccount';

        requestStub.callsFake((method, path, iamAuthenticate, cb, data) => {
            assert.strictEqual(method, 'POST');
            assert.strictEqual(path, '/');
            assert.strictEqual(iamAuthenticate, true);
            assert.deepStrictEqual(data, {
                Action: 'UpdateAccountQuota',
                Version: '2010-05-08',
                quotaMax: '9007199254740993',
                AccountName: 'exampleAccount',
            });
            cb();
        });

        client.updateAccountQuota(accountName, quota, () => {});
    });

    it('should call the request method with string quota', () => {
        const quota = '5000000000';
        const accountName = 'exampleAccount';

        requestStub.callsFake((method, path, iamAuthenticate, cb, data) => {
            assert.strictEqual(method, 'POST');
            assert.strictEqual(path, '/');
            assert.strictEqual(iamAuthenticate, true);
            assert.deepStrictEqual(data, {
                Action: 'UpdateAccountQuota',
                Version: '2010-05-08',
                quotaMax: '5000000000',
                AccountName: 'exampleAccount',
            });
            cb();
        });

        client.updateAccountQuota(accountName, quota, () => {});
    });

    it('should call the request method with the correct parameters when options are not provided', () => {
        const quota = 100;

        requestStub.callsFake((method, path, iamAuthenticate, cb, data) => {
            assert.strictEqual(method, 'POST');
            assert.strictEqual(path, '/');
            assert.strictEqual(iamAuthenticate, true);
            assert.deepStrictEqual(data, {
                Action: 'UpdateAccountQuota',
                Version: '2010-05-08',
                quotaMax: '100',
            });
            cb();
        });

        client.updateAccountQuota(undefined, quota, () => {});
    });

    it('should throw an error if the quota is negative', () => {
        const quota = -100;

        assert.throws(() => {
            client.updateAccountQuota(undefined, quota, () => {});
        }, /Quota must be a non-negative number, bigint, or string/);
    });

    it('should not throw an error even when the quota is negative if ci is true', () => {
        client.parameterValidation = false;

        const quota = -100;

        requestStub.callsFake((method, path, iamAuthenticate, cb, data) => {
            assert.strictEqual(method, 'POST');
            assert.strictEqual(path, '/');
            assert.strictEqual(iamAuthenticate, true);
            assert.deepStrictEqual(data, {
                Action: 'UpdateAccountQuota',
                Version: '2010-05-08',
                quotaMax: '-100',
            });
            cb();
        });

        client.updateAccountQuota(undefined, quota, () => {});
    });


    it('should not throw an error even when the quota is 0 if ci is true', () => {
        client.parameterValidation = false;

        const quota = 0;

        requestStub.callsFake((method, path, iamAuthenticate, cb, data) => {
            assert.strictEqual(method, 'POST');
            assert.strictEqual(path, '/');
            assert.strictEqual(iamAuthenticate, true);
            assert.deepStrictEqual(data, {
                Action: 'UpdateAccountQuota',
                Version: '2010-05-08',
                quotaMax: '0',
            });
            cb();
        });

        client.updateAccountQuota(undefined, quota, () => {});
    });

    it('should throw an error if accountName is not a string', () => {
        const quota = 100;
        const accountName = 123;

        assert.throws(() => {
            client.updateAccountQuota(accountName, quota, () => {});
        }, /the account name, if set, should be a string/);
    });
});
