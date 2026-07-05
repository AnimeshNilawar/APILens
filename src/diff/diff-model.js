var idCounter = 0;

var CATEGORIES = {
  PATH: 'PATH',
  ENDPOINT: 'ENDPOINT',
  PARAMETER: 'PARAMETER',
  REQUEST_BODY: 'REQUEST_BODY',
  RESPONSE: 'RESPONSE',
  SCHEMA: 'SCHEMA',
  PROPERTY: 'PROPERTY',
  ENUM: 'ENUM',
  SECURITY: 'SECURITY',
  SERVER: 'SERVER',
  TAG: 'TAG',
  COMPONENT: 'COMPONENT',
};

var CHANGE_TYPES = {
  ADDED: 'ADDED',
  REMOVED: 'REMOVED',
  MODIFIED: 'MODIFIED',
  TYPE_CHANGED: 'TYPE_CHANGED',
  FORMAT_CHANGED: 'FORMAT_CHANGED',
  NULLABLE_CHANGED: 'NULLABLE_CHANGED',
  REQUIRED_CHANGED: 'REQUIRED_CHANGED',
  DEFAULT_CHANGED: 'DEFAULT_CHANGED',
  DESCRIPTION_CHANGED: 'DESCRIPTION_CHANGED',
  EXAMPLE_CHANGED: 'EXAMPLE_CHANGED',
  CONTENT_CHANGED: 'CONTENT_CHANGED',
  STATUS_CHANGED: 'STATUS_CHANGED',
};

function createDiff(category, changeType, location, before, after, details) {
  idCounter++;
  var id = 'DIF-' + String(idCounter).padStart(4, '0');
  var entry = {
    id: id,
    category: category,
    changeType: changeType,
    path: null,
    method: null,
    location: location || '',
    object: null,
    property: null,
    before: before !== undefined ? before : null,
    after: after !== undefined ? after : null,
    details: details || '',
  };

  if (location && location.indexOf('paths.') === 0) {
    var parts = location.split('.');
    if (parts.length >= 3 && parts[0] === 'paths') {
      entry.path = parts[1];
    }
    if (parts.length >= 4) {
      var method = parts[2];
      if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].indexOf(method) !== -1) {
        entry.method = method.toUpperCase();
      }
    }
  }

  return entry;
}

function resetCounter() {
  idCounter = 0;
}

module.exports = {
  CATEGORIES: CATEGORIES,
  CHANGE_TYPES: CHANGE_TYPES,
  createDiff: createDiff,
  resetCounter: resetCounter,
};
