'use strict';

const assert = require('assert');
const { createHmac, createHash } = require('crypto');
const http = require('http');
const IAMClient = require('../../lib/IAMClient');

const accessKey = 'TESTACCESSKEY00000001';
const secretKey = 'testsecretkey000000000000000000000000000001';

function sha256(data) {
    return createHash('sha256').update(data, 'utf8').digest('hex');
}

function hmac(data, key) {
    return createHmac('sha256', key).update(data, 'utf8').digest();
}

function getSignedHeaders(req) {
    return req.headers.authorization.match(/SignedHeaders=([^,]+)/)[1].split(';');
}

// the headers Vault refuses to see unsigned on a signed request
function getUnsignedProtectedHeaders(req) {
    const signedHeaders = getSignedHeaders(req);
    return Object.keys(req.headers).filter(
        h =>
            (h.startsWith('x-amz-') || h.startsWith('x-scal-')) &&
            h !== 'x-amz-content-sha256' &&
            !signedHeaders.includes(h),
    );
}

// simplified AWS Signature V4 check, on the signed headers only
function isSignatureValid(req) {
    const authHeader = req.headers.authorization;
    const [, , date, region, service] = authHeader.match(/Credential=([^/]+)\/(\d{8})\/([^/]+)\/(\w+)\/aws4_request/);
    const signedHeaders = getSignedHeaders(req);
    const canonicalReq = [
        req.method,
        '/',
        '',
        `${signedHeaders.map(h => `${h}:${req.headers[h]}`).join('\n')}\n`,
        signedHeaders.join(';'),
        req.headers['x-amz-content-sha256'],
    ].join('\n');
    const stringToSign = [
        'AWS4-HMAC-SHA256',
        req.headers['x-amz-date'],
        `${date}/${region}/${service}/aws4_request`,
        sha256(canonicalReq),
    ].join('\n');
    const kSigning = hmac('aws4_request', hmac(service, hmac(region, hmac(date, `AWS4${secretKey}`))));
    const expected = createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');
    return authHeader.endsWith(`Signature=${expected}`);
}

describe('signed requests', () => {
    let server;
    let client;
    let received;

    beforeEach('start server', done => {
        received = null;
        server = http
            .createServer((req, res) => {
                req.on('data', () => {});
                req.on('end', () => {
                    received = req;
                    res.writeHead(200);
                    res.end(JSON.stringify([{ canId: 'canId1', id: '123456789012' }]));
                });
            })
            .listen(0, '127.0.0.1', () => {
                client = new IAMClient(
                    '127.0.0.1',
                    server.address().port,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    accessKey,
                    secretKey,
                ).enableIAMOnAdminRoutes();
                done();
            })
            .on('error', done);
    });

    afterEach('stop server', () => server.close());

    it('should sign the request uids header', done => {
        client.getAccountIds(['canId1'], { reqUid: 'req-uid-1' }, err => {
            assert.ifError(err);
            assert.strictEqual(received.headers['x-scal-request-uids'], 'req-uid-1');
            assert(getSignedHeaders(received).includes('x-scal-request-uids'));
            assert.deepStrictEqual(getUnsignedProtectedHeaders(received), []);
            assert(isSignatureValid(received));
            done();
        });
    });

    it('should sign only the usual headers without a request uid', done => {
        client.getAccountIds(['canId1'], {}, err => {
            assert.ifError(err);
            assert.strictEqual(received.headers['x-scal-request-uids'], undefined);
            assert.deepStrictEqual(getSignedHeaders(received), ['host', 'x-amz-content-sha256', 'x-amz-date']);
            assert(isSignatureValid(received));
            done();
        });
    });
});
