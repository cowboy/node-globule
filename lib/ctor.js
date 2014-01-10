/*
 * globule
 * https://github.com/cowboy/node-globule
 *
 * Copyright (c) 2014 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 */

'use strict';

// Native libs.
var fs = require('fs');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

// 3rd-party libs.
var _ = require('lodash');
var glob = require('glob');
var minimatch = require('minimatch');

// Like the built-in path but with an override or two.
var path = require('./path-custom');

function Globule() {
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
  // Patterns to be matched.
  this.includes = [];
  this.excludes = [];
  // Matching state.
  this.current = 0;
  this.found = [];
  this.aborted = false;
  this.paused = false;
  // The current glob instance.
  this.glob = null;
  // Create glob-specific options object.
  this.globOptions = _.extend({cache: {}, statCache: {}}, options);
  // Pass srcBase (also known as cwd) through as cwd.
  if (this.srcBase) {
    this.globOptions.cwd = this.srcBase;
  }
  // Expose glob caches on the globule instance.
  this.cache = this.globOptions.cache;
  this.statCache = this.globOptions.statCache;

  // Pass empty set to the callback if there are no patterns.
  if (this.patterns.length === 0) {
    this.emit('end', []);
    return this;
  }

  // Split includes and excludes into separate arrays.
  this._splitPatterns();

  // this.on('match',   console.log.bind(console, '> MATCH! %s'));
  // this.on('error',   console.log.bind(console, '> error: %s'));
  // this.on('end',     console.log.bind(console, '>>>'));

  // Match first pattern.
  this._processNextPattern();
}
util.inherits(Globule, EventEmitter);

// Expose constructor.
exports.Globule = Globule;

// Abort globule instance. Beware: once aborted, result set will be incomplete!
Globule.prototype.abort = function() {
  if (this.glob) {
    this.glob.abort();
  }
  this.aborted = true;
  this.emit('abort');
};

// Pause globule instance. Note that remaining matches may still be emitted
// after pause.
Globule.prototype.pause = function() {
  if (this.paused) { return; }
  this.paused = true;
  if (this.glob && !this.glob.found) {
    this.glob.pause();
  }
};

// Resume globule instance.
Globule.prototype.resume = function() {
  if (!this.paused) { return; }
  this.paused = false;
  if (this.glob && !this.glob.found) {
    this.glob.resume();
  } else {
    this._processNextPattern();
  }
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

// Process the next pattern.
Globule.prototype._processNextPattern = function() {
  if (this.paused) { return; }
  if (this.aborted || this.current === this.includes.length) {
    this._finish();
    return;
  }

  var includeObj = this.includes[this.current++];
  var index = includeObj.index;
  var pattern = includeObj.pattern;
  var result = [];
  // Create a new Glob instance to match this pattern.
  this.glob = new glob.Glob(pattern, this.globOptions);

  var match = function(filepath) {
    // Prefix srcBase if necessary.
    if (this.srcBase && this.prefixBase) {
      filepath = path.join(this.srcBase, filepath);
    }
    // Workaround for isaacs/node-glob#81
    filepath = this._fixGlobIssue81(filepath);
    // Skip filepaths that have already been encountered.
    if (this.found.indexOf(filepath) !== -1 || result.indexOf(filepath) !== -1) {
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
    if (result.length === 0 && this.glob.nonull) {
      this.emit('match', pattern); // TODO: should the pattern be emitted?
      result.push(pattern);
    }
    // Sort matches like glob does.
    else if (!this.glob.nosort) {
      result.sort(this.glob.nocase ? alphasorti : alphasort);
    }
    // Add matches to the entire result set.
    this.found = this.found.concat(result);
    // Next!
    this._processNextPattern();
  }.bind(this);

  if (this.sync) {
    // Run match function on each match.
    this.glob.found.forEach(match);
    // This pattern is done being processed.
    end();
  } else {
    // On match, process filepath.
    this.glob.on('match', match);
    // This pattern is done being processed.
    this.glob.on('end', end);
    // On error, fail.
    this.glob.on('error', this._finish.bind(this));
  }
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

// Called when done processing patterns.
Globule.prototype._finish = function(err) {
  if (err) {
    this.emit('error', err);
  } else {
    this.emit('end', this.found);
  }
};

// From https://github.com/isaacs/node-glob/blob/master/glob.js
// See https://github.com/isaacs/node-glob/issues/81
Globule.prototype._fixGlobIssue81 = function(filepath) {
  if (this.glob.mark) {
    var sc = this.glob.cache[filepath];
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

// Should filepath be excluded?
Globule.prototype._filterFilepath = function(filepath) {
  if (!this.filter) { return true; }
  // If srcBase was specified but prefixBase was NOT, prefix srcBase
  // temporarily, for filtering.
  var relpath = this.srcBase && !this.prefixBase ? path.join(this.srcBase, filepath) : filepath;
  try {
    if (_.isFunction(this.filter)) {
      // Pass relative path and options into filter function.
      return this.filter(relpath, this.options);
    } else {
      // Grab stat object from statCache if possible, otherwise get it and
      // save it for later.
      if (!this.statCache[filepath]) {
        this.statCache[filepath] = fs.statSync(relpath);
      }
      return this.statCache[filepath][this.filter]();
    }
  } catch (err) {
    // Otherwise, it's probably not the right type.
    return false;
  }
};
