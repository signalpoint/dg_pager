var makeBinary = true;

var gulp = require('gulp'),
    watch = require('gulp-watch'),
    gp_concat = require('gulp-concat'),
    gp_rename = require('gulp-rename'),
    gp_uglify = require('gulp-uglify'),
    gp_minify_css = require('gulp-minify-css');

var jsSrc = [
  './src/_dg_pager.js',
  './src/classes/class.*.js',
  './src/includes/include.*.js',
  './src/widgets/widget.*.js'
];

// Minify JavaScript
function minifyJs() {
  console.log('compressing dg_pager.js...');
  var js = gulp.src(jsSrc)
    .pipe(gp_concat('dg_pager.js'))
    .pipe(gulp.dest('./'));
  if (makeBinary) {
    console.log('compressing dg_pager.min.js...');
    return js.pipe(gp_rename('dg_pager.min.js'))
    .pipe(gp_uglify())
    .pipe(gulp.dest('./'));
  }
  return js;
}
gulp.task(minifyJs);

gulp.task('default', function(done) {

  gulp.watch(jsSrc, gulp.series('minifyJs'));

  done();

});
