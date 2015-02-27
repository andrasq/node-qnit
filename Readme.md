node-qunit
==========

simple little unit test runner, in the spirit of nodeunit and phpunit

WORK IN PROGRESS


## Summary

Nodeunit-like utility usage:

        bin/qunit test/

where test/test-test.js contains for example:

        module.exports = {
            setUp: function(done) {
                this.test = 1;
            },

            'should run test': function(t) {
                t.ok(this.test == 1);
                t.done();
            },
        };


## Tester Methods

        myTest: function(tester) {
            tester.ok(true);
            tester.done();
        }

### t.done( )

callback that must be called when the test finishes

### t.printf( format, [arg1], [...] )

simple printf-like output formatter, interpolates the arguments into the
format string and writes them to process.stdout.  Recognizes more formats than
console.log, and is faster to type.  The intent is to have a tracer call that
can run asynchronously and not add much overhead to the test being timed, in
case the test is timing sensitive (TODO: verify in practice)

### Assertions

#### t.ok( condition )

assert that the condition is truthy, else fail the test.

### Mocks

#### t.getMock( objectOrConstructor, [methodsToMock], [constructorArgs] )

#### t.getMockSkipConstructor( object, [methods] )

TODO:

- t.equal
- t.notEqual
- t.deepEqual

## Todo

- nodeunit compatibility
- mocha compatibility
- bundle up errors and output all at the end (instead of interleaving)
- use a sub-millisecond timer for reporting test times
- gather result rows into json and output with a json-to-text reporter module
