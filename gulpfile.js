/* eslint-disable strict */
'use strict';

require('shelljs/global');
require('shelljs').config.fatal = true;

const path = require('path');
const respawn = require('respawn');
const program = require('commander');
const runSequence = require('run-sequence');
const gulp = require('gulp');
const gutil = require('gulp-util');
const traceur = require('gulp-traceur');
const plumber = require('gulp-plumber');
const mocha = require('gulp-mocha');
const eslint = require('gulp-eslint');
const cache = require('gulp-cached');
const del = require('del');

program.option('-d, --debug', 'Debug mode on');
program.parse(process.argv);

const paths = {
	src: 'src/**/*.js',
	dist: 'dist',
	srcTest: 'src/test',
	distTest: 'dist/test'
};

function noop () {}

function transpile (src, dest) {
	return gulp.src(src)
		.pipe(plumber())
		.pipe(cache('transpile'))
		.pipe(traceur({
			sourceMaps: 'inline',
			generators: 'parse',
			blockBinding: 'parse',
			numericLiterals: 'parse',
			templateLiterals: 'parse',
			propertyNameShorthand: 'parse',
			propertyMethods: 'parse',
			forOf: 'parse',
			arrayComprehension: true,
			generatorComprehension: true,
			memberVariables: true
		}))
		.pipe(gulp.dest(dest));
}

function lint (src) {
	return gulp.src(src)
		.pipe(cache('lint'))
		.pipe(eslint({
			useEslintrc: true
		}))
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
}

function test (src) {
	return gulp.src(`${src}/**/*.spec.js`, { read: false })
		.pipe(mocha({ bail: true, timeout: 5000 }))
		.on('end', function () {
			global.exit(0);
		});
}

gulp.task('transpile', function () {
	return transpile(paths.src, paths.dist);
});

gulp.task('lint', function () {
	return lint([ paths.src, `${paths.srcTest}/**/*js`, 'gulpfile.js' ]);
});

gulp.task('test', function (done) {
	runSequence([ 'clean:dist' ], 'transpile', function () {
		test(paths.distTest).on('end', done);
	});
});

gulp.task('clean:dist', function (done) {
	del([ paths.dist ], done);
});

gulp.task('default', function (done) {
	const harmonyFlags = [
		'--harmony',
		'--harmony_proxies'
	];

	let command = [ 'node' ];
	Array.prototype.push.apply(command, harmonyFlags);
	command.push('app.js');

	// if debug flag was specified, run node in debug mode
	if (program.debug) {
		command.splice(1, 0, '--debug');
	}

	const monitor = respawn(command, {
		env: process.env,
		cwd: paths.dist,
		maxRestarts: 10,
		sleep: 300,
		stdio: 'inherit'
	});

	runSequence([ 'clean:dist', 'lint' ], 'transpile', function () {
		monitor.start();
		done();
	});

	monitor
		.on('stdout', function (d) {
			console.log(d.toString());
		})
		.on('stderr', function (e) {
			console.error(e.toString());
		});

	function restartMonitor () {
		monitor.stop(monitor.start.bind(monitor));
	}

	gulp.watch([ paths.src, 'gulpfile.js' ], function (ev) {
		gutil.log('File changed: ' + gutil.colors.yellow(ev.path));

		let isLintError = false;

		const fileBasename = path.basename(ev.path);
		const lintStream = lint(paths.src);

		lintStream
			.on('data', noop)
			.on('error', function () {
				isLintError = true;
			})
			.on('end', function () {
				if (isLintError) {
					if (fileBasename === 'gulpfile.js') {
						restartMonitor();
					}

					return;
				}

				transpile(paths.src, paths.dist).on('end', restartMonitor);
			});
	});
});
