'use strict'; // eslint-disable-line

const assert = require('assert');
const http = require('http');
const IAMClient = require('../../lib/IAMClient');

const encryptionKeyId = '9c07eb04-d85a-48c4-8bc4-87f5ca2b9d5d';
const canonicalId = '79a59dfb37cfe5b3b1b4e58734c14e02b6e9e081ca135a3b02e6b8cc993b6dc7';

const output = {
    canonicalId,
    encryptionKeyId,
    action: 'created',
};

describe('getOrCreateEncryptionKeyId Test', () => {
    let server;
    let client;
    const handler = (req, res) => {
        res.writeHead(200);
        return res.end(JSON.stringify(output));
    };

    beforeEach('start server', done => {
        server = http.createServer(handler).listen(8500, () => {
            client = new IAMClient('127.0.0.1', 8500);
            done();
        }).on('error', done);
    });

    afterEach('stop server', () => { server.close(); });

    it('should retrieve getOrCreateEncryptionKeyId response', done => {
        client.getOrCreateEncryptionKeyId(canonicalId,
            { reqUid: '123' },
            (err, response) => {
                assert(!err);
                assert.deepStrictEqual(response.message.body, output);
                done();
            });
    });

    it('should throw error if canonical id is undefined', () => {
        assert.throws(
            () => client.getOrCreateEncryptionKeyId(undefined, { reqUid: '123' }, () => {}), err => {
                assert(err instanceof assert.AssertionError);
                assert.strictEqual(err.message, 'canonicalId need to be specified');
                return true;
            },
        );
    });

    it('should throw error if canonical id is not a string', () => {
        assert.throws(
            () => client.getOrCreateEncryptionKeyId(0, { reqUid: '123' }, () => {}), err => {
                assert(err instanceof assert.AssertionError);
                assert.strictEqual(err.message, 'canonicalId should be a string');
                return true;
            },
        );
    });

    it('should throw error if canonical id is an empty string', () => {
        assert.throws(
            () => client.getOrCreateEncryptionKeyId('', { reqUid: '123' }, () => {}), err => {
                assert(err instanceof assert.AssertionError);
                assert.strictEqual(err.message, 'canonicalId should not be empty string');
                return true;
            },
        );
    });
});

describe('getOrCreateEncryptionKeyId with server error', () => {
    let server;
    let client;
    const erroredHandler = (req, res) => {
        res.writeHead(200);
        const serverError = '<ErrorResponse xmlns="https://iam.amazonaws.com/doc/2010-05-08/">'
        + '<Error><Code>ServiceFailure</Code><Message>Server error: the request processing has '
        + 'failed because of an unknown error, exception or failure.</Message></Error>'
        + '<RequestId>3ac25e70c649bd4a6394:897ac94c0240b2a65f96</RequestId></ErrorResponse>';
        return res.end(serverError);
    };

    beforeEach('start server', done => {
        server = http.createServer(erroredHandler).listen(8500, () => {
            client = new IAMClient('127.0.0.1', 8500);
            done();
        }).on('error', done);
    });

    afterEach('stop server', () => { server.close(); });

    it('should return an error', done => {
        client.getOrCreateEncryptionKeyId(canonicalId,
            { reqUid: '123' },
            (err, response) => {
                assert(!err);
                assert(response.message.body.ErrorResponse);
                done();
            });
    });
});
