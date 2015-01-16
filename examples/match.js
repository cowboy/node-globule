process.chdir(require('path').resolve(__dirname, '..')); // Run from parent dir

var globule = require('../');

var result;
var filepaths = ['a.js', 'b.css', 'c.js', 'd.css'];

// All filepaths that match *.js
result = globule.match('*.js', filepaths);
console.log(result);

// All filepaths that match *.js or *.css (retaining original order)
result = globule.match('*.{js,css}', filepaths);
console.log(result);

// All filepaths that match *.js or *.css (in pattern order)
result = globule.match(['*.js', '*.css'], filepaths);
console.log(result);


filepaths = ['js/a.js', 'css/b.css', 'js/c.js', 'css/d.css'];

// All *.js files in any subdirectory
result = globule.match('**/*.js', filepaths);
console.log(result);

// All *.js files in any subdirectory, using the "matchBase" option
result = globule.match('*.js', filepaths, {matchBase: true});
console.log(result);


// Do any filepaths match any of the specified patterns?
result = globule.isMatch(['*.fail', '*.whoops'], filepaths);
console.log(result);

// Do any filepaths match any of the specified patterns?
result = globule.isMatch(['*.js', '*.css'], filepaths, {matchBase: true});
console.log(result);
