/**
 * Build file for client code.
 */
var pjson = require('./package.json'),
  clrs = require('colors');

// Signals what version we are running
console.log("Client Code Template ".magenta + "v".yellow + pjson.version.toString().yellow + ".".magenta + " **********************".grey);

var gulp = require('gulp'),
  gutil = require('gulp-util'),
  jshint = require('gulp-jshint'),
  stylish = require('jshint-stylish'),
  concat = require('gulp-concat'),
  gulpif = require('gulp-if'),
  uglify = require('gulp-uglify'),
  saveLicense = require('uglify-save-license'),
  cssmin = require('gulp-cssmin'),
  runSequence = require('run-sequence'),
  sass = require('gulp-sass'),
  prettify = require('gulp-jsbeautifier'),
  fs = require('fs'),
  strftime = require('strftime'),
  rimraf = require('rimraf'),
  beautify = require('js-beautify').js_beautify,
  archiver = require('archiver'),
  notifier = require('node-notifier'),
  minifyHTML = require('gulp-minify-html');

// Set some defaults about what mode we are in
var isProd = false,
  externOverride = null;

// If "production" is passed from the command line then update the defaults
try {
  if (gutil.env._[0].toLowerCase().indexOf('prod') > -1 || gutil.env._[0].toLowerCase().indexOf('push_to') > -1 || gutil.env._[0].toLowerCase().indexOf('push_zip') > -1 || gutil.env._[0].toLowerCase().indexOf('preview') > -1) {
    isProd = true;
    console.log("Assuming prod build ********************")
  }
  if (gutil.env._[0].toLowerCase().indexOf('test_local') > -1) {
    externOverride = process.env.ACS_CLIENTCODE_HOME;
  }
} catch (e) {
}

/**
 * Uglify settings
 * @type {{preserveComments: string}}
 */
var uglifySetts = {
  mangle: {
    except: ['config']
  },
  preserveComments: function (node, comment) {
    if (comment.value.indexOf('@preserve') > -1 || comment.value.indexOf('@license') > -1) {
      return true;
    }
    return false;
  }
};

/**
 * Prettify settings
 * @type {{indentSize: number}}
 */
var prettifySetts = {
  "indentSize": 2
};

/**
 * Build CSS
 */
gulp.task('css', function (cb) {
  gulp.src('./clientcode_src/sass/**/*.scss')
    .pipe(sass().on('error', function () {
      console.log("SASS ERROR: ", arguments)
    }))
    .pipe(cssmin())
    .pipe(gulp.dest('./dist/'));
  if (cb) {
    cb();
  }
});

/**
 * Build assets
 */
gulp.task('assets', function (cb) {
  gulp.src('./clientcode_src/assets/**/*.*')
    .pipe(gulp.dest('./dist/'));
  if (cb) {
    cb();
  }
});

/**
 * Build HTML
 */
gulp.task('html', function (cb) {
  gulp.src('./clientcode_src/html/**/*.html')
    .pipe(minifyHTML())
    .pipe(gulp.dest('./dist/'));
  if (cb) {
    cb();
  }
});

/**
 * Build JS
 */
gulp.task('js', function (cb) {
  gulp.src(['./clientcode_src/js/**/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(concat('code.js'))
    .pipe(gulpif(isProd, uglify(uglifySetts), prettify(prettifySetts)))
    .pipe(gulp.dest('./dist/'));

  if (cb) {
    cb();
  }
});

/**
 * Clean the templates
 */
gulp.task('clean', function (cb) {
  rimraf('dist/**/*', function () {
    if (cb) {
      setTimeout(function () {
        cb();
      }, 150);
    }
  });
});

/**
 * Default task
 */
gulp.task('default', function (cb) {
  runSequence('clean',
    'js', 'css', 'html', 'assets',
    cb);
});

/**
 * Production task. Note: because this task has the word "prod" in it, minification is turned on automatically
 */
gulp.task('prod', ['default']);

/**
 * Signal a notification
 * @param title
 * @param msg
 */
var signal = function (title, msg) {
  notifier.notify({
    'title': title || "Note:",
    'message': msg || ''
  });
};