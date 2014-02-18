// THIS FILE WAS AUTO-GENERATED
// FROM: test/mapping_test.js
// PLEASE DO NOT EDIT DIRECTLY */

'use strict';

var globule = require('../lib/globule.js');

exports['findMappingSync'] = {
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
    var actual, expected;
    expected = [
      {dest: 'expand/deep/deep.txt', src: ['expand/deep/deep.txt']},
      {dest: 'expand/deep/deeper/deeper.txt', src: ['expand/deep/deeper/deeper.txt']},
      {dest: 'expand/deep/deeper/deepest/deepest.txt', src: ['expand/deep/deeper/deepest/deepest.txt']},
    ];
    actual = globule.findMappingSync(['expand/**/*.txt']);
    test.deepEqual(actual, expected, 'default options');
    actual = globule.findMappingSync({src: ['expand/**/*.txt']});
    test.deepEqual(actual, expected, 'should also work when specifying src as option.');
    test.done();
  },
  'options.srcBase': function(test) {
    test.expect(2);
    var actual, expected;
    expected = [
      {dest: 'dest/deep.txt', src: ['expand/deep/deep.txt']},
      {dest: 'dest/deeper/deeper.txt', src: ['expand/deep/deeper/deeper.txt']},
      {dest: 'dest/deeper/deepest/deepest.txt', src: ['expand/deep/deeper/deepest/deepest.txt']},
    ];
    actual = globule.findMappingSync(['**/*.txt'], {destBase: 'dest', srcBase: 'expand/deep'});
    test.deepEqual(actual, expected, 'srcBase should be stripped from front of destPath, pre-destBase+destPath join');
    actual = globule.findMappingSync({src: ['**/*.txt'], destBase: 'dest', srcBase: 'expand/deep'});
    test.deepEqual(actual, expected, 'should also work with src as option.');
    test.done();
  },
  'multiple src per dest via rename': function(test) {
    test.expect(1);
    var actual, expected;
    expected = [
      {dest: 'build/all.css', src: ['expand/css/baz.css', 'expand/css/qux.css']},
      {dest: 'build/all.txt', src: ['expand/deep/deep.txt', 'expand/deep/deeper/deeper.txt', 'expand/deep/deeper/deepest/deepest.txt']},
      {dest: 'build/all.js', src: ['expand/js/bar.js', 'expand/js/foo.js']},
    ];
    actual = globule.findMappingSync('**/*.{js,css,txt}', {
      srcBase: 'expand',
      filter: 'isFile',
      rename: function(filepath) {
        return 'build/all.' + filepath.split('.').slice(-1);
      },
    });
    test.deepEqual(actual, expected, 'multiple src files are grouped into a per-dest array when renamed dest is same');
    test.done();
  },
};
