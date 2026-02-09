'use strict';

const assert = require('assert');
const IAMClient = require('../../lib/IAMClient');

describe('client utilities', () => {
    let client;

    beforeEach(() => {
        client = new IAMClient('127.0.0.1', 8500);
    });

    describe('parseObj', () => {
        it('should convert maxQuota string to bigint', () => {
            const json = JSON.stringify({ maxQuota: '9007199254740992' }); // > MAX_SAFE_INTEGER
            const result = client.parseObj(json);

            assert.strictEqual(typeof result.maxQuota, 'bigint');
            assert.strictEqual(result.maxQuota, 9007199254740992n);
        });

        it('should keep maxQuota as number when received as number (backward compatibility)', () => {
            const json = JSON.stringify({ maxQuota: 1000000 });
            const result = client.parseObj(json);

            assert.strictEqual(typeof result.maxQuota, 'number');
            assert.strictEqual(result.maxQuota, 1000000);
        });

        it('should convert maxQuota in nested structures', () => {
            const json = JSON.stringify({
                Accounts: [
                    { id: '1', name: 'account1', maxQuota: '100000' },
                    { id: '2', name: 'account2', maxQuota: '200000' },
                ],
            });
            const result = client.parseObj(json);

            assert.strictEqual(typeof result.Accounts[0].maxQuota, 'bigint');
            assert.strictEqual(result.Accounts[0].maxQuota, 100000n);
            assert.strictEqual(result.Accounts[1].maxQuota, 200000n);
        });

        it('should handle maxQuota value of "0"', () => {
            const json = JSON.stringify({ maxQuota: '0' });
            const result = client.parseObj(json);

            assert.strictEqual(typeof result.maxQuota, 'bigint');
            assert.strictEqual(result.maxQuota, 0n);
        });

        it('should return error for invalid JSON', () => {
            const invalidJson = '{ invalid json }';
            const result = client.parseObj(invalidJson);

            assert(result instanceof Error);
        });
    });

    describe('handleResponse', () => {
        const res = { statusCode: 200, statusMessage: 'OK' };

        it('should convert maxQuota in successful JSON response', done => {
            const ret = JSON.stringify({ maxQuota: '9999999999999' });

            client.handleResponse(res, ret, {}, (err, obj, code, message) => {
                assert.strictEqual(err, null);
                assert.strictEqual(typeof obj.maxQuota, 'bigint');
                assert.strictEqual(obj.maxQuota, 9999999999999n);
                assert.strictEqual(code, 200);
                assert.strictEqual(message, 'OK');
                done();
            });
        });

        it('should handle empty response', done => {
            const ret = '';

            client.handleResponse(res, ret, {}, (err, obj) => {
                assert.strictEqual(err, null);
                assert.deepStrictEqual(obj, {});
                done();
            });
        });
    });
});
