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

            'nested tests': {
                'should see setup values': function(t) {
// FIXME: this.x should be set
                    t.equal(this.x, 1);
                    t.done();
                },
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

    'should report error if test does not call done': function(t) {
// FIXME: if t.done() not called, tests do not hang (!)
// rather the tests exit with an error (?!)
// Should wait for 2 sec
    },

    'assertions': {
        'should throw Error on assertion failure': function(t) {
            try { t.ok(false); }
            catch (err) { t.ok(true); t.done(); }
        },

        'should throw error if equal fails': function(t) {
            try { t.equal(1, 2); t.fail("nope"); }
            catch (err) { t.ok(true); t.done(); }
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
