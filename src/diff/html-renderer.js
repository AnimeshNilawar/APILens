var fs = require('fs');
var path = require('path');

var CSS = `*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,sans-serif;background:#1e1e1e;color:#d4d4d4;margin:0;overflow:hidden}
#app{display:flex;height:100vh}
#app aside{width:280px;min-width:280px;background:#252526;border-right:1px solid #3c3c3c;overflow-y:auto;display:flex;flex-direction:column}
#app aside .header{padding:16px;border-bottom:1px solid #3c3c3c;flex-shrink:0}
#app aside .header h1{font-size:15px;font-weight:600;color:#e0e0e0}
#app aside .header .subtitle{font-size:11px;color:#888;margin-top:2px}
#search{margin:8px 12px;padding:7px 10px;border:1px solid #3c3c3c;border-radius:6px;background:#3c3c3c;color:#d4d4d4;font-size:12px;outline:none;width:calc(100% - 24px);flex-shrink:0}
#search:focus{border-color:#569cd6}
.sidebar-filter-row{display:flex;gap:4px;padding:0 12px 8px;flex-shrink:0;flex-wrap:wrap}
.sidebar-filter-row button{font-size:10px;padding:3px 8px;border:1px solid #3c3c3c;border-radius:4px;background:0 0;color:#888;cursor:pointer;font-family:inherit}
.sidebar-filter-row button.active{background:#2d2d2d;color:#d4d4d4;border-color:#569cd6}
.sidebar-filter-row button:hover{background:#2d2d2d}
.sidebar-scroll{flex:1;overflow-y:auto;min-height:0}
.sidebar-section{border-bottom:1px solid #3c3c3c}
.sidebar-section details>summary{padding:8px 12px;font-size:11px;font-weight:600;text-transform:uppercase;color:#888;letter-spacing:.5px;cursor:pointer;user-select:none;list-style:none;display:flex;align-items:center;gap:6px}
.sidebar-section details>summary::-webkit-details-marker{display:none}
.sidebar-section details>summary:hover{color:#aaa;background:#2a2a2a}
.sidebar-section details>summary .arrow{font-size:9px;transition:transform .15s}
.sidebar-section details[open]>summary .arrow{transform:rotate(90deg)}
.sidebar-section details>summary .counts{margin-left:auto;font-size:10px;font-weight:400}
.sidebar-link{display:flex;align-items:center;gap:4px;padding:4px 12px 4px 24px;cursor:pointer;font-size:12px;transition:background .15s;text-decoration:none;color:#d4d4d4}
.sidebar-link:hover{background:#2d2d2d}
.sidebar-link .method-badge{font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;text-transform:uppercase;min-width:32px;text-align:center}
.badge-added{color:#7ec699}
.badge-removed{color:#f17070}
.badge-modified{color:#dba638}
#app main{flex:1;overflow-y:auto;padding:0}
.main-inner{max-width:1100px;padding:28px 36px;margin:0 auto}
h2{font-size:16px;font-weight:600;color:#e0e0e0;margin:24px 0 12px;padding-bottom:6px;border-bottom:1px solid #3c3c3c}
h3{font-size:13px;font-weight:600;color:#e0e0e0;margin:12px 0 6px}
.overview{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}
.stat-card{background:#252526;border:1px solid #3c3c3c;border-radius:8px;padding:12px 18px;flex:1;min-width:80px;text-align:center}
.stat-card .stat-value{font-size:22px;font-weight:700;color:#e0e0e0}
.stat-card .stat-value.green{color:#7ec699}
.stat-card .stat-value.red{color:#f17070}
.stat-card .stat-value.amber{color:#dba638}
.stat-card .stat-label{font-size:10px;color:#888;margin-top:2px;text-transform:uppercase;letter-spacing:.5px}
.stats-table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:12px}
.stats-table th,.stats-table td{text-align:left;padding:6px 12px;border-bottom:1px solid #3c3c3c}
.stats-table th{color:#888;font-weight:600;text-transform:uppercase;font-size:10px;letter-spacing:.5px}
.stats-table td{color:#d4d4d4}
.stats-table .num{text-align:right;font-family:'SF Mono','Fira Code',Consolas,monospace;font-size:11px}
.stats-table .link{cursor:pointer;color:#569cd6}
.stats-table .link:hover{text-decoration:underline}
.breakdown-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;margin-bottom:20px}
.breakdown-item{background:#252526;border:1px solid #3c3c3c;border-radius:6px;padding:8px 12px;display:flex;justify-content:space-between;align-items:center}
.breakdown-item .label{font-size:11px;color:#888}
.breakdown-item .value{font-size:13px;font-weight:600;color:#e0e0e0}
.snapshot-info{background:#252526;border:1px solid #3c3c3c;border-radius:8px;padding:10px 16px;margin-bottom:16px;display:flex;gap:12px;align-items:center;font-size:12px}
.snapshot-info .arrow{color:#569cd6;font-size:16px;font-weight:700}
.snapshot-info .snap-label{color:#888;font-size:9px;text-transform:uppercase;letter-spacing:.5px}
.snapshot-info .snap-id{color:#e0e0e0;font-family:'SF Mono','Fira Code',Consolas,monospace;font-size:12px}
.toolbar{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center}
.toolbar .filter-group{display:flex;gap:4px;align-items:center}
.toolbar .filter-group label{font-size:11px;color:#888;cursor:pointer;padding:3px 8px;border:1px solid #3c3c3c;border-radius:4px;user-select:none}
.toolbar .filter-group label:hover{background:#2d2d2d}
.toolbar .filter-group input[type=checkbox]{display:none}
.toolbar .filter-group input:checked+label{background:#2d2d2d;color:#d4d4d4;border-color:#569cd6}
.toolbar .filter-group select{font-size:11px;padding:3px 6px;border:1px solid #3c3c3c;border-radius:4px;background:#252526;color:#d4d4d4;font-family:inherit;outline:none}
.toolbar .filter-group select:focus{border-color:#569cd6}
.toolbar .export-btn{font-size:11px;padding:3px 8px;border:1px solid #3c3c3c;border-radius:4px;background:0 0;color:#888;cursor:pointer;font-family:inherit;margin-left:auto}
.toolbar .export-btn:hover{background:#2d2d2d;color:#d4d4d4}
.diff-card{background:#252526;border:1px solid #3c3c3c;border-radius:6px;margin-bottom:8px;overflow:hidden;content-visibility:auto;contain-intrinsic-size:60px}
.diff-card-header{display:flex;align-items:center;gap:6px;padding:8px 14px;cursor:pointer;user-select:none;font-size:12px}
.diff-card-header:hover{background:#2a2a2a}
.diff-card-header .arrow{font-size:9px;color:#888;transition:transform .15s;width:12px;text-align:center}
.diff-card.open .diff-card-header .arrow{transform:rotate(90deg)}
.change-badge{font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;text-transform:uppercase;letter-spacing:.5px;min-width:48px;text-align:center;flex-shrink:0}
.change-badge.added{background:#1b5e20;color:#a5d6a7}
.change-badge.removed{background:#5c1a1a;color:#ef9a9a}
.change-badge.modified{background:#5c3a00;color:#ffcc80}
.method-badge{font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;text-transform:uppercase;min-width:32px;text-align:center;flex-shrink:0}
.method-GET{background:#1b5e20;color:#a5d6a7}
.method-POST{background:#0d47a1;color:#90caf9}
.method-PUT{background:#e65100;color:#ffcc80}
.method-DELETE{background:#b71c1c;color:#ef9a9a}
.method-PATCH{background:#4a148c;color:#ce93d8}
.diff-category{font-size:9px;color:#555;text-transform:uppercase;letter-spacing:.5px;margin-left:auto;flex-shrink:0}
.diff-body{padding:0 14px 10px;display:none;border-top:1px solid #3c3c3c}
.diff-card.open .diff-body{display:block}
.diff-details{font-size:12px;color:#9a9a9a;margin-top:8px;line-height:1.5}
.diff-details code{color:#ce9178;font-family:'SF Mono','Fira Code',Consolas,monospace;font-size:11px;padding:0 2px}
.impact-badges{display:flex;gap:4px;margin:6px 0;flex-wrap:wrap}
.impact-badge{font-size:9px;padding:2px 6px;border-radius:3px;border:1px solid #3c3c3c;color:#888}
.impact-badge.endpoint{color:#7ec699;border-color:#1b5e20}
.impact-badge.schema{color:#90caf9;border-color:#0d47a1}
.impact-badge.dto{color:#ce93d8;border-color:#4a148c}
.impact-badge.controller{color:#ffcc80;border-color:#5c3a00}
.impact-badge.service{color:#a5d6a7;border-color:#1b5e20}
.impact-badge.repository{color:#ef9a9a;border-color:#5c1a1a}
.impact-panel{margin-top:8px;padding:10px 12px;background:#1a1a1a;border:1px solid #3c3c3c;border-radius:6px}
.impact-panel .impact-title{font-size:10px;font-weight:600;text-transform:uppercase;color:#888;letter-spacing:.5px;margin-bottom:6px}
.impact-panel .impact-row{display:flex;gap:6px;flex-wrap:wrap;font-size:11px;margin-bottom:4px}
.impact-panel .impact-label{color:#888;min-width:80px}
.impact-panel .impact-value{color:#d4d4d4;font-family:'SF Mono','Fira Code',Consolas,monospace;font-size:11px}
.diff-view-toggle{display:flex;gap:0;margin-top:8px}
.diff-view-toggle button{font-size:10px;padding:3px 10px;border:1px solid #3c3c3c;background:#1a1a1a;color:#888;cursor:pointer;font-family:inherit}
.diff-view-toggle button:first-child{border-radius:4px 0 0 4px}
.diff-view-toggle button:last-child{border-radius:0 4px 4px 0}
.diff-view-toggle button.active{background:#2d2d2d;color:#d4d4d4;border-color:#569cd6}
.diff-view-toggle button:hover{background:#2d2d2d}
.diff-unified,.diff-side{display:none}
.diff-view-unified .diff-unified{display:block}
.diff-view-side .diff-side{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.diff-view-side .diff-side .tree-controls{grid-column:1/-1}
.diff-view-side .diff-side-col{background:#1a1a1a;border:1px solid #3c3c3c;border-radius:4px;padding:8px 10px;overflow-x:auto}
.diff-view-side .diff-side-col .col-label{font-size:9px;font-weight:600;text-transform:uppercase;color:#888;margin-bottom:4px;letter-spacing:.5px}
.diff-view-side .diff-side-col .col-label.before{color:#f17070}
.diff-view-side .diff-side-col .col-label.after{color:#7ec699}
.diff-line{font-family:'SF Mono','Fira Code',Consolas,monospace;font-size:11px;line-height:1.6;white-space:pre-wrap;word-break:break-all;padding:0 4px;border-radius:2px}
.diff-line.add{background:#1b5e2033;color:#a5d6a7}
.diff-line.rem{background:#5c1a1a33;color:#ef9a9a}
.diff-line.ctx{color:#9a9a9a}
.diff-line pre{display:inline;font-family:inherit;font-size:inherit}
.tree-node{font-family:'SF Mono','Fira Code',Consolas,monospace;font-size:11px;line-height:1.6}
.tree-node details>summary{list-style:none;cursor:pointer;padding:1px 0;color:#d4d4d4;user-select:none}
.tree-node details>summary::-webkit-details-marker{display:none}
.tree-node details>summary:hover{color:#e0e0e0}
.tree-node .key{color:#7ec699}
.tree-node .string{color:#ce9178}
.tree-node .number{color:#b5cea8}
.tree-node .boolean{color:#569cd6}
.tree-node .null{color:#888}
.tree-node .bracket{color:#555;font-size:10px}
.tree-node .count{color:#555;font-size:10px;margin-left:4px}
.tree-controls{font-size:10px;margin-bottom:6px;display:flex;gap:8px}
.tree-controls button{background:0 0;border:1px solid #3c3c3c;color:#888;padding:2px 8px;border-radius:4px;cursor:pointer;font-family:inherit;font-size:10px}
.tree-controls button:hover{background:#2d2d2d;color:#d4d4d4}
.endpoint-link{color:#569cd6;text-decoration:none;font-size:10px;margin-left:6px;opacity:.6}
.endpoint-link:hover{opacity:1;text-decoration:underline}
.no-changes{text-align:center;padding:48px;color:#888;font-size:14px}
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-track{background:0 0}
::-webkit-scrollbar-thumb{background:#3c3c3c;border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:#555}
@media(max-width:900px){
#app{flex-direction:column;height:auto}
#app aside{width:100%;min-width:auto;height:auto;max-height:40vh;border-right:none;border-bottom:1px solid #3c3c3c}
.main-inner{padding:16px}
.diff-view-side .diff-side{grid-template-columns:1fr}
.overview{flex-wrap:wrap}
.stats-table{font-size:10px}
}
@media(min-width:1400px){
.main-inner{max-width:1400px}
.diff-view-side .diff-side{grid-template-columns:1fr 1fr}
}`;

