/**
 * Copyright (C) 2015 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */

// run this test with qnit itself

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

    'should bind t.done to the tester': function(t) {
        setImmediate(t.done);
    },

    'should bind t.skip to the tester': function(t) {
        var skip = t.skip;
        t.throws(function() { skip('mock abort') }, /mock abort/);
        t.throws(function() { skip('mock abort') }, /skipped/);
        t.done();
    },

    'should bind t.fail to the tester': function(t) {
        var fail = t.fail;
        t.throws(function() { fail('mock fail') }, /mock fail/);
        t.throws(function() { fail('mock fail') }, /test does not pass/);
        t.done();
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
                // TODO: node-v0.8 does not always include a message in the assertion Error, so 1 == 2 will fail
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

        // TODO: check/fix that throws() fails if a different error is thrown
    },

    'qmock': {
        'should expose qmock methods': function(t) {
            t.ok(typeof t.getMock === 'function');
            t.ok(typeof t.getMockSkipConstructor === 'function');
            var expectedMethods = [
                'stub', 'spy', 'mockTimers', 'unmockTimers', 'mockHttp', 'unmockHttp',
                'mockRequire', 'mockRequireStub', 'unmockRequire', 'unrequire',
            ];
            for (var i=0; i<expectedMethods.length; i++) {
                var method = expectedMethods[i];
                t.equal(typeof t[method], 'function', expectedMethods[i]);
                t.equal(t[method].name, method);
                t.equal(String(t[method]), String(qmock[method]));
            }
            t.done();
        },

        'should restore stubs before next test': {
            before: function(done) {
                this.method = function(cb){ cb() };
                this.instance = { method: this.method };
                done();
            },

            'part 1: stub instance.method': function(t) {
                t.stubOnce(this.instance, 'method', function(cb){ cb() });
                this.instance.method(function() {
                    t.done();
                })
            },

            'part 2: verify that intance.method has been restored': function(t) {
                t.equal(this.instance.method, this.method);
                t.done();
            },
        }
    },
};
