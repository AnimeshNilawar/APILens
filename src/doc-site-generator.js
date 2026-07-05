const fs = require('fs');
const path = require('path');

const METHOD_COLORS = {
    GET: { bg: '#1b5e20', text: '#a5d6a7' },
    POST: { bg: '#0d47a1', text: '#90caf9' },
    PUT: { bg: '#e65100', text: '#ffcc80' },
    DELETE: { bg: '#b71c1c', text: '#ef9a9a' },
    PATCH: { bg: '#4a148c', text: '#ce93d8' },
};

const METHOD_BADGE_CSS = Object.entries(METHOD_COLORS)
    .map(([m, c]) => `.method-${m.toLowerCase()}{background:${c.bg};color:${c.text}}`)
    .join('');

const CSS = `*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,sans-serif;background:#1e1e1e;color:#d4d4d4;margin:0}
.navbar{display:flex;align-items:center;justify-content:space-between;height:44px;padding:0 20px;background:#1e1e1e;border-bottom:1px solid #3c3c3c;flex-shrink:0}
.navbar .nav-title{font-size:13px;color:#888;display:flex;align-items:center;gap:8px}
.navbar .nav-title strong{color:#e0e0e0}
.navbar .nav-links{display:flex;align-items:center;gap:16px}
.navbar .nav-links a{color:#888;font-size:13px;text-decoration:none;padding:4px 8px;border-radius:4px;transition:color .2s,background .2s}
.navbar .nav-links a:hover{color:#d4d4d4;background:#2d2d2d}
#app{display:flex;flex-direction:column;min-height:100vh}
#app .app-body{display:flex;flex:1;min-height:0}
#app .app-body aside{width:300px;min-width:300px;background:#252526;border-right:1px solid #3c3c3c;overflow-y:auto;height:calc(100vh - 44px);position:sticky;top:44px;display:flex;flex-direction:column}
#app aside .header{padding:16px;border-bottom:1px solid #3c3c3c}
#app aside .header h1{font-size:16px;font-weight:600;color:#e0e0e0}
#app aside .header .subtitle{font-size:12px;color:#888;margin-top:2px}
#search{margin:12px 16px;padding:8px 12px;border:1px solid #3c3c3c;border-radius:6px;background:#3c3c3c;color:#d4d4d4;font-size:13px;outline:none;transition:border-color .2s}
#search:focus{border-color:#569cd6}
#search::placeholder{color:#888}
.sidebar-tag{margin-bottom:4px}
.sidebar-tag-header{padding:4px 16px;font-size:11px;font-weight:600;text-transform:uppercase;color:#888;letter-spacing:.5px;cursor:pointer;user-select:none}
.sidebar-tag-header:hover{color:#aaa}
.sidebar-endpoint{display:flex;align-items:center;gap:8px;padding:6px 16px 6px 24px;cursor:pointer;font-size:13px;transition:background .15s;text-decoration:none;color:#d4d4d4}
.sidebar-endpoint:hover{background:#2d2d2d}
.sidebar-endpoint .method-badge{font-size:10px;font-weight:700;padding:1px 6px;border-radius:3px;text-transform:uppercase;min-width:44px;text-align:center}
.sidebar-endpoint .path-text{color:#9a9a9a;font-family:'SF Mono','Fira Code','Consolas',monospace;font-size:12px}
#app .app-body main{flex:1;padding:32px 48px;max-width:960px;overflow-y:auto}
.stats{display:flex;gap:24px;margin-bottom:32px}
.stat-card{background:#252526;border:1px solid #3c3c3c;border-radius:8px;padding:16px 24px;flex:1}
.stat-card .stat-value{font-size:28px;font-weight:700;color:#e0e0e0}
.stat-card .stat-label{font-size:13px;color:#888;margin-top:2px}
h2{font-size:18px;font-weight:600;color:#e0e0e0;margin:32px 0 16px;padding-bottom:8px;border-bottom:1px solid #3c3c3c}
.endpoint-card{background:#252526;border:1px solid #3c3c3c;border-radius:8px;margin-bottom:16px;overflow:hidden}
.endpoint-card .endpoint-header{display:flex;align-items:center;gap:12px;padding:14px 20px;cursor:pointer;user-select:none}
.endpoint-card .endpoint-header:hover{background:#2a2a2a}
.endpoint-card .method-badge{font-size:12px;font-weight:700;padding:3px 10px;border-radius:4px;text-transform:uppercase;min-width:52px;text-align:center}
.endpoint-card .endpoint-path{font-family:'SF Mono','Fira Code','Consolas',monospace;font-size:14px;font-weight:500}
.endpoint-card .endpoint-summary{font-size:13px;color:#888;margin-left:auto}
.endpoint-body{padding:0 20px 20px;display:none;border-top:1px solid #3c3c3c}
.endpoint-body.open{display:block}
.section-label{font-size:13px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.5px;margin:16px 0 8px}
.param-table{width:100%;border-collapse:collapse;margin-bottom:8px}
.param-table th,.param-table td{text-align:left;padding:6px 12px;font-size:13px;border-bottom:1px solid #3c3c3c}
.param-table th{color:#888;font-weight:500;text-transform:uppercase;font-size:11px;letter-spacing:.5px}
.param-table td{font-family:'SF Mono','Fira Code','Consolas',monospace;font-size:12px;color:#ce9178}
.code-block{background:#1a1a1a;border:1px solid #3c3c3c;border-radius:6px;padding:12px 16px;font-family:'SF Mono','Fira Code','Consolas',monospace;font-size:12px;line-height:1.6;overflow-x:auto;white-space:pre;margin-bottom:16px;position:relative}
.code-block .copy-btn{position:absolute;top:8px;right:8px;background:0 0;border:1px solid #3c3c3c;color:#888;padding:4px 8px;border-radius:4px;font-size:11px;cursor:pointer;opacity:0;transition:opacity .2s}
.code-block:hover .copy-btn{opacity:1}
.code-block .copy-btn:hover{background:#3c3c3c;color:#d4d4d4}
.code-block .key{color:#7ec699}
.code-block .string{color:#ce9178}
.code-block .number{color:#b5cea8}
.code-block .boolean{color:#569cd6}
.code-block .null{color:#888}
.curl-block{background:#1a1a1a;border:1px solid #3c3c3c;border-radius:6px;padding:12px 16px;font-family:'SF Mono','Fira Code','Consolas',monospace;font-size:12px;line-height:1.6;overflow-x:auto;white-space:pre;margin-bottom:16px;position:relative}
.curl-block:hover .copy-btn{opacity:1}
.tab-bar{display:flex;gap:0;border-bottom:1px solid #3c3c3c;margin:12px 0}
.tab-btn{padding:8px 16px;background:0 0;border:none;border-bottom:2px solid transparent;color:#888;cursor:pointer;font-size:13px;font-family:inherit}
.tab-btn.active{color:#d4d4d4;border-bottom-color:#569cd6}
.tab-panel{display:none}
.tab-panel.active{display:block}
.schema-card{background:#252526;border:1px solid #3c3c3c;border-radius:8px;margin-bottom:12px;overflow:hidden}
.schema-card .schema-header{display:flex;align-items:center;gap:12px;padding:12px 20px;cursor:pointer;user-select:none}
.schema-card .schema-header:hover{background:#2a2a2a}
.schema-card .schema-header h3{font-size:14px;font-weight:600}
.schema-card .schema-body{padding:0 20px 16px;display:none;border-top:1px solid #3c3c3c}
.schema-card .schema-body.open{display:block}
.highlight>pre{background:#1a1a1a!important}
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#3c3c3c;border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:#555}
a{color:#569cd6;text-decoration:none}
.mermaid{background:#252526;border:1px solid #3c3c3c;border-radius:8px;padding:20px;margin-bottom:16px;overflow-x:auto}
.flow-block{background:#1a1a1a;border:1px solid #3c3c3c;border-radius:6px;padding:12px 16px;font-family:'SF Mono','Fira Code','Consolas',monospace;font-size:13px;line-height:2;margin-bottom:16px;white-space:pre}
.flow-arrow{color:#569cd6;font-size:16px}
.ai-divider{display:flex;align-items:center;margin:16px 0 12px;color:#555;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px}
.ai-divider::before,.ai-divider::after{content:'';flex:1;height:1px;background:#3c3c3c}
.ai-divider span{padding:0 12px}
.ai-description{font-size:14px;color:#e0e0e0;margin:8px 0 4px;line-height:1.5;display:inline}
.ai-confidence{display:inline-block;font-size:11px;color:#888;background:#2d2d2d;border:1px solid #3c3c3c;border-radius:4px;padding:2px 8px;margin-left:8px;vertical-align:middle}
.ai-explanation{font-size:13px;color:#888;margin-bottom:8px;font-style:italic}
.ai-use-case{font-size:13px;color:#9a9a9a;margin-bottom:8px;line-height:1.4}
.ai-label{color:#888;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:.5px;margin:10px 0 4px;display:block}
.ai-errors{margin:4px 0 8px}
.ai-error-item{font-size:12px;color:#ef9a9a;padding:2px 0}
.ai-practices{margin:4px 0 8px}
.ai-practice-item{font-size:12px;color:#a5d6a7;padding:2px 0}
.ai-why-text{font-size:11px;color:#666;display:block;padding:0 0 4px 14px;line-height:1.4}
.review-card{border:1px solid #3c3c3c;border-radius:6px;padding:12px;margin-bottom:8px}
.review-severity-high{border-left:3px solid #f17070}
.review-severity-medium{border-left:3px solid #dba638}
.review-severity-info{border-left:3px solid #6ab0f3}
.review-header{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.review-category{font-size:11px;font-weight:600;text-transform:uppercase;color:#888}
.review-severity-badge{font-size:10px;font-weight:700;padding:1px 6px;border-radius:3px;text-transform:uppercase;letter-spacing:.5px}
.review-severity-high .review-severity-badge{background:#5c1a1a;color:#f17070}
.review-severity-medium .review-severity-badge{background:#5c3a00;color:#dba638}
.review-severity-info .review-severity-badge{background:#0d2d5c;color:#6ab0f3}
.review-message{font-size:13px;color:#d4d4d4;margin-bottom:4px}
.review-why{font-size:12px;color:#888;margin-bottom:2px;line-height:1.4}
.review-recommendation{font-size:12px;color:#7ec699;line-height:1.4}
.no-issues{font-size:12px;color:#5a5;margin:8px 0}
.ai-warnings{margin:4px 0 8px}
.tag-description{font-size:11px;color:#888;padding:2px 16px 8px;line-height:1.4}
.maturity-dashboard{background:#252526;border:1px solid #3c3c3c;border-radius:8px;padding:20px;margin-bottom:24px;display:flex;flex-direction:column;gap:16px}
.maturity-header{font-size:18px;font-weight:600;color:#e0e0e0}
.maturity-overall{display:flex;align-items:baseline;gap:8px;justify-content:center;padding:16px 0}
.maturity-overall-score{font-size:64px;font-weight:700;color:#7ec699;line-height:1}
.maturity-overall-label{font-size:24px;color:#555}
.maturity-bars{display:flex;flex-direction:column;gap:8px}
.maturity-bar{display:flex;align-items:center;gap:12px;cursor:pointer;padding:4px 8px;border-radius:4px;transition:background .15s}
.maturity-bar:hover{background:#2d2d2d}
.maturity-bar-label{font-size:12px;font-weight:600;text-transform:uppercase;color:#888;width:120px;text-align:right;flex-shrink:0}
.maturity-bar-track{flex:1;height:8px;background:#3c3c3c;border-radius:4px;overflow:hidden}
.maturity-bar-fill{height:100%;border-radius:4px;transition:width .5s}
.maturity-bar-fill.high{background:#7ec699}
.maturity-bar-fill.medium{background:#dba638}
.maturity-bar-fill.low{background:#f17070}
.maturity-bar-score{font-size:14px;font-weight:700;color:#e0e0e0;width:32px;text-align:right;flex-shrink:0}
.maturity-issues{display:flex;gap:16px;justify-content:center;padding-top:8px;border-top:1px solid #3c3c3c}
.maturity-issue{font-size:13px;padding:4px 12px;border-radius:4px}
.maturity-issue-critical{background:#5c1a1a;color:#f17070}
.maturity-issue-warning{background:#5c3a00;color:#dba638}
.maturity-issue-info{background:#0d2d5c;color:#6ab0f3}
.impact-panel-backdrop{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.4);z-index:99;display:none}
.impact-panel{position:fixed;top:0;right:-400px;width:380px;height:100%;background:#252526;border-left:1px solid #3c3c3c;z-index:100;overflow-y:auto;transition:right .3s;padding:20px}
.impact-panel.open{right:0}
.impact-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid #3c3c3c}
.impact-header h3{font-size:16px;font-weight:600;color:#e0e0e0;margin:0}
.impact-header button{background:0 0;border:1px solid #3c3c3c;color:#888;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:14px}
.impact-header button:hover{background:#3c3c3c;color:#d4d4d4}
.impact-section{margin-bottom:16px}
.impact-class{display:flex;align-items:center;gap:8px;padding:6px 8px;font-size:13px;color:#d4d4d4}
.impact-stereotype{font-size:10px;font-weight:700;padding:2px 6px;border-radius:3px;text-transform:uppercase;min-width:60px;text-align:center}
.impact-stereotype.impact-controller{background:#1b5e20;color:#a5d6a7}
.impact-stereotype.impact-service{background:#0d47a1;color:#90caf9}
.impact-stereotype.impact-repository{background:#4a148c;color:#ce93d8}
.impact-stereotype.impact-entity{background:#e65100;color:#ffcc80}
.impact-stereotype.impact-config{background:#444;color:#999}
.impact-endpoint{display:flex;align-items:center;gap:8px;padding:6px 8px;font-size:12px;color:#569cd6;cursor:pointer;border-radius:4px;font-family:'SF Mono','Fira Code','Consolas',monospace}
.impact-endpoint:hover{background:#2d2d2d}
.dep-search{margin:8px 0;padding:6px 10px;border:1px solid #3c3c3c;border-radius:6px;background:#3c3c3c;color:#d4d4d4;font-size:12px;outline:none;width:100%}
.dep-search:focus{border-color:#569cd6}
.dep-search::placeholder{color:#888}
.mermaid svg .node{cursor:pointer}`;

