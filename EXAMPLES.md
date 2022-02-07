# Usage examples

## Tables of contents

1. [Cli](#cli)
    1. [Https](#https)
    2. [Create account](#create-account)
    3. [Create account with quota](#create-account-with-quota)
    4. [Inject accountID](#inject-accountid)
    5. [Generate account access key](#generate-account-access-key)
    6. [Inject accesskey and secretkey](#inject-accesskey-and-secretkey)
    7. [Update account quota](#update-account-quota)
    8. [Delete account quota](#delete-account-quota)
    9. [List accounts](#list-accounts)
    10. [Delete account](#delete-account)
2. [Api](#api)
    1. [Start](#start)
    2. [Create account](#create-account-1)
    3. [Create account with quota](#create-account-with-quota-1)
    4. [Inject accountID](#inject-accountid-1)
    5. [Generate account access key](#generate-account-access-key-1)
    6. [Inject accesskey and secretkey](#inject-accesskey-and-secretkey-1)
    7. [Update account quota](#update-account-quota-1)
    8. [Delete account quota](#delete-account-quota-1)
    9. [List accounts](#list-accounts-1)
    10. [Delete account](#delete-account-1)
    11. [Authenticate V2](#authenticate-v2)
    12. [Authenticate V4](#authenticate-v4)
    13. [Get email addresses](#get-email-addresses)
    14. [Get canonical IDs](#get-canonical-ids)
3. [Step to set up an account](#step-to-set-up-an-account)

## Cli

This section provides examples on how to use the Vault cli to manage your accounts

The Vault server is assumed to be running at 127.0.0.1:8600 in the following
examples.

### Https

To enable https for vaultclient cli, you have to pass the option ```--https```
to vaultclient cli. In the case of self-signed certificates, you also need to
use the option ```--cafile <certificate-authority-path>```. Another option is
using the option ```--noCaVerification``` to disable ssl certificate validation.

### Create account

The following example shows how to create an account named 'john' with an email
'john@acme.com'.

```sh
vautclient create-account --name john --email john@acme.com
```

Output example:

```json
{
    "account": {
        "arn": "arn:aws:iam::235437388852:/john/",
        "canonicalId": "8dfc0d36337c3af81417d13e9a9fc20ec4efb553bdd70e27110d13632f74dad0",
        "id": "235437388852",
        "emailAddress": "john@acme.com",
        "name": "john",
        "createDate": "2019-12-26T10:49:20Z",
        "quotaMax": 0
    }
}
```

### Create account with quota

The following example shows how to create an account named 'john2' with an email
'john2@acme.com' with quota set to 100 bytes.

```sh
vautclient create-account --name john2 --email john2@acme.com --quota 100
```

```json
{
    "account": {
        "arn": "arn:aws:iam::090923674872:/john2/",
        "canonicalId": "4b76c3580a6e604220daf983d59be9321b6459a08b0b9eb2d99eb69c5b432bc5",
        "id": "090923674872",
        "emailAddress": "john2@acme.com",
        "name": "john2",
        "createDate": "2019-12-26T10:42:41Z",
        "quotaMax": 100
    }
}
```

### Inject accountID

The following example shows how to create an account named 'john2' with an email
'john2@acme.com' with account ID set to `098765567890`.

```sh
vautclient create-account --name john3 --email john3@acme.com \
--accountid 098765567890
```

```json
{
    "account": {
        "arn": "arn:aws:iam::098765567890:/john3/",
        "canonicalId": "8af6f7a15c15fb2bb1e0dac4fc9edd4582cdd3201117b761473d63aba9f7dac6",
        "id": "098765567890",
        "emailAddress": "john3@acme.com",
        "name": "john3",
        "createDate": "2019-12-26T10:46:55Z",
        "quotaMax": 0
    }
}
```

In the following output, secretKey is the first accessKey of the account, the
relevant information here are ```secretKey.id``` (AccessKeyId)
and ```secretKey.value``` (SecretKey)

### Generate account access key

The following example shows how to generate a new account access key for the account
named ```john```

```sh
vaultclient generate-account-access-key --name john
```

Output example:

```json
{
    "id": "ERUY93RPJHWGUBF0IDQ8",
    "value": "5Of4usgFeLVH5Qr0NU6UxW0nyeYzdNQaJKQS=dRt",
    "createDate": "2019-12-26T10:50:02Z",
    "lastUsedDate": "2019-12-26T10:50:02Z",
    "status": "Active",
    "userId": "235437388852"
}
```

### Inject accesskey and secretkey

The following example shows how to inject the supplied account access key
and secret key for the account named ```john```

```sh
vaultclient generate-account-access-key --name john \
--accesskey=AKIA5X47K766FWESB7PL \
--secretkey=+870aSdHxh9PPS7jxcRuYIMeX9P0ytDYVd/Q8s1B
```

Output example:

```json
{
    "id": "AKIA5X47K766FWESB7PL",
    "value": "+870aSdHxh9PPS7jxcRuYIMeX9P0ytDYVd/Q8s1B",
    "createDate": "2019-12-26T10:50:52Z",
    "lastUsedDate": "2019-12-26T10:50:52Z",
    "status": "Active",
    "userId": "235437388852"
}
```

### Update account quota

The following example shows how to update the quota with the value specified
for the account named ```john```. The value given for quota is in bytes.

```sh
vaultclient update-account-quota --account-name john --quota 10000
```

Output example:

```json
{
    "arn": "arn:aws:iam::235437388852:/john/",
    "id": "235437388852",
    "canonicalId": "8dfc0d36337c3af81417d13e9a9fc20ec4efb553bdd70e27110d13632f74dad0",
    "quota": 10000
}
```

### Delete account quota

The following example shows how to delete any quota for the account
named ```john```

```sh
vaultclient delete-account-quota --account-name john
```

Output example:

```json
{
    "arn": "arn:aws:iam::235437388852:/john/",
    "id": "235437388852",
    "canonicalId": "8dfc0d36337c3af81417d13e9a9fc20ec4efb553bdd70e27110d13632f74dad0"
}
```

### List accounts

The following example shows how to list, at most, the 30 next accounts
in the list.

```sh
vaultclient list-accounts --max-items 30
```

The following example shows how to list, at most, 30 accounts.
You can also paginate by using ```--marker```, like:

```sh
vaultclient list-accounts --max-items 30 --marker 1
```

Output example:

```json
{
    "isTruncated": false,
    "accounts": [
        {
            "arn": "arn:aws:iam::341220772100:/john/",
            "id": "341220772100",
            "name": "john",
            "createDate": "2016-07-02T21:47:53Z",
            "emailAddress": "john@acme.com",
            "canonicalId": "UO62HEUU76W5LYMG41SO3MQZQQN21YGQ1ZSF25B47GNUCC5F1"
        },
        {
            "arn": "arn:aws:iam::148910879031:/jane/",
            "id": "148910879031",
            "name": "jane",
            "createDate": "2016-07-02T21:59:27Z",
            "emailAddress": "jane@acme.com",
            "canonicalId": "ZTMP1J67M0VYI8T1DFB0S60ELIOSWC6VD1W1BQC24JF2VJEPQ"
        },
        {
            "arn": "arn:aws:iam::433602879118:/lisa/",
            "id": "433602879118",
            "name": "lisa",
            "createDate": "2016-07-02T21:59:32Z",
            "emailAddress": "lisa@acme.com",
            "canonicalId": "E81ZJFT0DP5KSUL5ZE8EUT4VYE8EZQAKUGS0VTF1QDD7PGXF0"
        }
    ]
}
```

### Delete account

```sh
vaultclient delete-account --name john
````

The following example shows how to delete the account named ```john```.

Output example:

```json
{}
```

## Api

### Start

The following show how instantiate a vaultclient API:

```js
const Client = require('vaultclient');

const client = new Client(
    'host', // Hostname
    8600, // connection port (8600: vault admin, 8500: s3->vault)
    false, // use https
    null, // https key
    null, // https cert
    null, // https ca (self-signed certificates)
    false, // ignore certificate authority
    'AdminAccessKeyID', // Access key id of superadmin (ignore for s3 routes)
    'AdminSecretKey', // Secret key of superadmin (ignore for s3 routes)
    );
```

### Create account

The following example shows how to create an account with the api:

```js
client.createAccount('accountName', {
    email: 'accountName@test.com',
}, (err, result) => {

});
```

The result is formatted the same as Vaultclient CLI.

### Create account with quota

The following example shows how create an account with quota
using the API:

```js
client.createAccount('accountName', {
    email: 'accountName@test.com',
    quota: 100
}, (err, result) => {

});
```

The result is formatted the same as Vaultclient CLI.

### Inject accountID

The following example shows how to create an account with custom account ID
using the api:

```js
client.createAccount('accountName', {
    email: 'accountName@test.com',
    externalAccountId: '123123123123'
}, (err, result) => {

});
```

The result is formatted the same as Vaultclient CLI.

### Generate account access key

The following example shows how to create an account access key:

```js
client.generateAccountAccessKey('accountName', (err, result) => {

});
```

### Inject accesskey and secretkey

The following example shows how to inject an account access key and secret key:

```js
client.generateAccountAccessKey('accountName', (err, result), {
    externalAccessKey: 'AKIA5X47K766FWESB7PL',
    externalSecretKey: '+870aSdHxh9PPS7jxcRuYIMeX9P0ytDYVd/Q8s1B'
} => {

});
```

The output is formatted the same as Vaultclient CLI.

### Update account quota

The following example shows how to update an account's quota using the API.

```js
client.updateAccountQuota('accountName', <quotavalue>, (err, result) => {

});
```

```<quotavalue>``` should be a positive number (not a string).
The output is formatted the same as Vaultclient CLI.

### Delete account quota

The following example shows how to use the API to delete an account's quota:

```js

client.deleteAccountQuota('accountName', (err, result) => {

});

```

The output is formatted the same as Vaultclient CLI.

### Update account custom attributes

The following examples show the methods for updating an account's custom
attributes.

* Remove existing custom attributes:

```js

client.updateAccountAttributes('accountName', {}, (err, result) => {});

```

* Set custom attributes:

```js

client.updateAccountAttributes('accountName', {
    attr: 'custom'
}, (err, result) => {
});

```

**note**: This API call will overwrite existing custom attributes.

### List accounts

The following example shows how to list accounts:

```js

client.listAccounts({
    marker: '2', // Marker for pagination
    maxItems: 100, // Max accounts to return
}, (err, result) => {

});

```

The output is formatted the same as Vaultclient CLI.

### Delete account

The following example shows how to delete an account:

```js

client.deleteAccount('accountName', (err, result) => {

});

```

The output is the same as vautclient cli

### Authenticate V2

For this route, you don't need to set up the accessKeyId and secretKey of the
client.
The following example shows how to authenticate with AWS Signature Version 2:

```js

client.verifySignatureV2(
    'stringToSign',
    'signature',
    'accessKey',
    {
        algo: 'sha256', // sha1 or sha256 (optional)
        reqUid: 'some-request-id', // Request id to trace request (optional)
        requestContext: '{}', // Request context to perform authorization
        // against IAM policies. This is a stringified version of a
        // RequestContext class.  See Arsenal for class details.
        securityToken: 'abcdef0123456789', // security token for temporary
        // credentials
    },
    (err, result) => {
        result.message.code; // http result code
        result.message.body.arn; // Arn of user / account
        result.message.body.canonicalID; // Canonical id of account
        result.message.body.shortid; // id of account / user
        result.message.body.email; // account / user email address
        result.message.body.accountDisplayName; // Name of account
        result.message.body.IAMDisplayName; // Name of user (or undefined)
    });

```

### Authenticate V4

For this route, you don't need to set up the accessKeyId and secretKey of the
client.
The following example shows how to authenticate with AWS Signature Version 4:

```js

client.verifySignatureV4(
    'stringToSign',
    'signature',
    'accessKey',
    'us-east-1', // Region
    scopeDate, // Date in ISO 8601 format, YYYYMMDDTHHMMSSZ
    {
        reqUid: 'some-request-id', // Request id to trace request (optional)
        requestContext: '{}', // Request context to perform authorization
        // against IAM policies. This is a stringified version of a
        // RequestContext class.  See Arsenal for class details.
        securityToken: 'abcdef0123456789', // security token for temporary
        // credentials
    },
    (err, result) => {
        result.message.code; // http result code
        result.message.body.arn; // Arn of user / account
        result.message.body.canonicalID; // Canonical id of account
        result.message.body.shortid; // id of account / user
        result.message.body.email; // account / user email address
        result.message.body.accountDisplayName; // Name of account
        result.message.body.IAMDisplayName; // Name of user (or undefined)
    });

```

### Get email addresses

For this route, you don't need to set up the accessKeyId and secretKey of the
client.
The following example shows how to get email addresses of accounts from their
canonical IDs:

```js

client.getEmailAddresses(['canonicalId1', 'canonicalId2'], {
    reqUid: 'some-request-id', // Request id to trace request (optionnal)
}, (err, result) => {
    result.message.code; // http result code
    // Email address for 'canonicalId1', Can also be 'WrongFormat' or 'NotFound'
    result.message.body['canonicalId1'];
});

```

### Get canonical IDs

For this route, you don't need to set up the accessKeyId and secretKey of
the client.
The following example shows how to get canonical IDs of accounts from their
email addresses:

```js

client.getEmailAddresses(['email1', 'email2'], {
    reqUid: 'some-request-id', // Request id to trace request in logs (optionnal)
}, (err, result) => {
    result.message.code; // http result code
    // Canonical id for 'email1', Can also be 'WrongFormat' or 'NotFound'
    result.message.body['email1'];
});

```

## Step to set up an account

The following step are the minimal steps to set up an account, an user and his
access key. Account will be named ```Acme corp``` and user will be
named ```john```.

### Create account

```sh

vaultclient create-account --name "Acme corp" --email admin@acme.com

```

### Generate account access key

```sh

vaultclient generate-account-access-key --name "Acme corp"

```

With this account access key, you can now start to use the AWS CLI.
By setting AccessKeyId in the aws cli config file, or by command line.

### Create a user

```sh

aws iam create-user --user-name john

```

Ouptut example:

```json

{
  "User": {
      "UserName": "john",
      "Path": "/",
      "CreateDate": "2013-06-08T03:20:41.270Z",
      "UserId": "AKIAIOSFODNN7EXAMPLE",
      "Arn": "arn:aws:iam::123456789012:user/john"
  }
}

```

### Create access key

```sh

aws iam create-access-key --user-name john

```

Output example:

```json

{
  "AccessKey": {
      "UserName": "john",
      "Status": "Active",
      "CreateDate": "2015-03-09T18:39:23.411Z",
      "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYzEXAMPLEKEY",
      "AccessKeyId": "AKIAIOSFODNN7EXAMPLE"
  }
}

```

You have now an account, an user and his access key.
