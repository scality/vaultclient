'use strict'; // eslint-disable-line

const assert = require('assert');
const http = require('http');

const IAMClient = require('../../lib/IAMClient');

describe('list-accounts', () => {
    let server;
    let client;

    before('start server', done => {
        server = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/javascript' });
            res.end('{}');
        })
            .on('error', done)
            .listen(8500, () => {
                done();
            });
        client = new IAMClient('127.0.0.1', 8500);
    });

    after('stop server', () => { server.close(); });

    [
        ['marker', -1, 'Marker must be >= 0'],
        ['marker', 'test', 'Marker must be a number'],
        ['maxItems', '6', 'maxItems need to be a number'],
        ['maxItems', parseInt('test', 10), 'maxItems must be a number'],
        ['maxItems', 0,
            'maxItems need to be a value between 1 and 1000 included'],
        ['maxItems', 1500,
            'maxItems need to be a value between 1 and 1000 included'],
    ].forEach(test => {
        // eslint-disable-next-line consistent-return
        it(`invalid param ${test[0]}(${test[1]})`, next => {
            try {
                return client.listAccounts({
                    [test[0]]: test[1],
                }, () => {
                    assert(false,
                        `Param ${test[0]} is invalid, must be caught`);
                });
            } catch (e) {
                assert.deepStrictEqual(e.message,
                    test[2]);
                return next();
            }
        });
    });
});
