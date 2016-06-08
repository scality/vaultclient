# Vault Client Library

[![CircleCI][badgepub]](https://circleci.com/gh/scality/vaultclient)
[![Scality CI][badgepriv]](http://ci.ironmann.io/gh/scality/vaultclient)

This repository provides a client library for any service that wants to rely on
Vault. This repository also provides an executable shell for Vault, usable as
either a CLI or an interactive shell.

This client supports the protocol described in Vault's
[repository](https://github.com/scality/Vault/blob/master/Protocol.md).

You can check our [quickstart guide](QUICKSTART.md).

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
                                 --password alpine --host 127.0.0.1
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

Keep in mind that the '--host' option is always mandatory, indicating either
Vault Server's IP or Fully Qualified Domain Name.

See [examples](./EXAMPLES.md) on how to create and delete entities such as
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

[badgepub]: https://circleci.com/gh/scality/vaultclient.svg?style=svg
[badgepriv]: http://ci.ironmann.io/gh/scality/vaultclient.svg?style=svg&circle-token=40f1e9fe0ad184248c37cbf3d89b164c35fd1667
