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
    function getarg(p) {
        if (argi >= nargs) throw new Error("missing argument for %" + fmt[p] + " conversion");
        return argv[argi++];
    }
    function reject(conv) {
        throw new Error("%" + conv + ": unsupported conversion");
    }
    function str_repeat( ch, n ) {
        var ret = "";
        while (n >= 2) { ret += ch + ch; n -= 2; }
        while (n > 0) { ret += ch; n -= 1; }
        return ret;
    }
    function padValue( padWidth, padChar, rightPad, str ) {
        var n;
        if (!padWidth || (n = padWidth - str.length) <= 0) return str;
        return rightPad ? str + str_repeat(padChar, n) : str_repeat(padChar, n) + str;
    }

    var p0 = 0, p, str = "";
    while ((p = fmt.indexOf('%', p0)) >= 0) {
        if (p > 0) str += fmt.slice(p0, p);
        p++;
        if (fmt[p] === 'l' && (fmt[p+1] === 'd' || fmt[p+1] === 'u' || fmt[p+1] === 'f')) p++;
        var rightPad = false;
        var padChar = ' ';
        var padWidth = 0;

        if (fmt[p] >= '0' && fmt[p] <= '9' || fmt[p] === ' ' || fmt[p] === '-') {
            if (fmt[p] === '-') { rightPad = true; p++; }
            if (fmt[p] === '0') { padChar = '0'; p++; }
            padWidth = parseInt(fmt.slice(p, p+15), 10);
            while (fmt[p] >= '0' && fmt[p] <= '9') p++;
            // TODO: '.' to truncate the value
            // TODO: '+' to always print sign, ' ' to print - for neg and ' ' for positive
            // note: glibc does not zero-pad on the right
        }

        switch (fmt[p]) {
        // integer types
        case 'd': str += padValue(padWidth, padChar, rightPad, getarg(p).toString(10)); break;
        case 'i': str += padValue(padWidth, padChar, rightPad, Math.floor(getarg(p)).toString(10)); break;
        case 'x': str += padValue(padWidth, padChar, rightPad, Math.floor(getarg(p)).toString(16)); break;
        case 'o': str += padValue(padWidth, padChar, rightPad, Math.floor(getarg(p)).toString(8)); break;
        case 'b': str += padValue(padWidth, padChar, rightPad, Math.floor(getarg(p)).toString(2)); break;
        case 'c': str += String.fromCharCode(getarg(p)); break;
        // float types
        case 'f': str += padValue(padWidth, padChar, rightPad, getarg(p).toString(10)); break;
        // string types
        case 's': str += padValue(padWidth, padChar, rightPad, getarg(p)); break;
        // the escape character itself
        case '%': str += padValue(padWidth, padChar, rightPad, '%'); break;
        // qunit extensions
        case 'O': str += padValue(padWidth, padChar, rightPad, formatObject(getarg(p), padWidth)); break;
        default: reject(fmt[p]); break;
            // TODO: pass full conversion specifier to reject()... if does not impact speed
        }
        p0 = p + 1;
    }
    if (p0 < fmt.length) str += fmt.slice(p0);
    return str;
}

function formatObject( obj, depth ) {
    return util.inspect(obj, {depth: depth ? depth : 6});
}
