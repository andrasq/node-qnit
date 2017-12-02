0.18.4
- upgrade to qassert 1.5.0 for multiple `qassert` fixes:
  - fix `assertionCount` to increment on every test type
  - fix `qassert` function to have the same parent object as the other tests
  - fix occasional clipping of last char of error message
  - fix error diagnostic annotation
  - throw the actual failure `Error`
- be more careful when tester inherits qassert methods

0.18.3
- run each text on the next setImmediate event tick, to return back to the function
  that called `t.done()` and allow it to clean up before the next test runs.
  Affects eg `t.stubOnce` when the t.done() is called from inside the stub.
- throw a fatal Exception on teardown errors, like on setup errors

0.18.2
- upgrade to qmock 0.6.6 to allow mockTimers to clear null timers

0.18.1
- upgrade to qmock-0.6.5 and qgetopt-1.0.2

0.18.0
- upgrade to qassert 1.4.0 for notContains, notStrictContains

0.17.1
- make the callback optional in before, beforeEach, after, afterEach (mocha compat)
- upgrade to qmock 0.6.4 for improved mockHttp server

0.17.0
- upgrade to `qassert` 1.3.0 for inorder

0.16.2
- upgrade to `qmock` 0.6.3 for getMock fixes

0.16.1
- upgrade to `qmock` 0.6.2 for stubOnce, spyOnce

0.16.0
- upgrade to `qmock` 0.6.1 for more functional mockHttp() fixes
- rename internal files to `qnit`
- remove references to `qunit`

0.15.3
- upgrade to `qmock` 0.5.5 for older node version fixes

0.15.2
- upgrade to `qassert` 1.2.0 for working `contains()`

0.15.1
- fix exitcode on failure

0.15.0
- upgrade to qmock 0.5.0 for `stubOnce()` / `spyOnce()`
- breaking change: `stub()` stubs with a noop function if no replacement method
  is specified, instead of spying.  This fixes `stub` to work more intuitively.

0.14.5
- upgrade to qmock 0.3.1 for mockHttpServer bugfixes (experimental)
- expose `qmock`, `qassert` and `qprintf` as properties on `qnit`
- rename ChangeLog to ChangeLog.md to apply formatting

0.14.4
- use qgetopt from the package, not deps

0.14.3
- upgrade to the faster latest qprintf

0.14.2 2017-03-02
- fix sample scripts in readme so they run

0.14.1 2017-02-26
- upgrade to qmock 0.3.1 for mockHttp experimental code fixes

0.14.0 2017-02-25
- qmock 0.3.0 for stub, spy, mockTimers, mockHttp

0.13.0 2016-10-05

- qprintf 0.8.1
- qassert 1.1.0, moved assertions into own package
- new assertions within() and contains()

0.12.0  2016-04-12

- -s --slow command-line option for cleaner test run diffs

0.11.0

- always call the teardown methods, even in case of error
- `t.skip()`
- include test and file counts along in summary line
- include error count in summary line

0.10.0

- read config settings from qnit.conf in the test directory
- `--config` option
- `--no-recurse` option

0.9.0

- support multiple before(), after(), beforeEach() and afterEach() calls in each describe()
- allow an optional name in any of it, describe, before, after, beforeEach or afterEach
- fix mocha test error propagation
- --fork-files option
- --filter option (sometimes needs --fork-files)
- upgrade to qprintf-0.4.1 for speedup and improved %f conversion

0.8.0

- renamed the package and the executable `qnit`
- upgrade to the faster aflow-0.10.0

0.7.1

- print error message if stack not available

0.7.0

- fix printed ifError() notice (include err.message)
- allow any qprintf >= 0.1.4 (to better share dependencies)

0.6.3

- make all tests see settings set by stacked before calls; 0.6.3
- update to qprintf 0.1.4

0.6.0

- -r, --require switch
- moved qprintf into its own package

0.5.0

- introduce %A printf conversion
- before, after, beforeEach, afterEach mocha compat methods
- -t, --timeout switch
- mocha compatibility

0.4.3

- doc: nodeunit & mocha writeups
- %O field width control
- fix: t.fail() now accepts a message like all other assertions

0.4.0

- --bail mocha compat switch
- --version switch
- printf field width flags
- sprintf method
- 2-sec timeout for test to call done()

0.3.0

- t.expect() checks assertion count

0.2.3

- sub-millisecond timesetamps
- nested hierarchical setUp / tearDown
- bold filenames on stdout output

0.2.0

- move test running logic out of bin/qunit into lib/qunit.js
- add all assertions from assert module

0.1.1

- QMock integration (as a dependency)
- better error handling
- aflow now a dependency

0.1.0

- initial checkin
