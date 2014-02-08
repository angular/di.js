beforeEach(function() {
  this.addMatchers({
    toBeInstanceOf: function(expectedClass) {
      // TODO(vojta): support not.toBeInstanceOf
      if (this.isNot) {
        throw new Error('not.toBeInstanceOf is not supported!');
      }

      var actual = this.actual;

      this.message = function() {
        return 'Expected ' + jasmine.pp(actual) + ' to be an instance of ' + jasmine.pp(expectedClass);
      };

      return typeof this.actual === 'object' && this.actual instanceof expectedClass;
    },

    // TODO(vojta): remove this once Jasmine in Karma gets updated
    // https://github.com/pivotal/jasmine/blob/c40b64a24c607596fa7488f2a0ddb98d063c872a/src/core/Matchers.js#L217-L246
    // This toThrow supports RegExps.
    toThrow: function(expected) {
      var result = false;
      var exception, exceptionMessage;
      if (typeof this.actual != 'function') {
        throw new Error('Actual is not a function');
      }
      try {
        this.actual();
      } catch (e) {
        exception = e;
      }

      if (exception) {
        exceptionMessage = exception.message || exception;
        result = (typeof expected === 'undefined' || this.env.equals_(exceptionMessage, expected.message || expected) || (jasmine.isA_("RegExp", expected) && expected.test(exceptionMessage)));
      }

      var not = this.isNot ? "not " : "";
      var regexMatch = jasmine.isA_("RegExp", expected) ? " an exception matching" : "";

      this.message = function() {
        if (exception) {
          return ["Expected function " + not + "to throw" + regexMatch, expected ? expected.message || expected : "an exception", ", but it threw", exceptionMessage].join(' ');
        } else {
          return "Expected function to throw an exception.";
        }
      };

      return result;
    }
  });
});
