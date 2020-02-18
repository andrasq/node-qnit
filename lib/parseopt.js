/**
 * parseopt - command-line argument parsing
 * split out of bin/qnit
 *
 * Copyright (C) 2015,2020 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */

module.exports = parseOptions;

var tty = require('tty');
var getopt = require('qgetopt');

function parseOptions( argv, VERSION ) {
    if (!VERSION) VERSION = "?";

    if (typeof argv === 'string') {
        // TODO: preserve quoted whitespace
        argv = argv.split(/\s+/);
        argv.unshift('qnit.conf');
        argv.unshift(process.argv[0]);
    }

    function usage(code) {
        var lines = [
            "qnit " + VERSION + " -- quick little unit test runner",
            "",
            "options:",
            "    -C, --no-color",
            "        do not colorize console output",
            "    --config FILE",
            "        load run-time options from the named file",
            "    -f PATT, --filter PATT",
            "        only run tests whose full name contains the string PATT",
            "    --fork-files",
            "        run each test file in a separate process",
            "    -h, --help",
            "        this help message",
            "    --no-exit",
            "        do not call process.exit() when the tests are done",
            "    --no-recurse",
            "        do not recurse into test sub-directories",
            "    -r PACKAGE, --require PACKAGE",
            "        load the package before starting the tests",
            "    --stop-on-failure, -b, --bail",
            "        stop the tests as soon as one of them fails",
            "    -s, --slow ms",
            "        report elapsed test time if more than ms (default 0, all)",
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
        "C(-no-color)(-no-colors)(-config):" +
        "f:(-filter):(-fork-files)h(-help)(-no-exit)r:(-require):" +
        "(-no-recurse)" +
        "(-stop-on-failure)b(-bail)t:(-timeout):v(-verbose)V(-version)" +
        "s:(-slow):" +
        ""
    );
    if (opts.h || opts.help) return usage(0);

    if (opts.V || opts.version) {
        process.stdout.write("qnit " + VERSION + "\n");
        return;
    }

    if (opts.r || opts.require) {
        var packages = [].concat(opts.r || [], opts.require || []);
        for (var i = 0; i < packages.length; i++) {
            try { require(packages[i]); }
            // TODO: should do a better job of finding the required dependency
            catch (err) { require(process.cwd() + "/node_modules/" + packages[i]); }
        }
    }

    // if output not going to the console, do not colorize
    if (!tty.isatty(1)) opts.C = true;

    if (opts.config) {
        opts.config = [].concat(opts.config).pop();
    }

    // options are set only if specified, else are left undefined
    // (necessary to be able to later override qnit.conf options)
    var suiteOptions = {
        showHelp: opts.h || opts.help,
        showVersion: opts.V || opts.version,
        config: opts.config,
        recurse: opts['no-recurse'],
        require: opts.r || opts.require,
        noColor: opts.C || opts['no-color'],
        filter: opts.f || opts.filter,
        stopOnFailure: opts['stop-on-failure'] || opts.b || opts.bail,
        verbose: opts.v || opts.verbose,
        testTimeout: opts.t || opts.timeout,
        forkFiles: opts['fork-files'],
        slowTest: opts.s || opts.slow || 0,
    };

    // TODO: read qnit.conf-relative config files too (TBD: needs dirname)
    if (suiteOptions.config) {
        //var conf = parseOptions(fs.readFileSync(suiteOptions.config).toString());
        //for (var k in conf) if (conf[k] !== undefined) suiteOptions[k] = conf[k];
    }

    return suiteOptions;
}
