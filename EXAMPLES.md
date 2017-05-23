# Usage examples

## Tables of contents

1. [Cli](#cli)
    1. [Https](#cli-https)
    2. [Create account](#cli-create-account)
    3. [Generate account access key](#cli-generate-account-access-key)
    4. [List accounts](#cli-list-accounts)
    5. [Delete account](#cli-delete-account)
2. [Api](#api)
    1. [Start](#api-start)
    2. [Create account](#api-create-account)
    3. [Generate account access key](#api-generate-account-access-key)
    4. [List accounts](#api-list-accounts)
    5. [Delete account](#api-delete-account)
    6. [Authenticate V2](#api-authenticate-v2)
    7. [Authenticate V4](#api-authenticate-v4)
    8. [Get email addresses](#api-get-email-addresses)
    9. [Get canonical ids](#api-get-canonical-ids)
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

```sh
vautclient create-account --name john --email john@acme.com
```

The previous example will create an account named 'john' with an email
'john@acme.com'.

Output example :

```json
{
    "account": {
        "arn": "arn:aws:iam::685038099695:/john/",
        "canonicalId": "8LTVNPCFXUUU8SRQCX3PJQ5PDMYP6TE7610KELF480Q4OWH9OZCS",
        "id": "685038099695",
        "emailAddress": "john@acme.com",
        "name": "john",
        "createDate": "2016-07-02T21:26:38Z"
    }
}
```

In the following output, secretKey is the first accessKey of the account, the
relevant information here are ```secretKey.id``` (AccessKeyId)
and ```secretKey.value``` (SecretKey)

### Generate account access key

```sh

vaultclient generate-account-access-key --name john

```

The previous example will generate a new account access key for the account
named ```john```

Output example :

```json

{
    "id": "XMHR9IQ9UYN56W1OSN2S",
    "value": "5tK4XOid7pXss66A7Jn=Yz7ybnMIB4Uf/BjavN58",
    "createDate": "2016-07-02T21:47:57Z",
    "lastUsedDate": "2016-07-02T21:47:57Z",
    "status": "Active",
}

```

### List accounts

```sh

vaultclient list-accounts --max-items 30

```

The previous example will list at most, 30 accounts. You can also paginate by
using ```--marker```, like :

```sh

vaultclient list-accounts --max-items 30 --marker 1

```

The previous example will list at most, the 30 next accounts in the list.

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

The previous example will delete the account named ```john```.

Output example :

```json
{}
```

## Api

### Start

The following show how instanciate a vaultclient api :

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

The following example show how create an account with the api :

```js
client.createAccount('accountName', {
    email: 'accountName@test.com',
}, (err, result) => {

});
```

The result format is the same as vaultclient cli.

### Generate account access key

The following example show how create an account access key :

```js
client.generateAccountAccessKey('accountName', (err, result) => {

});
```

The output format is the same as vaultclient cli.

### List accounts

The following example show how list accounts :

```js
client.listAccounts({
    marker: '2', // Marker for pagination
    maxItems: 100, // Max accounts to return
}, (err, result) => {

});
```

The output format is the same as vaultclient cli.

### Delete account

The following example show how delete an account :

```js
client.deleteAccount('accountName', (err, result) => {

});
```

The output is the same as vautclient cli

### Authenticate V2

For this route, you don't need to set up the accessKeyId and secretKey of the
client.
The following example show how to authenticate with aws signature version 2 :

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
The following example show how to authenticate with aws signature version 4 :

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
The following example show how to get email addresses of accounts from their
canonical ids :

```js
client.getEmailAddresses(['canonicalId1', 'canonicalId2'], {
    reqUid: 'some-request-id', // Request id to trace request (optionnal)
}, (err, result) => {
    result.message.code; // http result code
    // Email address for 'canonicalId1', Can also be 'WrongFormat' or 'NotFound'
    result.message.body['canonicalId1'];
});
```

### Get canonical ids

For this route, you don't need to set up the accessKeyId and secretKey of
the client.
The following example show how to get canonical ids of accounts from their
email addresses :

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

With this account access key, you can now start to use Amazon aws cli. By
setting AccessKeyId in the aws cli config file, or by command line.

### Create a user

```sh
aws iam create-user --user-name john
```

Ouptut example :

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

Output example :

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
