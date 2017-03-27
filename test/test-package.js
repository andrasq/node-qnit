/**
 *
 * Copyright (C) 2015 Andras Radics
 * Licensed under the Apache License, Version 2.0
 */

module.exports = {
    'should parse package.json': function(t) {
        require('../package.json');
        t.done();
    },

    'should export qmock, qassert, qprintf': function(t) {
        var qnit = require('../');
        t.equal(qnit.qassert, require('qassert'));
        t.equal(qnit.qmock, require('qmock'));
        t.equal(qnit.qprintf, require('qprintf'));
        t.done();
    },
};
