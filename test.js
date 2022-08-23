const VaultClient = require('./lib/IAMClient');
const execSync = require('child_process').execSync;

const execOptions = { stdio : 'pipe' };
var oidc = {};
var accountId = '';
var accountAK = '';
var accountSK = '';
var userAK = '';
var userSK = '';

function boostrap() {
    const accName = 'AccountTest';
    try {
        const access = execSync(`vaultclient generate-account-access-key --name ${accName}`, execOptions);
        accountAK = JSON.parse(access.toString()).id;
        accountSK = JSON.parse(access.toString()).value;
        try {
            execSync(`AWS_ACCESS_KEY_ID=${accountAK} AWS_SECRET_ACCESS_KEY=${accountSK} aws iam delete-user --user-name ${accName}-user --endpoint http://localhost:8600`, execOptions);
        } catch (err) { }
        execSync(`vaultclient delete-account --name ${accName}`, execOptions);
    } catch (err) {
        console.error(err)
    }
    const acc = execSync(`vaultclient create-account --name ${accName} --email ${accName}@scality.local`, execOptions);
    accountId = JSON.parse(acc.toString()).account.id;
    accountName = accName;
    const access = execSync(`vaultclient generate-account-access-key --name ${accName}`, execOptions);
    accountAK = JSON.parse(access.toString()).id;
    accountSK = JSON.parse(access.toString()).value;
    execSync(`AWS_ACCESS_KEY_ID=${accountAK} AWS_SECRET_ACCESS_KEY=${accountSK} aws iam create-user --user-name ${accName}-user --endpoint http://localhost:8600`, execOptions);
    const user = execSync(`AWS_ACCESS_KEY_ID=${accountAK} AWS_SECRET_ACCESS_KEY=${accountSK} aws iam create-access-key --user-name ${accName}-user --endpoint-url http://localhost:8600`, execOptions);
    userAK = JSON.parse(user.toString()).AccessKey.AccessKeyId;
    userSK = JSON.parse(user.toString()).AccessKey.SecretAccessKey;
}

boostrap();

function createCredentialsForARWWI(name, arn) {
    const roleToAssume = {
        name,
        arn,
    }
    const session = execSync(`curl -k -d "client_id=myclient" -d "username=${roleToAssume.name}" -d "password=123" -d "grant_type=password" "https://localhost:8443/auth/realms/myrealm/protocol/openid-connect/token"`, execOptions);
    oidc[name] = JSON.parse(session.toString()).access_token;
    const arwwi = execSync(`aws sts assume-role-with-web-identity --role-session-name session-name --role-arn arn:aws:iam::${accountId}:role/scality-internal/${roleToAssume.arn}-role --endpoint-url http://localhost:8800 --web-identity-token "${oidc[name]}"`, execOptions);
    return {
        accessKey: JSON.parse(arwwi.toString()).Credentials.AccessKeyId,
        secretKey: JSON.parse(arwwi.toString()).Credentials.SecretAccessKey,
        securityToken: JSON.parse(arwwi.toString()).Credentials.SessionToken,
    };
}

const storage_manager = createCredentialsForARWWI('storage_manager', 'storage-manager');
const storage_account_owner = createCredentialsForARWWI('storage_account_owner', 'storage-account-owner');
const data_consumer = createCredentialsForARWWI('data_consumer', 'data-consumer');

