/**
 * Copyright (C) 2015 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */

'use strict';

var assert = require('assert');
var qunit = require('../index');
var qmocha = require('../lib/mocha-compat');

var printf = qunit.QUnit.prototype.printf;
var trace = [];

describe('describe suite', function() {

    before(function before(done) { trace.push("top before"); done(); });
    after(function after(done) { trace.push("top after"); done(); });
    beforeEach(function beforeEach(done) { trace.push("top before each"); done(); });
    afterEach(function afterEach(done) { trace.push("top after each"); done(); });

    it('test 1', function test1(done) { trace.push("test 1"); done(); });
    it('test 2', function test2(done) { trace.push("test 2"); done(); });

    describe('nested describe suite', function() {
        before(function before2(done) { trace.push("nested before"); done(); });
        after(function after2(done) { trace.push("nested after"); done(); });
        beforeEach(function beforeEach2(done) { trace.push("nested before each"); done(); });
        afterEach(function afterEach2(done) { trace.push("nested after each"); done(); });

        describe('nested describe suite', function() {
            before(function before3(done) { trace.push("nested 2 before"); done(); });
            after(function after3(done) { trace.push("nested 2 after"); done(); });
            beforeEach(function beforeEach3(done) { trace.push("nested 2 before each"); done(); });
            afterEach(function afterEach3(done) { trace.push("nested 2 after each"); done(); });

            it('nested 2 test 1', function test1c(done) { trace.push("nested 2 test 1"); done(); });
            it('nested 2 test 2', function test2c(done) { trace.push("nested 2 test 2"); done(); });
        });

        it('nested test 1', function test1b(done) { trace.push("nested test 1"); done(); });
        it('nested test 2', function test2b(done) { trace.push("nested test 2"); done(); });
    });
});

//printf("%10O\n", qmocha.getHierarchy());

var options = {};
var stats = {
    assertionCount: 0,
    fileCount: 0,
    errors: new Array(),
};
qunit.runTest(qmocha.getHierarchy(), "", options, [], [], stats, function(err) {
    var expectTrace = [
        // top level
        "top before",
        "top before each",
        "test 1",
        "top after each",
        "top before each",
        "test 2",
        "top after each",

        // nested tests
        "nested before",

        // sub-nested tests
        "nested 2 before",
        "top before each",
        "nested before each",
        "nested 2 before each",
        "nested 2 test 1",
        "nested 2 after each",
        "nested after each",
        "top after each",

        "top before each",
        "nested before each",
        "nested 2 before each",
        "nested 2 test 2",
        "nested 2 after each",
        "nested after each",
        "top after each",

        // end sub-nested tests
        "nested 2 after",

        "top before each",
        "nested before each",
        "nested test 1",
        "nested after each",
        "top after each",
        "top before each",
        "nested before each",
        "nested test 2",
        "nested after each",
        "top after each",

        // end nested tests
        "nested after",

        // end top tests
        "top after",
    ];
    //console.log("DONE", err, err?err.stack:"", trace.length, expectTrace.length);
    //for (var i=0; i<trace.length; i++) printf("%-3i %s %s\n", trace[i] == expectTrace[i], trace[i], expectTrace[i]);
    assert.deepEqual(trace, expectTrace);
});
