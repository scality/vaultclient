const VaultClient = require('./lib/IAMClient');
const execSync = require('child_process').execSync;

var oidc = {};

function createCredentialsForARWWI(name, arn) {
    const roleToAssume = {
        name,// process.env.name || 'storage_manager',
        arn,// process.env.arn || 'storage-manager',
    }
    const options = {stdio : 'pipe' };
    const session = execSync(`curl -k -d "client_id=myclient" -d "username=${roleToAssume.name}" -d "password=123" -d "grant_type=password" "https://localhost:8443/auth/realms/myrealm/protocol/openid-connect/token"`, options);
    oidc[name] = JSON.parse(session.toString()).access_token;
    const arwwi = execSync(`aws sts assume-role-with-web-identity --role-session-name session-name --role-arn arn:aws:iam::545393165945:role/scality-internal/${roleToAssume.arn}-role --endpoint-url http://localhost:8800 --web-identity-token "${oidc[name]}"`, options);
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
        client8500: new VaultClient('localhost', 8500, false, undefined, undefined, undefined, undefined, 'Q79YIBI5L0S35VFUWBMA', 'LAzsT408QiMwZ7wUkkrsRzidPrkspJ+qIa0BiJIv'),
        client8600: new VaultClient('localhost', 8600, false, undefined, undefined, undefined, undefined, 'Q79YIBI5L0S35VFUWBMA', 'LAzsT408QiMwZ7wUkkrsRzidPrkspJ+qIa0BiJIv'),
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
    // user: {
    //     client8500: new VaultClient('localhost', 8500, false, undefined, undefined, undefined, undefined, 'XRSS4WVK0AMZ67URD3V6', 'ZcAezW+o//J0OkgSg8qtwF/aUbLtB3rU9Z2w/JrY'),
    //     client8600: new VaultClient('localhost', 8600, false, undefined, undefined, undefined, undefined, 'XRSS4WVK0AMZ67URD3V6', 'ZcAezW+o//J0OkgSg8qtwF/aUbLtB3rU9Z2w/JrY'),
    //     expected: {
    //         'CheckPermissions': true,
    //         'CreateAccount': false,
    //         'ListAccounts': false,
    //         'GetAccount': false,
    //     }
    // },
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
    clients[clientName].client8500.checkPermissions(request, _oidc, {}, (err, result) => {
        const api = 'CheckPermissions';
        logResult(clientName, api, err, clients[clientName].expected[api], result);
    });

    // OIDC-based APIs
    // Should be denied for non admin or non-oidc based calls
    clients[clientName].client8600.listAccounts({}, _oidc, (err, result) => {
        const api = 'ListAccounts';
        logResult(clientName, api, err, clients[clientName].expected[api], result);
    });
    clients[clientName].client8600.createAccount('test'+Math.random().toString(), {
        email: Math.random().toString()+'test@scality.com',
    }, _oidc, (err, result) => {
        const api = 'CreateAccount';
        logResult(clientName, api, err, clients[clientName].expected[api], result);
    });

    // Policy-based APIs
    clients[clientName].client8600.getAccount({
        accountName: 'AccountTest',
    }, _oidc, (err, result) => {
        const api = 'GetAccount';
        logResult(clientName, api, err, clients[clientName].expected[api], result);
    });
});