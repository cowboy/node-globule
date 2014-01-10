/*
 * globule
 * https://github.com/cowboy/node-globule
 *
 * Copyright (c) 2014 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 */

'use strict';

// Built-in path module.
var _path = require('path');

// Exported methods on "path" will override built-in path methods.
var path = module.exports = Object.create(_path);

// New method. Replace \ with / if necessary.
path.unixslashes = function(filepath) {
  if (process.platform === 'win32') {
    return filepath.replace(/\\/g, '/');
  }
  return filepath;
};

// Override method. Joined paths will now always have / slashes.
path.join = function() {
  return path.unixslashes(_path.join.apply(exports, arguments));
};
