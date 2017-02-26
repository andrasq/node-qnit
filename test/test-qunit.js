/**
 * Copyright (C) 2015 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */

// run this test with qunit itself

var assert = require('assert');
var qmock = require('qmock');

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
                setUp: function(done) {
                    this.nested = 2;
                    done();
                },

                'should see setup values': function(t) {
                    t.equal(this.x, 1, "expect to see parent initialized fields");
                    t.equal(this.nested, 2, "expect to see our initialized fields");
                    t.done();
                },

                'setUp should run anew every time (setup)': function(t) {
                    this.nested = 333;
                    t.done();
                },

                'setUp should run anew every time (check)': function(t) {
                    t.equal(this.nested, 2);
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

        'before special method': {
            before: function(done) {
                this.now = Date.now();
                done();
            },

            'should run before test (check 1)': function(t) {
                t.ok(this.now > 1000000);
                t.ok(Date.now() - this.now < 10);
                setTimeout(t.done, 20);
            },

            'should run only once (check 2)': function(t) {
                t.ok(Date.now() - this.now >= 20);
                t.done();
            },

            'should stack with nested before': {
                before: function(done) {
                    this.x = 1;
                    done();
                },

                'should stack': function(t) {
                    t.ok(this.now > 1000000);
                    t.equal(this.x, 1);
                    t.done();
                },
            },
        },
    },

    'should report error if test does not call done': function(t) {
        var x;
        //for (var i=0; i<2000000000; i++) x = 1;
        // TODO: comment out next line and look for the error
        // TODO: move this test into separate file, and run on file
        t.done();
    },

    'should skip test': function(t) {
        t.skip();
        t.fail();
    },

    'assertions': {
        'should throw Error on assertion failure': function(t) {
            t.expect(2);
            try { t.ok(false); }
            catch (err) { t.ok(true); t.done(); }
        },

        'should include both assert and user message': function(t) {
            t.expect(3);
            try { t.equal(1, 2, "expect to fail"); }
            catch (err) {
                t.ok(err.message.indexOf('1 == 2') >= 0);
                t.ok(err.message.indexOf('expect to fail') >= 0);
                t.done();
            }
        },

        'should throw error if equal fails': function(t) {
            t.expect(2);
            try { t.equal(1, 2); t.fail("nope"); }
            catch (err) { t.ok(true); t.done(); }
        },
    },

    'qmock': {
        'should expose qmock methods': function(t) {
            t.ok(typeof t.getMock === 'function');
            t.ok(typeof t.getMockSkipConstructor === 'function');
            var expectedMethods = [
                'stub', 'spy', 'mockTimers', 'unmockTimers', 'mockHttp', 'unmockHttp',
            ];
            for (var i=0; i<expectedMethods.length; i++) {
                var method = expectedMethods[i];
                t.equal(typeof t[method], 'function');
                t.equal(t[method].name, method);
                t.equal(t[method], qmock[method]);
            }
            t.done();
        },
    },
};
