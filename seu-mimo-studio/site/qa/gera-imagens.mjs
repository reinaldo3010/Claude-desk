/*
  Gera os arquivos de imagem que o site precisa e que não existem como vetor pronto:
  os ícones do navegador (a partir do avatar do kit) e a imagem de compartilhamento.

  Nada aqui desenha marca nova: tudo sai de seu-mimo-studio/kit, que é a fonte da verdade.
  Rode de dentro de seu-mimo-studio/site:  npm run imagens

  Se algum dia o kit mudar (logo, símbolo, avatar), rode de novo e os arquivos se atualizam.
*/
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const assets = path.resolve(here, '..', 'assets');
const ler = (f) => fs.readFileSync(path.join(assets, f), 'utf8');

const exe = process.env.CHROMIUM_PATH;
const browser = await chromium.launch({ ...(exe ? { executablePath: exe } : {}), args: ['--allow-file-access-from-files'] });

/* ---------- ícones do navegador: o avatar (círculo oliva com o símbolo) ---------- */
const avatar = ler('avatar.svg');
const icones = [
  ['favicon-32.png', 32],
  ['apple-touch-icon.png', 180],
  ['icone-192.png', 192],
  ['icone-512.png', 512],
];
for (const [nome, lado] of icones) {
  const page = await browser.newPage({ viewport: { width: lado, height: lado }, deviceScaleFactor: 1 });
  await page.setContent(
    `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}
     svg{display:block;width:${lado}px;height:${lado}px}</style>${avatar}`
  );
  await page.screenshot({ path: path.join(assets, nome), omitBackground: true });
  await page.close();
  console.log(`  ${nome} (${lado}x${lado})`);
}

/* ---------- imagem de compartilhamento: 1200x630, exigida pelo WhatsApp e pelo Facebook ---------- */
{
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const logo = ler('logo-principal.svg');
  // a página montada por setContent não tem origem: um file:// aqui seria bloqueado, então a foto vai embutida
  const mascote = 'data:image/webp;base64,' + fs.readFileSync(path.join(assets, 'mascote-abertura@2x.webp')).toString('base64');
  await page.setContent(`<!doctype html><meta charset="utf-8">
    <style>
      html,body{margin:0}
      body{width:1200px;height:630px;background:#E6D9CA;display:flex;align-items:center;
           justify-content:space-between;gap:48px;padding:0 76px;box-sizing:border-box;overflow:hidden}
      .copy{display:flex;flex-direction:column;gap:26px;max-width:600px}
      .copy svg{display:block;width:440px;height:auto}
      .descritor{font:600 19px/1.4 system-ui,sans-serif;letter-spacing:.22em;text-transform:uppercase;
                 color:rgba(58,46,33,.62);margin:0}
      .mascote{width:360px;height:auto;display:block;flex:none}
    </style>
    <div class="copy">${logo}<p class="descritor">Presentes personalizados</p></div>
    <img class="mascote" src="${mascote}" alt="">`);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
  await page.screenshot({ path: path.join(assets, 'og.jpg'), type: 'jpeg', quality: 90 });
  await page.close();
  console.log('  og.jpg (1200x630)');
}

await browser.close();
console.log('\n✓ imagens geradas a partir do kit da marca');
