/**
 * Copyright (C) 2015 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */

'use strict';

var assert = require('assert');
var QUnit = require('./qunit.js').QUnit;

// TODO: wrap assert functions for prettier error messages

var AssertionError = assert.AssertionError;

QUnit.prototype.assert = assert;
QUnit.prototype.fail = assert.fail;
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
QUnit.prototype.assert = function(p, m) { if (!p) throw makeError({actual: p, operator: "is", expected: "truthy"}, m); }
QUnit.prototype.ok = QUnit.prototype.assert;
QUnit.prototype.fail = function(m) { throw makeError({message: "test ruled failed"}, m); };

function makeError( options, msg ) {
    var err = new AssertionError(options);
// TODO: edit err.stack to remove the internal functions and leave the source line at the top
    if (msg) err.message += ": " + msg;
    return err;
}
