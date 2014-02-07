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
    }
  });
});
