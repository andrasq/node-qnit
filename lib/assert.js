/**
 * Copyright (C) 2015 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */

'use strict';

var assert = require('assert');
var QUnit = require('./qunit.js').QUnit;

// TODO: wrap assert functions for prettier error messages

QUnit.prototype.assert = assert;
QUnit.prototype.ok = assert.ok;
QUnit.prototype.equal = assert.equal;
QUnit.prototype.notEqual = assert.notEqual;
QUnit.prototype.deepEqual = assert.deepEqual;
QUnit.prototype.notDeepEqual = assert.notDeepEqual;
QUnit.prototype.strictEqual = assert.strictEqual;
QUnit.prototype.notStrictEqual = assert.notStrictEqual;
QUnit.prototype.throws = assert.throws;
QUnit.prototype.doesNotThrow = assert.doesNotThrow;
QUnit.prototype.ifError = assert.ifError;

// assert has some nonsense messages, patch

// TODO: AssertionError takes an options hash, but does not seem to act on it?
QUnit.prototype.assert = function _assert(p, m) { if (!p) fail(p, "truthy", "", "is", _assert); }
QUnit.prototype.ok = QUnit.prototype.assert;
QUnit.prototype.fail = function _fail(m) { fail("test", "failed", "test does not pass", "", _fail); };

// wrapper assert.fail for more useful diagnostics
function fail( actual, expected, message, operator, stackStartFunction ) {
    try {
        assert.fail(actual, expected, null, operator, stackStartFunction);
    }
    catch (err) {
        if (message) {
            var p = err.stack.indexOf(err.message);
            if (p >= 0) {
                err.stack = err.stack.slice(0, p) +
                    err.message + ": " + message +
                    err.stack.slice(p + err.message.length);
            }
            err.message += ": " + message;
        }
        throw err;
    }
}

function makeError( options, msg ) {
    var err;
    try { throw new assert.AssertionError(options); } catch (e) { err = e; }
// TODO: edit err.stack to remove the internal functions and leave the source line at the top
    if (msg) err.message += ": " + msg;
    return err;
}
