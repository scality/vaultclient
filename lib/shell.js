import process from 'process';
import readline from 'readline';
import { EOL as eol } from 'os';

import IAMClient from './IAMClient.js';

const client = new IAMClient();
let rl;

/** @constant
 *   @type {String[]} - Available commands in the IAM CLI
 */
const commands = [
    'create-account ',
    'generate-credential-report ',
    'delete-account ',
    'create-group ',
    'delete-group ',
    'delete-group-policy ',

    'create-user ',
    'delete-user ',
    'create-user-policy ',
    'delete-user-policy ',
    'create-login-profile ',
    'create-login-profile ',

    'create-role ',
    'delete-role ',
    'delete-role-policy ',

    'create-access-key ',
    'delete-access-key ',

    'create-open-id-connect-provider ',
    'get-open-id-connect-provider ',
    'delete-open-id-connect-provider ',
    'add-client-id-to-open-id-connect-provider ',
    'remove-client-id-from-open-id-connect-provider ',
    'update-open-id-connect-provider-thumbprint ',

    'create-saml-provider ',
    'delete-saml-provider ',
    'update-saml-provider ',

    'exit ',
    'help ',
];

/** @constant
 *   @type {String[]} - required arguments for any shell command
 */
const generalArgs = [
    '--cli-input-json',
    '--generate-cli-skeleton',
];

/** @constant
 *   @type {Object} - required input specific to each call
 */
const expectedArgs = {
    "create-account": [
        '--account-name',
        '--account-email',
        '--account-password',
    ],
    "create-user": [
        '--account-name',
        '--user-name',
        '--user-email',
        '--user-password',
    ],
    'create-access-key': [
        '--account-name',
        '--user-name',
    ],
    "delete-account": [
        '--account-name',
    ],
};

/** @constant
 *   @type {Object} - required data keys specific to each call
 */
const dataKeys = {
    "create-account": [
        '--account-name',
        '--account-email',
        '--account-password',
    ],
    "create-user": [
        '--account-name',
        '--user-name',
        '--user-email',
        '--user-password',
    ],
    "create-access-key": [
        '--account-name',
        '--user-name',
    ],
    "delete-account": [
    ],
};

/** @constant
 *   @type {Object} - required metadata keys specific to each call
 */
const metadataKeys = {
    "create-account": [
    ],
    "create-user": [
    ],
    "create-access-key": [
    ],
    "delete-account": [
        '--account-name',
    ],
};

/** @constant
 *   @type {Object} - equivalences of command line keys and DB keys
 */
const paramFieldEquivalence = {
    'create-account': {
        '--account-name': 'name',
        '--account-email': 'emailAddress',
        '--account-password': 'saltedPwd',
    },
    'create-user': {
        '--account-name': 'accountName',
        '--user-name': 'name',
        '--user-email': 'emailAddress',
        '--user-password': 'saltedPasswd'
    },
    'create-access-key': {
        '--account-name': 'accountName',
        '--user-name': 'userName',
    },
    'delete-account': {
        '--account-name': 'name',
    },
};

/**
 *  This function implements currying to manage exiting or refreshing the CLI:
 *  it depends on the mode the CLI is summoned in (oneliner or interactive), and
 *  the actual command the user sent (the display is command specific)
 *
 *  @param {Function} nextStep - Exits or prompts depending on the entry point
 *  @param {Function} responseHandler - Displays data returned by server
 *  @returns {Function} - The callback for most shell functions
 */
function nextStepGen(nextStep, responseHandler) {
    return function doNext(err, data) {
        responseHandler(err, data);
        return err ? nextStep(1) : nextStep(0);
    };
}

/**
 *  @param {String} functionName - The shell command that resulted in the error
 *  @param {String} code - The error code returned by the server
 *  @param {String} message - The error message returned by the server
 *  @returns {undefined}
 */
function printError(functionName, code, message) {
    process.stderr.write(`Error: ${functionName}, ${code}, ${message}${eol}`);
}

/**
 *  @param {String} functionName - The shell command that resulted in the
 *  response
 *  @param {String} response - A JSON of the response message
 *  returned by the server
 *  @returns {undefined}
 */
function printResponse(functionName, response) {
    let body = '';

    if (response.body) {
        body = JSON.stringify(response.body);
    }
    process.stdout.write(`Info: ${functionName}, ${response.code}, ` +
        `${response.message}, ${body}${eol}`);
}

/**
 *  @param {String[]} enteredArgs - The arguments entered by the user
 *  @param {String} parameter - The parameter to find the value of
 *  @returns {String} - Returns the value of the specified parameter
 */
function getValueForParam(enteredArgs, parameter) {
    const parameterIndex = enteredArgs.indexOf(parameter);
    let ret;

    if (parameterIndex === -1) {
        ret = null;
    } else {
        ret = enteredArgs[parameterIndex + 1];
    }
    return ret;
}

