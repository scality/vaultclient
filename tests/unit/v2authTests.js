'use strict'; // eslint-disable-line

const { errors } = require('arsenal');
const assert = require('assert');
const http = require('http');
const querystring = require('querystring');
const IAMClient = require('../../lib/IAMClient');

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

const responseBodies = [
    correctDictResponse,
    null,
];

// eslint-disable-next-line consistent-return
function processRequest(requestObject) {
    for (let i = 0; i < stringsToSign.length; i += 1) {
        if (requestObject.stringToSign === stringsToSign[i]
            && requestObject.accessKey === accessKeys[i]
            && requestObject.signatureFromRequest === signaturesFromRequest[i]
            && requestObject.hashAlgorithm === hashAlgorithms[i]) {
            return i;
        }
    }
    return null;
}

function handler(req, res) {
    if (req.method === 'GET') {
        const index = req.url.indexOf('?');
        const data = querystring.parse(req.url.substring(index + 1));
        const testCaseIndex = processRequest(data);
        if (typeof testCaseIndex === 'number') {
            if (testCaseIndex === 0) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
            } else {
                res.writeHead(400, { 'Content-Type': 'text/xml ' });
                res.write(
                    '<ErrorResponse><Error><Code>Forbidden</Code>'
                    + '</Error></ErrorResponse>',
                );
            }
            if (responseBodies[testCaseIndex] !== undefined) {
                res.write(JSON.stringify(responseBodies[testCaseIndex]));
            }
        }
    }
    res.end();
}

describe('v2 auth tests with mockup server', () => {
    let server;
    let client;

    beforeEach('start server', done => {
        server = http.createServer(handler).listen(8500, () => {
            client = new IAMClient('127.0.0.1', 8500);
            done();
        }).on('error', done);
    });

    afterEach('stop server', () => { server.close(); });

    testNames.forEach((currentValue, testIndex) => {
        it(testNames[testIndex], done => {
            client.verifySignatureV2(stringsToSign[testIndex],
                signaturesFromRequest[testIndex],
                accessKeys[testIndex],
                { algo: hashAlgorithms[testIndex] },
                (err, response) => {
                    assert.deepStrictEqual(err ? err.code : undefined,
                        expectedErrors[testIndex] ? expectedErrors[testIndex].type : undefined);
                    assert.deepStrictEqual(response
                        ? response.message.body : response,
                    expectedResponseBodies[testIndex]);
                    done();
                });
        });
    });
});
