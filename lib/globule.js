/*
 * globule
 * https://github.com/cowboy/node-globule
 *
 * Copyright (c) 2014 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 */

'use strict';

// 3rd-party libs.
var _ = require('lodash');
var minimatch = require('minimatch');

// Like the built-in path but with an override or two.
var path = require('./path-custom');

// This module.
var globule = exports;
// The constructor.
var Globule = globule.Globule = require('./ctor').Globule;

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

// Find asynchronously (or synchronously if options.sync is set). If async,
// returns a globule instance. If sync, returns an array of matches.
globule.find = function() {
  var args = _.toArray(arguments);
  // If the second-to-last argument is an function, remove it from args.
  var callback = _.isFunction(args[args.length - 1]) ? args.pop() : function() {};
  // If the second-to-last argument is an options object, remove it from args.
  var options = _.isPlainObject(args[args.length - 1]) ? args.pop() : {};
  // Create new instance.
  var g = new Globule(args, options, callback);
  return g.sync ? g.found : g;
};

// Find synchronously and return an array of matches.
globule.findSync = function() {
  var args = _.toArray(arguments);
  // If the second-to-last argument is an options object, remove it from args.
  var options = _.isPlainObject(args[args.length - 1]) ? args.pop() : null;
  // Gotta be sync!
  options = _.extend({}, options, {sync: true});
  // Call main .find method.
  return globule.find(args, options);
};

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
