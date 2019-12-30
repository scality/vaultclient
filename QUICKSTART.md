# How to play with vaultclient and s3cmd in 10 minutes (developers and CSEs only)

## Steps

1. [Before starting](#before-starting)
2. [Downloads and set-up](#downloads-and-set-up)
    1. [Vault Client](#vault-client)
    2. [Aws cli](#aws-cli)
    3. [Vault Server](#vault-server)
3. [Provision your S3 account](#provision-your-s3-account)
    1. [Create an account](#create-an-account)
    2. [Create an access key for the account](#create-an-access-key-for-the-account)
    3. [Set up amazon aws cli](#set-up-amazon-aws-cli)
    4. [Create a user](#create-a-user)
    5. [Create an access key for your user](#create-an-access-key-for-your-user)
4. [Set up your .s3cfg](#set-up-your-s3cfg)
5. [Use s3cmd with your local S3 connector](#use-s3cmd-with-your-local-s3-connector)

## Before starting

This guide is intended for developers and CSEs only as an easy way of getting a
running system for **development and learning purposes only**. Production
installations follow a totally different path that involves the deployment of
docker instances through [Federation](https://github.com/scality/Federation).

To use it outside the S3 Connector's Docker container environment,
Vaultclient needs a Node.js and Yarn envrionment

Recommended Node version: 10.16.x

Node.js can be installed from [nodejs.org](https://nodejs.org/) and Yarn can be
installed from [yarnpkg.com](https://yarnpkg.com/).

## Downloads and set-up

### Vault Client

Open a terminal and run the following:

``` sh
# clone this repository in a folder in your home
$> git clone https://github.com/scality/vaultclient.git ~/vaultClient
# go into the cloned folder
$> cd ~/vaultClient
# install relative dependencies
$> yarn install
```

### AWS CLI

Open a terminal and run the following command:

```sh
$> sudo pip install awscli==1.10.38
```

### Vault Server

Open a terminal and run the following:

``` sh
# clone the vault server repository in a folder in your home
$> git clone https://github.com/scality/Vault.git ~/vaultServer
# go into the cloned folder
$> cd ~/vaultServer
# install relative dependencies
$> npm install --production
```

## Provision your S3 account

In order to provision anything, you need to have a Vault Server running. Open a
terminal and run the following:

``` sh
# start your vault server
$> cd ~/vaultServer && npm start
# go into the client repository for next steps
$> cd ~/vaultClient
```

If you're interested in the API, or to get a more in-depth knowledge about
the next steps, please read our [examples](./Examples.md).

### Create an account

Decide on a name and email address for your account, and run:

``` sh
$> ./bin/vaultclient create-account --name accountName --email account@email.com
```

HTTP is used by default. However you can force the use of HTTPS by adding the
option '--https' to every command, like this:

``` sh
$> ./bin/vaultclient create-account --name accountName \
  --email account@email.com --https
```

You can also use self-signed certificate by adding the option ```--cafile``` to
the command line, like this:

``` sh
$> ./bin/vaultclient create-account --name accountName \
  --email account@email.com --https --cafile myca.crt
```

Or disable the ssl verification by using the option ```---noCaVerification```
to the command line, like:

```sh
$> ./bin/vaultclient create-account --name accountName \
  --email account@email.com --https --noCaVerification
```

If no ```--cafile``` or ```---noCaVerification``` is provided and Vault's
certificates are signed by a not well-known CA the connection will fail.

### Create an access key for the account

You will need an access key to be able to use the Amazon aws cli, by using the
following command:

```sh
$> ./bin/vaultclient generate-account-access-key --name accountName
```

You will have an output like:

```json
{
    "id": "XMHR9IQ9UYN56W1OSN2S",
    "value": "5tK4XOid7pXss66A7Jn=Yz7ybnMIB4Uf/BjavN58",
    "createDate": "2016-07-02T21:47:57Z",
    "lastUsedDate": "2016-07-02T21:47:57Z",
    "status": "Active",
}
```

You will need both ```id``` and ```value``` to configure Amanzon aws cli in
the next step. Where ```id``` is your access key and ```value``` is your
secret key.

### Set up amazon aws cli

With values of the access key previously generate, now configure the Amazon
aws cli:

```sh
$> aws configure
AWS Access Key ID [None]: XMHR9IQ9UYN56W1OSN2S
AWS Secret Access Key [None]: 5tK4XOid7pXss66A7Jn=Yz7ybnMIB4Uf/BjavN58
Default region name [None]: us-east-1
Default output format [None]: json
```

You can use aws cli to manager now.

### Create a user

Decide on a name for your user, and run:

``` sh
$> aws --endpoint-url http://localhost:8600 iam create-user --user-name userName
```

### Create an access-key for your user

To create your access key, run the following command:

``` sh
$> aws --endpoint-url http://localhost:8600 iam create-access-key --user-name userName
```

The response will print something like:

``` json
{
  "AccessKey": {
      "UserName": "userName",
      "Status": "Active",
      "CreateDate": "2015-03-09T18:39:23.411Z",
      "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYzEXAMPLEKEY",
      "AccessKeyId": "AKIAIOSFODNN7EXAMPLE"
  }
}
```

## Set up your .s3cfg

(if you don't have one, you probably need to
[install s3cmd](http://s3tools.org/s3cmd)).

You will now configure s3cmd by using the following commands:

```sh
$> s3cmd --configure
Enter new values or accept defaults in brackets with Enter.
Refer to user manual for detailed description of all options.

Access key and Secret key are your identifiers for Amazon S3. Leave them empty
for using the env variables.
Access Key: AKIAIOSFODNN7EXAMPLE
Secret Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYzEXAMPLEKEY
Default Region [US]:

Encryption password is used to protect your files from reading
by unauthorized persons while in transfer to S3
Encryption password:
Path to GPG program [/usr/bin/gpg]:

When using secure HTTPS protocol all communication with Amazon S3
servers is protected from 3rd party eavesdropping. This method is
slower than plain HTTP, and can only be proxied with Python 2.7 or newer
Use HTTPS protocol [Yes]: No

On some networks all internet access must go through a HTTP proxy.
Try setting it here if you can't connect to S3 directly
HTTP Proxy server name:

New settings:
  Access Key: AKIAIOSFODNN7EXAMPLE
  Secret Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYzEXAMPLEKEY
  Default Region: US
  Encryption password:
  Path to GPG program: /usr/bin/gpg
  Use HTTPS protocol: False
  HTTP Proxy server name:
  HTTP Proxy server port: 0

Test access with supplied credentials? [Y/n] n

Save settings? [y/N] y
Configuration saved to '~/.s3cfg'
```

```sh
$> sed -i 's/s3\.amazonaws\.com/localhost:8600/g' ~/.s3cfg
```

## Use s3cmd with your local S3 connector

You can now use s3cmd with your .s3cfg file. Try:

``` sh
$> s3cmd mb s3://myTestBucket
$> s3cmd ls
```

This should tell you that you have a bucket called ```s3://myTestBucket```.

You're good to go! Enjoy Vault Server and Vault Client.
