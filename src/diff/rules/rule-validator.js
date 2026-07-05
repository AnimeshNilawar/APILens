var KNOWN_COMPARE_KEYS = [
  'paths', 'operations', 'parameters', 'requestBodies',
  'responses', 'schemas', 'properties', 'security',
  'servers', 'tags', 'examples', 'descriptions',
  'summaries', 'operationIds', 'deprecated',
  'default', 'format', 'nullable', 'required', 'enums',
  'vendorExtensions', 'aiMetadata', 'extensions',
];

function validate(config) {
  var warnings = [];

  if (!config || typeof config !== 'object') {
    return { valid: true, warnings: [] };
  }

  var diff = config.diff;
  if (!diff || typeof diff !== 'object') {
    return { valid: true, warnings: [] };
  }

  if (diff.compare && typeof diff.compare === 'object') {
    for (var key in diff.compare) {
      if (diff.compare.hasOwnProperty(key)) {
        if (KNOWN_COMPARE_KEYS.indexOf(key) === -1) {
          warnings.push('Unknown compare rule "' + key + '". Supported: ' + KNOWN_COMPARE_KEYS.join(', '));
        } else if (typeof diff.compare[key] !== 'boolean') {
          warnings.push('Compare rule "' + key + '" must be a boolean, got ' + typeof diff.compare[key]);
        }
      }
    }
  }

  if (diff.ignore && typeof diff.ignore === 'object') {
    if (diff.ignore.fields) {
      if (!Array.isArray(diff.ignore.fields)) {
        warnings.push('"ignore.fields" must be an array of strings');
      } else {
        for (var i = 0; i < diff.ignore.fields.length; i++) {
          if (typeof diff.ignore.fields[i] !== 'string') {
            warnings.push('Ignore field at index ' + i + ' must be a string');
          }
        }
      }
    }
    for (var key in diff.ignore) {
      if (diff.ignore.hasOwnProperty(key) && key !== 'fields') {
        warnings.push('Unknown ignore option "' + key + '". Only "fields" is supported.');
      }
    }
  }

  return { valid: warnings.length === 0, warnings: warnings };
}

module.exports = { validate, KNOWN_COMPARE_KEYS };
