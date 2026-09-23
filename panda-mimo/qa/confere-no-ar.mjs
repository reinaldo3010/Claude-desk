/*
  Confere o site publicado com navegador de verdade, como gente (criado em 23/09/2026): abre a página
  inicial, desce até o estúdio, troca de peça pelo botão, conta os modelos de cada uma, lê o pedido,
  volta à caneca e testa o "Ver com meu nome" da garrafa. Anota erro de página, de console e toda
  resposta com erro, com a URL.

    node qa/confere-no-ar.mjs <versão> [larguras] [pasta]    ex.: node qa/confere-no-ar.mjs 5d2b347 1280,390

  A versão vai no endereço (?v=) para fugir do cache. Logo depois do "publicar" terminar, o GitHub
  Pages pode responder 503 por um minuto: repita antes de chamar de defeito.
*/
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VERSAO = process.argv[2] || 'novo';
const SAIDA = path.resolve(process.argv[4] || path.join(RAIZ, 'qa', 'shots'));
fs.mkdirSync(SAIDA, { recursive: true });
const { chromium } = await import(pathToFileURL(path.join(RAIZ, 'node_modules/playwright/index.mjs')).href);
const browser = await chromium.launch();
const resultado = {};
const LARGURAS = (process.argv[3] || '1280,390').split(',').map(Number);
for (const [w, h, toque] of [[1280, 800, false], [390, 844, true]].filter(([largura]) => LARGURAS.includes(largura))) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: toque, isMobile: toque });
  const p = await ctx.newPage();
  const erros = [];
  p.on('pageerror', (e) => erros.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
  p.on('response', (resposta) => { if (resposta.status() >= 400) erros.push(`${resposta.status()} em ${resposta.url()}`); });
  await p.goto(`https://reinaldo3010.github.io/Claude-desk/?v=${VERSAO}`, { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  await p.evaluate(() => document.getElementById('monte')?.scrollIntoView({ block: 'start', behavior: 'instant' }));
  const abriu = await p.waitForFunction(() => !!document.querySelector('#estudio-no-site canvas.mug-3d-canvas') && document.getElementById('viewer-loading')?.hidden, null, { timeout: 60000 }).then(() => true).catch(() => false);
  const r = { abriu };
  if (abriu) {
    await p.waitForTimeout(1500);
    r.pecas = await p.evaluate(() => [...document.querySelectorAll('[data-peca-botao]')].map((b) => `${b.dataset.pecaBotao}${b.getAttribute('aria-pressed') === 'true' ? '*' : ''}`).join(' '));
    r.modelosDaCaneca = await p.evaluate(() => document.querySelectorAll('#model-list .studio-model[data-modelo]:not([data-modelo=""])').length);
    for (const peca of ['garrafa', 'ecobag']) {
      await p.locator(`[data-peca-botao="${peca}"]`).click();
      const trocou = await p.waitForFunction((x) => document.querySelector(`[data-peca-botao="${x}"]`)?.getAttribute('aria-pressed') === 'true', peca, { timeout: 30000 }).then(() => true).catch(() => false);
      await p.waitForTimeout(2500);
      r[peca] = await p.evaluate(() => ({
        modelos: document.querySelectorAll('#model-list .studio-model[data-modelo]:not([data-modelo=""])').length,
        medida: document.getElementById('flat-medida')?.textContent,
        pedido: (new URL(document.getElementById('mug-order').href, location.href).searchParams.get('text') || '').split('\n').slice(0, 2).join(' / '),
      }));
      r[peca].trocou = trocou;
      await p.evaluate(() => document.getElementById('pecas')?.scrollIntoView({ block: 'start', behavior: 'instant' }));
      await p.waitForTimeout(600);
      await p.screenshot({ path: path.join(SAIDA, `no-ar-${peca}-${w}.png`) });
    }
    await p.locator('[data-peca-botao="caneca"]').click();
    await p.waitForTimeout(1500);
    r.voltouNaCaneca = await p.evaluate(() => document.querySelector('[data-peca-botao][aria-pressed="true"]')?.dataset.pecaBotao);
    // O "Ver com meu nome" da garrafa, no catálogo do site.
    r.verComMeuNome = await p.evaluate(async () => {
      const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
      document.querySelector('.product[data-slug="garrafas-termicas"] .product__ver')?.click();
      await espera(500);
      const botao = document.getElementById('detalhe-personalizar');
      const visivel = !!botao && !botao.hidden;
      botao?.click();
      for (let i = 0; i < 60 && document.querySelector('[data-peca-botao][aria-pressed="true"]')?.dataset.pecaBotao !== 'garrafa'; i += 1) await espera(150);
      return { visivel, peca: document.querySelector('[data-peca-botao][aria-pressed="true"]')?.dataset.pecaBotao };
    });
  }
  r.erros = erros;
  resultado[w] = r;
  await ctx.close();
}
console.log(JSON.stringify(resultado, null, 1));
await browser.close();
