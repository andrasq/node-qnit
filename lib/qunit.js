/**
 * simple little unit test runner, in the spirit of nodeunit
 *
 * Copyright (C) 2015 Andras Radics
 * Licensed under the Apache License, Version 2.0
 *
 * 2015-02-24 - AR.
 */

'use strict';

var fs = require('fs');
var path = require('path');

var QMock = require('qmock');
var aflow = require('aflow');
var vsprintf = require('./vsprintf');


module.exports.QUnit = QUnit;
module.exports.runSuite = runSuite;


// sub-millisecond precision millisecond timestamp
function getTimestamp( ) {
    var t = process.hrtime();
    return t[0] * 1e3 + t[1] * 1e-6;
}

function formatTimestamp( f ) {
    var s = f + "";
    var p = s.indexOf('.');
    if (p < 0) return s;
    else return s.slice(0, p+4);
}

function runSuite( argv, options, done ) {
    var isRunning = false;
    var startTime = getTimestamp();
    function exitListener( ) {
        if (isRunning) {
            process.stdout.write("\nunexpected exit, tests not done (" + formatTimestamp(getTimestamp() - startTime) + "ms)\n");
        }
    };
    process.on('exit', exitListener);
    function errorListener( err ) {
        process.stdout.write("uncaught error\n" + err.stack);
        process.exit(2);
    };
    process.on('uncaughtException', errorListener);

    isRunning = true;
    runFiles(argv, options, function(err) {
        isRunning = false;
        var duration = getTimestamp() - startTime;
        if (err) {
            process.stdout.write("\nERROR: " + err.stack + "\n");
        }
        else {
            process.stdout.write("\nOK: (" + formatTimestamp(duration) + "ms)\n");
        }
        // NOTE: an exception from here returns as another callback to here!
        process.removeListener('exit', exitListener);
        process.removeListener('uncaughtException', errorListener);
// TODO: if not quiet mode, show count of files, tests, assertions
// TODO: gather suite results into object tree, report on tree
        done(err);
    });
}

function runFiles( argv, options, done ) {
    aflow.applyVisitor(
        argv,
        function visitor(filename, next) {
            var stat = fs.statSync(filename);
            if (stat.isFile()) {
                runFile(filename, options, next);
            }
            else if (stat.isDirectory()) {
                // TODO: if directory (or parent) contains qunit.json, load settings from it
                var files = fs.readdirSync(filename);
                for (var i = 0; i < files.length; i++) files[i] = filename + '/' + files[i];
                aflow.filter(
                    files,
                    function visitor(file, next) {
                        next(null, file.match(/(.js|.coffee)$/));
                    },
                    function whenDone(err, files) {
                        if (err) return next(err);
                        runFiles(files, options, next);
                    }
                );
            }
        },
        function whenDone(err) {
// TODO: count assertions? (return stats object?)
            done(err);
        }
    );
}

function runFile( filename, options, done ) {
    function loadModule(filename) {
        var filepath = path.resolve(filename);
        delete require.cache[filepath];
        var module = require(filepath);
        return module;
    }
    try {
        // reload the module each time to re-init module internals
        // note, though, that the module dependecies are simply reused
        var module = loadModule(filename);
// TODO: gather test results into objects, report from the object?
// ...but that makes it harder to attribute the error back to the source
// TODO: print dots on the screen to show test progress, like phpunit?
        QUnit.prototype.printf("\n%s:\n", filename);
        runTest(module, "", options, [], [], function(err) {
            done(err);
        });
    }
    catch (err) {
        console.log(err.stack);
        done(err);
    }
}

