# Vault Client Library

[![CircleCI][badgepub]](https://circleci.com/gh/scality/vaultclient)
[![Scality CI][badgepriv]](http://ci.ironmann.io/gh/scality/vaultclient)

This repository provides a client library for any service that relies on
Vault. This repository also provides an executable shell for Vault, which can be
used from either a CLI or an interactive shell.

This client supports the protocol described in Vault's
[repository](https://github.com/scality/Vault/blob/master/Protocol.md).

You can check our [quickstart guide](QUICKSTART.md).

## Contributing

In order to contribute, please follow the
[Contributing Guidelines](
https://github.com/scality/Guidelines/blob/master/CONTRIBUTING.md).

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

Keep in mind that the '--host' flag is mandatory and should specify either Vault
Server's IP or Fully Qualified Domain Name.

See [examples](./EXAMPLES.md) of how to create and delete entities such as
accounts, users, and access keys.

### Command-line HTTPS support

The command-line tool uses the HTTP protocol by default. To force the use of
HTTPS, include the option '--https' in every command. You can also specify your
own certificate authority by including the option '--cafile'. Example:

```sh
$ bin/vaultclient create-account --name account0 --email d3v@null \
                                 --password alpine --host 127.0.0.1 --https \
                                 --cafile <path>
{
    "message": {
        "code": 201,
        "message": "Created",
        "body": {
            "arn": "arn:aws:iam::456854744086:/account0/",
            "id": "456854744086",
            "canonicalId": "7E27S2BXH4JC3Y2CMUOEMO4UJ0I2D5TP4Q...VD7J6SCV7FEM8T"
        }
    }
}

```

## Javascript API usage

This is a basic example of how to use the library and the type of objects
returned by each function.

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

### Javascript API HTTPS support

The programmatical client supports both the HTTP and HTTPS protocols. HTTP is
the default protocol. To enable HTTPS, set the constructor's argument 'useHttps'
to true.

```js
const vaultclient = require('vaultclient');

// the constructor's signature is vaultclient.Client(host, port, useHttps, key,
    cert, ca)
const client = new vaultclient.Client('auth.mydomain.com', 8500, true);

client.createAccount('account0', { email: 'dev@null', password: 'pass' },
    (err, data) => {
        console.log(data);
});

// { message:
//    { code: 201,
//      message: 'Created',
//      body:
//       { arn: 'arn:aws:iam::040564259525:/account0/',
//         id: '040564259525',
//         canonicalId: 'A6QOM41TPP9P7KQ37M0I5DN8DQ88LJ6KCL9C8E...EZMFGBD' } } }

```

To enable two way https encryption, set the constructor argument 'cert' and
'key' to the content of the client certificate. To use your own certificate
authority, set the constructor argument 'ca' to the content of your
authority certificate.

[badgepub]: https://circleci.com/gh/scality/vaultclient.svg?style=svg
[badgepriv]: http://ci.ironmann.io/gh/scality/vaultclient.svg?style=svg&circle-token=40f1e9fe0ad184248c37cbf3d89b164c35fd1667
