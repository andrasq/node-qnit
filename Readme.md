node-qunit
==========

simple little unit test runner, in the spirit of nodeunit and phpunit


## Summary

Nodeunit-like command-line usage:

        npm install -g qunit
        qunit [testdir|testfile] [...]

where testdir/testfile.js contains for example:

        module.exports = {
            'should run test': function(t) {
                t.printf("running test!\n");
                t.done();
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
- `--no-exit` - do not call process.exit() when done, wait for a clean shutdown
- `-r PACKAGE, --require PACKAGE` - load the package before starting the tests
- `--stop-on-failure` - do not continue with the test suite if one of the tests fails
- `-t MS, --timeout MS` - ms idle timeout to wait for a test to call done() (default 2000)
- `-v, --verbose` - show more information about the tests run (TODO: not implemented)
- `-V, --version` - print the qunit version and exit

## Nodeunit Unit Tests

Nodeunit runs the test exported via `module.exports`.  The test can be a test
function or an object containing test functions and/or test objects. Functions
are invoked as tests, objects get their properties walked, with function
properties invoked as tests, and object properties recursed into.

Each test function gets a newly created empty object that is set to `this`
when the test is run.  The test function is passed a single parameter,
the tester object (usually called `t`), having a special method `done`.
`t.done()` must be called for the test to succeed.

Each test object can have two special properties, `setUp` and `tearDown`.  All
other properties are test functions or nested test objects.  If the `setUp`
function exists, it will be called before every contained test function,
contained both directly or indirectly inside a nested test object.  `setUp`
sees the same `this` that the test function will see; changes made to
properties `this.x` in `setUp` will be visible inside the test function and
also in `tearDown`.  `tearDown` is similar to `setUp` but is called after the
test calls done().

Note: unlike Mocha, Nodeunit runs every enclosing setUp method for each test
run, it does not distinguish top-level global initialization from test-specific
local initialization.  Using Mocha terminology, `setUp` and `tearDown`
correspond to `beforeEach` and `afterEach`; Nodeunit does not have a `before`
or an `after` equivalent.

Each test function when it runs invokes all setUp and tearDown calls from all
enclosing objects.  `setUp` and `tearDown` functions are paired and nest
around the test:  a new `this` object is created, the `setUp` functions are
called in outermost to innermost order, the test function is run, then the
`tearDown` functions are run in the innermost to outermost order.

### Example

        module.exports = {
            setUp: function(done) {
                this.x = 1;
                done();
            },
            tearDown: function(done) {
                this.x = null;
                done();
            },
            'test function': function(t) {
                assert.equal(this.x, 1);
                t.done();
            },
            'nested tests': {
                setUp: function(done) {
                    this.y = 2;
                },
                'nested test function': function(t) {
                    assert.equal(this.x, 1);
                    assert.equal(this.2, 2);
                    t.done()
                },
            },
        };

## Mocha Unit Tests

Mocha installs global functions `describe`, `it`, `before`, `after`,
`beforeEach` and `afterEach` that build up a test structure very similar to
that of nodeunit.

`describe` starts a new test object, and is passed a callback that builds the
test hierarchy.  `describe` can contain `it` tests or nested `desribe`'s.  `it`
specifies a test to run; it is passed a label and the test function itself.
`before` and `after` pair and are called before and after the tests in the
current test object, respectively.  `beforeEach` and `afterEach` are called
before and after every `it` test.

Note: unlike Nodeunit, `before` and `after` are run just once for each
nested `describe`, not once for each nested test.  This allows expensive
setup to be run only once and be reused by multiple tests.  Like Nodeunit,
`beforeEach` and `afterEach` methods are invoked for every `it` test, both
those in the current `describe` and those nested in contained `describe`'s.

State is shared between the tests and the setup/teardown methods via closures.
The enclosing `describe` must declare the shared variables for them to be
properly scoped.

Example:

        describe(function() {
            var x;
            beforeEach(function(done) {
                x = 1;
                done();
            });
            afterEach(function(done) {
                x = null;
                done();
            });
            it('test function', function(done) {
                assert.equal(x , 1);
                done();
            });
            describe('nested tests', function() {
                var y;
                beforeEach(function(done) {
                    y = 2;
                    done();
                });
                it('nested test function', function(done) {
                    assert.equal(x, 1);
                    assert.equal(y, 2);
                    done();
                });
            });


## Tester Methods

The tester object passed in to the unit test functions has a number of useful
methods, the most important of which is `done`.

        myTest: function(t) {
            t.done();
        }

### t.done( )

callback that must be called when the test finishes.  If not called, the test
will fail (error out), and the tearDown methods will not be called.

### t.expect( count )

When test function is complete, require that the number of assertions run be
equal to count.  The test will fail if the number of assertions made differs
from the expected assertion count.

TODO: `expect` does not wait any additional time for the test to complete

#### t.ok( condition, [message] )

assert that the condition is truthy, else fail the test.  Also available as
`t.assert()`

#### t.fail( )

Fail the test.  `fail()` is not counted as an assertion, it's an outright
failure.  Failed tests do not have their tearDown methods called.

### t.printf( format, [arg1], [...] )

quick little printf-like output formatter from the
[qprintf](http://npmjs.org/package/qprintf) package.
Interpolates the arguments into the format string and writes them to
process.stdout.  Recognizes more formats than console.log, and is easier to
type.  The intent is to have a tracer call that can run asynchronously and not
add much overhead to the test being timed, in case the test is timing
sensitive (TODO: verify in practice)

printf supports the core set of conversions plus %O for objects.  See the
[qprintf](http://npmjs.org/package/qprintf) Readme for full details.

Examples

        ("%5d", 123)            => "  123"
        ("0x%04x", 123)         => "0x007b"
        ("%10s", "Hello")       => "     Hello"
        ("%-10s", "Hello")      => "Hello     "

### Tester Assertions

The assertions from the [`assert`](http://nodejs.org/api/assert.html) module
are available as `tester` methods.  If the assertion fails, an exception is
thrown that qunit catches and reports as a failed unit test.  The rest of that
test function is omitted, and the next test is run (unless --stop-on-failue
was specified on the command line).  Tests that fail an assertion will
immediately stop, will not run any more assertions, and will not have their
`tearDown` methods called.

All assertions accept an optional message.  If provided, the message will be
included in the assertion diagnostics.  It can be helpful to explain what
failed.  Note that qunit includes both the `assert` failure message and the
user-provided message; `assert` omits its diagnostic showing the failed values
if the user had provided their own message.

#### t.assert( condition, [message] )

assert that the condition is truthy, else fail the test.  Same as `t.ok()`.

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

### Tester Mocks

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

- run each test file in a separate process, for isolation (and to shut down any services)
- add `t.skip()` to document intentionally skipped (not passing, not failed) aka markTestSkipped
- bundle up errors and output all at the end (instead of interleaving)
- gather result rows into json and output with a json-to-text reporter module
- allow multiple before/after/beforeEach/AfterEach
- allow an optional name in before/after/beforeEach/AfterEach
