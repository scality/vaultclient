'use strict'; // eslint-disable-line
// const http = require('http');
const assert = require('assert');
const errors = require('arsenal').errors;
const IAMClient = require('../../lib/IAMClient.js');

const log = { error() {} };
const res = { statusCode: 400 };
const ret = '<Response><Code>foo</Code></Response>';
const expErr = errors.InternalError
    .customizeDescription('unable to translate error from vault');

describe('handling unrecognized error syntax', () => {
    let client;

    beforeEach('create client', () => {
        client = new IAMClient('127.0.0.1');
    });

    afterEach('delete client', () => { client = undefined; });

    it('should return Internal Error for unrecognized errors', done => {
        client.handleResponse(res, ret, log, err => {
            assert.deepStrictEqual(err, expErr);
            return done();
        });
    });
});
