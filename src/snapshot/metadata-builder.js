const path = require('path');

function countEndpoints(spec) {
  const paths = spec.paths || {};
  let count = 0;
  for (const p of Object.keys(paths)) {
    count += Object.keys(paths[p]).length;
  }
  return count;
}

function countSchemas(spec) {
  const schemas = spec.components && spec.components.schemas;
  return schemas ? Object.keys(schemas).length : 0;
}

function checkAiEnabled(spec) {
  const paths = spec.paths || {};
  for (const p of Object.keys(paths)) {
    for (const m of Object.keys(paths[p])) {
      if (paths[p][m]['x-explanation']) return true;
    }
  }
  return false;
}

function buildMetadata(snapshotId, spec, options) {
  options = options || {};

  const pkg = { version: '1.0.0' };
  try {
    const pkgPath = path.join(__dirname, '..', '..', 'package.json');
    Object.assign(pkg, require(pkgPath));
  } catch (e) {}

  return {
    snapshotId: snapshotId,
    generatedAt: new Date().toISOString(),
    generatorVersion: pkg.version || '0.0.0',
    projectName: options.projectName || (spec.info && spec.info.title) || 'untitled',
    specVersion: spec.openapi || '3.0.3',
    totalEndpoints: countEndpoints(spec),
    totalSchemas: countSchemas(spec),
    aiEnabled: checkAiEnabled(spec),
    maturityEnabled: !!spec['x-maturity'],
  };
}

module.exports = { buildMetadata };
