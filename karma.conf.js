var sharedConfig = require('pipe/karma');

module.exports = function(config) {
  sharedConfig(config);

  config.set({
    // list of files / patterns to load in the browser
    files: [
      'test-main.js',

      {pattern: 'src/**/*.js', included: false},
      {pattern: 'test/**/*.js', included: false},
      {pattern: 'example/coffee/*.js', included: false},
      {pattern: 'example/testing/*.js', included: false},
      {pattern: 'node_modules/es6-shim/es6-shim.js', included: false},
      {pattern: 'node_modules/rtts-assert/src/**/*.js', included: false}
    ],

    preprocessors: {
      'src/**/*.js': ['traceur'],
      'test/**/*.js': ['traceur'],
      'example/**/*.js': ['traceur'],
      'node_modules/rtts-assert/src/**/*.js': ['traceur']
    }
  });

  config.sauceLabs.testName = 'di.js';
};
