/**
 * Copyright (C) 2015 Andras Radics
 * Licensed under the Apache License, Version 2.0
 *
 * 2015-02-24 - AR.
 */

'use strict';

var qunit = require('./qunit.js');

process.on('message', function listen(message) {
    if (message.options.require) {
        var packages = Array.isArray(message.options.require) ? message.options.require : [ message.options.require ];
        for (var i = 0; i < packages.length; i++) require(packages[i]);
    }

    switch (message.n) {
    case 'runFile':
        qunit.runFile(message.filename, message.options, message.stats, function(err) {
            err = !err ? undefined : { code: err.code, message: err.message, stack: err.stack, err: err };
            process.send({ ok: !err, err: err, stats: message.stats });
        });
        break;
    case 'quit':
        process.send({ ok: true, stats: message.stats });
        process.removeListener('message', listen);
        break;
    default:
        process.send({ ok: false, err: { message: message.n + ": unrecognized command", stack: "" } });
    }
});
