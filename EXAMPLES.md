# Usage examples

## Tables of contents

1. [Entity creation and deletion](#entity-creation-and-deletion)
    1. [create-account](#create-account)
    2. [delete-account](#delete-account)
    3. [create-user](#create-user)
    4. [delete-user](#delete-user)
    5. [create-access-key](#create-access-key)
        1. [for an account](#for-an-account)
        2. [for a user](#for-a-user)
    6. [delete-access-key](#delete-access-key)

## Entity creation and deletion

This page provides quick example one-liners on how to create and delete entities
by using the different routes supported by vaultclient and Vault.

See [Vault's design document]
(https://github.com/scality/IronMan-Vault/blob/master/Design.md) for a recap
on how entities are related in our supported IAM model.

The Vault server is assumed to be running at 127.0.0.1:8500 in the following
examples. Keep in mind that the '--host' option is always mandatory, indicating
either Vault Server's IP or Fully Qualified Domain Name.

### Accounts

#### create-account

```sh
$ bin/vaultclient create-account --name TestAccount --email account@test.com \
                                 --password accountpassword --host 127.0.0.1

 {
    "message": {
        "code": 201,
        "message": "Created",
        "body": {
            "arn": "arn:aws:iam::117099473272:/TestAccount/",
            "id": "117099473272",
            "canonicalId": "CER9UNUF89LNFWQCS90RHR0WHTYUW9Q3HY9KBUMSR75V9B4VXG \
                            J0RF89X8SQEBSG"
        }
    }
}
```

#### delete-account

```sh
$ bin/vaultclient delete-account --name TestAccount --host 127.0.0.1

{
    "message": {
        "code": 204,
        "message": "No content."
    }
}
```

### Users

NB: to create a user, you need to have created an account to which the user
will belong

#### create-user

```sh
$ bin/vaultclient create-user --account-name TestAccount --name TestUser \
                              --email user@test.com --password userpassword \
                              --host 127.0.0.1

{
    "message": {
        "code": 201,
        "message": "Created",
        "body": {
            "arn": "arn:aws:iam::117099473272:/TestUser/",
            "id": "5EF3TQIXSXP3QFLF8783TT8ZLO37XJLK",
            "name": "TestUser",
            "createDate": "2016-02-22T11:24:39+01:00"
        }
    }
}
```

#### delete-user

```sh
$ bin/vaultclient delete-user --account-name TestAccount --name TestUser \
                              --host 127.0.0.1

{
    "message": {
        "code": 204,
        "message": "No content."
    }
}
```

### Access keys

NB: an access-key is created for a user or for account (not recommended as
it poses security threats)

#### create-access-key

##### for a user

```sh
$ bin/vaultclient create-access-key --account-name TestAccount \
                                    --user-name TestUser --host 127.0.0.1

{
    "message": {
        "code": 201,
        "message": "Created",
        "body": {
            "accountName": "TestAccount",
            "userName": "TestUser",
            "status": "Active",
            "createDate": "2016-02-22T11:25:10+01:00",
            "id": "D4IT2AWSB588GO5J9T00",
            "value": "UEEu8tYlsOGGrgf4DAiSZD6apVNPUWqRiPG0nTB6"
        }
    }
}
```

##### for an account

Creation for account TestAccount (requests authenticated with this key will
be considered as performed by the account itself, not advisable):

```sh
$ bin/vaultclient create-access-key --account-name TestAccount --host 127.0.0.1

{
    "message": {
        "code": 201,
        "message": "Created",
        "body": {
            "accountName": "TestAccount",
            "status": "Active",
            "createDate": "2016-02-22T11:25:37+01:00",
            "id": "7C66DCVN609K7ZHDBVZ0",
            "value": "JXxTT04NxiWb6NcES+rpkHnkXszDq3KxexocJIJ9"
        }
    }
}
```

#### delete-access-key

```sh
$ bin/vaultclient delete-access-key --id 7C66DCVN609K7ZHDBVZ0 --host 127.0.0.1

{
    "message": {
        "code": 204,
        "message": "No content."
    }
}
```
