/**
 * Copyright (C) 2017,2020 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */

'use strict';

var path = require('path');
var tty = require('tty');
var parseopt = require('../lib/parseopt');
var pkg = require('../package.json');

module.exports = {

    'should parse args vector': function(t) {
        var argv = [ "node", "file", "-t", "23", "-b" ];
        var opts = parseopt(argv, "1234");
        t.equal(opts.testTimeout, 23);
        t.ok(opts.stopOnFailure);
        t.done();
    },

    'should parse args string': function(t) {
        var opts = parseopt("-t 23 -b", "1234");
        t.equal(opts.testTimeout, 23);
        t.ok(opts.stopOnFailure);
        t.done();
    },

    '--help should show usage': function(t) {
        var output = "";
        var spy = t.spy(process.stdout, 'write', function(str) { output += str });
        t.stubOnce(process, 'exit');
        parseopt("--help", 1234);
        spy.restore();
        t.contains(output, "qnit 1234 ");
        t.contains(output, "unit test runner");
        t.contains(output, "-h, --help");
        t.contains(output, "-V, --version");
        t.done();
    },

    '--version should show version': function(t) {
        var output;
        t.spyOnce(process.stdout, 'write', function(str) { output = str });
        parseopt("--version", "1.2.3.4");
        t.contains(output, "qnit 1.2.3.4");
        t.done();
    },

    '--require should load dependency': function(t) {
        // TODO: require does not find $cwd-relative paths
        var pathname = path.dirname(__filename) + "/dep.js";
        parseopt("--require " + pathname);
        var index = require.resolve(pathname);
        t.ok(require.cache[index]);
        t.equal(require.cache[index].exports.dep, "dependency");

        t.unrequire(pathname);
        parseopt("--require " + pathname + " -r " + pathname);
        t.ok(require.cache[index]);

        t.done();
    },

    'should turn off colorization if not tty': function(t) {
        t.stubOnce(tty, 'isatty', function() { return false });
        var opts = parseopt("");
        t.equal(opts.noColor, true);
        t.done();
    },

    'should accept last --config': function(t) {
        var opts = parseopt("--config foo --config foofoo");
        t.equal(opts.config, 'foofoo');
        t.done();
    },

    'should throw if unable to -r require source': function(t) {
        t.throws(function() { parseopt("-r ./nonesuch"); }, /Cannot find module/);
        t.done();
    },
}
