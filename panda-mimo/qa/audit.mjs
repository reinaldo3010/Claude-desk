/*
  Guardião do site Panda Mimo
  ---------------------------
  Abre index.html em 14 tamanhos de tela (de 320x568 a 1920x1080) e falha se encontrar:
    - rolagem lateral; elemento saindo da tela
    - imagem que não carregou, com width/height fora da proporção real, ampliada mais de 2x
      em tela retina, cortada pelo contêiner, ou sem atributo alt
    - texto cortado; sobreposição entre blocos irmãos (cartões, passos, perguntas)
    - elemento sticky em tela estreita (sobreposição ao rolar)
    - link com href="#" após o carregamento; âncora sem destino; link WhatsApp sem número
    - âncora do menu parando debaixo do cabeçalho fixo
    - menu do celular que não abre/fecha (aria-expanded) ou não fecha ao clicar num link / Escape
    - botão flutuante do WhatsApp visível com um campo em foco (teclado aberto) ou sobre o contato
    - simulador: nome vazio/curto/longo/acentos/emoji, todas as bases, cores e letras,
      quantidade 1/maior/inválida; texto que não cabe na peça; mensagem sem algum dado
    - FAQ: só um aberto por vez, aria-expanded coerente, resposta não cortada
    - erro de console; requisição local falhando (404 etc.)
  Também salva capturas por seção em qa/shots/<largura>/ para homologação visual
  e, com --links, imprime o inventário de todos os links/botões.

  Uso:  node qa/audit.mjs            (precisa de `npm i` na pasta panda-mimo)
        node qa/audit.mjs --shots    (só capturas, sem falhar)
        CHROMIUM_PATH=/caminho/chrome node qa/audit.mjs   (usa um Chromium já instalado)
*/
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const page_url = 'file://' + path.resolve(here, '..', 'index.html');
const onlyShots = process.argv.includes('--shots');
const viewports = [[320, 568], [360, 800], [375, 667], [375, 812], [390, 844], [393, 852], [414, 896], [768, 1024], [820, 1180], [1024, 768], [1280, 720], [1366, 768], [1440, 900], [1920, 1080]];
const shotWidths = new Set([320, 390, 768, 1280, 1920]);
const failures = []; const warnings = []; const links = new Map();
const fail = (w, msg) => failures.push(`[${w}px] ${msg}`);

const exe = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});

async function loadImages(page) {
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading]').forEach((i) => (i.loading = 'eager'));
    await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
  });
  await page.waitForTimeout(250);
}

