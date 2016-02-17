# Examples
## [1-find-sync.js](examples/1-find-sync.js)

```js
var globule = require('globule');

var results;

results = globule.findSync({
  src: ['*.js', '!*path*'],   // patterns to match/exclude, in-order
  srcBase: 'lib',            // from (and including) this path
  matchBase: true,            // patterns without slashes match like **
});

console.log(results);

// Src can also be specified as an argument up-front:
results = globule.findSync(['*.js', '!*path*'], {
  srcBase: 'lib',
  matchBase: true,
});

console.log(results);

// Or as individual arguments up-front.
results = globule.findSync('*.js', '!*path*', {
  srcBase: 'lib',
  matchBase: true,
});

console.log(results);
```

#### 1-find-sync.js output

```
[ 'lib/ctor.js', 'lib/globule.js', 'lib/helpers.js' ]
[ 'lib/ctor.js', 'lib/globule.js', 'lib/helpers.js' ]
[ 'lib/ctor.js', 'lib/globule.js', 'lib/helpers.js' ]
```
## [2-find-async.js](examples/2-find-async.js)

```js
var globule = require('globule');

globule.find({
  src: ['*.js'],
  srcBase: 'lib',
}, function(err, results) {
  console.log(results);
});
```

#### 2-find-async.js output

```
[ 'lib/ctor.js',
  'lib/globule.js',
  'lib/helpers.js',
  'lib/path-custom.js' ]
```
## [3-find-mapping.js](examples/3-find-mapping.js)

```js
var globule = require('globule');

var results;

// Compare results using the "cwd" option:
results = globule.findMappingSync({
  src: ['*.js'],
  cwd: 'lib',
  destBase: 'out',
});

console.log(results);

// With results using "srcBase" option:
results = globule.findMappingSync({
  src: ['*.js'],
  srcBase: 'lib',
  destBase: 'out',
});

console.log(results);

// Note that .findMapping / .findMappingSync handle the "srcBase" option in
// a "smart" way. If you use .find / .findSync and .mapping separately with
// the "srcBase" option, that value will be prefixed twice (whoops)
var filepaths = globule.findSync({
  src: ['*.js'],
  srcBase: 'lib',
});

results = globule.mapping({
  src: filepaths,
  destBase: 'out',
  srcBase: 'lib',
});

console.log(results);
```

#### 3-find-mapping.js output

```
[ { src: [ 'ctor.js' ], dest: 'out/ctor.js' },
  { src: [ 'globule.js' ], dest: 'out/globule.js' },
  { src: [ 'helpers.js' ], dest: 'out/helpers.js' },
  { src: [ 'path-custom.js' ], dest: 'out/path-custom.js' } ]
[ { src: [ 'lib/ctor.js' ], dest: 'out/ctor.js' },
  { src: [ 'lib/globule.js' ], dest: 'out/globule.js' },
  { src: [ 'lib/helpers.js' ], dest: 'out/helpers.js' },
  { src: [ 'lib/path-custom.js' ], dest: 'out/path-custom.js' } ]
[ { src: [ 'lib/lib/ctor.js' ], dest: 'out/lib/ctor.js' },
  { src: [ 'lib/lib/globule.js' ], dest: 'out/lib/globule.js' },
  { src: [ 'lib/lib/helpers.js' ], dest: 'out/lib/helpers.js' },
  { src: [ 'lib/lib/path-custom.js' ],
    dest: 'out/lib/path-custom.js' } ]
```
## [4-match.js](examples/4-match.js)

```js
var globule = require('globule');

var results;
var filepaths = ['a.js', 'b.css', 'c.js', 'd.css'];

// All filepaths that match *.js
results = globule.match('*.js', filepaths);
console.log(results);

// All filepaths that match *.js or *.css (retaining original order)
results = globule.match('*.{js,css}', filepaths);
console.log(results);

// All filepaths that match *.js or *.css (in pattern order)
results = globule.match(['*.js', '*.css'], filepaths);
console.log(results);


filepaths = ['js/a.js', 'css/b.css', 'js/c.js', 'css/d.css'];

// All *.js files in any subdirectory
results = globule.match('**/*.js', filepaths);
console.log(results);

// All *.js files in any subdirectory, using the "matchBase" option
results = globule.match('*.js', filepaths, {matchBase: true});
console.log(results);


// Do any filepaths match any of the sprcified patterns?
results = globule.isMatch(['*.fail', '*.whoops'], filepaths);
console.log(results);

// Do any filepaths match any of the sprcified patterns?
results = globule.isMatch(['*.js', '*.css'], filepaths, {matchBase: true});
console.log(results);
```

#### 4-match.js output

```
[ 'a.js', 'c.js' ]
[ 'a.js', 'b.css', 'c.js', 'd.css' ]
[ 'a.js', 'c.js', 'b.css', 'd.css' ]
[ 'js/a.js', 'js/c.js' ]
[ 'js/a.js', 'js/c.js' ]
false
true
```
## [5-event-emitter.js](examples/5-event-emitter.js)

```js
var globule = require('globule');

globule.find({
  src: ['*.txt', '!*st.txt', '*.{txt,js}', '*.fail', 'q*.css', '*.css'],
  cwd: 'test/fixtures/expand',
  matchBase: true,
})
.on('match', function(filepath) {
  console.log('Match: %s', filepath);
})
.on('hit', function(data) {
  console.log('Hit (%d/%d) %s\n', data.matches.length, data.dupes.length, data.pattern);
})
.on('miss', function(data) {
  console.log('Miss %s\n', data.pattern);
})
.on('end', function(filepaths) {
  console.log('Matches', filepaths);
});
```

#### 5-event-emitter.js output

```
Match: deep/deep.txt
Match: deep/deeper/deeper.txt
Hit (2/0) *.txt

Match: deep/deeper/deepest/deepest.txt
Match: js/bar.js
Match: js/foo.js
Hit (3/2) *.{txt,js}

Miss *.fail

Match: css/qux.css
Hit (1/0) q*.css

Match: css/baz.css
Hit (1/1) *.css

Matches [ 'deep/deep.txt',
  'deep/deeper/deeper.txt',
  'deep/deeper/deepest/deepest.txt',
  'js/bar.js',
  'js/foo.js',
  'css/qux.css',
  'css/baz.css' ]
```
