/**
 * Copyright (C) 2015 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */

// run this test with qunit itself

var assert = require('assert');

var sharedState;

module.exports = {
    'setup/teardown': {
        'setUp before': {
            setUp: function(done) {
                assert(this.x === undefined);
                this.x = 1;
                done();
            },

            'should run setUp before test': function(t) {
                t.ok(this.x == 1);
                t.done();
            },

            'should run setUp anew before next test (setup)': function(t) {
                this.x = 999;
                t.done();
            },

            'should run setUp anew before next test (check)': function(t) {
                t.ok(this.x == 1);
                t.done();
            },
        },

        'tearDown after': {
            tearDown: function(done) {
                sharedState = 2;
                done();
            },

            'should run tearDown (setup)': function(t) {
                sharedState = 0;
                t.done();
            },

            'should run tearDown (check)': function(t) {
                t.ok(sharedState === 2);
                t.done();
            },
        },
    },

    'assertions': {
        'should throw Error on assertion failure': function(t) {
            try { if (t.ok) t.ok(false); }
            catch (err) { t.ok(true); t.done(); }
        },

        'should throw error if equal fails': function(t) {
// FIXME: an error thrown in the test is caught but not reported:
// FIXME:  ... and is line-itemed twice
throw new Error("die");
// FIXME: if t.done() not called, tests do not hang (!)
            try { if (t.equal) t.equal(1, 2); t.done(); }
            catch (err) { t.done(); }
        },
    },

    'QMock': {
        'should expose QMock methods': function(t) {
            t.ok(typeof t.getMock === 'function');
            t.ok(typeof t.getMockSkipConstructor === 'function');
            t.done();
        },
    },
};
