/*
 * NOTE: This file is a temporary fix to allow us to run ES6 code and having
 * ES6 dependencies, before V8 and Node.js are entirely ES6-compatible.
 *
 * To use it, require() this file at the beginning of your Node.js launcher
 * scripts.
 */

'use strict'; // eslint-disable-line strict

require('babel/register')({
    // Please list all paths to ES6-syntaxed code here.
    ignore: filename =>
        !(filename.startsWith(__dirname + '/lib/') ||
          filename.startsWith(__dirname + '/test/') ||
          filename.startsWith(__dirname + '/node_modules/IronMan-MetaData/'))
});
