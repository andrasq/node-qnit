/**
 * simple little printf string interpolator, one step up from console.log
 *
 * Copyright (C) 2015 Andras Radics
 * Licensed under the Apache License, Version 2.0
 *
 * 2015-02-24 - AR.
 */

'use strict';

module.exports = vsprintf;

var util = require('util');

function vsprintf( fmt, argv ) {
    var argi = 0, nargs = argv.length;
    function getarg(i) {
        if (argi >= nargs) throw new Error("missing argument for % conversion #" + (argi+1));
        return argv[argi++];
    }
    function reject(conv) {
        throw new Error(conv + ": unsupported conversion");
    }

    var p0 = 0, p, str = "";
    while ((p = fmt.indexOf('%', p0)) >= 0) {
        if (p > 0) str += fmt.slice(p0, p);
        p++;
        if (fmt[p] === 'l' && (fmt[p+1] === 'd' || fmt[p+1] === 'u' || fmt[p+1] === 'f')) p++;
        switch (fmt[p]) {
        // integer types
        case 'u':
        case 'i':
        case 'h':
        case 'd': str += getarg().toString(10); break;
        case 'X':
        case 'x': str += getarg().toString(16); break;
        case 'o': str += getarg().toString(8); break;
        case 'b': str += getarg().toString(2); break;
        case 'c': str += String.fromCharCode(getarg()); break;
        // float types
        case 'e':
        case 'E':
        case 'g':
        case 'g':
        case 'f': str += getarg().toString(); break;
        // string types
        case 's': str += getarg(); break;
        // the escape character itself
        case '%': str += '%'; fmt.slice(1); break;
        // qunit extensions
        case 'O': str += formatObject(getarg()); break;
        default: reject(fmt[p]); break;
        }
        p0 = p + 1;
    }
    if (p0 < fmt.length) str += fmt.slice(p0);
    return str;
}

function formatObject( obj ) {
    return util.inspect(obj);
}
