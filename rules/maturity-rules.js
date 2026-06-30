const RULES = [];

RULES.push({
  id: 'no-pagination',
  description: 'Collection endpoints should support pagination',
  category: 'performance',
  weight: -5,
  severity: 'medium',
  match: function(spec) {
    const results = [];
    for (const path of Object.keys(spec.paths || {})) {
      for (const method of Object.keys(spec.paths[path])) {
        if (method.toUpperCase() !== 'GET') continue;
        const op = spec.paths[path][method];
        const resp = Object.values(op.responses || {}).find(function(r) { return r.description && (String(r.description).includes('Successful') || String(r.description).includes('Created')); }) || {};
        const schema = resp.content && resp.content['application/json'] && resp.content['application/json'].schema;
        if (!schema || schema.type !== 'array') continue;
        const params = op.parameters || [];
        const hasPagination = params.some(function(p) { return p.name === 'page' || p.name === 'size' || p.name === 'offset' || p.name === 'limit'; });
        if (!hasPagination) results.push({ path: path, method: method });
      }
    }
    return results;
  }
});

RULES.push({
  id: 'only-200',
  description: 'Endpoints should define error responses for a complete API contract',
  category: 'security',
  weight: -4,
  severity: 'medium',
  match: function(spec) {
    const results = [];
    for (const path of Object.keys(spec.paths || {})) {
      for (const method of Object.keys(spec.paths[path])) {
        const op = spec.paths[path][method];
        const codes = Object.keys(op.responses || {});
        if (codes.length === 1 && codes[0] === '200') {
          results.push({ path: path, method: method });
        }
      }
    }
    return results;
  }
});

RULES.push({
  id: 'verb-in-path',
  description: 'URL paths should not contain verbs (REST uses HTTP methods)',
  category: 'restDesign',
  weight: -3,
  severity: 'info',
  match: function(spec) {
    const verbs = ['create', 'delete', 'get', 'set', 'update', 'add', 'remove', 'list', 'find', 'search'];
    const results = [];
    for (const path of Object.keys(spec.paths || {})) {
      const segments = path.split('/');
      const hasVerb = segments.some(function(s) {
        return verbs.indexOf(s.toLowerCase()) !== -1;
      });
      if (hasVerb) {
        for (const method of Object.keys(spec.paths[path])) {
          results.push({ path: path, method: method });
        }
      }
    }
    return results;
  }
});

RULES.push({
  id: 'no-error-body',
  description: 'Error responses should include a response body with error details',
  category: 'restDesign',
  weight: -2,
  severity: 'info',
  match: function(spec) {
    const results = [];
    for (const path of Object.keys(spec.paths || {})) {
      for (const method of Object.keys(spec.paths[path])) {
        const op = spec.paths[path][method];
        const errorCodes = Object.keys(op.responses || {}).filter(function(c) { return c.startsWith('4') || c.startsWith('5'); });
        for (const code of errorCodes) {
          const resp = op.responses[code];
          if (!resp.content) {
            results.push({ path: path, method: method });
            break;
          }
        }
      }
    }
    return results;
  }
});

RULES.push({
  id: 'missing-description',
  description: 'Endpoints should have a meaningful summary or description',
  category: 'documentation',
  weight: -3,
  severity: 'info',
  match: function(spec) {
    const results = [];
    for (const path of Object.keys(spec.paths || {})) {
      for (const method of Object.keys(spec.paths[path])) {
        const op = spec.paths[path][method];
        const summary = (op.summary || '').trim();
        const desc = (op.description || '').trim();
        if (!summary && !desc) {
          results.push({ path: path, method: method });
        }
      }
    }
    return results;
  }
});

RULES.push({
  id: 'dto-used',
  description: 'Endpoints use DTOs for request/response (good separation)',
  category: 'architecture',
  weight: 5,
  severity: 'info',
  match: function(spec) {
    const results = [];
    for (const path of Object.keys(spec.paths || {})) {
      for (const method of Object.keys(spec.paths[path])) {
        const op = spec.paths[path][method];
        let usesRef = false;
        if (op.requestBody && op.requestBody.content && op.requestBody.content['application/json']) {
          const schema = op.requestBody.content['application/json'].schema;
          if (schema && schema.$ref) usesRef = true;
        }
        if (!usesRef) {
          for (const code of Object.keys(op.responses || {})) {
            const resp = op.responses[code];
            if (resp.content && resp.content['application/json']) {
              const schema = resp.content['application/json'].schema;
              if (schema && schema.$ref) { usesRef = true; break; }
            }
          }
        }
        if (usesRef) results.push({ path: path, method: method });
      }
    }
    return results;
  }
});

RULES.push({
  id: 'no-request-body-on-get',
  description: 'GET endpoints should not have a request body',
  category: 'restDesign',
  weight: -3,
  severity: 'medium',
  match: function(spec) {
    const results = [];
    for (const path of Object.keys(spec.paths || {})) {
      for (const method of Object.keys(spec.paths[path])) {
        if (method.toUpperCase() === 'GET') {
          const op = spec.paths[path][method];
          if (op.requestBody) results.push({ path: path, method: method });
        }
      }
    }
    return results;
  }
});

RULES.push({
  id: 'inconsistent-tags',
  description: 'All endpoints should be tagged',
  category: 'documentation',
  weight: -2,
  severity: 'info',
  match: function(spec) {
    const results = [];
    for (const path of Object.keys(spec.paths || {})) {
      for (const method of Object.keys(spec.paths[path])) {
        const op = spec.paths[path][method];
        const tags = op.tags || [];
        if (tags.length === 0 || tags[0] === 'Other') {
          results.push({ path: path, method: method });
        }
      }
    }
    return results;
  }
});

RULES.push({
  id: 'no-delete-body',
  description: 'DELETE endpoints should not have a request body',
  category: 'restDesign',
  weight: -2,
  severity: 'info',
  match: function(spec) {
    const results = [];
    for (const path of Object.keys(spec.paths || {})) {
      for (const method of Object.keys(spec.paths[path])) {
        if (method.toUpperCase() === 'DELETE') {
          const op = spec.paths[path][method];
          if (op.requestBody) results.push({ path: path, method: method });
        }
      }
    }
    return results;
  }
});

module.exports = { RULES };
