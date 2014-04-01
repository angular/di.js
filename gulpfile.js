var gulp = require('gulp');
var pipe = require('pipe/gulp');
var traceur = require('gulp-traceur');
var connect = require('gulp-connect');


var path = {
  src: './src/**/*.js',
  // we have to skip example/node (because of the cyclic symlink)
  examples: './example/!(node)/**/*.js',
  pkg: './package.json'
};


// TRANSPILE ES6
gulp.task('build_source_amd', function() {
  gulp.src(path.src)
      .pipe(traceur(pipe.traceur()))
      .pipe(gulp.dest('dist/amd'));
});

gulp.task('build_source_cjs', function() {
  gulp.src(path.src)
      .pipe(traceur(pipe.traceur({modules: 'commonjs'})))
      .pipe(gulp.dest('dist/cjs'));
});

gulp.task('build_examples', function() {
  gulp.src(path.examples)
      .pipe(traceur(pipe.traceur()))
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
  root: [__dirname],
  port: 8000,
  open: {
    browser: 'Google Chrome'
  }
}));




// This is a super nasty, hacked release task.
// TODO(vojta): fix gulp-git and clean this up
var git = require('gulp-git');
var through = require('through2');
var exec = require('child_process').exec;

var VERSION_REGEXP = /([\'|\"]?version[\'|\"]?[ ]*:[ ]*[\'|\"]?)([\d||A-a|.|-]*)([\'|\"]?)/i;
gulp.task('release', ['build_dist'], function() {
  var incrementedVersion;

  // increment version
  gulp.src(path.pkg)
    .pipe(through.obj(function(file, _, done) {
      var incrementedVersion;
      var content = file.contents.toString().replace(VERSION_REGEXP, function(_, prefix, parsedVersion, suffix) {
        incrementedVersion = parsedVersion.replace(/pre-(\d+)/, function(_, number) {
          return 'pre-' + (parseInt(number, 10) + 1);
        });

        return prefix + incrementedVersion + suffix;
      });

    // TODO(vojta): we should rather create a new file object
    file.contents = new Buffer(content);
    file.meta = {
      incrementedVersion: incrementedVersion
    };

    this.push(file);
    done();
  }))
  .pipe(gulp.dest('.'))
  .pipe(git.commit('chore(release): <%= incrementedVersion %>'))
  .on('commit_done', function() {
    git.push('upstream', 'master');
    exec('npm publish --tag v2', function() {
      exec('npm tag di@0.0.1 latest');
    });
  });
});
