'use strict';

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
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

var async = require('async');
var globule = require('../lib/globule.js');

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
  'return value': function(test) {
    test.expect(2);
    var g;
    g = globule.find('**/*');
    test.ok(g instanceof globule.Globule, 'Async search should return the Globule instance.');
    g = globule.find('**/*', {sync: true});
    test.ok(Array.isArray(g), 'Sync search should return an array.');
    test.done();
  },
  'basic matching': function(test) {
    test.expect(6);
    async.series([
      function(next) {
        globule.find('**/*.js', function(err, actual) {
          var expected = ['js/bar.js', 'js/foo.js'];
          test.deepEqual(actual, expected, 'single pattern argument should match.');
          next();
        });
      },
      function(next) {
        globule.find('**/*.js', '**/*.css', function(err, actual) {
          var expected = ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'];
          test.deepEqual(actual, expected, 'multiple pattern arguments should match.');
          next();
        });
      },
      function(next) {
        globule.find(['**/*.js', '**/*.css'], function(err, actual) {
          var expected = ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'];
          test.deepEqual(actual, expected, 'array of patterns should match.');
          next();
        });
      },
      function(next) {
        globule.find({src: ['**/*.js', '**/*.css']}, function(err, actual) {
          var expected = ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'];
          test.deepEqual(actual, expected, 'src option should match.');
          next();
        });
      },
      function(next) {
        globule.find([['**/*.js'], [['**/*.css', 'js/*.js']]], function(err, actual) {
          var expected = ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'];
          test.deepEqual(actual, expected, 'array of arrays of patterns should be flattened.');
          next();
        });
      },
      function(next) {
        globule.find('*.xyz', function(err, actual) {
          var expected = [];
          test.deepEqual(actual, expected, 'bad pattern should fail to match.');
          next();
        });
      },
    ], test.done);
  },
  'unique': function(test) {
    test.expect(4);
    async.series([
      function(next) {
        globule.find('**/*.js', 'js/*.js', function(err, actual) {
          var expected = ['js/bar.js', 'js/foo.js'];
          test.deepEqual(actual, expected, 'file list should be uniqed.');
          next();
        });
      },
      function(next) {
        globule.find('**/*.js', '**/*.css', 'js/*.js', function(err, actual) {
          var expected = ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'];
          test.deepEqual(actual, expected, 'file list should be uniqed.');
          next();
        });
      },
      function(next) {
        globule.find('js', 'js/', function(err, actual) {
          var expected = ['js', 'js/'];
          test.deepEqual(actual, expected, 'mixed non-ending-/ and ending-/ dirs will not be uniqed by default.');
          next();
        });
      },
      function(next) {
        globule.find('js', 'js/', {mark: true}, function(err, actual) {
          var expected = ['js/'];
          test.deepEqual(actual, expected, 'mixed non-ending-/ and ending-/ dirs will be uniqed when "mark" is specified.');
          next();
        });
      },
    ], test.done);
  },
  'file order': function(test) {
    test.expect(5);
    async.series([
      function(next) {
        globule.find('**/*.{js,css}', function(err, actual) {
          var expected = ['css/baz.css', 'css/qux.css', 'js/bar.js', 'js/foo.js'];
          test.deepEqual(actual, expected, 'should select 4 files in this order, by default.');
          next();
        });
      },
      function(next) {
        globule.find('js/foo.js', 'js/bar.js', '**/*.{js,css}', function(err, actual) {
          var expected = ['js/foo.js', 'js/bar.js', 'css/baz.css', 'css/qux.css'];
          test.deepEqual(actual, expected, 'specifically-specified-up-front file order should be maintained.');
          next();
        });
      },
      function(next) {
        globule.find('js/bar.js', 'js/foo.js', '**/*.{js,css}', function(err, actual) {
          var expected = ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'];
          test.deepEqual(actual, expected, 'specifically-specified-up-front file order should be maintained.');
          next();
        });
      },
      function(next) {
        globule.find('**/*.{js,css}', '!css/qux.css', 'css/qux.css', function(err, actual) {
          var expected = ['css/baz.css', 'js/bar.js', 'js/foo.js', 'css/qux.css'];
          test.deepEqual(actual, expected, 'if a file is excluded and then re-added, it should be added at the end.');
          next();
        });
      },
      function(next) {
        globule.find('js/foo.js', '**/*.{js,css}', '!css/qux.css', 'css/qux.css', function(err, actual) {
          var expected = ['js/foo.js', 'css/baz.css', 'js/bar.js', 'css/qux.css'];
          test.deepEqual(actual, expected, 'should be able to combine specified-up-front and excluded/added-at-end.');
          next();
        });
      },
    ], test.done);
  },
  'exclusion': function(test) {
    test.expect(8);
    async.series([
      function(next) {
        globule.find(['!js/*.js'], function(err, actual) {
          var expected = [];
          test.deepEqual(actual, expected, 'solitary exclusion should match nothing');
          next();
        });
      },
      function(next) {
        globule.find(['js/bar.js','!js/bar.js'], function(err, actual) {
          var expected = [];
          test.deepEqual(actual, expected, 'exclusion should negate match');
          next();
        });
      },
      function(next) {
        globule.find(['**/*.js', '!js/foo.js'], function(err, actual) {
          var expected = ['js/bar.js'];
          test.deepEqual(actual, expected, 'should omit single file from matched set');
          next();
        });
      },
      function(next) {
        globule.find(['!js/foo.js', '**/*.js'], function(err, actual) {
          var expected = ['js/bar.js', 'js/foo.js'];
          test.deepEqual(actual, expected, 'inclusion / exclusion order matters');
          next();
        });
      },
      function(next) {
        globule.find(['**/*.js', '!js/bar.js', '**/*.css', '!css/baz.css', 'js/foo.js'], function(err, actual) {
          var expected = ['js/foo.js','css/qux.css'];
          test.deepEqual(actual, expected, 'multiple exclusions should be removed from the set');
          next();
        });
      },
      function(next) {
        globule.find(['**/*.js', '**/*.css', '!**/*.css'], function(err, actual) {
          var expected = ['js/bar.js', 'js/foo.js'];
          test.deepEqual(actual, expected, 'excluded wildcards should be removed from the matched set');
          next();
        });
      },
      function(next) {
        globule.find(['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css', '!**/b*.*'], function(err, actual) {
          var expected = ['js/foo.js', 'css/qux.css'];
          test.deepEqual(actual, expected, 'different pattern for exclusion should still work');
          next();
        });
      },
      function(next) {
        globule.find(['js/bar.js', '!**/b*.*', 'js/foo.js', 'css/baz.css', 'css/qux.css'], function(err, actual) {
          var expected = ['js/foo.js', 'css/baz.css', 'css/qux.css'];
          test.deepEqual(actual, expected, 'inclusion / exclusion order matters');
          next();
        });
      },
    ], test.done);
  },
  'options.src': function(test) {
    test.expect(4);
    async.series([
      function(next) {
        globule.find({src: '**/*.js'}, function(err, actual) {
          var expected = ['js/bar.js', 'js/foo.js'];
          test.deepEqual(actual, expected, 'single pattern argument should match.');
          next();
        });
      },
      function(next) {
        globule.find({src: ['**/*.js', '**/*.css']}, function(err, actual) {
          var expected = ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'];
          test.deepEqual(actual, expected, 'array of patterns should match.');
          next();
        });
      },
      function(next) {
        globule.find({src: [['**/*.js'], [['**/*.css', 'js/*.js']]]}, function(err, actual) {
          var expected = ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'];
          test.deepEqual(actual, expected, 'array of arrays of patterns should be flattened.');
          next();
        });
      },
      function(next) {
        globule.find({src: '*.xyz'}, function(err, actual) {
          var expected = [];
          test.deepEqual(actual, expected, 'bad pattern should fail to match.');
          next();
        });
      },
    ], test.done);
  },
  'options.mark': function(test) {
    test.expect(4);
    async.series([
      function(next) {
        globule.find('**d*/**', function(err, actual) {
          var expected = [
            'deep',
            'deep/deep.txt',
            'deep/deeper',
            'deep/deeper/deeper.txt',
            'deep/deeper/deepest',
            'deep/deeper/deepest/deepest.txt',
          ];
          test.deepEqual(actual, expected, 'should match files and directories.');
          next();
        });
      },
      function(next) {
        globule.find('**d*/**/', function(err, actual) {
          var expected = [
            'deep/',
            'deep/deeper/',
            'deep/deeper/deepest/',
          ];
          test.deepEqual(actual, expected, 'trailing / in pattern should match directories only, matches end in /.');
          next();
        });
      },
      function(next) {
        globule.find('**d*/**', {mark: true}, function(err, actual) {
          var expected = [
            'deep/',
            'deep/deep.txt',
            'deep/deeper/',
            'deep/deeper/deeper.txt',
            'deep/deeper/deepest/',
            'deep/deeper/deepest/deepest.txt',
          ];
          test.deepEqual(actual, expected, 'the minimatch "mark" option ensures directories end in /.');
          next();
        });
      },
      function(next) {
        globule.find('**d*/**/', {mark: true}, function(err, actual) {
          var expected = [
            'deep/',
            'deep/deeper/',
            'deep/deeper/deepest/',
          ];
          test.deepEqual(actual, expected, 'the minimatch "mark" option should not remove trailing / from matched paths.');
          next();
        });
      },
    ], test.done);
  },
  'options.filter': function(test) {
    test.expect(5);
    async.series([
      function(next) {
        globule.find('**d*/**', {filter: 'isFile'}, function(err, actual) {
          var expected = [
            'deep/deep.txt',
            'deep/deeper/deeper.txt',
            'deep/deeper/deepest/deepest.txt',
          ];
          test.deepEqual(actual, expected, 'should match files only.');
          next();
        });
      },
      function(next) {
        globule.find('**d*/**', {filter: 'isDirectory'}, function(err, actual) {
          var expected = [
            'deep',
            'deep/deeper',
            'deep/deeper/deepest',
          ];
          test.deepEqual(actual, expected, 'should match directories only.');
          next();
        });
      },
      function(next) {
        globule.find('**', {
          arbitraryProp: /deepest/,
          filter: function(filepath, options) {
            return options.arbitraryProp.test(filepath);
          }
        }, function(err, actual) {
          var expected = [
            'deep/deeper/deepest',
            'deep/deeper/deepest/deepest.txt',
          ];
          test.deepEqual(actual, expected, 'should filter arbitrarily.');
          next();
        });
      },
      function(next) {
        globule.find('js', 'css', {filter: 'isFile'}, function(err, actual) {
          var expected = [];
          test.deepEqual(actual, expected, 'should fail to match.');
          next();
        });
      },
      function(next) {
        globule.find('**/*.js', {filter: 'isDirectory'}, function(err, actual) {
          var expected = [];
          test.deepEqual(actual, expected, 'should fail to match.');
          next();
        });
      },
    ], test.done);
  },
  'options.matchBase': function(test) {
    test.expect(4);
    async.series([
      function(next) {
        globule.find('*.js', function(err, actual) {
          var expected = [];
          test.deepEqual(actual, expected, 'should not matchBase (minimatch) by default.');
          next();
        });
      },
      function(next) {
        globule.find('*.js', {matchBase: true}, function(err, actual) {
          var expected = ['js/bar.js', 'js/foo.js'];
          test.deepEqual(actual, expected, 'matchBase option should work with inclusions.');
          next();
        });
      },
      function(next) {
        globule.find('*.js', '*.css', {matchBase: true}, function(err, actual) {
          var expected = ['js/bar.js', 'js/foo.js', 'css/baz.css', 'css/qux.css'];
          test.deepEqual(actual, expected, 'matchBase option should work with multiple inclusions.');
          next();
        });
      },
      function(next) {
        globule.find('*.*', '!*.{css,txt,md}', {matchBase: true}, function(err, actual) {
          var expected = ['js/bar.js', 'js/foo.js'];
          test.deepEqual(actual, expected, 'matchBase option should work with exclusions.');
          next();
        });
      },
    ], test.done);
  },
  'options.srcBase': function(test) {
    test.expect(5);
    async.series([
      function(next) {
        globule.find(['**/deep*.txt'], {srcBase: 'deep'}, function(err, actual) {
          var expected = ['deep.txt', 'deeper/deeper.txt', 'deeper/deepest/deepest.txt'];
          test.deepEqual(actual, expected, 'should find paths matching pattern relative to srcBase.');
          next();
        });
      },
      function(next) {
        globule.find(['**/deep*.txt'], {cwd: 'deep'}, function(err, actual) {
          var expected = ['deep.txt', 'deeper/deeper.txt', 'deeper/deepest/deepest.txt'];
          test.deepEqual(actual, expected, 'cwd and srcBase should do the same thing.');
          next();
        });
      },
      function(next) {
        globule.find(['**/deep*'], {srcBase: 'deep', filter: 'isFile'}, function(err, actual) {
          var expected = ['deep.txt', 'deeper/deeper.txt', 'deeper/deepest/deepest.txt'];
          test.deepEqual(actual, expected, 'srcBase should not prevent filtering.');
          next();
        });
      },
      function(next) {
        globule.find(['**/deep*'], {srcBase: 'deep', filter: 'isDirectory'}, function(err, actual) {
          var expected = ['deeper', 'deeper/deepest'];
          test.deepEqual(actual, expected, 'srcBase should not prevent filtering.');
          next();
        });
      },
      function(next) {
        globule.find(['**/deep*.txt', '!**/deeper**'], {srcBase: 'deep'}, function(err, actual) {
          var expected = ['deep.txt', 'deeper/deepest/deepest.txt'];
          test.deepEqual(actual, expected, 'srcBase should not prevent exclusions.');
          next();
        });
      },
    ], test.done);
  },
  'options.prefixBase': function(test) {
    test.expect(2);
    async.series([
      function(next) {
        globule.find(['**/deep*.txt'], {srcBase: 'deep', prefixBase: false}, function(err, actual) {
          var expected = ['deep.txt', 'deeper/deeper.txt', 'deeper/deepest/deepest.txt'];
          test.deepEqual(actual, expected, 'should not prefix srcBase to returned paths.');
          next();
        });
      },
      function(next) {
        globule.find(['**/deep*.txt'], {srcBase: 'deep', prefixBase: true}, function(err, actual) {
          var expected = ['deep/deep.txt', 'deep/deeper/deeper.txt', 'deep/deeper/deepest/deepest.txt'];
          test.deepEqual(actual, expected, 'should prefix srcBase to returned paths.');
          next();
        });
      },
    ], test.done);
  },
  'options.nonull': function(test) {
    test.expect(3);
    async.series([
      function(next) {
        globule.find(['*omg*'], {nonull: true}, function(err, actual) {
          var expected = ['*omg*'];
          test.deepEqual(actual, expected, 'non-matching patterns should be returned in result set.');
          next();
        });
      },
      function(next) {
        globule.find(['js/a*', 'js/b*', 'js/c*'], {nonull: true}, function(err, actual) {
          var expected = ['js/a*', 'js/bar.js', 'js/c*'];
          test.deepEqual(actual, expected, 'non-matching patterns should be returned in result set.');
          next();
        });
      },
      function(next) {
        globule.find(['js/foo.js', 'js/bar.js', 'js/nonexistent.js'], {nonull: true}, function(err, actual) {
          var expected = ['js/foo.js', 'js/bar.js', 'js/nonexistent.js'];
          test.deepEqual(actual, expected, 'non-matching filenames should be returned in result set.');
          next();
        });
      },
    ], test.done);
  },
};
