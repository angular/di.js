beforeEach(function() {
  jasmine.addMatchers({
    toBeInstanceOf: function() {
      return {
        compare: function(actual, expectedClass) {
          var pass = typeof actual === 'object' && actual instanceof expectedClass;

          return {
            pass: pass,
            get message() {
              if (pass) {
                // TODO(vojta): support not.toBeInstanceOf
                throw new Error('not.toBeInstanceOf is not supported!');
              }

              return 'Expected ' + actual + ' to be an instance of ' + expectedClass;
            }
          };
        }
      };
    }
  });
});
