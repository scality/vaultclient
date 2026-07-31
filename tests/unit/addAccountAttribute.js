const assert = require('assert');
const IAMClient = require('../../lib/IAMClient');

describe('IAMClient - addAccountAttribute', () => {
    let client;
    let lastRequestData;

    beforeEach('stub the request method', () => {
        client = new IAMClient('127.0.0.1', 8500);
        lastRequestData = null;
        client.request = (method, path, iamAuthenticate, callback, data) => {
            lastRequestData = { method, path, iamAuthenticate, data };
            callback();
        };
    });

    it('should call the request method with the correct parameters', () => {
        client.addAccountAttribute({
            accountName: 'exampleAccount',
            key: 'exampleKey',
            value: 'exampleValue',
        }, () => {});

        assert.strictEqual(lastRequestData.method, 'POST');
        assert.strictEqual(lastRequestData.path, '/');
        assert.strictEqual(lastRequestData.iamAuthenticate, true);
        assert.deepStrictEqual(lastRequestData.data, {
            Action: 'AddAccountAttribute',
            Version: '2010-05-08',
            key: 'exampleKey',
            accountName: 'exampleAccount',
            value: 'exampleValue',
        });
    });

    it('should not send the value when it is not provided', () => {
        client.addAccountAttribute({
            accountName: 'exampleAccount',
            key: 'exampleKey',
        }, () => {});

        assert.deepStrictEqual(lastRequestData.data, {
            Action: 'AddAccountAttribute',
            Version: '2010-05-08',
            key: 'exampleKey',
            accountName: 'exampleAccount',
        });
    });

    ['accountArn', 'accountName', 'accountId', 'canonicalId'].forEach(identifier => {
        it(`should accept ${identifier} on its own`, () => {
            client.addAccountAttribute({
                [identifier]: 'exampleIdentifier',
                key: 'exampleKey',
            }, () => {});

            assert.deepStrictEqual(lastRequestData.data, {
                Action: 'AddAccountAttribute',
                Version: '2010-05-08',
                key: 'exampleKey',
                [identifier]: 'exampleIdentifier',
            });
        });
    });

    it('should throw an error if no account identifier is specified', () => {
        assert.throws(() => {
            client.addAccountAttribute({ key: 'exampleKey' }, () => {});
        }, /account-name, account-id, account-arn or canonical-id need to be specified/);
    });

    it('should throw an error if key is not specified', () => {
        assert.throws(() => {
            client.addAccountAttribute({ accountName: 'exampleAccount' }, () => {});
        }, /key needs to be specified/);
    });

    [
        { identifier: 'accountArn', message: /arn should be a string/ },
        { identifier: 'accountName', message: /name should be a string/ },
        { identifier: 'accountId', message: /id should be a string/ },
        { identifier: 'canonicalId', message: /canonicalId should be a string/ },
    ].forEach(({ identifier, message }) => {
        it(`should throw an error if ${identifier} is not a string`, () => {
            assert.throws(() => {
                client.addAccountAttribute({
                    [identifier]: 123,
                    key: 'exampleKey',
                }, () => {});
            }, message);
        });
    });

    it('should throw an error if key is not a string', () => {
        assert.throws(() => {
            client.addAccountAttribute({
                accountName: 'exampleAccount',
                key: 123,
            }, () => {});
        }, /key should be a string/);
    });

    it('should throw an error if value is not a string', () => {
        assert.throws(() => {
            client.addAccountAttribute({
                accountName: 'exampleAccount',
                key: 'exampleKey',
                value: 123,
            }, () => {});
        }, /value should be a string/);
    });
});
