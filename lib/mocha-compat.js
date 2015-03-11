/**
 * qunit mocha compatibility layer
 *
 * Copyright (C) 2015 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */


'use strict';

var testObject = { };

global.describe = function( name, suite ) {
    var enclosingObject = testObject;
    testObject = { };

    suite();

    enclosingObject[name] = testObject;
    testObject = enclosingObject;
};

global.before = function before( fn ) {
    testObject.before = fn;
};

global.after = function after( fn ) {
    testObject.after = fn;
};

global.beforeEach = function beforeEach( fn ) {
    testObject.beforeEach = fn;
};

global.afterEach = function afterEach( fn ) {
    testObject.afterEach = fn;
};

global.it = function it( name, test ) {
    testObject[name] = function _mochaTestShim(t) {
        test(function(){ t.done() });
    }
};


module.exports.reset = function() { testObject = { } };
module.exports.getHierarchy = function() { return testObject };
