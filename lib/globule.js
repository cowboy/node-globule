/*
 * globule
 * https://github.com/cowboy/node-globule
 *
 * Copyright (c) 2014 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var _ = require('lodash');
var glob = require('glob');
var minimatch = require('minimatch');
var async = require('async');

// The module.
var globule = exports;

// Process specified wildcard glob patterns or filenames against a
// callback, excluding and uniquing files in the result set.
function processPatterns(patterns, options, fn) {
  var result = [];
  _.each(patterns, function(pattern) {
    // The first character is not ! (inclusion). Add all matching filepaths
    // to the result set.
    if (pattern.indexOf('!') !== 0) {
      result = _.union(result, fn(pattern));
      return;
    }
    // The first character is ! (exclusion). Remove any filepaths from the
    // result set that match this pattern, sans leading !.
    var filterFn = minimatch.filter(pattern.slice(1), options);
    result = _.filter(result, function(filepath) {
      return !filterFn(filepath);
    });
  });
  return result;
}

// Match a filepath or filepaths against one or more wildcard patterns. Returns
// all matching filepaths. This behaves just like minimatch.match, but supports
// any number of patterns.
globule.match = function(patterns, filepaths, options) {
  // Return empty set if either patterns or filepaths was omitted.
  if (patterns == null || filepaths == null) { return []; }
  // Normalize patterns and filepaths to flattened arrays.
  patterns = _.isArray(patterns) ? _.flatten(patterns) : [patterns];
  filepaths = _.isArray(filepaths) ? _.flatten(filepaths) : [filepaths];
  // Return empty set if there are no patterns or filepaths.
  if (patterns.length === 0 || filepaths.length === 0) { return []; }
  // Return all matching filepaths.
  return processPatterns(patterns, options, function(pattern) {
    return minimatch.match(filepaths, pattern, options || {});
  });
};

// Match a filepath or filepaths against one or more wildcard patterns. Returns
// true if any of the patterns match.
globule.isMatch = function() {
  return globule.match.apply(null, arguments).length > 0;
};

globule.find = function() {
  var args = _.toArray(arguments);
  // The last argument is the callback.
  var callback = _.isFunction(args[args.length - 1]) ? args.pop() : function() {};
  // If the second-to-last argument is an options object, remove it from args.
  var options = _.isPlainObject(args[args.length - 1]) ? args.pop() : {};
  // console.log(callback);
  // console.log(args);
  // console.log(options);

  var g = new Globule(args, options, callback);
  return g.sync ? g.matches : g;
};

globule.findSync = function() {
  var args = _.toArray(arguments);
  // If the second-to-last argument is an options object, remove it from args.
  var options = _.isPlainObject(args[args.length - 1]) ? args.pop() : null;

  options = _.extend({}, options, {sync: true});
  return globule.find(args, options);
};

function Globule() {
  // var instance;
  // if (!(this instanceof Globule)) {
  //   instance = Object.create(Globule.prototype);
  //   Globule.apply(instance, arguments);
  //   return instance;
  // }
  var args = _.toArray(arguments);
  // If the second-to-last argument is a function, remove it from args.
  var callback = _.isFunction(args[args.length - 1]) ? args.pop() : null;
  // If the second-to-last argument is an options object, remove it from args.
  var options = _.isPlainObject(args[args.length - 1]) ? args.pop() : {};
  // If callback was specified, execute it when all done.
  if (callback) {
    this.on('error', callback.bind(this));
    this.on('end', callback.bind(this, null));
  }
  // If options.src was specified, use it. Otherwise, use all non-options
  // arguments. Flatten nested arrays.
  if (options.src) {
    this.patterns = _.isArray(options.src) ? _.flatten(options.src) : [options.src];
  } else {
    this.patterns = _.flatten(args);
  }
  // Initialize some properties.
  this.options = options;
  this.srcBase = options.srcBase || options.cwd;
  this.prefixBase = Boolean(options.prefixBase);
  this.filter = options.filter || null;
  this.sync = Boolean(options.sync);
  this.includes = [];
  this.excludes = [];
  this.matches = [];
  this.aborted = false;
  this.globInstance = null;

  // Create glob-specific options object.
  this.globOptions = _.extend({}, options);
  if (this.srcBase) {
    this.globOptions.cwd = this.srcBase;
  }

  // Pass empty set to the callback if there are no patterns.
  if (this.patterns.length === 0) {
    this.emit('end', []);
    return this;
  }

  this._splitPatterns();

  // this.on('match',   console.log.bind(console, '> MATCH! %s'));
  // this.on('error',   console.log.bind(console, '> error: %s'));
  // this.on('end',     console.log.bind(console, '>>>'));

  // Match each include pattern, in-order.
  if (this.sync) {
    this.includes.forEach(function(includeObj) {
      this._processPattern(includeObj, function() {
        // TODO: handle error
      });
    }, this);
    this._finish();
  } else {
    async.eachSeries(this.includes, this._processPattern.bind(this), this._finish.bind(this));
  }
}
util.inherits(Globule, EventEmitter);

Globule.prototype.abort = function() {
  if (this.globInstance) {
    this.globInstance.abort();
  }
  this.aborted = true;
  this.emit('abort');
};

Globule.prototype.pause = function() {
  // ??
};

Globule.prototype.resume = function() {
  // ??
};

// Split includes and excludes into separate arrays.
Globule.prototype._splitPatterns = function() {
  this.patterns.forEach(function(pattern, index) {
    if (pattern.indexOf('!') === 0) {
      this.excludes[index] = minimatch.filter(pattern.slice(1), this.options);
    } else {
      this.includes.push({index: index, pattern: pattern});
    }
  }, this);
};

// Process a pattern.
Globule.prototype._processPattern = function(includeObj, done) {
  if (this.aborted) { done(); return; }

  var index = includeObj.index;
  var pattern = includeObj.pattern;
  var result = [];
  // Create a new Glob instance to match this pattern.
  this.globInstance = new glob.Glob(pattern, this.globOptions);

  var match = function(filepath) {
    // Prefix srcBase if necessary.
    if (this.srcBase && this.prefixBase) {
      filepath = path.join(this.srcBase, filepath);
    }
    // Workaround for isaacs/node-glob#81
    filepath = this._fixGlobIssue81(filepath);
    // Skip filepaths that have already been encountered.
    if (this.matches.indexOf(filepath) !== -1 || result.indexOf(filepath) !== -1) {
      return;
    }
    // Remove filepaths that should be filtered out via .filter option or
    // excluded via !pattern.
    var exclude = !this._filterFilepath(filepath) || this.excludes.slice(index + 1).some(function(filterfn) {
      return filterfn(filepath);
    }, this);
    // If filepath shouldn't be excluded, then include it!
    if (!exclude) {
      this.emit('match', filepath);
      result.push(filepath);
    }
  }.bind(this);

  var end = function() {
    // No matches? If .nonull was set, include the pattern in the result set.
    if (result.length === 0 && this.globInstance.nonull) {
      this.emit('match', pattern); // TODO: should the pattern be emitted?
      result.push(pattern);
    }
    // Sort matches like glob does.
    else if (!this.globInstance.nosort) {
      result = result.sort(this.globInstance.nocase ? alphasorti : alphasort);
    }
    // Add matches to the entire result set.
    this.matches = this.matches.concat(result);
    done();
  }.bind(this);

  if (this.sync) {
    // Run match function on each match.
    this.globInstance.found.forEach(match);
    // This pattern is done being processed.
    end();
  } else {
    // On match, process filepath.
    this.globInstance.on('match', match);
    // This pattern is done being processed.
    this.globInstance.on('end', end);
    // On error, fail.
    this.globInstance.on('error', done);
  }
};

Globule.prototype._finish = function(err) {
  if (err) {
    this.emit('error', err);
  } else {
    this.emit('end', this.matches);
  }
};

// From https://github.com/isaacs/node-glob/blob/master/glob.js
// See https://github.com/isaacs/node-glob/issues/81
Globule.prototype._fixGlobIssue81 = function(filepath) {
  if (this.globInstance.mark) {
    var sc = this.globInstance.cache[filepath];
    if (!sc) {
      return filepath;
    }
    var isDir = (Array.isArray(sc) || sc === 2);
    if (isDir && filepath.slice(-1) !== "/") {
      return filepath + "/";
    }
    if (!isDir && filepath.slice(-1) === "/") {
      return filepath.replace(/\/+$/, "");
    }
  }
  return filepath;
};

Globule.prototype._filterFilepath = function(filepath) {
  if (this.filter) {
    // If srcBase was specified but prefixBase was NOT, prefix srcBase
    // temporarily, for filtering.
    if (this.srcBase && !this.prefixBase) {
      filepath = path.join(this.srcBase, filepath);
    }
    try {
      if (_.isFunction(this.filter)) {
        return this.filter(filepath, this.options);
      } else {
        // If the file is of the right type and exists, this should work.
        return fs.statSync(filepath)[this.filter]();
      }
    } catch (err) {
      // Otherwise, it's probably not the right type.
      return false;
    }
  }
  return true;
};

// From https://github.com/isaacs/node-glob/blob/master/glob.js
function alphasorti(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  return alphasort(a, b);
}

function alphasort(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
}

var pathSeparatorRe = /[\/\\]/g;
var extDotRe = {
  first: /(\.[^\/]*)?$/,
  last: /(\.[^\/\.]*)?$/,
};
function rename(dest, options) {
  // Flatten path?
  if (options.flatten) {
    dest = path.basename(dest);
  }
  // Change the extension?
  if (options.ext) {
    dest = dest.replace(extDotRe[options.extDot], options.ext);
  }
  // Join dest and destBase?
  if (options.destBase) {
    dest = path.join(options.destBase, dest);
  }
  return dest;
}

// Build a mapping of src-dest filepaths from the given set of filepaths.
globule.mapping = function(filepaths, options) {
  // Return empty set if filepaths was omitted.
  if (filepaths == null) { return []; }
  options = _.defaults({}, options, {
    extDot: 'first',
    rename: rename,
  });
  var files = [];
  var fileByDest = {};
  // Find all files matching pattern, using passed-in options.
  filepaths.forEach(function(src) {
    // Generate destination filename.
    var dest = options.rename(src, options);
    // Prepend srcBase to all src paths.
    if (options.srcBase) {
      src = path.join(options.srcBase, src);
    }
    // Normalize filepaths to be unix-style.
    dest = dest.replace(pathSeparatorRe, '/');
    src = src.replace(pathSeparatorRe, '/');
    // Map correct src path to dest path.
    if (fileByDest[dest]) {
      // If dest already exists, push this src onto that dest's src array.
      fileByDest[dest].src.push(src);
    } else {
      // Otherwise create a new src-dest file mapping object.
      files.push({
        src: [src],
        dest: dest,
      });
      // And store a reference for later use.
      fileByDest[dest] = files[files.length - 1];
    }
  });
  return files;
};

// Return a mapping of src-dest filepaths from files matching the given
// wildcard patterns.
globule.findMapping = function() {
  var args = _.toArray(arguments);
  // If the last argument is an options object, remove it from args.
  var options = _.isPlainObject(args[args.length - 1]) ? args.pop() : {};
  // Generate mapping from found filepaths.
  return globule.mapping(globule.find(args, options), options);
};
