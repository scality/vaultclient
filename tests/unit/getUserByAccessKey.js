'use strict';

const assert = require('assert');
const http = require('http');
const IAMClient = require('../../lib/IAMClient');
const constants = require('../../lib/constants');
const queryString = require('querystring');

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
    let body = '';
    
    req.on('data', chunk => {
        body += chunk.toString();
    });
    
    req.on('end', () => {
        let data;
        try {
            // Check content-type header to determine parsing method
            const contentType = req.headers['content-type'];
            if (contentType && contentType.includes('application/json')) {
                data = JSON.parse(body);
            } else {
                // Parse as form-encoded data (default for IAMClient POST requests)
                data = queryString.parse(body);
            }
        } catch {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: 'Invalid request data' }));
        }
        
        let output = null;
        try {
            const accessKeyObject = serverDB[data.accessKey];
            const userObject = serverDB[accessKeyObject.userId];
            res.writeHead(200);
            output = JSON.stringify(userObject);
            return res.end(output, null, 4);
        } catch {
            res.writeHead(constants.EntityDoesNotExist.code);
            return res.end(JSON.stringify({
                code: 404,
                description: constants.EntityDoesNotExist.description,
            }));
        }
    });
}

describe('GetUserByAccessKey with mockup server', () => {
    let server;
    let client;

    beforeEach('start server', done => {
        server = http.createServer(handler).listen(8500);
        client = new IAMClient('127.0.0.1', 8500);
        client.accessKey = testAccessKey;
        client.secretKeyValue = testSecretKey;
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