/**
 *  This function formats data to match DB keys
 *
 *  @param {String[]} parameters - The DB keys
 *  @param {String[]} enteredArgs - The arguments entered by the user
 *  @returns {Object} - Returns the formatted data
 */
function getFormattedDataForRequest(parameters, enteredArgs) {
    const data = {};
    const call = enteredArgs[0];

    parameters.forEach((parameter) => {
        data[paramFieldEquivalence[call][parameter]] = getValueForParam(
            enteredArgs, parameter);
    });
    return data;
}

/**
 *  @param {String} prev - the previous argument string
 *  @param {String} curr - the current argument string
 *  @returns {String} - Returns a concatenation of args
 */
function generateArgStringCb(prev, curr) {
    return `${prev}${curr} <${curr.substring(2)}> `;
}

/**
 *  @param {String} call - The command entered by the user
 *  @param {Number} maxArgNumber - The maximum number of arguments authorized
 *  for this command
 *  @returns {String} - Returns a string describing the proper usage of the
 *  command
 */
function usageInCaseOfError(call, maxArgNumber) {
    let returnString = "";
    const argStr = expectedArgs[call].reduce(generateArgStringCb, '');

    if (maxArgNumber > 1) {
        returnString = `Expected ${maxArgNumber} or ${maxArgNumber - 2} ` +
        `arguments.${eol}USAGE:${eol}${call} ${argStr}${eol}OR ${call} ` +
        `--cli-input-json <path>`;
    } else {
        returnString = `Expected 1 argument.${eol}USAGE: ${call}`;
    }
    return returnString;
}

/**
 *  Checks whether the command and arguments entered by the user are correct.
 *
 *  @param {String} call - The command entered by the user
 *  @param {String[]} enteredArgs - The command line entered by the user
 *  @param {Number} maxArgNumber - The maximum number of arguments authorized
 *  for this command
 *  @returns {Number} - Returns 0 upon success, otherwise an error is thrown
 *  (see argError()) and the program stops.
 */
function checkArgs(call, enteredArgs, maxArgNumber) {
    if (maxArgNumber === 0 && enteredArgs.length === 0) {
        return (0);
    }
    if (generalArgs.indexOf(enteredArgs[1]) > -1
        && enteredArgs.length === maxArgNumber - 2) {
        return (0);
    }
    if (enteredArgs.length === maxArgNumber) {
        if (expectedArgs[call].every((current) => {
            return (enteredArgs.indexOf(current) > -1);
        })) {
            return 0;
        }
    }
    process.stderr.write(`${usageInCaseOfError(call, maxArgNumber)}${eol}`);
    return 1;
}

/**
 *  @param {String} call - The command entered by the user
 *  @returns {Number} - Returns the maximum number of arguments for this command
 *  There is no error returned as the check was made during the 'switch' at
 *  runCommand().
 */
function getMaxArgNumber(call) {
    return expectedArgs[call].length * 2 + 1;
}

/**
 *  @param {String} command - The command entered by the user
 *  @returns {Function} - Callback used to print response messages
 */
function actionCb(command) {
    return (err, data) => {
        if (err) {
            const msg = JSON.parse(err).message;
            printError(command, msg.code, msg.message);
        } else {
            const msg = JSON.parse(data).message;
            printResponse(command, msg);
        }
    };
}

/**
 *  @param {String} command - The command entered by the user
 *  @param {String[]} enteredArgs - The command line entered by the user
 *  @param {String} action - Name of the function sending the appropriate http
 *  request
 *  @param {Function} nextStep - Generates a callback
 *  @returns {void}
 */
function actionGen(command, enteredArgs, action, nextStep) {
    const maxArgNumber = getMaxArgNumber(command);

    if (!checkArgs(command, enteredArgs, maxArgNumber)) {
        const data = getFormattedDataForRequest(dataKeys[command], enteredArgs);
        if (command === 'create-access-key' && data.userName === '0') {
            delete data.userName;
        }
        const metadata = getFormattedDataForRequest(metadataKeys[command],
            enteredArgs);
        client[action](command, data, metadata, nextStepGen(nextStep,
            actionCb(command)));
    }
}

/**
 *  It displays a list of available commands
 *  @param {Function} nextStep - Either prompts or exits depending on the mode
 *  @param {Number} code - Exit code
 *  @returns {Number} - Success exit code is 0
 */
function help(nextStep, code) {
    process.stderr.write(`help: Available commands are:${eol}`);
    commands.forEach((c) => {
        process.stderr.write(`${c}${eol}`);
    });
    nextStep(code);
}

/**
 * This function yields the error number 1 to the nextStep callback through
 * the help display function. This is made to allow differenciating success
 * and failure from the shell, since the CLI mode uses a process.exit as a
 * nextStep callback
 *
 * @param {String[]} tab - The command line containing an error
 * @param {Function} nextStep - Either prompts or exits depending on the mode
 */
function errorCommand(tab, nextStep) {
    process.stderr.write(`Command not found : ${tab}${eol}`);
    help(nextStep, 1);
}

