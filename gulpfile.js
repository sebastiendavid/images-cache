'use strict';
var _ = require('lodash');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var connectLivereload = require('connect-livereload');
var del = require('del');
var express = require('express');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var http = require('http');
var initServer = require('./server/index.server.js');
var istanbul = require('gulp-istanbul');
var jshint = require('gulp-jshint');
var less = require('gulp-less');
var livereload = require('gulp-livereload');
var minifyCSS = require('gulp-minify-css');
var mocha = require('gulp-mocha');
var morgan = require('morgan');
var openInBrowser = require('gulp-open');
var portscanner = require('portscanner');
var q = require('q');
var serveStatic = require('serve-static');
var source = require('vinyl-source-stream');
var stylish = require('jshint-stylish');
var uglify = require('gulp-uglify');
var yargs = require('yargs').argv;
var zip = require('gulp-zip');

var minify = !!yargs.minify;
var coverage = !!yargs.coverage;
var browser = !!yargs.browser;
var color = true;
var server;
var port;

var handleError = function (err) {
    console.error(err.message);
    this.emit('end');
};

gulp.task('server', ['connect']);
gulp.task('build', ['less', 'browserify', 'html']);

gulp.task('connect', ['find:port', 'watch'], function () {
    var app = express()
        .use(morgan('dev'))
        .use(connectLivereload())
        .use(serveStatic('bower_components'))
        .use(serveStatic('dist'));
    initServer(app);
    server = http.createServer(app).listen(port);
    console.info('server is listening to ' + port);
});

gulp.task('find:port', ['server:stop'], function () {
    if (!_.isNumber(port) || port < 1) {
        var deferred = q.defer();
        portscanner.findAPortNotInUse(8000, 8999, '127.0.0.1', function (error, found) {
            if (error) {
                deferred.reject(error);
            } else {
                console.info('port found: ' + found);
                port = found;
                deferred.resolve();
            }
        });
        return deferred.promise;
    }
});

gulp.task('server:stop', function () {
    if (server && _.isFunction(server.close)) {
        var deferred = q.defer();
        console.info('server is closing');
        server.close(function () {
            console.info('server is closed');
            deferred.resolve();
        });
        return deferred.promise;
    }
});

gulp.task('watch', ['build'], function () {
    var timer;
    var lrl = function () {
        if (timer) {
            clearTimeout(timer);
        }
        timer = _.delay(function () {
            livereload.changed();
            timer = null;
        }, 800);
    };

    livereload.listen();

    gulp.watch('src/index.html', ['html']);
    gulp.watch('src/**/*.js', ['browserify']);
    gulp.watch('src/**/*.less', ['less']);

    gulp.watch('dist/index.html').on('change', lrl);
    gulp.watch('dist/js/**/*.js').on('change', lrl);
    gulp.watch('dist/css/**/*.css').on('change', lrl);
});

gulp.task('html', function () {
    return gulp.src('src/index.html')
        .pipe(gulp.dest('dist'));
});

gulp.task('browserify', function () {
    return browserify('./src/index.js', {
            standalone: 'sda.imagesCache'
        })
        .bundle()
        .on('error', handleError)
        .pipe(source('index.js'))
        .pipe(buffer())
        .pipe(gulpif(minify, uglify()))
        .pipe(gulp.dest('./dist/js'));
});

gulp.task('less', function () {
    gulp.src('src/index.less')
        .pipe(less({
            paths: ['bower_components']
        }))
        .on('error', handleError)
        .pipe(gulpif(minify, minifyCSS()))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('clean', function () {
    var deferred = q.defer();
    del(['dist'], function () {
        deferred.resolve();
    });
    return deferred.promise;
});

gulp.task('zip', ['build'], function () {
    return gulp.src([
            'dist/index.html',
            'dist/js/**/*.js',
            'dist/css/**/*.css',
        ], {
            base: 'dist'
        })
        .pipe(zip('images-cache.zip'))
        .pipe(gulp.dest('dist'));
});

gulp.task('test', function () {
    return gulp.src(['./src/**/*.js'])
        .pipe(gulpif(coverage, istanbul()))
        .on('finish', function () {
            return gulp.src('./test/**/*.spec.js', {
                read: false
            })
                .pipe(mocha({
                    reporter: color ? 'spec' : 'tap'
                }))
                .pipe(gulpif(coverage, istanbul.writeReports({
                    dir: './dist/coverage'
                })))
                .on('finish', function () {
                    return gulp.src('./dist/coverage/lcov-report/index.html')
                        .pipe(gulpif(
                            coverage && browser,
                            openInBrowser('file://' + __dirname + '/dist/coverage/lcov-report/index.html')
                        ));
                });
        });
});

gulp.task('lint', function () {
    return gulp.src(['./src/**/*.js', './src/test/**/*.js', './gulpfile.js'])
        .pipe(jshint())
        .pipe(jshint.reporter(color ? stylish : 'default'))
        .pipe(jshint.reporter('fail'));
});
