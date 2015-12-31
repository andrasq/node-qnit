/**
 * parseopt - command-line argument parsing
 * split out of bin/qnit
 *
 * Copyright (C) 2015 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */

module.exports = parseOptions;

var tty = require('tty');
var getopt = require('../deps/getopt').getopt;

function parseOptions( argv, VERSION ) {
    if (!VERSION) VERSION = "?";

    function usage(code) {
        var lines = [
            "qnit " + VERSION + " -- quick little unit test runner",
            "",
            "options:",
            "    -C, --no-color",
            "        do not colorize console output",
            "    -f PATT, --filter PATT",
            "        only run tests whose full name contains the string PATT",
            "    --fork-files",
            "        run each test file in a separate process",
            "    -h, --help",
            "        this help message",
            "    --no-exit",
            "        do not call process.exit() when the tests are done",
            "    -r PACKAGE, --require PACKAGE",
            "        load the package before starting the tests",
            "    --stop-on-failure, -b, --bail",
            "        stop the tests as soon as one of them fails",
            "    -t MS, --timeout MS",
            "        ms idle timeout to wait for a test to call done() (default 2000)",
            "    -v, --verbose",
            "        TBD: show more info",
            "    -V, --version",
            "        print the qnit version and exit",
        ];
        process.stdout.write(lines.join("\n") + "\n");
        process.exit(code);
    }

    var opts = getopt(
        argv,
        "C(-no-color)f:(-filter):(-fork-files)h(-help)(-no-exit)r:(-require):" +
        "(-stop-on-failure)b(-bail)t:(-timeout):v(-verbose)V(-version)"
    );
    if (opts.h || opts.help) return usage(0);

    if (opts.V || opts.version) {
        process.stdout.write("qnit " + VERSION + "\n");
        return;
    }

    if (opts.r || opts.require) {
        var packages = opts.r || opts.require;
        if (!Array.isArray(packages)) packages = [packages];
        for (var i = 0; i < packages.length; i++) {
            try { require(packages[i]); }
            // TODO: should do a better job of finding the required dependency
            catch (err) { require(process.cwd() + "/node_modules/" + packages[i]); }
        }
    }

    // if output not going to the console, do not colorize
    if (!tty.isatty(1)) opts.C = true;

    var suiteOptions = {
        showHelp: opts.h || opts.help,
        showVersion: opts.V || opts.version,
        require: opts.r || opts.require,
        noColor: opts.C || opts['no-color'] || false,
        filter: opts.f || opts.filter || false,
        stopOnFailure: opts['stop-on-failure'] || opts.b || opts.bail || false,
        verbose: opts.v || opts.verbose || false,
        testTimeout: opts.t || opts.timeout || 2000,
        forkFiles: opts['fork-files'],
    };

    return suiteOptions;
}
