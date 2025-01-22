'use strict'; // eslint-disable-line

const assert = require('assert');
const http = require('http');
const querystring = require('querystring');
const { createHmac } = require('crypto');
const sinon = require('sinon');

const IAMClient = require('../../lib/IAMClient');
const VaultClient = require('../../lib/IAMClient');

function handler(req, res) {
    if (req.method === 'POST' && req.headers['content-type'] === 'application/json') {
        let body = '';

        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', () => {
            const data = JSON.parse(body);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify(data));
            res.end();
        });
    } else {
        const index = req.url.indexOf('?');
        const data = querystring.parse(req.url.substring(index + 1));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify(data));
        res.end();
    }
}

function hmac(stringToSign, key) {
    return createHmac('sha256', key).update(stringToSign, 'binary').digest();
}

describe('IAMClient verifySignatureV4', () => {
    let server;
    let client;
    const invalidRegions = [undefined, null];
    const accessKey = 'accessKey';
    const signature = hmac('signature', 'secret').toString('hex');
    const scopeDate = '20201010';
    const noRegion = '';

    beforeEach('start server', done => {
        server = http.createServer(handler).listen(8500, () => {
            client = new IAMClient('127.0.0.1', 8500);
            done();
        }).on('error', done);
    });

    afterEach('stop server', () => { server.close(); });

    invalidRegions.forEach(region => {
        it('should set no region when invalid region is provided',
            done => {
                client.verifySignatureV4('signature', signature, accessKey,
                    region, scopeDate, { reqUid: 'requid' }, (err, resp) => {
                        assert.ifError(err);
                        assert(resp);
                        const responseBody = resp.message.body;
                        assert.strictEqual(responseBody.region, noRegion);
                        done();
                    });
            });

        it('should set no region when invalid region is provided (get)',
            done => {
                client.verifySignatureV4('signature', signature, accessKey,
                    region, scopeDate, { reqUid: 'requid', get: true }, (err, resp) => {
                        assert.ifError(err);
                        assert(resp);
                        const responseBody = resp.message.body;
                        assert.strictEqual(responseBody.region, noRegion);
                        done();
                    });
            });
    });
});

