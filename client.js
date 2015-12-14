require('./es6-compat.js');

const shell = require('./lib/shell.js');

if (process.argv[2]) {
    shell.oneLiner(process.argv.slice(2));
} else {
    shell.interactiveStart();
}
