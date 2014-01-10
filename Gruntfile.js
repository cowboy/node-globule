'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    nodeunit: {
      async: ['test/*.js', '!test/*sync*.js'],
      sync: ['test/*sync*.js'],
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: 'Gruntfile.js',
      lib: ['lib/**/*.js'],
      test: ['test/*.js', '!test/*sync*.js'],
      testsync: ['test/*sync*.js'],
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
      // Test to see if line endings will need to be Windows-ized.
      var normalized = s.replace(/\r\n/g, '\n');
      var unNormalize = normalized !== s;
      s = normalized;
      // I wanted to parse the AST, really. But this is SO MUCH EASIER.
      [
        // Remove entire modules.
        /exports\['(?:Globule|event emitter)'[\s\S]+?\n\};\n+/g,
        // Remove global functions.
        /(\/\/[^\n]+\n)+function sortFilepathsByPattern[\s\S]+?\n\}\n+/g,
        // Remove block comments.
        /\/\*([\s\S]*?)\*\/\n+/g,
        // Rename modules.
        /(^exports\['find)/gm,
        '$1Sync',
        // Rewrite async.series calls.
        /var async = require\('async'\);\n+/,
        /(\s*async\.series\(\[)/g,
        /(\s*(?:\},\n\s+)?function\(next\) \{)/g,
        /(\},\n\s+\], test\.done\);)/g,
        '    test.done();',
        /\s*(next\(\);\n\s+\}\);)/g,
        /(globule\.find)(\([\s\S]+?), function.*?\{/g,
        '  actual = $1Sync$2);',
        /var (?=expected)/g,
        /(\s*)(test\.expect.*)/g,
        '$1$2$1var actual, expected;',
        // Fix indentation.
        /^          /gm,
        '    ',
      ].forEach(function(re, i, arr) {
        if (typeof re === 'string') { return; }
        s = s.replace(re, typeof arr[i + 1] === 'string' ? arr[i + 1] : '');
      });
      s = '// THIS FILE WAS AUTO-GENERATED\n// FROM: ' + src + '\n// PLEASE DO NOT EDIT DIRECTLY */\n\n' + s;
      // Re-Windows-ize line endings.
      if (unNormalize) {
        s = s.replace(/\n/g, '\r\n');
      }
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
