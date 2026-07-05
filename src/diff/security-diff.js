var { createDiff, CATEGORIES, CHANGE_TYPES } = require('./diff-model');
var { deepEqual, cloneDeep } = require('./diff-utils');

function compareSecurity(specA, specB, context) {
  context = context || {};
  var rules = (context && context.rules) || { shouldCompare: function () { return true; } };
  var diffs = [];

  if (!rules.shouldCompare('security')) return diffs;

  var schemesA = (specA.components && specA.components.securitySchemes) || {};
  var schemesB = (specB.components && specB.components.securitySchemes) || {};

  var allSchemes = {};
  for (var name in schemesA) { if (schemesA.hasOwnProperty(name)) allSchemes[name] = true; }
  for (var name in schemesB) { if (schemesB.hasOwnProperty(name)) allSchemes[name] = true; }

  for (var name in allSchemes) {
    if (!allSchemes.hasOwnProperty(name)) continue;
    var loc = 'components.securitySchemes.' + name;

    if (!schemesA[name]) {
      diffs.push(createDiff(
        CATEGORIES.SECURITY, CHANGE_TYPES.ADDED,
        loc,
        null, name,
        'Security scheme added: ' + name
      ));
      continue;
    }

    if (!schemesB[name]) {
      diffs.push(createDiff(
        CATEGORIES.SECURITY, CHANGE_TYPES.REMOVED,
        loc,
        name, null,
        'Security scheme removed: ' + name
      ));
      continue;
    }

    compareSecurityScheme(name, schemesA[name], schemesB[name], diffs, context);
  }

  var secA = specA.security || [];
  var secB = specB.security || [];
  if (!deepEqual(secA, secB)) {
    diffs.push(createDiff(
      CATEGORIES.SECURITY, CHANGE_TYPES.MODIFIED,
      'security',
      secA, secB,
      'Global security requirements changed'
    ));
  }

  return diffs;
}

function compareSecurityScheme(name, schemeA, schemeB, diffs, context) {
  context = context || {};
  var rules = (context && context.rules) || { shouldCompare: function () { return true; } };
  var loc = 'components.securitySchemes.' + name;

  var fields = ['type', 'scheme', 'bearerFormat', 'description', 'in', 'name', 'openIdConnectUrl'];
  var fieldRuleMap = {
    description: 'descriptions',
  };

  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var ruleKey = fieldRuleMap[field];
    if (ruleKey && !rules.shouldCompare(ruleKey)) continue;
    if (!deepEqual(schemeA[field], schemeB[field])) {
      diffs.push(createDiff(
        CATEGORIES.SECURITY, CHANGE_TYPES.MODIFIED,
        loc + '.' + field,
        schemeA[field], schemeB[field],
        (field.charAt(0).toUpperCase() + field.slice(1)) + ' changed for security scheme "' + name + '"'
      ));
    }
  }

  if (schemeA.flows && schemeB.flows) {
    compareFlows(name, schemeA.flows, schemeB.flows, loc, diffs, context);
  }
}

function compareFlows(name, flowsA, flowsB, baseLoc, diffs, context) {
  var allFlows = {};
  for (var f in flowsA) { if (flowsA.hasOwnProperty(f)) allFlows[f] = true; }
  for (var f in flowsB) { if (flowsB.hasOwnProperty(f)) allFlows[f] = true; }

  for (var flow in allFlows) {
    if (!allFlows.hasOwnProperty(flow)) continue;
    var flowLoc = baseLoc + '.flows.' + flow;

    if (!flowsA[flow]) {
      diffs.push(createDiff(
        CATEGORIES.SECURITY, CHANGE_TYPES.ADDED,
        flowLoc,
        null, flow,
        'OAuth flow added: ' + flow
      ));
      continue;
    }

    if (!flowsB[flow]) {
      diffs.push(createDiff(
        CATEGORIES.SECURITY, CHANGE_TYPES.REMOVED,
        flowLoc,
        flow, null,
        'OAuth flow removed: ' + flow
      ));
      continue;
    }

    if (!deepEqual(flowsA[flow].scopes, flowsB[flow].scopes)) {
      diffs.push(createDiff(
        CATEGORIES.SECURITY, CHANGE_TYPES.MODIFIED,
        flowLoc + '.scopes',
        flowsA[flow].scopes, flowsB[flow].scopes,
        'OAuth scopes changed for flow "' + flow + '"'
      ));
    }

    if (flowsA[flow].authorizationUrl !== flowsB[flow].authorizationUrl) {
      diffs.push(createDiff(
        CATEGORIES.SECURITY, CHANGE_TYPES.MODIFIED,
        flowLoc + '.authorizationUrl',
        flowsA[flow].authorizationUrl, flowsB[flow].authorizationUrl,
        'Authorization URL changed for flow "' + flow + '"'
      ));
    }

    if (flowsA[flow].tokenUrl !== flowsB[flow].tokenUrl) {
      diffs.push(createDiff(
        CATEGORIES.SECURITY, CHANGE_TYPES.MODIFIED,
        flowLoc + '.tokenUrl',
        flowsA[flow].tokenUrl, flowsB[flow].tokenUrl,
        'Token URL changed for flow "' + flow + '"'
      ));
    }
  }
}

module.exports = { compareSecurity };