var APP_JS = `
(function(){
var reportEl = document.getElementById('report-data');
var report = reportEl ? JSON.parse(reportEl.textContent) : null;
if (!report) { document.getElementById('app').innerHTML = '<p style="padding:32px;color:#888">No diff report found.</p>'; return; }

var changes = report.changes || [];
var depData = report._dependency || {};
var classes = depData.classes || {};
var depGraph = depData.dependencies || [];

function esc(str) { return ('' + str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function changeType(val) {
  if (val === null || val === undefined) return '<span class="null">null</span>';
  if (typeof val === 'boolean') return '<span class="boolean">' + val + '</span>';
  if (typeof val === 'number') return '<span class="number">' + val + '</span>';
  if (typeof val === 'string') return '<span class="string">"' + esc(val) + '"</span>';
  if (Array.isArray(val)) {
    var items = val.map(function(v) { return changeType(v); });
    return '[' + items.join(', ') + ']';
  }
  if (typeof val === 'object') {
    var pairs = [];
    for (var k in val) {
      if (val.hasOwnProperty(k)) pairs.push('<span class="key">"' + esc(k) + '"</span>: ' + changeType(val[k]));
    }
    return '{ ' + pairs.join(', ') + ' }';
  }
  return esc(String(val));
}

function renderJsonTree(val, depth) {
  depth = depth || 0;
  if (val === null || val === undefined) return '<span class="null">null</span>';
  if (typeof val === 'boolean') return '<span class="boolean">' + val + '</span>';
  if (typeof val === 'number') return '<span class="number">' + val + '</span>';
  if (typeof val === 'string') return '<span class="string">"' + esc(val) + '"</span>';
  if (Array.isArray(val)) {
    if (val.length === 0) return '<span class="bracket">[]</span>';
    if (depth > 4) return '<span class="bracket">[</span><span class="count">' + val.length + ' items</span><span class="bracket">]</span>';
    var items = [];
    for (var i = 0; i < val.length; i++) {
      items.push('<div style="padding-left:16px"><span class="number">' + i + '</span>: ' + renderJsonTree(val[i], depth + 1) + '</div>');
    }
    return '<details ' + (depth < 2 ? 'open' : '') + '><summary><span class="bracket">[</span><span class="count">' + val.length + ' items</span><span class="bracket">]</span></summary>' + items.join('') + '</details>';
  }
  if (typeof val === 'object') {
    var keys = Object.keys(val);
    if (keys.length === 0) return '<span class="bracket">{}</span>';
    if (depth > 4) return '<span class="bracket">{</span><span class="count">' + keys.length + ' keys</span><span class="bracket">}</span>';
    var items = [];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      items.push('<div style="padding-left:16px"><span class="key">"' + esc(k) + '"</span>: ' + renderJsonTree(val[k], depth + 1) + '</div>');
    }
    return '<details ' + (depth < 2 ? 'open' : '') + '><summary><span class="bracket">{</span><span class="count">' + keys.length + ' keys</span><span class="bracket">}</span></summary>' + items.join('') + '</details>';
  }
  return esc(String(val));
}

function toggleTree(el, expand) {
  var details = el.parentElement.querySelectorAll('details');
  for (var i = 0; i < details.length; i++) {
    details[i].open = expand;
  }
}

function renderUnifiedDiff(before, after, depth) {
  depth = depth || 0;
  var lines = [];
  var indent = '  '.repeat(depth);

  if (typeof before !== typeof after) {
    lines.push('<div class="diff-line rem">' + indent + '-' + changeType(before) + '</div>');
    lines.push('<div class="diff-line add">' + indent + '+' + changeType(after) + '</div>');
    return lines.join('');
  }

  if (before === null || after === null || typeof before !== 'object') {
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      lines.push('<div class="diff-line rem">' + indent + '-' + changeType(before) + '</div>');
      lines.push('<div class="diff-line add">' + indent + '+' + changeType(after) + '</div>');
    } else {
      lines.push('<div class="diff-line ctx">' + indent + ' ' + changeType(before) + '</div>');
    }
    return lines.join('');
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    var maxLen = Math.max(before.length, after.length);
    for (var i = 0; i < maxLen; i++) {
      if (i >= before.length) {
        lines.push('<div class="diff-line add">' + indent + '+' + changeType(after[i]) + '</div>');
      } else if (i >= after.length) {
        lines.push('<div class="diff-line rem">' + indent + '-' + changeType(before[i]) + '</div>');
      } else {
        lines.push(renderUnifiedDiff(before[i], after[i], depth));
      }
    }
    return lines.join('');
  }

  if (typeof before === 'object' && typeof after === 'object') {
    var allKeys = {};
    for (var k in before) { if (before.hasOwnProperty(k)) allKeys[k] = true; }
    for (var k in after) { if (after.hasOwnProperty(k)) allKeys[k] = true; }
    var keyList = Object.keys(allKeys).sort();
    for (var i = 0; i < keyList.length; i++) {
      var key = keyList[i];
      var hasBefore = before.hasOwnProperty(key);
      var hasAfter = after.hasOwnProperty(key);
      if (!hasBefore && hasAfter) {
        lines.push('<div class="diff-line add">' + indent + '+' + esc(JSON.stringify(key)) + ': ' + changeType(after[key]) + '</div>');
      } else if (hasBefore && !hasAfter) {
        lines.push('<div class="diff-line rem">' + indent + '-' + esc(JSON.stringify(key)) + ': ' + changeType(before[key]) + '</div>');
      } else {
        var inner = renderUnifiedDiff(before[key], after[key], depth + 1);
        if (inner) {
          lines.push('<div class="diff-line ctx">' + indent + ' ' + esc(JSON.stringify(key)) + ': </div>' + inner);
        }
      }
    }
    return lines.join('');
  }

  return '';
}

function renderSideBySide(before, after) {
  var beforeHtml = renderJsonTree(before);
  var afterHtml = renderJsonTree(after);
  var id = 'tree-' + Math.random().toString(36).substring(2, 6);
  return '<div class="tree-controls"><button onclick="toggleTreeAll(\\'' + id + '\\',true)">Expand All</button><button onclick="toggleTreeAll(\\'' + id + '\\',false)">Collapse All</button></div><div id="' + id + '" class="diff-side-col"><div class="col-label before">Before</div><div class="tree-node">' + beforeHtml + '</div></div><div class="diff-side-col"><div class="col-label after">After</div><div class="tree-node">' + afterHtml + '</div></div>';
}

function toggleTreeAll(id, expand) {
  var container = document.getElementById(id);
  if (!container) return;
  var details = container.querySelectorAll('details');
  for (var i = 0; i < details.length; i++) {
    details[i].open = expand;
  }
}

function getMethodBadge(method) {
  if (!method) return '';
  return '<span class="method-badge method-' + method + '">' + method + '</span>';
}

function getChangeBadge(ct) {
  var cls = ct === 'ADDED' ? 'added' : (ct === 'REMOVED' ? 'removed' : 'modified');
  return '<span class="change-badge ' + cls + '">' + ct + '</span>';
}

// Build hierarchical tree from flat changes
function buildChangeTree(changes) {
  var tree = {};
  var categoryOrder = ['ENDPOINT','PATH','PARAMETER','REQUEST_BODY','RESPONSE','SCHEMA','PROPERTY','ENUM','SECURITY','SERVER','TAG','COMPONENT'];

  for (var i = 0; i < categoryOrder.length; i++) {
    tree[categoryOrder[i]] = { added: [], removed: [], modified: [] };
  }

  for (var i = 0; i < changes.length; i++) {
    var c = changes[i];
    if (!tree[c.category]) tree[c.category] = { added: [], removed: [], modified: [] };
    if (c.changeType === 'ADDED') tree[c.category].added.push(c);
    else if (c.changeType === 'REMOVED') tree[c.category].removed.push(c);
    else tree[c.category].modified.push(c);
  }

  return { tree: tree, order: categoryOrder };
}

function getChangeCount(tree) {
  return tree.added.length + tree.removed.length + tree.modified.length;
}

// Impact analysis
function analyzeImpact(change, classes, depGraph) {
  var result = { endpoints: [], schemas: [], dtos: [], controllers: [], services: [], repositories: [] };

  if (change.path) {
    result.endpoints.push(change.method ? change.method + ' ' + change.path : change.path);
  }

  var loc = change.location || '';
  var schemaMatch = loc.match(/components\\.schemas\\.([^.]+)/);
  if (schemaMatch) {
    result.schemas.push(schemaMatch[1]);
    result.dtos.push(schemaMatch[1]);
  }

  if (change.path) {
    var tag = '';
    for (var cn in classes) {
      if (classes.hasOwnProperty(cn) && classes[cn].stereotype === 'controller') {
        tag = cn;
      }
    }
    if (tag && classes[tag]) {
      result.controllers.push(tag);
      for (var d = 0; d < depGraph.length; d++) {
        if (depGraph[d].from === tag) {
          var target = depGraph[d].to;
          if (classes[target]) {
            if (classes[target].stereotype === 'service') result.services.push(target);
            else if (classes[target].stereotype === 'repository') result.repositories.push(target);
          }
        }
      }
    }
  }

  if (change.path && result.endpoints.length > 0) {
    for (var cn in classes) {
      if (classes.hasOwnProperty(cn) && classes[cn].stereotype === 'controller') {
        result.controllers.push(cn);
        for (var d = 0; d < depGraph.length; d++) {
          if (depGraph[d].from === cn) {
            var target = depGraph[d].to;
            if (classes[target]) {
              if (classes[target].stereotype === 'service') {
                if (result.services.indexOf(target) === -1) result.services.push(target);
              } else if (classes[target].stereotype === 'repository') {
                if (result.repositories.indexOf(target) === -1) result.repositories.push(target);
              }
            }
          }
        }
      }
    }
  }

  return result;
}

function renderImpactBadges(impact) {
  var html = '<div class="impact-badges">';
  var seen = {};
  var all = [];
  all = all.concat(impact.endpoints.map(function(e) { return { label: e, cls: 'endpoint' }; }));
  all = all.concat(impact.schemas.map(function(s) { return { label: s, cls: 'schema' }; }));
  all = all.concat(impact.dtos.map(function(d) { return { label: d, cls: 'dto' }; }));
  all = all.concat(impact.controllers.map(function(c) { return { label: c, cls: 'controller' }; }));
  all = all.concat(impact.services.map(function(s) { return { label: s, cls: 'service' }; }));
  all = all.concat(impact.repositories.map(function(r) { return { label: r, cls: 'repository' }; }));
  for (var i = 0; i < all.length && i < 10; i++) {
    var item = all[i];
    if (seen[item.label]) continue;
    seen[item.label] = true;
    html += '<span class="impact-badge ' + item.cls + '">' + esc(item.label) + '</span>';
  }
  if (all.length > 10) html += '<span class="impact-badge">+' + (all.length - 10) + '</span>';
  html += '</div>';
  return html;
}

// Build flat change groups
var changeTree = buildChangeTree(changes);
var activeFilters = { added: true, removed: true, modified: true, category: '', method: '', search: '' };

// Sidebar
function renderSidebar() {
  var html = '<div class="header"><h1>API Diff Report</h1><div class="subtitle">' + changes.length + ' changes</div></div>';
  html += '<input id="search" type="text" placeholder="Filter changes..." oninput="window.dispatchEvent(new CustomEvent(\\'filter\\',{detail:{search:this.value}}))">';
  html += '<div class="sidebar-filter-row">';
  html += '<button class="active" data-filter="added" onclick="toggleSidebarFilter(this,\\'added\\')">+Add</button>';
  html += '<button class="active" data-filter="removed" onclick="toggleSidebarFilter(this,\\'removed\\')">-Rem</button>';
  html += '<button class="active" data-filter="modified" onclick="toggleSidebarFilter(this,\\'modified\\')">~Mod</button>';
  html += '</div>';
  html += '<div class="sidebar-scroll">';

  for (var gi = 0; gi < changeTree.order.length; gi++) {
    var cat = changeTree.order[gi];
    var t = changeTree.tree[cat];
    var total = getChangeCount(t);
    if (total === 0) continue;

    html += '<div class="sidebar-section"><details ' + (total <= 10 ? 'open' : '') + '>';
    html += '<summary><span class="arrow">▶</span>' + cat + '<span class="counts">';
    if (t.added.length > 0) html += '<span class="badge-added">+' + t.added.length + '</span> ';
    if (t.removed.length > 0) html += '<span class="badge-removed">-' + t.removed.length + '</span> ';
    if (t.modified.length > 0) html += '<span class="badge-modified">~' + t.modified.length + '</span>';
    html += '</span></summary>';

    var groups = [
      { label: 'Added', items: t.added, cls: 'badge-added' },
      { label: 'Removed', items: t.removed, cls: 'badge-removed' },
      { label: 'Modified', items: t.modified, cls: 'badge-modified' },
    ];
    for (var gi2 = 0; gi2 < groups.length; gi2++) {
      var grp = groups[gi2];
      if (grp.items.length === 0) continue;
      for (var ci = 0; ci < grp.items.length; ci++) {
        var c = grp.items[ci];
        var pathStr = c.path || c.object || c.location || '';
        var method = c.method || '';
        html += '<a class="sidebar-link" href="#" onclick="event.preventDefault();window.scrollToChange(' + changes.indexOf(c) + ')">';
        if (method) html += getMethodBadge(method);
        html += '<span>' + esc(shortPath(pathStr)) + '</span>';
        html += '</a>';
      }
    }
    html += '</details></div>';
  }

  html += '</div>';
  return html;
}

function shortPath(p) {
  if (p.length > 40) return p.substring(0, 37) + '...';
  return p;
}

// Main content
function renderMain() {
  var stats = report.statistics || {};
  var html = '<div class="main-inner">';

  // Export toolbar
  html += '<div class="toolbar">';
  html += '<div class="filter-group">';
  html += '<input type="checkbox" id="flt-added" checked onchange="toggleFilter(\\'added\\',this.checked)"><label for="flt-added" class="badge-added">+Added</label>';
  html += '<input type="checkbox" id="flt-removed" checked onchange="toggleFilter(\\'removed\\',this.checked)"><label for="flt-removed" class="badge-removed">-Removed</label>';
  html += '<input type="checkbox" id="flt-modified" checked onchange="toggleFilter(\\'modified\\',this.checked)"><label for="flt-modified" class="badge-modified">~Modified</label>';
  html += '</div>';
  html += '<div class="filter-group">';
  html += '<select onchange="window.dispatchEvent(new CustomEvent(\\'filter\\',{detail:{category:this.value}}))"><option value="">All Categories</option>';
  for (var gi = 0; gi < changeTree.order.length; gi++) {
    var cat = changeTree.order[gi];
    if (getChangeCount(changeTree.tree[cat]) > 0) {
      html += '<option value="' + cat + '">' + cat + '</option>';
    }
  }
  html += '</select></div>';
  html += '<div class="filter-group">';
  html += '<select onchange="window.dispatchEvent(new CustomEvent(\\'filter\\',{detail:{method:this.value}}))"><option value="">All Methods</option><option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option><option>PATCH</option></select>';
  html += '</div>';
  html += '<button class="export-btn" onclick="exportReport(\\'html\\')">HTML</button>';
  html += '<button class="export-btn" onclick="exportReport(\\'json\\')">JSON</button>';
  html += '<button class="export-btn" onclick="exportReport(\\'md\\')">MD</button>';
  html += '<button class="export-btn" onclick="exportReport(\\'csv\\')">CSV</button>';
  html += '</div>';

  // Overview
  html += '<div class="overview">';
  html += '<div class="stat-card"><div class="stat-value">' + (stats.total || 0) + '</div><div class="stat-label">Total Changes</div></div>';
  html += '<div class="stat-card"><div class="stat-value green">' + (stats.added || 0) + '</div><div class="stat-label">Added</div></div>';
  html += '<div class="stat-card"><div class="stat-value red">' + (stats.removed || 0) + '</div><div class="stat-label">Removed</div></div>';
  html += '<div class="stat-card"><div class="stat-value amber">' + (stats.modified || 0) + '</div><div class="stat-label">Modified</div></div>';
  html += '</div>';

  // Snapshot info
  var snapA = report.snapshotA || {};
  var snapB = report.snapshotB || {};
  html += '<div class="snapshot-info">';
  html += '<div><div class="snap-label">From</div><div class="snap-id">' + esc(snapA.id || 'unknown') + '</div></div>';
  html += '<div class="arrow">→</div>';
  html += '<div><div class="snap-label">To</div><div class="snap-id">' + esc(snapB.id || 'unknown') + '</div></div>';
  html += '</div>';

  // Per-category stats table
  html += '<table class="stats-table">';
  html += '<tr><th>Category</th><th class="num">Total</th><th class="num">Added</th><th class="num">Removed</th><th class="num">Modified</th></tr>';
  var catRows = [
    { label: 'Endpoints', a: 'changedPaths', cat: 'ENDPOINT' },
    { label: 'Schemas', a: 'changedSchemas', cat: 'SCHEMA' },
    { label: 'Properties', a: 'changedSchemas', cat: 'PROPERTY' },
    { label: 'Responses', a: 'changedResponses', cat: 'RESPONSE' },
    { label: 'Parameters', a: 'changedParameters', cat: 'PARAMETER' },
    { label: 'Request Bodies', a: 'changedRequestBodies', cat: 'REQUEST_BODY' },
    { label: 'Enums', a: 'changedEnums', cat: 'ENUM' },
    { label: 'Security', a: 'changedSecurity', cat: 'SECURITY' },
  ];
  for (var ri = 0; ri < catRows.length; ri++) {
    var row = catRows[ri];
    var t = changeTree.tree[row.cat];
    var total = t ? getChangeCount(t) : 0;
    var added = t ? t.added.length : 0;
    var removed = t ? t.removed.length : 0;
    var modified = t ? t.modified.length : 0;
    if (total === 0) continue;
    html += '<tr><td class="link" onclick="scrollToCategory(\\'' + row.cat + '\\')">' + row.label + '</td>';
    html += '<td class="num">' + total + '</td>';
    html += '<td class="num" style="color:#7ec699">' + added + '</td>';
    html += '<td class="num" style="color:#f17070">' + removed + '</td>';
    html += '<td class="num" style="color:#dba638">' + modified + '</td></tr>';
  }
  html += '</table>';

  // Changes by group
  html += '<div id="changes-section">';
  for (var gi = 0; gi < changeTree.order.length; gi++) {
    var cat = changeTree.order[gi];
    var t = changeTree.tree[cat];
    if (getChangeCount(t) === 0) continue;

    html += '<h2 id="section-' + cat + '">' + cat + '</h2>';

    var groups = [
      { label: 'Added', items: t.added },
      { label: 'Removed', items: t.removed },
      { label: 'Modified', items: t.modified },
    ];
    for (var gi2 = 0; gi2 < groups.length; gi2++) {
      var grp = groups[gi2];
      if (grp.items.length === 0) continue;
      html += '<h3>' + grp.label + '</h3>';
      for (var ci = 0; ci < grp.items.length; ci++) {
        html += buildDiffCard(grp.items[ci], changes.indexOf(grp.items[ci]));
      }
    }
  }
  if (changes.length === 0) {
    html += '<div class="no-changes">No differences detected between the two snapshots.</div>';
  }
  html += '</div>';

  html += '</div>';
  return html;
}

function buildDiffCard(c, idx) {
  var pathStr = c.path || c.object || c.location || '';
  var method = c.method || '';
  var impact = analyzeImpact(c, classes, depGraph);
  var hasDiff = c.before !== null || c.after !== null;

  var html = '<div class="diff-card" data-idx="' + idx + '">';
  html += '<div class="diff-card-header" onclick="toggleCard(this.parentElement)">';
  html += '<span class="arrow">▶</span>';
  html += getChangeBadge(c.changeType);
  if (method) {
    html += getMethodBadge(method);
    html += '<span>' + esc(method) + ' ' + esc(pathStr) + '</span>';
    html += '<a class="endpoint-link" href="/#' + esc(pathStr) + '-' + method.toLowerCase() + '" target="_top" onclick="event.stopPropagation()" title="View in API Docs">↗</a>';
  } else {
    html += '<span>' + esc(pathStr) + '</span>';
  }
  html += '<span class="diff-category">' + c.category + '</span>';
  html += '</div>';
  html += '<div class="diff-body">';
  html += renderImpactBadges(impact);
  html += '<div class="diff-details">' + esc(c.details) + '</div>';

  if (hasDiff) {
    html += '<div class="diff-view-toggle">';
    html += '<button class="active" onclick="setDiffView(this,\\'unified\\')">Unified</button>';
    html += '<button onclick="setDiffView(this,\\'side\\')">Side-by-side</button>';
    html += '</div>';
    html += '<div class="diff-view-unified">';
    html += '<div class="diff-unified" style="display:block;background:#1a1a1a;border:1px solid #3c3c3c;border-radius:4px;padding:8px 10px;overflow-x:auto;margin-top:6px">';
    html += renderUnifiedDiff(c.before, c.after);
    html += '</div>';
    html += '</div>';
    html += '<div class="diff-view-side" style="display:none">';
    html += '<div class="diff-side" style="margin-top:6px">';
    html += renderSideBySide(c.before, c.after);
    html += '</div>';
    html += '</div>';
  }

  html += '</div></div>';
  return html;
}

// Card toggle
window.toggleCard = function(el) {
  el.classList.toggle('open');
};

// Scroll to change
window.scrollToChange = function(idx) {
  var cards = document.querySelectorAll('.diff-card');
  for (var i = 0; i < cards.length; i++) {
    if (parseInt(cards[i].dataset.idx) === idx) {
      cards[i].classList.add('open');
      cards[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
      break;
    }
  }
};

// Scroll to category
window.scrollToCategory = function(cat) {
  var el = document.getElementById('section-' + cat);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// Diff view toggle
window.setDiffView = function(btn, mode) {
  var card = btn.closest('.diff-card');
  if (!card) return;
  var toggle = card.querySelector('.diff-view-toggle');
  if (toggle) {
    var btns = toggle.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
  }
  btn.classList.add('active');
  var unified = card.querySelector('.diff-view-unified');
  var side = card.querySelector('.diff-view-side');
  if (unified) unified.style.display = mode === 'unified' ? 'block' : 'none';
  if (side) side.style.display = mode === 'side' ? 'block' : 'none';
};

// Sidebar filter toggle
window.toggleSidebarFilter = function(btn, key) {
  btn.classList.toggle('active');
  activeFilters[key] = btn.classList.contains('active');
  applyFilters();
};

// Main filter toggle
window.toggleFilter = function(key, val) {
  activeFilters[key] = val;
  applyFilters();
};

// Apply all filters
function applyFilters() {
  var cards = document.querySelectorAll('.diff-card');
  var search = (activeFilters.search || '').toLowerCase();

  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    var idx = parseInt(card.dataset.idx);
    var c = changes[idx];
    if (!c) { card.style.display = 'none'; continue; }

    var show = true;

    if (!activeFilters.added && c.changeType === 'ADDED') show = false;
    if (!activeFilters.removed && c.changeType === 'REMOVED') show = false;
    if (!activeFilters.modified && c.changeType !== 'ADDED' && c.changeType !== 'REMOVED') show = false;

    if (show && activeFilters.category && c.category !== activeFilters.category) show = false;
    if (show && activeFilters.method && (c.method || '').toUpperCase() !== activeFilters.method) show = false;
    if (show && search) {
      var text = (c.details + ' ' + (c.path || '') + ' ' + (c.location || '')).toLowerCase();
      if (text.indexOf(search) === -1) show = false;
    }

    card.style.display = show ? '' : 'none';
  }

  // Update sidebar counts
  var visibleCounts = {};
  for (var i = 0; i < changes.length; i++) {
    if (cards[i] && cards[i].style.display !== 'none') {
      var cat = changes[i].category;
      if (!visibleCounts[cat]) visibleCounts[cat] = { added: 0, removed: 0, modified: 0 };
      if (changes[i].changeType === 'ADDED') visibleCounts[cat].added++;
      else if (changes[i].changeType === 'REMOVED') visibleCounts[cat].removed++;
      else visibleCounts[cat].modified++;
    }
  }
}

// Filter event listener
window.addEventListener('filter', function(e) {
  if (e.detail) {
    if (e.detail.search !== undefined) activeFilters.search = e.detail.search;
    if (e.detail.category !== undefined) activeFilters.category = e.detail.category;
    if (e.detail.method !== undefined) activeFilters.method = e.detail.method;
    applyFilters();
  }
});

// Export
window.exportReport = function(format) {
  var data = '';
  var filename = 'diff-report-' + (report.snapshotA ? report.snapshotA.id : 'unknown') + '-' + (report.snapshotB ? report.snapshotB.id : 'unknown');

  switch (format) {
    case 'json':
      data = JSON.stringify(report, null, 2);
      filename += '.json';
      break;
    case 'md':
      data = '# API Diff Report\\n\\n';
      data += '**From:** ' + (report.snapshotA ? report.snapshotA.id : '?') + ' → ' + (report.snapshotB ? report.snapshotB.id : '?') + '\\n\\n';
      data += '## Statistics\\n\\n';
      data += '| Metric | Value |\\n|---|---|\\n';
      var stats = report.statistics || {};
      data += '| Total | ' + (stats.total || 0) + ' |\\n';
      data += '| Added | ' + (stats.added || 0) + ' |\\n';
      data += '| Removed | ' + (stats.removed || 0) + ' |\\n';
      data += '| Modified | ' + (stats.modified || 0) + ' |\\n\\n';
      data += '## Changes\\n\\n';
      for (var i = 0; i < changes.length; i++) {
        var c = changes[i];
        data += '- **[' + c.changeType + ']** ' + c.category + ': ' + c.details + '\\n';
      }
      filename += '.md';
      break;
    case 'csv':
      data = 'Category,ChangeType,Path,Method,Details\\n';
      for (var i = 0; i < changes.length; i++) {
        var c = changes[i];
        data += '"' + (c.category || '') + '","' + c.changeType + '","' + (c.path || '') + '","' + (c.method || '') + '","' + (c.details || '').replace(/"/g,'""') + '"\\n';
      }
      filename += '.csv';
      break;
    default:
      data = '<!DOCTYPE html>\\n<html>\\n<head><title>Diff Report</title></head>\\n<body>\\n' + document.documentElement.outerHTML + '\\n</body>\\n</html>';
      filename += '.html';
      break;
  }

  var blob = new Blob([data], { type: 'text/plain' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// Initial render
document.getElementById('app').innerHTML = '<aside id="sidebar">' + renderSidebar() + '</aside><main>' + renderMain() + '</main>';
applyFilters();
})();
`;

