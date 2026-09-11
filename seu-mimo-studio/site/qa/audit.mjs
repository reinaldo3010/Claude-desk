/*
  Guardião do site Seu Mimo Studio
  --------------------------------
  Mesma arquitetura do guardião da Panda Mimo, apontada para este site e para as
  regras desta marca. Abre a home em 14 tamanhos de tela (320x568 a 1920x1080) e
  reprova a publicação se encontrar:

    - rolagem lateral; elemento saindo da tela
    - imagem que não carregou, com width/height fora da proporção real, ampliada
      mais de 10% em tela retina, cortada pelo contêiner, ou sem atributo alt
    - texto cortado; sobreposição entre blocos irmãos (peças, passos, garantias)
    - elemento sticky dentro do conteúdo em tela estreita
    - link com href="#" depois do carregamento; âncora sem destino; link de
      WhatsApp sem número; link _blank sem rel=noopener
    - âncora do menu parando debaixo do cabeçalho fixo
    - menu do celular que não abre, não fecha ao clicar num link, ou não fecha com Escape
    - botão flutuante do WhatsApp visível sobre a própria seção de contato
    - peças: seis cartões, cada um com nome, material, preço e botão de WhatsApp válido
    - foto de peça que não seja quadro quadrado transparente com a peça inteira
      (enquanto a foto real não existe, o quadro precisa trazer a marca de lugar
      explícita: o desenho de linha e a legenda "foto da peça")
    - as quatro garantias, os quatro passos em ordem e a frase da marca na tela
    - chamada para ação fora do vocabulário da marca
    - identidade: cor ou fonte fora dos tokens; qualquer cor, fonte, palavra ou
      arquivo da Panda Mimo dentro deste site; uso do mascote vetorial reprovado
    - dado que falta sem estar entre colchetes e à vista (classe .falta)
    - movimento: nada fica invisível depois de rolar até a seção
    - conteúdo sempre visível: página carregada num webview ainda sem altura
      (Instagram, WhatsApp), sem IntersectionObserver e sem JavaScript
    - ícones PNG e de toque, imagem de compartilhamento 1200x630, robots.txt,
      sitemap.xml, manifest e 404, todos apontando para o mesmo endereço do canonical
    - medição: a visita e o clique no WhatsApp são registrados (com o banco simulado)
    - catálogo do banco substituindo a cópia local (com o banco simulado)
    - páginas de apoio (sobre, trocas, termos, privacidade): existem, linkadas no
      rodapé, com canonical, título e descrição próprios, dados da loja, caminho de
      volta e entrada no sitemap; fontes servidas do próprio site; hierarquia de
      títulos sem saltos; axe-core (WCAG 2.2 AA) sem violação moderada, séria ou crítica
    - erro de console; requisição local falhando

  Também salva capturas por seção em qa/shots/<largura>/ para homologação visual.

  Uso:  npm test                        (tudo)
        npm run shots                   (só capturas, sem reprovar)
        QA_VIEWPORTS=390 npm test       (uma largura só, checagem rápida)
        CHROMIUM_PATH=/caminho/chrome npm test   (usa um Chromium já instalado)
*/
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(here, '..');
const url = (f) => 'file://' + path.resolve(raiz, f).replace(/\\/g, '/');
const page_url = url('index.html');
const ler = (f) => fs.readFileSync(path.resolve(raiz, f), 'utf8');
const existe = (f) => fs.existsSync(path.resolve(raiz, f));

const onlyShots = process.argv.includes('--shots');
const PAGINAS = ['sobre.html', 'trocas.html', 'termos.html', 'privacidade.html'];
const TODAS = [[320, 568], [360, 800], [375, 667], [375, 812], [390, 844], [393, 852], [414, 896], [768, 1024], [820, 1180], [1024, 768], [1280, 720], [1366, 768], [1440, 900], [1920, 1080]];
const filtro = (process.env.QA_VIEWPORTS || '').split(',').filter(Boolean).map(Number);
const viewports = filtro.length ? TODAS.filter(([w]) => filtro.includes(w)) : TODAS;
const shotWidths = new Set([320, 390, 768, 1280, 1920]);

const failures = []; const warnings = []; const links = new Map();
const fail = (w, msg) => failures.push(`[${w}px] ${msg}`);
let quadrosConferidos = false;

/* vocabulário de chamada para ação desta marca: o que aparece em botão ou em link de peça */
const CHAMADAS = ['Pedir pelo WhatsApp', 'Ver as peças', 'Quero essa', 'Voltar ao início', 'Falar sobre um problema'];

/* a assinatura e a frase da marca (MARCA.md 1) precisam estar na home */
const ASSINATURA = 'Mais do que presentes, são histórias que ficam.';
const FRASE_MARCA = 'Cada peça sai daqui como se fosse para alguém da nossa casa.';

const exe = process.env.CHROMIUM_PATH;
const browser = await chromium.launch({ ...(exe ? { executablePath: exe } : {}), args: ['--allow-file-access-from-files'] });

