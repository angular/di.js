module.exports = function(grunt) {
  grunt.initConfig({
    traceur: {
      main: {
        src: ['src/**/*.js', 'test/**/*.js'],
        dest: 'compiled/'
      },
      dist_cjs: {
        src: ['src/**/*.js'],
        dest: 'dist/cjs/',
        options: {
          modules: 'nodejs'
        }
      },
      dist_amd: {
        src: ['src/**/*.js'],
        dest: 'dist/amd/',
      },
      example_cjs: {
        src: ['example/**/*.js'],
        dest: 'cjs/',
        options: {
          modules: 'nodejs'
        }
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
    },

    connect: {
      server: {
        options: {
          port: 8000,
          keepalive: true,
          open: true
        }
      }
    }
  });

  // compile only changed file
  grunt.event.on('watch', function(_, filepath, target) {
    grunt.config('traceur.' + target + '.src', filepath);
  });

  // aliases
  grunt.registerTask('serve', 'Run a connect webserver', ['connect:server']);

  // load plugins
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-traceur');
};
