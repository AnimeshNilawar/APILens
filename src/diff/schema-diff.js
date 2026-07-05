var { createDiff, CATEGORIES, CHANGE_TYPES } = require('./diff-model');
var { deepEqual } = require('./diff-utils');

function compareSchemas(schemasA, schemasB, context) {
  context = context || {};
  var rules = (context && context.rules) || { shouldCompare: function () { return true; } };
  var diffs = [];

  if (!rules.shouldCompare('schemas')) return diffs;
  var allNames = {};

  for (var name in schemasA) { if (schemasA.hasOwnProperty(name)) allNames[name] = true; }
  for (var name in schemasB) { if (schemasB.hasOwnProperty(name)) allNames[name] = true; }

  for (var name in allNames) {
    if (!allNames.hasOwnProperty(name)) continue;
    var loc = 'components.schemas.' + name;

    if (!schemasA[name]) {
      diffs.push(createDiff(
        CATEGORIES.SCHEMA, CHANGE_TYPES.ADDED,
        loc,
        null, name,
        'Schema added: ' + name
      ));
      continue;
    }

    if (!schemasB[name]) {
      diffs.push(createDiff(
        CATEGORIES.SCHEMA, CHANGE_TYPES.REMOVED,
        loc,
        name, null,
        'Schema removed: ' + name
      ));
      continue;
    }

    var schemaDiffs = compareSchemaObjects(name, schemasA[name], schemasB[name], loc, context);
    for (var i = 0; i < schemaDiffs.length; i++) {
      diffs.push(schemaDiffs[i]);
    }
  }

  return diffs;
}

function compareSchemaObjects(name, objA, objB, baseLoc, context) {
  context = context || {};
  var rules = (context && context.rules) || { shouldCompare: function () { return true; } };
  var diffs = [];

  objA = objA || {};
  objB = objB || {};

  if (objA._circular && objB._circular) return diffs;
  if (objA._circular !== objB._circular) {
    diffs.push(createDiff(
      CATEGORIES.SCHEMA, CHANGE_TYPES.MODIFIED,
      baseLoc,
      objA._circular ? '[Circular]' : '[Resolved]',
      objB._circular ? '[Circular]' : '[Resolved]',
      'Circular reference changed'
    ));
    return diffs;
  }

  if (rules.shouldCompare('schemas') && objA.type !== objB.type) {
    diffs.push(createDiff(
      CATEGORIES.PROPERTY, CHANGE_TYPES.TYPE_CHANGED,
      baseLoc + '.type',
      objA.type || 'object', objB.type || 'object',
      'Type changed for "' + (name || 'schema') + '": ' + (objA.type || 'object') + ' → ' + (objB.type || 'object')
    ));
  }

  var fieldRuleMap = {
    format: 'format',
    nullable: 'nullable',
    description: 'descriptions',
    default: 'default',
    title: 'extensions',
  };
  var fieldChangeType = {
    nullable: CHANGE_TYPES.NULLABLE_CHANGED,
    format: CHANGE_TYPES.FORMAT_CHANGED,
    description: CHANGE_TYPES.DESCRIPTION_CHANGED,
    default: CHANGE_TYPES.DEFAULT_CHANGED,
  };

  for (var field in fieldRuleMap) {
    if (!fieldRuleMap.hasOwnProperty(field)) continue;
    if (!rules.shouldCompare(fieldRuleMap[field])) continue;
    var valA = objA[field];
    var valB = objB[field];
    if (!deepEqual(valA, valB)) {
      var ct = fieldChangeType[field] || CHANGE_TYPES.MODIFIED;
      diffs.push(createDiff(
        CATEGORIES.PROPERTY, ct,
        baseLoc + '.' + field,
        valA, valB,
        (field.charAt(0).toUpperCase() + field.slice(1)) + ' changed for "' + (name || 'schema') + '"'
      ));
    }
  }

  if (rules.shouldCompare('examples')) {
    var exampleA = objA.example;
    var exampleB = objB.example;
    if (!deepEqual(exampleA, exampleB)) {
      diffs.push(createDiff(
        CATEGORIES.PROPERTY, CHANGE_TYPES.EXAMPLE_CHANGED,
        baseLoc + '.example',
        exampleA, exampleB,
        'Example changed for "' + (name || 'schema') + '"'
      ));
    }
  }

  if (rules.shouldCompare('enums')) {
    var enumsA = objA.enum;
    var enumsB = objB.enum;
    if (enumsA || enumsB) {
      var eA = (enumsA || []).slice().sort();
      var eB = (enumsB || []).slice().sort();
      if (!deepEqual(eA, eB)) {
        diffs.push(createDiff(
          CATEGORIES.ENUM, CHANGE_TYPES.MODIFIED,
          baseLoc + '.enum',
          enumsA, enumsB,
          'Enum values changed for "' + (name || 'schema') + '"'
        ));
      }
    }
  }

  if (objA.type === 'object' || objB.type === 'object' || (!objA.type && !objB.type)) {
    if (rules.shouldCompare('required')) {
      compareRequired(objA.required, objB.required, baseLoc, name, diffs);
    }

    if (rules.shouldCompare('properties')) {
      compareProperties(objA.properties, objB.properties, baseLoc, name, diffs, context);
    }

    compareAdditionalProperties(objA.additionalProperties, objB.additionalProperties, baseLoc, name, diffs, context);
  }

  if (objA.type === 'array' || objB.type === 'array') {
    compareArrayItems(objA.items, objB.items, baseLoc, name, diffs, context);
  }

  return diffs;
}

