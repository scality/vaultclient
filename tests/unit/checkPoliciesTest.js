'use strict'; // eslint-disable-line

const assert = require('assert');
const http = require('http');
const IAMClient = require('../../lib/IAMClient');

const output = [{ isAllowed: true, arn: 'arn:aws:s3:::policybucket/obj' }];
const requestContextParams = {
    constantParams: {
        headers: '',
        query: '',
        generalResource: 'policybucket',
        specificResource: 'obj',
        requesterIp: '',
        sslEnabled: '',
        apiMethod: 'objectDelete',
        awsService: 's3',
        locationConstraint: null,
        requesterInfo: '',
        signatureVersion: '',
        authType: '',
        signatureAge: '',
    },
};
const userArn = 'arn:aws:iam::153456779012:user/Claude';


function handler(req, res) {
    res.writeHead(200);
    return res.end(JSON.stringify(output));
}

describe('checkPolicies Test', () => {
    let server;
    let client;

    beforeEach('start server', done => {
        server = http.createServer(handler).listen(8500, () => {
            client = new IAMClient('127.0.0.1', 8500);
            done();
        }).on('error', done);
    });

    afterEach('stop server', () => { server.close(); });

    it('should retrieve checkPolicies response', done => {
        client.checkPolicies(requestContextParams, userArn,
            { reqUid: '123' },
            (err, response) => {
                assert.deepStrictEqual(response.message.body, output);
                done();
            });
    });
});