async function carregaImagens(page) {
  await page.evaluate(() => window.SMS_CATALOGO || true).catch(() => {});
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
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource|net::ERR_/.test(m.text()) && consoleErrors.push(m.text()));
  const externo = (u) => !u.startsWith('file://');
  page.on('requestfailed', (r) => !externo(r.url()) && netFailures.push(`${r.url().slice(0, 90)} ${r.failure()?.errorText}`));
  page.on('response', (r) => r.status() >= 400 && !externo(r.url()) && netFailures.push(`${r.status()} ${r.url().slice(0, 90)}`));
  await page.goto(page_url, { waitUntil: 'load' });
  await carregaImagens(page);
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });

  const report = await page.evaluate(({ w, CHAMADAS, ASSINATURA, FRASE_MARCA }) => {
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
      if (!img.hasAttribute('alt')) out.push(`imagem sem atributo alt: ${img.getAttribute('src').slice(0, 60)}`);
      if (!img.complete || img.naturalWidth === 0) { out.push(`imagem não carregou: ${img.getAttribute('src').slice(0, 70)}`); continue; }
      const aw = +img.getAttribute('width'), ah = +img.getAttribute('height');
      if (aw && ah) {
        const ratioAttr = aw / ah, ratioReal = img.naturalWidth / img.naturalHeight;
        if (Math.abs(ratioAttr - ratioReal) / ratioReal > 0.03) out.push(`width/height fora da proporção real: ${img.getAttribute('src').slice(0, 60)}`);
      }
      const r = img.getBoundingClientRect();
      const fit = getComputedStyle(img).objectFit;
      let drawn = r.width;
      if (fit === 'contain') drawn = img.naturalWidth * Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
      else if (fit === 'cover') drawn = img.naturalWidth * Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight);
      else if (fit === 'none') drawn = img.naturalWidth;
      /* imagem com srcset é medida na passada de nitidez (2x e 3x); as demais aguentam 2x sozinhas */
      if (!img.srcset) {
        const zoom = drawn * 2 / img.naturalWidth;
        if (drawn > 120 && zoom > 1.1) out.push(`imagem macia em tela 2x (${zoom.toFixed(2)}x): ${img.getAttribute('src').slice(0, 60)}; gere a versão @2x ou reduza o tamanho exibido`);
      }
      const p = img.parentElement, pr = p.getBoundingClientRect();
      if (fit === 'cover' && Math.abs(r.width / r.height - img.naturalWidth / img.naturalHeight) > 0.08) out.push(`imagem recortada por object-fit: cover: ${img.getAttribute('src').slice(0, 60)}`);
      if (getComputedStyle(p).overflow === 'hidden' && (r.left < pr.left - 1 || r.right > pr.right + 1 || r.top < pr.top - 1 || r.bottom > pr.bottom + 1)) out.push(`imagem cortada pelo contêiner: ${img.getAttribute('src').slice(0, 60)}`);
    }

    for (const el of document.querySelectorAll('h1,h2,h3,p,a,button,summary,li,dd,dt,label,legend,span,small,strong')) {
      if (!visible(el)) continue;
      if (el.clientWidth <= 2 || el.clientHeight <= 2) continue;
      const cs = getComputedStyle(el);
      if ((cs.overflowX === 'hidden' || cs.overflow === 'hidden' || cs.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 1) out.push(`texto cortado: ${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 40)}"`);
    }

    const grupos = ['.pecas', '.passos', '.garantias', '.abertura__grid', '.abertura__acoes', '.fecho', '.fecho__acoes', '.rodape__in', '.topo__in'];
    for (const sel of grupos) {
      const pai = document.querySelector(sel); if (!pai) continue;
      const filhos = [...pai.children].filter((k) => visible(k) && getComputedStyle(k).position !== 'absolute');
      for (let i = 0; i < filhos.length; i++) for (let j = i + 1; j < filhos.length; j++) {
        const a = filhos[i].getBoundingClientRect(), b = filhos[j].getBoundingClientRect();
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 4 && oy > 4) out.push(`sobreposição em ${sel}: filhos ${i + 1} e ${j + 1} (${Math.round(ox)}x${Math.round(oy)}px)`);
      }
    }

    if (w < 901) for (const el of document.querySelectorAll('main *')) if (getComputedStyle(el).position === 'sticky') out.push(`sticky em tela estreita: ${el.tagName.toLowerCase()}.${el.className}`);

    for (const a of document.querySelectorAll('a')) {
      const href = a.getAttribute('href');
      if (href === '#' || href === '' || href == null) out.push(`link sem destino real: "${a.textContent.trim().slice(0, 30) || a.getAttribute('aria-label')}"`);
      if (href && href.startsWith('#') && href.length > 1 && !document.getElementById(href.slice(1))) out.push(`âncora sem destino: ${href}`);
      if (a.classList.contains('js-wa') && !/^https:\/\/wa\.me\/\d{8,}\?text=/.test(a.href)) out.push(`link de WhatsApp inválido: ${a.href.slice(0, 60)}`);
      if (a.target === '_blank' && !/noopener/.test(a.rel)) out.push(`link _blank sem rel=noopener: ${a.textContent.trim().slice(0, 30)}`);
    }
    for (const a of document.querySelectorAll('a, button')) if (visible(a) && !a.textContent.trim() && !a.getAttribute('aria-label')) out.push(`link/botão sem texto nem aria-label: ${a.className}`);

    /* ---- as peças ---- */
    const cartoes = [...document.querySelectorAll('#lista-pecas .peca')];
    if (cartoes.length !== 6) out.push(`o catálogo mostra ${cartoes.length} peça(s); o sortimento decidido é de 6`);
    cartoes.forEach((c, i) => {
      const nome = c.querySelector('h3')?.textContent.trim();
      if (!nome) out.push(`peça ${i + 1} sem nome`);
      if (!c.querySelector('.peca__material')?.textContent.trim()) out.push(`${nome || `peça ${i + 1}`}: sem o material`);
      if (!c.querySelector('.peca__preco')?.textContent.trim()) out.push(`${nome || `peça ${i + 1}`}: sem preço no cartão`);
      const cta = c.querySelector('.peca__cta');
      if (!cta || !/^https:\/\/wa\.me\/\d{8,}/.test(cta.href)) out.push(`${nome || `peça ${i + 1}`}: sem botão de WhatsApp válido`);
      if (cta && !(cta.dataset.rotulo || '').includes(nome || '')) out.push(`${nome}: o clique não seria medido com o nome da peça`);
      /* ou tem foto real, ou traz a marca de lugar à vista. Quadro vazio, nunca. */
      const quadro = c.querySelector('.peca__quadro');
      const temFoto = !!quadro?.querySelector('img');
      const temEspera = !!quadro?.querySelector('svg') && /foto da peça/i.test(quadro.textContent);
      if (!temFoto && !temEspera) out.push(`${nome}: quadro da peça vazio, sem foto nem marca de lugar`);
    });

    /* ---- as quatro garantias ---- */
    const garantias = [...document.querySelectorAll('.garantia')];
    if (garantias.length !== 4) out.push(`a faixa de garantias tem ${garantias.length} item(ns); são 4`);
    garantias.forEach((g, i) => {
      if (!g.querySelector('h3')?.textContent.trim()) out.push(`garantia ${i + 1} sem título`);
      if (!g.querySelector('p')?.textContent.trim()) out.push(`garantia ${i + 1} sem explicação`);
      if (!g.querySelector('svg')) out.push(`garantia ${i + 1} sem o desenho de linha`);
    });

    /* ---- os quatro passos, na ordem ---- */
    const passos = [...document.querySelectorAll('.passo')];
    if (passos.length !== 4) out.push(`"Como funciona" tem ${passos.length} passo(s); são 4`);
    passos.forEach((p, i) => {
      const n = p.querySelector('.passo__n')?.textContent.trim();
      if (n !== String(i + 1).padStart(2, '0')) out.push(`passo ${i + 1} numerado como "${n}"`);
      if (!p.querySelector('h3')?.textContent.trim()) out.push(`passo ${i + 1} sem título`);
    });

    /* ---- assinatura e frase da marca ---- */
    const textoHome = document.body.innerText.replace(/\s+/g, ' ');
    if (!textoHome.includes(ASSINATURA)) out.push(`a assinatura da marca saiu da home ("${ASSINATURA}")`);
    if (!textoHome.includes(FRASE_MARCA)) out.push('a frase da marca saiu da home');

    /* ---- vocabulário das chamadas para ação ---- */
    const fora = [...document.querySelectorAll('.btn, .peca__cta')]
      .map((b) => b.textContent.replace(/\s+/g, ' ').replace(/›/g, '').trim()).filter(Boolean);
    const estranhas = [...new Set(fora.filter((t) => !CHAMADAS.some((c) => t === c || t.startsWith(c))))];
    if (estranhas.length) out.push(`chamada(s) fora do vocabulário da marca: ${estranhas.join(' | ')}`);

    /* ---- dado que falta: precisa estar entre colchetes e marcado ---- */
    const colchetes = textoHome.match(/\[[^\]]{2,60}\]/g) || [];
    const marcados = [...document.querySelectorAll('.falta')].map((e) => e.textContent.trim());
    for (const c of colchetes) if (!marcados.some((m) => m === c)) out.push(`dado entre colchetes sem a marca .falta: ${c}`);
    if (marcados.length) warns.push(`${marcados.length} dado(s) ainda por preencher: ${[...new Set(marcados)].join(', ')}`);

    return out;
  }, { w, CHAMADAS, ASSINATURA, FRASE_MARCA });
  report.forEach((r) => fail(w, r));
  (await page.evaluate(() => window.__warns)).forEach((m) => warnings.push(`[antes de ir ao ar] ${m}`));

  if (links.size === 0) {
    const inv = await page.$$eval('a, button', (els) => els.map((e) => ({
      tag: e.tagName.toLowerCase(),
      text: (e.textContent.trim() || e.getAttribute('aria-label') || '').slice(0, 42),
      href: e.getAttribute('href') ? e.href.slice(0, 60) : (e.id ? '#' + e.id : e.className),
    })));
    inv.forEach((i, n) => links.set(n, i));
  }

  /* ---- fotos de peça: quadro quadrado transparente com a peça inteira ---- */
  if (!quadrosConferidos) {
    quadrosConferidos = true;
    const tiles = await page.evaluate(() => {
      const out = [];
      const imgs = document.querySelectorAll('.peca__quadro img');
      if (!imgs.length) return out; /* nenhuma foto real ainda: a marca de lugar já foi conferida acima */
      const cv = document.createElement('canvas'); const ctx = cv.getContext('2d', { willReadFrequently: true });
      const N = 200, LIMITE = 12;
      for (const img of imgs) {
        const nome = img.getAttribute('src').slice(0, 50);
        const [nw, nh] = [img.naturalWidth, img.naturalHeight];
        if (!nw) { out.push(`foto de peça não carregou: ${nome}`); continue; }
        if (Math.abs(nw - nh) > 1) { out.push(`foto de peça não é quadrada (${nw}x${nh}), pode sair cortada: ${nome}`); continue; }
        cv.width = cv.height = N; ctx.clearRect(0, 0, N, N); ctx.drawImage(img, 0, 0, N, N);
        let data;
        try { data = ctx.getImageData(0, 0, N, N).data; } catch (e) { out.push(`não deu para inspecionar os pixels (${e.name}); rode o navegador com --allow-file-access-from-files`); break; }
        const al = (x, y) => data[(y * N + x) * 4 + 3];
        for (const [x, y, q] of [[1, 1, 'superior esquerdo'], [N - 2, 1, 'superior direito'], [1, N - 2, 'inferior esquerdo'], [N - 2, N - 2, 'inferior direito']])
          if (al(x, y) > LIMITE) { out.push(`foto de peça com fundo retangular (canto ${q} opaco): ${nome}`); break; }
        const borda = 3, toca = new Set();
        for (let i = 0; i < N; i++) for (let m = 0; m < borda; m++) {
          if (al(i, m) > LIMITE) toca.add('topo');
          if (al(i, N - 1 - m) > LIMITE) toca.add('base');
          if (al(m, i) > LIMITE) toca.add('esquerda');
          if (al(N - 1 - m, i) > LIMITE) toca.add('direita');
        }
        if (toca.size) out.push(`peça encostando na borda da foto (${[...toca].join(', ')}), risco de corte: ${nome}`);
      }
      return out;
    });
    tiles.forEach((m) => fail(w, m));
  }

  /* ---- âncoras chegam abaixo do cabeçalho fixo ---- */
  const topH = await page.$eval('.topo', (t) => t.getBoundingClientRect().height);
  for (const id of ['pecas', 'como-funciona', 'contato']) {
    await page.evaluate((i) => document.getElementById(i).scrollIntoView({ behavior: 'instant', block: 'start' }), id);
    const top = await page.evaluate((i) => document.getElementById(i).getBoundingClientRect().top, id);
    if (top < topH - 2) fail(w, `âncora #${id} fica ${Math.round(topH - top)}px debaixo do cabeçalho`);
  }
  await page.evaluate(() => window.scrollTo(0, 0));

  /* ---- menu do celular ---- */
  if (w < 901) {
    const botao = await page.$('.menu-btn');
    if (!botao) fail(w, 'menu do celular ausente');
    else {
      await botao.click(); await page.waitForTimeout(120);
      const aberto = (await page.$eval('.menu-btn', (b) => b.getAttribute('aria-expanded') === 'true'))
        && (await page.$eval('#menu-principal', (n) => getComputedStyle(n).display !== 'none'));
      if (!aberto) fail(w, 'menu do celular não abre');
      const sai = await page.evaluate(() => { const r = document.getElementById('menu-principal').getBoundingClientRect(); return r.right > document.documentElement.clientWidth + 1 || r.left < -1; });
      if (sai) fail(w, 'menu aberto sai da tela');
      await page.$eval('#menu-principal a[href="#como-funciona"]', (a) => a.click()); await page.waitForTimeout(160);
      if (!(await page.$eval('.menu-btn', (b) => b.getAttribute('aria-expanded') === 'false'))) fail(w, 'menu não fecha ao clicar num link');
      const top = await page.evaluate(() => document.getElementById('como-funciona').getBoundingClientRect().top);
      if (top < topH - 2) fail(w, 'link do menu leva a seção para debaixo do cabeçalho');
      await botao.click(); await page.keyboard.press('Escape'); await page.waitForTimeout(120);
      if (!(await page.$eval('.menu-btn', (b) => b.getAttribute('aria-expanded') === 'false'))) fail(w, 'menu não fecha com Escape');
    }
  } else if (await page.$eval('.menu-btn', (b) => getComputedStyle(b).display !== 'none')) fail(w, 'botão de menu aparece no computador');
  await page.evaluate(() => window.scrollTo(0, 0));

  /* ---- botão flutuante ---- */
  await page.evaluate(() => document.getElementById('contato').scrollIntoView({ behavior: 'instant', block: 'center' }));
  await page.waitForTimeout(380);
  if (!(await page.$eval('.fab', (f) => f.classList.contains('is-oculto')))) fail(w, 'botão flutuante fica sobre a seção de contato');
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(380);
  if (await page.$eval('.fab', (f) => f.classList.contains('is-oculto'))) fail(w, 'botão flutuante não volta a aparecer');

  /* ---- movimento: depois de rolar até a seção, ela precisa estar visível ---- */
  await page.evaluate(() => document.getElementById('contato').scrollIntoView({ behavior: 'instant', block: 'center' }));
  await page.waitForTimeout(450);
  const op = await page.$eval('#contato', (s) => Math.min(...[s, ...s.children].map((e) => Number(getComputedStyle(e).opacity))));
  if (op < 0.99) fail(w, `a seção de contato ficou com opacidade ${op} depois de rolar até ela`);
  const aberturaInvisivel = await page.evaluate(() => {
    window.scrollTo(0, 0);
    const a = document.querySelector('.abertura');
    return Math.min(...[a, ...a.children].map((e) => Number(getComputedStyle(e).opacity))) < 0.99;
  });
  if (aberturaInvisivel) fail(w, 'a abertura, que já está na tela, começa invisível');

  consoleErrors.forEach((e) => fail(w, `erro de console: ${e}`));
  netFailures.forEach((e) => fail(w, `falha de rede: ${e}`));

  if (shotWidths.has(w)) {
    await page.evaluate(() => {
      window.SMS_REVELA_TUDO && window.SMS_REVELA_TUDO();
      window.scrollTo(0, 0);
      document.querySelector('.topo').style.position = 'static';
      document.querySelector('.fab').style.display = 'none';
    });
    const dir = path.join(here, 'shots', String(w)); fs.mkdirSync(dir, { recursive: true });
    for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
    if (w < 901) { await page.$eval('.menu-btn', (b) => b.click()); await page.screenshot({ path: path.join(dir, '01a-menu-aberto.png') }); await page.$eval('.menu-btn', (b) => b.click()); }
    const secoes = await page.$$('header.topo, main > section, footer');
    let n = 0;
    for (const s of secoes) {
      const id = (await s.getAttribute('id')) || (await s.getAttribute('class') || 'secao').split(' ')[0];
      await s.screenshot({ path: path.join(dir, `${String(++n).padStart(2, '0')}-${id}.png`) }).catch(() => {});
    }
    await page.screenshot({ path: path.join(dir, '00-pagina.png'), fullPage: true });
  }
  await page.close();
}