const clients = {
    admin: 
    {
        client: new VaultClient('localhost', 8600, false, undefined, undefined, undefined, undefined, 'D4IT2AWSB588GO5J9T00', 'UEEu8tYlsOGGrgf4DAiSZD6apVNPUWqRiPG0nTB6'),
        expected: {
            'CheckPermissions': false,
            'CreateAccount': true,
            'ListAccounts': true,
            'GetAccount': true,
            'DeleteAccount': true,
            'GenerateAccountAccessKey': true,
            'UpdateAccountAttributes': true,
            'UpdateAccountQuota': true,
            'DeleteAccountQuota': true,
        }
    },
    account: {
        client: new VaultClient('localhost', 8600, false, undefined, undefined, undefined, undefined, accountAK, accountSK),
        expected: {
            'CheckPermissions': true,
            'CreateAccount': false,
            'ListAccounts': false,
            'GetAccount': false,
            'DeleteAccount': false,
            'GenerateAccountAccessKey': false,
            'UpdateAccountAttributes': false,
            'UpdateAccountQuota': false,
            'DeleteAccountQuota': false,
        }
    },
    storage_manager: {
        client: new VaultClient('localhost', 8600, false, undefined, undefined, undefined, undefined, storage_manager.accessKey, storage_manager.secretKey, undefined, undefined, storage_manager.securityToken),
        expected: {
            'CheckPermissions': true,
            'CreateAccount': false,
            'ListAccounts': false,
            'GetAccount': true,
            'DeleteAccount': true,
            'GenerateAccountAccessKey': true,
            'UpdateAccountAttributes': true,
            'UpdateAccountQuota': true,
            'DeleteAccountQuota': true,
        }
    },
    storage_account_owner: {
        client: new VaultClient('localhost', 8600, false, undefined, undefined, undefined, undefined, storage_account_owner.accessKey, storage_account_owner.secretKey, undefined, undefined, storage_account_owner.securityToken),
        expected: {
            'CheckPermissions': true,
            'CreateAccount': false,
            'ListAccounts': false,
            'GetAccount': true,
            'DeleteAccount': true,
            'GenerateAccountAccessKey': true,
            'UpdateAccountAttributes': true,
            'UpdateAccountQuota': true,
            'DeleteAccountQuota': true,
        }
    },
    data_consumer: {
        client: new VaultClient('localhost', 8600, false, undefined, undefined, undefined, undefined, data_consumer.accessKey, data_consumer.secretKey, undefined, undefined, data_consumer.securityToken),
        expected: {
            'CheckPermissions': true,
            'CreateAccount': false,
            'ListAccounts': false,
            'GetAccount': true,
            'DeleteAccount': false,
            'GenerateAccountAccessKey': false,
            'UpdateAccountAttributes': false,
            'UpdateAccountQuota': false,
            'DeleteAccountQuota': false,
        }
    },
    user: {
        client: new VaultClient('localhost', 8600, false, undefined, undefined, undefined, undefined, userAK, userSK),
        expected: {
            'CheckPermissions': true,
            'CreateAccount': false,
            'ListAccounts': false,
            'GetAccount': false,
            'DeleteAccount': false,
            'GenerateAccountAccessKey': false,
            'UpdateAccountAttributes': false,
            'UpdateAccountQuota': false,
            'DeleteAccountQuota': false,
        }
    },
    oidc_storage_manager: {
        client: new VaultClient('localhost', 8600, false),
        expected: {
            'CheckPermissions': true,
            'CreateAccount': true,
            'ListAccounts': true,
            'GetAccount': false,
            'DeleteAccount': false,
            'GenerateAccountAccessKey': false,
            'UpdateAccountAttributes': false,
            'UpdateAccountQuota': false,
            'DeleteAccountQuota': false,
        }
    },
    oidc_storage_account_owner: {
        client: new VaultClient('localhost', 8600, false),
        expected: {
            'CheckPermissions': true,
            'CreateAccount': false,
            'ListAccounts': true,
            'GetAccount': false,
            'DeleteAccount': false,
            'GenerateAccountAccessKey': false,
            'UpdateAccountAttributes': false,
            'UpdateAccountQuota': false,
            'DeleteAccountQuota': false,
        }
    },
    oidc_data_consumer: {
        client: new VaultClient('localhost', 8600, false),
        expected: {
            'CheckPermissions': true,
            'CreateAccount': false,
            'ListAccounts': true,
            'GetAccount': false,
            'DeleteAccount': false,
            'GenerateAccountAccessKey': false,
            'UpdateAccountAttributes': false,
            'UpdateAccountQuota': false,
            'DeleteAccountQuota': false,
        }
    },
};


