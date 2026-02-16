'use strict';

const assert = require('assert');
const { createHmac, createHash } = require('crypto');
const http = require('http');
const IAMClient = require('../../lib/IAMClient');

const path = '/_/test';
const roleArn = 'arn:aws:iam::123456789:role/test';
const roleSessionName = 'foo';

function handler(req, res) {
    if (req.url === path) {
        res.writeHead(200);
        return res.end();
    }
    res.writeHead(400);
    return res.end();
}

describe('path prefix test with path parameter set', () => {
    let server;
    let client;

    beforeEach('start server', done => {
        server = http.createServer(handler).listen(8500, () => {
            client = new IAMClient('127.0.0.1', 8500, undefined, undefined,
                undefined, undefined, undefined, undefined, undefined,
                undefined, path);
            done();
        }).on('error', done);
    });

    afterEach('stop server', () => { server.close(); });

    it('should send a request with the set path', done => {
        client.assumeRoleBackbeat(roleArn, roleSessionName, { reqUid: '1' },
            err => {
                assert.strictEqual(err, null);
                done();
            });
    });
});

// When a proxyPath is set (e.g. '/_/backbeat/iam'), the HTTP request
// is sent to that path for nginx routing, but the V4 signature must
// be computed with the IAM canonical path '/' — which is what Vault
// verifies against. A mismatch causes InvalidAccessKeyId (VLTCLT-37).
describe('V4 signature with proxyPath must use IAM canonical path', () => {
    const proxyPath = '/_/backbeat/iam';
    const iamCanonicalPath = '/';
    const accessKey = 'TESTACCESSKEY00000001';
    const secretKey = 'testsecretkey000000000000000000000000000001';
    let server;
    let client;

    function sha256(data) {
        return createHash('sha256').update(data, 'utf8').digest('hex');
    }

    function hmac(data, key) {
        return createHmac('sha256', key).update(data, 'utf8').digest();
    }

    // Simplified AWS Signature V4 verification. Recomputes the expected
    // signature using the given canonicalPath.
    // Reference: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv.html
    function computeExpectedSignature(req, canonicalPath) {
        const authHeader = req.headers.authorization;
        assert(authHeader,
            'request must include Authorization header (admin credentials)');

        const credMatch = authHeader.match(
            /Credential=([^/]+)\/(\d{8})\/([^/]+)\/(\w+)\/aws4_request/);
        assert(credMatch, 'Authorization header must contain valid Credential');
        const [, , date, region, service] = credMatch;

        const signedHeaders = authHeader
            .match(/SignedHeaders=([^,]+)/)[1].split(';');

        const headersStr = signedHeaders
            .map(h => `${h}:${req.headers[h]}`).join('\n');
        const payloadHash = req.headers['x-amz-content-sha256'];

        const canonicalReq = [
            req.method, canonicalPath, '',
            `${headersStr}\n`,
            signedHeaders.join(';'),
            payloadHash,
        ].join('\n');

        const stringToSign = [
            'AWS4-HMAC-SHA256',
            req.headers['x-amz-date'],
            `${date}/${region}/${service}/aws4_request`,
            sha256(canonicalReq),
        ].join('\n');

        const kDate = hmac(date, `AWS4${secretKey}`);
        const kRegion = hmac(region, kDate);
        const kService = hmac(service, kRegion);
        const kSigning = hmac('aws4_request', kService);
        return createHmac('sha256', kSigning)
            .update(stringToSign, 'utf8').digest('hex');
    }

    function getClientSignature(req) {
        const match = req.headers.authorization.match(
            /Signature=([a-f0-9]+)/);
        assert(match, 'Authorization header must contain Signature');
        return match[1];
    }

    beforeEach('start server', done => {
        server = http.createServer((req, res) => {
            req.on('data', () => {});
            req.on('end', () => {
                const clientSig = getClientSignature(req);
                const expectedSig =
                    computeExpectedSignature(req, iamCanonicalPath);
                if (clientSig !== expectedSig) {
                    res.writeHead(403);
                    res.end(JSON.stringify({
                        ErrorResponse: { Error: {
                            Code: 'InvalidAccessKeyId',
                            Message: 'Signature mismatch',
                        } },
                    }));
                    return;
                }
                res.writeHead(200);
                res.end(JSON.stringify({ accounts: [] }));
            });
        }).listen(8500, () => {
            client = new IAMClient('127.0.0.1', 8500,
                undefined, undefined, undefined, undefined, undefined,
                accessKey, secretKey, undefined, proxyPath);
            done();
        }).on('error', done);
    });

    afterEach('stop server', () => server.close());

    it('should sign with "/" so Vault signature check succeeds', done => {
        client.listAccounts({}, (err, data) => {
            assert.ifError(err);
            assert(data, 'should return response data');
            done();
        });
    });
});
