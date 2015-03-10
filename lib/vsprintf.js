/**
 * quick little printf-like string interpolator
 *
 * Implements a basic subset of C printf conversions, including field widths.
 *
 * Copyright (C) 2015 Andras Radics
 * Licensed under the Apache License, Version 2.0
 *
 * 2015-02-24 - AR.
 */

'use strict';

module.exports = vsprintf;
module.exports.printf = printf;
module.exports.sprintf = sprintf;

var util = require('util');


function printf( fmt ) {
    var argv = new Array();
    for (var i=1; i<arguments.length; i++) argv.push(arguments[i]);
    process.stdout.write(vsprintf(fmt, argv));
}

function sprintf( fmt ) {
    var args = new Array();
    for (var i=1; i<arguments.length; i++) args.push(arguments[i]);
    return vsprintf(fmt, args);
}

function vsprintf( fmt, argv ) {
    var argi = 0, nargs = argv.length;
    function getarg( p ) {
        if (argi >= nargs) throw new Error("missing argument for %" + fmt[p] + " conversion");
        return argv[argi++];
    }

    var p0 = 0, p, str = "";
    while ((p = fmt.indexOf('%', p0)) >= 0) {
        if (p > 0) str += fmt.slice(p0, p);
        p++;

        // parse the field width specifier, if any
        var padChar = ' ', padWidth = 0, rightPad = false;
        var flag = fmt[p];
        if (flag >= '0' && flag <= '9' || flag === '-') {
            if (fmt[p] === '-') { rightPad = true; p++; }
            if (fmt[p] === '0') { padChar = '0'; p++; }
            padWidth = parseInt(fmt.slice(p, p+15), 10);
            while (fmt[p] >= '0' && fmt[p] <= '9') p++;
            // TODO: '.' to truncate the value
            // TODO: '+' to always print sign, ' ' to print - for neg and ' ' for positive
            // TODO: ' ' to print sign for negative or space for positive
            // TODO: allow long and long long modifiers, eg %ld and %lld
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
        // TODO: make %A interpret padWidth as the number of elements to print
        case 'A': str += padValue(padWidth, padChar, rightPad, formatObject(getarg(p), padWidth)); break;
        case 'O': str += padValue(padWidth, padChar, rightPad, formatObject(getarg(p), padWidth)); break;
        default: throw new Error("%" + fmt[p] + ": unsupported conversion"); break;
            // TODO: include full conversion specifier in error... if does not impact speed
        }
        p0 = p + 1;
    }
    if (p0 < fmt.length) str += fmt.slice(p0);
    return str;
}


function str_repeat( str, n ) {
    var ret = "";
    while (n >= 3) { ret += str + str + str; n -= 3; }
    while (n > 0) { ret += str; n -= 1; }
    return ret;
}

function padValue( padWidth, padChar, rightPad, str ) {
    var n;
    if (!padWidth || (n = padWidth - str.length) <= 0) return str;
    return rightPad ? str + str_repeat(padChar, n) : str_repeat(padChar, n) + str;
}

function formatObject( obj, depth ) {
    return util.inspect(obj, {depth: depth ? depth : 6});
}
