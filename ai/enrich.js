var AIProvider = require('./provider').AIProvider;
var AICache = require('./cache').AICache;
var fs = require('fs');
var path = require('path');

function loadDotEnv() {
  try {
    var envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;
    var lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line || line.startsWith('#') || !line.includes('=')) continue;
      var eq = line.indexOf('=');
      var key = line.substring(0, eq).trim();
      var val = line.substring(eq + 1).trim();
      if (key && val && !process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch (e) {}
}

function extractControllerMetadata(spec) {
  var paths = spec.paths || {};
  var tagMap = {};

  for (var path in paths) {
    for (var method in paths[path]) {
      var op = paths[path][method];
      var tag = (op.tags && op.tags[0]) || 'Other';
      if (!tagMap[tag]) {
        tagMap[tag] = { base: '', endpoints: [] };
      }
      tagMap[tag].endpoints.push({
        operationId: op.operationId || '',
        method: method.toUpperCase(),
        path: path,
        parameters: op.parameters || [],
        responses: op.responses || {},
        flow: op['x-flow'] || '',
      });
    }
  }

  for (var tag in tagMap) {
    var eps = tagMap[tag].endpoints;
    if (eps.length > 0) {
      var firstPath = eps[0].path;
      var parts = firstPath.split('/');
      tagMap[tag].base = parts.slice(0, -1).join('/') || '/';
    }
  }

  return tagMap;
}

async function enrichSpec(spec) {
  loadDotEnv();
  var apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return spec;

  var provider = AIProvider.create('gemini', apiKey);
  var cache = new AICache();
  var tagMetadata = extractControllerMetadata(spec);

  var enrichment = {};

  var tagEntries = Object.entries(tagMetadata);
  for (var ti = 0; ti < tagEntries.length; ti++) {
    var tag = tagEntries[ti][0];
    var meta = tagEntries[ti][1];

    var cachePayload = {
      tag: tag,
      endpoints: meta.endpoints.map(function(e) {
        return {
          operationId: e.operationId,
          method: e.method,
          path: e.path,
          params: (e.parameters || []).map(function(p) { return { name: p.name, type: p.type, in: p.in }; }),
          responses: Object.keys(e.responses || {}).sort(),
        };
      }),
    };

    var cacheKey = cache.key(cachePayload);
    var cached = cache.get(cacheKey);

    if (cached) {
      enrichment[tag] = cached;
      console.log('  AI cache hit: ' + tag);
      continue;
    }

    try {
      console.log('  AI generating for: ' + tag + '...');
      var result = await provider.enrichController(tag, meta.base, meta.endpoints);
      enrichment[tag] = result;
      cache.set(cacheKey, result);
      console.log('  AI done: ' + tag);
    } catch (err) {
      console.warn('  \u26A0 AI enrichment failed for ' + tag + ': ' + err.message);
    }
  }

  if (Object.keys(enrichment).length === 0) return spec;

  if (spec.tags) {
    for (var tgi = 0; tgi < spec.tags.length; tgi++) {
      var tagObj = spec.tags[tgi];
      var name = tagObj.name;
      if (enrichment[name] && enrichment[name].controllerSummary) {
        tagObj.description = enrichment[name].controllerSummary;
      }
    }
  }

  for (var path in spec.paths) {
    for (var method in spec.paths[path]) {
      var op = spec.paths[path][method];
      var epTag = (op.tags && op.tags[0]) || 'Other';
      var opId = op.operationId;
      if (enrichment[epTag] && enrichment[epTag].endpoints && enrichment[epTag].endpoints[opId]) {
        var enrich = enrichment[epTag].endpoints[opId];
        op.description = enrich.description || op.description;
        op['x-explanation'] = enrich.explanation || '';
        op['x-useCase'] = enrich.useCase || '';
        op['x-possibleErrors'] = enrich.possibleErrors || [];
        op['x-confidence'] = enrich.confidence || null;
        op['x-bestPractices'] = enrich.bestPractices || [];
        op['x-warnings'] = enrich.warnings || [];
      }
    }
  }

  return spec;
}

module.exports = { enrichSpec };
