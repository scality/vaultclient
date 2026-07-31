'use strict';

const assert = require('assert');
const IAMClient = require('../../lib/IAMClient');

const canonicalIds = ['canId1', 'canId2'];
const opt = { reqUid: 'test.getAccounts.reqUid' };
const mockCB = () => {};

const expectedData = {
    Action: 'GetAccounts',
    Version: '2010-05-08',
};

describe('getAccountLimitsByCanonicalIds', () => {
    let client;
    let spyArg = null;

    beforeEach('spy on request', done => {
        client = new IAMClient('127.0.0.1', 8500);
        client.request = function spy(...args) {
            spyArg = args;
        };
        done();
    });

    afterEach('reset spyArg', () => { spyArg = null; });

    it('should send request with correct arguments', () => {
        client.getAccountLimitsByCanonicalIds(canonicalIds, opt, mockCB);
        const [method, path, auth, cb, data, reqUid, contentType] = spyArg;
        assert.strictEqual(method, 'GET');
        assert.strictEqual(path, '/');
        assert.strictEqual(auth, false);
        assert.strictEqual(typeof cb, 'function');
        assert.strictEqual(reqUid, opt.reqUid);
        assert.strictEqual(contentType, null);
        assert.deepStrictEqual(
            data,
            { ...expectedData, canonicalIds },
        );
    });


    it('should throw with invalid arguments', () => {
        assert.throws(() => client.getAccountLimitsByCanonicalIds('foobar', opt, mockCB),
            assert.AssertionError);
    });
});
