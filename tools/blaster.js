
'use strict'; // eslint-disable-line

const createHmac = require('crypto').createHmac;
const commander = require('commander');

const IAMClient = require('../lib/IAMClient.js');

commander
    .version('0.0.1')
    .option('-P, --port <port>', 'Port number', parseInt)
    .option('-H, --host [host]', 'Host name')
    .option('-n, --n-ops <nOps>', 'Number of operations', parseInt)
    .parse(process.argv);

const options = {};

options.host = 'localhost';
options.port = '8500';
options.nOps = 100;

if (commander.host) {
    options.host = commander.host;
}
if (commander.port) {
    options.port = commander.port;
}
if (commander.nOps) {
    options.nOps = commander.nOps;
}

process.stdout.write(
        `process: ${options.nOps} ops server ${options.host}:${options.port}\n`
        );

const client = new IAMClient(options.host,  Number(options.port));

let nbError = 0;
const accounts = {};
const accountNames = [];
const emails = [];

const region = 'us-east-1';
const scopeDate = '20150830';

const chars = 'abcdefghipqrstuvwxyz0123456789';


function generateString(size) {
    let str = '';
    for (let i = 0; i < size; i++) {
        str += chars[Math.floor(Math.random() * (chars.length))];
    }
    return str;
}

function hmac(stringToSign, key) {
    return createHmac('sha256', key).update(stringToSign, 'binary').digest();
}

function calculateSigningKeyV4(secretKey) {
    const dateKey = hmac(scopeDate, `AWS4${secretKey}`);
    const dateRegionKey = hmac(region, dateKey);
    const dateRegionServiceKey = hmac('s3', dateRegionKey);
    const signingKey = hmac('aws4_request', dateRegionServiceKey);
    return signingKey;
}

function random() {
    return Math.random() < 0.5;
}

function createUniqueName(array) {
    const accountName = generateString(21);
    if (array.indexOf(accountName) === -1) {
        return accountName;
    }
    return createUniqueName(array);
}

