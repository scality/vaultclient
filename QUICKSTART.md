# How to play with vaultclient and s3cmd in 10 minutes (developers and CSEs only)

## Steps

1. [Before starting](#before-starting)
2. [Downloads and set-up](#downloads-and-set-up)
    1. [Vault Client](#vault-client)
    2. [Vault Server](#vault-server)
3. [Provision your S3 account](#provision-your-s3-account)
    1. [Create an account](#create-an-account)
    2. [Create a user](#create-a-user)
    3. [Create an access key for your user](#create-an-access-key-for-your-user)
4. [Set up your .s3cfg](#set-up-your-s3cfg)
5. [Use s3cmd with your local S3 connector] (#use-s3cmd-with-your-local-s3-connector)

## Before starting

This guide is intended for developers and CSEs only as an easy way of getting a
running system for **development and learning purposes only**. Production
installations follow a totally different path that involves the deployment of
docker instances through [Federation](https://github.com/scality/Federation).

## Downloads and set-up

### Vault Client

Open a terminal and run the following:

``` sh
# clone this repository in a folder in your home
$> git clone https://github.com/scality/vaultclient.git ~/vaultClient
# go into the cloned folder
$> cd ~/vaultClient
# install relative dependencies
$> npm install
```

### Vault Server

Open a terminal and run the following:

``` sh
# clone the vault server repository in a folder in your home
$> git clone https://github.com/scality/Vault.git ~/vaultServer
# go into the cloned folder
$> cd ~/vaultClient
# install relative dependencies
$> npm install
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

Decide on a name, password, and email address for your account, and run:

``` sh
$> bin/vaultclient create-account --name accountName  \
                                  --email account@email.com \
                                  --password accountPassword \
                                  --host 127.0.0.1
```

Keep in mind for the rest of this guide that the '--host' option is always
mandatory in vaultclient, indicating either Vault Server's IP or Fully Qualified
Domain Name.

### Create a user

Decide on a name, password, and email address for your user, and run:

``` sh
$> bin/vaultclient create-user --account-name accountName \
                               --name userName \
                               --email user@email.com \
                               --password userpassword \
                               --host 127.0.0.1
```

### Create an access-key for your user

Decide on a name, password, and email address for your user, and run:

``` sh
$> bin/vaultclient create-access-key --account-name accountName \
                                     --user-name userName \
                                     --host 127.0.0.1
```

The response will print something like:

``` sh
{
    "message": {
        "code": 201,
        "message": "Created",
        "body": {
            "accountName": "TestAccount",
            "userName": "TestUser",
            "status": "Active",
            "createDate": "2016-02-22T11:25:10+01:00",
            "id": "D4IT2AWSB588GO5J9T00", # save this field
            "value": "UEEu8tYlsOGGrgf4DAiSZD6apVNPUWqRiPG0nTB6" #save this field
        }
    }
}
```

Keep both the ```value``` and ```id``` fields, as you will need them for next
step.

## Set up your .s3cfg

Run your favourite text editor (here, we'll use vim), and open  your .s3cfg file
(if you don't have one, you probably need to
[install s3cmd](http://s3tools.org/s3cmd)).

``` sh
$> vim ~/.s3cfg
```

In this file, you need to set up the values for two fields:

- ```access_key``` needs to be set to ```id```;
- ```secret_key``` needs to be set to ```value```.

From the previous example, it should be:

```
access_key = D4IT2AWSB588GO5J9T00
secret_key = UEE8tYlsOGGrgf4DAiSZD6apVNPUWqRiPG0nTB6
```

## Use s3cmd with your local S3 connector

You can now use s3cmd with your .s3cfg file. Try:

``` sh
$> s3cmd mb s3://myTestBucket
$> s3cmd ls
```

This should tell you that you have a bucket called ```s3://myTestBucket```.

You're good to go! Enjoy Vault Server and Vault Client.
