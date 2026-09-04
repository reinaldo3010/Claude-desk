/*
  Guardião do site Panda Mimo
  ---------------------------
  Abre index.html em três larguras (celular, tablet, desktop) e falha se encontrar:
    - rolagem lateral (scrollWidth maior que a tela)
    - elemento saindo da tela para a esquerda ou direita
    - imagem que não carregou, com width/height fora da proporção real, ou ampliada mais de 2x em tela retina
    - texto cortado (scrollWidth > clientWidth em elementos com overflow hidden)
    - sobreposição entre blocos de conteúdo irmãos (cartões, passos, perguntas)
    - elemento sticky em telas estreitas (causa da sobreposição ao rolar)
    - link interno (#id) sem destino, link WhatsApp sem número, erro de console
    - simulador: prévia não reage ao texto/base/cor; FAQ: abrir um fecha os outros
  Também salva capturas por seção em qa/shots/<largura>/ para homologação visual.

  Uso:  node qa/audit.mjs            (precisa de `npm i -D playwright` na raiz do projeto)
        node qa/audit.mjs --shots    (só capturas, sem falhar)
*/
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const page_url = 'file://' + path.resolve(here, '..', 'index.html');
const onlyShots = process.argv.includes('--shots');
const widths = [390, 768, 1280];
const failures = []; const warnings = [];
const fail = (w, msg) => failures.push(`[${w}px] ${msg}`);

