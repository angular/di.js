# Mocking Classes

It's useful to mock classes for unit testing, to prevent unwanted side effects
of tests. For example, it would be a bad practice to use the browser's
XMLHttpRequest object in HTTP tests, because tests would be slow and
indeterministic.

DI supports mocking classes in tests in these steps:

 * Create the real module, e.g. `src/Window.js` with a `$Window` class.
 * Create the mock module, e.g. `test/mocks/Window.js`, with a `$MockWindow`
    class and use the @Provide annotation to indicate that the class can provide
    a `$Window`.
 * Create a consumer for the module, e.g. `src/httpBackend.js` and use `@Inject`
    annotation to inject the constructed `$Window` class into the $HttpBackend
    class.
 * Create a unit test, which instantiates the injector with the proper
    dependencies.


## Example

In `src/Window.js`:

```javascript
/**
 * A class to abstract the native window object, to be constructed and injected
 * by DI.
 */
class $Window {
  constructor () {
    /**
     * Attach the XMLHttpRequest, so a mock version can be used from the
     * $MockWindow class.
     */
    this.XMLHttpRequest = window.XMLHttpRequest;
  }
  somemethod () {}
}

/**
 * Make the $Window class importable in other modules.
 */
export {$Window};
```

Implement the real `$Window` inside of `HttpBackend`.
In `src/HttpBackend.js`:

```javascript
/**
 * Import the Inject class to inject the $Window class into the HttpBackend
 * constructor.
 */
import {Inject} from '../node_modules/di/src/annotations';
/**
 * Import the $Window class so DI knows exactly which class we intend to inject.
 */
import {$Window} from '../src/Window';

/**
 * Use the @Inject annotation to tell DI to inject the $Window class into the
 * HttpBackend constructor.
 */
@Inject($Window)
class HttpBackend {
  /**
   * Constructor is given a constructed $Window instance as its only argument.
   */
  constructor($window) {
    this.xhr = new $window.XMLHttpRequest();
  }

  open(method, url) {
    this.xhr.open(method, url);
  }
}

/**
 * Make HttpBackend available for import
 */
export {HttpBackend};
```

In `test/mocks/Window.js`:

```javascript
/**
 * Import Provide from DI so we can tell it we're providing an alternate
 * implementation of $Window.
 */
import {Provide} from '../../node_modules/di/src/annotations';
/*
 * Import $Window so we can tell provide specifically which class we're
 * mocking.
 */
import {$Window} from '../../src/Window';

/**
 * Use @Provide annotation to say the following class will provide an alternate
 * implementation of the specified class
 */
@Provide($Window)
class $MockWindow {
  constructor() {
    /**
     * Provide a dummy function for XHR.
     * In reality, this should be a more sophisticated constructor that would
     * allow mimicking the behavior of XHR.
     */
    this.XMLHttpRequest = function () {};
  }
}

/**
 * Export $MockWindow so it can be imported in other modules, such as tests.
 */
export {$MockWindow};
```

To test HttpBackend, we want to use a mock window service with a mock XHR
constructor.

In `test/HttpBackend.spec.js`:

```javascript
/**
 * Import the HttpBackend class, the class being tested in this suite of tests.
 */
import {HttpBackend} from '../src/httpBackend';
/**
 * Import the DI Injector class, of which we'll manually create an instance in
 * order to provide the mock implementation of $Window.
 */
import {Injector} from '../node_modules/di/src/injector';
/**
 * Import the $MockWindow class so we can provide it to the Injector.
 */
import {$MockWindow} from './mocks/Window';

describe('HttpBackend', function () {
  it('should construct', function () {
    /**
     * Create an instance of the Injector, giving it the classes it needs for
     * this test.
     * Since the $MockWindow class used the @Provide annotation to say it can
     * provide an implementation of $Window, the Injector will automatically
     * use the $MockWindow implementation when the @Inject annotation specifies
     * $Window in HttpBackend.
     */
    var injector = new Injector([$MockWindow, HttpBackend]);
    var httpBackend = injector.get(HttpBackend);
    expect(httpBackend).toBeInstanceOf(HttpBackend);
    expect(new HttpBackend(injector.get($MockWindow))).toBeInstanceOf(HttpBackend);
    /**
     * httpBackend.open() should throw because it calls xhr.open(), where xhr
     * is an instance of an empty function, resuling in a TypeError when calling
     * xhr.open.
     */
    expect(function () {
      httpBackend.open('get', 'foo')
    }).toThrow();
  });
});


```