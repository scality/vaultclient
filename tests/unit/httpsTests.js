'use strict'; // eslint-disable-line

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const https = require('https');
const errors = require('arsenal').errors;

const IAMClient = require('../../lib/IAMClient.js');

const httpPort = 8500;
const httpsPort = 8600;
const httpsPortTwoWay = 8601;

const accountName = 'account_name';
const accountOptions = { email: 'acc@oun.t', password: 'pwd' };

const expectedResponse = {
    message: {
        code: 201,
        message: 'Created',
        body: {
            arn: 'arn:aws:iam::619305055237:/account0/',
            id: '619305055237',
            canonicalId: 'CER9UNUF89LNFWQCS90RHR0WHTYUW9Q3HY9KBUMSR75V9B4VX' +
                'GJ0RF89X8SQEBSG',
        },
    },
};

const testNames = [
    'should connect to an http server (no useHttps option given)',
    'should connect to an http server, (useHttps=false)',
    'should connect to an https server, (useHttps=true)',
    'should connect to an https server, two way',
];

const testClients = [
    new IAMClient('localhost', httpPort),
    new IAMClient('localhost', httpPort, false),
    new IAMClient('vault.testing.local', httpsPort, true, undefined, undefined,
        fs.readFileSync('tests/utils/ca.crt', 'ascii')),
    new IAMClient('vault.testing.local', httpsPortTwoWay, true,
        fs.readFileSync('tests/utils/test.key', 'ascii'),
        fs.readFileSync('tests/utils/test.crt', 'ascii'),
        fs.readFileSync('tests/utils/ca.crt', 'ascii')),
];

function extractPost(req, cb) {
    let body = '';
    req.on('data', data => body += data).on('error', cb).on('end', () => {
        try {
            body = JSON.parse(body);
        } catch (e) {
            return cb(e);
        }
        return cb(null, body);
    });
}

function handler(req, res) {
    if (req.method === 'POST') {
        extractPost(req, (err, body) => {
            if (err || (body && (body.name !== accountName
                        || body.emailAddress !== accountOptions.email
                        || body.saltedPwd !== accountOptions.password))) {
                res.writeHead(errors.WrongFormat.code,
                    { 'Content-type': 'text/javascript' });
                return res.end(
                    JSON.stringify({ message: errors.WrongFormat }, null, 4));
            }
            res.writeHead(201, { 'Content-type': 'text/javascript' });
            return res.end(JSON.stringify(expectedResponse, null, 4));
        });
    }
}

function doTest(client, done) {
    client.createAccount(accountName, accountOptions, (err, returned) => {
        assert.strictEqual(err, null);
        assert(returned, expectedResponse);
        client.createAccount(accountName, accountOptions, (err, returned) => {
            assert.strictEqual(err, null);
            assert(returned, expectedResponse);
            done();
        });
    });
}

describe('v2 auth tests with mockup server', () => {
    let httpServer;
    let httpsServer;
    let httpsServer2;

    before('start servers', done => {
        httpServer = http.createServer(handler).listen(httpPort, () => {
            const httpsOptions = {
                key: fs.readFileSync('tests/utils/test.key', 'ascii'),
                cert: fs.readFileSync('tests/utils/test.crt', 'ascii'),
                rejectUnauthorized: false,
                requestCert: false,
            };
            httpsServer = https.createServer(httpsOptions, handler);
            httpsServer.on('listening', () => {
                httpsOptions.requestCert = true;
                httpsOptions.rejectUnauthorized = true;
                httpsOptions.ca =
                    [fs.readFileSync('tests/utils/ca.crt', 'ascii')];
                httpsServer2 = https.createServer(httpsOptions, handler);
                httpsServer2.on('listening', done);
                httpsServer2.on('error', done);
                httpsServer2.listen(httpsPortTwoWay);
            });
            httpsServer.on('error', done);
            httpsServer.listen(httpsPort);
        }).on('error', done);
    });

    testNames.forEach((testName, testIndex) => {
        it(testName, done => {
            doTest(testClients[testIndex], done);
        });
    });

    after('stop server', () => {
        httpServer.close();
        httpsServer.close();
    });
});