describe('VerifySignatureV4 Response Parsing', () => {
    let client;
    let requestStub;

    beforeEach(() => {
        client = new VaultClient('127.0.0.1', 8500);
        requestStub = sinon.stub(client, 'request');
    });

    afterEach(() => {
        sinon.restore();
    });

    const testParams = {
        stringToSign: 'stringToSign',
        signature: 'signature',
        accessKey: 'accessKey',
        scopeDate: '20201010',
        region: 'us-east-1',
        options: { reqUid: 'requid' },
    };

    it('should properly parse accountQuota.quota as bigint from response', done => {
        const mockResponse = {
            userInfo: {
                arn: 'arn:aws:iam::123456789012:user/test',
                accountId: '123456789012',
                userId: 'AIDAJQABLZS4A3QDU576Q',
            },
            authorizationResults: {
                's3:PutObject': 'Allow',
            },
            accountQuota: {
                account: '123456789012',
                quota: '9007199254740992',
            },
        };

        requestStub.callsFake((method, path, auth, callback) => {
            callback(null, mockResponse, 200);
        });

        client.verifySignatureV4(
            testParams.stringToSign,
            testParams.signature,
            testParams.accessKey,
            testParams.region,
            testParams.scopeDate,
            testParams.options,
            (err, response) => {
                assert.ifError(err);
                assert(response.message.body.accountQuota);
                assert.strictEqual(typeof response.message.body.accountQuota.quota, 'bigint');
                assert.strictEqual(
                    response.message.body.accountQuota.quota,
                    BigInt('9007199254740992')
                );
                done();
            }
        );
    });

    it('should handle null quota in response', done => {
        const mockResponse = {
            userInfo: {
                arn: 'arn:aws:iam::123456789012:user/test',
            },
            authorizationResults: {},
            accountQuota: {
                account: '123456789012',
                quota: null,
            },
        };

        requestStub.callsFake((method, path, auth, callback) => {
            callback(null, mockResponse, 200);
        });

        client.verifySignatureV4(
            testParams.stringToSign,
            testParams.signature,
            testParams.accessKey,
            testParams.region,
            testParams.scopeDate,
            testParams.options,
            (err, response) => {
                assert.ifError(err);
                assert(response.message.body.accountQuota);
                assert.strictEqual(typeof response.message.body.accountQuota.quota, 'bigint');
                assert.strictEqual(response.message.body.accountQuota.quota, BigInt(0));
                done();
            }
        );
    });

    it('should handle undefined accountQuota in response', done => {
        const mockResponse = {
            userInfo: {
                arn: 'arn:aws:iam::123456789012:user/test',
            },
            authorizationResults: {},
        };

        requestStub.callsFake((method, path, auth, callback) => {
            callback(null, mockResponse, 200);
        });

        client.verifySignatureV4(
            testParams.stringToSign,
            testParams.signature,
            testParams.accessKey,
            testParams.region,
            testParams.scopeDate,
            testParams.options,
            (err, response) => {
                assert.ifError(err);
                assert.deepStrictEqual(response.message.body, mockResponse);
                done();
            }
        );
    });

    it('should handle undefined quota in accountQuota object', done => {
        const mockResponse = {
            userInfo: {
                arn: 'arn:aws:iam::123456789012:user/test',
            },
            authorizationResults: {},
            accountQuota: {
                account: '123456789012',
            },
        };

        requestStub.callsFake((method, path, auth, callback) => {
            callback(null, mockResponse, 200);
        });

        client.verifySignatureV4(
            testParams.stringToSign,
            testParams.signature,
            testParams.accessKey,
            testParams.region,
            testParams.scopeDate,
            testParams.options,
            (err, response) => {
                assert.ifError(err);
                assert(response.message.body.accountQuota);
                assert.strictEqual(typeof response.message.body.accountQuota.quota, 'bigint');
                assert.strictEqual(response.message.body.accountQuota.quota, BigInt(0));
                done();
            }
        );
    });

    it('should preserve other response fields when parsing quota', done => {
        const mockResponse = {
            userInfo: {
                arn: 'arn:aws:iam::123456789012:user/test',
                accountId: '123456789012',
                userId: 'AIDAJQABLZS4A3QDU576Q',
            },
            authorizationResults: {
                's3:PutObject': 'Allow',
                's3:GetObject': 'Deny',
            },
            accountQuota: {
                account: '123456789012',
                quota: '1000',
            },
        };

        requestStub.callsFake((method, path, auth, callback) => {
            callback(null, mockResponse, 200);
        });

        client.verifySignatureV4(
            testParams.stringToSign,
            testParams.signature,
            testParams.accessKey,
            testParams.region,
            testParams.scopeDate,
            testParams.options,
            (err, response) => {
                assert.ifError(err);
                assert.deepStrictEqual(response.message.body.userInfo, mockResponse.userInfo);
                assert.deepStrictEqual(
                    response.message.body.authorizationResults,
                    mockResponse.authorizationResults
                );
                assert.strictEqual(
                    response.message.body.accountQuota.account,
                    mockResponse.accountQuota.account
                );
                assert.strictEqual(
                    response.message.body.accountQuota.quota,
                    BigInt(mockResponse.accountQuota.quota)
                );
                done();
            }
        );
    });

    it('should handle error in response', done => {
        const testError = new Error('Authentication failed');
        testError.code = 'AuthFailure';

        requestStub.callsFake((method, path, auth, callback) => {
            callback(testError);
        });

        client.verifySignatureV4(
            testParams.stringToSign,
            testParams.signature,
            testParams.accessKey,
            testParams.region,
            testParams.scopeDate,
            testParams.options,
            (err, response) => {
                assert.strictEqual(err.code, 'AuthFailure');
                assert.strictEqual(response, undefined);
                done();
            }
        );
    });

    it('should handle large quota values without precision loss', done => {
        const largeQuota = '9007199254740991'; // Maximum safe integer in JavaScript
        const mockResponse = {
            userInfo: {
                arn: 'arn:aws:iam::123456789012:user/test',
            },
            authorizationResults: {},
            accountQuota: {
                account: '123456789012',
                quota: largeQuota,
            },
        };

        requestStub.callsFake((method, path, auth, callback) => {
            callback(null, mockResponse, 200);
        });

        client.verifySignatureV4(
            testParams.stringToSign,
            testParams.signature,
            testParams.accessKey,
            testParams.region,
            testParams.scopeDate,
            testParams.options,
            (err, response) => {
                assert.ifError(err);
                assert.strictEqual(typeof response.message.body.accountQuota.quota, 'bigint');
                assert.strictEqual(
                    response.message.body.accountQuota.quota,
                    BigInt(largeQuota)
                );
                assert.strictEqual(
                    response.message.body.accountQuota.quota.toString(),
                    largeQuota
                );
                done();
            }
        );
    });
});
