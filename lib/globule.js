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

// Internal libs.
var helpers = require('./helpers');

// This module.
var globule = exports;
// The constructor.
var Globule = globule.Globule = require('./ctor').Globule;

// Find asynchronously (or synchronously if options.sync is set). If async,
// returns a globule instance. If sync, returns an array of matches.
globule.find = function() {
  // Parse arguments.
  var o = helpers.parseArguments(arguments, {callback: true});
  // Create new instance.
  var g = new Globule(o.args, o.options, o.callback);
  return g.sync ? g.found : g;
};

// Find synchronously and return an array of matches.
globule.findSync = function() {
  // Parse arguments.
  var o = helpers.parseArguments(arguments);
  // Gotta be sync!
  var options = _.extend({}, o.options, {sync: true});
  // Call main .find method.
  return globule.find(o.args, options);
};

// Return a mapping of src-dest filepaths from files matching the given
// wildcard patterns.
globule.findMapping = function() {
  // Parse arguments.
  var o = helpers.parseArguments(arguments, {mapping: true, callback: true});
  // Generate mapping from found filepaths.
  return globule.find(o.args, o.options, function(err, filepaths) {
    // Do that "Node.js" thing.
    // https://gist.github.com/cowboy/8417940
    if (err) {
      o.callback(err);
    } else {
      o.callback(null, globule.mapping(filepaths, o.mappingOptions));
    }
  });
};

// Return a mapping of src-dest filepaths from files matching the given
// wildcard patterns.
globule.findMappingSync = function() {
  // Parse arguments.
  var o = helpers.parseArguments(arguments, {mapping: true});
  // Generate mapping from found filepaths.
  return globule.mapping(globule.findSync(o.args, o.options), o.mappingOptions);
};

// The "ext" option refers to either everything after the first dot (default)
// or everything after the last dot.
var extDotRe = {
  first: /(\.[^\/]*)?$/,
  last: /(\.[^\/\.]*)?$/,
};

// Default "rename" function.
globule._rename = function(filepath, options) {
  var dest = filepath;
  // Flatten dest path?
  if (options.flatten) {
    dest = path.basename(dest);
  }
  // Change the extension?
  if ('ext' in options) {
    dest = dest.replace(extDotRe[options.extDot], options.ext);
  }
  // Prepend destBase to dest path.
  if (options.destBase) {
    dest = path.join(options.destBase, dest);
  }
  return dest;
};

// Build a mapping of src-dest filepaths from the given set of filepaths.
globule.mapping = function() {
  // Parse arguments.
  var o = helpers.parseArguments(arguments, {callback: true, filepaths: true});
  // Return empty set if filepaths were omitted.
  if (o.filepaths == null) { return []; }
  var options = _.defaults({}, o.options, {
    extDot: 'first',
    rename: globule._rename,
  });
  var files = [];
  var fileByDest = {};
  // Find all files matching pattern, using passed-in options.
  o.filepaths.forEach(function(src) {
    // Generate destination filename.
    var dest = options.rename(src, options);
    // If an object with a src property was returned, use it.
    if ('src' in Object(dest)) {
      src = dest.src;
    }
    // Otherwise prepend srcBase to src path.
    else if (options.srcBase) {
      src = path.join(options.srcBase, src);
    }
    // If an object with a dest property was returned, use it.
    if ('dest' in Object(dest)) { dest = dest.dest; }
    // Ensure src is an array.
    if (!Array.isArray(src)) { src = [src]; }
    // Normalize filepath to be unix-style.
    src = src.map(path.unixslashes);
    dest = path.unixslashes(dest);
    // Map correct src path to dest path.
    if (fileByDest[dest]) {
      // If dest already exists, concat this src onto that dest's src.
      fileByDest[dest].src = fileByDest[dest].src.concat(src);
    } else {
      // Otherwise create a new src-dest file mapping object.
      files.push({src: src, dest: dest});
      // And store a reference for later use.
      fileByDest[dest] = files[files.length - 1];
    }
  });
  return files;
};

// Match a filepath or filepaths against one or more wildcard patterns. Returns
// all matching filepaths. This behaves like minimatch.match, but supports any
// number of patterns and the srcBase option.
globule.match = function(patterns, filepaths, options) {
  if (!options) { options = {}; }
  // Return empty set if either patterns or filepaths was omitted.
  if (patterns == null || filepaths == null) { return []; }
  // Normalize patterns and filepaths to flattened arrays.
  patterns = _.isArray(patterns) ? _.flatten(patterns) : [patterns];
  filepaths = _.isArray(filepaths) ? _.flatten(filepaths) : [filepaths];
  // Return empty set if there are no patterns or filepaths.
  if (patterns.length === 0 || filepaths.length === 0) { return []; }
  // Return all matching filepaths.
  var p = helpers.splitPatterns(patterns, options);
  // For each include pattern...
  return p.includes.reduce(function(found, pattern, index) {
    var excludes = p.excludes.slice(index);
    // Get all filepaths that match...
    minimatch.match(filepaths, pattern, options)
      // Adjust filepath accounting for srcBase option.
      .map(helpers.adjustFilepath(options))
      .forEach(function(filepath) {
        // Remove duplicate filepaths.
        if (found.indexOf(filepath) !== -1) { return; }
        // Remove filepaths excluded via !pattern.
        if (helpers.filterFilepath(filepath, excludes)) {
          found.push(filepath);
        }
      });
    return found;
  }, []);
};

// Match a filepath or filepaths against one or more wildcard patterns. Returns
// true if any of the patterns match.
globule.isMatch = function() {
  return globule.match.apply(null, arguments).length > 0;
};
