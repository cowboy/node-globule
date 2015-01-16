process.chdir(require('path').resolve(__dirname, '..')); // Run from parent dir

var globule = require('../');

globule.find({
  src: ['*.txt', '!*st.txt', '*.{txt,js}', '*.fail', 'q*.css', '*.css'],
  cwd: 'test/fixtures/expand',
  matchBase: true,
})
.on('match', function(filepath) {
  console.log('Match        %s', filepath);
})
.on('hit', function(data) {
  console.log('Pattern hit  %s', data.pattern);
  console.log('Matches (%d) ', data.matches.length, data.matches);
  console.log('Dupes   (%d) ', data.dupes.length, data.dupes);
  console.log();
})
.on('miss', function(data) {
  console.log('Pattern miss %s\n', data.pattern);
})
.on('end', function(filepaths) {
  console.log('Matches (%d) ', filepaths.length, filepaths);
});
