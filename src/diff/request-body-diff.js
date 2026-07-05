var { createDiff, CATEGORIES, CHANGE_TYPES } = require('./diff-model');
var { deepEqual } = require('./diff-utils');
var { compareSchemaObjects } = require('./schema-diff');

function compareRequestBodies(bodyA, bodyB, path, method, context) {
  context = context || {};
  var rules = (context && context.rules) || { shouldCompare: function () { return true; } };
  var diffs = [];

  if (!rules.shouldCompare('requestBodies')) return diffs;
  var loc = 'paths.' + path + '.' + method + '.requestBody';

  if (!bodyA && bodyB) {
    diffs.push(createDiff(
      CATEGORIES.REQUEST_BODY, CHANGE_TYPES.ADDED,
      loc,
      null, 'present',
      'Request body added for ' + method.toUpperCase() + ' ' + path
    ));
    return diffs;
  }

  if (bodyA && !bodyB) {
    diffs.push(createDiff(
      CATEGORIES.REQUEST_BODY, CHANGE_TYPES.REMOVED,
      loc,
      'present', null,
      'Request body removed for ' + method.toUpperCase() + ' ' + path
    ));
    return diffs;
  }

  if (!bodyA && !bodyB) return diffs;

  if (rules.shouldCompare('required') && bodyA.required !== bodyB.required) {
    diffs.push(createDiff(
      CATEGORIES.REQUEST_BODY, CHANGE_TYPES.REQUIRED_CHANGED,
      loc + '.required',
      bodyA.required, bodyB.required,
      'Request body required flag changed'
    ));
  }

  compareContentTypes(bodyA.content, bodyB.content, loc, path, method, diffs, context);

  return diffs;
}

function compareContentTypes(contentA, contentB, loc, path, method, diffs, context) {
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
        CATEGORIES.REQUEST_BODY, CHANGE_TYPES.ADDED,
        ctLoc,
        null, ct,
        'Content type added: ' + ct
      ));
      continue;
    }

    if (!contentB[ct]) {
      diffs.push(createDiff(
        CATEGORIES.REQUEST_BODY, CHANGE_TYPES.REMOVED,
        ctLoc,
        ct, null,
        'Content type removed: ' + ct
      ));
      continue;
    }

    if (contentA[ct] && contentB[ct]) {
      var schemaDiffs = compareSchemaObjects(
        'requestBody',
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
}

module.exports = { compareRequestBodies };
