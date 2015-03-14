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
var qprintf = require('qprintf');
var printf = qprintf.printf;
var qmocha = require('./mocha-compat');

// TODO: expose these settings are config options
var timestampPrecision = 3;


module.exports.QUnit = QUnit;
module.exports.runSuite = runSuite;
module.exports.runTest = runTest;

// sub-millisecond precision millisecond timestamp
function getTimestamp( ) {
    var t = process.hrtime();
    return t[0] * 1e3 + t[1] * 1e-6;
}

function formatTimestamp( f ) {
    var s = f + "";
    var p = s.indexOf('.');
    if (p < 0) return s;
    else return s.slice(0, p+1+timestampPrecision);
}

function copyObject( o ) {
    var ret = {};
    for (var i in o) ret[i] = o[i];
    return ret;
}

/**
 * run a suite of tests by filename or directory name
 * This is the top-level entry point of the command-line utility
 */
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

    // test suite runtime stats
    var stats = {
        _depth: 0,
        assertionCount: 0,
        fileCount: 0,
        errors: new Array(),
        _beforeThis: {},
    };

    // wait forever for the suite to finish properly via callback
    var foreverTimer = setInterval(function(){}, 3600000);
    isRunning = true;
    runFiles(argv, options, stats, function(err) {
        isRunning = false;
        var duration = getTimestamp() - startTime;
        clearTimeout(foreverTimer);
        if (err || stats.errors.length > 0) {
            printf("\nERROR: failed, %s assertions (%sms)\n", stats.assertionCount, formatTimestamp(duration));
            if (err && err !== "stop") {
                printf("%s\n", err.stack);
            }
            if (false && !options.stopOnFailure && stats.errors.length > 0) {
                // TODO: if printing dots, only saw E so print all the errors at the end
                printf("\nErrors:\n");
                for (var i=0; i<stats.errors.length; i++) printf("%s\n\n", stats.errors[i].stack);
            }
        }
        else {
// TODO: if not quiet mode, show count of files, tests, assertions
// TODO: gather suite results into object tree, report on tree
            printf("\nOK: %d assertions (%sms)\n", stats.assertionCount, formatTimestamp(duration));
        }
        // NOTE: an exception from here returns as another callback to here!
        process.removeListener('exit', exitListener);
        process.removeListener('uncaughtException', errorListener);
        done(err);
    });
}

/**
 * run the tests in the named files and directories
 */
function runFiles( argv, options, stats, done ) {
    aflow.applyVisitor(
        argv,
        function visitor(filename, next) {
            var stat = fs.statSync(filename);
            if (stat.isFile()) {
                runFile(filename, options, stats, next);
            }
            else if (stat.isDirectory()) {
                // TODO: if directory (or parent) contains qunit.json, load settings from it
                var files = fs.readdirSync(filename);
                for (var i = 0; i < files.length; i++) files[i] = filename + '/' + files[i];
                aflow.filter(
                    files,
                    function visitor(file, next) {
                        var stat = fs.statSync(file);
                        next(null, file.match(/(.js|.coffee)$/) || stat.isDirectory());
                    },
                    function whenDone(err, files) {
                        if (err) return next(err);
                        runFiles(files, options, stats, next);
                    }
                );
            }
        },
        function whenDone(err) {
            done(err);
        }
    );
}

/**
 * run the tests in the named file
 */
function runFile( filename, options, stats, done ) {
    function loadModule(filename) {
        var filepath = path.resolve(filename);
        delete require.cache[filepath];
        var module = require(filepath);
        return module;
    }
    try {
        // reload the module each time to re-init module internals
        // note, though, that the module dependecies are simply reused
        qmocha.reset();
        var module = loadModule(filename);
        var mochaTests = qmocha.getHierarchy();
// TODO: gather test results into objects, report from the object?
// ...but that makes it harder to attribute the error back to the source
// TODO: print dots on the screen to show test progress, like phpunit?
        // TODO: wrong to hardcode escape sequences, though works for ANSI terminals (pretty much all today)
        var filenameFormat = options.noColor ? "\n%s:\n" : "\n\x1b[1m%s\x1b[22m\n";
        QUnit.prototype.printf(filenameFormat, filename);
        stats.fileCount += 1;
        if (mochaTests._count > 0) runTest(mochaTests, "", options, [], [], stats, function(err) {
            done(err);
        });
        else runTest(module, "", options, [], [], stats, function(err) {
            done(err);
        });
    }
    catch (err) {
        console.log(err.stack);
        done(err);
    }
}

/**
 * run the test function or object with test functions
 */
