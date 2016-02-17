# globule [![Build Status](https://secure.travis-ci.org/cowboy/node-globule.png?branch=master)](http://travis-ci.org/cowboy/node-globule)

An easy-to-use wildcard globbing library.

_This library is a wrapper around the [glob][] library that provides multi-pattern support (both inclusions and exclusions), filtering using [fs.Stats method name][] or arbitrary function, additional `hit` and `miss` events, as well as source + destination file-mapping utility methods._

## Usage

Install the module with: `npm install globule`. Then:

```js
var globule = require('globule');

// Sync
var filepaths = globule.findSync('lib/**/*.js', '!**/c*.js');

// Async
globule.find('**/!(c)*.js', {cwd: 'lib'}, function(err, filepaths) {
  console.log('Matches', filepaths);
});

// Event Emitter
globule.find({
  src: ['*.txt', '!*st.txt', '*.{txt,js}', '*.fail', 'q*.css', '*.css'],
  cwd: 'test/fixtures/expand',
  matchBase: true,
})
.on('match', function(filepath) {
  console.log('Match: %s', filepath);
})
.on('hit', function(data) {
  console.log('Hit (%d/%d) %s', data.matches.length, data.dupes.length, data.pattern);
})
.on('miss', function(data) {
  console.log('Miss %s', data.pattern);
})
.on('end', function(filepaths) {
  console.log('Matches', filepaths);
});

// Mapping
var fileMaps = globule.findMappingSync('**/*.{js,css,txt}', {
  srcBase: 'source',
  rename: function(filepath) {
    return 'concat/all.' + filepath.split('.').slice(-1);
  },
});
```

See the [examples](./examples) directory for more.

## Documentation

### Important Notice
The API has changed substantially between 0.x and 1.x. Mainly, the previously-synchronous methods `find` and `findMapping` have been renamed to `findSync` and `findMappingSync` and have been replaced with asynchronous `find` and `findMapping` methods which take a callback function.

Also, in addition to accepting an optional "done" callback, the now-asynchronous `find` method returns an instance of [EventEmitter][].

### globule.find
Returns a unique array of all file or directory paths that match the given patterns. Patterns may contain wildcard characters like `*` or `?`. Paths matching patterns that begin with `!` will be excluded from the returned array, otherwise patterns should follow 

or complete wildcard pattern documentation, see the [minimatch][] documentation, but note

This method accepts either comma separated globbing patterns or an array of globbing patterns.

Paths matching patterns that begin with `!` will be excluded from the returned array. Patterns are processed in order, so inclusion and exclusion order is significant. Patterns may be specified as function arguments or as a `src` property of the options object.

```js
var emitter = globule.find(patterns [, patterns [, ...]] [, options] [, callback])
var emitter = globule.find({src: patterns, /* other options */} [, callback])
```

The `options` object supports all [glob][] library options, along with a few extras. These are the most commonly used:

* `src` This property may be used instead of specifying patterns as function arguments.
* `filter` Either a valid [fs.Stats method name][] or a function that will be passed the matched `src` filepath and `options` object as arguments. This function should return `true` or `false`.
* `nonull` Retain specified patterns in result set even if they fail to match files.
* `matchBase` Patterns without slashes will match just the basename part. Eg. this makes `*.js` work like `**/*.js`.
* `srcBase` Patterns will be matched relative to the specified path instead of the current working directory. This is a synonym for `cwd`.
* `prefixBase` Any specified `srcBase` will be prefixed to all returned filepaths.

### globule.findSync
Like `globule.find` but synchronous. Instead of returning an [EventEmitter][], returns an array of matched files.

### globule.match
Match one or more globbing patterns against one or more file paths. Returns a uniqued array of all file paths that match any of the specified globbing patterns. Both the `patterns` and `filepaths` arguments can be a single string or array of strings. Paths matching patterns that begin with `!` will be excluded from the returned array. Patterns are processed in order, so inclusion and exclusion order is significant.

```js
globule.match(patterns, filepaths [, options])
```

### globule.isMatch
This method contains the same signature and logic as the `globule.match` method, but returns `true` if any files were matched, otherwise `false`.