for (const [w, h] of viewports) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const consoleErrors = [], netFailures = [];
  page.on('pageerror', (e) => consoleErrors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/fonts\.g|net::ERR_CONNECTION|ERR_NAME|ERR_INTERNET/.test(m.text()) && consoleErrors.push(m.text()));
  page.on('requestfailed', (r) => !/fonts\.g|gstatic/.test(r.url()) && netFailures.push(`${r.url().slice(0, 80)} ${r.failure()?.errorText}`));
  page.on('response', (r) => r.status() >= 400 && netFailures.push(`${r.status()} ${r.url().slice(0, 80)}`));
  await page.goto(page_url, { waitUntil: 'load' });
  await loadImages(page);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });

  const report = await page.evaluate((w) => {
    const out = []; const warns = (window.__warns = []);
    const vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > vw) out.push(`rolagem lateral: scrollWidth ${document.documentElement.scrollWidth} > ${vw}`);
    const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
    const clipped = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'hidden' || o === 'clip') return true; } return false; };
    for (const el of document.querySelectorAll('body *')) {
      if (!visible(el) || clipped(el) || getComputedStyle(el).position === 'fixed') continue;
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 || r.left < -1) out.push(`fora da tela: ${el.tagName.toLowerCase()}.${el.className} (${Math.round(r.left)}..${Math.round(r.right)})`);
    }
    for (const img of document.images) {
      if (!img.hasAttribute('alt')) out.push(`imagem sem atributo alt: ${img.getAttribute('src').slice(0, 50)}`);
      if (!img.complete || img.naturalWidth === 0) { out.push(`imagem não carregou: ${img.getAttribute('src').slice(0, 60)}`); continue; }
      const aw = +img.getAttribute('width'), ah = +img.getAttribute('height');
      if (aw && ah) {
        const ratioAttr = aw / ah, ratioReal = img.naturalWidth / img.naturalHeight;
        if (Math.abs(ratioAttr - ratioReal) / ratioReal > 0.03) out.push(`width/height fora da proporção real: ${img.getAttribute('src').slice(0, 50)}`);
      }
      const r = img.getBoundingClientRect();
      // tamanho realmente desenhado na tela: com contain/cover a imagem não ocupa a caixa inteira
      const fit = getComputedStyle(img).objectFit;
      let drawn = r.width;
      if (fit === 'contain') drawn = img.naturalWidth * Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
      else if (fit === 'cover') drawn = img.naturalWidth * Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight);
      else if (fit === 'none') drawn = img.naturalWidth;
      const zoom = drawn * 2 / img.naturalWidth; // 2x = tela de alta densidade
      if (drawn > 120 && zoom > 2.0) out.push(`imagem ampliada demais (${zoom.toFixed(1)}x retina): ${img.getAttribute('src').slice(0, 50)}`);
      else if (drawn > 120 && zoom > 1.25) warns.push(`imagem ampliada ${zoom.toFixed(1)}x em retina: ${img.getAttribute('src').slice(0, 50)}`);
      const p = img.parentElement, pr = p.getBoundingClientRect();
      if (getComputedStyle(img).objectFit === 'cover' && Math.abs(r.width / r.height - img.naturalWidth / img.naturalHeight) > 0.08) (img.closest('.product, .gallery, .hero') ? out : warns).push(`imagem recortada por object-fit: cover: ${img.getAttribute('src').slice(0, 50)}`);
      if (getComputedStyle(p).overflow === 'hidden' && (r.left < pr.left - 1 || r.right > pr.right + 1 || r.top < pr.top - 1 || r.bottom > pr.bottom + 1)) out.push(`imagem cortada pelo contêiner: ${img.getAttribute('src').slice(0, 50)}`);
    }
    for (const el of document.querySelectorAll('h1,h2,h3,p,a,button,summary,li,dd,dt,label,legend,span,small')) {
      if (!visible(el)) continue;
      const cs = getComputedStyle(el);
      if ((cs.overflowX === 'hidden' || cs.overflow === 'hidden' || cs.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 1) out.push(`texto cortado: ${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 40)}"`);
    }
    const groups = ['.products', '.steps', '.occasions', '.promises', '.care', '.faq__list', '.gallery', '.trust__in', '.builder', '.hero__actions', '.contact__actions', '.follow__links', '.footer__nav', '.topbar__in'];
    for (const sel of groups) {
      const parent = document.querySelector(sel); if (!parent) continue;
      const kids = [...parent.children].filter((k) => visible(k) && getComputedStyle(k).position !== 'absolute');
      for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
        const a = kids[i].getBoundingClientRect(), b = kids[j].getBoundingClientRect();
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 4 && oy > 4) out.push(`sobreposição em ${sel}: filhos ${i + 1} e ${j + 1} (${Math.round(ox)}x${Math.round(oy)}px)`);
      }
    }
    if (w < 861) for (const el of document.querySelectorAll('main *')) if (getComputedStyle(el).position === 'sticky') out.push(`sticky em tela estreita: ${el.tagName.toLowerCase()}.${el.className}`);
    for (const a of document.querySelectorAll('a')) {
      const href = a.getAttribute('href');
      if (href === '#' || href === '' || href == null) out.push(`link sem destino real: "${a.textContent.trim().slice(0, 30) || a.getAttribute('aria-label')}"`);
      if (href && href.startsWith('#') && href.length > 1 && !document.getElementById(href.slice(1))) out.push(`âncora sem destino: ${href}`);
      if (a.classList.contains('js-wa') && !/^https:\/\/wa\.me\/\d{8,}\?text=/.test(a.href)) out.push(`link WhatsApp inválido: ${a.href.slice(0, 50)}`);
      if (a.target === '_blank' && !/noopener/.test(a.rel)) out.push(`link _blank sem rel=noopener: ${a.textContent.trim().slice(0, 30)}`);
    }
    for (const a of document.querySelectorAll('a, button')) if (visible(a) && !a.textContent.trim() && !a.getAttribute('aria-label')) out.push(`link/botão sem texto nem aria-label: ${a.className}`);
    for (const inp of document.querySelectorAll('input')) if (!document.querySelector(`label[for="${inp.id}"]`) && !inp.getAttribute('aria-label')) out.push(`campo sem label: #${inp.id}`);
    return out;
  }, w);
  report.forEach((r) => fail(w, r));
  (await page.evaluate(() => window.__warns)).forEach((m) => warnings.push(`[${w}px] ${m}`));

  if (links.size === 0) {
    const inv = await page.$$eval('a, button, summary', (els) => els.map((e) => ({
      tag: e.tagName.toLowerCase(), text: (e.textContent.trim() || e.getAttribute('aria-label') || '').slice(0, 42),
      href: e.getAttribute('href') ? e.href.slice(0, 60) : (e.id ? '#' + e.id : e.className),
    })));
    inv.forEach((i, n) => links.set(n, i));
  }

  // âncoras chegam abaixo do cabeçalho fixo
  const topH = await page.$eval('.topbar', (t) => t.getBoundingClientRect().height);
  for (const href of ['#produtos', '#monte', '#ocasioes', '#como-funciona', '#duvidas', '#contato', '#empresas', '#cuidados']) {
    await page.evaluate((id) => document.getElementById(id).scrollIntoView({ behavior: 'instant', block: 'start' }), href.slice(1));
    const top = await page.evaluate((id) => document.getElementById(id).getBoundingClientRect().top, href.slice(1));
    if (top < topH - 2) fail(w, `âncora ${href} fica ${Math.round(topH - top)}px debaixo do cabeçalho`);
  }
  await page.evaluate(() => window.scrollTo(0, 0));

  // menu do celular
  if (w < 961) {
    const toggle = await page.$('.menu-toggle');
    if (!toggle) fail(w, 'menu do celular ausente');
    else {
      await toggle.click(); await page.waitForTimeout(100);
      const open = (await page.$eval('.menu-toggle', (b) => b.getAttribute('aria-expanded') === 'true')) && (await page.$eval('#nav-principal', (n) => getComputedStyle(n).display !== 'none'));
      if (!open) fail(w, 'menu do celular não abre');
      const navOver = await page.evaluate(() => { const r = document.getElementById('nav-principal').getBoundingClientRect(); return r.right > document.documentElement.clientWidth + 1 || r.left < -1; });
      if (navOver) fail(w, 'menu aberto sai da tela');
      await page.$eval('#nav-principal a[href="#ocasioes"]', (a) => a.click()); await page.waitForTimeout(150);
      if (!(await page.$eval('.menu-toggle', (b) => b.getAttribute('aria-expanded') === 'false'))) fail(w, 'menu não fecha ao clicar num link');
      const top = await page.evaluate(() => document.getElementById('ocasioes').getBoundingClientRect().top);
      if (top < topH - 2) fail(w, 'link do menu leva a seção para debaixo do cabeçalho');
      await toggle.click(); await page.keyboard.press('Escape'); await page.waitForTimeout(100);
      if (!(await page.$eval('.menu-toggle', (b) => b.getAttribute('aria-expanded') === 'false'))) fail(w, 'menu não fecha com Escape');
    }
  } else if (await page.$eval('.menu-toggle', (b) => getComputedStyle(b).display !== 'none')) fail(w, 'botão de menu aparece no desktop');
  await page.evaluate(() => window.scrollTo(0, 0));

  // botão flutuante
  await page.focus('#b-nome'); await page.waitForTimeout(100);
  if (!(await page.$eval('.fab', (f) => f.classList.contains('is-hidden')))) fail(w, 'botão flutuante visível com o teclado aberto');
  await page.$eval('#b-nome', (i) => i.blur());
  await page.evaluate(() => document.getElementById('contato').scrollIntoView({ behavior: 'instant', block: 'center' })); await page.waitForTimeout(350);
  if (!(await page.$eval('.fab', (f) => f.classList.contains('is-hidden')))) fail(w, 'botão flutuante sobre a seção de contato');
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(350);
  if (await page.$eval('.fab', (f) => f.classList.contains('is-hidden'))) fail(w, 'botão flutuante não volta a aparecer');

  // simulador
  const pick = (id) => page.$eval(`label[for="${id}"]`, (l) => l.click());
  const setNome = (v) => page.fill('#b-nome', v);
  const largura = { garrafa: 84, caneca: 120, copo: 92 };
  for (const base of ['garrafa', 'caneca', 'copo']) {
    await pick(`i-${base}`);
    for (const letra of ['redonda', 'manuscrita']) {
      await pick(`l-${letra}`);
      for (const nome of ['', 'Jo', 'Malu', 'João Ção', 'Ana & Bia #1', 'Beatriz Gonçalves', 'Maria Eduarda 2', 'Malu 🐼💕']) {
        await setNome(nome);
        const r = await page.evaluate((b) => {
          const g = document.getElementById(`pv-${b}`); const t = g.querySelector('.pv-text');
          return { hidden: g.hidden, text: t.textContent, width: t.getComputedTextLength() };
        }, base);
        if (r.hidden) fail(w, `base ${base} não aparece`);
        if (r.text !== (nome.trim() || 'Seu nome')) fail(w, `prévia não mostra "${nome}" em ${base}/${letra} (veio "${r.text}")`);
        if (r.width > largura[base] + 2) fail(w, `texto "${nome}" não cabe na ${base} com letra ${letra} (${Math.round(r.width)} > ${largura[base]})`);
      }
    }
    for (const cor of ['creme', 'salvia', 'pessego', 'preta']) {
      await pick(`c-${cor}`);
      const fill = await page.$eval(`#pv-${base} .pv-body`, (b) => getComputedStyle(b).fill);
      if (!fill || fill === 'none') fail(w, `cor ${cor} não pintou a ${base}`);
    }
  }
  const ink = await page.$eval('.preview', (p) => getComputedStyle(p).getPropertyValue('--pv-ink').trim());
  if (!/FBF6EF/i.test(ink)) fail(w, `cor preta não trocou a cor do texto (--pv-ink=${ink})`);
  for (const [val, esperado] of [['0', 1], ['-3', 1], ['abc', 1], ['9999', 500], ['12', 12], ['2.7', 2], ['', 1]]) {
    await page.$eval('#b-qtd', (i, v) => { i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); i.blur(); }, val);
    const got = await page.$eval('#b-qtd', (i) => i.value);
    if (+got !== esperado) fail(w, `quantidade "${val}" virou "${got}" (esperado ${esperado})`);
  }
  await page.fill('#b-qtd', '3');
  await pick('i-copo'); await pick('c-salvia'); await pick('l-manuscrita'); await setNome('Beatriz'); await page.$eval('#b-panda', (c) => { if (c.checked) c.click(); });
  const msg = await page.evaluate(() => new Promise((res) => { const o = window.open; window.open = (u) => { window.open = o; res(decodeURIComponent(u.split('text=')[1])); }; document.getElementById('b-send').click(); }));
  for (const parte of ['copo térmico', 'sálvia', '"Beatriz"', 'letra manuscrita', 'sem o pandinha', 'Quantidade: 3']) if (!msg.includes(parte)) fail(w, `mensagem do WhatsApp sem "${parte}"`);
  await page.$eval('#b-panda', (c) => { if (!c.checked) c.click(); }); await pick('i-garrafa'); await pick('c-creme'); await pick('l-redonda'); await setNome('Malu'); await page.fill('#b-qtd', '1');

  // FAQ
  const items = await page.$$('.faq__item');
  for (let i = 0; i < items.length; i++) {
    if (!(await items[i].evaluate((d) => d.open))) await items[i].$eval('summary', (s) => s.click());
    await page.waitForTimeout(60);
    const open = await page.$$eval('.faq__item[open]', (l) => l.length);
    const expanded = await items[i].$eval('summary', (s) => s.getAttribute('aria-expanded'));
    const isOpen = await items[i].evaluate((d) => d.open);
    if (open !== 1 || !isOpen) fail(w, `FAQ pergunta ${i + 1}: ${open} abertos após clicar`);
    if (expanded !== 'true') fail(w, `FAQ pergunta ${i + 1} sem aria-expanded=true`);
    if (await items[i].$eval('p', (p) => p.scrollWidth > p.clientWidth + 1)) fail(w, `FAQ pergunta ${i + 1} com resposta cortada`);
  }
  await items[0].$eval('summary', (s) => s.click());
  if (await items[1].evaluate((d) => d.open)) fail(w, 'FAQ não fecha ao abrir outra');

  consoleErrors.forEach((e) => fail(w, `erro de console: ${e}`));
  netFailures.forEach((e) => fail(w, `falha de rede: ${e}`));

  if (shotWidths.has(w)) {
    await page.evaluate(() => { window.scrollTo(0, 0); document.querySelector('.topbar').style.position = 'static'; document.querySelector('.fab').style.display = 'none'; });
    const dir = path.join(here, 'shots', String(w)); fs.mkdirSync(dir, { recursive: true });
    for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
    if (w < 961) { await page.$eval('.menu-toggle', (b) => b.click()); await page.screenshot({ path: path.join(dir, '01a-menu-aberto.png') }); await page.$eval('.menu-toggle', (b) => b.click()); }
    const sections = await page.$$('header.topbar, main > section, main > .trust, footer');
    let n = 0;
    for (const s of sections) {
      const id = (await s.getAttribute('id')) || (await s.getAttribute('class')).split(' ')[0];
      await s.screenshot({ path: path.join(dir, `${String(++n).padStart(2, '0')}-${id}.png`) }).catch(() => {});
    }
    await page.screenshot({ path: path.join(dir, '00-pagina.png'), fullPage: true });
  }
  await page.close();
}
await browser.close();

console.log(`\nInventário: ${links.size} links/botões/resumos encontrados`);
if (process.argv.includes('--links')) for (const [, l] of links) console.log(`  ${l.tag.padEnd(7)} ${l.text.padEnd(44)} → ${l.href}`);
if (onlyShots) { console.log('capturas salvas em qa/shots/'); process.exit(0); }
if (warnings.length) console.log(`\n⚠ ${[...new Set(warnings)].length} aviso(s) (não bloqueiam):\n` + [...new Set(warnings)].map((f) => '  - ' + f).join('\n'));
if (failures.length) {
  console.error(`\n✗ ${failures.length} problema(s):\n` + failures.map((f) => '  - ' + f).join('\n'));
  process.exit(1);
}
console.log('✓ guardião: nenhum problema nas ' + viewports.length + ' resoluções testadas');
