'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    nodeunit: {
      files: ['test/**/*_test.js'],
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: 'Gruntfile.js',
      lib: ['lib/**/*.js'],
      test: ['test/*.js', '!test/*sync*'],
      testsync: ['test/*sync*'],
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib: {
        files: '<%= jshint.lib.src %>',
        tasks: ['jshint:lib', 'nodeunit']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['test']
      },
    },
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task.
  grunt.registerTask('default', ['test']);

  // Lint, then build sync tests, then
  grunt.registerTask('test', ['jshint:gruntfile', 'jshint:lib', 'jshint:test', 'build-sync-tests', 'jshint:testsync', 'nodeunit']);

  grunt.registerTask('build-sync-tests', 'Build sync tests from async tests.', function() {
    grunt.file.expand('test/*.js', '!test/*sync*').forEach(function(src) {
      var dest = src.replace(/(_test)/, '_sync$1');
      grunt.log.write('Creating ' + dest + '...');
      var s = grunt.file.read(src);
      // I wanted to parse the AST, really. But this is SO MUCH EASIER.
      [
        [
          /(var async = require\('async'\);)/,
          '// $1'
        ],
        /(\s*async\.series\(\[)/g,
        /(\s*(?:\},\n\s+)?function\(next\) \{)/g,
        [
          /(\},\n\s+\], test\.done\);)/g,
          '    test.done();'
        ],
        /\s*(next\(\);\n\s+\}\);)/g,
        [
          /(globule\.find)(\([\s\S]+?), function.*?\{/g,
          '  actual = $1Sync$2);'
        ],
        [
          /(^exports\['find)/gm,
          '$1Sync'
        ],
        /var (?=expected)/g,
        [
          /(\s*)(test\.expect.*)/g,
          '$1$2$1var actual, expected;'
        ],
        [
          /^          /gm,
          '    '
        ]
      ].forEach(function(a) {
        if (!Array.isArray(a)) { a = [a, '']; }
        s = s.replace(a[0], a[1]);
      });
      s = '// THIS FILE WAS AUTO-GENERATED\n// FROM: ' + src + '\n// PLEASE DO NOT EDIT DIRECTLY */\n\n' + s;
      try {
        grunt.file.write(dest, s);
        grunt.log.ok();
      } catch (err) {
        grunt.log.error();
        throw err;
      }
    });
  });
};
