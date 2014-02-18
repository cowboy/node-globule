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

exports['mapping'] = {
  'same-to-same mappings (default options)': function(test) {
    test.expect(4);
    var actual;
    var expected = [
      {dest: 'a.txt', src: ['a.txt']},
      {dest: 'b.txt', src: ['b.txt']},
      {dest: 'c.txt', src: ['c.txt']},
    ];
    actual = globule.mapping(['a.txt', 'b.txt', 'c.txt']);
    test.deepEqual(actual, expected, 'array of patterns should work.');
    actual = globule.mapping([['a.txt', ['b.txt', 'c.txt']]]);
    test.deepEqual(actual, expected, 'nested arrays should be flattened.');
    actual = globule.mapping('a.txt', 'b.txt', 'c.txt');
    test.deepEqual(actual, expected, 'multiple pattern arguments should work.');
    actual = globule.mapping({src: ['a.txt', 'b.txt', 'c.txt']});
    test.deepEqual(actual, expected, 'src option should work.');
    test.done();
  },
  'options.srcBase': function(test) {
    test.expect(3);
    var actual, expected;
    actual = globule.mapping(['a.txt', 'bar/b.txt', 'bar/baz/c.txt'], {srcBase: 'foo'});
    expected = [
      {dest: 'a.txt', src: ['foo/a.txt']},
      {dest: 'bar/b.txt', src: ['foo/bar/b.txt']},
      {dest: 'bar/baz/c.txt', src: ['foo/bar/baz/c.txt']},
    ];
    test.deepEqual(actual, expected, 'srcBase should be prefixed to src paths (no trailing /).');

    actual = globule.mapping(['a.txt', 'bar/b.txt', 'bar/baz/c.txt'], {srcBase: 'foo/'});
    test.deepEqual(actual, expected, 'srcBase should be prefixed to src paths (trailing /).');

    actual = globule.mapping({src: ['a.txt', 'bar/b.txt', 'bar/baz/c.txt'], srcBase: 'foo/'});
    test.deepEqual(actual, expected, 'should also work when specifying src as option.');

    test.done();
  },
  'options.destBase': function(test) {
    test.expect(2);
    var actual, expected;

    actual = globule.mapping(['a.txt', 'bar/b.txt', 'bar/baz/c.txt'], {destBase: 'dest'});
    expected = [
      {dest: 'dest/a.txt', src: ['a.txt']},
      {dest: 'dest/bar/b.txt', src: ['bar/b.txt']},
      {dest: 'dest/bar/baz/c.txt', src: ['bar/baz/c.txt']},
    ];
    test.deepEqual(actual, expected, 'destBase should be prefixed to dest paths (no trailing /).');

    actual = globule.mapping(['a.txt', 'bar/b.txt', 'bar/baz/c.txt'], {destBase: 'dest/'});
    test.deepEqual(actual, expected, 'destBase should be prefixed to dest paths (trailing /).');

    test.done();
  },
  'options.flatten': function(test) {
    test.expect(1);
    var actual, expected;

    actual = globule.mapping(['a.txt', 'bar/b.txt', 'bar/baz/c.txt'], {flatten: true});
    expected = [
      {dest: 'a.txt', src: ['a.txt']},
      {dest: 'b.txt', src: ['bar/b.txt']},
      {dest: 'c.txt', src: ['bar/baz/c.txt']},
    ];
    test.deepEqual(actual, expected, 'flatten should remove all src path parts from dest.');

    test.done();
  },
  'options.flatten + options.destBase': function(test) {
    test.expect(1);
    var actual, expected;

    actual = globule.mapping(['a.txt', 'bar/b.txt', 'bar/baz/c.txt'], {destBase: 'dest', flatten: true});
    expected = [
      {dest: 'dest/a.txt', src: ['a.txt']},
      {dest: 'dest/b.txt', src: ['bar/b.txt']},
      {dest: 'dest/c.txt', src: ['bar/baz/c.txt']},
    ];
    test.deepEqual(actual, expected, 'flatten and destBase should work together.');

    test.done();
  },
  'options.ext': function(test) {
    test.expect(1);
    var actual, expected;

    actual = globule.mapping(['x/a.js', 'x.y/b.min.js', 'x.y/z.z/c'], {ext: '.foo'});
    expected = [
      {dest: 'x/a.foo', src: ['x/a.js']},
      {dest: 'x.y/b.foo', src: ['x.y/b.min.js']},
      {dest: 'x.y/z.z/c.foo', src: ['x.y/z.z/c']},
    ];
    test.deepEqual(actual, expected, 'by default, ext should replace everything after the first dot in the filename.');

    test.done();
  },
  'options.extDot': function(test) {
    test.expect(2);
    var actual, expected;

    actual = globule.mapping(['x/a.js', 'x.y/b.bbb.min.js', 'x.y/z.z/c'], {ext: '.foo', extDot: 'first'});
    expected = [
      {dest: 'x/a.foo', src: ['x/a.js']},
      {dest: 'x.y/b.foo', src: ['x.y/b.bbb.min.js']},
      {dest: 'x.y/z.z/c.foo', src: ['x.y/z.z/c']},
    ];
    test.deepEqual(actual, expected, 'extDot of "first" should replace everything after the first dot in the filename.');

    actual = globule.mapping(['x/a.js', 'x.y/b.bbb.min.js', 'x.y/z.z/c'], {ext: '.foo', extDot: 'last'});
    expected = [
      {dest: 'x/a.foo', src: ['x/a.js']},
      {dest: 'x.y/b.bbb.min.foo', src: ['x.y/b.bbb.min.js']},
      {dest: 'x.y/z.z/c.foo', src: ['x.y/z.z/c']},
    ];
    test.deepEqual(actual, expected, 'extDot of "last" should replace everything after the last dot in the filename.');

    test.done();
  },
  'options.rename (dest)': function(test) {
    test.expect(1);
    var actual, expected;
    actual = globule.mapping(['a.txt', 'bar/b.txt', 'bar/baz/c.txt'], {
      srcBase: 'in/',
      notDestBase: 'out/',
      rename: function(filepath, options) {
        return options.notDestBase + filepath;
      },
    });
    expected = [
      {src: ['in/a.txt'], dest: 'out/a.txt'},
      {src: ['in/bar/b.txt'], dest: 'out/bar/b.txt'},
      {src: ['in/bar/baz/c.txt'], dest: 'out/bar/baz/c.txt'},
    ];
    test.deepEqual(actual, expected, 'returned string is dest, srcBase should be prepended because rename fn returns dest only.');

    test.done();
  },
  'options.rename (src string + dest)': function(test) {
    test.expect(1);
    var actual, expected;
    actual = globule.mapping(['a.txt', 'bar/b.txt', 'bar/baz/c.txt'], {
      srcBase: 'in/',
      notDestBase: 'out/',
      rename: function(filepath, options) {
        return {
          src: filepath,
          dest: options.notDestBase + filepath,
        };
      },
    });
    expected = [
      {src: ['a.txt'], dest: 'out/a.txt'},
      {src: ['bar/b.txt'], dest: 'out/bar/b.txt'},
      {src: ['bar/baz/c.txt'], dest: 'out/bar/baz/c.txt'},
    ];
    test.deepEqual(actual, expected, 'returned src + dest, srcBase should be ignored because rename fn returns src.');

    test.done();
  },
  'options.rename (src array + dest)': function(test) {
    test.expect(1);
    var actual, expected;
    actual = globule.mapping(['a.txt', 'bar/b.txt', 'bar/baz/c.txt'], {
      srcBase: 'in/',
      arbitraryProp: 'out/',
      rename: function(filepath, options) {
        return {
          src: ['header.txt', filepath],
          dest: options.arbitraryProp + filepath,
        };
      },
    });
    expected = [
      {src: ['header.txt', 'a.txt'], dest: 'out/a.txt'},
      {src: ['header.txt', 'bar/b.txt'], dest: 'out/bar/b.txt'},
      {src: ['header.txt', 'bar/baz/c.txt'], dest: 'out/bar/baz/c.txt'},
    ];
    test.deepEqual(actual, expected, 'returned src array + dest, srcBase should be ignored because rename fn returns src.');

    test.done();
  },
};

