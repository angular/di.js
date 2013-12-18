module.exports = function(grunt) {
  grunt.initConfig({
    traceur: {
      main: {
        src: ['src/**/*.js', 'test/**/*.js'],
        dest: 'compiled/'
      },
      options: {
        modules: 'requirejs'
      }
    },

    watch: {
      transpile: {
        files: ['src/**/*.js', 'test/**/*.js'],
        tasks: ['traceur'],
        options: {
          spawn: false,
        },
      }
    }
  });

  // compile only changed file
  grunt.event.on('watch', function(_, filepath) {
    grunt.config('traceur.main.src', filepath);
  });

  // load plugins
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-traceur');
};
