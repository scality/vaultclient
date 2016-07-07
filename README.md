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

[badgepub]: https://circleci.com/gh/scality/vaultclient.svg?style=svg
[badgepriv]: http://ci.ironmann.io/gh/scality/vaultclient.svg?style=svg&circle-token=40f1e9fe0ad184248c37cbf3d89b164c35fd1667
