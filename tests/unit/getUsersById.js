/* eslint-disable operator-linebreak */
'use strict'; // eslint-disable-line

const assert = require('assert');
const { errors } = require('arsenal');
const http = require('http');
const querystring = require('querystring');
const IAMClient = require('../../lib/IAMClient.js');


const userId1 = 'userId1';
const userId2 = 'userId2';
const userId3 = 'userId3';
const userBadId = 'userBadId';

const serverDB = {
    [userId1]: {
        arn: 'arn:aws:iam::405435207934:user/bart',
        id: userId1,
        emailAddress: '',
        name: 'bart',
        createDate: '2021-09-20T19:35:34Z',
        parentId: '405435207934',
    },
    [userId2]: {
        arn: 'arn:aws:iam::405435207934:user/lisa',
        id: userId2,
        emailAddress: '',
        name: 'lisa',
        createDate: '2021-09-20T19:35:35Z',
        parentId: '405435207934',
    },
    [userId3]: {
        arn: 'arn:aws:iam::405435207934:user/london',
        id: userId3,
        emailAddress: '',
        name: 'london',
        createDate: '2021-09-20T19:35:36Z',
        parentId: '405435207934',
    },
};

function handler(req, res) {
    const index = req.url.indexOf('?');
    const data = querystring.parse(req.url.substring(index + 1));
    let inputArray = data.userIds;
    if (!Array.isArray(inputArray)) {
        inputArray = [inputArray];
    }

    if (inputArray.indexOf(userBadId) !== -1) {
        res.writeHead(errors.InvalidParameterValue.code);
        return res.end(JSON.stringify(errors.InvalidParameterValue));
    }
    const output = [];
    inputArray.forEach(id => output.push(serverDB[id]));
    res.writeHead(200);
    return res.end(JSON.stringify(output), null, 4);
}

describe('GetUsersById with mockup server', () => {
    let server;
    let client;

    beforeEach('start server', done => {
        server = http.createServer(handler).listen(8500);
        client = new IAMClient('127.0.0.1', 8500);
        done();
    });

    afterEach('stop server', () => { server.close(); });

    it('should correctly retrieve user info', done => {
        const userIds = [userId1, userId2, userId3];
        const expectedRes = userIds.map(id => serverDB[id]);
        client.getUsersById(userIds, {}, (err, res) => {
            if (err) {
                return done(err);
            }
            assert.deepStrictEqual(res.message.body, expectedRes);
            return done();
        });
    });

    it('should return error when server returns an error', done => {
        const userIds = [userId1, userId2, userId3, userBadId];
        client.getUsersById(userIds, {}, (err, value) => {
            assert(err);
            assert(!value);
            return done();
        });
    });
});
