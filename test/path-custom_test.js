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

var _path = require('path');
var path = require('../lib/path-custom.js');

exports['path'] = {
  'inherits': function(test) {
    test.expect(1);
    test.equal(path.normalize, _path.normalize, 'Non-overridden methods should be inherited.');
    test.done();
  },
  'unixslashes': function(test) {
    test.expect(5);
    test.equal(path.unixslashes('\\'), '/', 'Convert backslashes to / slashes.');
    test.equal(path.unixslashes('a\\b'), 'a/b', 'Convert backslashes to / slashes.');
    test.equal(path.unixslashes('\\\\'), '//', 'Convert backslashes to / slashes.');
    test.equal(path.unixslashes('\\/\\/\\'), '/////', 'Convert backslashes to / slashes.');
    test.equal(path.unixslashes('\\a\\b\\c'), '/a/b/c', 'Convert backslashes to / slashes.');
    test.done();
  },
  'custom join': function(test) {
    test.expect(4);
    test.equal(path.join('a/b'), 'a/b', 'All slashes should be / slashes.');
    test.equal(path.join('a\\b'), 'a/b', 'All slashes should be / slashes.');
    test.equal(path.join('a\\b', 'c\\d'), 'a/b/c/d', 'All slashes should be / slashes.');
    test.equal(path.join('a\\b/c\\d'), 'a/b/c/d', 'All slashes should be / slashes.');
    test.done();
  },
};
