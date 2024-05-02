'use strict'; // eslint-disable-line
// const http = require('http');
const assert = require('assert');
const IAMClient = require('../../lib/IAMClient');
const { InternalError } = require('arsenal/build/lib/errors/arsenalErrors');

const log = { error() {} };
const res = { statusCode: 400 };
const ret = '<Response><Code>foo</Code></Response>';

describe('handling unrecognized error syntax', () => {
    let client;

    beforeEach('create client', () => { client = new IAMClient('127.0.0.1'); });

    afterEach('delete client', () => { client = undefined; });

    it('should return Internal Error for unrecognized errors', done => {
        client.handleResponse(res, ret, log, err => {
            assert.strictEqual(err.code, InternalError.code);
            assert.strictEqual(err.description, InternalError.description);
            return done();
        });
    });
});
