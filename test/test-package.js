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
};
