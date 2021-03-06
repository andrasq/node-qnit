/**
 * Copyright (C) 2015 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */

// run this test with qnit itself

var assert = require('assert');
var qmock = require('qmock');
var qnit = require('../lib/qnit');

// workaround for node pre-0.10 that did not have setImmediate
var setImmediate = global.setImmediate || function(cb, a, b, c) { setTimeout(function() { cb(a, b, c)}, 0) }

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

            // TODO: also test that teardowns are called after a test failure
            // (which needs to be in a separate file, else it would break this test suite)
        },

        'before special method': {
            before: function(done) {
                this.now = Date.now();
                done();
            },

            'should run before test (check 1)': function(t) {
                t.ok(this.now > 1000000);
                t.ok(Date.now() - this.now < 10);
                // pad the timeout to work around node-v0.8 timeout precision
                setTimeout(t.done, 20 + 2);
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

    'should report error if throws falsy': function(t) {
        qnit.runTestFunction(
            function(t) {
                // throw some falsy error
                throw false;
            },
            'error test', { _selftestonly: true }, [], [], null,
            function(err) {
                t.ok(err instanceof Error);
                t.contains(err.message, /falsy error/);
                t.done();
            }
        );
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
        // t.skip() ignores its argument and throws the string "__skip"
//
// FIXME: should t.skip() abort the test even when caught inside t.throws?
//
        t.throws(function() { skip('mock abort') }, '__skip');
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
            var aliasedMethods = {
                disrequire: 'unrequire'
            };
            for (var i=0; i<expectedMethods.length; i++) {
                var method = expectedMethods[i];
                t.equal(typeof t[method], 'function', expectedMethods[i]);
                t.equal(t[method].name, method);
                t.equal(String(t[method]), String(qmock[method]));
            }
            for (var name in aliasedMethods) {
                t.equal(typeof t[name], 'function', aliasedMethods[name]);
                t.equal(t[name], t[aliasedMethods[name]]);
                t.equal(String(t[name]), String(qmock[name]));
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
