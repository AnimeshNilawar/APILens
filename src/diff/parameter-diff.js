var { createDiff, CATEGORIES, CHANGE_TYPES } = require('./diff-model');
var { deepEqual } = require('./diff-utils');

function compareParameters(paramsA, paramsB, path, method, context) {
  context = context || {};
  var diffs = [];

  var indexA = {};
  for (var i = 0; i < paramsA.length; i++) {
    var p = paramsA[i];
    indexA[p.name] = p;
  }

  var indexB = {};
  for (var i = 0; i < paramsB.length; i++) {
    var p = paramsB[i];
    indexB[p.name] = p;
  }

  var allNames = {};
  for (var name in indexA) { if (indexA.hasOwnProperty(name)) allNames[name] = true; }
  for (var name in indexB) { if (indexB.hasOwnProperty(name)) allNames[name] = true; }

  for (var name in allNames) {
    if (!allNames.hasOwnProperty(name)) continue;
    var loc = 'paths.' + path + '.' + method + '.parameters.' + name;
    var paramA = indexA[name];
    var paramB = indexB[name];

    if (!paramA && paramB) {
      diffs.push(createDiff(
        CATEGORIES.PARAMETER, CHANGE_TYPES.ADDED,
        loc,
        null, paramB,
        'Parameter added: ' + name
      ));
      continue;
    }

    if (paramA && !paramB) {
      diffs.push(createDiff(
        CATEGORIES.PARAMETER, CHANGE_TYPES.REMOVED,
        loc,
        paramA, null,
        'Parameter removed: ' + name
      ));
      continue;
    }

    compareParamFields(paramA, paramB, loc, name, diffs, context);
  }

  return diffs;
}

function compareParamFields(paramA, paramB, loc, name, diffs, context) {
  var rules = (context && context.rules) || { shouldCompare: function () { return true; } };

  var fieldMap = {
    required: { label: 'Required', ct: CHANGE_TYPES.REQUIRED_CHANGED, ruleKey: 'required' },
    description: { label: 'Description', ct: CHANGE_TYPES.DESCRIPTION_CHANGED, ruleKey: 'descriptions' },
    nullable: { label: 'Nullable', ct: CHANGE_TYPES.NULLABLE_CHANGED, ruleKey: 'nullable' },
    example: { label: 'Example', ct: CHANGE_TYPES.EXAMPLE_CHANGED, ruleKey: 'examples' },
  };

  for (var fname in fieldMap) {
    if (!fieldMap.hasOwnProperty(fname)) continue;
    if (!rules.shouldCompare(fieldMap[fname].ruleKey)) continue;
    var f = fieldMap[fname];
    var valA = paramA[fname];
    var valB = paramB[fname];
    if (!deepEqual(valA, valB)) {
      diffs.push(createDiff(
        CATEGORIES.PARAMETER, f.ct,
        loc + '.' + fname,
        valA, valB,
        f.label + ' changed for parameter "' + name + '"'
      ));
    }
  }

  if (rules.shouldCompare('parameters')) {
    var typeA = paramA.schema ? paramA.schema.type : paramA.type;
    var typeB = paramB.schema ? paramB.schema.type : paramB.type;
    if (typeA !== typeB) {
      diffs.push(createDiff(
        CATEGORIES.PARAMETER, CHANGE_TYPES.TYPE_CHANGED,
        loc + '.type',
        typeA || 'unknown', typeB || 'unknown',
        'Type changed for parameter "' + name + '": ' + (typeA || 'unknown') + ' → ' + (typeB || 'unknown')
      ));
    }

    var inA = paramA.in;
    var inB = paramB.in;
    if (inA !== inB) {
      diffs.push(createDiff(
        CATEGORIES.PARAMETER, CHANGE_TYPES.MODIFIED,
        loc + '.in',
        inA, inB,
        'Location changed for parameter "' + name + '": ' + inA + ' → ' + inB
      ));
    }
  }

  if (rules.shouldCompare('default')) {
    var defaultA = paramA.schema ? paramA.schema.default : paramA.default;
    var defaultB = paramB.schema ? paramB.schema.default : paramB.default;
    if (!deepEqual(defaultA, defaultB)) {
      diffs.push(createDiff(
        CATEGORIES.PARAMETER, CHANGE_TYPES.DEFAULT_CHANGED,
        loc + '.default',
        defaultA, defaultB,
        'Default value changed for parameter "' + name + '"'
      ));
    }
  }

  if (rules.shouldCompare('enums')) {
    var enumA = paramA.schema ? paramA.schema.enum : paramA.enum;
    var enumB = paramB.schema ? paramB.schema.enum : paramB.enum;
    if (enumA || enumB) {
      var eA = (enumA || []).slice().sort();
      var eB = (enumB || []).slice().sort();
      if (!deepEqual(eA, eB)) {
        diffs.push(createDiff(
          CATEGORIES.ENUM, CHANGE_TYPES.MODIFIED,
          loc + '.enum',
          enumA, enumB,
          'Enum values changed for parameter "' + name + '"'
        ));
      }
    }
  }
}

module.exports = { compareParameters };
