function cloneDeep(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cloneDeep);
  var result = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) result[key] = cloneDeep(obj[key]);
  }
  return result;
}

function stripIgnoredFields(obj, shouldIgnoreFn) {
  shouldIgnoreFn = shouldIgnoreFn || function () { return false; };
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    for (var i = 0; i < obj.length; i++) {
      stripIgnoredFields(obj[i], shouldIgnoreFn);
    }
    return obj;
  }

  for (var key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    if (shouldIgnoreFn(key)) {
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      stripIgnoredFields(obj[key], shouldIgnoreFn);
    }
  }
  return obj;
}

function resolveAllRefs(spec) {
  var cache = {};
  var resolving = [];

  function resolveRef(refPath, root) {
    if (cache[refPath] !== undefined) return cache[refPath];

    if (resolving.indexOf(refPath) !== -1) {
      return { _circular: true, $ref: refPath };
    }

    resolving.push(refPath);

    var parts = refPath.replace('#/', '').split('/');
    var current = root;
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i].replace(/~1/g, '/').replace(/~0/g, '~');
      if (current && typeof current === 'object' && current[part] !== undefined) {
        current = current[part];
      } else {
        resolving.pop();
        return null;
      }
    }

    var resolved = cloneDeep(current);

    if (resolved && typeof resolved === 'object' && !resolved._circular) {
      resolved = resolveNestedRefs(resolved, root);
    }

    var idx = resolving.indexOf(refPath);
    if (idx !== -1) resolving.splice(idx, 1);

    cache[refPath] = resolved;
    return resolved;
  }

  function resolveNestedRefs(obj, root) {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      for (var i = 0; i < obj.length; i++) {
        obj[i] = resolveNestedRefs(obj[i], root);
      }
      return obj;
    }

    if (obj.$ref && typeof obj.$ref === 'string') {
      var resolved = resolveRef(obj.$ref, root);
      if (resolved) {
        if (resolved._circular) return resolved;
        var merged = cloneDeep(resolved);
        for (var key in obj) {
          if (key !== '$ref' && obj.hasOwnProperty(key)) {
            merged[key] = resolveNestedRefs(obj[key], root);
          }
        }
        return merged;
      }
      return obj;
    }

    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        obj[key] = resolveNestedRefs(obj[key], root);
      }
    }
    return obj;
  }

  var result = cloneDeep(spec);
  result = resolveNestedRefs(result, result);
  return result;
}

function indexPaths(spec) {
  var map = {};
  var paths = spec.paths || {};
  for (var path in paths) {
    for (var method in paths[path]) {
      var key = method.toUpperCase() + ':' + path;
      map[key] = paths[path][method];
    }
  }
  return map;
}

function indexSchemas(spec) {
  var schemas = (spec.components && spec.components.schemas) || {};
  var map = {};
  for (var name in schemas) {
    if (schemas.hasOwnProperty(name)) map[name] = schemas[name];
  }
  return map;
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return a === b;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  var keysA = Object.keys(a).sort();
  var keysB = Object.keys(b).sort();
  if (keysA.length !== keysB.length) return false;
  for (var i = 0; i < keysA.length; i++) {
    if (keysA[i] !== keysB[i]) return false;
    if (!deepEqual(a[keysA[i]], b[keysB[i]])) return false;
  }
  return true;
}

function extendObj(target) {
  for (var i = 1; i < arguments.length; i++) {
    var src = arguments[i];
    if (src) {
      for (var key in src) {
        if (src.hasOwnProperty(key)) target[key] = src[key];
      }
    }
  }
  return target;
}

module.exports = {
  cloneDeep: cloneDeep,
  stripIgnoredFields: stripIgnoredFields,
  resolveAllRefs: resolveAllRefs,
  indexPaths: indexPaths,
  indexSchemas: indexSchemas,
  deepEqual: deepEqual,
  extendObj: extendObj,
};
