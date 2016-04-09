'use strict'; // eslint-disable-line

const assert = require('assert');
const http = require('http');
const IAMClient = require('../../lib/IAMClient.js');

const canId1 =
    '0123456789012345678901234567890123456789012345678901234567890123';
const canId2 =
    '1234567890123456789012345678901234567890123456789012345678901230';
const canId3 =
    '2345678901234567890123456789012345678901234567890123456789012301';
const canIdWrongFormat = 'wrongformatcanid';
const canIdNotFound =
    '3456789012345678901234567890123456789012345678901234567890123012';

const email1 = 'email1@test.com';
const email2 = 'email2@test.com';
const email3 = 'email3@test.com';
const emailWrongFormat = 'wrongformatemail';
const emailNotFound = 'emailNotFound@test.com';

const serverDB = {};
serverDB[canId1] = email1;
serverDB[canId2] = email2;
serverDB[canId3] = email3;
serverDB[canIdWrongFormat] = 'WrongFormat';
serverDB[canIdNotFound] = 'NotFound';
serverDB[email1] = canId1;
serverDB[email2] = canId2;
serverDB[email3] = canId3;
serverDB[emailWrongFormat] = 'WrongFormat';
serverDB[emailNotFound] = 'NotFound';

const testNames = [
    'should correctly retrieve emails',
    'should correctly retrieve emails, wrong-format included',
    'should correctly retrieve emails, not-found included',
    'should correctly retrieve emails, wrong-format, not-found included',
    'should correctly retrieve canIds',
    'should correctly retrieve canIds, wrong-format included',
];

const testOutputKeys = [
    [canId1, canId2, canId3],
    [canId1, canIdWrongFormat, canId2],
    [canId1, canIdNotFound, canId2],
    [canId1, canIdWrongFormat, canIdNotFound, canId3],
    [email1, email2, email3],
    [email1, emailWrongFormat, email2],
];

const testOutputValues = [
    [email1, email2, email3],
    [email1, 'WrongFormat', email2],
    [email1, 'NotFound', email2],
    [email1, 'WrongFormat', 'NotFound', email3],
    [canId1, canId2, canId3],
    [canId1, 'WrongFormat', canId2],
];

function buildExpecteds() {
    const output = [];
    testOutputKeys.forEach((currentValue0, index0) => {
        output[index0] = {};
        testOutputKeys[index0].forEach((currentValue1, index1) => {
            output[index0][currentValue1]
                = testOutputValues[index0][index1];
        });
    });
    return output;
}

const testExpecteds = buildExpecteds();

function handler(req, res) {
    let inputArray;

    if (req.method === 'GET' && req.url === '/acl/emailAddresses') {
        inputArray = JSON.parse(req.headers.additionaldata).canonicalIds;
    } else if (req.method === 'GET' && req.url === '/acl/canonicalIds') {
        inputArray = JSON.parse(req.headers.additionaldata).emailAddresses;
    }
    if (!Array.isArray(inputArray))
        throw new Error('Input error');

    const outputDict = {};
    inputArray.forEach(key => { outputDict[key] = serverDB[key]; });
    res.writeHead(200);
    return res.end(JSON.stringify({ message: outputDict }, null, 4));
}

describe('getAccountProperties with mockup server', () => {
    let server;
    let client;

    beforeEach('start server', done => {
        server = http.createServer(handler).listen(8500);
        client = new IAMClient('127.0.0.1', 8500);
        done();
    });

    afterEach('stop server', () => { server.close(); });

    testNames.forEach((currentValue, testIndex) => {
        it(testNames[testIndex], done => {
            client.getEmailAddresses(testOutputKeys[testIndex], {},
                (err, value) => {
                    assert(!err);
                    assert.deepStrictEqual(
                        value.message,
                        testExpecteds[testIndex]);
                    done();
                });
        });
    });
});
