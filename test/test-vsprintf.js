vsprintf = require('../lib/vsprintf');

module.exports = {
    'should interpolate strings': function(t) {
        t.equal(t.sprintf("%s", "foo"), "foo");
        t.equal(t.sprintf("(%s)", "foo"), "(foo)");
        t.equal(t.sprintf("A%sB%sC", "foo", "bar"), "AfooBbarC");
        t.done();
    },

    'should interpolte integers': function(t) {
        t.equal(t.sprintf("%d", 123), "123");
        t.equal(t.sprintf("(%d)", 123), "(123)");
        t.equal(t.sprintf("A%dB%dC", 123, 456), "A123B456C");
        t.done();
    },

    'should interpolate chars': function(t) {
        t.equal(t.sprintf("%c", 'A'), 0x41);
        t.equal(t.sprintf("%c", 'a'), 0x61);
        t.equal(t.sprintf("%c", ' '), 0x20);
        t.done();
    },

    'should pad fields': function(t) {
        t.equal(t.sprintf("%5d", 123), "  123");
        t.equal(t.sprintf("%05d", 123), "00123");
        t.equal(t.sprintf("%-05d", 123), "12300");
        t.done();
    },

    'speed': function(t) {
        for (var i=0; i<1000; i++) {
            var s = t.sprintf("String %s num %05d %O\n", "some string", 123, {a: 1, b: 2.5, c: 'c'});
            //var s = t.sprintf("String %s num %d %O\n", "some string", 123, {a: 1, b: 2.5, c: 'c'});
        }
        // 60k/s
        t.done();
    },
};
