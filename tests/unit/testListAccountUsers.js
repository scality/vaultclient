'use strict'; // eslint-disable-line

const assert = require('assert');
const http = require('http');

const IAMClient = require('../../lib/IAMClient.js');

describe('list-account-users', () => {
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
        client.listAccountUsers('test', {
            maxItems: '6',
        }, (err, res) => {
            assert.deepStrictEqual(res.data, {
                name: 'test',
                maxItems: 6,
            });
            assert.deepStrictEqual(res.url, '/users');
            client.listAccountUsers('test', {
                pathPrefix: '/user',
                marker: '1',
            }, (err, res) => {
                assert.deepStrictEqual(res.data, {
                    name: 'test',
                    marker: '1',
                    pathPrefix: '/user',
                });
                assert.deepStrictEqual(res.url, '/users');
                done();
            });
        });
    });

    [
        ['marker', '', 'Marker cannot be empty'],
        ['marker', new Date(), 'marker need to be a string'],
        ['maxItems', 6, 'maxItems need to be a string'],
        ['maxItems', 'test', 'maxItems is not a number'],
        ['maxItems', '0',
            'maxItems need to be a value between 1 and 1000 included'],
        ['maxItems', '1500',
            'maxItems need to be a value between 1 and 1000 included'],
        ['pathPrefix', '',
            'pathPrefix cannot be empty and need start with \'/\''],
        ['pathPrefix', 6, 'pathPrefix need to be a string'],
    ].forEach(test => {
        it(`invalid param ${test[0]}`, next => {
            try {
                client.listAccountUsers('test', {
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
