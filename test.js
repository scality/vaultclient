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
        execSync(`AWS_ACCESS_KEY_ID=${accountAK} AWS_SECRET_ACCESS_KEY=${accountSK} aws iam delete-user --user-name ${accName}-user --endpoint http://localhost:8600`, execOptions);
        execSync(`vaultclient delete-account --name ${accName}`, execOptions);
    } catch(err) {}
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
        client8500: new VaultClient('localhost', 8500, false, undefined, undefined, undefined, undefined, 'D4IT2AWSB588GO5J9T00', 'UEEu8tYlsOGGrgf4DAiSZD6apVNPUWqRiPG0nTB6'),
        client8600: new VaultClient('localhost', 8600, false, undefined, undefined, undefined, undefined, 'D4IT2AWSB588GO5J9T00', 'UEEu8tYlsOGGrgf4DAiSZD6apVNPUWqRiPG0nTB6'),
        expected: {
            'CheckPermissions': false,
            'CreateAccount': true,
            'ListAccounts': true,
            'GetAccount': true,
        }
    },
    account: {
        client8500: new VaultClient('localhost', 8500, false, undefined, undefined, undefined, undefined, accountAK, accountSK),
        client8600: new VaultClient('localhost', 8600, false, undefined, undefined, undefined, undefined, accountAK, accountSK),
        expected: {
            'CheckPermissions': true,
            'CreateAccount': false,
            'ListAccounts': false,
            'GetAccount': false,
        }
    },
    storage_manager: {
        client8500: new VaultClient('localhost', 8500, false, undefined, undefined, undefined, undefined, storage_manager.accessKey, storage_manager.secretKey, undefined, undefined, undefined, storage_manager.securityToken),
        client8600: new VaultClient('localhost', 8600, false, undefined, undefined, undefined, undefined, storage_manager.accessKey, storage_manager.secretKey, undefined, undefined, undefined, storage_manager.securityToken),
        expected: {
            'CheckPermissions': true,
            'CreateAccount': false,
            'ListAccounts': false,
            'GetAccount': true,
        }
    },
    storage_account_owner: {
        client8500: new VaultClient('localhost', 8500, false, undefined, undefined, undefined, undefined, storage_account_owner.accessKey, storage_account_owner.secretKey, undefined, undefined, undefined, storage_account_owner.securityToken),
        client8600: new VaultClient('localhost', 8600, false, undefined, undefined, undefined, undefined, storage_account_owner.accessKey, storage_account_owner.secretKey, undefined, undefined, undefined, storage_account_owner.securityToken),
        expected: {
            'CheckPermissions': true,
            'CreateAccount': false,
            'ListAccounts': false,
            'GetAccount': true,
        }
    },
    data_consumer: {
        client8500: new VaultClient('localhost', 8500, false, undefined, undefined, undefined, undefined, data_consumer.accessKey, data_consumer.secretKey, undefined, undefined, undefined, data_consumer.securityToken),
        client8600: new VaultClient('localhost', 8600, false, undefined, undefined, undefined, undefined, data_consumer.accessKey, data_consumer.secretKey, undefined, undefined, undefined, data_consumer.securityToken),
        expected: {
            'CheckPermissions': true,
            'CreateAccount': false,
            'ListAccounts': false,
            'GetAccount': true,
        }
    },
    user: {
        client8500: new VaultClient('localhost', 8500, false, undefined, undefined, undefined, undefined, userAK, userSK),
        client8600: new VaultClient('localhost', 8600, false, undefined, undefined, undefined, undefined, userAK, userSK),
        expected: {
            'CheckPermissions': true,
            'CreateAccount': false,
            'ListAccounts': false,
            'GetAccount': false,
        }
    },
    oidc_storage_manager: {
        client8500: new VaultClient('localhost', 8500, false),
        client8600: new VaultClient('localhost', 8600, false),
        expected: {
            'CheckPermissions': true,
            'CreateAccount': true,
            'ListAccounts': true,
            'GetAccount': false,
        }
    },
    oidc_storage_account_owner: {
        client8500: new VaultClient('localhost', 8500, false),
        client8600: new VaultClient('localhost', 8600, false),
        expected: {
            'CheckPermissions': true,
            'CreateAccount': false,
            'ListAccounts': true,
            'GetAccount': false,
        }
    },
    oidc_data_consumer: {
        client8500: new VaultClient('localhost', 8500, false),
        client8600: new VaultClient('localhost', 8600, false),
        expected: {
            'CheckPermissions': true,
            'CreateAccount': false,
            'ListAccounts': true,
            'GetAccount': false,
        }
    },
};


const request = JSON.stringify([
    {
        'action': 'CreateAccount',
        'service': 'scality',
        'generalResource': 'root',
        'specificResources': ['william'],
    },
    {
        'action': 'DeleteAccount',
        'service': 'scality',
        'generalResource': 'root',
        'specificResources': ['william'],
    },
    {
        'action': 'GetAccount',
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
        //result, err,
    );
}

Object.keys(clients).forEach(clientName => {
    const _oidc = clientName.includes('oidc') ? oidc[clientName.replace('oidc_', '')] : undefined;

    // OIDC-based + AuthV4 based calls (without admin access keys)
    clients[clientName].client8500.checkPermissions(request, {}, (err, result) => {
        const api = 'CheckPermissions';
        logResult(clientName, api, err, clients[clientName].expected[api], result);
    }, _oidc);

    // OIDC-based APIs
    // Should be denied for non admin or non-oidc based calls
    clients[clientName].client8600.listAccounts({}, (err, result) => {
        const api = 'ListAccounts';
        logResult(clientName, api, err, clients[clientName].expected[api], result);
    }, _oidc);
    clients[clientName].client8600.createAccount('test'+Math.random().toString(), {
        email: Math.random().toString()+'test@scality.com',
    }, (err, result) => {
        const api = 'CreateAccount';
        logResult(clientName, api, err, clients[clientName].expected[api], result);
    }, _oidc);

    // Policy-based APIs
    clients[clientName].client8600.getAccount({
        accountName: 'AccountTest',
    }, (err, result) => {
        const api = 'GetAccount';
        logResult(clientName, api, err, clients[clientName].expected[api], result);
    }, _oidc);
});