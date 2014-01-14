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
      async_to_sync: {
        expand: true,
        src: 'test/{globule,mapping}_test.js',
        rename: function(destpath, srcpath) {
          return srcpath.replace(/(.+)(_test)(\.js)/, '$1_sync$2.built$3');
        },
        options: {
          rules: [
            // Remove unnecessary modules.
            /exports\['mapping[\s\S]+?};\n+/g,
            // Remove block comments.
            /\/\*([\s\S]*?)\*\/\n+/g,
            // Remove unnecessary vars.
            /^var async.*\n/gm,
            // Remove unnecessary tests.
            /  'return value'[\s\S]+?  },\n/g,
            // Rename modules.
            /(^exports\['[^']+)/gm,
            '$1Sync',
            // Initialize vars.
            /(\s*)(test\.expect.*)/g,
            '$1$2$1var actual, expected;',
            /var (?=expected)/g,
            // Rewrite async.series calls.
            /\s*async\.series\(\[/g,
            /\], test\.done\);/g,
            'test.done();',
            // Remove function(next) { ... } wrappers and re-indent.
            /(\s+)function\(next\) \{\n([\s\S]+?\n)\1},\n/g,
            function(_, indent, body) {
              return body.replace(new RegExp('^' + indent, 'gm'), '  ');
            },
            // Rewrite async function calls to sync and re-indent.
            /([^\n\S]+)(globule\.(?:find|findMapping))(\([\s\S]+?), function\(err, actual\) \{\n([\s\S]+?)\s+next\(\);\n\s+\}\);\n/g,
            function(_, indent, fn, args, body) {
              return indent + 'actual = ' + fn + 'Sync' + args + ');\n' +
                body.replace(new RegExp('^' + indent, 'gm'), '  ') + '\n';
            },
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
        if (!(re instanceof RegExp)) { return; }
        s = s.replace(re, arr[i + 1] instanceof RegExp ? '' : arr[i + 1]);
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
