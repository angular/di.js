module.exports = function(grunt) {
  grunt.initConfig({
    traceur: {
      main: {
        src: ['src/**/*.js', 'test/**/*.js'],
        dest: 'compiled/'
      },
      example: {
        src: ['example/**/*.js'],
        dest: 'compiled/'
      },
      options: {
        modules: 'requirejs',
        annotations: true
      }
    },

    watch: {
      main: {
        files: ['src/**/*.js', 'test/**/*.js'],
        tasks: ['traceur:main']
      },
      example: {
        files: ['example/**/*.js'],
        tasks: ['traceur:example']
      },
      options: {
        spawn: false
      }
    }
  });

  // compile only changed file
  grunt.event.on('watch', function(_, filepath, target) {
    grunt.config('traceur.' + target + '.src', filepath);
  });

  // load plugins
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-traceur');
};
