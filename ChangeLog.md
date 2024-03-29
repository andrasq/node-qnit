0.32.3
- bump `qmock` to latest 0.17.2 to re-fix disrequire, bump qassert to 1.6.9 to advance past
  mistakenly deprecated version

0.32.2
- bump `qmock` to latest 0.17.1 to fix disrequire under node-v0.6

0.32.1
- bump `qmock` to latest version 0.17.0

0.32.0
- upgrade to qassert 1.6.8 for better throws and value inspection

0.31.0
- fix tests under node-v0.8

0.30.0
- support `it.skip()` (mocha compat)

0.29.1
- fix --fork-files (broken by node-v6)
- fix unit tests under node-v0.8

0.29.0
- better error message annotations
- run the teardown functions `tearDown`, `after`, `afterEach` even after test errors

0.28.1
- upgrade qassert to eliminate assert.ok deprecation warning

0.28.0
- update qmock to 0.16.0 for better mockHttp semantics, req.abort() and req.socket.destroy() mocking
  (breaking: http mocking is no longer auto-installed, and is completely uninstalled on unmock.
  This should allow apps to be tested that make http requests during startup without first
  having to unmock http.  Note that to ensure that all http requests can be mocked, mockHttp()
  should be run before the app is loaded.)

0.27.0
- allow {before,after}{,Each}() and it() to run without callbacks (mocha compat)

0.26.1
- upgrade qmock to hugely speed up worst case unrequire speed

0.26.0
- have test callback methods `done`, `skip` and `fail` be bound functions
- fail test on all thrown errors, even if the error value is falsy or null

0.25.3
- upgrade qmock to latest fixed version

0.25.2
- if no process.hrtime, use Date.now
- print errors returned to t.done() immediately, not just in the summary

0.25.1
- upgrade to qassert 1.6.1 for minor fixes

0.25.0
- upgrade to qassert 1.6.0 for contains(string, regex) support

0.24.0
- new stub.onCall, stub.getCall, stub.yieldsAsync, stub.yieldsAsyncOnce methods (qmock 0.12.0)
- new mockHttp mockRequest() return value (qmock 0.13.1)

0.23.1
- fix mockRequire, mockRequireStub of ./ and ../ relative filepaths (qmock 0.11.2)

0.23.0
- upgrade to qmock 0.11.1 for stub returns/yields/throws etc methods

0.22.1
- fix stubbing a method on a function (qmock 0.10.1)
- fix unrequire() of ./ and ../ relative filepaths (qmock 0.10.2)

0.22.0
- upgrade to qmock 0.10.0 for better stub() and spy() semantics
  (broke stubbing a method on a function)

0.21.2
- use `QMock.unrequire` to not corrupt `module.children` (fixes `t.unrequire()`)

0.21.1
- add missing `mockRequireStub`

0.21.0
- upgrade to qmock 0.9.0 for `mockRequire`

0.20.0
- upgrade to qmock 0.8.0 for mockHttpServer `.on`, `.once` and `.default`.
  Also changes the way urls are assembled from uri components, now using `path`
  not `pathname`, which fixes nodejs compatibility.

0.19.1
- do not stop the test on timeout or setUp errors
- return non-zero exitcode on timeout error

0.19.0
- upgrade to qassert 1.5.0 for multiple `qassert` fixes:
  - fix `assertionCount` to increment on every test type
  - fix `qassert` function to have the same parent object as the other tests
  - fix occasional clipping of last char of error message
  - fix error diagnostic annotation
  - throw the actual failure `Error`
- check for name conflicts when tester inherits qassert methods

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
