/**
 * qunit mocha compatibility layer
 *
 * Copyright (C) 2015 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */


'use strict';

var testObject = { _count: 0 };

global.describe = function( name, suite ) {
    var enclosingObject = testObject;
    testObject = { _count: 0 };

    suite();

    enclosingObject[name] = testObject;
    testObject = enclosingObject;
    testObject._count += 1;
};

global.before = function before( fn ) {
    testObject.before = fn;
    testObject._count += 1;
};

global.after = function after( fn ) {
    testObject.after = fn;
    testObject._count += 1;
};

global.beforeEach = function beforeEach( fn ) {
    testObject.beforeEach = fn;
    testObject._count += 1;
};

global.afterEach = function afterEach( fn ) {
    testObject.afterEach = fn;
    testObject._count += 1;
};

global.it = function it( name, test ) {
    testObject[name] = function _mochaTestShim(t) {
        test(function(){ t.done() });
    }
    testObject._count += 1;
};


module.exports.reset = function() { testObject = { _count: 0 } };
module.exports.getHierarchy = function() { return testObject };
