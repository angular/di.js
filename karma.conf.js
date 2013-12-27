// Karma configuration
// Generated on Tue Dec 17 2013 15:03:33 GMT-0800 (PST)

module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '',


    // frameworks to use
    frameworks: ['jasmine', 'traceur', 'requirejs'],


    // list of files / patterns to load in the browser
    files: [
      'test-main.js',

      {pattern: 'src/**/*.js', included: false},
      {pattern: 'test/**/*.js', included: false},
      {pattern: 'example/**/*.js', included: false}
    ],

    preprocessors: {
      'src/**/*.js': ['traceur'],
      'test/**/*.js': ['traceur'],
      'example/**/*.js': ['traceur']
    },

    traceurPreprocessor: {
      options: {
        modules: 'requirejs',
        annotations: true,
        sourceMap: true
      }
    },


    // list of files to exclude
    exclude: [],


    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress'],


    // web server port
    port: 9876,


    // level of logging
    // possible values:
    // - config.LOG_DISABLE
    // - config.LOG_ERROR
    // - config.LOG_WARN
    // - config.LOG_INFO
    // - config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // Start these browsers:
    browsers: ['Chrome'],
  });
};
