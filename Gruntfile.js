'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    nodeunit: {
      tests: ['test/*_test.js'],
      tests_built: ['test/*_test.built.js'],
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: 'Gruntfile.js',
      lib: ['lib/**/*.js'],
      tests: '<%= nodeunit.tests %>',
      tests_built: '<%= nodeunit.tests_built %>',
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile %>',
        tasks: ['jshint:gruntfile']
      },
      lib: {
        files: '<%= jshint.lib %>',
        tasks: ['jshint:lib', 'nodeunit']
      },
      test: {
        files: '<%= jshint.tests %>',
        tasks: ['test']
      },
    },
    build_tests: {
      globule_test: {
        src: 'test/globule_test.js',
        dest: 'test/globule_sync_test.built.js',
        options: {
          rules: [
            // Remove entire modules.
            /exports\['(?:Globule|event emitter)'[\s\S]+?\n\};\n+/g,
            // Remove global functions.
            /(\/\/[^\n]+\n)+function sortFilepathsByPattern[\s\S]+?\n\}\n+/g,
            // Remove block comments.
            /\/\*([\s\S]*?)\*\/\n+/g,
            // Rename modules.
            /(^exports\['find)/gm,
            '$1Sync',
            // Remove unnecessary vars.
            /^var (?:async|sortFilepathsByPattern).*\n/gm,
            // Remove unnecessary tests.
            /  'return value'[\s\S]+?  },\n/g,
            // Rewrite async.series calls.
            /\s*async\.series\(\[/g,
            /\s*(?:\},\n\s+)?function\(next\) \{/g,
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
          ]
        },
      },
    },
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task.
  grunt.registerTask('default', ['test']);

  // Lint, then build tests, then lint the built tests, then run tests.
  grunt.registerTask('test', ['jshint:gruntfile', 'jshint:lib', 'jshint:tests', 'build_tests', 'jshint:tests_built', 'nodeunit']);

  // Build tests.
  grunt.registerMultiTask('build_tests', 'Build sync tests from async tests.', function() {
    var options = this.options({rules: []});
    this.files.forEach(function(f) {
      grunt.log.write('Creating ' + f.dest + '...');
      var s = grunt.file.read(f.src);
      // Test to see if line endings will need to be Windows-ized.
      var normalized = s.replace(/\r\n/g, '\n');
      var unNormalize = normalized !== s;
      s = normalized;
      // I wanted to parse the AST, really. But this is SO MUCH EASIER.
      options.rules.forEach(function(re, i, arr) {
        if (typeof re === 'string') { return; }
        s = s.replace(re, typeof arr[i + 1] === 'string' ? arr[i + 1] : '');
      });
      s = '// THIS FILE WAS AUTO-GENERATED\n// FROM: ' + f.src + '\n// PLEASE DO NOT EDIT DIRECTLY */\n\n' + s;
      // Re-Windows-ize line endings.
      if (unNormalize) {
        s = s.replace(/\n/g, '\r\n');
      }
      try {
        grunt.file.write(f.dest, s);
        grunt.log.ok();
      } catch (err) {
        grunt.log.error();
        throw err;
      }
    });
  });
};