const APP_JS = `
(function(){
  var specEl = document.getElementById('spec-data');
  var spec = specEl ? JSON.parse(specEl.textContent) : null;
  if (!spec) { document.getElementById('app').innerHTML = '<p style="padding:32px;color:#888">No OpenAPI spec found.</p>'; return; }

  var paths = spec.paths || {};
  var schemas = (spec.components && spec.components.schemas) || {};
  var tags = spec.tags || [];

  var endpoints = [];
  for (var p in paths) {
    for (var m in paths[p]) {
      var op = paths[p][m];
      endpoints.push({ path: p, method: m.toUpperCase(), operation: op });
    }
  }
  endpoints.sort(function(a,b){ return a.path.localeCompare(b.path) || a.method.localeCompare(b.method); });

  var grouped = {};
  for (var i = 0; i < endpoints.length; i++) {
    var ep = endpoints[i];
    var tag = (ep.operation.tags && ep.operation.tags[0]) || 'Other';
    if (!grouped[tag]) grouped[tag] = [];
    grouped[tag].push(ep);
  }

  function methodColor(m) {
    var c = { GET: '#a5d6a7', POST: '#90caf9', PUT: '#ffcc80', DELETE: '#ef9a9a', PATCH: '#ce93d8' };
    return c[m] || '#888';
  }
  function methodBg(m) {
    var c = { GET: '#1b5e20', POST: '#0d47a1', PUT: '#e65100', DELETE: '#b71c1c', PATCH: '#4a148c' };
    return c[m] || '#3c3c3c';
  }

  window.copyText = function(btn) {
    var text = btn.parentNode.innerText.replace(/Copy$/, '').trim();
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
    btn.textContent = 'Copied!';
    setTimeout(function(){ btn.textContent = 'Copy'; }, 2000);
  };

  function esc(str) {
    return ('' + str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function highlightJSON(obj) {
    var raw = JSON.stringify(obj, null, 2);
    return highlightJSONRaw(raw);
  }

  function highlightJSONRaw(raw) {
    return esc(raw)
      .replace(/(&quot;(?:\\[^]|.)*?&quot;)\s*:/g, '<span class="key">$1</span>:')
      .replace(/&quot;((?:\\[^]|.)*?)&quot;/g, '<span class="string">&quot;$1&quot;</span>')
      .replace(/\\b(-?\\d+\\.?\\d*)\\b/g, '<span class="number">$1</span>')
      .replace(/\\b(true|false)\\b/g, '<span class="boolean">$1</span>')
      .replace(/\\bnull\\b/g, '<span class="null">null</span>');
  }

  function getExample(schema) {
    if (!schema) return null;
    if (schema.example !== undefined) return schema.example;
    if (schema.$ref) {
      var name = schema.$ref.split('/').pop();
      return schemas[name] ? (schemas[name].example || null) : null;
    }
    if (schema.type === 'array' && schema.items) {
      var item = getExample(schema.items);
      return item !== null ? [item] : [];
    }
    if (schema.type === 'object') return {};
    if (schema.type === 'string') return 'example';
    if (schema.type === 'integer') return 1;
    if (schema.type === 'number') return 3.14;
    if (schema.type === 'boolean') return true;
    return null;
  }

  function getRequestBodyExample(operation) {
    var rb = operation.requestBody;
    if (!rb) return null;
    var content = rb.content && rb.content['application/json'];
    if (!content) return null;
    return getExample(content.schema);
  }

  function curlExample(ep) {
    var base = 'http://localhost:8080';
    var url = ep.path;
    var pathParams = (ep.operation.parameters || []).filter(function(p){ return p.in === 'path'; });
    for (var i = 0; i < pathParams.length; i++) {
      var pname = pathParams[i].name;
      var val = (pathParams[i].schema && pathParams[i].schema.type === 'integer') ? '1' : pname + '-example';
      url = url.replace('{' + pname + '}', val);
    }
    var cmd = 'curl -X ' + ep.method + ' ' + base + url;
    var bodyExample = getRequestBodyExample(ep.operation);
    if (bodyExample !== null) {
      var bodyStr = JSON.stringify(bodyExample, null, 2);
      cmd += ' \\\\\\n  -H "Content-Type: application/json" \\\\\\n  -d \\'' + bodyStr + '\\'';
    }
    return cmd;
  }

  function paramsTable(params, label) {
    if (!params || params.length === 0) return '';
    var rows = '';
    for (var i = 0; i < params.length; i++) {
      var p = params[i];
      rows += '<tr><td>' + esc(p.name) + '</td><td>' + esc(p.in) + '</td><td>' + esc(p.required ? 'required' : 'optional') + '</td><td>' + esc((p.schema && p.schema.type) || 'string') + '</td></tr>';
    }
    return '<div class="section-label">' + label + '</div><table class="param-table"><tr><th>Name</th><th>In</th><th>Required</th><th>Type</th></tr>' + rows + '</table>';
  }

  function selectEp(path, method) {
    var cards = document.querySelectorAll('.endpoint-card');
    for (var i = 0; i < cards.length; i++) {
      var d = cards[i].dataset;
      if (d.path === path && d.method === method) {
        var body = cards[i].querySelector('.endpoint-body');
        if (body) {
          body.classList.add('open');
          cards[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        break;
      }
    }
  }
  window.selectEp = selectEp;

  window.switchTab = function(btn, name) {
    var body = btn.closest('.endpoint-body');
    var tabs = body.querySelectorAll('.tab-btn');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
    var panels = body.querySelectorAll('.tab-panel');
    for (var i = 0; i < panels.length; i++) panels[i].classList.remove('active');
    btn.classList.add('active');
    var panel = body.querySelector('[data-panel="' + name + '"]');
    if (panel) panel.classList.add('active');
  };

  window.selectSchema = function(name) {
    var cards = document.querySelectorAll('.schema-card');
    for (var i = 0; i < cards.length; i++) {
      var d = cards[i].querySelector('h3');
      if (d && d.textContent === name) {
        var body = cards[i].querySelector('.schema-body');
        if (body) {
          body.classList.add('open');
          cards[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        break;
      }
    }
  };

  function computeImpact(className) {
    var deps = spec['x-dependencies'] || [];
    var classes = spec['x-classes'] || {};
    var affectedClasses = [];
    for (var di = 0; di < deps.length; di++) {
      if (deps[di].to === className) {
        var info = classes[deps[di].from] || {};
        affectedClasses.push({ className: deps[di].from, stereotype: info.stereotype || 'other' });
      }
    }
    var controllers = [];
    for (var ci = 0; ci < affectedClasses.length; ci++) {
      if (affectedClasses[ci].stereotype === 'controller') controllers.push(affectedClasses[ci].className);
    }
    var affectedEndpoints = [];
    for (var p in spec.paths) {
      for (var m in spec.paths[p]) {
        var op = spec.paths[p][m];
        var epTag = (op.tags || [])[0];
        if (controllers.indexOf(epTag) !== -1) {
          affectedEndpoints.push({ path: p, method: m.toUpperCase(), operationId: op.operationId });
        }
      }
    }
    var affectedSchemas = [];
    var schemaNames = Object.keys(spec.components && spec.components.schemas || {});
    for (var si = 0; si < schemaNames.length; si++) {
      if (schemaNames[si] === className) { affectedSchemas.push(schemaNames[si]); continue; }
      var props = (spec.components.schemas[schemaNames[si]] || {}).properties || {};
      var hasRef = false;
      for (var pk in props) {
        var ref = props[pk].$ref || '';
        if (ref.indexOf('/' + className) !== -1) { hasRef = true; break; }
      }
      if (hasRef) affectedSchemas.push(schemaNames[si]);
    }
    return {
      className: className,
      affectedClasses: affectedClasses,
      affectedEndpoints: affectedEndpoints,
      affectedSchemas: affectedSchemas,
      endpointCount: affectedEndpoints.length,
    };
  }

  window.selectDepNode = function(className) {
    var svg = document.querySelector('.mermaid svg');
    if (!svg) return;
    var nodes = svg.querySelectorAll('.node');
    var deps = spec['x-dependencies'] || [];
    var neighbors = {};
    for (var di = 0; di < deps.length; di++) {
      if (deps[di].from === className) neighbors[deps[di].to] = true;
      if (deps[di].to === className) neighbors[deps[di].from] = true;
    }

    // First pass: lazily store originals and restore all nodes
    for (var ni = 0; ni < nodes.length; ni++) {
      var rect = nodes[ni].querySelector('rect');
      if (!rect) continue;
      if (!nodes[ni].dataset.origStroke) {
        nodes[ni].dataset.origStroke = rect.getAttribute('stroke') || '#3c3c3c';
        nodes[ni].dataset.origWidth = rect.getAttribute('stroke-width') || '1';
      }
      rect.setAttribute('stroke', nodes[ni].dataset.origStroke);
      rect.setAttribute('stroke-width', nodes[ni].dataset.origWidth);
      nodes[ni].style.opacity = '1';
    }

    // Second pass: highlight matching node and its neighbors
    for (var ni = 0; ni < nodes.length; ni++) {
      var name = getNodeName(nodes[ni]);
      if (!name) continue;
      var isMatch = name === className;
      var isNeighbor = neighbors[name];
      if (!isMatch && !isNeighbor) {
        nodes[ni].style.opacity = '0.3';
        continue;
      }
      var rect = nodes[ni].querySelector('rect');
      if (rect) {
        if (isMatch) {
          rect.setAttribute('stroke', '#569cd6');
          rect.setAttribute('stroke-width', '3');
        } else if (isNeighbor) {
          rect.setAttribute('stroke', '#dba638');
          rect.setAttribute('stroke-width', '2');
        }
      }
      nodes[ni].style.opacity = '1';
    }
    var impact = computeImpact(className);
    window.impactPanel('open', impact);
  };

  window.impactPanel = function(action, data) {
    var panel = document.getElementById('impact-panel');
    var backdrop = document.getElementById('impact-backdrop');
    if (!panel) return;
    if (action === 'close') {
      panel.classList.remove('open');
      if (backdrop) backdrop.style.display = 'none';
      return;
    }
    if (!data) return;
    var html = '<div class="impact-header"><h3>' + esc(data.className) + '</h3><button onclick="impactPanel(\\'close\\')">\u2716</button></div>';
    html += '<div class="impact-section"><div class="section-label">Affected Classes</div>';
    for (var ci = 0; ci < data.affectedClasses.length; ci++) {
      var st = data.affectedClasses[ci].stereotype || 'other';
      html += '<div class="impact-class"><span class="impact-stereotype impact-' + esc(st) + '">' + esc(st) + '</span> ' + esc(data.affectedClasses[ci].className) + '</div>';
    }
    html += '</div>';
    html += '<div class="impact-section"><div class="section-label">Affected Endpoints (' + data.endpointCount + ')</div>';
    for (var ei = 0; ei < data.affectedEndpoints.length; ei++) {
      var ep = data.affectedEndpoints[ei];
      html += '<div class="impact-endpoint" onclick="impactPanel(\\'close\\');selectEp(\\'' + esc(ep.path) + '\\',\\'' + ep.method + '\\')">' + ep.method + ' ' + esc(ep.path) + '</div>';
    }
    html += '</div>';
    html += '<div class="impact-section"><div class="section-label">Affected DTOs / Schemas</div>';
    for (var si = 0; si < data.affectedSchemas.length; si++) {
      html += '<div class="impact-endpoint" onclick="impactPanel(\\'close\\');selectSchema(\\'' + esc(data.affectedSchemas[si]) + '\\')">' + esc(data.affectedSchemas[si]) + '</div>';
    }
    html += '</div>';
    panel.innerHTML = html;
    panel.classList.add('open');
    if (backdrop) backdrop.style.display = 'block';
  };

  window.filterDepGraph = function(val) {
    var svg = document.querySelector('.mermaid svg');
    if (!svg) return;
    val = (val || '').toLowerCase();
    var nodes = svg.querySelectorAll('.node');
    for (var ni = 0; ni < nodes.length; ni++) {
      var name = getNodeName(nodes[ni]);
      if (!name) continue;
      nodes[ni].style.opacity = (!val || name.toLowerCase().indexOf(val) !== -1) ? '1' : '0.15';
    }
  };

  function getNodeName(node) {
    var t = node.querySelector('title');
    if (t) {
      var n = (t.textContent || '').replace(/\\[.*?\\]/g, '').trim();
      if (n) return n;
    }
    if (node.id) {
      var m = node.id.match(/flowchart-(.+?)(?:-\\d+)?$/);
      if (m) return m[1];
    }
    var te = node.querySelector('text, .nodeText');
    return te ? (te.textContent || '').trim() : '';
  }

  function renderMaturityDashboard(maturity) {
    if (!maturity) return '';
    var cat = maturity.categories || {};
    var catNames = ['security', 'performance', 'restDesign', 'documentation', 'architecture'];
    var catLabels = { security: 'Security', performance: 'Performance', restDesign: 'REST Design', documentation: 'Documentation', architecture: 'Architecture' };
    var html = '<div class="maturity-dashboard">';
    html += '<div class="maturity-header">API Maturity Report</div>';
    html += '<div class="maturity-overall"><div class="maturity-overall-score">' + maturity.overallScore + '</div><div class="maturity-overall-label">/ 100</div></div>';
    html += '<div class="maturity-bars">';
    for (var mi = 0; mi < catNames.length; mi++) {
      var name = catNames[mi];
      var c = cat[name] || { score: 0, affectedEndpoints: [] };
      var score = c.score;
      var fillClass = score >= 85 ? 'high' : (score >= 60 ? 'medium' : 'low');
      var firstEp = (c.affectedEndpoints && c.affectedEndpoints.length > 0) ? c.affectedEndpoints[0] : null;
      var onclick = '';
      var style = '';
      if (firstEp) {
        onclick = ' onclick="impactPanel(\\'close\\');selectEp(\\'' + esc(firstEp.path) + '\\',\\'' + firstEp.method.toUpperCase() + '\\')"';
        style = ' style="cursor:pointer"';
      }
      html += '<div class="maturity-bar"' + style + onclick + '>';
      html += '<span class="maturity-bar-label">' + (catLabels[name] || name) + '</span>';
      html += '<div class="maturity-bar-track"><div class="maturity-bar-fill ' + fillClass + '" style="width:' + score + '%"></div></div>';
      html += '<span class="maturity-bar-score">' + score + '</span>';
      html += '</div>';
    }
    html += '</div>';
    html += '<div class="maturity-issues">';
    html += '<span class="maturity-issue maturity-issue-critical">' + (maturity.criticalIssues || 0) + ' High</span>';
    html += '<span class="maturity-issue maturity-issue-warning">' + (maturity.warnings || 0) + ' Medium</span>';
    html += '<span class="maturity-issue maturity-issue-info">' + (maturity.suggestions || 0) + ' Suggestions</span>';
    html += '</div></div>';
    return html;
  }

  var sidebarHtml = '<div class="header"><h1>APILens</h1><div class="subtitle">' + endpoints.length + ' endpoints</div></div>';
  sidebarHtml += '<input id="search" type="text" placeholder="AI-Powered API Intelligence Platform" oninput="window.renderFilter(this.value)">';

  var tagKeys = Object.keys(grouped).sort();
  var tagDescMap = {};
  for (var ti = 0; ti < tags.length; ti++) {
    if (tags[ti].description) tagDescMap[tags[ti].name] = tags[ti].description;
  }
  for (var t = 0; t < tagKeys.length; t++) {
    var tag = tagKeys[t];
    sidebarHtml += '<div class="sidebar-tag"><div class="sidebar-tag-header">' + esc(tag) + '</div>';
    if (tagDescMap[tag]) {
      sidebarHtml += '<div class="tag-description">' + esc(tagDescMap[tag]) + '</div>';
    }
    var eps = grouped[tag];
    for (var e = 0; e < eps.length; e++) {
      var ep = eps[e];
      sidebarHtml += '<a class="sidebar-endpoint" href="#" data-path="' + esc(ep.path) + '" data-method="' + ep.method + '" onclick="event.preventDefault();selectEp(\\'' + esc(ep.path) + '\\',\\'' + ep.method + '\\')"><span class="method-badge method-' + ep.method.toLowerCase() + '">' + ep.method + '</span><span class="path-text">' + esc(ep.path) + '</span></a>';
    }
    sidebarHtml += '</div>';
  }

  var schemaNames = Object.keys(schemas).sort();
  if (schemaNames.length > 0) {
    sidebarHtml += '<div class="sidebar-tag"><div class="sidebar-tag-header">Schemas</div>';
    for (var s = 0; s < schemaNames.length; s++) {
      sidebarHtml += '<a class="sidebar-endpoint" href="#" onclick="event.preventDefault();selectSchema(\\'' + esc(schemaNames[s]) + '\\')"><span class="path-text" style="padding-left:4px">' + esc(schemaNames[s]) + '</span></a>';
    }
    sidebarHtml += '</div>';
  }

  sidebarHtml += '<div class="sidebar-tag"><div class="sidebar-tag-header"><a href="#" onclick="event.preventDefault();document.getElementById(\\'architecture-section\\').scrollIntoView({behavior:\\'smooth\\'})" style="color:#888;text-decoration:none">Architecture</a></div></div>';


  function buildEndpointCard(ep) {
    var op = ep.operation;
    var html = '<div class="endpoint-card" data-path="' + esc(ep.path) + '" data-method="' + ep.method + '">';
    html += '<div class="endpoint-header" onclick="this.nextElementSibling.classList.toggle(\\'open\\')">';
    html += '<span class="method-badge" style="background:' + methodBg(ep.method) + ';color:' + methodColor(ep.method) + '">' + ep.method + '</span>';
    html += '<span class="endpoint-path">' + esc(ep.path) + '</span>';
    html += '<span class="endpoint-summary">' + esc(op.summary || '') + '</span>';
    html += '</div>';
    html += '<div class="endpoint-body">';

    var pathParams = op.parameters ? op.parameters.filter(function(p){ return p.in === 'path'; }) : [];
    var queryParams = op.parameters ? op.parameters.filter(function(p){ return p.in === 'query'; }) : [];

    html += paramsTable(pathParams, 'Path Parameters');
    html += paramsTable(queryParams, 'Query Parameters');

    // AI enrichment section
    if (op['x-explanation']) {
      html += '<div class="ai-divider"><span>AI Insights</span></div>';

      html += '<div class="ai-description">' + esc(op.description || '') + '</div>';
      if (op['x-confidence'] !== null && op['x-confidence'] !== undefined) {
        html += '<span class="ai-confidence">' + op['x-confidence'] + '% confidence</span>';
      }

      html += '<div class="ai-explanation">' + esc(op['x-explanation']) + '</div>';

      if (op['x-useCase']) {
        html += '<div class="ai-use-case"><span class="ai-label">Use case</span> ' + esc(op['x-useCase']) + '</div>';
      }

      if (op['x-possibleErrors'] && op['x-possibleErrors'].length > 0) {
        html += '<div class="ai-errors"><span class="ai-label">Possible errors</span>';
        for (var ei = 0; ei < op['x-possibleErrors'].length; ei++) {
          html += '<div class="ai-error-item">\u26A0 ' + esc(op['x-possibleErrors'][ei]) + '</div>';
        }
        html += '</div>';
      }

      if (op['x-bestPractices'] && op['x-bestPractices'].length > 0) {
        html += '<div class="ai-practices"><span class="ai-label">Best practices</span>';
        for (var pi = 0; pi < op['x-bestPractices'].length; pi++) {
          var bp = op['x-bestPractices'][pi];
          var bpMsg = typeof bp === 'string' ? bp : (bp.message || '');
          html += '<div class="ai-practice-item">\u2713 ' + esc(bpMsg) + '</div>';
          if (bp.why) {
            html += '<div class="ai-why-text">' + esc(bp.why) + '</div>';
          }
        }
        html += '</div>';
      }

      if (op['x-warnings'] && op['x-warnings'].length > 0) {
        html += '<div class="ai-warnings"><span class="ai-label">Architecture review</span>';
        for (var wi = 0; wi < op['x-warnings'].length; wi++) {
          var w = op['x-warnings'][wi];
          var sev = w.severity || 'info';
          var sevUpper = sev.charAt(0).toUpperCase() + sev.slice(1);
          html += '<div class="review-card review-severity-' + sev + '">';
          html += '<div class="review-header">';
          if (w.category) html += '<span class="review-category">' + esc(w.category) + '</span>';
          html += '<span class="review-severity-badge">' + sevUpper + '</span>';
          html += '</div>';
          html += '<div class="review-message">' + esc(w.message) + '</div>';
          if (w.why) html += '<div class="review-why">Why? ' + esc(w.why) + '</div>';
          if (w.recommendation) html += '<div class="review-recommendation">Recommendation: ' + esc(w.recommendation) + '</div>';
          html += '</div>';
        }
        html += '</div>';
      } else if (op['x-confidence'] !== null && op['x-confidence'] !== undefined) {
        html += '<div class="no-issues">\u2713 No issues detected</div>';
      }
    }

    // Collect tab contents
    var tabs = [];

    // Request tab
    var reqExample = getRequestBodyExample(op);
    var requestHtml = '';
    if (reqExample !== null) {
      requestHtml = '<div class="code-block">' + highlightJSON(reqExample) + '<button class="copy-btn" onclick="copyText(this)">Copy</button></div>';
      tabs.push('request');
    }

    // Response tab
    var respCodes = Object.keys(op.responses || {}).sort();
    var responseHtml = '';
    if (respCodes.length > 0) {
      for (var r = 0; r < respCodes.length; r++) {
        var code = respCodes[r];
        var resp = op.responses[code];
        responseHtml += '<div class="section-label">' + esc(code) + ' &mdash; ' + esc(resp.description || '') + '</div>';
        var content = resp.content && resp.content['application/json'];
        if (content) {
          var example = getExample(content.schema);
          if (example !== null) {
            responseHtml += '<div class="code-block">' + highlightJSON(example) + '<button class="copy-btn" onclick="copyText(this)">Copy</button></div>';
          }
        }
      }
      tabs.push('response');
    }

    // Curl tab
    var curlHtml = '<div class="curl-block">' + esc(curlExample(ep)) + '<button class="copy-btn" onclick="copyText(this)">Copy</button></div>';
    tabs.push('curl');

    // Flow tab
    var flowHtml = '';
    if (op['x-flow']) {
      var flowParts = op['x-flow'].split(' → ');
      var flowContent = '';
      for (var f = 0; f < flowParts.length; f++) {
        flowContent += flowParts[f];
        if (f < flowParts.length - 1) flowContent += '\\n  ↓\\n';
      }
      flowHtml = '<div class="flow-block">' + esc(flowContent) + '</div>';
      tabs.push('flow');
    }

    // Render tabs
    html += '<div class="tab-bar">';
    for (var t = 0; t < tabs.length; t++) {
      var label = tabs[t].charAt(0).toUpperCase() + tabs[t].slice(1);
      html += '<button class="tab-btn' + (t === 0 ? ' active' : '') + '" onclick="switchTab(this,\\'' + tabs[t] + '\\')">' + label + '</button>';
    }
    html += '</div>';

    // Render panels
    if (requestHtml) {
      html += '<div class="tab-panel' + (tabs[0] === 'request' ? ' active' : '') + '" data-panel="request">' + requestHtml + '</div>';
    }
    if (responseHtml) {
      html += '<div class="tab-panel' + (tabs[0] === 'response' ? ' active' : '') + '" data-panel="response">' + responseHtml + '</div>';
    }
    html += '<div class="tab-panel' + (tabs[0] === 'curl' ? ' active' : '') + '" data-panel="curl">' + curlHtml + '</div>';
    if (flowHtml) {
      html += '<div class="tab-panel' + (tabs[0] === 'flow' ? ' active' : '') + '" data-panel="flow">' + flowHtml + '</div>';
    }

    html += '</div></div>';
    return html;
  }

  function render(filter) {
    filter = (filter || '').toLowerCase();
    var html = '<div class="stats"><div class="stat-card"><div class="stat-value">' + endpoints.length + '</div><div class="stat-label">Endpoints</div></div><div class="stat-card"><div class="stat-value">' + Object.keys(schemas).length + '</div><div class="stat-label">Schemas</div></div></div>';
    html += renderMaturityDashboard(spec['x-maturity']);

    // Sidebar filtering
    var sidebarLinks = document.querySelectorAll('.sidebar-endpoint');
    var sidebarTags = document.querySelectorAll('.sidebar-tag');
    for (var i = 0; i < sidebarLinks.length; i++) {
      var link = sidebarLinks[i];
      var match = link.innerText.toLowerCase().indexOf(filter) !== -1;
      link.style.display = match ? '' : 'none';
    }
    for (var i = 0; i < sidebarTags.length; i++) {
      var st = sidebarTags[i];
      var visible = false;
      var links = st.querySelectorAll('.sidebar-endpoint');
      for (var j = 0; j < links.length; j++) {
        if (links[j].style.display !== 'none') { visible = true; break; }
      }
      st.style.display = visible ? '' : 'none';
    }

    // Endpoint sections
    for (var t = 0; t < tagKeys.length; t++) {
      var tag = tagKeys[t];
      var eps = grouped[tag];
      var matching = eps.filter(function(ep){
        var text = ep.method + ' ' + ep.path + ' ' + (ep.operation.summary || '');
        return text.toLowerCase().indexOf(filter) !== -1;
      });
      if (matching.length === 0) continue;

      html += '<h2>' + esc(tag) + '</h2>';
      for (var e = 0; e < matching.length; e++) {
        html += buildEndpointCard(matching[e]);
      }
    }

    // Schemas section
    var schemaNames = Object.keys(schemas).sort();
    if (schemaNames.length > 0) {
      html += '<h2>Schemas</h2>';
      for (var i = 0; i < schemaNames.length; i++) {
        var name = schemaNames[i];
        var schema = schemas[name];
        html += '<div class="schema-card">';
        html += '<div class="schema-header" onclick="this.nextElementSibling.classList.toggle(\\'open\\')">';
        html += '<h3>' + esc(name) + '</h3>';
        html += '<span style="margin-left:auto;font-size:12px;color:#888">' + (schema.type || 'object') + '</span>';
        html += '</div>';
        html += '<div class="schema-body">';
        html += '<div class="section-label">Fields</div>';
        html += '<table class="param-table"><tr><th>Field</th><th>Type</th><th>Format</th></tr>';
        var props = schema.properties || {};
        var propKeys = Object.keys(props).sort();
        for (var k = 0; k < propKeys.length; k++) {
          var f = propKeys[k];
          var p = props[f];
          var ptype = p.type || 'string';
          var pfmt = p.format || '-';
          html += '<tr><td>' + esc(f) + '</td><td>' + esc(ptype) + '</td><td>' + esc(pfmt) + '</td></tr>';
        }
        html += '</table>';
        if (schema.example) {
          html += '<div class="section-label">Example</div><div class="code-block">' + highlightJSON(schema.example) + '<button class="copy-btn" onclick="copyText(this)">Copy</button></div>';
        }
        html += '</div></div>';
      }
    }

    // Architecture section
    var deps = spec['x-dependencies'];
    var cls = spec['x-classes'] || {};
    if (deps && deps.length > 0) {
      html += '<h2 id="architecture-section">Architecture</h2>';
      html += '<input class="dep-search" type="text" placeholder="Search dependencies..." oninput="filterDepGraph(this.value)">';
      html += '<div class="mermaid">';
      html += 'graph TD\\n';
      var drawn = {};
      var allNodes = {};
      for (var d = 0; d < deps.length; d++) {
        var key = deps[d].from + '-->' + deps[d].to;
        if (!drawn[key]) {
          drawn[key] = true;
          var fromStereo = (cls[deps[d].from] && cls[deps[d].from].stereotype) || 'other';
          var toStereo = (cls[deps[d].to] && cls[deps[d].to].stereotype) || 'other';
          html += '  ' + deps[d].from + '[' + deps[d].from + '] --> ' + deps[d].to + '[' + deps[d].to + ']\\n';
          allNodes[deps[d].from] = fromStereo;
          allNodes[deps[d].to] = toStereo;
        }
      }
      html += '\\nclassDef controller fill:#2e7d32,stroke:#1b5e20,color:#fff\\n';
      html += 'classDef service fill:#1565c0,stroke:#0d47a1,color:#fff\\n';
      html += 'classDef repository fill:#6a1b9a,stroke:#4a148c,color:#fff\\n';
      html += 'classDef entity fill:#e65100,stroke:#bf360c,color:#fff\\n';
      html += 'classDef config fill:#555,stroke:#333,color:#ccc\\n';
      html += 'classDef other fill:#444,stroke:#333,color:#ccc\\n';
      for (var nodeName in allNodes) {
        html += '  class ' + nodeName + ' ' + allNodes[nodeName] + '\\n';
      }
      html += '</div>';
    }

    document.getElementById('main-content').innerHTML = html;

    // Event delegation for dependency graph clicks
    var mermaidEl = document.querySelector('.mermaid');
    if (mermaidEl) {
      mermaidEl.addEventListener('click', function(evt) {
        var node = evt.target.closest ? evt.target.closest('.node') : null;
        if (!node) return;
        var name = getNodeName(node);
        if (!name) return;
        window.selectDepNode(name);
      });
    }

    if (typeof mermaid !== 'undefined') {
      mermaid.initialize({ theme: 'dark', themeVariables: { background: '#252526', primaryColor: '#0d47a1', primaryTextColor: '#d4d4d4', secondaryColor: '#1b5e20', tertiaryColor: '#4a148c' } });
      mermaid.run({ nodes: document.querySelectorAll('.mermaid') });
    }
  }

  window.renderFilter = function(val) {
    render(val);
  };

  // Initial render
  var appHtml = '<div class="navbar"><div class="nav-title"><strong>APILens</strong> &middot; API Documentation</div><div class="nav-links"><a href="/reports">Reports</a></div></div><div id="app"><div class="app-body"><aside id="sidebar">' + sidebarHtml + '</aside><main><div id="main-content"></div></main></div></div>';
  appHtml += '<div id="impact-backdrop" class="impact-panel-backdrop" onclick="impactPanel(\\'close\\')"></div>';
  appHtml += '<div id="impact-panel" class="impact-panel"></div>';
  document.getElementById('app').innerHTML = appHtml;
  render('');
})();
`;

function generateDocSite(spec, outputDir) {
    const assetsDir = path.join(outputDir, 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });

    const specJson = JSON.stringify(spec, null, 2);
    fs.writeFileSync(path.join(outputDir, 'openapi.json'), specJson, 'utf-8');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${spec.info?.title || 'API Documentation'}</title>
<link rel="stylesheet" href="assets/style.css">
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
</head>
<body>
<div id="app"></div>
<script id="spec-data" type="application/json">${specJson}</script>
<script src="assets/app.js"></script>
</body>
</html>`;

    fs.writeFileSync(path.join(outputDir, 'index.html'), html, 'utf-8');
    fs.writeFileSync(path.join(assetsDir, 'style.css'), CSS, 'utf-8');
    fs.writeFileSync(path.join(assetsDir, 'app.js'), APP_JS, 'utf-8');

    console.log(`Documentation site generated in: ${outputDir}/`);
    console.log(`  └ index.html`);
    console.log(`  └ openapi.json`);
    console.log(`  └ assets/style.css`);
    console.log(`  └ assets/app.js`);
}

module.exports = { generateDocSite };
