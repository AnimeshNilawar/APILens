var path = require('path');
var { readJson, ensureDir, generateTimestamp } = require('../snapshot/snapshot-utils');
var { resetCounter } = require('./diff-model');
var { stripIgnoredFields, resolveAllRefs, indexPaths, indexSchemas, cloneDeep } = require('./diff-utils');
var { compareEndpoints } = require('./endpoint-diff');
var { compareSchemas } = require('./schema-diff');
var { compareSecurity } = require('./security-diff');
var { createRuleEngine } = require('./rules/rule-engine');

function compareSnapshots(snapshotDirA, snapshotDirB, options) {
  return compareSnapshotsAsync(snapshotDirA, snapshotDirB, options);
}

async function compareSnapshotsAsync(snapshotDirA, snapshotDirB, options) {
  options = options || {};

  console.log('  Loading Snapshot A: ' + snapshotDirA);
  var specA = await readJson(path.join(snapshotDirA, 'openapi.json'));

  console.log('  Loading Snapshot B: ' + snapshotDirB);
  var specB = await readJson(path.join(snapshotDirB, 'openapi.json'));

  return compareSpecs(specA, specB, options, snapshotDirA, snapshotDirB);
}

function compareSpecs(specA, specB, options, dirA, dirB) {
  options = options || {};
  resetCounter();

  var rules = createRuleEngine(options && options.configPath);
  var context = { rules: rules };

  var snapshotA = { id: 'unknown', generatedAt: '' };
  var snapshotB = { id: 'unknown', generatedAt: '' };

  if (dirA) {
    var partsA = dirA.replace(/\\/g, '/').split('/');
    snapshotA.id = partsA[partsA.length - 1];
  }
  if (dirB) {
    var partsB = dirB.replace(/\\/g, '/').split('/');
    snapshotB.id = partsB[partsB.length - 1];
  }

  console.log('  Indexing OpenAPI specifications...');

  specA = cloneDeep(specA);
  specB = cloneDeep(specB);

  var depData = buildDependencyData(specA, specB);

  stripIgnoredFields(specA, function (key) { return context.rules.matchesIgnore(key); });
  stripIgnoredFields(specB, function (key) { return context.rules.matchesIgnore(key); });

  console.log('  Resolving $ref references...');
  specA = resolveAllRefs(specA);
  specB = resolveAllRefs(specB);

  console.log('  Comparing endpoints...');
  var endpointChanges = compareEndpoints(specA, specB, context);

  var schemasA = indexSchemas(specA);
  var schemasB = indexSchemas(specB);

  console.log('  Comparing schemas...');
  var schemaChanges = compareSchemas(schemasA, schemasB, context);

  console.log('  Comparing security definitions...');
  var securityChanges = compareSecurity(specA, specB, context);

  var allChanges = endpointChanges.concat(schemaChanges).concat(securityChanges);

  allChanges.sort(function(a, b) {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.id.localeCompare(b.id);
  });

  console.log('  Building statistics...');
  var stats = computeStatistics(allChanges);

  var report = {
    snapshotA: snapshotA,
    snapshotB: snapshotB,
    generatedAt: new Date().toISOString(),
    statistics: stats,
    changes: allChanges,
    _dependency: depData,
  };

  return report;
}

function computeStatistics(changes) {
  var stats = {
    total: 0,
    added: 0,
    removed: 0,
    modified: 0,
    changedPaths: 0,
    changedSchemas: 0,
    changedResponses: 0,
    changedParameters: 0,
    changedRequestBodies: 0,
    changedEnums: 0,
    changedSecurity: 0,
  };

  for (var i = 0; i < changes.length; i++) {
    var c = changes[i];
    stats.total++;

    if (c.changeType === 'ADDED') stats.added++;
    else if (c.changeType === 'REMOVED') stats.removed++;
    else stats.modified++;

    switch (c.category) {
      case 'PATH': stats.changedPaths++; break;
      case 'ENDPOINT': stats.changedPaths++; break;
      case 'SCHEMA': stats.changedSchemas++; break;
      case 'PROPERTY': stats.changedSchemas++; break;
      case 'RESPONSE': stats.changedResponses++; break;
      case 'PARAMETER': stats.changedParameters++; break;
      case 'REQUEST_BODY': stats.changedRequestBodies++; break;
      case 'ENUM': stats.changedEnums++; break;
      case 'SECURITY': stats.changedSecurity++; break;
    }
  }

  return stats;
}

function buildDependencyData(specA, specB) {
  var classesA = (specA && specA['x-classes']) || {};
  var classesB = (specB && specB['x-classes']) || {};
  var depsA = (specA && specA['x-dependencies']) || [];
  var depsB = (specB && specB['x-dependencies']) || [];

  var mergedClasses = JSON.parse(JSON.stringify(classesA));
  for (var name in classesB) {
    if (classesB.hasOwnProperty(name) && !mergedClasses[name]) {
      mergedClasses[name] = classesB[name];
    }
  }

  var mergedDeps = depsA.slice();
  for (var i = 0; i < depsB.length; i++) {
    var found = false;
    for (var j = 0; j < mergedDeps.length; j++) {
      if (mergedDeps[j].from === depsB[i].from && mergedDeps[j].to === depsB[i].to) {
        found = true; break;
      }
    }
    if (!found) mergedDeps.push(depsB[i]);
  }

  return { classes: mergedClasses, dependencies: mergedDeps };
}

module.exports = { compareSnapshots, compareSpecs };
