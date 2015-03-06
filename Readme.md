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


## Command Line

`qunit [options] [file] [file2 ...]`

Runs the unit tests in the specified files, or all tests in the `./test`
directory.

Options:

- `-C` - do not colorize console output.  Piped output is never colorized.
- `-f PATT, --filter PATT` - run only the tests matching the pattern (TODO: not implemented)
- `-h, --help` - built in usage
- `--stop-on-failure` - do not continue with the test suite if one of the tests fails
- `-v, --verbose` - show more information about the tests run (TODO: not implemented)

## Tester Methods

        myTest: function(tester) {
            tester.ok(true);
            tester.done();
        }

### t.expect( count )

When test function is complete, require that the number of assertions run be
equal to count.  Count must be positive.  The test will fail if the assertion
count is different.

TODO: `expect` does not wait any additional time for the test to complete

### t.done( )

callback that must be called when the test finishes

### t.printf( format, [arg1], [...] )

simple printf-like output formatter, interpolates the arguments into the
format string and writes them to process.stdout.  Recognizes more formats than
console.log, and is faster to type.  The intent is to have a tracer call that
can run asynchronously and not add much overhead to the test being timed, in
case the test is timing sensitive (TODO: verify in practice)

printf supports the following conversions:

- `%s` - interpolate a string into the output
- `%d` - a decimal number.  Unlike traditional `printf`, this will print floats as floats.
- `%f` - a floating-point value
- `%i` - a decimal integer.  The integer conversions truncate the value.
- `%x` - a hexadecimal integer
- `%o` - an octal integer
- `%b` - a binary integer
- `%c` - the character represented by the unicode code point value of the argument
- `%%` - the `%` escape character itself
- `%O` - an object formatted with util.inspect to depth: 6

Printf supports basic conversion flags for field width control, per the regex
`(-?)(0?)([1-9][0-9]*)`.  E.g., `%20d` will interpolate a number into a field
20 characters wide.  If the value is wider then the field width, it will not
be truncated.  The truncating field width specifier `'.'` is not supported.

- `-` - left-align the value in the field
- `0` - zero pad the field (default is to pad with spaces)
- `NNN` - a decimal integer that specifies the field width

Examples

        ("%5d", 123)            => "  123"
        ("0x%04x", 123)         => "0x007b"
        ("%10s", "Hello")       => "     Hello"
        ("%-10s", "Hello")      => "Hello     "

### Assertions

The assertions from the [`assert`](http://nodejs.org/api/assert.html)
module are available as `tester` methods.  If
the assertion fails, an exception is thrown that qunit catches and reports as
a failed unit test.  The rest of that test function is omitted, and the next
test is run (unless --stop-on-failue was specified on the command line)

All assertions accept an optional message.  If provided, the message will be
included in the assertion diagnostics.  It can be helpful to explain what
failed.  Note that qunit includes both the `assert` failure message and the
user-provided message; `assert` omits its diagnostic showing the failed values
if the user had provided their own message.

#### t.ok( condition, [message] )

assert that the condition is truthy, else fail the test.  Also available as
`t.assert()`

#### t.equal( a, b, [message] )

coercive equality test, `a == b`.  Like in nodeunit and phpunit, this assertion
is also available by the alias `equals`.

#### t.notEqual( a, b, [message] )

coercive inequality, `a != b`

#### t.deepEqual( a, b, [message] )

recursive equality, objects and arrays have equal elements.  Element
comparisons are coercive `==`, thus `[1]` and `[true]` are deepEqual.

#### t.notDeepEqual( a, b, [message] )

recursive inequality, objects and arrays differ.

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

Fail the test.  `fail()` is not counted as an assertion, it's an outright
failure.

This is different from `assert.fail`, which is an internal helper function.

### Mocks

QUnit supports mock test doubles using the
[QMock](https://npmjs.org/package/qmock) library.  Refer to qmock for details.

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
