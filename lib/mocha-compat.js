/**
 * qnit mocha compatibility layer
 *
 * Copyright (C) 2015-2020 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */


'use strict';

var testObject = makeTestObject();

function makeTestObject( ) {
    return { _count: 0, before: [], after: [], beforeEach: [], afterEach: [], _tests: [] };
}

global.describe = function( name, suite ) {
    var nf = getNameFunc(name, suite, false);
    name = nf.name;
    suite = nf.func;
    var enclosingObject = testObject;
    testObject = makeTestObject();

// TODO: mocha creates a `this` context for the tests in the outermost describe,
// and reuses it for all contained tests (including those contained in nested describes)
// Ie, changes made by one test affect the next test.  This is wrong;
// each test should get a clean context.

// TODO: the expected behavior is for side-effects (ie config changes)
// to affect only the subsequent tests, not all tests as currently.
// Side-effect ordering can be forced with before/after/describe.

    suite();

    enclosingObject[name] = testObject;
    testObject = enclosingObject;
    testObject._count += 1;
};

global.before = function before( name, fn ) {
    fn = getNameFunc(name, fn, true).func;
    fn._mocha = true;
    testObject.before.push(fn);
    testObject._count += 1;
};

global.after = function after( name, fn ) {
    fn = getNameFunc(name, fn, true).func;
    fn._mocha = true;
    testObject.after.push(fn);
    testObject._count += 1;
};

global.beforeEach = function beforeEach( name, fn ) {
    fn = getNameFunc(name, fn, true).func;
    fn._mocha = true;
    testObject.beforeEach.push(fn);
    testObject._count += 1;
};

global.afterEach = function afterEach( name, fn ) {
    fn = getNameFunc(name, fn, true).func;
    fn._mocha = true;
    testObject.afterEach.push(fn);
    testObject._count += 1;
};

global.it = function it( name, test ) {
    var nf = getNameFunc(name, test, true);
    test = nf.func;
    testObject._tests.push({
        name: nf.name,
        // note: mocha test `this` is the test runner object, nodeunit `this` is the test object
        test: function _mochaShim(t) { test(function done(err){ t.done(err) }) }
    });
    testObject._count += 1;
};

// many mocha functions take an optional name, and an optional callback
function getNameFunc(_name, _fn, needCb) {
    var callCb = function(cb) { if (typeof cb === 'function') cb() };
    var name = typeof _name === 'string' ? _name : '';
    var fn = typeof _fn === 'function' ? _fn : typeof _name === 'function' ? _name : callCb;
    var nf = { name: name, func: fn };

    // ensure that all mocha compat functions pass a callback to qnit
    if (!fn.length && needCb) {
        nf.func = function(cb) {
            var e = fn();
            if (e && typeof e.then === 'function') e.then(
                function(v) { cb() },
                function(e) { cb(e || 'failed') }
            );
            else cb();
        };
    }

    return nf;
}

module.exports.reset = function() { testObject = makeTestObject() };
module.exports.getHierarchy = function() { return testObject };
