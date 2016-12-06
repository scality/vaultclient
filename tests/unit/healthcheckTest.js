'use strict'; // eslint-disable-line

const assert = require('assert');
const http = require('http');
const IAMClient = require('../../lib/IAMClient.js');

function handler(req, res) {
    res.writeHead(200);
    return res.end();
}

describe('healthcheck test', () => {
    let server;
    let client;

    beforeEach('start server', done => {
        server = http.createServer(handler).listen(8500, () => {
            client = new IAMClient('127.0.0.1', 8500);
            done();
        }).on('error', done);
    });

    afterEach('stop server', () => { server.close(); });

    it('should return 200 on request', done => {
        client.healthcheck(null, (err, obj, resCode) => {
            assert.deepStrictEqual(err, null);
            assert.deepStrictEqual(resCode, 200);
            done();
        });
    });
});
