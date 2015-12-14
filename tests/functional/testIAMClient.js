import assert from "assert";

import * as Check from '../../lib/Check.js';
import Account from '../../lib/Account.js';
import IAMClient from '../../lib/client/IAMClient.js';

describe("create-account", () => {
    const data = {
        name: "AnyName",
        emailAddress: "aaaaa@bbbb.cccc",
        saltedPwd: "passwdddd",
    };
    it('should return a new account', (done) => {
        const client = new IAMClient();
        client.createAccount(data.name, data.emailAddress, data.saltedPwd,
            (err, returned) => {
                const msg = JSON.parse(returned).message.query;
                assert(Check.isOkArn(msg.arn));
                assert(Account.isOkId(msg.id));
                assert(Account.isOkCanonicalId(msg.canonicalId));
                done();
            });
    });
});
