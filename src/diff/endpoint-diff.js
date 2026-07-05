var { createDiff, CATEGORIES, CHANGE_TYPES } = require('./diff-model');
var { deepEqual } = require('./diff-utils');
var { compareParameters } = require('./parameter-diff');
var { compareRequestBodies } = require('./request-body-diff');
var { compareResponses } = require('./response-diff');

function compareEndpoints(specA, specB, context) {
  context = context || {};
  var diffs = [];
  var pathsA = specA.paths || {};
  var pathsB = specB.paths || {};

  var allPaths = {};
  for (var p in pathsA) { if (pathsA.hasOwnProperty(p)) allPaths[p] = true; }
  for (var p in pathsB) { if (pathsB.hasOwnProperty(p)) allPaths[p] = true; }

  for (var path in allPaths) {
    if (!allPaths.hasOwnProperty(path)) continue;

    var opsA = pathsA[path] || {};
    var opsB = pathsB[path] || {};

    if (Object.keys(opsA).length === 0 && Object.keys(opsB).length > 0) {
      diffs.push(createDiff(
        CATEGORIES.PATH, CHANGE_TYPES.ADDED,
        'paths.' + path,
        null, path,
        'Path added: ' + path
      ));
      continue;
    }
    if (Object.keys(opsB).length === 0 && Object.keys(opsA).length > 0) {
      diffs.push(createDiff(
        CATEGORIES.PATH, CHANGE_TYPES.REMOVED,
        'paths.' + path,
        path, null,
        'Path removed: ' + path
      ));
      continue;
    }

    var allMethods = {};
    for (var m in opsA) { if (opsA.hasOwnProperty(m)) allMethods[m] = true; }
    for (var m in opsB) { if (opsB.hasOwnProperty(m)) allMethods[m] = true; }

    for (var method in allMethods) {
      if (!allMethods.hasOwnProperty(method)) continue;
      var opA = opsA[method];
      var opB = opsB[method];
      var loc = 'paths.' + path + '.' + method;

      if (!opA && opB) {
        diffs.push(createDiff(
          CATEGORIES.ENDPOINT, CHANGE_TYPES.ADDED,
          loc,
          null, method.toUpperCase() + ' ' + path,
          'Endpoint added: ' + method.toUpperCase() + ' ' + path
        ));
        continue;
      }

      if (opA && !opB) {
        diffs.push(createDiff(
          CATEGORIES.ENDPOINT, CHANGE_TYPES.REMOVED,
          loc,
          method.toUpperCase() + ' ' + path, null,
          'Endpoint removed: ' + method.toUpperCase() + ' ' + path
        ));
        continue;
      }

      compareOperationFields(opA, opB, loc, path, method, diffs, context);

      compareOperationParameters(opA, opB, loc, path, method, diffs, context);

      compareOperationRequestBody(opA, opB, loc, path, method, diffs, context);

      compareOperationResponses(opA, opB, loc, path, method, diffs, context);
    }
  }

  return diffs;
}

function compareOperationFields(opA, opB, loc, path, method, diffs, context) {
  var rules = (context && context.rules) || { shouldCompare: function () { return true; } };
  var fieldMap = {
    summary: { label: 'Summary', ruleKey: 'summaries' },
    description: { label: 'Description', ruleKey: 'descriptions' },
    operationId: { label: 'OperationId', ruleKey: 'operationIds' },
    deprecated: { label: 'Deprecated', ruleKey: 'deprecated' },
  };

  for (var name in fieldMap) {
    if (!fieldMap.hasOwnProperty(name)) continue;
    if (!rules.shouldCompare(fieldMap[name].ruleKey)) continue;
    var f = fieldMap[name];
    var valA = opA[name];
    var valB = opB[name];
    if (!deepEqual(valA, valB)) {
      diffs.push(createDiff(
        CATEGORIES.ENDPOINT, CHANGE_TYPES.MODIFIED,
        loc + '.' + name,
        valA, valB,
        f.label + ' changed for ' + method.toUpperCase() + ' ' + path
      ));
    }
  }

  if (rules.shouldCompare('tags')) {
    var tagsA = (opA.tags || []).slice().sort();
    var tagsB = (opB.tags || []).slice().sort();
    if (!deepEqual(tagsA, tagsB)) {
      diffs.push(createDiff(
        CATEGORIES.ENDPOINT, CHANGE_TYPES.MODIFIED,
        loc + '.tags',
        tagsA, tagsB,
        'Tags changed for ' + method.toUpperCase() + ' ' + path
      ));
    }
  }
}

function compareOperationParameters(opA, opB, loc, path, method, diffs, context) {
  var paramsA = opA.parameters || [];
  var paramsB = opB.parameters || [];
  var paramDiffs = compareParameters(paramsA, paramsB, path, method, context);
  for (var i = 0; i < paramDiffs.length; i++) {
    diffs.push(paramDiffs[i]);
  }
}

function compareOperationRequestBody(opA, opB, loc, path, method, diffs, context) {
  var bodyDiffs = compareRequestBodies(opA.requestBody, opB.requestBody, path, method, context);
  for (var i = 0; i < bodyDiffs.length; i++) {
    diffs.push(bodyDiffs[i]);
  }
}

function compareOperationResponses(opA, opB, loc, path, method, diffs, context) {
  var respDiffs = compareResponses(opA.responses || {}, opB.responses || {}, path, method, context);
  for (var i = 0; i < respDiffs.length; i++) {
    diffs.push(respDiffs[i]);
  }
}

module.exports = { compareEndpoints };
