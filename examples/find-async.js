process.chdir(require('path').resolve(__dirname, '..')); // Run from parent dir

var globule = require('../');

globule.find({
  src: ['*.js'],
  srcBase: 'lib',
}, function(err, filepaths) {
  console.log(filepaths);
});
