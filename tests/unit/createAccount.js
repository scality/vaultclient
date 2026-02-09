'use strict';

const assert = require('assert');
const VaultClient = require('../../lib/IAMClient');
const sinon = require('sinon');

describe('createAccount', () => {
    let client;
    let requestStub;

    beforeEach(() => {
        client = new VaultClient('127.0.0.1', 8500);
        requestStub = sinon.stub(client, 'request');
    });

    afterEach(() => sinon.restore());

    describe('quota parameter handling', () => {
        it('should send number quota as string', () => {
            const mockAccountData = { id: '123', name: 'testAccount' };
            requestStub.callsFake((_method, _path, _auth, callback, data) => {
                assert.strictEqual(data.quotaMax, '1000000');
                callback(null, { account: { data: mockAccountData } });
            });

            const options = {
                email: 'test@example.com',
                quota: 1000000,
            };

            client.createAccount('testAccount', options, err => assert.ifError(err));
        });

        it('should send bigint quota as string', () => {
            const mockAccountData = { id: '123', name: 'testAccount' };
            requestStub.callsFake((_method, _path, _auth, callback, data) => {
                assert.strictEqual(data.quotaMax, '9007199254740993');
                callback(null, { account: { data: mockAccountData } });
            });

            const options = {
                email: 'test@example.com',
                quota: 9007199254740993n, // Number.MAX_SAFE_INTEGER + 2
            };

            client.createAccount('testAccount', options, err => assert.ifError(err));
        });

        it('should send string quota as-is', () => {
            const mockAccountData = { id: '123', name: 'testAccount' };
            requestStub.callsFake((_method, _path, _auth, callback, data) => {
                assert.strictEqual(data.quotaMax, '5000000000');
                callback(null, { account: { data: mockAccountData } });
            });

            const options = {
                email: 'test@example.com',
                quota: '5000000000',
            };

            client.createAccount('testAccount', options, err => assert.ifError(err));
        });

        it('should not include quotaMax when quota is not provided', () => {
            const mockAccountData = { id: '123', name: 'testAccount' };
            requestStub.callsFake((_method, _path, _auth, callback, data) => {
                assert.strictEqual(data.quotaMax, undefined);
                callback(null, { account: { data: mockAccountData } });
            });

            const options = {
                email: 'test@example.com',
            };

            client.createAccount('testAccount', options, err => assert.ifError(err));
        });
    });

    describe('request parameters', () => {
        it('should include accountName and email in request data', () => {
            const mockAccountData = { id: '123', name: 'myAccount' };
            requestStub.callsFake((_method, _path, _auth, callback, data) => {
                assert.strictEqual(data.name, 'testAccount');
                assert.strictEqual(data.emailAddress, 'test@example.com');
                assert.strictEqual(data.Action, 'CreateAccount');
                assert.strictEqual(data.Version, '2010-05-08');
                callback(null, { account: { data: mockAccountData } });
            });

            const options = { email: 'test@example.com' };

            client.createAccount('testAccount', options, err => assert.ifError(err));
        });
    });

    describe('validation', () => {
        it('should throw error if accountName is empty', () => {
            const options = { email: 'test@example.com' };

            assert.throws(() => {
                client.createAccount('', options, () => {});
            }, /accountName is required/);
        });

        it('should throw error if email is missing', () => {
            assert.throws(() => {
                client.createAccount('testAccount', {}, () => {});
            }, /options.email is required/);
        });

        it('should throw error if quota is negative', () => {
            const options = {
                email: 'test@example.com',
                quota: -100,
            };

            assert.throws(() => {
                client.createAccount('testAccount', options, () => {});
            }, /Quota must be a non-negative number, bigint, or string/);
        });
    });

    describe('response handling', () => {
        it('should return account data from response', () => {
            const mockAccountData = { id: '123', name: 'testAccount', email: 'test@example.com' };
            requestStub.callsFake((_method, _path, _auth, callback) => {
                callback(null, { account: { data: mockAccountData } });
            });

            const options = { email: 'test@example.com' };

            client.createAccount('testAccount', options, (err, response) => {
                assert.ifError(err);
                assert.deepStrictEqual(response, { account: mockAccountData });
            });
        });

        it('should pass error to callback when request fails', () => {
            const mockError = new Error('Request failed');
            requestStub.callsFake((_method, _path, _auth, callback) => {
                callback(mockError);
            });

            const options = { email: 'test@example.com' };

            client.createAccount('testAccount', options, (err, response) => {
                assert.strictEqual(err, mockError);
                assert.strictEqual(response, undefined);
            });
        });
    });
});
