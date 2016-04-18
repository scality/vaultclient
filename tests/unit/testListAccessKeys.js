'use strict'; // eslint-disable-line

const assert = require('assert');
const http = require('http');

const IAMClient = require('../../lib/IAMClient.js');

describe('list-access-keys', () => {
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
        client.listAccessKeys('test', {
            maxItems: 6,
        }, (err, res) => {
            assert.deepStrictEqual(res.data, {
                accountName: 'test',
                maxItems: 6,
            });
            assert.deepStrictEqual(res.url, '/accessKeys');
            client.listAccessKeys('test', {
                marker: 1,
                userName: 'testUser',
            }, (err, res) => {
                assert.deepStrictEqual(res.data, {
                    accountName: 'test',
                    marker: '1',
                    name: 'testUser',
                });
                assert.deepStrictEqual(res.url, '/accessKeys');
                done();
            });
        });
    });

    [
        ['userName', 6, 'userName must be a string'],
        ['marker', new Date(), 'marker need to be a number'],
        ['marker', -1, 'marker must be >= 0'],
        ['maxItems', '6', 'maxItems need to be a number'],
        ['maxItems', 0,
            'maxItems need to be a value between 1 and 1000 included'],
        ['maxItems', 1500,
            'maxItems need to be a value between 1 and 1000 included'],
    ].forEach(test => {
        it(`invalid param ${test[0]}`, next => {
            try {
                client.listAccessKeys('test', {
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
