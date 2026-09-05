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
    - carrossel: bolinhas na quantidade certa, avança e volta, status coerente
    - catálogo do banco substituindo a cópia local (com o banco simulado)
    - painel (admin.html): carrega sem erro, exige login, e o preparo de foto
      recusa fundo sólido e entrega quadro quadrado transparente
    - detalhe do produto: abre pelo botão e pelo endereço (#produto/slug), mostra
      fotos, preço e botão do WhatsApp, fecha com Escape
    - simulador em modo foto real: o nome aparece dentro da plaquinha
    - movimento: nada fica invisível depois de rolar até a seção
    - ícones PNG e de toque, imagem de compartilhamento 1200x630 em JPG,
      robots.txt e sitemap.xml; aviso quando os endereços ainda são relativos
    - medição: a visita e o clique no WhatsApp são registrados (com o banco simulado)
    - foto de produto que não seja um quadro quadrado transparente: fundo retangular
      aparecendo nos cantos, ou peça encostando na borda (risco de estar cortada)
    - erro de console; requisição local falhando (404 etc.)
  Também salva capturas por seção em qa/shots/<largura>/ para homologação visual
  e, com --links, imprime o inventário de todos os links/botões.

  Uso:  node qa/audit.mjs            (precisa de `npm i` na pasta panda-mimo)
        node qa/audit.mjs --shots    (só capturas, sem falhar)
        QA_VIEWPORTS=390 node qa/audit.mjs   (só uma largura, para checagem rápida)
        CHROMIUM_PATH=/caminho/chrome node qa/audit.mjs   (usa um Chromium já instalado)
*/
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const page_url = 'file://' + path.resolve(here, '..', 'index.html');
const onlyShots = process.argv.includes('--shots');
const TODAS = [[320, 568], [360, 800], [375, 667], [375, 812], [390, 844], [393, 852], [414, 896], [768, 1024], [820, 1180], [1024, 768], [1280, 720], [1366, 768], [1440, 900], [1920, 1080]];
// QA_VIEWPORTS=390,1280 roda só essas larguras (útil para uma checagem rápida)
const filtro = (process.env.QA_VIEWPORTS || '').split(',').filter(Boolean).map(Number);
const viewports = filtro.length ? TODAS.filter(([w]) => filtro.includes(w)) : TODAS;
const shotWidths = new Set([320, 390, 768, 1280, 1920]);
const failures = []; const warnings = []; const links = new Map(); let quadrosConferidos = false;
const fail = (w, msg) => failures.push(`[${w}px] ${msg}`);

const exe = process.env.CHROMIUM_PATH;
const browser = await chromium.launch({ ...(exe ? { executablePath: exe } : {}), args: ['--allow-file-access-from-files'] });

async function loadImages(page) {
  // o catálogo pode vir do banco: espera assentar antes de conferir qualquer coisa
  await page.evaluate(() => window.PANDA_CATALOGO || true).catch(() => {});
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
  page.on('console', (m) => m.type() === 'error' && !/fonts\.g|Failed to load resource|net::ERR_/.test(m.text()) && consoleErrors.push(m.text()));
  const externo = (u) => !u.startsWith('file://');
  page.on('requestfailed', (r) => !externo(r.url()) && netFailures.push(`${r.url().slice(0, 80)} ${r.failure()?.errorText}`));
  page.on('response', (r) => r.status() >= 400 && !externo(r.url()) && netFailures.push(`${r.status()} ${r.url().slice(0, 80)}`));
  await page.goto(page_url, { waitUntil: 'load' });
  await loadImages(page);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });

  const report = await page.evaluate((w) => {
    const out = []; const warns = (window.__warns = []);
    const vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > vw) out.push(`rolagem lateral: scrollWidth ${document.documentElement.scrollWidth} > ${vw}`);
    const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
    const clipped = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'hidden' || o === 'clip' || o === 'auto' || o === 'scroll') return true; } return false; };
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
      if (el.clientWidth <= 2 || el.clientHeight <= 2) continue; // texto só para leitor de tela
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

    // o catálogo é montado a partir dos dados: sem ele a seção fica vazia
    const cartoes = document.querySelectorAll('#lista-produtos .product');
    if (cartoes.length < 2) out.push(`catálogo com só ${cartoes.length} produto(s) na tela`);
    cartoes.forEach((c, i) => {
      if (!c.querySelector('h3')?.textContent.trim()) out.push(`produto ${i + 1} sem nome`);
      if (!c.querySelector('.product__body p')?.textContent.trim()) out.push(`produto ${i + 1} sem descrição`);
      if (!c.querySelector('img')) out.push(`produto ${i + 1} sem foto`);
      const cta = c.querySelector('.product__cta');
      if (!cta || !/^https:\/\/wa\.me\/\d{8,}/.test(cta.href)) out.push(`produto ${i + 1} sem botão de WhatsApp válido`);
    });
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

  // as fotos de produto precisam ser quadros quadrados transparentes, com a peça inteira
  if (!quadrosConferidos) {
    quadrosConferidos = true;
    const tiles = await page.evaluate(() => {
      const out = [];
      const cv = document.createElement('canvas'); const ctx = cv.getContext('2d', { willReadFrequently: true });
      const N = 200, LIMITE = 12;
      for (const img of document.querySelectorAll('.carousel img')) {
        const nome = img.getAttribute('src').slice(0, 46);
        const [nw, nh] = [img.naturalWidth, img.naturalHeight];
        if (!nw) { out.push(`foto de produto não carregou: ${nome}`); continue; }
        if (Math.abs(nw - nh) > 1) { out.push(`foto de produto não é quadrada (${nw}x${nh}), pode ser cortada: ${nome}`); continue; }
        cv.width = cv.height = N; ctx.clearRect(0, 0, N, N); ctx.drawImage(img, 0, 0, N, N);
        let data;
        try { data = ctx.getImageData(0, 0, N, N).data; } catch (e) { out.push(`não deu para inspecionar os pixels (${e.name}); rode o navegador com --allow-file-access-from-files`); break; }
        const al = (x, y) => data[(y * N + x) * 4 + 3];
        for (const [x, y, q] of [[1, 1, 'superior esquerdo'], [N - 2, 1, 'superior direito'], [1, N - 2, 'inferior esquerdo'], [N - 2, N - 2, 'inferior direito']])
          if (al(x, y) > LIMITE) { out.push(`foto de produto com fundo retangular (canto ${q} opaco): ${nome}`); break; }
        const borda = 3, toca = new Set();
        for (let i = 0; i < N; i++) for (let m = 0; m < borda; m++) {
          if (al(i, m) > LIMITE) toca.add('topo');
          if (al(i, N - 1 - m) > LIMITE) toca.add('base');
          if (al(m, i) > LIMITE) toca.add('esquerda');
          if (al(N - 1 - m, i) > LIMITE) toca.add('direita');
        }
        if (toca.size) out.push(`peça encostando na borda da foto (${[...toca].join(', ')}), risco de corte: ${nome}`);
        // foto retangular colada no quadro: as quatro bordas da caixa vêm cheias
        let x0 = N, y0 = N, x1 = -1, y1 = -1;
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (al(x, y) > LIMITE) {
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
        if (x1 >= 0) {
          const frac = (pts) => pts.filter(([x, y]) => al(x, y) > LIMITE).length / pts.length;
          const cols = [], lins = [];
          for (let x = x0; x <= x1; x++) cols.push(x);
          for (let y = y0; y <= y1; y++) lins.push(y);
          const bordas = [frac(cols.map((x) => [x, y0])), frac(cols.map((x) => [x, y1])),
                          frac(lins.map((y) => [x0, y])), frac(lins.map((y) => [x1, y]))];
          if (Math.min(...bordas) > 0.8) out.push(`foto de produto é um retângulo de foto, não a peça recortada: ${nome}`);
        }
      }
      return out;
    });
    tiles.forEach((m) => fail(w, m));
  }

  // carrossel: avança, volta e mantém as bolinhas em dia
  for (const car of await page.$$('[data-carousel]')) {
    const n = (await car.$$('.carousel__slide')).length;
    const bolinhas = (await car.$$('.carousel__dot')).length;
    const rotulo = await car.getAttribute('aria-label');
    if (bolinhas !== n) fail(w, `${rotulo}: ${n} fotos e ${bolinhas} bolinhas`);
    await car.$eval('.carousel__nav--next', (b) => b.click());
    await page.waitForTimeout(420);
    const st = await car.$eval('.carousel__status', (e) => e.textContent);
    if (st !== `Foto 2 de ${n}`) fail(w, `${rotulo}: não avançou (status "${st}")`);
    const marcadas = await car.$$eval('.carousel__dot[aria-current="true"]', (l) => l.length);
    if (marcadas !== 1) fail(w, `${rotulo}: ${marcadas} bolinhas marcadas ao mesmo tempo`);
    await car.$eval('.carousel__nav--prev', (b) => b.click());
    await page.waitForTimeout(420);
    const st0 = await car.$eval('.carousel__status', (e) => e.textContent);
    if (st0 !== `Foto 1 de ${n}`) fail(w, `${rotulo}: não voltou (status "${st0}")`);
  }

  // lançamentos em teste: selo "Em breve" no quadro, ilustração, "Me avise" medido por peça, sem tela de detalhe
  for (const card of await page.$$('.product--lancamento')) {
    const r = await card.evaluate((el) => {
      const selo = el.querySelector('.product__selo'); const cta = el.querySelector('.product__cta');
      const rs = selo && selo.getBoundingClientRect(), rf = el.querySelector('.product__photo')?.getBoundingClientRect();
      return {
        nome: el.querySelector('h3')?.textContent.trim() || el.dataset.slug,
        selo: selo ? selo.textContent.trim() : '', seloVisivel: !!rs && rs.width > 0 && getComputedStyle(selo).visibility !== 'hidden',
        seloDentro: !!rs && !!rf && rs.left >= rf.left && rs.top >= rf.top && rs.right <= rf.right && rs.bottom <= rf.bottom,
        temDetalhe: !!el.querySelector('.product__ver'), temPreco: !!el.querySelector('.product__preco'),
        cta: cta ? cta.textContent.trim() : '', href: cta ? cta.href : '', rotulo: cta ? cta.dataset.rotulo || '' : '',
        temFoto: !!el.querySelector('.carousel img'),
      };
    });
    if (r.selo !== 'Em breve' || !r.seloVisivel) fail(w, `${r.nome}: lançamento sem o selo "Em breve"`);
    else if (!r.seloDentro) fail(w, `${r.nome}: selo "Em breve" fora do quadro da ilustração`);
    if (r.temDetalhe || r.temPreco) fail(w, `${r.nome}: lançamento não pode ter "Ver detalhes" nem preço`);
    if (!r.cta.startsWith('Me avise')) fail(w, `${r.nome}: o botão do lançamento deveria ser "Me avise" (está "${r.cta}")`);
    if (!/wa\.me/.test(r.href) || !/avisa/i.test(decodeURIComponent(r.href))) fail(w, `${r.nome}: o "Me avise" não abre o WhatsApp pedindo aviso do lançamento`);
    if (!r.rotulo.includes(r.nome)) fail(w, `${r.nome}: o clique não seria medido com o nome da peça (rótulo "${r.rotulo}")`);
    if (!r.temFoto) fail(w, `${r.nome}: lançamento sem ilustração no quadro`);
    else {
      await card.$eval('.carousel img', (i) => i.click());
      await page.waitForTimeout(150);
      if (await page.$eval('#detalhe', (d) => d.open)) { fail(w, `${r.nome}: clicar na ilustração de um lançamento abriu a tela de detalhe`); await page.$eval('#detalhe', (d) => d.close()); }
    }
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
          const outras = ['garrafa', 'caneca', 'copo'].filter((x) => x !== b).filter((x) => getComputedStyle(document.getElementById(`pv-${x}`)).display !== 'none');
          return { hidden: getComputedStyle(g).display === 'none', outras, text: t.textContent, width: t.getComputedTextLength() };
        }, base);
        if (r.hidden) fail(w, `base ${base} não aparece no desenho`);
        if (r.outras.length) fail(w, `base ${base} escolhida, mas o desenho ainda mostra ${r.outras.join(' e ')}`);
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

  // detalhe do produto
  {
    const nomeCard = await page.$eval('#lista-produtos .product h3', (h) => h.textContent.trim());
    await page.$eval('#lista-produtos .product .product__ver', (b) => b.click());
    await page.waitForTimeout(200);
    const d = await page.evaluate(() => {
      const dlg = document.getElementById('detalhe');
      return {
        aberto: dlg.open, titulo: document.getElementById('detalhe-titulo').textContent.trim(),
        minis: document.querySelectorAll('#detalhe-miniaturas button').length,
        preco: document.getElementById('detalhe-preco').textContent.trim(),
        zap: document.getElementById('detalhe-zap').href, hash: location.hash,
        fotoOk: document.getElementById('detalhe-foto').naturalWidth > 0,
        dentro: (() => { const r = dlg.getBoundingClientRect(); return r.left >= -1 && r.right <= document.documentElement.clientWidth + 1; })(),
      };
    });
    if (!d.aberto) fail(w, 'detalhe do produto não abriu');
    if (d.titulo !== nomeCard) fail(w, `detalhe abriu com título "${d.titulo}" em vez de "${nomeCard}"`);
    if (d.minis < 1) fail(w, 'detalhe sem miniaturas');
    if (!d.preco) fail(w, 'detalhe sem preço nem "sob consulta"');
    if (!/^https:\/\/wa\.me\/\d{8,}/.test(d.zap)) fail(w, 'detalhe sem botão de WhatsApp válido');
    if (!/^#produto\//.test(d.hash)) fail(w, `detalhe não atualizou o endereço (hash "${d.hash}")`);
    if (!d.fotoOk) fail(w, 'detalhe com a foto grande vazia');
    if (!d.dentro) fail(w, 'detalhe sai da tela');
    await page.keyboard.press('Escape'); await page.waitForTimeout(150);
    const depois = await page.evaluate(() => ({ aberto: document.getElementById('detalhe').open, hash: location.hash }));
    if (depois.aberto) fail(w, 'detalhe não fecha com Escape');
    if (/^#produto\//.test(depois.hash)) fail(w, 'detalhe fechou mas o endereço continuou apontando para o produto');
  }

  // simulador em modo foto real
  {
    await page.fill('#b-nome', 'Beatriz');
    await page.$eval('label[for="m-foto"]', (l) => l.click()); await page.waitForTimeout(250);
    const f = await page.evaluate(() => {
      const foto = document.getElementById('foto-real'), placa = document.getElementById('foto-real-placa'), nome = document.getElementById('foto-real-nome');
      const rp = placa.getBoundingClientRect(), rn = nome.getBoundingClientRect();
      return {
        fotoVisivel: !foto.hidden && getComputedStyle(foto).display !== 'none',
        desenhoEscondido: getComputedStyle(document.querySelector('.preview')).display === 'none',
        texto: nome.textContent, cabe: rn.left >= rp.left - 1 && rn.right <= rp.right + 1 && rn.top >= rp.top - 1 && rn.bottom <= rp.bottom + 1,
        placaNaFoto: (() => { const ri = document.getElementById('foto-real-img').getBoundingClientRect(); return rp.left > ri.left && rp.right < ri.right && rp.top > ri.top && rp.bottom < ri.bottom; })(),
        coresDesligadas: document.getElementById('c-creme').disabled,
      };
    });
    if (!f.fotoVisivel) fail(w, 'modo foto real não mostrou a foto');
    if (!f.desenhoEscondido) fail(w, 'modo foto real deixou o desenho aparecendo junto');
    if (f.texto !== 'Beatriz') fail(w, `nome na foto real veio "${f.texto}"`);
    if (!f.cabe) fail(w, 'nome na foto real saiu da plaquinha');
    if (!f.placaNaFoto) fail(w, 'plaquinha da foto real fora da área da foto');
    if (!f.coresDesligadas) fail(w, 'modo foto real deixou as cores ativas, mas elas não valem na foto');
    for (const base of ['garrafa', 'copo', 'caneca']) {
      await page.$eval(`label[for="i-${base}"]`, (l) => l.click()); await page.waitForTimeout(120);
      const ok = await page.evaluate(() => { const rp = document.getElementById('foto-real-placa').getBoundingClientRect(), rn = document.getElementById('foto-real-nome').getBoundingClientRect(); return rn.right <= rp.right + 1 && rn.left >= rp.left - 1; });
      if (!ok) fail(w, `nome na foto real saiu da plaquinha na base ${base}`);
    }
    await page.$eval('label[for="m-desenho"]', (l) => l.click()); await page.waitForTimeout(120);
    await page.fill('#b-nome', 'Malu');
    if (!(await page.$eval('#foto-real', (f) => f.hidden))) fail(w, 'voltar para o desenho não escondeu a foto real');
    if (await page.$eval('#c-creme', (c) => c.disabled)) fail(w, 'voltar para o desenho não religou as cores');
  }

  // movimento: depois de rolar até uma seção ela precisa estar visível
  {
    await page.evaluate(() => document.getElementById('contato').scrollIntoView({ behavior: 'instant', block: 'center' }));
    await page.waitForTimeout(450);
    const op = await page.$eval('#contato', (s) => getComputedStyle(s).opacity);
    if (Number(op) < 0.99) fail(w, `seção de contato ficou com opacidade ${op} depois de rolar até ela`);
    const primeiraInvisivel = await page.evaluate(() => { window.scrollTo(0, 0); const h = document.querySelector('.hero'); return getComputedStyle(h).opacity !== '1'; });
    if (primeiraInvisivel) fail(w, 'o hero, que já está na tela, começa invisível');
  }

  consoleErrors.forEach((e) => fail(w, `erro de console: ${e}`));
  netFailures.forEach((e) => fail(w, `falha de rede: ${e}`));

  if (shotWidths.has(w)) {
    await page.evaluate(() => { window.PANDA_REVELA_TUDO && window.PANDA_REVELA_TUDO(); window.scrollTo(0, 0); document.querySelector('.topbar').style.position = 'static'; document.querySelector('.fab').style.display = 'none'; });
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
// ---- cabeçalho, ícones e arquivos de lançamento ----
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(page_url, { waitUntil: 'load' });
  const cab = await page.evaluate(async () => {
    const q = (s) => document.querySelector(s);
    const og = q('meta[property="og:image"]')?.content || '';
    const mede = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok([i.naturalWidth, i.naturalHeight]); i.onerror = () => ok(null); i.src = src; });
    return {
      faviconPng: !!q('link[rel="icon"][type="image/png"]'),
      apple: !!q('link[rel="apple-touch-icon"]'),
      og, ogDim: /\.(jpe?g|png)$/i.test(og) ? await mede(og.includes('assets/') ? og.slice(og.indexOf('assets/')) : og) : null,
      ogUrl: q('meta[property="og:url"]')?.content || '',
      twitter: q('meta[name="twitter:card"]')?.content || '',
      canonical: q('link[rel="canonical"]')?.href || '',
    };
  });
  if (!cab.faviconPng) failures.push('[cabeçalho] falta favicon em PNG (o Safari não aceita WebP)');
  if (!cab.apple) failures.push('[cabeçalho] falta o ícone de toque da Apple');
  if (!/\.(jpe?g|png)$/i.test(cab.og)) failures.push(`[cabeçalho] og:image precisa ser JPG ou PNG (está "${cab.og}")`);
  else if (!cab.ogDim || cab.ogDim[0] !== 1200 || cab.ogDim[1] !== 630) failures.push(`[cabeçalho] og:image precisa ter 1200x630 (tem ${cab.ogDim})`);
  if (cab.twitter !== 'summary_large_image') failures.push('[cabeçalho] falta twitter:card summary_large_image');
  if (!/^https?:\/\//.test(cab.og)) warnings.push('[antes de ir ao ar] og:image ainda é relativo; WhatsApp e Facebook exigem o endereço completo');
  if (!cab.canonical) warnings.push('[antes de ir ao ar] falta <link rel="canonical"> com o domínio final');
  for (const f of ['robots.txt', 'sitemap.xml', 'assets/og.jpg', 'assets/apple-touch-icon.png', 'assets/favicon-32.png'])
    if (!fs.existsSync(path.resolve(here, '..', f))) failures.push(`[lançamento] falta o arquivo ${f}`);
  if (fs.existsSync(path.resolve(here, '..', 'sitemap.xml')) && fs.readFileSync(path.resolve(here, '..', 'sitemap.xml'), 'utf8').includes('SEU-DOMINIO'))
    warnings.push('[antes de ir ao ar] sitemap.xml e robots.txt ainda têm SEU-DOMINIO no lugar do endereço');
  // canonical, og:url, og:image, robots e sitemap precisam apontar para o mesmo endereço
  if (/^https?:\/\//.test(cab.canonical)) {
    const base = cab.canonical.replace(/[^/]*$/, '');
    const robots = fs.existsSync(path.resolve(here, '..', 'robots.txt')) ? fs.readFileSync(path.resolve(here, '..', 'robots.txt'), 'utf8') : '';
    const sitemap = fs.existsSync(path.resolve(here, '..', 'sitemap.xml')) ? fs.readFileSync(path.resolve(here, '..', 'sitemap.xml'), 'utf8') : '';
    if (cab.ogUrl && cab.ogUrl !== cab.canonical) failures.push(`[cabeçalho] og:url (${cab.ogUrl}) diferente do canonical (${cab.canonical})`);
    if (/^https?:\/\//.test(cab.og) && !cab.og.startsWith(base)) failures.push(`[cabeçalho] og:image aponta para outro endereço (${cab.og}) que não o canonical (${base})`);
    if (!robots.includes(`Sitemap: ${base}sitemap.xml`)) failures.push(`[lançamento] robots.txt não aponta para ${base}sitemap.xml`);
    if (!sitemap.includes(`<loc>${cab.canonical}</loc>`)) failures.push(`[lançamento] sitemap.xml não tem <loc>${cab.canonical}</loc>`);
  }

  // link direto para um produto abre o detalhe
  await page.goto(page_url + '#produto/canecas', { waitUntil: 'load' });
  await page.evaluate(() => window.PANDA_CATALOGO || true);
  await page.waitForTimeout(300);
  const direto = await page.evaluate(() => ({ aberto: document.getElementById('detalhe').open, titulo: document.getElementById('detalhe-titulo').textContent.trim() }));
  if (!direto.aberto || direto.titulo !== 'Canecas') failures.push(`[detalhe] o endereço #produto/canecas não abriu o detalhe certo (${JSON.stringify(direto)})`);
  await page.close();
}

// ---- medição: visita e clique chegam ao banco (simulado) ----
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const eventos = [];
  await page.route('**/rest/v1/pm_eventos*', (r) => { try { eventos.push(JSON.parse(r.request().postData() || '{}')); } catch {} r.fulfill({ status: 201, body: '' }); });
  await page.goto(page_url, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  await page.$eval('.hero .js-wa', (a) => { a.addEventListener('click', (e) => e.preventDefault(), { once: true }); a.click(); });
  await page.waitForTimeout(400);
  const tipos = eventos.map((e) => e.evento);
  if (!tipos.includes('pageview')) failures.push(`[medição] a visita não foi registrada (eventos: ${tipos.join(', ') || 'nenhum'})`);
  if (!tipos.includes('clique_whatsapp')) failures.push(`[medição] o clique no WhatsApp não foi registrado (eventos: ${tipos.join(', ') || 'nenhum'})`);
  const pv = eventos.find((e) => e.evento === 'pageview');
  if (pv && (!pv.sessao || pv.largura !== 390)) failures.push('[medição] a visita veio sem sessão ou sem a largura da tela');
  // o "Me avise" de um lançamento chega com o nome da peça, para a aba Métricas separar o interesse por produto
  const nomeLanc = await page.$eval('.product--lancamento h3', (h) => h.textContent.trim()).catch(() => '');
  if (!nomeLanc) failures.push('[medição] não há lançamento em teste na cópia local para medir');
  else {
    await page.$eval('.product--lancamento .product__cta', (a) => { a.addEventListener('click', (e) => e.preventDefault(), { once: true }); a.click(); });
    await page.waitForTimeout(400);
    const ev = eventos.filter((e) => e.evento === 'clique_whatsapp').pop();
    if (!ev || ev.rotulo !== `Me avise · ${nomeLanc}`) failures.push(`[medição] o "Me avise" de ${nomeLanc} não foi registrado com o nome da peça (veio "${ev && ev.rotulo}")`);
  }
  await page.close();
}

// ---- o catálogo vindo do banco substitui a cópia local ----
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const iguaisAoLocal = JSON.parse(fs.readFileSync(path.resolve(here, '..', 'produtos.js'), 'utf8')
    .replace(/^[\s\S]*?window\.PANDA_PRODUTOS\s*=\s*/, '').replace(/;\s*$/, ''))
    .map((p) => ({ ...p, pm_produto_fotos: p.fotos.map((f, i) => ({ ...f, ordem: i })) }));
  const produtoFalso = [{
    slug: 'produto-de-teste', nome: 'Produto de teste', descricao: 'Veio do banco.',
    etiquetas: ['etiqueta'], mensagem: 'Oi!', rotulo_botao: 'Quero', em_breve: false, lancamento: false,
    pm_produto_fotos: [{ url: 'assets/prod-tag.webp', alt: 'foto', ordem: 0, largura: 760, altura: 760 }],
  }, {
    slug: 'lancamento-de-teste', nome: 'Lançamento de teste', descricao: 'Ainda em teste.',
    etiquetas: ['em teste'], mensagem: 'Oi! Me avisa?', rotulo_botao: 'Me avise', em_breve: false, lancamento: true,
    pm_produto_fotos: [{ url: 'assets/lanc-vale-mimo.webp', alt: 'ilustração', ordem: 0, largura: 760, altura: 760 }],
  }];
  await page.route('**/rest/v1/pm_produtos*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(produtoFalso) }));
  await page.route('**/rest/v1/pm_config*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ whatsapp: '5511988887777', instagram: 'teste_ig', tiktok: 'teste_tt', aviso_topo: 'Aviso vindo do banco.' }]) }));
  await page.goto(page_url, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => ({
    quantos: document.querySelectorAll('#lista-produtos .product').length,
    nome: document.querySelector('#lista-produtos h3')?.textContent,
    zap: document.querySelector('#lista-produtos .product__cta')?.href || '',
    aviso: document.querySelector('.announce__in p')?.textContent,
    insta: document.querySelector('.js-ig')?.href || '',
    selo: document.querySelector('#lista-produtos .product--lancamento .product__selo')?.textContent.trim() || '',
  }));
  if (r.quantos !== 2 || r.nome !== 'Produto de teste') failures.push(`[banco] catálogo do banco não substituiu a cópia local (${r.quantos} produto(s), "${r.nome}")`);
  if (r.selo !== 'Em breve') failures.push('[banco] um lançamento em teste vindo do banco não ganhou o selo "Em breve"');
  if (!r.zap.includes('5511988887777')) failures.push('[banco] o número de WhatsApp do banco não foi aplicado aos botões');
  if (r.aviso !== 'Aviso vindo do banco.') failures.push('[banco] o aviso do topo não veio do banco');
  if (!r.insta.includes('teste_ig')) failures.push('[banco] o Instagram do banco não foi aplicado');

  // o banco devolvendo o mesmo conteúdo não pode remontar o catálogo
  await page.unroute('**/rest/v1/pm_produtos*');
  await page.route('**/rest/v1/pm_produtos*', (rota) => rota.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify(iguaisAoLocal),
  }));
  await page.goto(page_url, { waitUntil: 'load' });
  await page.evaluate(() => { document.querySelector('#lista-produtos .product').dataset.marca = 'antes'; });
  await page.evaluate(() => window.PANDA_CATALOGO);
  await page.waitForTimeout(200);
  const sobreviveu = await page.evaluate(() => !!document.querySelector('#lista-produtos .product[data-marca="antes"]'));
  if (!sobreviveu) failures.push('[banco] o catálogo foi remontado mesmo o banco devolvendo o mesmo conteúdo');
  await page.close();
}

// ---- painel: carrega limpo e o preparo de foto segue as mesmas regras ----
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errosPainel = [];
  page.on('pageerror', (e) => errosPainel.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource|net::ERR_/.test(m.text()) && errosPainel.push(m.text()));
  await page.goto('file://' + path.resolve(here, '..', 'admin.html'), { waitUntil: 'load' });
  await page.waitForTimeout(300);

  // depois de entrar, a tela de login não pode continuar aparecendo
  const escondeMesmo = await page.evaluate(() => {
    const sobrando = [];
    document.getElementById('tela-login').hidden = true;
    document.getElementById('painel').hidden = false;
    for (const el of document.querySelectorAll('[hidden]'))
      if (getComputedStyle(el).display !== 'none') sobrando.push(el.id || el.className);
    document.getElementById('tela-login').hidden = false;
    document.getElementById('painel').hidden = true;
    return sobrando;
  });
  escondeMesmo.forEach((x) => failures.push(`[painel] "${x}" continua aparecendo mesmo marcado como escondido`));

  const estrutura = await page.evaluate(() => ({
    login: !!document.querySelector('#form-login'),
    escondido: document.getElementById('painel').hidden,
    robots: document.querySelector('meta[name=robots]')?.content || '',
    semRotulo: [...document.querySelectorAll('input')]
      .filter((i) => i.type !== 'hidden' && i.type !== 'file' && !document.querySelector(`label[for="${i.id}"]`) && !i.getAttribute('aria-label') && !i.closest('label'))
      .map((i) => i.id || i.type),
    temPreparo: typeof window.preparaFoto === 'function',
  }));
  if (!estrutura.login) failures.push('[painel] não achei o formulário de entrada');
  if (!estrutura.escondido) failures.push('[painel] o painel aparece sem login');
  if (!/noindex/.test(estrutura.robots)) failures.push('[painel] falta noindex: o painel não pode ir para o Google');
  if (estrutura.semRotulo.length) failures.push(`[painel] campo sem rótulo: ${estrutura.semRotulo.join(', ')}`);
  if (!estrutura.temPreparo) failures.push('[painel] o preparo de foto não está disponível');
  if (!(await page.$('#aba-metricas')) || !(await page.$('#secao-metricas'))) failures.push('[painel] falta a aba de métricas');
  if (!(await page.$('#p-preco')) || !(await page.$('#p-detalhes'))) failures.push('[painel] faltam os campos de preço e texto de detalhe');

  if (estrutura.temPreparo) {
    const provas = await page.evaluate(async () => {
      // desenha uma foto de estúdio de mentira: fundo creme e uma peça escura no meio
      const faz = (fundo) => new Promise((ok) => {
        const c = document.createElement('canvas'); c.width = 600; c.height = 800;
        const x = c.getContext('2d');
        if (fundo) { x.fillStyle = '#F6F1E9'; x.fillRect(0, 0, 600, 800); }
        x.fillStyle = '#2B2B2B'; x.beginPath(); x.ellipse(300, 400, 150, 260, 0, 0, 7); x.fill();
        c.toBlob((b) => ok(new File([b], 'teste.png', { type: 'image/png' })), 'image/png');
      });
      const confere = async (r) => {
        if (r.erro) return { erro: r.erro };
        const bmp = await createImageBitmap(r.blob);
        const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
        const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(bmp, 0, 0);
        const d = x.getImageData(0, 0, c.width, c.height).data;
        const al = (px, py) => d[(py * c.width + px) * 4 + 3];
        const N = c.width;
        const cantos = [[2, 2], [N - 3, 2], [2, N - 3], [N - 3, N - 3]].some(([px, py]) => al(px, py) > 12);
        let borda = false;
        for (let i = 0; i < N; i++) for (let m = 0; m < 3; m++)
          if (al(i, m) > 12 || al(i, N - 1 - m) > 12 || al(m, i) > 12 || al(N - 1 - m, i) > 12) borda = true;
        return { quadrada: bmp.width === bmp.height, cantos, borda, lado: bmp.width };
      };
      const comFundo = await faz(true), semFundo = await faz(false);
      return {
        recortada: await confere(await window.preparaFoto(comFundo, { remover: true, tolerancia: 30 })),
        mantendoFundo: await confere(await window.preparaFoto(comFundo, { remover: false, tolerancia: 30 })),
        jaTransparente: await confere(await window.preparaFoto(semFundo, { remover: true, tolerancia: 30 })),
      };
    });
    const r = provas.recortada;
    if (r.erro) failures.push(`[painel] o preparo recusou uma foto boa: ${r.erro}`);
    else {
      if (!r.quadrada) failures.push('[painel] a foto preparada não saiu quadrada');
      if (r.cantos) failures.push('[painel] a foto preparada saiu com fundo nos cantos');
      if (r.borda) failures.push('[painel] a foto preparada saiu com a peça encostando na borda');
    }
    if (!provas.mantendoFundo.erro) failures.push('[painel] o preparo aceitou uma foto com fundo sólido, que é justamente o que não pode');
    if (provas.jaTransparente.erro) failures.push(`[painel] o preparo recusou um PNG já transparente: ${provas.jaTransparente.erro}`);
  }
  errosPainel.forEach((e) => failures.push(`[painel] erro de console: ${e}`));
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
