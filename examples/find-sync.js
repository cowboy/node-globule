process.chdir(require('path').resolve(__dirname, '..')); // Run from parent dir

var globule = require('../');

var filepaths;

filepaths = globule.findSync({
  src: ['*.js', '!*path*'], // patterns to match/exclude, in-order
  srcBase: 'lib',           // from (and including) this path
  matchBase: true,          // patterns without slashes match like **
});
console.log(filepaths);

// Src can also be specified as an array up-front:
filepaths = globule.findSync(['*.js', '!*path*'], {
  srcBase: 'lib',
  matchBase: true,
});
console.log(filepaths);

// Or as individual arguments up-front.
filepaths = globule.findSync('*.js', '!*path*', {
  srcBase: 'lib',
  matchBase: true,
});
console.log(filepaths);