```js
globule.isMatch(patterns, filepaths [, options])
```

### globule.mapping
Given a set of source file paths, returns an array of src-dest file mapping objects. Both src and dest paths may be renamed, depending on the options specified. Patterns may be specified as function arguments or as a `src` property of the options object.

```js
globule.mapping(filepaths [, filepaths [, ...]]  [, options])
globule.mapping({src: filepaths, /* other options */})
```

In addition to the options the `globule.find` method supports, the options object also supports these properties:

* `srcBase` The directory from which patterns are matched. Any string specified as `srcBase` is effectively stripped from the beginning of all matched paths.
* `destBase` The specified path is prefixed to all `dest` filepaths.
* `ext` Remove anything after (and including) the first `.` in the destination path, then append this value.
* `extDot` Change the behavior of `ext`, `"first"` and `"last"` will remove anything after the first or last `.` in the destination filename, respectively. Defaults to `"first"`.
* `flatten` Remove the path component from all matched src files. The src file path is still joined to the specified destBase.
* `rename` If specified, this function will be responsible for returning the final `dest` filepath. By default, it flattens paths (if specified), changes extensions (if specified) and joins the matched path to the `destBase`.

### globule.findMapping
This method is a convenience wrapper around the `globule.find` and `globule.mapping` methods.

```js
globule.findMapping(patterns [, options])
```


## Examples

Given the files `foo/a.js` and `foo/b.js`:

### srcBase and destBase

```js
globule.find("foo/*.js")
// ["foo/a.js", "foo/b.js"]

globule.find("*.js", {srcBase: "foo"})
// ["a.js", "b.js"]

globule.find({src: "*.js", srcBase: "foo", prefixBase: true})
// ["foo/a.js", "foo/b.js"]
```

```js
globule.findMapping("foo/*.js")
// [{src: ["foo/a.js"], dest: "foo/a.js"}, {src: ["foo/b.js"], dest: "foo/b.js"}]

globule.findMapping("foo/*.js", {destBase: "bar"})
// [{src: ["foo/a.js"], dest: "bar/foo/a.js"}, {src: ["foo/b.js"], dest: "bar/foo/b.js"}]

globule.findMapping({src: "*.js", srcBase: "foo", destBase: "bar"})
// [{src: ["foo/a.js"], dest: "bar/a.js"}, {src: ["foo/b.js"], dest: "bar/b.js"}]
```

```js
globule.mapping(["foo/a.js", "foo/b.js"])
// [{src: ["foo/a.js"], dest: "foo/a.js"}, {src: ["foo/b.js"], dest: "foo/b.js"}]

globule.mapping(["foo/a.js", "foo/b.js"], {destBase: "bar"})
// [{src: ["foo/a.js"], dest: "bar/foo/a.js"}, {src: ["foo/b.js"], dest: "bar/foo/b.js"}]

globule.mapping("foo/a.js", "foo/b.js", {destBase: "bar"})
// [{src: ["foo/a.js"], dest: "bar/foo/a.js"}, {src: ["foo/b.js"], dest: "bar/foo/b.js"}]

globule.mapping(["a.js", "b.js"], {srcBase: "foo", destBase: "bar"})
// [{src: ["foo/a.js"], dest: "bar/a.js"}, {src: ["foo/b.js"], dest: "bar/b.js"}]

globule.mapping({src: ["a.js", "b.js"], srcBase: "foo", destBase: "bar"})
// [{src: ["foo/a.js"], dest: "bar/a.js"}, {src: ["foo/b.js"], dest: "bar/b.js"}]
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
2014-01-07 - v0.2.0 - Updated dependencies. Added `src` option. Improved exclusion speed significantly.
2013-04-11 - v0.1.0 - Initial release.

## License
Copyright (c) 2014 "Cowboy" Ben Alman  
Licensed under the MIT license.

[glob]: https://github.com/isaacs/node-glob
[minimatch]: https://github.com/isaacs/minimatch
[EventEmitter]: http://nodejs.org/api/events.html#events_class_events_eventemitter
[fs.Stats method name]: http://nodejs.org/docs/latest/api/fs.html#fs_class_fs_stats