const exe = process.env.CHROMIUM_PATH; // opcional: caminho de um Chromium já instalado
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/fonts|net::|ERR_/.test(m.text()) && consoleErrors.push(m.text()));
  await page.goto(page_url, { waitUntil: 'load' });
  // força o carregamento de todas as imagens preguiçosas
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading]').forEach((i) => (i.loading = 'eager'));
    await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
  });
  await page.waitForTimeout(300);

  const report = await page.evaluate((w) => {
    const out = []; const warns = window.__warns = [];
    const vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > vw) out.push(`rolagem lateral: scrollWidth ${document.documentElement.scrollWidth} > ${vw}`);

    const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };

    // elementos fora da tela (ignora os que estão dentro de um ancestral com overflow clip/hidden)
    const clipped = (el) => { for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'hidden' || o === 'clip') return true; } return false; };
    for (const el of document.querySelectorAll('body *')) {
      if (!visible(el) || clipped(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 || r.left < -1) out.push(`fora da tela: ${el.tagName.toLowerCase()}.${el.className} (${Math.round(r.left)}..${Math.round(r.right)})`);
    }

    // imagens
    for (const img of document.images) {
      if (!img.complete || img.naturalWidth === 0) { out.push(`imagem não carregou: ${img.getAttribute('src').slice(0, 60)}`); continue; }
      const aw = +img.getAttribute('width'), ah = +img.getAttribute('height');
      if (aw && ah) {
        const ratioAttr = aw / ah, ratioReal = img.naturalWidth / img.naturalHeight;
        if (Math.abs(ratioAttr - ratioReal) / ratioReal > 0.03) out.push(`width/height fora da proporção real: ${img.alt || img.className || img.getAttribute('src').slice(0, 40)}`);
      }
    }

    // texto cortado
    for (const el of document.querySelectorAll('h1,h2,h3,p,a,button,summary,li,dd,dt,label,legend,span')) {
      if (!visible(el)) continue;
      const cs = getComputedStyle(el);
      if ((cs.overflowX === 'hidden' || cs.overflow === 'hidden') && el.scrollWidth > el.clientWidth + 1) out.push(`texto cortado: ${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 40)}"`);
    }

    // sobreposição entre irmãos de conteúdo
    const groups = ['.products', '.steps', '.occasions', '.promises', '.care', '.faq__list', '.gallery', '.trust__in', '.builder'];
    for (const sel of groups) {
      const parent = document.querySelector(sel); if (!parent) continue;
      const kids = [...parent.children].filter(visible);
      for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
        const a = kids[i].getBoundingClientRect(), b = kids[j].getBoundingClientRect();
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 4 && oy > 4) out.push(`sobreposição em ${sel}: filhos ${i + 1} e ${j + 1} (${Math.round(ox)}x${Math.round(oy)}px)`);
      }
    }

    // sticky em tela estreita
    if (w < 861) for (const el of document.querySelectorAll('main *')) {
      if (getComputedStyle(el).position === 'sticky') out.push(`sticky em tela estreita: ${el.tagName.toLowerCase()}.${el.className}`);
    }

    // imagens ampliadas além da resolução real (ficam macias em telas de alta densidade)
    for (const img of document.images) {
      if (!img.naturalWidth) continue;
      const r = img.getBoundingClientRect();
      if (r.width * 2 > img.naturalWidth * 2.0 && r.width > 120) out.push(`imagem ampliada demais (${(r.width * 2 / img.naturalWidth).toFixed(1)}x em tela retina): ${img.getAttribute('src').slice(0, 50)} (${img.naturalWidth}px reais, ${Math.round(r.width)}px exibidos)`);
      else if (r.width * 2 > img.naturalWidth * 1.25 && r.width > 120) warns.push(`imagem ampliada ${(r.width * 2 / img.naturalWidth).toFixed(1)}x em tela retina: ${img.getAttribute('src').slice(0, 50)} (${img.naturalWidth}px reais, ${Math.round(r.width)}px exibidos)`);
      if (!img.hasAttribute('alt')) out.push(`imagem sem atributo alt: ${img.getAttribute('src').slice(0, 50)}`);
    }
    for (const a of document.querySelectorAll('a, button')) {
      if (!visible(a)) continue;
      if (!a.textContent.trim() && !a.getAttribute('aria-label')) out.push(`link/botão sem texto nem aria-label: ${a.className}`);
    }

    // links
    for (const a of document.querySelectorAll('a[href^="#"]')) {
      const id = a.getAttribute('href').slice(1);
      if (id && !document.getElementById(id)) out.push(`âncora sem destino: #${id}`);
    }
    for (const a of document.querySelectorAll('.js-wa')) if (!/^https:\/\/wa\.me\/\d{8,}/.test(a.href)) out.push(`link WhatsApp inválido: ${a.href.slice(0, 50)}`);
    return out;
  }, w);
  report.forEach((r) => fail(w, r));
  (await page.evaluate(() => window.__warns)).forEach((m) => warnings.push(`[${w}px] ${m}`));
  consoleErrors.forEach((e) => fail(w, `erro de console: ${e}`));

  // comportamento do simulador
  await page.fill('#b-nome', 'Beatriz');
  const txt = await page.$eval('#pv-garrafa .pv-text', (t) => t.textContent);
  if (txt !== 'Beatriz') fail(w, `prévia não atualizou o nome (veio "${txt}")`);
  const pick = (id) => page.$eval(`label[for="${id}"]`, (l) => l.click()); // os rádios são visualmente ocultos; clica no rótulo
  await pick('i-copo');
  const copoVis = await page.$eval('#pv-copo', (g) => !g.hidden), garrafaVis = await page.$eval('#pv-garrafa', (g) => !g.hidden);
  if (!copoVis || garrafaVis) fail(w, 'troca de base não alternou a prévia');
  await pick('c-preta');
  const ink = await page.$eval('.preview', (p) => getComputedStyle(p).getPropertyValue('--pv-ink').trim());
  if (!/FBF6EF/i.test(ink)) fail(w, `cor preta não trocou a cor do texto (--pv-ink=${ink})`);
  await pick('i-garrafa'); await pick('c-creme'); await page.fill('#b-nome', 'Malu');

  // FAQ: um aberto por vez
  const items = await page.$$('.faq__item');
  await items[2].$eval('summary', (s) => s.click());
  await page.waitForTimeout(100);
  const open = await page.$$eval('.faq__item[open]', (l) => l.length);
  if (open !== 1) fail(w, `FAQ com ${open} itens abertos ao mesmo tempo`);
  await items[0].$eval('summary', (s) => s.click());

  // capturas por seção (sem barra fixa nem botão flutuante, que só confundem a homologação)
  await page.evaluate(() => { window.scrollTo(0, 0); document.querySelector('.topbar').style.position = 'static'; document.querySelector('.fab').style.display = 'none'; });
  const dir = path.join(here, 'shots', String(w)); fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
  const sections = await page.$$('header.topbar, main > section, main > .trust, footer');
  let n = 0;
  for (const s of sections) {
    const id = (await s.getAttribute('id')) || (await s.getAttribute('class')).split(' ')[0];
    await s.screenshot({ path: path.join(dir, `${String(++n).padStart(2, '0')}-${id}.png`) }).catch(() => {});
  }
  await page.screenshot({ path: path.join(dir, '00-pagina.png'), fullPage: true });
  await page.close();
}
await browser.close();

if (onlyShots) { console.log('capturas salvas em qa/shots/'); process.exit(0); }
if (warnings.length) console.log(`\n⚠ ${warnings.length} aviso(s) (não bloqueiam):\n` + [...new Set(warnings)].map((f) => '  - ' + f).join('\n'));
if (failures.length) {
  console.error(`\n✗ ${failures.length} problema(s):\n` + failures.map((f) => '  - ' + f).join('\n'));
  process.exit(1);
}
console.log('✓ guardião: nenhum problema encontrado nas larguras ' + widths.join(', '));
