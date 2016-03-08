'use strict'; // eslint-disable-line

const errors = require('arsenal').errors;
const assert = require('assert');
const http = require('http');
const IAMClient = require('../../lib/IAMClient.js');

const testNames = [
    'should authenticate correct v2 request',
    'should send error if signature is incorrect',
];

const stringsToSign = [
    'PUT\n\n\nMon, 21 Dec 2015 21:49:31 +0000\n/asdf2',
    'PUT\n\n\nMon, 21 Dec 2015 21:49:31 +0000\n/asdf2',
];

const accessKeys = [
    'A2ZW96Q7MZY30RFI4UK2',
    'A2ZW96Q7MZY30RFI4UK2',
];

const signaturesFromRequest = [
    'EyjCLdnaFhCmMCOGS1+8SYObqK8=',
    'wrongSig',
];

const hashAlgorithms = [
    'sha1',
    'sha1',
];

const correctDictResponse = {
    arn: 'arn:aws:iam::379763717565:/TestAccount/',
    canonicalID:
        'QHATANHGDQHBM8OP0U4J5T952BFH33TSOY3XLYELKB1U5CAB547FKR0KUQ4CE3IK',
    shortid: '379763717565',
    email: 'test.account@test.com',
    accountDisplayName: 'TestAccount',
};

const wrongSigError = errors.Forbidden;

const expectedErrors = [
    null,
    wrongSigError,
];
const expectedResponseBodies = [
    correctDictResponse,
    undefined,
];

const responseHeaders = [
    { code: 200, message: 'Authentication successful' },
    { code: wrongSigError.code, message: wrongSigError.message },
];
const responseBodies = [
    correctDictResponse,
    { message: wrongSigError },
];

function makeResponse(res, code, message) {
    res.statusCode = code;
    res.message = message;
}

function processRequest(requestObject) {
    for (let i = 0; i < stringsToSign.length; i++) {
        if (requestObject.stringToSign === stringsToSign[i]
            && requestObject.accessKey === accessKeys[i]
            && requestObject.signatureFromRequest === signaturesFromRequest[i]
            && requestObject.hashAlgorithm === hashAlgorithms[i]) {
            return i;
        }
    }
}

function handler(req, res) {
    if (req.method === 'GET' && req.url === `/auth/v2`) {
        const testCaseIndex = processRequest(
            JSON.parse(req.headers.additionaldata));
        if (typeof testCaseIndex === 'number') {
            makeResponse(res, responseHeaders[testCaseIndex].code,
                responseHeaders[testCaseIndex].message);
            if (responseBodies[testCaseIndex]) {
                res.write(JSON.stringify(responseBodies[testCaseIndex]));
            }
        }
    }
    res.end();
}

describe('v2 auth tests with mockup server', function tests() {
    let server;
    let client;

    beforeEach('start server', done => {
        server = http.createServer(handler).listen(8500);
        client = new IAMClient('127.0.0.1', 8500);
        done();
    });

    afterEach('stop server', () => { server.close(); });

    testNames.forEach(function testHandler(currentValue, testIndex) {
        it(testNames[testIndex], done => {
            client.verifySignatureV2(stringsToSign[testIndex],
                signaturesFromRequest[testIndex],
                accessKeys[testIndex],
                { algo: hashAlgorithms[testIndex] },
                (err, response) => {
                    assert.deepStrictEqual(err, expectedErrors[testIndex]);
                    assert.deepStrictEqual(
                        response,
                        expectedResponseBodies[testIndex]);
                    done();
                });
        });
    });
});