/* ============================================================
   Identidade: tokens, nada da marca irmã, mascote só na referência aprovada
   ============================================================ */
{
  const semComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
  const css = ler('styles.css');

  /* a) cor e fonte só nos tokens */
  const iRaiz = css.indexOf(':root {');
  const fimRaiz = css.indexOf('\n}', iRaiz);
  if (iRaiz < 0) failures.push('[identidade] styles.css sem o bloco :root com os tokens da marca');
  else {
    const foraDosTokens = semComentarios(css.slice(0, iRaiz) + css.slice(fimRaiz));
    const cores = foraDosTokens.match(/#[0-9A-Fa-f]{3,8}\b|rgba?\([^)]*\)/g) || [];
    if (cores.length) failures.push(`[identidade] cor fora dos tokens em styles.css: ${[...new Set(cores)].join(', ')}`);
    const fontes = (foraDosTokens.match(/font-family:\s*[^;}]+/g) || []).filter((f) => !/var\(--f-/.test(f));
    const foraFontFace = fontes.filter((f) => !/"(DM Serif Display|Montserrat|Caveat)"\s*$/.test(f.trim()));
    if (foraFontFace.length) failures.push(`[identidade] fonte fora dos tokens em styles.css: ${foraFontFace.join(' | ')}`);
  }
  /* os tokens precisam bater com a tabela da seção 2 do MARCA.md */
  const PALETA = { '--oliva': '#2F2E1E', '--cafe': '#3A2E21', '--bege': '#C0966D', '--offwhite': '#D4C7B5', '--preto': '#050505', '--fundo': '#E6D9CA', '--papel': '#EFE6D8' };
  for (const [token, hex] of Object.entries(PALETA)) {
    const m = css.match(new RegExp(`${token}:\\s*(#[0-9A-Fa-f]{6})`));
    if (!m) failures.push(`[identidade] falta o token ${token} em styles.css`);
    else if (m[1].toUpperCase() !== hex) failures.push(`[identidade] ${token} é ${m[1]} e o manual diz ${hex}`);
  }

  /* b) nenhuma cor, fonte, palavra ou arquivo da Panda Mimo dentro deste site */
  const PROIBIDO = [
    ['Panda', 'o nome da marca irmã'],
    ['Fredoka', 'fonte da Panda Mimo'],
    ['Nunito', 'fonte da Panda Mimo'],
    ['#FBF6EF', 'papel da Panda Mimo'], ['#FFB59C', 'pêssego da Panda Mimo'],
    ['#A8C5A2', 'sálvia da Panda Mimo'], ['#E7D8C3', 'areia da Panda Mimo'],
    ['#171512', 'nanquim da Panda Mimo'], ['#C9A57E', 'kraft da Panda Mimo'],
    ['#E8916F', 'pêssego escuro da Panda Mimo'], ['#CB6B44', 'manuscrito da Panda Mimo'],
  ];
  const arquivos = ['index.html', ...PAGINAS, '404.html', 'styles.css', 'script.js', 'produtos.js', 'config.js', 'site.webmanifest'];
  for (const f of arquivos) {
    if (!existe(f)) continue;
    const t = semComentarios(ler(f));
    for (const [agulha, porque] of PROIBIDO)
      if (t.toLowerCase().includes(agulha.toLowerCase())) failures.push(`[identidade] ${f} traz "${agulha}" (${porque}); as duas marcas nunca se misturam`);
  }

  /* c) o mascote: só a arte definitiva de kit/mascote-2d/ sai publicada.
     Duas coisas ficaram para trás e não voltam: a construção vetorial reprovada
     pelo dono (kit/mascote/*.py e kit/svg/mascote-*.svg) e o render 3D que servia
     de referência provisória enquanto o desenho definitivo não existia. Ver MARCA.md 5. */
  /* "folha-de-modelo" existe em duas versões: a reprovada em kit/svg/ e a definitiva em
     kit/mascote-2d/. A regra tem de pegar só a primeira, senão reprova a arte certa. */
  const REPROVADOS = /mascote-(feliz|piscando|surpreso|agradecido|entregando|uma-cor|preto|sobre-oliva)\.(svg|pdf|png)|mascote-referencia|svg\/folha-de-modelo|kit\/mascote\/|expressao-\w+\.(svg|pdf|png)/;
  for (const f of ['index.html', ...PAGINAS, '404.html', 'styles.css', 'script.js', 'produtos.js']) {
    if (!existe(f)) continue;
    const m = semComentarios(ler(f)).match(REPROVADOS);
    if (m) failures.push(`[identidade] ${f} usa "${m[0]}": não é a arte definitiva do mascote; use os arquivos exportados de kit/mascote-2d/ (MARCA.md 5)`);
  }
  for (const f of fs.readdirSync(path.resolve(raiz, 'assets'))) if (REPROVADOS.test(f)) failures.push(`[identidade] assets/${f} não é a arte definitiva do mascote; remova e exporte de kit/mascote-2d/`);
  /* a arte definitiva precisa estar exportada, em 1x e @2x */
  for (const f of ['mascote-abertura', 'mascote-convite', 'mascote-perdido'])
    for (const v of [`${f}.webp`, `${f}@2x.webp`])
      if (!existe(`assets/${v}`)) failures.push(`[identidade] falta assets/${v}; rode "python exporta-para-o-site.py" em kit/mascote-2d/`);
  /* e o kit precisa continuar com a folha de modelo, que é o que mantém o padrão */
  for (const f of ['folha-de-modelo.png', 'folha-de-poses-transparente.png', 'poses/abracando-coracao.png'])
    if (!fs.existsSync(path.resolve(raiz, '..', 'kit', 'mascote-2d', f))) failures.push(`[identidade] falta kit/mascote-2d/${f}, a fonte da arte do mascote`);
}

/* ============================================================
   Cabeçalho, ícones, arquivos de lançamento e coerência de endereço
   ============================================================ */
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
  if (!/^https?:\/\//.test(cab.og)) failures.push('[cabeçalho] og:image precisa do endereço completo; WhatsApp e Facebook não aceitam relativo');
  if (!cab.canonical) failures.push('[cabeçalho] falta <link rel="canonical">');

  for (const f of ['robots.txt', 'sitemap.xml', '404.html', 'site.webmanifest',
    'assets/og.jpg', 'assets/apple-touch-icon.png', 'assets/favicon-32.png', 'assets/icone-192.png', 'assets/icone-512.png',
    'assets/fontes/dmserif.woff2', 'assets/fontes/montserrat.woff2', 'assets/fontes/caveat.woff2'])
    if (!existe(f)) failures.push(`[lançamento] falta o arquivo ${f}`);

  if (/^https?:\/\//.test(cab.canonical)) {
    const base = cab.canonical.replace(/[^/]*$/, '');
    const robots = existe('robots.txt') ? ler('robots.txt') : '';
    const sitemap = existe('sitemap.xml') ? ler('sitemap.xml') : '';
    if (cab.ogUrl && cab.ogUrl !== cab.canonical) failures.push(`[cabeçalho] og:url (${cab.ogUrl}) diferente do canonical (${cab.canonical})`);
    if (/^https?:\/\//.test(cab.og) && !cab.og.startsWith(base)) failures.push(`[cabeçalho] og:image aponta para outro endereço (${cab.og}) que não o canonical (${base})`);
    if (!robots.includes(`Sitemap: ${base}sitemap.xml`)) failures.push(`[lançamento] robots.txt não aponta para ${base}sitemap.xml`);
    if (!sitemap.includes(`<loc>${cab.canonical}</loc>`)) failures.push(`[lançamento] sitemap.xml não tem <loc>${cab.canonical}</loc>`);
    for (const pg of PAGINAS) if (!sitemap.includes(`<loc>${base}${pg}</loc>`)) failures.push(`[lançamento] sitemap.xml não lista ${pg}`);
    if (existe('404.html')) {
      const t = ler('404.html');
      if (!t.includes(`href="${base}styles.css"`) || !t.includes(`href="${base}"`)) failures.push(`[lançamento] 404.html não aponta para ${base} (estilo e link de volta)`);
      if (!/<title>[^<]*Seu Mimo Studio/.test(t) || !/Voltar ao início/.test(t)) failures.push('[lançamento] 404.html sem título da marca ou sem o caminho de volta');
      if (!/noindex/.test(t)) failures.push('[lançamento] 404.html sem noindex');
    }
    if (base.includes('pages.dev')) warnings.push(`[antes de ir ao ar] o endereço do site ainda é o provisório do Cloudflare Pages (${base}); ao registrar o domínio, troque canonical, og:url, og:image, robots.txt, sitemap.xml, 404.html e os canonical das páginas de apoio`);
  }

  /* WhatsApp de reserva: o site funciona, mas nenhum clique chega a ninguém */
  const zap = ler('script.js').match(/whatsapp:\s*"(\d+)"/);
  if (zap && /^55(\d)\1{8,}$/.test(zap[1])) warnings.push(`[antes de ir ao ar] o WhatsApp do site ainda é o número de reserva (${zap[1]}); troque em script.js ou pela tabela sms_config`);
  await page.close();
}

/* ============================================================
   Conteúdo sempre visível: a animação de entrada nunca pode deixar a página em branco
   Cenário real: webview do Instagram ou do WhatsApp carrega a página antes de ter altura.
   ============================================================ */
{
  /* a opacidade pode estar na seção ou no conteúdo dela (ver .reveal em styles.css):
     o que importa é se a pessoa consegue ler, então olha os dois. */
  const visivel = (page, sel) => page.$eval(sel, (el) => {
    const opaco = (e) => Number(getComputedStyle(e).opacity);
    let o = opaco(el);
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) o = Math.min(o, opaco(p));
    const cs = getComputedStyle(el); const b = el.getBoundingClientRect();
    return o > 0.99 && cs.visibility !== 'hidden' && b.height > 0;
  });
  const invisiveis = (page) => page.$$eval('main > section, footer', (els) => els.filter((el) => {
    const o = [el, ...el.children].map((e) => Number(getComputedStyle(e).opacity));
    return Math.min(...o) < 0.99;
  }).map((el) => el.id || el.className.split(' ')[0]));

  /* a) carrega com 1 px de altura e só depois ganha a tela */
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 1 } });
    await page.goto(page_url, { waitUntil: 'load' }); await page.waitForTimeout(200);
    await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(600);
    for (const sel of ['.abertura', '.garantias', '#pecas'])
      if (!(await visivel(page, sel))) failures.push(`[conteúdo] ${sel} ficou invisível quando a página carregou sem altura de tela (webview do Instagram ou do WhatsApp)`);
    const n = await page.$$eval('#lista-pecas .peca', (els) => els.length);
    if (n !== 6) failures.push(`[conteúdo] as peças não montaram quando a página carregou sem altura de tela (${n} de 6)`);
    await page.waitForTimeout(4000);
    const ainda = await invisiveis(page);
    if (ainda.length) failures.push(`[conteúdo] ${ainda.length} seção(ões) continuam invisíveis 4,5 s depois do carregamento, sem rolar: ${ainda.join(', ')}`);
    await page.close();
  }
  /* b) navegador sem IntersectionObserver */
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.addInitScript(() => { delete window.IntersectionObserver; });
    await page.goto(page_url, { waitUntil: 'load' }); await page.waitForTimeout(300);
    const ainda = await invisiveis(page);
    if (ainda.length) failures.push(`[conteúdo] sem IntersectionObserver, ${ainda.length} seção(ões) ficam invisíveis: ${ainda.join(', ')}`);
    await page.close();
  }
  /* c) sem JavaScript: a abertura aparece e as peças explicam o caminho */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(page_url, { waitUntil: 'load' });
    if (!(await visivel(page, '.abertura h1'))) failures.push('[conteúdo] sem JavaScript o título da abertura não aparece');
    const aviso = await page.$eval('#pecas', (s) => s.innerText);
    if (!/WhatsApp/i.test(aviso)) failures.push('[conteúdo] sem JavaScript a área das peças fica em branco, sem caminho para o WhatsApp');
    if (!/R\$/.test(aviso)) failures.push('[conteúdo] sem JavaScript nenhum preço aparece');
    await ctx.close();
  }
}

