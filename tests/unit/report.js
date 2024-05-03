'use strict'; // eslint-disable-line

const assert = require('assert');
const http = require('http');
const IAMClient = require('../../lib/IAMClient');

function handler(req, res) {
    const reportData = { account: '10' };
    res.writeHead(200);
    res.end(JSON.stringify(reportData));
}

describe('report test', () => {
    let server;
    let client;

    beforeEach('start server', done => {
        server = http.createServer(handler).listen(8500, () => {
            client = new IAMClient('127.0.0.1', 8500);
            done();
        }).on('error', done);
    });

    afterEach('stop server', () => { server.close(); });

    it('should return report data on request', done => {
        client.report(null, (err, data) => {
            assert.deepStrictEqual(err, null);
            assert.deepStrictEqual(data, { account: '10' });
            done();
        });
    });
});
