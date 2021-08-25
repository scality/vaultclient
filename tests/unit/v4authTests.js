'use strict'; // eslint-disable-line

const assert = require('assert');
const http = require('http');
const querystring = require('querystring');
const { createHmac } = require('crypto');

const IAMClient = require('../../lib/IAMClient.js');

function handler(req, res) {
    const index = req.url.indexOf('?');
    const data = querystring.parse(req.url.substring(index + 1));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify(data));
    res.end();
}

function hmac(stringToSign, key) {
    return createHmac('sha256', key).update(stringToSign, 'binary').digest();
}

describe('IAMClient verifySignatureV4', () => {
    let server;
    let client;
    const invalidRegions = ['', '  ', undefined, null];
    const accessKey = 'accessKey';
    const signature = hmac('signature', 'secret').toString('hex');
    const scopeDate = '20201010';
    const defaultRegion = 'us-east-1';

    beforeEach('start server', done => {
        server = http.createServer(handler).listen(8500, () => {
            client = new IAMClient('127.0.0.1', 8500);
            done();
        }).on('error', done);
    });

    afterEach('stop server', () => { server.close(); });

    invalidRegions.forEach(region => {
        it('should set and use default region when invalid region is provided',
            done => {
                client.verifySignatureV4('signature', signature, accessKey,
                    region, scopeDate, { reqUid: 'requid' }, (err, resp) => {
                        assert.ifError(err);
                        assert(resp);
                        const responseBody = resp.message.body;
                        assert.strictEqual(responseBody.region, defaultRegion);
                        done();
                    });
            });
    });

    it('should use the provided region if it is valid', done => {
        const region = 'us-west-1';
        client.verifySignatureV4('signature', signature, accessKey,
            region, scopeDate, { reqUid: 'requid' }, (err, resp) => {
                assert.ifError(err);
                assert(resp);
                const responseBody = resp.message.body;
                assert.strictEqual(responseBody.region, region);
                done();
            });
    });
});
