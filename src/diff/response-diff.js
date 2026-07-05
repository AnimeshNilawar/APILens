var { createDiff, CATEGORIES, CHANGE_TYPES } = require('./diff-model');
var { deepEqual } = require('./diff-utils');
var { compareSchemaObjects } = require('./schema-diff');

function compareResponses(responsesA, responsesB, path, method, context) {
  context = context || {};
  var rules = (context && context.rules) || { shouldCompare: function () { return true; } };
  var diffs = [];

  if (!rules.shouldCompare('responses')) return diffs;

  var allCodes = {};
  for (var code in responsesA) { if (responsesA.hasOwnProperty(code)) allCodes[code] = true; }
  for (var code in responsesB) { if (responsesB.hasOwnProperty(code)) allCodes[code] = true; }

  for (var code in allCodes) {
    if (!allCodes.hasOwnProperty(code)) continue;
    var loc = 'paths.' + path + '.' + method + '.responses.' + code;
    var respA = responsesA[code];
    var respB = responsesB[code];

    if (!respA && respB) {
      diffs.push(createDiff(
        CATEGORIES.RESPONSE, CHANGE_TYPES.ADDED,
        loc,
        null, code,
        'Response status added: ' + code
      ));
      continue;
    }

    if (respA && !respB) {
      diffs.push(createDiff(
        CATEGORIES.RESPONSE, CHANGE_TYPES.REMOVED,
        loc,
        code, null,
        'Response status removed: ' + code
      ));
      continue;
    }

    if (rules.shouldCompare('descriptions') && respA.description !== respB.description) {
      diffs.push(createDiff(
        CATEGORIES.RESPONSE, CHANGE_TYPES.DESCRIPTION_CHANGED,
        loc + '.description',
        respA.description, respB.description,
        'Response description changed for status ' + code
      ));
    }

    compareResponseContent(respA.content, respB.content, loc, code, diffs, context);
  }

  return diffs;
}

function compareResponseContent(contentA, contentB, loc, code, diffs, context) {
  if (!contentA && !contentB) return;

  contentA = contentA || {};
  contentB = contentB || {};

  var allTypes = {};
  for (var t in contentA) { if (contentA.hasOwnProperty(t)) allTypes[t] = true; }
  for (var t in contentB) { if (contentB.hasOwnProperty(t)) allTypes[t] = true; }

  for (var ct in allTypes) {
    if (!allTypes.hasOwnProperty(ct)) continue;
    var ctLoc = loc + '.content.' + ct;

    if (!contentA[ct]) {
      diffs.push(createDiff(
        CATEGORIES.RESPONSE, CHANGE_TYPES.ADDED,
        ctLoc,
        null, ct,
        'Response content type added: ' + ct
      ));
      continue;
    }

    if (!contentB[ct]) {
      diffs.push(createDiff(
        CATEGORIES.RESPONSE, CHANGE_TYPES.REMOVED,
        ctLoc,
        ct, null,
        'Response content type removed: ' + ct
      ));
      continue;
    }

    var schemaDiffs = compareSchemaObjects(
      'response',
      contentA[ct].schema,
      contentB[ct].schema,
      ctLoc + '.schema',
      context
    );
    for (var i = 0; i < schemaDiffs.length; i++) {
      diffs.push(schemaDiffs[i]);
    }
  }
}

module.exports = { compareResponses };