function compareRequired(reqA, reqB, baseLoc, name, diffs) {
  reqA = reqA || [];
  reqB = reqB || [];

  var setA = {};
  for (var i = 0; i < reqA.length; i++) setA[reqA[i]] = true;
  var setB = {};
  for (var i = 0; i < reqB.length; i++) setB[reqB[i]] = true;

  for (var prop in setB) {
    if (setB.hasOwnProperty(prop) && !setA[prop]) {
      diffs.push(createDiff(
        CATEGORIES.PROPERTY, CHANGE_TYPES.REQUIRED_CHANGED,
        baseLoc + '.required',
        null, prop,
        'Property "' + prop + '" is now required'
      ));
    }
  }

  for (var prop in setA) {
    if (setA.hasOwnProperty(prop) && !setB[prop]) {
      diffs.push(createDiff(
        CATEGORIES.PROPERTY, CHANGE_TYPES.REQUIRED_CHANGED,
        baseLoc + '.required',
        prop, null,
        'Property "' + prop + '" is no longer required'
      ));
    }
  }
}

function compareProperties(propsA, propsB, baseLoc, name, diffs, context) {
  propsA = propsA || {};
  propsB = propsB || {};

  var allProps = {};
  for (var p in propsA) { if (propsA.hasOwnProperty(p)) allProps[p] = true; }
  for (var p in propsB) { if (propsB.hasOwnProperty(p)) allProps[p] = true; }

  for (var prop in allProps) {
    if (!allProps.hasOwnProperty(prop)) continue;
    var propLoc = baseLoc + '.properties.' + prop;

    if (!propsA[prop]) {
      diffs.push(createDiff(
        CATEGORIES.PROPERTY, CHANGE_TYPES.ADDED,
        propLoc,
        null, propsB[prop],
        'Property added: "' + prop + '"'
      ));
      continue;
    }

    if (!propsB[prop]) {
      diffs.push(createDiff(
        CATEGORIES.PROPERTY, CHANGE_TYPES.REMOVED,
        propLoc,
        propsA[prop], null,
        'Property removed: "' + prop + '"'
      ));
      continue;
    }

    compareSingleProperty(prop, propsA[prop], propsB[prop], propLoc, diffs, context);
  }
}

