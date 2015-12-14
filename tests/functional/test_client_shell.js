import assert from "assert";
import childProcess from "child_process";

const launcherPath = `${__dirname}/../../lib/client/index.js`;

/*
 * oneLiner()
 */
describe("test_client_shell.js: oneLiner() - a one liner CLI",
    function describeCallback() {
        it("takes valid method: create-account", (done) => {
            childProcess.fork(
                launcherPath, ['create-account'], { silent: true })
                .on('exit', (code) => {
                    assert.deepStrictEqual(code, 0, 'Expected success code 0');
                    done();
                });
        });

        it("takes valid method: help()", (done) => {
            childProcess.fork(
                launcherPath, ['help'], { silent: true })
                .on('exit', (code) => {
                    assert.deepStrictEqual(code, 0, 'Expected help code 0');
                    done();
                });
        });

        it("takes valid method: exit()", (done) => {
            childProcess.fork(
                launcherPath, ['exit'], { silent: true })
                .on('exit', (code) => {
                    assert.deepStrictEqual(code, 0, 'Expected exit code 0');
                    done();
                });
        });

        it("refuses unknown method: fake()", (done) => {
            childProcess.fork(
                launcherPath, ['fake'], { silent: true })
                .on('exit', (code) => {
                    assert.deepStrictEqual(code, 3,
                        'Expected unknown function code 3');
                    done();
                });
        });
    });
