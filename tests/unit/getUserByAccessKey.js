/* eslint-disable operator-linebreak */
'use strict'; // eslint-disable-line

const assert = require('assert');
const http = require('http');
const { errors } = require('arsenal');
const querystring = require('querystring');
const IAMClient = require('../../lib/IAMClient');


const testUserId = 'testUserId';
const testAccessKey = 'testAccessKey';
const testSecretKey = 'testSecretKey';
const notExistingAccessKey = 'notExistingAccessKey';

const serverDB = {
    [testAccessKey]: {
        id: testAccessKey,
        value: testSecretKey,
        createDate: '2022-08-11T17:57:00Z',
        status: 'Active',
        userId: testUserId,
    },
    [testUserId]: {
        arn: 'arn:aws:iam::405435207934:user/bart',
        id: testUserId,
        emailAddress: '',
        name: 'bart',
        createDate: '2022-08-11T17:57:00Z',
        parentId: '405435207934',
    },
};

function handler(req, res) {
    const index = req.url.indexOf('?');
    const data = querystring.parse(req.url.substring(index + 1));

    let output = null;
    try {
        res.writeHead(200);
        output = JSON.stringify(serverDB[serverDB[data.accessKey].userId]);
        return res.end(output, null, 4);
    } catch (e) {
        res.writeHead(errors.EntityDoesNotExist.code);
        return res.end(JSON.stringify(errors.EntityDoesNotExist));
    }
}

describe('GetUserByAccessKey with mockup server', () => {
    let server;
    let client;

    beforeEach('start server', done => {
        server = http.createServer(handler).listen(8500);
        client = new IAMClient('127.0.0.1', 8500);
        done();
    });

    afterEach('stop server', () => { server.close(); });

    it('should correctly retrieve user info by accessKey', done => {
        const expectedUser = serverDB[serverDB[testAccessKey].userId];
        client.getUserByAccessKey(testAccessKey, (err, res) => {
            if (err) {
                return done(err);
            }
            assert.deepStrictEqual(res, expectedUser);
            return done();
        });
    });

    it('should return error if accessKey doesn\'t exist', done => {
        client.getUserByAccessKey(notExistingAccessKey, (err, res) => {
            assert(err);
            assert(!res);
            return done();
        });
    });
});
