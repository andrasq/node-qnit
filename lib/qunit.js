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

function printf( fmt ) {
    var argv = new Array();
    for (var i=1; i<arguments.length; i++) argv.push(arguments[i]);
    process.stdout.write(vsprintf(fmt, argv));
}


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

    // test suite runtime stats
    var stats = {
        assertionCount: 0,
        fileCount: 0,
        errors: new Array(),
    };

    isRunning = true;
    runFiles(argv, options, stats, function(err) {
        isRunning = false;
        var duration = getTimestamp() - startTime;
        if (err || stats.errors.length > 0) {
            printf("\nERROR: failed, %s assertions (%sms)\n", stats.assertionCount, formatTimestamp(duration));
            if (err && err !== "stop") {
                printf("%s\n", err.stack);
            }
            if (false && !options.stopOnFailure && stats.errors.length > 0) {
                printf("\nErrors:\n");
                for (var i=0; i<stats.errors.length; i++) printf("%s\n\n", stats.errors[i].stack);
            }
        }
        else {
            printf("\nOK: %d assertions (%sms)\n", stats.assertionCount, formatTimestamp(duration));
        }
        // NOTE: an exception from here returns as another callback to here!
        process.removeListener('exit', exitListener);
        process.removeListener('uncaughtException', errorListener);
// TODO: if not quiet mode, show count of files, tests, assertions
// TODO: gather suite results into object tree, report on tree
        done(err);
    });
}

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
                        next(null, file.match(/(.js|.coffee)$/));
                    },
                    function whenDone(err, files) {
                        if (err) return next(err);
                        runFiles(files, options, stats, next);
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
        var module = loadModule(filename);
// TODO: gather test results into objects, report from the object?
// ...but that makes it harder to attribute the error back to the source
// TODO: print dots on the screen to show test progress, like phpunit?
        // TODO: wrong to hardcode escape sequences, though works for ANSI terminals (pretty much all today)
        var filenameFormat = options.noColor ? "\n%s:\n" : "\n\x1b[1m%s\x1b[22m\n";
        QUnit.prototype.printf(filenameFormat, filename);
        stats.fileCount += 1;
        runTest(module, "", options, [], [], stats, function(err, tester) {
            done(err);
        });
    }
    catch (err) {
        console.log(err.stack);
        done(err);
    }
}

function runTest( test, name, options, setups, teardowns, stats, done ) {
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
            stats.assertionCount += tester.assertionCount;
            if (!err && tester._expectedAssertionCount >= 0 && stats.assertionCount != tester._expectedAssertionCount) {
                err = new Error("expected " + tester._expectedAssertionCount + " assertions, had " + tester.assertionCount);
            }
            if (err) stats.errors.push(err);
            reportit(tester, err, testBody, function() {
                if (err && options.stopOnFailure) return done("stop");
                else done();
            });
        });
    }
    else if (test && typeof test === 'object') {
        runTestObject(test, name, options, setups, teardowns, stats, function(err) {
            done(err);
        });
    }
    else {
        throw new Error("test must be a function or an object");
    }

    function runit(tester, testFunc, setups, teardowns, cb) {
        // each test runs in own object with just setup/teardown/test methods
        var test = {
            _startTime: getTimestamp(),         // include setUp cost in test time
            setUp: null,
            tearDown: null,
            _currentTest: testFunc,
        };
        aflow.applyVisitor(
            setups,
            function(setUp, cb) { test.setUp = setUp; test.setUp(cb) },
            function(err) {
                if (err) throw err;
                tester._onDone = function whenDone(err) {
                    if (err) return cb(err);
                    aflow.applyVisitor(
                        teardowns,
                        function(tearDown, cb) { test.tearDown = tearDown; test.tearDown(cb) },
                        function(err) {
                            cb(err, test);
                        }
                    );
                }
                test._currentTest(tester);
// FIXME: if done() never called, whenDone not run, our cb() not called...
// and the program exits at that point without waiting ??
// FIXME: install a timer that loops, checking that the test finished
// and only go to next test when timer thread signals "done"
            }
        );
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

function runTestObject( obj, name, options, setups, teardowns, stats, done ) {
    var setUp = (typeof obj.setUp === 'function') ? obj.setUp : null;
    var tearDown = (typeof obj.tearDown === 'function') ? obj.tearDown : null;

    if (setUp) setups.push(setUp);
    if (tearDown) teardowns.unshift(tearDown);

    aflow.applyVisitor(
        Object.keys(obj),
        function visitor(i, cb) {
            var test = obj[i];
            if (i === 'setUp' || i === 'tearDown') return cb();
            var testname = (name ? (name + ' - ') : "") + i;
            runTest(test, testname, options, setups, teardowns, stats, function(err, ret) {
                cb(err);
            });
        },
        function(err) {
            // report as-yet unreported errors, to attribute to a test name
            if (setUp) setups.pop();
            if (tearDown) teardowns.shift();
            done(err);
        }
    );
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
    assertionCount: 0,

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

    printf: printf,
    vsprintf: vsprintf,
};

// add assertion methods from assert
require('./assert.js');

QUnit.prototype.expect = function(n) {
    // TBD: dummy for now, for nodeunit compatibility
    // FIXME: count number of assertions, check when done (node: already built into qmocks!)
    this._expectedAssertionCount = n;
};
