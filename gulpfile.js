var gulp = require('gulp');
var traceur = require('gulp-traceur');
var connect = require('gulp-connect');

var TRACEUR_OPTIONS = {modules: 'amd', types: true, annotations: true};
var TRACEUR_CJS_OPTIONS = {modules: 'cjs', types: true, annotations: true};

var path = {
  src: './src/**/*.js',
  // we have to skip example/node (because of the cyclic symlink)
  examples: './example/!(node)/*.js'
};


// TRANSPILE ES6
gulp.task('build_source_amd', function() {
  gulp.src(path.src)
      .pipe(traceur(TRACEUR_OPTIONS))
      .pipe(gulp.dest('dist/amd'));
});

gulp.task('build_source_cjs', function() {
  gulp.src(path.src)
      .pipe(traceur(TRACEUR_CJS_OPTIONS))
      .pipe(gulp.dest('dist/cjs'));
});

gulp.task('build_examples', function() {
  gulp.src(path.examples)
      .pipe(traceur(TRACEUR_OPTIONS))
      .pipe(gulp.dest('compiled/example'));
});

gulp.task('build_dist', ['build_source_cjs', 'build_source_amd']);
gulp.task('build', ['build_dist', 'build_examples']);


// WATCH FILES FOR CHANGES
gulp.task('watch', function() {
  gulp.watch(path.src, ['build']);
});


// WEB SERVER
gulp.task('serve', connect.server({
  root: __dirname,
  port: 8000,
  open: {
    browser: 'Google Chrome'
  }
}));
