/**
 * qnit mocha compatibility layer
 *
 * Copyright (C) 2015,2017 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */


'use strict';

var testObject = makeTestObject();

function makeTestObject( ) {
    return { _count: 0, before: [], after: [], beforeEach: [], afterEach: [], _tests: [] };
}

global.describe = function( name, suite ) {
    if (!suite) { suite = name; name = ''; }
    var enclosingObject = testObject;
    testObject = makeTestObject();

// TODO: mocha creates a `this` context for the tests in the outermost describe,
// and reuses it for all contained tests (including those contained in nested describes)
// Ie, changes made by one test affect the next test.  This is wrong;
// each test should get a clean context.

    suite();

    enclosingObject[name] = testObject;
    testObject = enclosingObject;
    testObject._count += 1;
};

global.before = function before( name, fn ) {
    if (!fn) { fn = name; name = ''; }
    fn._mocha = true;
    testObject.before.push(fn);
    testObject._count += 1;
};

global.after = function after( name, fn ) {
    if (!fn) { fn = name; name = ''; }
    fn._mocha = true;
    testObject.after.push(fn);
    testObject._count += 1;
};

global.beforeEach = function beforeEach( name, fn ) {
    if (!fn) { fn = name; name = ''; }
    fn._mocha = true;
    testObject.beforeEach.push(fn);
    testObject._count += 1;
};

global.afterEach = function afterEach( name, fn ) {
    if (!fn) { fn = name; name = ''; }
    fn._mocha = true;
    testObject.afterEach.push(fn);
    testObject._count += 1;
};

global.it = function it( name, test ) {
    if (!test) { test = name; name = ''; }
    testObject._tests.push({
        name: name,
        // TODO: mocha test `this` is the test runner object, nodeunit `this` is the test object
        test: function _mochaShim(t) { test(function done(err){ t.done(err) }) }
    });
    testObject._count += 1;
};


module.exports.reset = function() { testObject = makeTestObject() };
module.exports.getHierarchy = function() { return testObject };
