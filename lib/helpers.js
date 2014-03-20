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

// Parse callback, options and remaining args from passed-in arguments object.
exports.parseArguments = function(_arguments, options) {
  if (!options) { options = {}; }
  var o = {};
  var args = o.args = _.toArray(_arguments);
  // If the second-to-last argument is an function, remove it from args.
  if (options.callback) {
    o.callback = _.isFunction(args[args.length - 1]) ? args.pop() : function() {};
  }
  // If the second-to-last argument is an options object, remove it from args.
  o.options = _.isPlainObject(args[args.length - 1]) ? _.extend({}, args.pop()) : {};
  // Make tweaks for .mapping.
  if (options.mapping) {
    // Remove .src property from .mapping Options.
    o.mappingOptions = _.extend({}, o.options, {src: null});
    // If srcBase option was specified, remap it to cwd for find to prevent
    // srcBase path from being prefixed.
    if (o.options.srcBase) {
      o.options.cwd = o.options.srcBase;
      delete o.options.srcBase;
    }
  }
  // If options.src was specified, use it. Otherwise, use all non-options
  // filepath arguments. Flatten nested arrays.
  if (options.filepaths) {
    if (o.options.src) {
      o.filepaths = _.isArray(o.options.src) ? _.flatten(o.options.src) : [o.options.src];
    } else {
      o.filepaths = _.flatten(args);
    }
  }
  return o;
};

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

// Adjust filepath accounting for srcBase option.
exports.adjustFilepath = function(options, filepath) {
  function adjust(filepath) {
    // Prefix srcBase if necessary.
    if (options.srcBase) {
      filepath = path.join(options.srcBase, filepath);
    }
    return filepath;
  }
  // Allow partial application to simplify use in .map()
  return arguments.length < 2 ? adjust : adjust(filepath);
};

// Remove filepaths excluded via !pattern.
exports.filterFilepath = function(filepath, excludes) {
  // Exclude if any "excludes" filter function returns true.
  return excludes.every(function(filterfn) {
    return !filterfn(filepath);
  });
};