/* ============================================================
   Nitidez: em telas 2x e 3x nenhuma imagem pode aparecer ampliada acima de 10%
   ============================================================ */
for (const [w, h, dpr] of [[1280, 800, 2], [390, 844, 3]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  await page.goto(page_url, { waitUntil: 'load' });
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await page.evaluate(() => { window.SMS_REVELA_TUDO && window.SMS_REVELA_TUDO(); document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; }); });
  await page.evaluate(async () => { const passo = innerHeight * .8; for (let y = 0; y < document.documentElement.scrollHeight; y += passo) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } scrollTo(0, 0); });
  await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete && i.naturalWidth > 0) ? null : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 5000); }))));
  const macias = await page.evaluate((dpr) => {
    const out = [];
    for (const img of document.querySelectorAll('img')) {
      const cs = getComputedStyle(img); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const r = img.getBoundingClientRect(); if (r.width < 100) continue;
      if (!img.naturalWidth) { out.push(`não carregou em ${dpr}x: ${(img.currentSrc || img.src).split('/').pop().slice(0, 50)}`); continue; }
      let drawn = r.width;
      if (cs.objectFit === 'contain') drawn = img.naturalWidth * Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
      /* com srcset, naturalWidth já vem dividido pela densidade escolhida; recupera os pixels de verdade */
      let dens = 1;
      if (img.srcset) for (const c of img.srcset.split(',')) { const [u, d] = c.trim().split(/\s+/); if (img.currentSrc.endsWith(u.split('/').pop()) && d && d.endsWith('x')) dens = parseFloat(d); }
      let largura = 0;
      if (img.srcset) for (const c of img.srcset.split(',')) { const [u, d] = c.trim().split(/\s+/); if (img.currentSrc.endsWith(u.split('/').pop()) && d && d.endsWith('w')) largura = parseFloat(d); }
      const pixels = largura || img.naturalWidth * dens;
      const precisa = drawn * dpr, razao = precisa / pixels;
      if (razao > 1.1) out.push(`imagem macia em ${dpr}x (${razao.toFixed(2)}x, precisa ${Math.round(precisa)} px e tem ${pixels}): ${(img.currentSrc || img.src).split('/').pop().slice(0, 50)}`);
    }
    return out;
  }, dpr);
  macias.forEach((m) => failures.push(`[nitidez ${w}px@${dpr}x] ${m}`));
  await page.close();
}