function getName(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function createUniqueEmail(array) {
    const email = `${generateString(10)}@${generateString(3)}.com`;
    if (array.indexOf(email) === -1) {
        return email;
    }
    return createUniqueEmail(array);
}

function getEmail(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getPassword() {
    return 'bestPasswordEver';
}

function reset(callback) {
    let nb = accountNames.length;
    accountNames.forEach(name => {
        client.deleteAccount(name, () => {
            nb--;
            if (nb === 0) {
                callback();
            }
        });
    });
}

function createAccount(index, callback) {
    let error = true;
    let accountName = '';
    let email = '';
    if (accountNames.length > 0 && random()) {
        if (random()) {
            accountName = getName(accountNames);
            email = createUniqueEmail(emails);
        } else {
            accountName = createUniqueName(accountName);
            email = getEmail(emails);
        }
    } else {
        error = false;
        accountName = createUniqueName(accountNames);
        email = createUniqueEmail(emails);
    }
    const options = {email, password: getPassword()};
    client.createAccount(accountName, options, (err, data) => {
        if (!err && !error) {
            accountNames.push(accountName);
            emails.push(email);
            accounts[accountName] = {
                email,
                users: {},
                canonicalId: data.message.body.canonicalId,
                usersNames: [],
                usersEmails: [],
            };
            return callback(null, index + 1);
        } else if (error && err && err.EntityAlreadyExists) {
            return callback(null, index + 1);
        }
        ++nbError;
        if (!error) {
            return callback(err.description, index);
        }
        return callback(`Should not create the account: ${accountName}`, index);
    });
}

function deleteAccount(index, callback) {
    let error = true;
    let accountName = '';
    if (accountNames.length > 0 && random()) {
        error = false;
        accountName = getName(accountNames);
    } else {
        accountName = createUniqueName(accountNames);
    }
    client.deleteAccount(accountName, err => {
        if (!error && !err) {
            accountNames.splice(accountNames.indexOf(accountName), 1);
            emails.splice(emails.indexOf(accounts[accountName].email), 1);
            accounts[accountName] = undefined;
            return callback(null, index + 1);
        } else if (error && err && err.EntityDoesNotExist) {
            return callback(null, index + 1);
        }
        ++nbError;
        if (error) {
            callback('Should not delete an unexisting account', index);
        } else {
            callback(err.description, index);
        }
    });
}

function createUser(index, callback) {
    let error = true;
    let accountName = '';
    let userName = 'toto';
    let email = 'toto@toto.com';

    if (accountNames.length > 0 && random()) {
        accountName = getName(accountNames);
        const account = accounts[accountName];
        if (account.usersNames.length > 0 && random()) {
            if (random()) {
                email = createUniqueEmail(account.usersEmails);
                userName = getName(account.usersNames);
            } else {
                email = getEmail(account.usersEmails);
                userName = createUniqueName(account.usersNames);
            }
        } else {
            error = false;
            userName = createUniqueName(account.usersNames);
            email = createUniqueEmail(account.usersEmails);
        }
    } else {
        accountName = createUniqueName(accountNames);
    }
    const params = {email, password: getPassword()};
    client.createUser(accountName, userName, params, (err, data) => {
        if (!error && !err) {
            const acc = accounts[accountName];
            acc.usersNames.push(userName);
            acc.usersEmails.push(email);
            acc.users[userName] = {email, data, accessKeys: [], secretKeys: {}};
            return callback(null, index + 1);
        } else if (error && err) {
            return callback(null, index + 1);
        }
        ++nbError;
        if (!error && err) {
            return callback(`Should create an user: ${userName}`, index);
        }
        return callback(`Should not create an user: ${userName}`, index);
    });
}

function deleteUser(index, callback) {
    let error = true;
    let accountName = '';
    let userName = 'toto';
    if (accountNames.length > 0) {
        accountName = getName(accountNames);
        const acc = accounts[accountName];
        if (acc.usersNames.length > 0 && random()) {
            userName = getName(acc.usersNames);
            error = false;
        } else {
            userName = createUniqueName(acc.usersNames);
        }
    } else {
        accountName = createUniqueName(accountNames);
    }
    client.deleteUser(accountName, userName, err => {
        if (!error && !err) {
            const acc = accounts[accountName];
            acc.usersNames.splice(acc.usersNames.indexOf(userName), 1);
            acc.usersEmails.splice(
                acc.usersEmails.indexOf(acc.users[userName].email), 1);
            acc.users[userName] = undefined;
            return callback(null, index + 1);
        } else if (error && err) {
            return callback(null, index + 1);
        }
        ++nbError;
        if (!error && err) {
            callback('Should delete an existing user', index);
        } else {
            callback('Should not delete an unexisting user', index);
        }
    });
}

function createAccessKey(index, callback) {
    let error = true;
    let accountName = '';
    let userName = 'toto';
    if (accountNames.length > 0) {
        accountName = getName(accountNames);
        const acc = accounts[accountName];
        if (acc.usersNames.length > 0 && random()) {
            userName = getName(acc.usersNames);
            error = false;
        } else {
            userName = createUniqueName(acc.usersNames);
        }
    } else {
        accountName = createUniqueName(accountNames);
    }
    client.createAccessKey(accountName, userName, null, (err, data) => {
        if (!err && !error) {
            const accessKey = data.message.body.id;
            const secretKey = data.message.body.value;
            accounts[accountName].users[userName]
                    .secretKeys[accessKey] = secretKey;
            accounts[accountName].users[userName].accessKeys.push(accessKey);
            return callback(null, index + 1);
        } else if (err && error) {
            return callback(null, index + 1);
        }
        ++nbError;
        if (!error && err) {
            return callback('Should create an accessKey', index);
        }
        return callback('Should create an accessKey', index);
    });
}

function deleteAccessKey(index, callback) {
    let error = true;
    let accessKey = 'unexistingAccessKey';
    let accountName = '';
    let userName = '';
    if (accountNames.length > 0) {
        accountName = getName(accountNames);
        const acc = accounts[accountName];
        if (acc.usersNames.length > 0) {
            userName = getName(acc.usersNames);
            if (acc.users[userName].accessKeys.length > 0 && random()) {
                accessKey = getName(acc.users[userName].accessKeys);
                error = false;
            }
        }
    }
    client.deleteAccessKey(accessKey, err => {
        if (!err && !error) {
            const accessKeys = accounts[accountName].users[userName].accessKeys;
            accessKeys.splice(accessKeys.indexOf(accessKey), 1);
            accounts[accountName].
                    users[userName].secretKeys[accessKey] = undefined;
            return callback(null, index + 1);
        } else if (err && error) {
            return callback(null, index + 1);
        }
        ++nbError;
        if (err) {
            return callback('Should delete an accessKey', index);
        }
        return callback('Should not delete an accessKey', index);
    });
}

function verifySignatureV2(index, callback) {
    let error = true;
    let accountName = 'unexistingAccountName';
    let accessKey = 'unexistingAccessKey';
    let signature = hmac('signature', 'secretKey').toString('base64');
    const  params = {algo: 'sha1'};
    if (accountNames.length > 0) {
        accountName = getName(accountNames);
        const acc = accounts[accountName];
        if (acc.usersNames.length > 0) {
            const userName = getName(acc.usersNames);
            const user = acc.users[userName];
            if (user.accessKeys.length > 0) {
                accessKey = getName(user.accessKeys);
                if (random()) {
                    signature = hmac('signature',
                            user.secretKeys[accessKey]).toString('base64');
                    if (random()) {
                        error = false;
                        params.algo = 'sha256';
                    }
                }
            }
        }
    }
    client.verifySignatureV2('signature', signature, accessKey, params, err => {
        if (!error && !err) {
            return callback(null, index + 1);
        } else if (error && err) {
            return callback(null, index + 1);
        }
        ++nbError;
        if (error) {
            const ret = 'Should not verify a not valid signature v2';
            return callback(ret, index);
        }
        return callback('Should verify valid signature v2', index);
    });
}

function verifySignatureV4(index, callback) {
    let error = true;
    let accountName = 'unexistingAccountName';
    let accessKey = 'unexistingAccessKey';
    let signature = hmac('signature', 'secretKey').toString('hex');
    if (accountNames.length > 0) {
        accountName = getName(accountNames);
        const acc = accounts[accountName];
        if (acc.usersNames.length > 0) {
            const userName = getName(acc.usersNames);
            const user = acc.users[userName];
            if (user.accessKeys.length > 0) {
                accessKey = getName(user.accessKeys);
                if (random()) {
                    const signingKey = calculateSigningKeyV4(
                                                user.secretKeys[accessKey]);
                    signature = hmac('signature', signingKey).toString('hex');
                    error = false;
                }
            }
        }
    }
    client.verifySignatureV4('signature', signature,
            accessKey, region, scopeDate, {reqUid: 'toto'}, err => {
                if (!error && !err) {
                    return callback(null, index + 1);
                } else if (error && err) {
                    return callback(null, index + 1);
                }
                ++nbError;
                if (error) {
                    const ret = 'Should not verify not valid signature v4';
                    return callback(ret, index);
                }
                return callback('Should verify valid signature v4', index);
            });
}

function getEmails(index, callback) {
    let error = true;
    const names = [];
    let arr = [];
    if (accountNames.length > 0 && random()) {
        if (random()) {
            const nb = Math.floor(Math.random() * accountNames.length);
            for (let i = 0; i < nb; ++i) {
                const index = Math.floor(Math.random() * accountNames.length);
                names.push(accountNames[index]);
            }
            names.forEach(n => {
                arr.push(accounts[n].canonicalId);
            });
            error = false;
        } else {
            arr = ['unexisting1', 'unexisting2', 'undefined'];
        }
    }
    client.getEmailAddresses(arr, {reqUid: 'toto'}, (err, data) => {
        let email = 'NotFound';
        let ok = true;
        arr.forEach((n, index) => {
            if (!error) {
                email = accounts[names[index]].email;
            }
            if (email !== data.message.body[n]) {
                ++nbError;
                ok = false;
            }
        });
        return ok ? callback(null, index + 1) :
        callback('Fail in getEmailAddresses', index);
    });
}


function getCanonicalIds(index, callback) {
    let error = true;
    let arr = [];
    if (accountNames.length > 0 && random()) {
        if (random()) {
            const nb = Math.floor(Math.random() * emails.length);
            for (let i = 0; i < nb; ++i) {
                const index = Math.floor(Math.random() * emails.length);
                arr.push(emails[index]);
            }
            error = false;
        } else {
            arr = [
                'unexisting1@toto.com',
                'unexisting2@toto.com',
                'undefined@toto.com',
            ];
        }
    }
    client.getCanonicalIds(arr, {reqUid: 'toto'}, (err, data) => {
        let ok = true;
        let canonicalId = 'NotFound';
        arr.forEach(e => {
            if (error === false) {
                canonicalId =
            accounts[accountNames[emails.indexOf(e)]].canonicalId;
            }
            if (canonicalId !== data.message.body[e]) {
                ++nbError;
                ok = false;
            }
        });
        return ok ? callback(null, index + 1) :
        callback('Fail in getCanonicalIds', index);
    });
}

const functions = [
    createUser,
    createAccount,
    deleteAccount,
    deleteUser,
    createAccessKey,
    deleteAccessKey,
    verifySignatureV2,
    verifySignatureV4,
    getEmails,
    getCanonicalIds,
];

function chooseRandomFunction() {
    return functions[Math.floor(Math.random() * functions.length)];
}

function loop(err, i) {
    if (err) {
        process.stdout.write(`${err}\n`);
    }
    if (i % 1000 === 0) {
        process.stdout.write(`Successfully ${i} ops\n`);
    }
    if (i > options.nOps) {
        process.stdout.write(`Done with : ${nbError} error(s)\n`);
        reset(() => {
            process.stdout.write('Terminated!\n');
        });
        return;
    }
    chooseRandomFunction()(i, loop);
}

loop(null, 1);
