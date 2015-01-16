process.chdir(require('path').resolve(__dirname, '..')); // Run from parent dir

var globule = require('../');

var mapping;

// Compare results using the "cwd" option:
mapping = globule.findMappingSync({
  src: ['*.js'],
  cwd: 'lib',
  destBase: 'out',
});
console.log('\nfindMappingSync (cwd option)');
console.log(mapping);

// With results using "srcBase" option (probably most useful):
mapping = globule.findMappingSync({
  src: ['*.js'],
  srcBase: 'lib',
  destBase: 'out',
});
console.log('\nfindMappingSync (srcBase option)');
console.log(mapping);

// Note that .findMapping / .findMappingSync handle the "srcBase" option in
// a "smart" way. If you use .find / .findSync and .mapping separately with
// the "srcBase" option, that value will be prefixed twice (whoops)
var filepaths = globule.findSync({
  src: ['*.js'],
  srcBase: 'lib',
});

mapping = globule.mapping({
  src: filepaths,
  destBase: 'out',
  srcBase: 'lib',
});
console.log('\nfindSync then mapping (srcBase option)');
console.log(mapping);
