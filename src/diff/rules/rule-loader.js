var fs = require('fs');
var path = require('path');
var { DEFAULTS } = require('./default-rules');
var { validate } = require('./rule-validator');

var CONFIG_FILENAME = 'apilens.config.json';

function loadConfig(configPath) {
  var resolvedPath;

  if (configPath) {
    resolvedPath = path.resolve(configPath);
  } else {
    resolvedPath = path.resolve(process.cwd(), CONFIG_FILENAME);
  }

  var userConfig = {};

  if (fs.existsSync(resolvedPath)) {
    try {
      var raw = fs.readFileSync(resolvedPath, 'utf-8');
      userConfig = JSON.parse(raw);
      console.log('  Loaded config: ' + resolvedPath);
    } catch (e) {
      console.warn('  Warning: Failed to parse config at ' + resolvedPath + ': ' + e.message);
    }
  } else {
    console.log('  No config file found at ' + resolvedPath + ', using defaults');
  }

  var merged = mergeConfig(userConfig);

  var result = validate(merged);
  for (var i = 0; i < result.warnings.length; i++) {
    console.warn('  Config warning: ' + result.warnings[i]);
  }

  return merged;
}

function mergeConfig(userConfig) {
  var merged = JSON.parse(JSON.stringify(DEFAULTS));

  if (!userConfig.diff || typeof userConfig.diff !== 'object') {
    return merged;
  }

  if (userConfig.diff.compare && typeof userConfig.diff.compare === 'object') {
    for (var key in userConfig.diff.compare) {
      if (userConfig.diff.compare.hasOwnProperty(key)) {
        merged.diff.compare[key] = userConfig.diff.compare[key];
      }
    }
  }

  if (userConfig.diff.ignore && typeof userConfig.diff.ignore === 'object') {
    if (Array.isArray(userConfig.diff.ignore.fields)) {
      merged.diff.ignore.fields = userConfig.diff.ignore.fields.slice();
    }
  }

  return merged;
}

module.exports = { loadConfig };
