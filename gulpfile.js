'use strict';

const build = require('@microsoft/sp-build-web');
build.addSuppression(`Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`);
build.addSuppression(`Warning - [sass] src/webparts/enexAntiDrogas/components/tailwind.scss: filename should end with module.sass or module.scss`);

var getTasks = build.rig.getTasks;
build.rig.getTasks = function () {
  var result = getTasks.call(build.rig);
  result.set('serve', result.get('serve-deprecated'));
  return result;
};

const postcss = require('gulp-postcss');
const tailwindcss = require('tailwindcss');

const tailwindTask = build.subTask('tailwindcss', function (gulp, buildOptions, done) {
  gulp.src('src/tailwind.css')
    .pipe(postcss([
      tailwindcss('./tailwind.config.js'),
      require('autoprefixer')
    ]))
    .pipe(require('gulp-rename')('tailwind.scss'))
    .pipe(gulp.dest('assets/'));
  done();
});
build.rig.addPreBuildTask(tailwindTask);

build.initialize(require('gulp'));