function runTest( test, name, options, setups, teardowns, done ) {
    if (typeof test === 'function') {
        // NOTE: an error from inside this if is caught by applyVisitor in runTestObject,
        // but above this if it is not.  V8 optimization thing?
        // TODO: make runit and reportit methods on tester
        // TODO: pass options to tester constructor, use that to show (1ms) test duration
        var tester = new QUnit(name);
        tester._test = test;
        QMock.extendWithMocks(tester, 'done');
        runit(tester, test, setups, teardowns, function(err, testBody) {
            tester._test = null;
            reportit(tester, err, testBody, function() {
                if (err && stopOnFailure) return done(err);
                else done();
            });
        });
    }
    else if (test && typeof test === 'object') {
        runTestObject(test, name, options, setups, teardowns, done);
    }
    else {
        throw new Error("test must be a function or an object");
    }

    function runit(tester, testFunc, setups, teardowns, cb) {
        var noop = function _noop(cb) { cb(); }

        // each test runs in own object with just setup/teardown/test methods
        var test = {
            _startTime: getTimestamp(),         // include setUp cost in test time
            setUp: null,
            tearDown: null,
            _currentTest: testFunc,
        };
// FIXME: foreach setups run setUp function on test context
// FIXME: foreach teardowns run tearDown function on test context
var setUp = setups[0] || noop;
var tearDown = teardowns[0] || noop;
/***
        aflow.applyVisitor(
            setups,
// TODO: time setting obj.fn + obj.fn() vs fn.call(obj)
            //function(setUp, cb) { test.setUp = setUp; test.setUp(cb) },
            function(setUp, cb) { setUp.call(test, cb) },
            function(err) {
console.log("AR: TEST IS", test);
                if (err) throw err;
                tester._onDone = function whenDone(err) {
                    if (err) return cb(err);
                    aflow.applyVisitor(
                        teardowns,
                        //function(tearDown, cb) { test.tearDown = tearDown; test.tearDown(cb) },
                        function(tearDown, cb) { tearDown.call(test, cb) },
                        function(err) {
                            cb(err, test);
                        }
                    );
                }
                test._currentTest(tester);
// FIXME: install a timer that loops, checking that the test finished
// and only go to next test when timer thread signals "done"
            }
        );
***/
        setUp.call(test, function(err) {
            if (err) return cb(err);
            function whenDone(err) {
                if (err) return cb(err);
// FIXME: foreach teardowns run tearDown function on test context
                tearDown.call(test, function(err) {
                    cb(err, test);
                });
            }
            tester._onDone = whenDone;
            test._currentTest(tester);
// FIXME: if done() never called, whenDone not run, our cb() not called...
// and the program exits at that point without waiting ??
        });
    }

    function reportit( tester, err, test, cb ) {
        var duration = getTimestamp() - test._startTime;
        var ok = err ? ' X' : ' -';
        var elapsed = (duration >= 0 ? " (%sms)" : "");
        var format = "%s %s" + elapsed + "\n" + (err ? "\n" : "");
        tester.printf(format, ok, tester._name, formatTimestamp(duration), err);
        if (err) tester.printf("%s\n\n", err.stack);
        cb();
    }

}

function runTestObject( obj, name, options, setups, teardowns, done ) {
    var self = this;
    var stopOnFailure = options.stopOnFailure || false;
    var setUp = (typeof obj.setUp === 'function') ? obj.setUp : null;
    var tearDown = (typeof obj.tearDown === 'function') ? obj.tearDown : null;

    if (setUp) setups.push(setUp);
    if (tearDown) teardowns.unshift(tearDown);

// FIXME: setUp / tearDown should nest, every test runs all its inherited setups!

    var tester; // current tester, also error flag
    aflow.applyVisitor(
        Object.keys(obj),
        function visitor(i, cb) {
            tester = null;
            var test = obj[i];
            if (i === 'setUp' || i === 'tearDown') return cb();
            name = (name ? (name + ' - ') : "") + i;
            runTest(test, name, options, setups, teardowns, function(err, ret) {
                cb(err);
            });
        },
        function(err) {
            // report as-yet unreported errors, to attribute to a test name
            if (!tester) tester = {};
            if (err) {
                if (!tester || tester._test) {
                    // report test errors
                    reportit(tester, err, tester._test, function() {
                        if (err && stopOnFailure) return finish(err);
                        else finish();
                    });
                }
                // throw internal errors
                else throw err;
            }
            else finish();
        }
    );

    function finish(err) {
        if (setUp) setups.pop();
        if (tearDown) teardowns.shift();
        done(err);
    }
}

function QUnit( name ) {
    this._name = name;
}

QUnit.prototype = {
    // test metadata
    _name: "",
    _test: null,
    _startTime: 0,
    _doneCount: 0,
    _onDone: null,

    // qmock support
    getMock: null,
    getMockSkipConstructor: null,
    __qmockList: null,

    done:
    function done( ) {
        this._doneCount += 1;
        this.assert(this._doneCount == 1, "done() called more than once");
        this._onDone();
    },

    // TODO: have lib/assert.js annotate QUnit.prototype with assertions t.ok, t.equal, etc
    assert:
    function assert( p, msg ) {
        if (!p) throw new Error("assertion failed: " + p.toString() + (msg ? ", " + msg : ""));
    },

    printf:
    function printf( fmt ) {
        var argv = new Array();
        for (var i=1; i<arguments.length; i++) argv.push(arguments[i]);
        process.stdout.write(this.vsprintf(fmt, argv));
    },

    vsprintf: vsprintf,
};

// add assertion methods from assert
require('./assert.js');

