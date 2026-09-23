/*
  Servidor estático mínimo para o site, sem dependências.

  O estúdio da caneca (caneca-3d.html) desenha imagens em canvas e as envia ao WebGL.
  Aberto por file://, o navegador trata cada imagem como de outra origem e bloqueia
  a leitura do canvas. Servido por http://localhost funciona igual ao site publicado.

  Uso:  node qa/servidor.mjs            (imprime o endereço e fica servindo)
        import { servir } from './servidor.mjs'  → const s = await servir(); s.url; s.close()
*/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
};

/*
  `QA_SOBREPOR` aponta uma pasta cujos arquivos passam na frente dos do site, no mesmo caminho. É por ela
  que a prova de defeito reinsere um defeito: a cópia estragada fica numa pasta temporária e o arquivo
  de verdade nunca é tocado. Antes a prova reescrevia o próprio arquivo, e o dono, com o estúdio aberto
  no navegador, abriu justamente a versão estragada (23/09/2026).
*/
export function servir(raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), porta = 0, { sobre = process.env.QA_SOBREPOR } = {}) {
  raiz = path.resolve(raiz); // com barra normal ("C:/...") a comparação de prefixo abaixo recusava tudo
  const pastaDeCima = sobre ? path.resolve(sobre) : null;
  const naPastaDeCima = (caminho) => {
    if (!pastaDeCima) return null;
    const arquivo = path.resolve(pastaDeCima, '.' + caminho);
    return arquivo.startsWith(pastaDeCima) && fs.existsSync(arquivo) && fs.statSync(arquivo).isFile() ? arquivo : null;
  };
  const servidor = http.createServer((req, res) => {
    let caminho;
    try { caminho = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
    if (caminho.endsWith('/')) caminho += 'index.html';
    const deCima = naPastaDeCima(caminho);
    const arquivo = deCima || path.resolve(raiz, '.' + caminho);
    if (!deCima && (!arquivo.startsWith(raiz) || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory())) {
      const p404 = path.resolve(raiz, '404.html');
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.existsSync(p404) ? fs.readFileSync(p404) : 'não encontrado');
      return;
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(arquivo).pipe(res);
  });
  return new Promise((resolve, reject) => {
    servidor.once('error', reject);
    servidor.listen(porta, '127.0.0.1', () => {
      const url = `http://127.0.0.1:${servidor.address().port}/`;
      resolve({ url, close: () => new Promise((r) => servidor.close(r)) });
    });
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const s = await servir(undefined, Number(process.env.PORT || process.env.PORTA) || 8765);
  console.log(`Site da Panda Mimo em ${s.url}  (estúdio: ${s.url}caneca-3d.html)`);
}
