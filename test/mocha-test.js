/**
 * Copyright (C) 2015 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */

'use strict';

var assert = require('assert');
var qunit = require('../index');
var qmocha = require('../lib/mocha-compat');

var trace = [];
module.exports = trace;

describe('describe suite', function() {

    var printf = qunit.QUnit.prototype.printf;

    before(function before(done) { trace.push("top before"); done(); });
    after(function after(done) { trace.push("top after"); done(); });
    after(function after(done) { trace.push("top after 2"); done(); });
    beforeEach(function beforeEach(done) { trace.push("top before each"); done(); });
    afterEach(function afterEach(done) { trace.push("top after each"); done(); });

    it('test 1', function test1(done) { trace.push("test 1"); done(); });
    it('test 2', function test2(done) { trace.push("test 2"); done(); });

    describe('nested describe suite', function() {
        before(function before2(done) { trace.push("nested before"); done(); });
        before(function before2(done) { trace.push("nested before 2"); done(); });
        after(function after2(done) { trace.push("nested after"); done(); });
        beforeEach(function beforeEach2(done) { trace.push("nested before each"); done(); });
        afterEach(function afterEach2(done) { trace.push("nested after each"); done(); });

        describe('nested 2 describe suite', function() {
            before(function before3(done) { trace.push("nested 2 before"); done(); });
            after(function after3(done) { trace.push("nested 2 after"); done(); });
            beforeEach(function beforeEach3(done) { trace.push("nested 2 before each"); done(); });
            beforeEach(function beforeEach3(done) { trace.push("nested 2 before each 2"); done(); });
            afterEach(function afterEach3(done) { trace.push("nested 2 after each"); done(); });

            it('nested 2 test 1', function test1c(done) { trace.push("nested 2 test 1"); done(); });
            it('nested 2 test 2', function test2c(done) { trace.push("nested 2 test 2"); done(); });
        });

        it('nested test 1', function test1b(done) { trace.push("nested test 1"); done(); });
        it('nested test 2', function test2b(done) { trace.push("nested test 2"); done(); });
    });
});
