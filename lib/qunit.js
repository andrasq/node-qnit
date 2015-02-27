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
var vsprintf = require('../deps/vsprintf');


module.exports.QUnit = QUnit;
module.exports.runFiles = runFiles;


function runFiles( argv, options, done ) {
    aflow.applyVisitor(
        argv,
        function visitor(filename, next) {
            var stat = fs.statSync(filename);
            if (stat.isFile()) {
                QUnit.prototype.printf("\n%s:\n", filename);
                runFile(filename, options, next);
            }
            else if (stat.isDirectory()) {
                // TODO: if directory (or parent) contains qunit.json, load settings from it
                var files = fs.readdirSync(filename);
                for (var i = 0; i < files.length; i++) files[i] = filename + '/' + files[i];
                aflow.filter(
                    files,
                    function visitor(file, next) {
                        next(null, file.slice(-3) == '.js');
                    },
                    function whenDone(err, files) {
                        if (err) return next(err);
                        runFiles(files, options, next);
                    }
                );
            }
        },
        function(err) {
// FIXME: count assertions? (return stats object?)
            done(err);
        }
    );
}

function runFile( filename, options, done ) {
    try {
        // reload the module each time to re-init module internals
        // note, though, that the module dependecies are simply reused
        var filepath = path.resolve(filename);
        delete require.cache[filepath];
        var module = require(filepath);
        run(module, "", options, function(err) {
            done(err);
        });
    }
    catch (err) {
        console.log(err.stack);
        done(err);
    }
}

function run( obj, name, options, done ) {
    var self = this;
    var stopOnFailure = options.stopOnFailure || false;
    var setUp = (typeof obj.setUp === 'function') ? obj.setUp : function(cb){ cb() };
    var tearDown = (typeof obj.tearDown === 'function') ? obj.tearDown : function(cb){ cb() };

    var prefix = name ? name + ' - ' : "";

    var tester; // current tester, also error flag
    aflow.applyVisitor(
        Object.keys(obj),
        function visitor(i, cb) {
            tester = null;
            var test = obj[i];
            if (i === 'setUp' || i === 'tearDown') return cb();
            if (typeof test === 'function') {
                // TODO: make runit and reportit methods on tester
                // TODO: pass options to tester constructor, use that to show (1ms) test duration
                tester = new QUnit(prefix + i);
                tester._test = test;
                QMock.extendWithMocks(tester, 'done');
                runit(tester, test, function(err, testBody) {
                    tester._test = null;
                    reportit(tester, err, testBody, function() {
                        if (err && stopOnFailure) return cb(err);
                        else cb();
                    });
                });
            }
            else if (typeof test === 'object') {
                run(test, prefix + i, options, cb);
            }
        },
        function(err) {
            // report as-yet unreported errors, to attribute to a test name
            if (err && (!tester || tester._test)) reportit(tester, err, tester._test, function() {
                done(err);
            })
            else done();
        }
    );

    function runit(tester, testFunc, cb) {
        // each test runs in own object with just setup/teardown/test methods
        var test = {
            _startTime: Date.now(),     // include setUp cost in test time
            setUp: setUp,
            tearDown: tearDown,
            _currentTest: testFunc,
        };
        test.setUp(function(err) {
            if (err) return cb(err);
            function whenDone(err) {
                if (err) return cb(err);
                test.tearDown(function(err) {
                    cb(err, test);
                });
            }
            // time each test to be able to show elapsed time
            tester._onDone = whenDone;
            test._currentTest(tester);
        });
    }

    function reportit(tester, err, test, cb) {
        var duration = Date.now() - test._startTime;
        var ok = err ? ' X' : ' -';
        var elapsed = (duration >= 0 ? " (%dms)" : "");
        var format = "%s %s" + elapsed + "\n" + (err ? "\n" : "");
        tester.printf(format, ok, tester._name, duration);
        cb();
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
        if (!p) throw new Error("assertion failed: " + p.toString() + (msg ? msg : ""));
    },

    ok: null,

    printf:
    function printf( fmt ) {
        var argv = new Array();
        for (var i=1; i<arguments.length; i++) argv.push(arguments[i]);
        process.stdout.write(this.vsprintf(fmt, argv));
    },

    vsprintf: vsprintf,
};

// prototype aliases
QUnit.prototype.ok = QUnit.prototype.assert;

// quicktest:
/**

var t = new QUnit();
t.printf("Hello, %s %x %O\n", "Andras", 2, {a:1,b:2,s:{c:3, d:4, e:5, f:6}});

/**/
