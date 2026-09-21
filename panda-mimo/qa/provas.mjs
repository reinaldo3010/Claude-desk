/*
  Provas visuais dos modelos de arte da caneca.

  Abre o estúdio, escolhe cada modelo, preenche os espaços de foto com imagens do próprio acervo
  e salva a vista aberta (a volta inteira, 21 × 9 cm) em PNG. Serve para a revisão humana do
  manual: ver cada arte no tamanho de uso antes de publicar.

  Uso:  node qa/provas.mjs <pasta-de-destino>
*/
import { chromium } from 'playwright';
import { servir } from './servidor.mjs';
import fs from 'node:fs';
import path from 'node:path';
const destino = process.argv[2];
const fontes = ['assets/uso-caneca-cafe.webp', 'assets/foto-caneca.webp', 'assets/uso-garrafa.webp', 'assets/foto-caixa.webp', 'assets/uso-ecobag.webp', 'assets/uso-copo.webp'];
const s = await servir();
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
p.on('console', (m) => m.type() === 'error' && console.log('ERRO', m.text()));
p.on('pageerror', (e) => console.log('EXCEÇÃO', e.message));
let proxima = 0;
p.on('filechooser', async (fc) => {
  const arquivo = fontes[proxima % fontes.length];
  proxima += 1;
  await fc.setFiles(path.resolve('.', arquivo));
});
await p.goto(s.url + 'caneca-3d.html', { waitUntil: 'load' });
await p.waitForFunction(() => document.querySelectorAll('#model-list .studio-model').length > 1);
await p.evaluate(() => { const b = document.getElementById('model-more'); if (b && !b.hidden) b.click(); });
await p.waitForTimeout(400);
const ids = await p.$$eval('#model-list .studio-model', (b) => b.map((x) => x.dataset.modelo).filter(Boolean));
for (const id of ids) {
  await p.click(`[data-modelo="${id}"]`);
  await p.waitForTimeout(300);
  const espacos = await p.$$eval('#camadas .studio-camada', (bs) => bs.filter((b) => b.querySelector('small')?.textContent === 'Escolher foto').length);
  for (let i = 0; i < espacos; i += 1) {
    await p.evaluate(() => {
      const alvo = [...document.querySelectorAll('#camadas .studio-camada')].find((b) => b.querySelector('small')?.textContent === 'Escolher foto');
      alvo?.click();
    });
    await p.waitForFunction((n) => [...document.querySelectorAll('#camadas .studio-camada small')].filter((s) => s.textContent === 'Escolher foto').length === n, espacos - i - 1, { timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(250);
  }
  await p.waitForTimeout(500);
  // Clique no canto vazio da vista aberta para soltar a seleção e capturar a arte limpa.
  await p.evaluate(() => {
    const flat = document.getElementById('flat-art');
    const caixa = flat.getBoundingClientRect();
    flat.dispatchEvent(new PointerEvent('pointerdown', { clientX: caixa.left + 3, clientY: caixa.top + 3, bubbles: true, pointerId: 9 }));
    flat.dispatchEvent(new PointerEvent('pointerup', { clientX: caixa.left + 3, clientY: caixa.top + 3, bubbles: true, pointerId: 9 }));
  });
  await p.waitForTimeout(400);
  const dados = await p.evaluate(() => document.getElementById('flat-art').toDataURL('image/png'));
  fs.writeFileSync(`${destino}/${id}.png`, Buffer.from(dados.split(',')[1], 'base64'));
  console.log(id, '→', (await p.$eval('#art-warnings', (e) => e.textContent)) || 'sem avisos');
}
await b.close();
await s.close();
