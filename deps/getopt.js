/**
 * getopt() -- extract traditional unix command-line arguments
 * Modifies the passed argv array, returns the found options as properties.
 *
 * Traditional unix command options follow the command name and precede the
 * command arguments, so e.g. ls -l /tmp.  Options have to begin with the '-'
 * switch character.  The first argument that does not start with - ends
 * the options scan.  The special argument '--' ends scanning and is skipped,
 * and a - by itself is an argument and not a command option switch.
 * The returned option parameters are always strings, not parsed into numbers.
 *
 * Examples:
 *      argsHash = getopt(argv, "x:y::h(-help)");
 *
 * Copyright (C) 2014-2015 Andras Radics
 * Licensed under the Apache License, Version 2.0
 *
 * 2014-09-28 - AR.
 */

module.exports.getopt = getopt;
module.exports.nextopt = nextopt;


/**
 * Remove and return the next option from argv, or false.
 * Options start at argv[2] (argv[0] is the program name, argv[1] the script).
 * All other argv elements will be left, including options arguments.
 */
function nextopt( argv ) {
    var opt = argv[2];

    if (opt && opt[0] !== '-') {
        // argument, not an option switch
        return false;
    }
    else if (opt === '-') {
        // - is an argument, not an option switch
        return false;
    }
    else if (opt === '--') {
        // -- ends options, not part of arguments
        argv.splice(2, 1);
        return false;
    }
    else {
        argv.splice(2, 1);
        return opt;
    }
}

/**
 * Extract the command-line switches according to the options template.
 * Options may be a traditional unix options tring eg "ynf:", or an option
 * name to option argument count mapping.  Modifies the input argv,
 * and returns the option switches and switch parameters found.
 * Extended objects and option aliases tbd later, in getopt-ext.
 */
function getopt( argv, options ) {
    var i, opt, found = {};
    if (typeof argv === 'string') argv = argv.split(' ');

    if (typeof options === 'string') options = parseOptionsString(options);
    if (getopt.normalizeOptionsObject) options = getopt.normalizeOptionsObject(options);

    while ((opt = nextopt(argv, options))) {
        // option '-a' has name 'a'
        var equals, name = opt, value;
        var aliasDepth = 0;
        while (options[opt] && options[opt].alias) {
            opt = options[opt].alias;
            if (++aliasDepth > 1000) throw new Error("getopt alias loop");
        }
        if (options[opt] !== undefined) {
            var argc = options[opt].argc || options[opt] || 0;
            value = argv.splice(2, argc);
            if (value.length < argc || value.indexOf('--') >= 0) {
                throw new Error(opt + ": missing argument");
            }
            if (value.length === 1) value = value[0];
            if (value.length === 0) value = true;
        }
        else if ((equals = opt.indexOf('=')) > 0 &&
            options[name = opt.slice(0, equals)] &&
            options[name] &&
            (options[name] === 1 || options[name].argc === 1))
        {
            // allow equals-separated option params, eg --value=3
            value = opt.slice(equals+1);
            opt = opt.slice(0, equals);
        }
        else {
            throw new Error(opt + ": unrecognized option");
        }
        // strip the - and -- off the returned options (e.g. -h and --help)
        if (name[0] === '-') name = name.slice(1);
        if (name[0] === '-') name = name.slice(1);
        if (value === true) {
            // leave single yes/no option boolean, convert repeated yes/no option into count
            found[name] = (value === true ? (found[name] ? found[name] + 1 : true) : value);
        }
        else {
            // leave single param flat, convert repeated params into array
            if (found[name]) {
                if (!Array.isArray(found[name])) {
                    found[name] = found[name].length === 1 ? [found[name]] : [[found[name]]];
                }
                else if (Array.isArray(value) && !Array.isArray(found[name][0])) {
                    found[name] = [found[name]];
                }
                found[name].push(value);
            }
            else found[name] = value;
        }
    }

    found._program = argv[0];
    found._script = argv[1];
    found._argv = argv.slice(2);
    found._recognizedOptions = options;

    return found;
}

/**
 * convert traditional unix getopt string into a primitive options object
 */
function parseOptionsString( string ) {
    var i, j, name, options = {};
    for (i=0; i<string.length; i++) {
        if (string[i] === '(') {
            // support parenthesized long-names (-help) => --help
            var endp = string.indexOf(')', i);
            name = "-" + string.slice(i+1, endp);
            i = endp;
        }
        else {
            name = "-" + string[i];
        }
        options[name] = 0;
        for (j=0; string[i+1+j] === ':'; j++) options[name] += 1;
        i += j;
    }
    return options;
}


// quick test:
// console.log( getopt("js test.js -a 1 -name=value --verbose --value=33 -c -b 2 3 -- -d foo".split(" "), "a:(name):b::c(-verbose)(-value):d:") );
