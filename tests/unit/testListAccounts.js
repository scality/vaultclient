'use strict'; // eslint-disable-line

const assert = require('assert');
const http = require('http');

const IAMClient = require('../../lib/IAMClient.js');

describe('list-accounts', () => {
    let server;
    let client;

    before('start server', done => {
        server = http.createServer((req, res) => {
            res.end(JSON.stringify({
                url: req.url,
                data: JSON.parse(req.headers.additionaldata),
            }));
        })
        .on('error', done)
        .listen(8500, () => {
            done();
        });
        client = new IAMClient('127.0.0.1', 8500);
    });

    after('stop server', () => { server.close(); });

    it('checking request', done => {
        client.listAccounts({
            maxItems: 6,
            marker: '0',
        }, (err, res) => {
            assert.deepStrictEqual(res.data, {
                maxItems: 6,
                marker: '0',
            });
            assert.deepStrictEqual(res.url, '/accounts');
            done();
        });
    });

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
        it(`invalid param ${test[0]}(${test[1]})`, next => {
            try {
                client.listAccounts({
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
