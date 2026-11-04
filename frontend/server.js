// Servidor estático mínimo do frontend Arena+ (sem dependências).
// Uso: node server.js  ->  http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
};

http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (rel === '/') rel = '/index.html';
  const arquivo = path.normalize(path.join(ROOT, rel));
  // Impede acesso fora da pasta do frontend e ao próprio servidor
  if (!arquivo.startsWith(ROOT + path.sep) || arquivo === __filename) {
    res.writeHead(403).end('Proibido');
    return;
  }
  fs.readFile(arquivo, (err, dados) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404</h1><p>Página não encontrada. <a href="/">Voltar para a Arena+</a></p>');
      return;
    }
    res.writeHead(200, {
      'Content-Type': TIPOS[path.extname(arquivo).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(dados);
  });
}).listen(PORT, () => {
  console.log(`Frontend Arena+ em http://localhost:${PORT}`);
});
