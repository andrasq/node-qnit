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

All assertions accept an optional message.  If provided, the message will be
included in the assertion diagnostics.  It can be helpful to explain what
failed.  Note that qunit includes both the `assert` failure message and the
user-provided message; `assert` omits its diagnostic showing the failed values
if the user had provided their own message.

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

#### t.throws( block, [error], [message] )

confirm that the block throws the specified error.  Error can be an Error
object, a RegExp, or a validator function.

#### t.doesNotThrow( block, [message] )

confirm that the block does not throw an error.

#### t.ifError( err )

fail the test if the error is set

#### t.fail( )

Fail the test.

This is different from `assert.fail`, which is an internal assert helper
function.

### Mocks

QUnit supports mock test doubles using the
[QMock](https://npmjs.org/package/qmock) library.  Refer to qmock for full
details.

#### t.getMock( object, [methodsToMock], [constructorArgs] )

Create a test double.  `object` can be an existing object or a constructor
function.  The mock double will be instanceof the same class and having the
same methods.  The `methodsToMock` list of methods will be stubbed out
and replaced with no-op methods.  `constructorArgs` will be used if object
is a constructor function.

#### t.getMockSkipConstructor( constructor, [methods] )

Similar to getMock, but does not run the constructor function.  The mock
double will be instanceof the constructor and will inherit the same methods
as a new instance.  If constructor is an object (not a constructor function),
the call behaves like getMock.


## Todo

- nodeunit compatibility
- mocha compatibility
- bundle up errors and output all at the end (instead of interleaving)
- gather result rows into json and output with a json-to-text reporter module
