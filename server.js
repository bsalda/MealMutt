// LOCAL DEVELOPMENT SERVER ONLY.
// This file is not used by GitHub Pages — GitHub Pages serves all static files
// (HTML, CSS, JS, JSON, PNG, SVG) automatically with correct MIME types.
// Use this only to preview the app locally: node server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const TYPES = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

http.createServer((req, res) => {
  const filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath)] || 'text/plain' });
    res.end(data);
  });
}).listen(process.env.PORT || 3000, () => console.log(`PawChef running on port ${process.env.PORT || 3000}`));
