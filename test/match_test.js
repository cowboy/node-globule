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

var globule = require('../lib/globule.js');

exports['match'] = {
  'empty set': function(test) {
    test.expect(6);
    // Should return empty set if a required argument is missing or an empty set.
    test.deepEqual(globule.match(null, 'foo.js'), [], 'should return empty set.');
    test.deepEqual(globule.match('*.js', null), [], 'should return empty set.');
    test.deepEqual(globule.match([], 'foo.js'), [], 'should return empty set.');
    test.deepEqual(globule.match('*.js', []), [], 'should return empty set.');
    test.deepEqual(globule.match(null, ['foo.js']), [], 'should return empty set.');
    test.deepEqual(globule.match(['*.js'], null), [], 'should return empty set.');
    test.done();
  },
  'basic matching': function(test) {
    test.expect(6);
    test.deepEqual(globule.match('*.js', 'foo.js'), ['foo.js'], 'should match correctly.');
    test.deepEqual(globule.match('*.js', ['foo.js']), ['foo.js'], 'should match correctly.');
    test.deepEqual(globule.match('*.js', ['foo.js', 'bar.css']), ['foo.js'], 'should match correctly.');
    test.deepEqual(globule.match(['*.js', '*.css'], 'foo.js'), ['foo.js'], 'should match correctly.');
    test.deepEqual(globule.match(['*.js', '*.css'], ['foo.js']), ['foo.js'], 'should match correctly.');
    test.deepEqual(globule.match(['*.js', '*.css'], ['foo.js', 'bar.css']), ['foo.js', 'bar.css'], 'should match correctly.');
    test.done();
  },
  'no matches': function(test) {
    test.expect(2);
    test.deepEqual(globule.match('*.js', 'foo.css'), [], 'should fail to match.');
    test.deepEqual(globule.match('*.js', ['foo.css', 'bar.css']), [], 'should fail to match.');
    test.done();
  },
  'unique': function(test) {
    test.expect(2);
    test.deepEqual(globule.match('*.js', ['foo.js', 'foo.js']), ['foo.js'], 'should return a uniqued set.');
    test.deepEqual(globule.match(['*.js', '*.*'], ['foo.js', 'foo.js']), ['foo.js'], 'should return a uniqued set.');
    test.done();
  },
  'flatten': function(test) {
    test.expect(1);
    test.deepEqual(globule.match([['*.js', '*.css'], ['*.*', '*.js']], [['foo.js', ['bar.css']]]),
      ['foo.js', 'bar.css'],
      'should process nested pattern / filepaths arrays correctly.');
    test.done();
  },
  'exclusion': function(test) {
    test.expect(5);
    test.deepEqual(globule.match(['!*.js'], ['foo.js', 'bar.js']), [], 'solitary exclusion should match nothing');
    test.deepEqual(globule.match(['*.js', '!*.js'], ['foo.js', 'bar.js']), [], 'exclusion should cancel match');
    test.deepEqual(globule.match(['*.js', '!f*.js'], ['foo.js', 'bar.js', 'baz.js']),
      ['bar.js', 'baz.js'],
      'partial exclusion should partially cancel match');
    test.deepEqual(globule.match(['*.js', '!*.js', 'b*.js'], ['foo.js', 'bar.js', 'baz.js']),
      ['bar.js', 'baz.js'],
      'inclusion / exclusion order matters');
    test.deepEqual(globule.match(['*.js', '!f*.js', '*.js'], ['foo.js', 'bar.js', 'baz.js']),
      ['bar.js', 'baz.js', 'foo.js'],
      'inclusion / exclusion order matters');
    test.done();
  },
  'options.matchBase': function(test) {
    test.expect(2);
    test.deepEqual(globule.match('*.js', ['foo.js', 'bar', 'baz/xyz.js'], {matchBase: true}),
      ['foo.js', 'baz/xyz.js'],
      'should matchBase (minimatch) when specified.');
    test.deepEqual(globule.match('*.js', ['foo.js', 'bar', 'baz/xyz.js']),
      ['foo.js'],
      'should not matchBase (minimatch) by default.');
    test.done();
  },
};

exports['isMatch'] = {
  'basic matching': function(test) {
    test.expect(6);
    test.ok(globule.isMatch('*.js', 'foo.js'), 'should match correctly.');
    test.ok(globule.isMatch('*.js', ['foo.js']), 'should match correctly.');
    test.ok(globule.isMatch('*.js', ['foo.js', 'bar.css']), 'should match correctly.');
    test.ok(globule.isMatch(['*.js', '*.css'], 'foo.js'), 'should match correctly.');
    test.ok(globule.isMatch(['*.js', '*.css'], ['foo.js']), 'should match correctly.');
    test.ok(globule.isMatch(['*.js', '*.css'], ['foo.js', 'bar.css']), 'should match correctly.');
    test.done();
  },
  'no matches': function(test) {
    test.expect(6);
    test.ok(!globule.isMatch('*.js', 'foo.css'), 'should fail to match.');
    test.ok(!globule.isMatch('*.js', ['foo.css', 'bar.css']), 'should fail to match.');
    test.ok(!globule.isMatch(null, 'foo.css'), 'should fail to match.');
    test.ok(!globule.isMatch('*.js', null), 'should fail to match.');
    test.ok(!globule.isMatch([], 'foo.css'), 'should fail to match.');
    test.ok(!globule.isMatch('*.js', []), 'should fail to match.');
    test.done();
  },
  'options.matchBase': function(test) {
    test.expect(2);
    test.ok(globule.isMatch('*.js', ['baz/xyz.js'], {matchBase: true}), 'should matchBase (minimatch) when specified.');
    test.ok(!globule.isMatch('*.js', ['baz/xyz.js']), 'should not matchBase (minimatch) by default.');
    test.done();
  },
};
