# Vault Client Library

[![CircleCI][badgepub]](https://circleci.com/gh/scality/vaultclient)
[![Scality CI][badgepriv]](http://ci.ironmann.io/gh/scality/vaultclient)

This repository provides a client library for any service that relies on
Vault. This repository also provides an cli binary to interact with Vault.

This client supports a part of the protocol described in Vault's
[repository](https://github.com/scality/Vault/blob/master/Protocol.md). The
relevant parts are :

- Create account
- Generate account access key
- List accounts
- Delete account
- Authenticate V2
- Authenticate V4
- Get email addresses
- Get canonical ids

You can check our [quickstart guide](QUICKSTART.md).

## Contributing

In order to contribute, please follow the
[Contributing Guidelines](
https://github.com/scality/Guidelines/blob/master/CONTRIBUTING.md).

## Command-line usage

For general help, run:

```sh
$> ./bin/vaultclient -h
```

For help on a specific command, run:

```sh
$> ./bin/vaultclient subcommand -h
```

Example:

```sh
$> ./bin/vaultclient create-account -h

  Usage: create-account [options]

  Options:

    -h, --help             output usage information
    --name <NAME>
    --email <EMAIL>
```

See [examples](./EXAMPLES.md) to have an overview of all available commands.

### Command-line HTTPS support

See [examples](./EXAMPLES.md) to know how to set up https.

### Command-line use of Vault administration credentials

Vault requires the use of AWS signature v4 and valid administration credentials
in its administrative interfaces (that is, create, delete and list
accounts, users and access keys). In order to make vaultcient use an
administrative credential (accessKey, secretKey) pair you must first create a
json file like this:

```
{
    "accessKey": "<administrative access key for Vault>",
    "secretKeyValue": "<administrative secret key for Vault>"
}
```

There are three ways of passing the content of the file to vaultclient:

1. Name the file `.vaultclient.conf` and place it in your home folder, that is: `~/.vaultclient.conf`

2. Set environment variable `VAULT_CONFIG` with the path of the file: `export VAULT_CONFIG=<filepath>`

3. Pass the filepath in the command line with option `--config`

An example of the third option is:

```sh
$ bin/vaultclient create-account --name account0 --email d3v@null \
                                 --config <path>
```

## Javascript API usage

See [examples](./EXAMPLES.md) to know how to set up and use the api
from javascript code.

### Javascript API HTTPS support

The programmatical client supports both the HTTP and HTTPS protocols. HTTP is
the default protocol. To enable HTTPS, set the constructor's argument ```useHttps```
to true.

See [examples](./EXAMPLES.md) to know how to see all constructor arguments.

```js
const vaultclient = require('vaultclient');

const client = new vaultclient.Client('auth.mydomain.com', 8500,
    true, // This argument set up https
);
```

To enable two way https encryption, set the constructor argument ```cert```
and ```key``` to the content of the client certificate. To use your own
certificate authority, set the constructor argument ```ca``` to the content of
your authority certificate.

### Javascript API use of Vault administration credentials

Vault administrative credentials must be passed to the constructor if using
an administrative route.

See [examples](./EXAMPLES.md) to know how to see all constructor arguments.

```js
const vaultclient = require('vaultclient');

const client = new vaultclient.Client('auth.mydomain.com', 8500, false,
    undefined, undefined, undefined, true, '7C66DCVN609K7ZHDBVZ0',
    'JXxTT04NxiWb6NcES+rpkHnkXszDq3KxexocJIJ9');

client.createAccount('account0', { email: 'dev@null' }, (err, data) => {
    console.log(data);
});
```

[badgepub]: https://circleci.com/gh/scality/vaultclient.svg?style=svg
[badgepriv]: http://ci.ironmann.io/gh/scality/vaultclient.svg?style=svg&circle-token=40f1e9fe0ad184248c37cbf3d89b164c35fd1667
