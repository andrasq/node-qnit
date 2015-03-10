vsprintf = require('../lib/vsprintf');
sprintf = vsprintf.sprintf;

module.exports = {
    'should interpolate strings': function(t) {
        t.equal(sprintf("%s", "foo"), "foo");
        t.equal(sprintf("(%s)", "foo"), "(foo)");
        t.equal(sprintf("A%sB%sC", "foo", "bar"), "AfooBbarC");
        t.done();
    },

    'should interpolte integers': function(t) {
        t.equal(sprintf("%d", 123), "123");
        t.equal(sprintf("(%d)", 123), "(123)");
        t.equal(sprintf("A%dB%dC", 123, 456), "A123B456C");
        t.done();
    },

    'should interpolate chars': function(t) {
        t.equal(sprintf("%c", 65), 'A');
        t.equal(sprintf("%c", 97), 'a');
        t.equal(sprintf("%c", 32), ' ');
        t.done();
    },

    'should pad fields': function(t) {
        t.equal(sprintf("%5d", 123), "  123");
        t.equal(sprintf("%05d", 123), "00123");
        t.equal(sprintf("%-05d", 123), "12300");
        t.done();
    },

    'should reject unknown conversions': function(t) {
        try {
            sprintf("%z", 3);
            t.fail();
        }
        catch (err) {
            t.ok(true);
            t.done();
        }
    },

    'speed of 10k string+num+obj': function(t) {
        for (var i=0; i<1000; i++) {
            var s = sprintf("String %s num %05d %O\n", "some string", 123, {a: 1, b: 2.5, c: 'c'});
            //var s = sprintf("String %s num %d %O\n", "some string", 123, {a: 1, b: 2.5, c: 'c'});
        }
        // 60k/s
        t.done();
    },
};
