/**
 * simple little unit test runner, in the spirit of nodeunit
 *
 * Copyright (C) 2015,2017 Andras Radics
 * Licensed under the Apache License, Version 2.0
 *
 * 2015-02-24 - AR.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

var QMock = require('qmock');
var qassert = require('qassert');
var aflow = require('aflow');
var qprintf = require('qprintf');
var printf = qprintf.printf;
var sprintf = qprintf.sprintf;
var qmocha = require('./mocha-compat.js');
var parseOptions = require('./parseopt.js');

// TODO: expose these settings are config options
var timestampPrecision = 3;

if (typeof setImmediate === 'undefined') var setImmediate = process.nextTick;


module.exports.QUnit = QUnit;
module.exports.runSuite = runSuite;
module.exports.runTest = runTest;
module.exports.runFile = runFile;

module.exports.qmock = QMock;
module.exports.qassert = qassert;
module.exports.qprintf = qprintf;

// sub-millisecond precision millisecond timestamp
function getTimestamp( ) {
    if (!process.hrtime) return Date.now();
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
        testCount: 0,
        skippedCount: 0,
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
        var summaryLine = sprintf(
            "%d assertions, %d tests, %d files, %d skipped (%sms)\n",
            stats.assertionCount, stats.testCount, stats.fileCount, stats.skippedCount,
            formatTimestamp(duration)
        );
        if (err || stats.errors.length > 0) {
            var errorCount = stats.errors.length || (err !== 'stop' ? 1 : 0);
            printf("\nERROR: %i errors, %s", errorCount, summaryLine);
            if (err && err !== "stop") {
                printf("%s\n", err.stack || err.message);
            }
            if (false && !options.stopOnFailure && stats.errors.length > 0) {
                // TODO: if printing dots, only saw E so print all the errors at the end
                printf("\nErrors:\n");
                for (var i=0; i<stats.errors.length; i++) printf("%s\n\n", stats.errors[i].stack);
            }
            if (!err) err = new Error(stats.errors.length + " test failures");
        }
        else {
// TODO: if not quiet mode, show count of files, tests, assertions
// TODO: gather suite results into object tree, report on tree
            printf("\nOK: %s", summaryLine);
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
                if (options.forkFiles) spawnFile(filename, options, stats, next);
                else runFile(filename, options, stats, next);
            }
            else if (stat.isDirectory()) {
                var directoryOptions = options;
                try {
                    var opts = fs.readFileSync(filename + "/qnit.conf");
                    if (opts) {
                        opts = parseOptions(opts.toString());
                        // command-line options override, but TODO: root options override leaf options!
                        for (var k in options) if (options[k] !== undefined) opts[k] = options[k];
                        directoryOptions = opts;
                    }
                }
                catch (err) {
                    if (err.message.indexOf('ENOENT') < 0) throw err; /* suppress only "not found" errors */
                }

                var files = fs.readdirSync(filename);
                for (var i = 0; i < files.length; i++) files[i] = filename + '/' + files[i];

                aflow.filter(
                    files,
                    function visitor(file, next) {
                        var stat = fs.statSync(file);
                        // TODO: make configurable the filename extensions
                        next(null, file.match(/(.js|.coffee)$/) || stat.isDirectory() && (options.recurse === undefined || options.recurse));
                    },
                    function whenDone(err, files) {
                        if (err) return next(err);
                        runFiles(files, directoryOptions, stats, next);
                    }
                );
            }
        },
        function whenDone(err) {
            done(err);
        }
    );
}

