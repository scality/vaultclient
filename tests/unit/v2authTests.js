'use strict'; // eslint-disable-line

const assert = require('assert');
const http = require('http');
const errorCodes = require('../../lib/ErrorCodes');
const IAMClient = require('../../lib/IAMClient.js');

const correctDict = {
    stringToSign: `PUT\n\n\nMon, 21 Dec 2015 21:49:31 +0000\n/asdf2`,
    accessKey: 'A2ZW96Q7MZY30RFI4UK2',
    signatureFromRequest: 'EyjCLdnaFhCmMCOGS1+8SYObqK8=',
    hashAlgorithm: 'sha1',
};

const correctDictResponse = {
    arn: 'arn:aws:iam::379763717565:/TestAccount/',
    canonicalID:
        'QHATANHGDQHBM8OP0U4J5T952BFH33TSOY3XLYELKB1U5CAB547FKR0KUQ4CE3IK',
    shortid: '379763717565',
    email: 'test.account@test.com',
    accountDisplayName: 'TestAccount',
};

const wrongSigDict = {
    stringToSign: `PUT\n\n\nMon, 21 Dec 2015 21:49:31 +0000\n/asdf2`,
    accessKey: 'A2ZW96Q7MZY30RFI4UK2',
    signatureFromRequest: 'wrongSig',
    hashAlgorithm: 'sha1',
};

const wrongSigError = new Error();
wrongSigError.code = errorCodes.Forbidden.code;
wrongSigError.message = errorCodes.Forbidden.message;


function compareObjects(object1, object2) {
    const keys = Object.keys(object1);
    return keys.every((key)=> {
        return object1[key] === object2[key];
    });
}

function makeResponse(res, code, message) {
    res.statusCode = code;
    res.message = message;
}

function handler(req, res) {
    if (req.method === 'GET' && req.url === `/auth/v2`) {
        if (compareObjects(JSON
            .parse(req.headers.additionaldata), correctDict)) {
            makeResponse(res, 200, 'Authentication successful');
            res.write(JSON.stringify(correctDictResponse));
        } else if (compareObjects(JSON
            .parse(req.headers.additionaldata), wrongSigDict)) {
            makeResponse(res,
                errorCodes.Forbidden.code,
                errorCodes.Forbidden.message);
            res.write(JSON.stringify(errorCodes.Forbidden));
        }
    }
    res.end();
}

describe('Unit tests with mockup server', function tests() {
    let server;
    let client;

    beforeEach('start server', done => {
        server = http.createServer(handler).listen(8500);
        client = new IAMClient('127.0.0.1', 8500);
        done();
    });

    afterEach('stop server', () => { server.close(); });

    it('should authenticate correct v2 request', done => {
        client.verifySignatureV2(correctDict.stringToSign,
            correctDict.signatureFromRequest,
            correctDict.accessKey,
            { algo: correctDict.hashAlgorithm },
            (err, response) => {
                if (err) {
                    return done(err);
                }
                assert.deepStrictEqual(response, correctDictResponse);
                done();
            });
    });

    it('should send error if signature is incorrect', done => {
        client.verifySignatureV2(wrongSigDict.stringToSign,
            wrongSigDict.signatureFromRequest,
            wrongSigDict.accessKey,
            { algo: wrongSigDict.hashAlgorithm },
            (err) => {
                assert.deepStrictEqual(err, wrongSigError);
                done();
            });
    });
});
