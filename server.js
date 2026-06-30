const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = path.join(__dirname, 'output');

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function start(port) {
  const srv = http.createServer((req, res) => {
    if (req.url === '/favicon.ico') {
      res.writeHead(204); res.end();
      return;
    }
    let filePath = path.join(ROOT, req.url === '/' ? 'index.html' : req.url);
    filePath = path.normalize(filePath);
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403); res.end('Forbidden');
      return;
    }
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