function runTest( obj, name, options, setups, teardowns, stats, done ) {
    if (typeof obj === 'function') {
        return runTestFunction(obj, name, options, setups, teardowns, stats, done);
    }
    else if (!obj || typeof obj !== 'object') {
        return done();
    }

    var tests = new Array();

    var before = obj.before || function(cb){ cb() };
    var after = obj.after || function(cb){ cb() };

    // inherit before settings from nesting tests
    var outerBeforeThis = stats._beforeThis;
    stats._beforeThis = copyObject(outerBeforeThis);

    for (var i in obj) {
        // beforeEach/afterEach/setUp/tearDown are run anew for each test 
        if (i === 'beforeEach' || i === 'setUp') setups.push(obj[i]);
        else if (i === 'afterEach' || i === 'tearDown') teardowns.unshift(obj[i]);
        else if (i === 'before' || i === 'after') ; // handled outside of this loop
        else tests.push(i);
    }

    stats._depth += 1;
    var namePrefix = name ? (name + ' - ') : "";
    before.call(stats._beforeThis, function(err) {
        if (err) return done(err);
        aflow.applyVisitor(
            tests,
            function visitor(i, cb) {
                var test = obj[i];
                var testname = namePrefix + i;
                runTest(test, testname, options, setups, teardowns, stats, function(err) {
                    cb(err);
                });
            },
            function(err) {
                if (err) return done(err);
                after.call(stats._beforeThis, function(err) {
                    if (obj.setUp) setups.pop();
                    if (obj.beforeEach) setups.pop();
                    if (obj.tearDown) teardowns.shift();
                    if (obj.afterEach) teardowns.shift();
                    stats._beforeThis = outerBeforeThis;
                    // err will be falsy if already reported, "stop" if should bail, Error if not handled yet
                    done(err);
                });
            }
        );
    });
}

/**
 * run a single test function, and report on the results
 */
function runTestFunction( test, name, options, setups, teardowns, stats, done ) {
    // NOTE: an error from inside this if is caught by applyVisitor in runTest,
    // but above this if it is not.  V8 optimization thing?
    // TODO: make runit and reportit methods on tester
    // TODO: pass options to tester constructor, use that to show (1ms) test duration
    var tester = new QUnit(name);
    tester._test = test;

    QMock.extendWithMocks(tester, 'done');

    // arrange to continue the test suite even if this test does not call done
    var testTimeout = options.testTimeout || 2000;
    var timer = setTimeout(function(){
        var err = new Error("the test or one of its setUp/tearDowns did not call done() within " + testTimeout + " ms");
        reportit(tester, err, stats, function() {
            if (options.stopOnFailure) return done("stop");
            else done();
        })
    }, testTimeout);

    runit(tester, test, setups, teardowns, function(err) {
        clearTimeout(timer);
        tester._test = null;
        stats.assertionCount += tester.assertionCount;
        if (err) stats.errors.push(err);
        reportit(tester, err, stats, function() {
            if (err && options.stopOnFailure) return done("stop");
            else done();
        });
    });

    function runit(tester, testFunc, setups, teardowns, cb) {
        // each test runs with its own `this` object
        // the `this` object gets a shallow copy of all before properties,
        // and is then initialized (here) with all setUp/beforeEach methods
        var test = copyObject(stats._beforeThis);
        aflow.applyVisitor(
            setups,
            function(setUp, cb) { setUp.call(test, cb) },
            function(err) {
                if (err) throw err;
                tester._onDone = function whenDone(err) {
                    if (err) return cb(err);
                    aflow.applyVisitor(
                        teardowns,
                        function(tearDown, cb) { tearDown.call(test, cb) },
                        function(err) {
                            cb(err, test);
                        }
                    );
                }
                testFunc.call(test, tester);
            }
        );
    }

    function reportit( tester, err, stats, cb ) {
        var duration = tester.getDuration();
        var ok = err ? ' X' : ' -';
        var elapsed = (duration >= 0 ? " (%sms)" : "");
        var format = "%s %s" + elapsed + "\n" + (err ? "\n" : "");
        tester.printf(format, ok, tester._name, formatTimestamp(duration), err);
        if (err) tester.printf("%s\n\n", err.stack);
        cb();
    }
}

function QUnit( name ) {
    this._name = name;
    this._startTime = getTimestamp();
}

QUnit.prototype = {
    // test metadata
    _name: "",
    _test: null,
    _startTime: 0,
    _doneCount: 0,
    _onDone: null,
    assertionCount: 0,
    getDuration: function() { return getTimestamp() - this._startTime; },

    // qmock support
    getMock: null,
    getMockSkipConstructor: null,
    __qmockList: null,

    done:
    function done( err ) {
        this._doneCount += 1;
        if (err) return this._onDone(err);
        if (this._expectedAssertionCount >= 0 && this.assertionCount != this._expectedAssertionCount) {
            err = new Error("assertion count: expected " + this._expectedAssertionCount + ", had " + this.assertionCount);
        }
        else if (this._doneCount != 1) {
            err = new Error("done() called more than once (" + this._doneCount + " times)");
        }
        this._onDone(err);
    },

    assert:
    function assert( p, msg ) {
        if (!p) throw new Error("assertion failed: " + p.toString() + (msg ? ", " + msg : ""));
    },

    expect:
    function expect(n) {
        this._expectedAssertionCount = n;
    },

    printf: qprintf.printf,
    sprintf: qprintf.sprintf,
    vsprintf: qprintf.vsprintf,
};

// add assertion methods from assert
require('./assert.js');
