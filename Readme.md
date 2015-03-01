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

            'should run test': function(tester) {
                tester.ok(this.test == 1);
                tester.done();
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

The assertions from the `assert` module are available as `tester` methods.  If
the assertion fails, an exception is thrown that qunit catches and reports as
a failed unit test.

#### t.ok( condition, [message] )

assert that the condition is truthy, else fail the test.  Also available as
`t.assert`

#### t.equal( a, b, [message] )

coercive equality test, `a == b`

#### t.notEqual( a, b, [message] )

coercive inequality, `a != b`

#### t.deepEqual( a, b, [message] )

recursive equality, objects and arrays have equal elements

#### t.notDeepEqual( a, b, [message] )

recursive inequality, objects and arrays are not equal

#### t.strictEqual( a, b, [message] )

strict equality test, `a === b`

#### t.notStrictEqual( a, b, [message] )

strict inequality test, `a !== b`

#### t.throws( )

#### t.doesNotThrow( )

#### t.ifError( err )

fail the test if the error is set

#### t.fail( )

Fail the test.

This is different from `assert.fail`, which is an internal assert helper
function.

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
- gather result rows into json and output with a json-to-text reporter module