function compareSingleProperty(name, propA, propB, propLoc, diffs, context) {
  context = context || {};
  var rules = (context && context.rules) || { shouldCompare: function () { return true; } };

  if (rules.shouldCompare('properties') && propA.type !== propB.type) {
    diffs.push(createDiff(
      CATEGORIES.PROPERTY, CHANGE_TYPES.TYPE_CHANGED,
      propLoc + '.type',
      propA.type || 'unknown', propB.type || 'unknown',
      'Type changed for property "' + name + '": ' + (propA.type || 'unknown') + ' → ' + (propB.type || 'unknown')
    ));
  }

  var fieldRuleMap = {
    format: 'format',
    nullable: 'nullable',
    description: 'descriptions',
    default: 'default',
    title: 'extensions',
    pattern: 'extensions',
  };
  var fieldChangeType = {
    nullable: CHANGE_TYPES.NULLABLE_CHANGED,
    format: CHANGE_TYPES.FORMAT_CHANGED,
    description: CHANGE_TYPES.DESCRIPTION_CHANGED,
    default: CHANGE_TYPES.DEFAULT_CHANGED,
  };

  for (var field in fieldRuleMap) {
    if (!fieldRuleMap.hasOwnProperty(field)) continue;
    if (!rules.shouldCompare(fieldRuleMap[field])) continue;
    var valA = propA[field];
    var valB = propB[field];
    if (!deepEqual(valA, valB)) {
      var ct = fieldChangeType[field] || CHANGE_TYPES.MODIFIED;
      diffs.push(createDiff(
        CATEGORIES.PROPERTY, ct,
        propLoc + '.' + field,
        valA, valB,
        (field.charAt(0).toUpperCase() + field.slice(1)) + ' changed for property "' + name + '"'
      ));
    }
  }

  if (rules.shouldCompare('examples')) {
    if (!deepEqual(propA.example, propB.example)) {
      diffs.push(createDiff(
        CATEGORIES.PROPERTY, CHANGE_TYPES.EXAMPLE_CHANGED,
        propLoc + '.example',
        propA.example, propB.example,
        'Example changed for property "' + name + '"'
      ));
    }
  }

  if (propA.type === 'array' || propB.type === 'array') {
    compareArrayItems(propA.items, propB.items, propLoc, name, diffs, context);
  }

  if (propA.type === 'object' || propB.type === 'object') {
    compareProperties(propA.properties, propB.properties, propLoc, name, diffs, context);
  }
}

function compareArrayItems(itemsA, itemsB, baseLoc, name, diffs, context) {
  context = context || {};
  var rules = (context && context.rules) || { shouldCompare: function () { return true; } };

  if (!itemsA && !itemsB) return;
  if (!itemsA && itemsB) {
    diffs.push(createDiff(
      CATEGORIES.PROPERTY, CHANGE_TYPES.MODIFIED,
      baseLoc + '.items',
      null, itemsB,
      'Array items added for "' + (name || 'schema') + '"'
    ));
    return;
  }
  if (itemsA && !itemsB) {
    diffs.push(createDiff(
      CATEGORIES.PROPERTY, CHANGE_TYPES.MODIFIED,
      baseLoc + '.items',
      itemsA, null,
      'Array items removed for "' + (name || 'schema') + '"'
    ));
    return;
  }

  var typeA = itemsA.type || 'object';
  var typeB = itemsB.type || 'object';

  if (!itemsA._circular && !itemsB._circular) {
    if (rules.shouldCompare('properties') && itemsA.type !== itemsB.type) {
      diffs.push(createDiff(
        CATEGORIES.PROPERTY, CHANGE_TYPES.TYPE_CHANGED,
        baseLoc + '.items.type',
        itemsA.type, itemsB.type,
        'Array item type changed for "' + (name || 'schema') + '": ' + (itemsA.type || 'object') + ' → ' + (itemsB.type || 'object')
      ));
    }

    if (itemsA.type === 'object' || itemsB.type === 'object') {
      compareProperties(itemsA.properties, itemsB.properties, baseLoc + '.items', name, diffs, context);
    }
  }

  if (itemsA.$ref && itemsB.$ref && itemsA.$ref !== itemsB.$ref) {
    diffs.push(createDiff(
      CATEGORIES.PROPERTY, CHANGE_TYPES.MODIFIED,
      baseLoc + '.items.$ref',
      itemsA.$ref, itemsB.$ref,
      'Array item $ref changed for "' + (name || 'schema') + '": ' + itemsA.$ref + ' → ' + itemsB.$ref
    ));
  }
}

function compareAdditionalProperties(addA, addB, baseLoc, name, diffs) {
  if (deepEqual(addA, addB)) return;

  if (!addA && addB) {
    diffs.push(createDiff(
      CATEGORIES.PROPERTY, CHANGE_TYPES.ADDED,
      baseLoc + '.additionalProperties',
      null, addB,
      'Additional properties added for "' + (name || 'schema') + '"'
    ));
    return;
  }

  if (addA && !addB) {
    diffs.push(createDiff(
      CATEGORIES.PROPERTY, CHANGE_TYPES.REMOVED,
      baseLoc + '.additionalProperties',
      addA, null,
      'Additional properties removed for "' + (name || 'schema') + '"'
    ));
    return;
  }
}

module.exports = { compareSchemas, compareSchemaObjects, compareProperties };
