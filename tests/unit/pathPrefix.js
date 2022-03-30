'use strict'; // eslint-disable-line

const assert = require('assert');
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