/* ============================================================
   Banco simulado: medição e catálogo vindo do banco
   ============================================================ */
{
  const CFG = { URL: 'https://banco-de-teste.supabase.co', CHAVE: 'chave_de_teste', BUCKET: 'seu-mimo-studio' };

  /* a) a visita e o clique no WhatsApp chegam ao banco */
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const eventos = [];
    await page.addInitScript((cfg) => { window.SMS_CONFIG = cfg; }, CFG);
    await page.route('**/rest/v1/sms_eventos*', (r) => { try { eventos.push(JSON.parse(r.request().postData() || '{}')); } catch {} r.fulfill({ status: 201, body: '' }); });
    await page.route('**/rest/v1/sms_produtos*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/rest/v1/sms_config*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.goto(page_url, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    await page.$eval('.fab.js-wa', (a) => { a.addEventListener('click', (e) => e.preventDefault(), { once: true }); a.click(); });
    await page.waitForTimeout(400);
    const tipos = eventos.map((e) => e.evento);
    if (!tipos.includes('pageview')) failures.push(`[medição] a visita não foi registrada (eventos: ${tipos.join(', ') || 'nenhum'})`);
    if (!tipos.includes('clique_whatsapp')) failures.push(`[medição] o clique no WhatsApp não foi registrado (eventos: ${tipos.join(', ') || 'nenhum'})`);
    const pv = eventos.find((e) => e.evento === 'pageview');
    if (pv && (!pv.sessao || pv.largura !== 390)) failures.push('[medição] a visita veio sem sessão ou sem a largura da tela');
    /* o clique numa peça precisa levar o nome dela, para saber o que desperta interesse */
    const nome = await page.$eval('#lista-pecas .peca h3', (e) => e.textContent.trim());
    await page.$eval('#lista-pecas .peca .peca__cta', (a) => { a.addEventListener('click', (e) => e.preventDefault(), { once: true }); a.click(); });
    await page.waitForTimeout(400);
    const ev = eventos.filter((e) => e.evento === 'clique_whatsapp').pop();
    if (!ev || !ev.rotulo.includes(nome)) failures.push(`[medição] o clique em "${nome}" não foi registrado com o nome da peça (veio "${ev && ev.rotulo}")`);
    /* nada de cookie: a promessa da página de privacidade tem de ser verdade */
    const cookies = await page.context().cookies();
    if (cookies.length) failures.push(`[privacidade] o site gravou ${cookies.length} cookie(s), e a página de privacidade promete nenhum: ${cookies.map((c) => c.name).join(', ')}`);
    await page.close();
  }

  /* b) quem pede "não rastrear" não é medido */
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    let contou = 0;
    await page.addInitScript((cfg) => {
      window.SMS_CONFIG = cfg;
      Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' });
    }, CFG);
    await page.route('**/rest/v1/sms_eventos*', (r) => { contou++; r.fulfill({ status: 201, body: '' }); });
    await page.route('**/rest/v1/sms_*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.goto(page_url, { waitUntil: 'load' }); await page.waitForTimeout(500);
    if (contou) failures.push(`[privacidade] o site mediu ${contou} evento(s) de quem pediu para não ser rastreado`);
    await page.close();
  }

  /* c) o catálogo e a configuração do banco substituem a cópia local */
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const doBanco = [{
      slug: 'peca-de-teste', nome: 'Peça de teste', material: 'Material de teste',
      preco_texto: 'A partir de R$ 42', mensagem: 'Oi! Quero a peça de teste.', icone: 'ic-kit',
      sms_produto_fotos: [],
    }, {
      slug: 'outra-peca', nome: 'Outra peça', material: 'Outro material',
      preco_texto: 'A partir de R$ 24', mensagem: 'Oi! Quero a outra peça.', icone: 'ic-caneca',
      sms_produto_fotos: [],
    }];
    await page.addInitScript((cfg) => { window.SMS_CONFIG = cfg; }, CFG);
    await page.route('**/rest/v1/sms_eventos*', (r) => r.fulfill({ status: 201, body: '' }));
    await page.route('**/rest/v1/sms_produtos*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(doBanco) }));
    await page.route('**/rest/v1/sms_config*', (r) => r.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify([{ whatsapp: '5511988887777', nome_empresarial: 'Studio de Teste LTDA', cnpj: '00.000.000/0001-00', endereco: 'Rua de Teste, 1', email: 'teste@exemplo.com' }]),
    }));
    await page.goto(page_url, { waitUntil: 'load' });
    await page.evaluate(() => window.SMS_CATALOGO); await page.waitForTimeout(300);
    const r = await page.evaluate(() => ({
      quantas: document.querySelectorAll('#lista-pecas .peca').length,
      nome: document.querySelector('#lista-pecas h3')?.textContent,
      zap: document.querySelector('#lista-pecas .peca__cta')?.href || '',
      loja: document.getElementById('loja-dados')?.textContent || '',
      espera: !!document.querySelector('.peca__espera'),
    }));
    if (r.quantas !== 2 || r.nome !== 'Peça de teste') failures.push(`[banco] o catálogo do banco não substituiu a cópia local (${r.quantas} peça(s), "${r.nome}")`);
    if (!r.zap.includes('5511988887777')) failures.push('[banco] o número de WhatsApp do banco não foi aplicado aos botões');
    if (!/Studio de Teste LTDA · CNPJ 00\.000\.000\/0001-00 · Rua de Teste, 1 · teste@exemplo\.com/.test(r.loja)) failures.push(`[banco] os dados da loja do banco não chegaram ao rodapé (está "${r.loja.slice(0, 90)}")`);
    if (!r.espera) failures.push('[banco] peça do banco sem foto ficou sem a marca de lugar "foto da peça"');

    /* o banco devolvendo o mesmo conteúdo não pode remontar o catálogo */
    await page.unroute('**/rest/v1/sms_produtos*');
    const iguaisAoLocal = JSON.parse(ler('produtos.js').replace(/^[\s\S]*?window\.SMS_PRODUTOS\s*=\s*/, '').replace(/;\s*$/, ''))
      .map((p) => ({ ...p, sms_produto_fotos: (p.fotos || []).map((f, i) => ({ ...f, ordem: i })) }));
    await page.route('**/rest/v1/sms_produtos*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(iguaisAoLocal) }));
    await page.goto(page_url, { waitUntil: 'load' });
    await page.evaluate(() => { document.querySelector('#lista-pecas .peca').dataset.marca = 'antes'; });
    await page.evaluate(() => window.SMS_CATALOGO); await page.waitForTimeout(250);
    const sobreviveu = await page.evaluate(() => !!document.querySelector('#lista-pecas .peca[data-marca="antes"]'));
    if (!sobreviveu) failures.push('[banco] o catálogo foi remontado mesmo o banco devolvendo o mesmo conteúdo');

    /* banco fora do ar: a cópia local tem de segurar o site inteiro */
    await page.unroute('**/rest/v1/sms_produtos*');
    await page.route('**/rest/v1/sms_produtos*', (r) => r.abort());
    await page.goto(page_url, { waitUntil: 'load' });
    await page.evaluate(() => window.SMS_CATALOGO); await page.waitForTimeout(250);
    const semBanco = await page.$$eval('#lista-pecas .peca', (e) => e.length);
    if (semBanco !== 6) failures.push(`[banco] com o banco fora do ar o site mostrou ${semBanco} peça(s) em vez das 6 da cópia local`);
    await page.close();
  }
}

