/*
 * globule
 * https://github.com/cowboy/node-globule
 *
 * Copyright (c) 2014 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 */

'use strict';

// 3rd-party libs.
var minimatch = require('minimatch');

// Like the built-in path but with an override or two.
var path = require('./path-custom');

// Split includes and excludes into separate arrays.
exports.splitPatterns = function(patterns, options) {
  var result = {includes: [], excludes: []};
  patterns.forEach(function(pattern, index) {
    if (pattern.indexOf('!') === 0) {
      result.excludes[index] = minimatch.filter(pattern.slice(1), options);
    } else {
      result.includes[index] = pattern;
    }
  });
  return result;
};

// Adjust filepath accounting for srcBase/prefixBase options.
exports.adjustFilepath = function(options, filepath) {
  function adjust(filepath) {
    // Prefix srcBase if necessary.
    if (options.srcBase && options.prefixBase) {
      filepath = path.join(options.srcBase, filepath);
    }
    return filepath;
  }
  // Allow partial application to simplify use in .map()
  return arguments.length < 2 ? adjust : adjust(filepath);
};

// Remove duplicate filepaths or those excluded via !pattern.
exports.filterFilepath = function(filepath, found, excludes) {
  // Duplicate?
  if (found.indexOf(filepath) !== -1) { return false; }
  // Exclude?
  if (excludes.some(function(filterfn) {
    return filterfn(filepath);
  })) { return false; }
  // Include!
  return true;
};
