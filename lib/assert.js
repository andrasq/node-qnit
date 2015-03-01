/**
 * Copyright (C) 2015 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */

'use strict';

var assert = require('assert');
var QUnit = require('./qunit.js').QUnit;

QUnit.prototype.fail = function _fail(m) { fail("test", "failed", "test does not pass", "", _fail); };


QUnit.prototype.ok = // same as next line,
QUnit.prototype.assert = function _assert(p, m) {
    if (!p) fail(p, "truthy", m, "is", _assert); }

QUnit.prototype.equal = function _equal(a,b,m) {
    wrapAssertion(assert.equal, _equal, m, a, b, '==') };
QUnit.prototype.notEqual = function _notEqual(a,b,m) {
    wrapAssertion(assert.notEqual, _notEqual, m, a, b, '!=') };
QUnit.prototype.deepEqual = function _deepEqual(a,b,m) {
    wrapAssertion(assert.deepEqual, _deepEqual, m, a, b, 'deepEqual') };
QUnit.prototype.notDeepEqual = function _notDeepEqual(a,b,m) {
    wrapAssertion(assert.notDeepEqual, _notDeepEqual, m, a, b, 'notDeepEqual') };
QUnit.prototype.strictEqual = function _strictEqual(a,b,m) {
    wrapAssertion(assert.strictEqual, _strictEqual, m, a, b, '===') };
QUnit.prototype.notStrictEqual = function _notStrictEqual(a,b,m) {
    wrapAssertion(assert.notStrictEqual, _notStrictEqual, m, a, b, '!==') };
QUnit.prototype.throws = function _throws(a,b,m) {
    switch (arguments.length) {
    case 1: b = m = undefined; break;
    case 2: if (typeof b !== 'object') { m = b; b = undefined; }; break;
    }
    wrapAssertion(assert.throws, _throws, m, a, b, 'throws') };
QUnit.prototype.doesNotThrow = function _doesNotThrow(a,m) {
    wrapAssertion(assert.doesNotThrow, _doesNotThrow, m, a, undefined, 'doesNotThrow') };
QUnit.prototype.ifError = function _ifError(a,m) {
    wrapAssertion(assert.ifError, _ifError, m, a, undefined, 'ifError') };

// assert has some nonsense messages, patch

function wrapAssertion( assertion, startStackFunction, message, actual, expected, operator ) {
    try {
        assertion(actual, expected);
    }
    catch (err) {
        fail(actual, expected, message, operator, startStackFunction);
    }
}

// wrapper assert.fail for more useful diagnostics
function fail( actual, expected, message, operator, stackStartFunction ) {
    try {
        assert.fail(actual, expected, null, operator, stackStartFunction);
    }
    catch (err) {
        annotateError(err, message);
        throw err;
    }
}

function annotateError( err, message ) {
    if (message) {
        var p = err.stack.indexOf(err.message);
        if (p >= 0) {
            p += err.message.length;
            err.stack =
                err.stack.slice(0, p) + ": " + message + err.stack.slice(p);
        }
        err.message += ": " + message;
    }
    return err;
}
