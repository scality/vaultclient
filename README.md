# Vault Client Library

This repository provides a client library for any service that wants to rely on
Vault. This repository also provides an executable shell for Vault, usable as
either a CLI or an interactive shell.

This client supports the protocol described in Vault's
[repository](https://github.com/scality/Vault/blob/master/Protocol.md).

## Command-line usage

For general help, run:

```sh
bin/vaultclient -h
```

For help on a specific command, run:

```sh
bin/vaultclient subcommand -h
```

Example:

```sh
$ bin/vaultclient create-account -h

  Usage: create-account [options]

  Options:

    -h, --help             output usage information
    --name <NAME>
    --email <EMAIL>
    --password <PASSWORD>
```

```sh
$ bin/vaultclient create-account --name account0 --email d3v@null \
                                 --password alpine
{
    "message": {
        "code": 201,
        "message": "Created",
        "body": {
            "arn": "arn:aws:iam::619305055237:/account0/",
            "id": "619305055237",
            "canonicalId": "V8448DZ5078KM7NQPF3T83L7HMY4KRVUVH3IHD...22INTIU1KL"
        }
    }
}
```

See [examples](./Examples.md) on how to create and delete entities such as
accounts, users and access keys.

## Javascript API usage

Here is a basic example showing how to use the library, and what type of objects
the functions return.

```js
const vaultclient = require('vaultclient');

const client = new vaultclient.Client('auth.mydomain.com');

client.createAccount('account0', { email: 'dev@null', password: 'pass' },
    (err, data) => {
        console.log(data);
});

// { message:
//    { code: 201,
//      message: 'Created',
//      body:
//       { arn: 'arn:aws:iam::216372055346:/account0/',
//         id: '216372055346',
//         canonicalId: 'VJQ1WG03ZZ4TBKJ4J7UOBWTCPMOAK9IHYV7A00...2VGKFOY' } } }
```

```js
client.deleteAccount('account0', (err, data) => {
    console.log(data);
});

// { message: { code: 204, message: 'No content.' } }
```

```js
client.deleteAccount('account999', (err, data) => {
    if (err) {
        console.log(err);
        console.log('--> message =', err.message);
        console.log('--> code =', err.code);
    }
});

// { [Error: Not found.] message: 'Not found.', code: 404 }
// --> message = Not found.
// --> code = 404
```
