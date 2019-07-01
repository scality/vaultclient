/* eslint-disable operator-linebreak */
'use strict'; // eslint-disable-line

const assert = require('assert');
const { errors } = require('arsenal');
const http = require('http');
const querystring = require('querystring');
const IAMClient = require('../../lib/IAMClient.js');


const canId1 =
    '0123456789012345678901234567890123456789012345678901234567890123';
const canId2 =
    '1234567890123456789012345678901234567890123456789012345678901230';
const canId3 =
    '2345678901234567890123456789012345678901234567890123456789012301';

const accountId1 = 'accountId1';
const accountId2 = 'accountId2';
const accountId3 = 'accountId3';
const accountBadId = 'accountBadId';

const serverDB = {};
serverDB[accountId1] = canId1;
serverDB[accountId2] = canId2;
serverDB[accountId3] = canId3;

function handler(req, res) {
    const index = req.url.indexOf('?');
    const data = querystring.parse(req.url.substring(index + 1));
    let inputArray = data.accountIds;
    if (!Array.isArray(inputArray)) {
        inputArray = [inputArray];
    }
    if (inputArray.indexOf(accountBadId) !== -1) {
        res.writeHead(errors.InvalidParameterValue.code);
        return res.end(JSON.stringify(errors.InvalidParameterValue));
    }
    const output = [];
    inputArray.forEach(id => output.push({
        accountId: id,
        canonicalId: serverDB[id],
    }));
    res.writeHead(200);
    return res.end(JSON.stringify(output), null, 4);
}

describe('getCanonicalIdsByAccountIds with mockup server', () => {
    let server;
    let client;

    beforeEach('start server', done => {
        server = http.createServer(handler).listen(8500);
        client = new IAMClient('127.0.0.1', 8500);
        done();
    });

    afterEach('stop server', () => { server.close(); });

    it('should correctly retrieve canonical Ids', done => {
        const accountIds = [accountId1, accountId2, accountId3];
        const expectedRes = [
            { accountId: accountId1, canonicalId: canId1 },
            { accountId: accountId2, canonicalId: canId2 },
            { accountId: accountId3, canonicalId: canId3 },
        ];
        client.getCanonicalIdsByAccountIds(accountIds, {}, (err, res) => {
            if (err) {
                return done(err);
            }
            assert.deepStrictEqual(res.message.body, expectedRes);
            return done();
        });
    });

    it('should return error when server returns an error', done => {
        const accountIds = [accountId1, accountId2, accountId3, accountBadId];
        client.getCanonicalIdsByAccountIds(accountIds, {}, err => {
            assert(err);
            return done();
        });
    });
});