function spawnFile( filename, options, stats, done ) {
    var prog = process.argv[0];
    var child;

    // FIXME: takes 45 ms to start the worker.js script...
    try { child = child_process.fork(require.resolve("./worker.js"), [], {stdio: [process.stdin, process.stdout, process.stderr]}); }
    catch (err) { return done(err); }
    child.send({ n: 'runFile', filename: filename, options: options, stats: stats });

    var err = null;
    child.on('close', function onClose(exitcode) {
        done(err);
    });
    child.on('message', function responseListener(message) {
        if (!message) {
            err = new Error("no reply from test runner");
        }
        else {
            if (message.err) {
                err = new Error();
                for (var k in message.err) err[k] = message.err[k];
            }
            if (message.stats) {
                stats.assertionCount = message.stats.assertionCount;
                stats.fileCount = message.stats.fileCount;
                stats.testCount = message.stats.testCount;
                stats.skippedCount = message.stats.skippedCount;
            }
        }
        child.removeListener('message', responseListener);
        try { process.kill(child.pid, "SIGKILL"); } catch (e) { console.log("unable to kill test runner"); }
    });
}

/**
 * run the tests in the named file
 */
function runFile( filename, options, stats, done ) {
    function loadModule(filename) {
        var filepath = path.resolve(filename);
        QMock.unrequire(filepath);
        var module = require(filepath);
        return module;
    }
    try {
        // reload the module each time to re-init module internals
        // note, though, that the module dependecies are simply reused
        qmocha.reset();

        // TODO: run each file in a separate process
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
        // TODO: would be nice to omit the setup/teardown if not necessary
        // TODO: if (options.grep !== undefined && !options.grep.test(name)) return done();
        if (options.filter !== undefined && !name.match(options.filter)) return done();
        return runTestFunction(obj, name, options, setups, teardowns, stats, done);
    }
    else if (!obj || typeof obj !== 'object') {
        return done();
    }

    var tests = new Array();

    function before( cb ) {
        if (!obj.before) return cb();
        if (Array.isArray(obj.before)) aflow.applyVisitor(obj.before, function(fn, cb) { fn.call(stats._beforeThis, cb) }, cb);
        else obj.before.call(stats._beforeThis, cb);
    }

    function after( cb ) {
        if (!obj.after) return cb();
        if (Array.isArray(obj.after)) aflow.applyVisitor(obj.after, function(fn, cb) { fn.call(stats._beforeThis, cb) }, cb);
        else obj.after.call(stats._beforeThis, cb);
    }

    // inherit before settings from nesting tests
    var outerBeforeThis = stats._beforeThis;
    stats._beforeThis = copyObject(outerBeforeThis);

    var i, j;
    for (i in obj) {
        // beforeEach/afterEach/setUp/tearDown are run anew for each test
        if (i === 'beforeEach' && Array.isArray(obj[i])) for (j=0; j<obj[i].length; j++) setups.push(obj[i][j]);
        else if (i === 'beforeEach' || i === 'setUp') setups.push(obj[i]);
        else if (i === 'afterEach' && Array.isArray(obj[i])) for (j=obj[i].length-1; j>=0; j--) teardowns.unshift(obj[i][j]);
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
                if (i === '_tests' && Array.isArray(test)) {
                    aflow.applyVisitor(test, function(tst, cb) {
                        var testname = namePrefix + tst.name;
                        var test = tst.test;
                        runTest(test, testname, options, setups, teardowns, stats, cb)
                    }, cb);
                }
                else runTest(test, testname, options, setups, teardowns, stats, cb);
            },
            function(err) {
                if (err) return done(err);
                after.call(stats._beforeThis, function(err) {
                    if (obj.setUp) setups.pop();
                    if (Array.isArray(obj.beforeEach)) for (j=0; j<obj.beforeEach.length; j++) setups.pop();
                    else if (obj.beforeEach) setups.pop();
                    if (obj.tearDown) teardowns.shift();
                    if (Array.isArray(obj.afterEach)) for (j=0; j<obj.afterEach.length; j++) teardowns.shift();
                    else if (obj.afterEach) teardowns.shift();
                    stats._beforeThis = outerBeforeThis;
                    // err will be falsy if already reported, "stop" if should bail, Error if not handled yet
                    stats._depth -= 1;
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
        stats.errors.push(err);
        reportit(tester, err, stats, options, function() {
            if (options.stopOnFailure) return done("stop");
            else done();
        })
    }, testTimeout);

    stats.testCount += 1;

    runit(tester, test, setups, teardowns, function(err) {
        clearTimeout(timer);
        tester._test = null;
        stats.assertionCount += tester.assertionCount;
        if (err && err !== '__skip') {
            stats.errors.push(err);
            console.log(err);
        }
        reportit(tester, err, stats, options, function() {
            if (err === '__skip') err = null;
            if (err && options.stopOnFailure) return done("stop");
            else done();
        });
    });

    function runit(tester, testFunc, setups, teardowns, callback) {
        // each test runs with its own `this` object
        // the `this` object gets a shallow copy of all before properties,
        // and is then initialized (here) with all setUp/beforeEach methods
        var testContext = copyObject(stats._beforeThis);

        function done( err, ret ) {
            // return on the next tick to allow the function that called t.done() to return
            // so mocked methods (eg t.stubOnce) can clean up before the next test runs.
            // Also, aflow may or may not break up the call stack with setImmediate,
            // so doing it ourselves is more predictable.
            setImmediate(function() {
                callback(err, ret);
            })
        }

        aflow.applyVisitor(
            setups,
            function(setUp, cb) {
                if (setUp.length === 0 && setUp._mocha) {
                    // mocha before/after callbacks are optional
                    setUp.call(testContext);
                    cb();
                }
                else setUp.call(testContext, cb);
            },
            function(err) {
                // setup errors are fatal
                if (err) return done(err);

                tester._onDone = function whenDone(err) {
                    // the teardowns are not run on test error
                    if (err) return done(err);

                    // run all the teardowns
                    aflow.applyVisitor(
                        teardowns,
                        function(tearDown, cb) {
                            if (tearDown.length === 0 && tearDown._mocha) {
                                tearDown.call(testContext);
                                cb();
                            }
                            else tearDown.call(testContext, cb);
                        },
                        function(err) {
                            // teardown errors are also fatal
                            if (err) throw err;
                            done(err, testContext);
                        }
                    );
                }

                // trap test errors, send them to _onDone
                try { testFunc.call(testContext, tester) }
                catch (err) { tester._onDone(err) }
            }
        );
    }

    function reportit( tester, err, stats, options, cb ) {
        var duration = tester.getDuration();
        var skipped = err === '__skip';
        var ok = err ? ' X' : ' -';
        if (skipped) { err = null; ok = ' S'; stats.skippedCount += 1 }
        var elapsed = (duration >= options.slowTest ? " (%s)" : "");
        var format = "%s %s" + elapsed + "\n" + (err ? "\n" : "");
        tester.printf(format, ok, tester._name, skipped ? 'SKIPPED' : formatTimestamp(duration) + 'ms', err);
        if (err && err.stack) tester.printf("%s\n\n", err.stack);
        cb();
    }
}

function QUnit( name ) {
    this._name = name;
    this._startTime = getTimestamp();
    this._test = null;
    this.assertionCount = 0;
}

QUnit.prototype = {
    // test metadata
    _name: "",
    _test: null,
    _startTime: 0,
    _doneCount: 0,
    _onDone: null,
    assertionCount: undefined,
    getDuration: function() { return getTimestamp() - this._startTime; },

    // qmock support
    getMock: null,
    getMockSkipConstructor: null,
    __qmockList: null,

    skip:
    function skip( ) {
        // abort the test, do not check assertions, vector to teardowns
        if (this._doneCount !== 0) throw new Error("skip: done() already called");
        throw '__skip';
    },

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

    expect:
    function expect(n) {
        this._expectedAssertionCount = n;
    },

    printf: qprintf.printf,
    sprintf: qprintf.sprintf,
    vsprintf: qprintf.vsprintf,
};

// add assertion methods from qassert
// the qassert assertions increment this.assertionCount for their host object
// QUnit.prototype.assertionCount = 0;
for (var k in qassert) if (QUnit.prototype[k] !== undefined) throw new Error("cannot inherit qassert." + k);
for (var k in qassert) if (QUnit.prototype[k] === undefined) QUnit.prototype[k] = qassert[k];

// speed access
QUnit.prototype = QUnit.prototype;