function generateHtmlReport(diffReport, outputDir) {
  var reportJson = JSON.stringify(diffReport, null, 2);

  var timestamp = (function() {
    var now = new Date();
    var y = now.getFullYear();
    var mo = String(now.getMonth() + 1).padStart(2, '0');
    var d = String(now.getDate()).padStart(2, '0');
    var h = String(now.getHours()).padStart(2, '0');
    var mi = String(now.getMinutes()).padStart(2, '0');
    var s = String(now.getSeconds()).padStart(2, '0');
    return y + mo + d + '-' + h + mi + s;
  })();

  var reportDir = path.join(outputDir, timestamp);
  fs.mkdirSync(reportDir, { recursive: true });

  var html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>API Diff Report</title>\n<style>' + CSS + '</style>\n</head>\n<body>\n<div id="app"></div>\n<script id="report-data" type="application/json">' + reportJson + '</script>\n<script>' + APP_JS + '</script>\n</body>\n</html>';

  fs.writeFileSync(path.join(reportDir, 'index.html'), html, 'utf-8');
  fs.writeFileSync(path.join(reportDir, 'diff-report.json'), reportJson, 'utf-8');

  console.log('Diff report generated: ' + reportDir + '/');
  console.log('  └ index.html');
  console.log('  └ diff-report.json');

  return reportDir;
}

module.exports = { generateHtmlReport };