/* ============================================================
   Páginas de apoio, SEO técnico, fontes próprias e acessibilidade (axe-core)
   ============================================================ */
{
  const index = ler('index.html');
  const sitemap = ler('sitemap.xml');
  for (const pg of PAGINAS) {
    if (!existe(pg)) { failures.push(`[páginas] falta ${pg}`); continue; }
    const t = ler(pg);
    if (!new RegExp(`<a href="${pg}">`).test(index)) failures.push(`[páginas] o rodapé da home não tem link para ${pg}`);
    if (!t.includes('<link rel="canonical" href="') || !t.includes(pg + '"')) failures.push(`[páginas] ${pg} sem canonical próprio`);
    if (!/<title>[^<]{10,70}Seu Mimo Studio<\/title>/.test(t)) failures.push(`[páginas] ${pg} sem <title> "… · Seu Mimo Studio" (10 a 70 caracteres)`);
    if (!/<meta name="description" content="[^"]{60,170}">/.test(t)) failures.push(`[páginas] ${pg} sem meta description de 60 a 170 caracteres`);
    if (!t.includes('id="loja-dados"')) failures.push(`[páginas] ${pg} sem a linha de identificação da loja no rodapé (Decreto 7.962/2013)`);
    if (!/href="index\.html"/.test(t)) failures.push(`[páginas] ${pg} sem caminho de volta para o início`);
    for (const outra of PAGINAS) if (!t.includes(`href="${outra}"`)) failures.push(`[páginas] ${pg} não linka ${outra} no rodapé`);
  }
  if (!/Cookies<\/h2>/.test(ler('privacidade.html'))) failures.push('[páginas] privacidade.html sem a seção sobre cookies');
  if (!/não usa cookie/i.test(ler('privacidade.html'))) failures.push('[páginas] privacidade.html não afirma que o site não usa cookie');
  if (!/90 dias/.test(ler('trocas.html'))) failures.push('[páginas] trocas.html não informa a garantia legal de 90 dias (CDC art. 26)');
  if (!/art\. 49/.test(ler('trocas.html'))) failures.push('[páginas] trocas.html não explica por que o art. 49 do CDC não se aplica a peça personalizada');

  /* fontes: só arquivos nossos, nada de terceiros nas páginas públicas */
  for (const pg of ['index.html', '404.html', ...PAGINAS]) {
    const t = ler(pg);
    if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(t)) failures.push(`[fontes] ${pg} carrega fontes de terceiros; use assets/fontes (LGPD e primeira pintura)`);
    if (/<link[^>]+href="https?:\/\/(?!seu-mimo-studio)/.test(t)) failures.push(`[fontes] ${pg} tem <link> para um endereço de fora`);
  }
  for (const fam of ['DM Serif Display', 'Montserrat', 'Caveat'])
    if (!new RegExp(`@font-face \\{ font-family: "${fam}"`).test(ler('styles.css'))) failures.push(`[fontes] styles.css sem @font-face de ${fam}`);
  if (!/<link rel="manifest" href="site\.webmanifest">/.test(index)) failures.push('[cabeçalho] index.html sem o manifest');

  const titulo = (index.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  if (titulo.length < 30 || titulo.length > 70 || !/personalizad/i.test(titulo)) failures.push(`[seo] o <title> da home precisa dizer o que a marca vende, com 30 a 70 caracteres (está "${titulo}", ${titulo.length})`);
  for (const m of ['og:site_name', 'og:locale', 'twitter:title', 'twitter:description']) if (!index.includes(`"${m}"`)) failures.push(`[seo] index.html sem ${m}`);

  /* dados estruturados: o bloco fixo e o catálogo gerado */
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(page_url, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const ld = await page.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { return JSON.parse(s.textContent); } catch (e) { return null; } }));
  if (ld.some((x) => !x)) failures.push('[seo] há um bloco ld+json inválido');
  const tipos = ld.filter(Boolean).flatMap((x) => x['@graph'] || [x]).map((x) => x['@type']);
  for (const t of ['Organization', 'WebSite', 'WebPage', 'ItemList']) if (!tipos.includes(t)) failures.push(`[seo] falta o dado estruturado ${t} (há: ${tipos.join(', ')})`);
  const itemList = ld.filter(Boolean).find((x) => x['@type'] === 'ItemList');
  const nPecas = await page.$$eval('#lista-pecas .peca', (l) => l.length);
  if (itemList && itemList.itemListElement.length !== nPecas) failures.push(`[seo] ItemList com ${itemList.itemListElement.length} peças, mas a tela mostra ${nPecas}`);
  if (itemList && itemList.itemListElement.some((i) => !i.item.offers || !/^\d+\.\d{2}$/.test(i.item.offers.lowPrice))) failures.push('[seo] há peça no ItemList sem oferta com preço (lowPrice)');
  const org = ld.filter(Boolean).flatMap((x) => x['@graph'] || [x]).find((x) => x['@type'] === 'Organization');
  if (org && org.slogan !== 'Mais do que presentes, são histórias que ficam.') failures.push('[seo] o slogan do Organization não é a assinatura da marca');

  /* títulos em ordem, sem salto de nível */
  for (const pg of ['index.html', ...PAGINAS]) {
    const p2 = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await p2.goto(url(pg), { waitUntil: 'load' }); await p2.waitForTimeout(250);
    const saltos = await p2.evaluate(() => {
      let nivel = 0; const out = [];
      for (const h of document.querySelectorAll('main h1, main h2, main h3, main h4')) {
        const n = +h.tagName[1];
        if (n > nivel + 1) out.push(`${h.tagName} "${h.textContent.trim().slice(0, 30)}" depois de h${nivel}`);
        nivel = n;
      }
      const h1 = document.querySelectorAll('h1').length;
      if (h1 !== 1) out.push(`${h1} <h1> na página`);
      return out;
    });
    if (saltos.length) failures.push(`[acessibilidade] ${pg}: ${saltos.join('; ')}`);
    await p2.close();
  }
  await page.close();

  /* axe-core (WCAG 2.2 AA + boas práticas): nada moderado, sério ou crítico */
  const axePath = path.resolve(raiz, 'node_modules', 'axe-core', 'axe.min.js');
  if (!fs.existsSync(axePath)) failures.push('[acessibilidade] axe-core não instalado (npm install)');
  else for (const pg of ['index.html', ...PAGINAS, '404.html']) {
    for (const [w, h] of [[390, 844], [1280, 900]]) {
      const pa = await browser.newPage({ viewport: { width: w, height: h } });
      await pa.goto(url(pg), { waitUntil: 'load' });
      await pa.waitForTimeout(400);
      await pa.addScriptTag({ path: axePath });
      const r = await pa.evaluate(async () => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] }));
      for (const v of r.violations) {
        const msg = `[acessibilidade] ${pg} @${w}px: ${v.id} (${v.impact}) ${v.help} · ${v.nodes.slice(0, 2).map((n) => n.html.slice(0, 90)).join(' | ')}`;
        if (v.impact === 'serious' || v.impact === 'critical' || v.impact === 'moderate') failures.push(msg); else warnings.push(msg);
      }
      await pa.close();
    }
  }
}

await browser.close();

console.log(`\nInventário: ${links.size} links/botões encontrados`);
if (process.argv.includes('--links')) for (const [, l] of links) console.log(`  ${l.tag.padEnd(7)} ${l.text.padEnd(44)} → ${l.href}`);
if (onlyShots) { console.log('capturas salvas em qa/shots/'); process.exit(0); }
if (warnings.length) console.log(`\n⚠ ${[...new Set(warnings)].length} aviso(s) (não bloqueiam):\n` + [...new Set(warnings)].map((f) => '  - ' + f).join('\n'));
if (failures.length) {
  console.error(`\n✗ ${[...new Set(failures)].length} problema(s):\n` + [...new Set(failures)].map((f) => '  - ' + f).join('\n'));
  process.exit(1);
}
console.log(`✓ guardião: nenhum problema nas ${viewports.length} resoluções testadas`);