/**
 *  @param {String[]} enteredArgs - Command line from effective function call
 *  @param {Function} nextStep - Either exits the process or prompts,
 *  depending on the point of entry in the CLI
 *  @returns {Number} - Success code is 0, error codes are explicited in
 *  each functions
 *  All commented code is due to pending route implementation
 */
function runCommand(enteredArgs, nextStep) {
    switch (enteredArgs[0]) {
    case 'create-account' :
        return actionGen('create-account', enteredArgs, 'create', nextStep);
/*
    case 'generate-credential-report' :
        generateCredentialReport(enteredArgs);
        break;
*/
    case 'delete-account' :
        return actionGen('delete-account', enteredArgs, 'delete', nextStep);
/*
    case 'create-group' :
        createGroup(enteredArgs);
        break;
    case 'delete-group' :
        deleteGroup(enteredArgs);
        break;
    case 'delete-group-policy' :
        deleteGroupPolicy(enteredArgs);
        break;
 */
    case 'create-user':
        return actionGen('create-user', enteredArgs, 'create', nextStep);
/*
    case 'delete-user':
        deleteUser(tab);
        break;
    case 'create-user-policy':
        createUserPolicy(enteredArgs);
        break;
    case 'delete-user-policy':
        deleteUserPolicy(enteredArgs);
        break;
    case 'create-login-profile':
        createLoginProfile(enteredArgs);
        break;
    case 'delete-login-profile':
        deleteLoginProfile(enteredArgs);
        break;
    case 'create-role':
        createRole(enteredArgs);
        break;
    case 'delete-role':
        deleteRole(enteredArgs);
        break;
    case 'delete-role-policy':
        deleteRolePolicy(enteredArgs);
        break;
    case 'create-user':
        createUser(enteredArgs);
        break;
 */
    case 'create-access-key':
        return actionGen('create-access-key', enteredArgs, 'create', nextStep);
/*
    case 'delete-access-key':
        deleteAccessKey(enteredArgs);
        break;
    case 'create-open-id-connect-provider':
        createOidcp(enteredArgs);
        break;
    case 'get-open-id-connect-provider':
        getOidcp(enteredArgs);
        break;
    case 'delete-open-id-connect-provider':
        deleteOidcp(enteredArgs);
        break;
    case 'add-client-id-to-open-id-connect-provider':
        addClientIdToOidcp(enteredArgs);
        break;
    case 'remove-client-id-from-open-id-connect-provider':
        removeclientIdFromOidcp(enteredArgs);
        break;
    case 'update-open-id-connect-provider-thumbprint':
        updateOidcpThumbprint(enteredArgs);
        break;
    case 'create-saml-provider':
        createSamlp(enteredArgs);
        break;
    case 'delete-saml-provider':
        deleteSamlp(enteredArgs);
        break;
    case 'update-saml-provider':
        updateSamlp(enteredArgs);
        break;
 */
    case 'exit':
        if (rl) {
            return rl.close();
        }
        return 0;
    case 'help':
        return help(nextStep, 0);
    default :
        return errorCommand(enteredArgs, nextStep);
    }
}

/**
 *  @param {String[]} tab - argument of interest
 *  @param {String} string - the whole command line
 *  @returns {String[]} - returns input (tab and string)
 */
function find(tab, string) {
    const hits = tab.filter((c) => {
        return c.indexOf(string) === 0;
    });
    if (hits.length !== 0) {
        return [hits, string];
    } else if (tab.length <= 1) {
        return [[string], string];
    }
    return [tab, string];
}

/**
 *  @param {String} line - the whole command line
 *  @returns {String[]|String}
 *   - String[] contains tab, the current argument of interest,
 *   and string, which may contain options;
 *   - String is the command line, if the case is not handled;
 */
function completer(line) {
    const tab = line.split(' ');
    if (tab.length === 1 ) {
        return find(commands, line);
    }
    return line;
}

/*
 *  If no argument is provided when this file is imported, it launches a
 *  an interactive shell
 */
export function interactiveStart() {
    process.stdout.write(`Connected to : ${client.getIp()}${eol}`);
    rl = readline.createInterface(process.stdin, process.stdout, completer);

    rl.setPrompt('Scality IAM CLI> ');
    rl.prompt();

    rl.on('line', (l) => {
        try {
            const line = l.trim();
            const tab = line.split(' ');
            runCommand(tab, rl.prompt.bind(rl));
        } catch (ex) {
            rl.prompt(1);
        }
    }).on('close', () => {
        process.stdout.write(`Have a great day${eol}`);
        process.exit(0);
    });
}

/**
 *  When an argument is provided as this file is imported, it launches through
 *  this function, which allows it to interpret one and only one command per
 *  launch; this should facilitate scripting
 *  @param {String[]} enteredArgs - The command line
 *  @returns {void}
 */
export function oneLiner(enteredArgs) {
    return runCommand(enteredArgs, process.exit);
}
