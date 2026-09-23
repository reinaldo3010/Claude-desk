/*
  Folha de contato dos modelos de uma peça (criada em 23/09/2026, na primeira leva da garrafa e da
  ecobag): uma linha por modelo, com a arte aberta à esquerda e a peça em 3D de frente e de costas.
  É o "desenhar, olhar, corrigir" das coleções: a primeira leva da garrafa passou em todos os testes e
  estava miúda, e só esta folha mostrou.

    node qa/folha-de-modelos.mjs garrafa [cor] [pasta]    cor: creme, salvia, pessego, preta
    node qa/folha-de-modelos.mjs ecobag [cru] [pasta]

  Sai em <pasta>/folha-<peça>-<cor>.png (por padrão, qa/shots).
*/
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const [pecaArg = 'garrafa', cor = 'creme', saidaArg] = process.argv.slice(2);
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = path.resolve(saidaArg || path.join(RAIZ, 'qa', 'shots'));
fs.mkdirSync(SAIDA, { recursive: true });
const { chromium } = await import(pathToFileURL(path.join(RAIZ, 'node_modules/playwright/index.mjs')).href);
const { servir } = await import(pathToFileURL(path.join(RAIZ, 'qa/servidor.mjs')).href);
const servidor = await servir(RAIZ);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
const p = await ctx.newPage();
const erros = [];
p.on('pageerror', (e) => erros.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
await p.route('**/rest/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
await p.goto(`${servidor.url}caneca-3d.html?peca=${pecaArg}`, { waitUntil: 'load' });
await p.waitForFunction(() => document.getElementById('viewer-loading')?.hidden && document.querySelector('#mug-viewport canvas.mug-3d-canvas'), null, { timeout: 45000 });
await p.evaluate((c) => document.querySelector(`#cores-corpo [data-cor="${c}"]`)?.click(), cor);
await p.waitForTimeout(600);
const ids = await p.evaluate(() => [...document.querySelectorAll('#model-list .studio-model[data-modelo]:not([data-modelo=""])')].map((b) => b.dataset.modelo));
const quadros = [];
for (const id of ids) {
  await p.evaluate((m) => document.querySelector(`.studio-model[data-modelo="${m}"]`).click(), id);
  await p.waitForFunction((m) => document.querySelector(`.studio-model[data-modelo="${m}"][aria-pressed="true"]`), id, { timeout: 8000 });
  await p.waitForTimeout(1400);
  const tres = (await p.locator('#mug-viewport canvas.mug-3d-canvas').screenshot()).toString('base64');
  await p.evaluate(() => document.querySelector('.studio-view-buttons [data-view="back"]').click());
  await p.waitForTimeout(500);
  const verso = (await p.locator('#mug-viewport canvas.mug-3d-canvas').screenshot()).toString('base64');
  await p.evaluate(() => document.querySelector('.studio-view-buttons [data-view="front"]').click());
  await p.waitForTimeout(300);
  const plana = await p.evaluate(() => document.getElementById('flat-art').toDataURL('image/png'));
  const nome = await p.evaluate((m) => document.querySelector(`.studio-model[data-modelo="${m}"] .studio-model__nome`)?.textContent, id);
  quadros.push({ id, nome, tres: `data:image/png;base64,${tres}`, verso: `data:image/png;base64,${verso}`, plana });
}
// A folha: arte aberta à esquerda, a garrafa de frente e de costas à direita, uma linha por modelo.
const folha = await p.evaluate(async (lista) => {
  const carrega = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
  const linha = 330, largura = 1500;
  const c = document.createElement('canvas'); c.width = largura; c.height = linha * lista.length + 20;
  const g = c.getContext('2d'); g.fillStyle = '#fbf6ef'; g.fillRect(0, 0, c.width, c.height);
  let y = 10;
  for (const q of lista) {
    const [plana, tres, verso] = await Promise.all([carrega(q.plana), carrega(q.tres), carrega(q.verso)]);
    const altura = linha - 40;
    const lp = altura * plana.width / plana.height;
    g.drawImage(plana, 10, y + 30, lp, altura);
    const l3 = altura * tres.width / tres.height;
    g.drawImage(tres, 20 + lp, y + 30, l3, altura);
    g.drawImage(verso, 30 + lp + l3, y + 30, l3, altura);
    g.fillStyle = '#171512'; g.font = '600 18px sans-serif';
    g.fillText(`${q.nome}  (${q.id})`, 12, y + 22);
    y += linha;
  }
  return c.toDataURL('image/png');
}, quadros);
fs.writeFileSync(path.join(SAIDA, `folha-${pecaArg}-${cor}.png`), Buffer.from(folha.split(',')[1], 'base64'));
console.log(JSON.stringify({ modelos: ids.length, erros }, null, 1));
await browser.close();
await servidor.close();