exports['findMapping'] = {
  setUp: function(done) {
    this.cwd = process.cwd();
    process.chdir('test/fixtures');
    done();
  },
  tearDown: function(done) {
    process.chdir(this.cwd);
    done();
  },
  'basic matching': function(test) {
    test.expect(2);
    var expected = [
      {dest: 'expand/deep/deep.txt', src: ['expand/deep/deep.txt']},
      {dest: 'expand/deep/deeper/deeper.txt', src: ['expand/deep/deeper/deeper.txt']},
      {dest: 'expand/deep/deeper/deepest/deepest.txt', src: ['expand/deep/deeper/deepest/deepest.txt']},
    ];
    async.series([
      function(next) {
        globule.findMapping(['expand/**/*.txt'], function(err, actual) {
          test.deepEqual(actual, expected, 'default options');
          next();
        });
      },
      function(next) {
        globule.findMapping({src: ['expand/**/*.txt']}, function(err, actual) {
          test.deepEqual(actual, expected, 'should also work when specifying src as option.');
          next();
        });
      },
    ], test.done);
  },
  'options.srcBase': function(test) {
    test.expect(2);
    var expected = [
      {dest: 'dest/deep.txt', src: ['expand/deep/deep.txt']},
      {dest: 'dest/deeper/deeper.txt', src: ['expand/deep/deeper/deeper.txt']},
      {dest: 'dest/deeper/deepest/deepest.txt', src: ['expand/deep/deeper/deepest/deepest.txt']},
    ];
    async.series([
      function(next) {
        globule.findMapping(['**/*.txt'], {destBase: 'dest', srcBase: 'expand/deep'}, function(err, actual) {
          test.deepEqual(actual, expected, 'srcBase should be stripped from front of destPath, pre-destBase+destPath join');
          next();
        });
      },
      function(next) {
        globule.findMapping({src: ['**/*.txt'], destBase: 'dest', srcBase: 'expand/deep'}, function(err, actual) {
          test.deepEqual(actual, expected, 'should also work with src as option.');
          next();
        });
      },
    ], test.done);
  },
  'multiple src per dest via rename': function(test) {
    test.expect(1);
    var expected = [
      {dest: 'build/all.css', src: ['expand/css/baz.css', 'expand/css/qux.css']},
      {dest: 'build/all.txt', src: ['expand/deep/deep.txt', 'expand/deep/deeper/deeper.txt', 'expand/deep/deeper/deepest/deepest.txt']},
      {dest: 'build/all.js', src: ['expand/js/bar.js', 'expand/js/foo.js']},
    ];
    async.series([
      function(next) {
        globule.findMapping('**/*.{js,css,txt}', {
          srcBase: 'expand',
          filter: 'isFile',
          rename: function(dest) {
            return 'build/all.' + dest.split('.').slice(-1);
          },
        }, function(err, actual) {
          test.deepEqual(actual, expected, 'multiple src files are grouped into a per-dest array when renamed dest is same');
          next();
        });
      },
    ], test.done);
  },
};