const request = JSON.stringify([
    {
        'action': 'CreateAccount',
        'service': 'scality',
        'generalResource': 'root',
        'specificResources': ['*'],
    },
    {
        'action': 'DeleteAccount',
        'service': 'scality',
        'generalResource': 'root',
        'specificResources': ['*'],
    },
    {
        'action': 'GetAccount',
        'service': 'scality',
        'generalResource': 'root',
        'specificResources': ['AccountTest'],
    },
    {
        'action': 'ListAccounts',
        'service': 'scality',
        'generalResource': 'root',
        'specificResources': ['*'],
    },
    {
        'action': 'GenerateAccountAccessKey',
        'service': 'scality',
        'generalResource': 'root',
        'specificResources': ['AccountTest'],
    },
    {
        'action': 'UpdateAccountAttributes',
        'service': 'scality',
        'generalResource': 'root',
        'specificResources': ['AccountTest'],
    },
    {
        'action': 'UpdateAccountQuota',
        'service': 'scality',
        'generalResource': 'root',
        'specificResources': ['AccountTest'],
    },
    {
        'action': 'DeleteAccountQuota',
        'service': 'scality',
        'generalResource': 'root',
        'specificResources': ['AccountTest'],
    },
]);

function logResult(name, api, err, expecting, result) {
    console.log(
        (err ? 'ERROR' : 'OK') === (expecting ? 'OK' : 'ERROR') ? '[OK]' : '[ERROR]',
        api,
        name,
        // result, err,
    );
}

Object.keys(clients).forEach(clientName => {
    if (clientName.includes('oidc')) {
        clients[clientName].client.setWebIdentityToken(oidc[clientName.replace('oidc_', '')]);
    }

    // OIDC-based + AuthV4 based calls (without admin access keys)
    clients[clientName].client.checkPermissions(request, {}, (err, result) => {
        const api = 'CheckPermissions';
        logResult(clientName, api, err, clients[clientName].expected[api], result);
    });

    // OIDC-based APIs
    // Should be denied for non admin or non-oidc based calls
    clients[clientName].client.listAccounts({}, (err, result) => {
        const api = 'ListAccounts';
        logResult(clientName, api, err, clients[clientName].expected[api], result);
    });
    clients[clientName].client.createAccount('test' + Math.random().toString(), {
        email: Math.random().toString() + 'test@scality.com',
    }, (err, result) => {
        const api = 'CreateAccount';
        logResult(clientName, api, err, clients[clientName].expected[api], result);
    });

    // Policy-based APIs
    clients[clientName].client.getAccount({
        accountName: 'AccountTest',
    }, (err, result) => {
        const api = 'GetAccount';
        logResult(clientName, api, err, clients[clientName].expected[api], result);
    });

    clients[clientName].client.deleteAccount('AccountTestTemp', (err, result) => {
        const api = 'DeleteAccount';
        // Hack to prevent having to sync account creations
        if (err?.is.NoSuchEntity) {
            err = null;
        }
        logResult(clientName, api, err, clients[clientName].expected[api], result);
    });

    clients[clientName].client.generateAccountAccessKey('AccountTest', (err, result) => {
        const api = 'GenerateAccountAccessKey';
        // Hack to prevent having to sync account creations
        if (err?.is.NoSuchEntity) {
            err = null;
        }
        logResult(clientName, api, err, clients[clientName].expected[api], result);
    });

    clients[clientName].client.updateAccountAttributes('AccountTest', {}, (err, result) => {
        const api = 'UpdateAccountAttributes';
        // Hack to prevent having to sync account creations
        if (err?.is.NoSuchEntity) {
            err = null;
        }
        logResult(clientName, api, err, clients[clientName].expected[api], result);
    });

    clients[clientName].client.updateAccountQuota('AccountTest', 1000, (err, result) => {
        const api = 'UpdateAccountQuota';
        // Hack to prevent having to sync account creations
        if (err?.is.NoSuchEntity) {
            err = null;
        }
        logResult(clientName, api, err, clients[clientName].expected[api], result);
    });

    clients[clientName].client.deleteAccountQuota('AccountTest', (err, result) => {
        const api = 'DeleteAccountQuota';
        // Hack to prevent having to sync account creations
        if (err?.is.NoSuchEntity) {
            err = null;
        }
        logResult(clientName, api, err, clients[clientName].expected[api], result);
    });
});
