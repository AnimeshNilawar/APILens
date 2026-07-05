const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DOCS_ROOT = path.join(__dirname, '..', 'output', 'latest');
const REPORTS_DIR = path.join(__dirname, '..', 'output', 'reports', 'diff');

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

function sendHtml(res, html) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
}

function serveReportList(res) {
  fs.readdir(REPORTS_DIR, { withFileTypes: true }, (err, entries) => {
    const dirs = [];
    if (!err) {
      for (const e of entries) {
        if (!e.isDirectory()) continue;
        if (!/^\d{8}-\d{6}$/.test(e.name)) continue;
        const metaPath = path.join(REPORTS_DIR, e.name, 'diff-report.json');
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
          dirs.push({
            id: e.name,
            stats: meta.statistics || {},
            snapA: (meta.snapshotA || {}).id || '?',
            snapB: (meta.snapshotB || {}).id || '?',
            generatedAt: meta.generatedAt || '',
          });
        } catch (e2) {
          dirs.push({
            id: e.name,
            stats: { total: 0 },
            snapA: '?',
            snapB: '?',
            generatedAt: null,
          });
        }
      }
    }
    dirs.sort((a, b) => b.id.localeCompare(a.id));

    const CSS = `*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,sans-serif;background:#1e1e1e;color:#d4d4d4;padding:32px;max-width:800px;margin:0 auto}
h1{font-size:20px;font-weight:600;color:#e0e0e0;margin-bottom:24px;padding-bottom:8px;border-bottom:1px solid #3c3c3c}
h2{font-size:14px;font-weight:600;color:#e0e0e0;margin:24px 0 8px}
.back{display:inline-block;margin-bottom:16px;font-size:13px;color:#569cd6;text-decoration:none}
.back:hover{text-decoration:underline}
.report-card{background:#252526;border:1px solid #3c3c3c;border-radius:8px;padding:14px 18px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between}
.report-card:hover{background:#2a2a2a}
.report-card .left{flex:1}
.report-card .report-id{font-family:'SF Mono','Fira Code',monospace;font-size:13px;font-weight:600;color:#e0e0e0}
.report-card .report-meta{font-size:11px;color:#888;margin-top:4px}
.report-card .report-stats{display:flex;gap:12px;font-size:12px}
.report-card .stat{text-align:center;min-width:36px}
.report-card .stat-value{font-weight:700;font-size:14px}
.report-card .stat-value.green{color:#7ec699}
.report-card .stat-value.red{color:#f17070}
.report-card .stat-value.amber{color:#dba638}
.report-card .stat-label{font-size:9px;color:#888;text-transform:uppercase;letter-spacing:.5px}
.report-card .stat-value.total{font-size:18px;color:#e0e0e0}
a{color:inherit;text-decoration:none}
.empty{text-align:center;padding:48px;color:#888;font-size:14px}
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-track{background:0 0}
::-webkit-scrollbar-thumb{background:#3c3c3c;border-radius:3px}`;

    let html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Diff Reports</title><style>${CSS}</style></head><body>`;
    html += '<a class="back" href="/">← Back to API Documentation</a>';
    html += '<h1>Diff Reports</h1>';

    if (dirs.length === 0) {
      html += '<div class="empty">No diff reports generated yet.</div>';
    } else {
      html += '<div class="subtitle" style="font-size:12px;color:#888;margin-bottom:16px">' + dirs.length + ' report(s)</div>';
      for (const d of dirs) {
        const s = d.stats;
        html += '<a class="report-card" href="/reports/' + d.id + '/">';
        html += '<div class="left">';
        html += '<div class="report-id">' + d.id + '</div>';
        html += '<div class="report-meta">' + d.snapA + ' → ' + d.snapB + (d.generatedAt ? ' · ' + new Date(d.generatedAt).toLocaleString() : '') + '</div>';
        html += '</div>';
        html += '<div class="report-stats">';
        html += '<div class="stat"><div class="stat-value total">' + (s.total || 0) + '</div><div class="stat-label">Changes</div></div>';
        html += '<div class="stat"><div class="stat-value green">+' + (s.added || 0) + '</div><div class="stat-label">Added</div></div>';
        html += '<div class="stat"><div class="stat-value red">-' + (s.removed || 0) + '</div><div class="stat-label">Removed</div></div>';
        html += '<div class="stat"><div class="stat-value amber">~' + (s.modified || 0) + '</div><div class="stat-label">Modified</div></div>';
        html += '</div>';
        html += '</a>';
      }
    }

    html += '</body></html>';
    sendHtml(res, html);
  });
}

function start(port) {
  const srv = http.createServer((req, res) => {
    if (req.url === '/favicon.ico') {
      res.writeHead(204); res.end();
      return;
    }

    const url = req.url.split('?')[0].replace(/\/+$/, '') || '/';

    if (url === '/reports' || url === '/reports/index' || url === '/reports/index.html') {
      serveReportList(res);
      return;
    }

    if (url.startsWith('/reports/')) {
      const relPath = url.slice('/reports'.length);
      const filePath = path.join(REPORTS_DIR, relPath || '');
      const normalized = path.normalize(filePath);
      if (!normalized.startsWith(REPORTS_DIR)) {
        res.writeHead(403); res.end('Forbidden');
        return;
      }
      fs.stat(normalized, (err, stat) => {
        if (err || !stat) {
          res.writeHead(404); res.end('Not found');
          return;
        }
        if (stat.isDirectory()) {
          const indexPath = path.join(normalized, 'index.html');
          sendFile(res, indexPath);
        } else {
          sendFile(res, normalized);
        }
      });
      return;
    }

    const filePath = path.join(DOCS_ROOT, url === '/' ? 'index.html' : url);
    const normalized = path.normalize(filePath);
    if (!normalized.startsWith(DOCS_ROOT)) {
      res.writeHead(403); res.end('Forbidden');
      return;
    }
    sendFile(res, normalized);
  });

  srv.on('error', function(e) {
    if (e.code === 'EADDRINUSE') {
      console.log('Port ' + port + ' in use, trying ' + (port + 1));
      start(port + 1);
    }
  });

  srv.listen(port, function() {
    console.log('http://localhost:' + port);
  });
}

start(PORT);
