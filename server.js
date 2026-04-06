const http = require('http');
const fs = require('fs');
const path = require('path');

const TYPES = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
};

http.createServer((req, res) => {
  const filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath)] || 'text/plain' });
    res.end(data);
  });
}).listen(process.env.PORT || 3000, () => console.log(`PawChef running on port ${process.env.PORT || 3000}`));
