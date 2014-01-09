// THIS FILE WAS AUTO-GENERATED
// FROM: test/globule_test.js
// PLEASE DO NOT EDIT DIRECTLY */

'use strict';

// var path = require('path');
// var async = require('async');

var globule = require('../lib/globule.js');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    var actual, expected;
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['find'] = {
  setUp: function(done) {
    this.cwd = process.cwd();
    process.chdir('test/fixtures/expand');
    done();
  },
  tearDown: function(done) {
    process.chdir(this.cwd);
    done();
  },
  'basic matching': function(test) {
    test.expect(5);
    var actual, expected;
    actual = globule.findSync('**/*.js');
    expected = ['js/bar.js', 'js/foo.js'];
    test.deepEqual(actual, expected, 'single pattern argument should match.');
    actual = globule.findSync('**/*.js', '**/*.css');
    expected = ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'];
    test.deepEqual(actual, expected, 'multiple pattern arguments should match.');
    actual = globule.findSync(['**/*.js', '**/*.css']);
    expected = ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'];
    test.deepEqual(actual, expected, 'array of patterns should match.');
    actual = globule.findSync([['**/*.js'], [['**/*.css', 'js/*.js']]]);
    expected = ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'];
    test.deepEqual(actual, expected, 'array of arrays of patterns should be flattened.');
    actual = globule.findSync('*.xyz');
    expected = [];
    test.deepEqual(actual, expected, 'bad pattern should fail to match.');
    test.done();
  },
  'unique': function(test) {
    test.expect(4);
    var actual, expected;
    actual = globule.findSync('**/*.js', 'js/*.js');
    expected = ['js/bar.js', 'js/foo.js'];
    test.deepEqual(actual, expected, 'file list should be uniqed.');
    actual = globule.findSync('**/*.js', '**/*.css', 'js/*.js');
    expected = ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'];
    test.deepEqual(actual, expected, 'file list should be uniqed.');
    actual = globule.findSync('js', 'js/');
    expected = ['js', 'js/'];
    test.deepEqual(actual, expected, 'mixed non-ending-/ and ending-/ dirs will not be uniqed by default.');
    actual = globule.findSync('js', 'js/', {mark: true});
    expected = ['js/'];
    test.deepEqual(actual, expected, 'mixed non-ending-/ and ending-/ dirs will be uniqed when "mark" is specified.');
    test.done();
  },
  'file order': function(test) {
    test.expect(5);
    var actual, expected;
    actual = globule.findSync('**/*.{js,css}');
    expected = ['css/baz.css', 'css/qux.css', 'js/bar.js', 'js/foo.js'];
    test.deepEqual(actual, expected, 'should select 4 files in this order, by default.');
    actual = globule.findSync('js/foo.js', 'js/bar.js', '**/*.{js,css}');
    expected = ['js/foo.js', 'js/bar.js', 'css/baz.css', 'css/qux.css'];
    test.deepEqual(actual, expected, 'specifically-specified-up-front file order should be maintained.');
    actual = globule.findSync('js/bar.js', 'js/foo.js', '**/*.{js,css}');
    expected = ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'];
    test.deepEqual(actual, expected, 'specifically-specified-up-front file order should be maintained.');
    actual = globule.findSync('**/*.{js,css}', '!css/qux.css', 'css/qux.css');
    expected = ['css/baz.css', 'js/bar.js', 'js/foo.js', 'css/qux.css'];
    test.deepEqual(actual, expected, 'if a file is excluded and then re-added, it should be added at the end.');
    actual = globule.findSync('js/foo.js', '**/*.{js,css}', '!css/qux.css', 'css/qux.css');
    expected = ['js/foo.js', 'css/baz.css', 'js/bar.js', 'css/qux.css'];
    test.deepEqual(actual, expected, 'should be able to combine specified-up-front and excluded/added-at-end.');
    test.done();
  },
  'exclusion': function(test) {
    test.expect(8);
    var actual, expected;
    actual = globule.findSync(['!js/*.js']);
    expected = [];
    test.deepEqual(actual, expected, 'solitary exclusion should match nothing');
    actual = globule.findSync(['js/bar.js','!js/bar.js']);
    expected = [];
    test.deepEqual(actual, expected, 'exclusion should negate match');
    actual = globule.findSync(['**/*.js', '!js/foo.js']);
    expected = ['js/bar.js'];
    test.deepEqual(actual, expected, 'should omit single file from matched set');
    actual = globule.findSync(['!js/foo.js', '**/*.js']);
    expected = ['js/bar.js', 'js/foo.js'];
    test.deepEqual(actual, expected, 'inclusion / exclusion order matters');
    actual = globule.findSync(['**/*.js', '!js/bar.js', '**/*.css', '!css/baz.css', 'js/foo.js']);
    expected = ['js/foo.js','css/qux.css'];
    test.deepEqual(actual, expected, 'multiple exclusions should be removed from the set');
    actual = globule.findSync(['**/*.js', '**/*.css', '!**/*.css']);
    expected = ['js/bar.js', 'js/foo.js'];
    test.deepEqual(actual, expected, 'excluded wildcards should be removed from the matched set');
    actual = globule.findSync(['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css', '!**/b*.*']);
    expected = ['js/foo.js', 'css/qux.css'];
    test.deepEqual(actual, expected, 'different pattern for exclusion should still work');
    actual = globule.findSync(['js/bar.js', '!**/b*.*', 'js/foo.js', 'css/baz.css', 'css/qux.css']);
    expected = ['js/foo.js', 'css/baz.css', 'css/qux.css'];
    test.deepEqual(actual, expected, 'inclusion / exclusion order matters');
    test.done();
  },
  'options.src': function(test) {
    test.expect(4);
    var actual, expected;
    actual = globule.findSync({src: '**/*.js'});
    expected = ['js/bar.js', 'js/foo.js'];
    test.deepEqual(actual, expected, 'single pattern argument should match.');
    actual = globule.findSync({src: ['**/*.js', '**/*.css']});
    expected = ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'];
    test.deepEqual(actual, expected, 'array of patterns should match.');
    actual = globule.findSync({src: [['**/*.js'], [['**/*.css', 'js/*.js']]]});
    expected = ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'];
    test.deepEqual(actual, expected, 'array of arrays of patterns should be flattened.');
    actual = globule.findSync({src: '*.xyz'});
    expected = [];
    test.deepEqual(actual, expected, 'bad pattern should fail to match.');
    test.done();
  },
  'options.mark': function(test) {
    test.expect(4);
    var actual, expected;
    actual = globule.findSync('**d*/**');
    expected = [
      'deep',
      'deep/deep.txt',
      'deep/deeper',
      'deep/deeper/deeper.txt',
      'deep/deeper/deepest',
      'deep/deeper/deepest/deepest.txt',
    ];
    test.deepEqual(actual, expected, 'should match files and directories.');
    actual = globule.findSync('**d*/**/');
    expected = [
      'deep/',
      'deep/deeper/',
      'deep/deeper/deepest/',
    ];
    test.deepEqual(actual, expected, 'trailing / in pattern should match directories only, matches end in /.');
    actual = globule.findSync('**d*/**', {mark: true});
    expected = [
      'deep/',
      'deep/deep.txt',
      'deep/deeper/',
      'deep/deeper/deeper.txt',
      'deep/deeper/deepest/',
      'deep/deeper/deepest/deepest.txt',
    ];
    test.deepEqual(actual, expected, 'the minimatch "mark" option ensures directories end in /.');
    actual = globule.findSync('**d*/**/', {mark: true});
    expected = [
      'deep/',
      'deep/deeper/',
      'deep/deeper/deepest/',
    ];
    test.deepEqual(actual, expected, 'the minimatch "mark" option should not remove trailing / from matched paths.');
    test.done();
  },
  'options.filter': function(test) {
    test.expect(5);
    var actual, expected;
    actual = globule.findSync('**d*/**', {filter: 'isFile'});
    expected = [
      'deep/deep.txt',
      'deep/deeper/deeper.txt',
      'deep/deeper/deepest/deepest.txt',
    ];
    test.deepEqual(actual, expected, 'should match files only.');
    actual = globule.findSync('**d*/**', {filter: 'isDirectory'});
    expected = [
      'deep',
      'deep/deeper',
      'deep/deeper/deepest',
    ];
    test.deepEqual(actual, expected, 'should match directories only.');
    actual = globule.findSync('**', {
    arbitraryProp: /deepest/,
    filter: function(filepath, options) {
      return options.arbitraryProp.test(filepath);
    }
        });
    expected = [
      'deep/deeper/deepest',
      'deep/deeper/deepest/deepest.txt',
    ];
    test.deepEqual(actual, expected, 'should filter arbitrarily.');
    actual = globule.findSync('js', 'css', {filter: 'isFile'});
    expected = [];
    test.deepEqual(actual, expected, 'should fail to match.');
    actual = globule.findSync('**/*.js', {filter: 'isDirectory'});
    expected = [];
    test.deepEqual(actual, expected, 'should fail to match.');
    test.done();
  },
  'options.matchBase': function(test) {
    test.expect(3);
    var actual, expected;
    actual = globule.findSync('*.js');
    expected = [];
    test.deepEqual(actual, expected, 'should not matchBase (minimatch) by default.');
    actual = globule.findSync('*.js', {matchBase: true});
    expected = ['js/bar.js', 'js/foo.js'];
    test.deepEqual(actual, expected, 'matchBase option should be passed through to minimatch.');
    actual = globule.findSync('*.js', '*.css', {matchBase: true});
    expected = ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'];
    test.deepEqual(actual, expected, 'matchBase option should be passed through to minimatch.');
    test.done();
  },
  'options.srcBase': function(test) {
    test.expect(5);
    var actual, expected;
    actual = globule.findSync(['**/deep*.txt'], {srcBase: 'deep'});
    expected = ['deep.txt', 'deeper/deeper.txt', 'deeper/deepest/deepest.txt'];
    test.deepEqual(actual, expected, 'should find paths matching pattern relative to srcBase.');
    actual = globule.findSync(['**/deep*.txt'], {cwd: 'deep'});
    expected = ['deep.txt', 'deeper/deeper.txt', 'deeper/deepest/deepest.txt'];
    test.deepEqual(actual, expected, 'cwd and srcBase should do the same thing.');
    actual = globule.findSync(['**/deep*'], {srcBase: 'deep', filter: 'isFile'});
    expected = ['deep.txt', 'deeper/deeper.txt', 'deeper/deepest/deepest.txt'];
    test.deepEqual(actual, expected, 'srcBase should not prevent filtering.');
    actual = globule.findSync(['**/deep*'], {srcBase: 'deep', filter: 'isDirectory'});
    expected = ['deeper', 'deeper/deepest'];
    test.deepEqual(actual, expected, 'srcBase should not prevent filtering.');
    actual = globule.findSync(['**/deep*.txt', '!**/deeper**'], {srcBase: 'deep'});
    expected = ['deep.txt', 'deeper/deepest/deepest.txt'];
    test.deepEqual(actual, expected, 'srcBase should not prevent exclusions.');
    test.done();
  },
  'options.prefixBase': function(test) {
    test.expect(2);
    var actual, expected;
    actual = globule.findSync(['**/deep*.txt'], {srcBase: 'deep', prefixBase: false});
    expected = ['deep.txt', 'deeper/deeper.txt', 'deeper/deepest/deepest.txt'];
    test.deepEqual(actual, expected, 'should not prefix srcBase to returned paths.');
    actual = globule.findSync(['**/deep*.txt'], {srcBase: 'deep', prefixBase: true});
    expected = ['deep/deep.txt', 'deep/deeper/deeper.txt', 'deep/deeper/deepest/deepest.txt'];
    test.deepEqual(actual, expected, 'should prefix srcBase to returned paths.');
    test.done();
  },
  'options.nonull': function(test) {
    test.expect(3);
    var actual, expected;
    actual = globule.findSync(['*omg*'], {nonull: true});
    expected = ['*omg*'];
    test.deepEqual(actual, expected, 'non-matching patterns should be returned in result set.');
    actual = globule.findSync(['js/a*', 'js/b*', 'js/c*'], {nonull: true});
    expected = ['js/a*', 'js/bar.js', 'js/c*'];
    test.deepEqual(actual, expected, 'non-matching patterns should be returned in result set.');
    actual = globule.findSync(['js/foo.js', 'js/bar.js', 'js/nonexistent.js'], {nonull: true});
    expected = ['js/foo.js', 'js/bar.js', 'js/nonexistent.js'];
    test.deepEqual(actual, expected, 'non-matching filenames should be returned in result set.');
    test.done();
  },
};
