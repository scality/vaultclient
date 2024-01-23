/* eslint-disable operator-linebreak */
'use strict'; // eslint-disable-line

const assert = require('assert');
const IAMClient = require('../../lib/IAMClient');

const accountIds = ['accountId1', 'accountId2'];
const canonicalIds = ['canId1', 'canId2'];
const emailAddresses = ['email1', 'email2'];
const accountNames = ['name1', 'name2'];
const opt = { reqUid: 'test.getAccounts.reqUid' };
const optAccountNames = Object.assign({}, opt, { accountNames: true });
const mockCB = () => {};

const expectedData = {
    Action: 'GetAccounts',
    Version: '2010-05-08',
};

describe('getAccounts', () => {
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

    describe('should send request with correct arguments', () => {
        [
            { name: 'accountIds', args: [accountIds, null, null, opt, mockCB] },
            { name: 'emailAddresses', args: [null, emailAddresses, null, opt, mockCB] },
            { name: 'canonicalIds', args: [null, null, canonicalIds, opt, mockCB] },
            { name: 'accountNames', args: [accountNames, null, null, optAccountNames, mockCB] },
        ].forEach(({ name, args }) => it(`for ${name}`, () => {
            client.getAccounts(...args);
            const [method, path, auth, cb, data, reqUid, contentType] = spyArg;
            assert.strictEqual(method, 'GET');
            assert.strictEqual(path, '/');
            assert.strictEqual(auth, false);
            assert.strictEqual(cb, mockCB);
            assert.strictEqual(reqUid, opt.reqUid);
            assert.strictEqual(contentType, null);
            assert.deepStrictEqual(
                data,
                Object.assign({}, expectedData, { [name]: args[0] || args[1] || args[2] }),
            );
        }));
    });

    describe('should throw with invalid arguments', () => {
        it('for all values set', () => {
            assert.throws(() => client.getAccounts(accountIds, emailAddresses, canonicalIds, opt, mockCB),
                assert.AssertionError);
        });
    });
});
