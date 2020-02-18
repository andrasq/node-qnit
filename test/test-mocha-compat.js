/**
 * Copyright (C) 2015,2020 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */

'use strict';

var assert = require('assert');
var qnit = require('../');
var qmocha = require('../lib/mocha-compat');

module.exports = {
    beforeEach: function(done) {
        this.options = {};
        this.stats = {
            assertionCount: 0,
            fileCount: 0,
            errors: new Array(),
        };
        qmocha.reset();
        done();
    },

    'should parse mocha test': function(t) {
        // delete any previous run results, and re-run with empty options
        // delete require.cache[require.resolve('./mocha-test.js')];
        t.unrequire('./mocha-test.js');
        var trace = require('./mocha-test.js');
        qnit.runTest(qmocha.getHierarchy(), "", this.options, [], [], this.stats, function(err) {
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
                "nested before 2",

                // non-nested tests run first
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

                // sub-nested tests
                "nested 2 before",
                "top before each",
                "nested before each",
                "nested 2 before each",
                "nested 2 before each 2",
                "nested 2 test 1",
                "nested 2 after each",
                "nested after each",
                "top after each",

                "top before each",
                "nested before each",
                "nested 2 before each",
                "nested 2 before each 2",
                "nested 2 test 2",
                "nested 2 after each",
                "nested after each",
                "top after each",

                // end sub-nested tests
                "nested 2 after",

                // end nested tests
                "nested after",

                // end top tests
                "top after",
                "top after 2",
            ];
            //console.log("DONE", err, err?err.stack:"", trace.length, expectTrace.length);
            //for (var i=0; i<trace.length; i++) t.printf("%-3i %s %s\n", trace[i] == expectTrace[i], trace[i], expectTrace[i]);
            assert.deepEqual(trace, expectTrace);
            t.done();
        });
    },

    'should supply callbacks where needed': function(t) {
        var called = false;

        describe();
        beforeEach();
        it(function(){ called = true });
        it();

        var hierarchy = qmocha.getHierarchy();
        t.equal(hierarchy.beforeEach.length, 1);
        t.equal(hierarchy.beforeEach[0].length, 1);

        qnit.runTest(qmocha.getHierarchy(), "", this.options, [], [], this.stats, function(err) {
            t.ok(called);
            t.done();
        })
    },
};
