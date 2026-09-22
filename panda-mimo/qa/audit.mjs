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
    - conversão (V2): hero com título comercial e assinatura, só as chamadas para ação da tabela
      4.7 do manual, preço em toda peça publicada, frete numa frase só, sem promessa de "vida útil",
      quatro lançamentos visíveis e "Ver mais", depoimentos (cartões, marca de exemplo, formulário
      gravando no banco simulado, seção sem cartões quando o banco devolve vazio), privacidade linkada
    - conteúdo sempre visível: página carregada num webview ainda sem altura (Instagram,
      WhatsApp), sem IntersectionObserver e sem JavaScript; hero, selos e catálogo aparecem,
      e nenhuma seção segue invisível 4,5 s depois do carregamento
    - ícones PNG e de toque, imagem de compartilhamento 1200x630 em JPG,
      robots.txt e sitemap.xml; aviso quando os endereços ainda são relativos
    - medição: a visita e o clique no WhatsApp são registrados (com o banco simulado)
    - foto de produto que não seja um quadro quadrado transparente: fundo retangular
      aparecendo nos cantos, ou peça encostando na borda (risco de estar cortada)
    - erro de console; requisição local falhando (404 etc.)
    - páginas de apoio (sobre, trocas, termos, privacidade): existem, linkadas no rodapé, com canonical,
      título e descrição, dados da loja e sitemap; fontes servidas do próprio site; manifest; <title> comercial;
      dados estruturados (Organization, WebSite, FAQPage igual à seção Dúvidas, ItemList com preço por peça);
      hierarquia de títulos sem saltos; axe-core (WCAG 2.2 AA) sem violação moderada, séria ou crítica
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
      // imagem com srcset é medida na passada de nitidez (2x e 3x); as demais precisam aguentar 2x sozinhas
      if (!img.srcset) {
        const zoom = drawn * 2 / img.naturalWidth;
        if (drawn > 120 && zoom > 1.1) out.push(`imagem macia em tela 2x (${zoom.toFixed(2)}x): ${img.getAttribute('src').slice(0, 50)}; gere a versão @2x ou reduza o tamanho exibido`);
      }
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
    await car.waitForSelector(`.carousel__status:text-is("Foto 2 de ${n}")`, { timeout: 4000 }).catch(() => {});
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
  // (a vista padrão mostra quatro; "Ver mais" revela o resto antes de conferir cada um)
  await page.$eval('#mais-lancamentos', (b) => b.click()).catch(() => {}); await page.waitForTimeout(120);
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

  // o grupo de lançamentos tem título próprio, entre a última peça e o primeiro lançamento
  {
    const nLanc = (await page.$$('.product--lancamento')).length;
    const divisores = (await page.$$('.products__divisor')).length;
    if (nLanc && divisores !== 1) fail(w, `há ${nLanc} lançamento(s) e ${divisores} título(s) de grupo "Você escolhe o que sai primeiro"`);
    if (!nLanc && divisores) fail(w, 'título do grupo de lançamentos aparece sem nenhum lançamento');
    if (nLanc && divisores === 1) {
      const pos = await page.evaluate(() => {
        const d = document.querySelector('.products__divisor').getBoundingClientRect();
        const pecas = [...document.querySelectorAll('.product:not(.product--lancamento):not(.product--soon)')].map((e) => e.getBoundingClientRect().bottom);
        const lanc = [...document.querySelectorAll('.product--lancamento')].map((e) => e.getBoundingClientRect().top);
        return { topo: d.top, base: d.bottom, ultimaPeca: Math.max(...pecas), primeiroLanc: Math.min(...lanc), texto: (document.querySelector('.products__divisor h3')?.textContent || '').replace(/\s+/g, ' ').trim() };
      });
      if (!(pos.topo >= pos.ultimaPeca - 1 && pos.base <= pos.primeiroLanc + 1)) fail(w, 'o título do grupo de lançamentos não está entre a última peça e o primeiro lançamento');
      if (!/Você escolhe/.test(pos.texto)) fail(w, `título do grupo de lançamentos inesperado: "${pos.texto}"`);
    }
  }

  // busca e filtros do catálogo
  if (!(await page.$('#busca-pecas'))) fail(w, 'catálogo sem campo de busca');
  else {
    const visiveis = () => page.evaluate(() => [...document.querySelectorAll('#lista-produtos .product')].filter((e) => !e.hidden));
    const total = await page.$$eval('#lista-produtos .product:not([data-tipo="aviso"])', (l) => l.length);
    await page.fill('#busca-pecas', 'Caneca'); await page.waitForTimeout(80);
    const r1 = await page.evaluate(() => { const vis = [...document.querySelectorAll('#lista-produtos .product')].filter((e) => !e.hidden); return { n: vis.length, ok: vis.every((e) => (e.dataset.busca || '').includes('caneca')), txt: document.getElementById('catalogo-resultado').textContent }; });
    if (!r1.n || !r1.ok) fail(w, `busca "Caneca" mostrou ${r1.n} cartão(ões), nem todos com caneca`);
    if (!/^\d+ peças?/.test(r1.txt) || !r1.txt.includes('"Caneca"')) fail(w, `texto do resultado da busca inesperado: "${r1.txt}"`);
    await page.fill('#busca-pecas', 'xyzqw'); await page.waitForTimeout(80);
    const r2 = await page.evaluate(() => ({ vis: [...document.querySelectorAll('#lista-produtos .product')].filter((e) => !e.hidden).length, vazio: !document.getElementById('catalogo-vazio').hidden, zap: document.querySelector('#catalogo-vazio .js-wa')?.href || '', divisor: document.querySelector('.products__divisor')?.hidden, txt: document.getElementById('catalogo-resultado').textContent }));
    if (r2.vis !== 0 || !r2.vazio) fail(w, 'busca sem resultado não mostrou o estado vazio');
    if (!/wa\.me/.test(r2.zap) || !decodeURIComponent(r2.zap).includes('xyzqw')) fail(w, 'o WhatsApp do estado vazio não leva o que a pessoa procurou');
    if (r2.divisor !== true) fail(w, 'título do grupo de lançamentos continua aparecendo com a busca sem resultado');
    if (!/^Nenhuma peça/.test(r2.txt)) fail(w, `resultado vazio com texto inesperado: "${r2.txt}"`);
    await page.$eval('#limpar-busca', (b) => b.click()); await page.waitForTimeout(80);
    if ((await visiveis()).length < total) fail(w, '"Limpar busca" não devolveu o catálogo inteiro');
    for (const filtro of ['peca', 'lancamento', 'tema:pet']) {
      const chip = await page.$(`.filtro[data-filtro="${filtro}"]`);
      if (!chip) { fail(w, `chip de filtro ${filtro} não existe`); continue; }
      await chip.click(); await page.waitForTimeout(80);
      const r = await page.evaluate(() => { const vis = [...document.querySelectorAll('#lista-produtos .product')].filter((e) => !e.hidden); const div = document.querySelector('.products__divisor'); return { n: vis.length, pressed: document.querySelectorAll('.filtro[aria-pressed="true"]').length, tipos: vis.map((e) => e.dataset.tipo), temas: vis.map((e) => e.dataset.tema), divisorHidden: div ? div.hidden : true }; });
      if (r.pressed !== 1) fail(w, `filtro ${filtro}: ${r.pressed} chips marcados ao mesmo tempo`);
      if (filtro === 'peca' && (r.tipos.some((t) => t !== 'peca') || !r.divisorHidden)) fail(w, 'filtro "Pra pedir agora" deixou lançamento, aviso ou o título do grupo visível');
      if (filtro === 'lancamento' && (r.tipos.some((t) => t === 'peca') || r.divisorHidden || !r.n)) fail(w, 'filtro "Em teste" mostrou peça pronta ou escondeu o título do grupo');
      if (filtro === 'tema:pet' && (!r.n || r.temas.some((t) => t !== 'pet'))) fail(w, `filtro Pet mostrou ${r.n} cartão(ões), nem todos do tema pet`);
    }
    await page.$eval('.filtro[data-filtro="tudo"]', (b) => b.click()); await page.waitForTimeout(80);
    if ((await visiveis()).length < total) fail(w, 'filtro "Tudo" não devolveu o catálogo inteiro');
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
    const selosInvisiveis = await page.$eval('.trust', (t) => getComputedStyle(t).opacity !== '1');
    if (selosInvisiveis) fail(w, 'os selos de confiança, logo abaixo do hero, começam invisíveis');
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
  for (const f of ['robots.txt', 'sitemap.xml', '404.html', 'assets/og.jpg', 'assets/apple-touch-icon.png', 'assets/favicon-32.png'])
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
    // a página 404 usa endereços absolutos (o Pages a mostra em qualquer caminho) e eles têm de ser os do canonical
    const p404 = path.resolve(here, '..', '404.html');
    if (fs.existsSync(p404)) {
      const t = fs.readFileSync(p404, 'utf8');
      if (!t.includes(`href="${base}styles.css"`) || !t.includes(`href="${base}"`)) failures.push(`[lançamento] 404.html não aponta para ${base} (estilo e link de volta)`);
      if (!/<title>[^<]*Panda Mimo/.test(t) || !/Voltar pro início/.test(t)) failures.push('[lançamento] 404.html sem título da marca ou sem o caminho de volta');
    }
  }
  // WhatsApp de reserva: o site funciona, mas nenhum clique chega a ninguém
  const scriptFonte = fs.readFileSync(path.resolve(here, '..', 'script.js'), 'utf8');
  const zapReserva = scriptFonte.match(/whatsapp:\s*"(\d+)"/);
  if (zapReserva && /^55(\d)\1{8,}$/.test(zapReserva[1])) warnings.push(`[antes de ir ao ar] o WhatsApp do site ainda é o número de reserva (${zapReserva[1]}); troque pelo painel ou em script.js`);

  // link direto para um produto abre o detalhe
  await page.goto(page_url + '#produto/canecas', { waitUntil: 'load' });
  await page.evaluate(() => window.PANDA_CATALOGO || true);
  await page.waitForTimeout(300);
  const direto = await page.evaluate(() => ({ aberto: document.getElementById('detalhe').open, titulo: document.getElementById('detalhe-titulo').textContent.trim() }));
  if (!direto.aberto || direto.titulo !== 'Canecas') failures.push(`[detalhe] o endereço #produto/canecas não abriu o detalhe certo (${JSON.stringify(direto)})`);
  await page.close();
}

// ---- conversão (V2): o que vende precisa estar na tela, do jeito que o manual manda ----
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const depos = [];
  await page.route('**/rest/v1/pm_depoimentos*', (r) => {
    if (r.request().method() === 'POST') { try { depos.push(JSON.parse(r.request().postData() || '{}')); } catch {} return r.fulfill({ status: 201, body: '' }); }
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
      { nome: 'Ana B.', cidade: 'Recife/PE', peca: 'Caneca', nota: 5, texto: 'Depoimento vindo do banco, aprovado no painel.', exemplo: false },
      { nome: 'Exemplo E.', cidade: 'Cidade/UF', peca: 'Copo', nota: 4, texto: 'Cartão ilustrativo marcado como exemplo.', exemplo: true },
    ]) });
  });
  await page.goto(page_url, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  const html = fs.readFileSync(path.resolve(here, '..', 'index.html'), 'utf8');
  const produtosLocal = JSON.parse(fs.readFileSync(path.resolve(here, '..', 'produtos.js'), 'utf8').replace(/^[\s\S]*?window\.PANDA_PRODUTOS\s*=\s*/, '').replace(/;\s*$/, ''));
  // hero: título comercial + assinatura logo abaixo + chamadas certas
  const hero = await page.evaluate(() => ({
    h1: document.querySelector('.hero h1')?.textContent.trim(),
    assinatura: document.querySelector('.hero .hero__assinatura')?.textContent.trim(),
    botoes: [...document.querySelectorAll('.hero__actions .btn')].map((b) => b.textContent.trim()),
    facts: document.querySelectorAll('.hero__facts li').length,
  }));
  if (!/Presentes personalizados/.test(hero.h1 || '')) failures.push(`[conversão] o título do hero não diz o que a marca vende (está "${hero.h1}")`);
  if (hero.assinatura !== 'Feito com carinho, feito pra você.') failures.push('[conversão] a assinatura da marca sumiu do hero (regra 4.3)');
  if (hero.botoes[0] !== 'Quero criar meu mimo' || hero.botoes[1] !== 'Ver as peças') failures.push(`[conversão] chamadas do hero fora da tabela 4.7: ${hero.botoes.join(' | ')}`);
  if (hero.facts < 4) failures.push('[conversão] a faixa de segurança do hero perdeu itens');
  // chamadas para ação: só as da tabela 4.7 (botões .btn com texto)
  const permitidas = ['Quero criar meu mimo', 'Ver as peças', 'Quero essa', 'Pedir esse mimo no WhatsApp', 'Orçamento para 10+ unidades', 'Me avise', 'Pedir pelo WhatsApp', 'Perguntar no WhatsApp', 'Ver no Instagram', 'Ver com meu nome', 'Ver minha foto na caneca', 'Enviar depoimento', 'Voltar pro início', 'Limpar busca', 'Ver mais'];
  const fora = await page.$$eval('main .btn, footer .btn', (els) => els.map((b) => b.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean));
  const estranhas = [...new Set(fora.filter((t) => !permitidas.some((p) => t === p || t.startsWith(p))))];
  if (estranhas.length) failures.push(`[conversão] chamada(s) fora da tabela 4.7 do manual: ${estranhas.join(' | ')}`);
  // preço em toda peça publicada que não é lançamento
  const semPreco = await page.$$eval('#lista-produtos .product[data-tipo="peca"]', (els) => els.filter((el) => !el.querySelector('.product__preco')?.textContent.trim()).map((el) => el.querySelector('h3')?.textContent.trim()));
  if (semPreco.length) failures.push(`[conversão] peça(s) sem preço no cartão: ${semPreco.join(', ')}`);
  const localSemPreco = produtosLocal.filter((p) => !p.lancamento && !p.em_breve && !p.preco_texto).map((p) => p.nome);
  if (localSemPreco.length) failures.push(`[conversão] peça(s) sem preço na cópia local (produtos.js): ${localSemPreco.join(', ')}`);
  // frete: uma frase só, promessas sem exagero
  if (/Frete grátis para algumas regi/i.test(html)) failures.push('[conversão] frete com a frase antiga ("para algumas regiões"); use a frase única da regra 11.1');
  if (!/Envio para <strong>todo o Brasil<\/strong>\. Frete grátis em regiões participantes/.test(html)) failures.push('[conversão] a barra do topo não traz a frase única do frete');
  if (/dura a vida útil/i.test(html)) failures.push('[conversão] promessa forte demais: "dura a vida útil" (regra 11.1)');
  if (!/Nada é produzido sem o seu "pode fazer"/.test(html)) failures.push('[conversão] a frase de segurança ("Nada é produzido sem o seu \'pode fazer\'") saiu do site');
  // lançamentos: quatro visíveis, botão revela o resto
  const lanc = await page.evaluate(() => {
    const todos = [...document.querySelectorAll('#lista-produtos .product[data-tipo="lancamento"]')];
    return { total: todos.length, visiveis: todos.filter((el) => !el.hidden).length, botao: document.querySelector('#mais-lancamentos')?.closest('.products__mais')?.hidden === false, texto: document.querySelector('#mais-lancamentos')?.textContent.trim() };
  });
  if (lanc.total > 4 && lanc.visiveis !== 4) failures.push(`[conversão] ${lanc.visiveis} lançamentos visíveis na vista padrão; a regra é 4`);
  if (lanc.total > 4 && !lanc.botao) failures.push('[conversão] o botão "Ver mais ideias em teste" não aparece');
  if (lanc.total > 4) {
    await page.click('#mais-lancamentos'); await page.waitForTimeout(150);
    const depois = await page.$$eval('#lista-produtos .product[data-tipo="lancamento"]', (els) => els.filter((el) => !el.hidden).length);
    if (depois !== lanc.total) failures.push(`[conversão] "Ver mais" mostrou ${depois} de ${lanc.total} lançamentos`);
  }
  // depoimentos: cartões do banco, marca de exemplo, formulário
  const depo = await page.evaluate(() => ({
    cartoes: document.querySelectorAll('#lista-depoimentos .depo').length,
    exemplos: document.querySelectorAll('#lista-depoimentos .depo--exemplo').length,
    nota: document.getElementById('depoimentos-nota')?.hidden === false,
    estrelas: document.querySelector('#lista-depoimentos .depo__estrelas')?.getAttribute('aria-label'),
    privacidade: !!document.querySelector('#form-depoimento a[href="privacidade.html"]') && !!document.querySelector('footer a[href="privacidade.html"]'),
  }));
  if (depo.cartoes !== 2) failures.push(`[depoimentos] esperava 2 cartões do banco simulado, vieram ${depo.cartoes}`);
  if (depo.exemplos !== 1 || !depo.nota) failures.push('[depoimentos] cartão de exemplo sem a marca "exemplo" ou sem a nota explicativa');
  if (!/de 5$/.test(depo.estrelas || '')) failures.push('[depoimentos] as estrelas não têm rótulo acessível "N de 5"');
  if (!depo.privacidade) failures.push('[depoimentos] falta o link para privacidade.html no formulário ou no rodapé');
  if (!fs.existsSync(path.resolve(here, '..', 'privacidade.html'))) failures.push('[depoimentos] privacidade.html não existe');
  await page.$eval('#depo-form', (d) => { d.open = true; });
  await page.fill('#d-nome', 'Teste Guardião'); await page.fill('#d-cidade', 'Pedreira/SP'); await page.selectOption('#d-peca', 'Caneca');
  await page.click('#d-enviar'); await page.waitForTimeout(200);
  let st = await page.$eval('#depo-status', (p) => p.textContent);
  if (!/pouquinho mais/.test(st)) failures.push(`[depoimentos] enviar sem texto não avisou (status: "${st}")`);
  await page.fill('#d-texto', 'Chegou rápido e a prévia veio antes, como prometido.');
  await page.click('#d-enviar'); await page.waitForTimeout(200);
  st = await page.$eval('#depo-status', (p) => p.textContent);
  if (!/autorização/.test(st)) failures.push(`[depoimentos] enviar sem autorização não avisou (status: "${st}")`);
  await page.check('#d-consent'); await page.click('#d-enviar'); await page.waitForTimeout(500);
  st = await page.$eval('#depo-status', (p) => p.textContent);
  if (!/Recebido/.test(st)) failures.push(`[depoimentos] envio válido não confirmou (status: "${st}")`);
  const gravado = depos[0];
  if (!gravado || gravado.nome !== 'Teste Guardião' || gravado.peca !== 'Caneca' || gravado.nota !== 5 || 'aprovado' in gravado) failures.push(`[depoimentos] o que chegou ao banco não é o que foi digitado: ${JSON.stringify(gravado)}`);
  await page.close();
  // banco devolvendo vazio: a seção não mostra cartão nenhum (nem os exemplos da cópia local)
  const p2 = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await p2.route('**/rest/v1/pm_depoimentos*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await p2.goto(page_url, { waitUntil: 'load' }); await p2.waitForTimeout(600);
  const vazio = await p2.evaluate(() => ({ cartoes: document.querySelectorAll('#lista-depoimentos .depo').length, escondido: document.getElementById('lista-depoimentos').hidden }));
  if (vazio.cartoes !== 0 || !vazio.escondido) failures.push('[depoimentos] com o banco vazio, os cartões de exemplo da cópia local continuaram na tela');
  await p2.close();
}

// ---- conteúdo sempre visível: a animação de entrada nunca pode deixar a página em branco ----
// Cenário real: webview do Instagram/WhatsApp carrega a página antes de ter altura (innerHeight ~0);
// tudo o que depender de "está abaixo da primeira tela" esconde a página inteira, hero incluído.
{
  const visivel = (page, sel) => page.$eval(sel, (el) => { const cs = getComputedStyle(el); const b = el.getBoundingClientRect(); return Number(cs.opacity) > 0.99 && cs.visibility !== 'hidden' && b.height > 0; });
  const invisiveis = (page) => page.$$eval('main > section, main > .trust, footer', (els) => els.filter((el) => Number(getComputedStyle(el).opacity) < 0.99).map((el) => el.id || el.className.split(' ')[0]));
  // a) carrega com 1 px de altura e só depois ganha a tela
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 1 } });
    await page.goto(page_url, { waitUntil: 'load' }); await page.waitForTimeout(200);
    await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(600);
    for (const sel of ['.hero', '.trust', '#produtos'])
      if (!(await visivel(page, sel))) failures.push(`[conteúdo] ${sel} ficou invisível quando a página carregou sem altura de tela (webview do Instagram/WhatsApp)`);
    const prods = await page.$$eval('#lista-produtos .product', (els) => els.length);
    if (!prods) failures.push('[conteúdo] o catálogo não montou quando a página carregou sem altura de tela');
    await page.waitForTimeout(4000);
    const ainda = await invisiveis(page);
    if (ainda.length) failures.push(`[conteúdo] ${ainda.length} seção(ões) continuam invisíveis 4,5 s depois do carregamento, sem rolar: ${ainda.join(', ')}`);
    await page.close();
  }
  // b) navegador sem IntersectionObserver: nada pode depender dele para aparecer
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.addInitScript(() => { delete window.IntersectionObserver; });
    await page.goto(page_url, { waitUntil: 'load' }); await page.waitForTimeout(300);
    const ainda = await invisiveis(page);
    if (ainda.length) failures.push(`[conteúdo] sem IntersectionObserver, ${ainda.length} seção(ões) ficam invisíveis: ${ainda.join(', ')}`);
    await page.close();
  }
  // c) sem JavaScript: hero legível e o catálogo explica o que fazer
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(page_url, { waitUntil: 'load' });
    if (!(await visivel(page, '.hero h1'))) failures.push('[conteúdo] sem JavaScript o título do hero não aparece');
    const aviso = await page.$eval('#produtos', (s) => s.innerText);
    if (!/WhatsApp/i.test(aviso)) failures.push('[conteúdo] sem JavaScript a área de produtos fica em branco, sem caminho para o WhatsApp');
    await ctx.close();
  }
}

// ---- nitidez: em telas 2x e 3x nenhuma imagem pode aparecer ampliada acima de 10% ----
for (const [w, h, dpr] of [[1280, 800, 2], [390, 844, 3]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  await page.goto(page_url, { waitUntil: 'load' });
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await page.evaluate(() => { window.PANDA_REVELA_TUDO && window.PANDA_REVELA_TUDO(); document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; }); });
  await page.evaluate(async () => { const passo = innerHeight * .8; for (let y = 0; y < document.documentElement.scrollHeight; y += passo) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } scrollTo(0, 0); });
  // detalhe e foto real também entram na medição
  await page.$eval('.product[data-slug="canecas"] .product__ver', (b) => b.click()).catch(() => {});
  await page.waitForTimeout(150);
  await page.$eval('label[for="i-caneca"]', (l) => l.click()).catch(() => {});
  await page.$eval('label[for="m-foto"]', (l) => l.click()).catch(() => {});
  await page.waitForTimeout(200);
  await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete && i.naturalWidth > 0) ? null : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 5000); }))));
  const macias = await page.evaluate((dpr) => {
    const out = [];
    for (const img of document.querySelectorAll('img')) {
      const cs = getComputedStyle(img); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const r = img.getBoundingClientRect(); if (r.width < 100) continue;
      if (!img.naturalWidth) { out.push(`não carregou em ${dpr}x: ${(img.currentSrc || img.src).split('/').pop().slice(0, 50)}`); continue; }
      let drawn = r.width;
      if (cs.objectFit === 'contain') drawn = img.naturalWidth * Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
      // com srcset, naturalWidth já vem dividido pela densidade escolhida; recupera os pixels de verdade
      let dens = 1;
      if (img.srcset) for (const c of img.srcset.split(',')) { const [u, d] = c.trim().split(/\s+/); if (img.currentSrc.endsWith(u.split('/').pop()) && d && d.endsWith('x')) dens = parseFloat(d); }
      // com descritores de largura ("1000w"), a largura real do arquivo é o próprio descritor
      let largura = 0;
      if (img.srcset) for (const c of img.srcset.split(',')) { const [u, d] = c.trim().split(/\s+/); if (img.currentSrc.endsWith(u.split('/').pop()) && d && d.endsWith('w')) largura = parseFloat(d); }
      const pixels = largura || img.naturalWidth * dens;
      const precisa = drawn * dpr, razao = precisa / pixels;
      if (razao > 1.1) out.push(`imagem macia em ${dpr}x (${razao.toFixed(2)}x, precisa ${Math.round(precisa)} px e tem ${pixels}): ${(img.currentSrc || img.src).split('/').pop().slice(0, 50)}`);
      if (img.closest('.carousel') && !/@2x\./.test(img.currentSrc)) out.push(`foto de produto sem versão 2x em tela ${dpr}x: ${img.currentSrc.split('/').pop().slice(0, 50)}`);
    }
    return out;
  }, dpr);
  macias.forEach((m) => failures.push(`[nitidez ${w}px@${dpr}x] ${m}`));
  await page.close();
}

// ---- medição: visita e clique chegam ao banco (simulado) ----
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const eventos = [];
  await page.route('**/rest/v1/pm_eventos*', (r) => { try { eventos.push(JSON.parse(r.request().postData() || '{}')); } catch {} r.fulfill({ status: 201, body: '' }); });
  await page.goto(page_url, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  await page.$eval('.fab.js-wa', (a) => { a.addEventListener('click', (e) => e.preventDefault(), { once: true }); a.click(); });
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
  // a busca é medida (depois de uma pausa, para não registrar letra por letra) e o filtro também
  await page.fill('#busca-pecas', 'garrafa'); await page.waitForTimeout(1200);
  if (!eventos.some((e) => e.evento === 'busca' && e.rotulo === 'garrafa')) failures.push('[medição] a busca "garrafa" não foi registrada');
  await page.$eval('.filtro[data-filtro="tema:pet"]', (b) => b.click()).catch(() => {}); await page.waitForTimeout(300);
  if (!eventos.some((e) => e.evento === 'filtro' && e.rotulo === 'Pet')) failures.push('[medição] o filtro Pet não foi registrado');
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
  await page.route('**/rest/v1/pm_config*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ whatsapp: '5511988887777', instagram: 'teste_ig', tiktok: 'teste_tt', aviso_topo: 'Aviso vindo do banco.', nome_empresarial: 'Loja de Teste LTDA', cnpj: '00.000.000/0001-00', endereco: 'Rua de Teste, 1', email: 'teste@exemplo.com' }]) }));
  await page.goto(page_url, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => ({
    quantos: document.querySelectorAll('#lista-produtos .product').length,
    nome: document.querySelector('#lista-produtos h3')?.textContent,
    zap: document.querySelector('#lista-produtos .product__cta')?.href || '',
    aviso: document.querySelector('.announce__in p')?.textContent,
    loja: document.getElementById('loja-dados')?.hidden ? '' : document.getElementById('loja-dados')?.textContent,
    insta: document.querySelector('.js-ig')?.href || '',
    selo: document.querySelector('#lista-produtos .product--lancamento .product__selo')?.textContent.trim() || '',
  }));
  if (r.quantos !== 2 || r.nome !== 'Produto de teste') failures.push(`[banco] catálogo do banco não substituiu a cópia local (${r.quantos} produto(s), "${r.nome}")`);
  if (r.selo !== 'Em breve') failures.push('[banco] um lançamento em teste vindo do banco não ganhou o selo "Em breve"');
  if (!r.zap.includes('5511988887777')) failures.push('[banco] o número de WhatsApp do banco não foi aplicado aos botões');
  if (!/Loja de Teste LTDA · CNPJ 00\.000\.000\/0001-00 · Rua de Teste, 1 · teste@exemplo\.com/.test(r.loja || '')) failures.push(`[banco] os dados da loja do banco não chegaram ao rodapé (está "${r.loja}")`);
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

// ---- páginas de apoio, SEO técnico, fontes próprias e acessibilidade (axe-core) ----
{
  const raiz = path.resolve(here, '..');
  const ler = (f) => fs.readFileSync(path.resolve(raiz, f), 'utf8');
  const index = ler('index.html');
  const PAGINAS = ['sobre.html', 'trocas.html', 'termos.html', 'privacidade.html'];
  const sitemap = ler('sitemap.xml');
  for (const pg of PAGINAS) {
    if (!fs.existsSync(path.resolve(raiz, pg))) { failures.push(`[páginas] falta ${pg}`); continue; }
    const t = ler(pg);
    if (!new RegExp(`<a href="${pg}">`).test(index)) failures.push(`[páginas] o rodapé do index não tem link para ${pg}`);
    if (!t.includes(`<link rel="canonical" href="`) || !t.includes(pg + '"')) failures.push(`[páginas] ${pg} sem canonical próprio`);
    if (!/<title>[^<]{10,70}Panda Mimo<\/title>/.test(t)) failures.push(`[páginas] ${pg} sem <title> "… · Panda Mimo" (10 a 70 caracteres)`);
    if (!/<meta name="description" content="[^"]{60,170}">/.test(t)) failures.push(`[páginas] ${pg} sem meta description de 60 a 170 caracteres`);
    if (!t.includes('id="loja-dados"')) failures.push(`[páginas] ${pg} sem a linha de identificação da loja no rodapé (Decreto 7.962/2013)`);
    if (!/href="index\.html"/.test(t)) failures.push(`[páginas] ${pg} sem caminho de volta para o início`);
    for (const outra of PAGINAS) if (!t.includes(`href="${outra}"`)) failures.push(`[páginas] ${pg} não linka ${outra} no rodapé`);
    if (!sitemap.includes(`<loc>https://reinaldo3010.github.io/Claude-desk/${pg}</loc>`) && !/SEU-DOMINIO/.test(sitemap)) failures.push(`[páginas] sitemap.xml não lista ${pg}`);
  }
  if (!/Cookies<\/h2>/.test(ler('privacidade.html'))) failures.push('[páginas] privacidade.html perdeu a seção sobre cookies');
  if (!/90 dias/.test(ler('trocas.html'))) failures.push('[páginas] trocas.html não informa a garantia legal de 90 dias (CDC art. 26)');
  // estúdio da caneca em 360° (caneca-3d.html): mesma disciplina de cabeçalho, rodapé e sitemap
  {
    const pg = 'caneca-3d.html';
    if (!fs.existsSync(path.resolve(raiz, pg))) failures.push(`[estúdio] falta ${pg}`);
    else {
      const t = ler(pg);
      if (!new RegExp(`href="${pg}"`).test(index)) failures.push(`[estúdio] o index não leva para ${pg}`);
      if (!t.includes(`<link rel="canonical" href="`) || !t.includes(pg + '"')) failures.push(`[estúdio] ${pg} sem canonical próprio`);
      if (!/<title>[^<]{10,70}Panda Mimo<\/title>/.test(t)) failures.push(`[estúdio] ${pg} sem <title> "… · Panda Mimo"`);
      if (!/<meta name="description" content="[^"]{60,170}">/.test(t)) failures.push(`[estúdio] ${pg} sem meta description de 60 a 170 caracteres`);
      if (!t.includes('id="loja-dados"')) failures.push(`[estúdio] ${pg} sem a linha de identificação da loja no rodapé`);
      for (const outra of PAGINAS) if (!t.includes(`href="${outra}"`)) failures.push(`[estúdio] ${pg} não linka ${outra} no rodapé`);
      if (!sitemap.includes(`<loc>https://reinaldo3010.github.io/Claude-desk/${pg}</loc>`) && !/SEU-DOMINIO/.test(sitemap)) failures.push(`[estúdio] sitemap.xml não lista ${pg}`);
      if (/fonts\.googleapis\.com|fonts\.gstatic\.com|https?:\/\/[^"']*\.js/.test(t)) failures.push(`[estúdio] ${pg} carrega fonte ou script de terceiros`);
      for (const f of ['simulador/estudio.js', 'simulador/arte.js', 'simulador/caneca-3d.js', 'simulador/estudio.css', 'vendor/three/three.module.js', 'vendor/three/OrbitControls.js'])
        if (!fs.existsSync(path.resolve(raiz, f))) failures.push(`[estúdio] falta o arquivo ${f}`);
      if (!/Nada é produzido sem o seu/.test(t)) failures.push('[estúdio] frase de segurança da tabela 4.7 sumiu da página');
    }
  }
  // fontes: só arquivos nossos; nada de terceiros nas páginas públicas
  for (const pg of ['index.html', '404.html', 'caneca-3d.html', ...PAGINAS]) {
    const t = ler(pg);
    if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(t)) failures.push(`[fontes] ${pg} ainda carrega fontes de terceiros; use assets/fontes (LGPD e primeira pintura)`);
  }
  for (const f of ['assets/fontes/fredoka.woff2', 'assets/fontes/nunito.woff2', 'assets/fontes/caveat.woff2', 'site.webmanifest', 'assets/icone-512.png'])
    if (!fs.existsSync(path.resolve(raiz, f))) failures.push(`[lançamento] falta o arquivo ${f}`);
  if (!/@font-face \{ font-family: "Fredoka"/.test(ler('styles.css'))) failures.push('[fontes] styles.css sem @font-face das fontes próprias');
  if (!/<link rel="manifest" href="site\.webmanifest">/.test(index)) failures.push('[cabeçalho] index.html sem o manifest');
  const titulo = (index.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  if (titulo.length < 30 || titulo.length > 70 || !/personalizad/i.test(titulo)) failures.push(`[seo] o <title> do index precisa dizer o que a marca vende, com 30 a 70 caracteres (está "${titulo}")`);
  for (const m of ['og:site_name', 'og:locale', 'twitter:title', 'twitter:description']) if (!index.includes(`"${m}"`)) failures.push(`[seo] index.html sem ${m}`);
  // dados estruturados: o bloco fixo (Organization, WebSite, WebPage, FAQPage) e o catálogo gerado
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.route('**/rest/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.goto(page_url, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  const ld = await page.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { return JSON.parse(s.textContent); } catch (e) { return null; } }));
  if (ld.some((x) => !x)) failures.push('[seo] há um bloco ld+json inválido');
  const tipos = ld.filter(Boolean).flatMap((x) => x['@graph'] || [x]).map((x) => x['@type']);
  for (const t of ['Organization', 'WebSite', 'FAQPage', 'ItemList']) if (!tipos.includes(t)) failures.push(`[seo] falta o dado estruturado ${t} (há: ${tipos.join(', ')})`);
  const faq = ld.filter(Boolean).flatMap((x) => x['@graph'] || [x]).find((x) => x['@type'] === 'FAQPage');
  const perguntasNaPagina = await page.evaluate(() => [...document.querySelectorAll('#duvidas summary')].map((s) => s.textContent.trim()));
  if (faq && perguntasNaPagina.length && faq.mainEntity.map((q) => q.name).join('|') !== perguntasNaPagina.join('|')) failures.push('[seo] as perguntas do FAQPage (ld+json) não batem com as da seção Dúvidas; regenere o bloco');
  const lista = ld.filter(Boolean).find((x) => x['@type'] === 'ItemList');
  const pecas = await page.evaluate(() => document.querySelectorAll('#lista-produtos .product[data-tipo="peca"]').length);
  if (lista && lista.itemListElement.length !== pecas) failures.push(`[seo] ItemList com ${lista.itemListElement.length} peças, mas o catálogo mostra ${pecas}`);
  if (lista && lista.itemListElement.some((i) => !i.item.offers || !/^\d+\.\d{2}$/.test(i.item.offers.lowPrice))) failures.push('[seo] há peça no ItemList sem oferta com preço (lowPrice)');
  // títulos em ordem: nenhum h3 direto depois do h1; nenhum salto de nível
  const saltos = await page.evaluate(() => { let nivel = 0; const out = []; for (const h of document.querySelectorAll('main h1, main h2, main h3, main h4')) { const n = +h.tagName[1]; if (n > nivel + 1) out.push(`${h.tagName} "${h.textContent.trim().slice(0, 30)}" depois de h${nivel}`); nivel = n; } return out; });
  if (saltos.length) failures.push(`[acessibilidade] salto na hierarquia de títulos: ${saltos.join('; ')}`);
  await page.close();
  // axe-core (WCAG 2.2 AA + boas práticas): nenhuma violação séria ou crítica nas páginas públicas
  const axePath = path.resolve(raiz, 'node_modules', 'axe-core', 'axe.min.js');
  if (!fs.existsSync(axePath)) failures.push('[acessibilidade] axe-core não instalado (npm install)');
  else for (const pg of ['index.html', ...PAGINAS, 'caneca-3d.html', '404.html']) {
    const pa = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await pa.route('**/rest/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await pa.goto('file://' + path.resolve(raiz, pg), { waitUntil: 'load' });
    await pa.waitForTimeout(500);
    await pa.addScriptTag({ path: axePath });
    const r = await pa.evaluate(async () => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] }));
    for (const v of r.violations) {
      const msg = `[acessibilidade] ${pg}: ${v.id} (${v.impact}) ${v.help} · ${v.nodes.slice(0, 2).map((n) => n.html.slice(0, 90)).join(' | ')}`;
      if (v.impact === 'serious' || v.impact === 'critical' || v.impact === 'moderate') failures.push(msg); else warnings.push(msg);
    }
    await pa.close();
  }
}

// ---- estúdio da caneca em 360°: funciona de ponta a ponta, servido por http (canvas e WebGL exigem origem) ----
{
  const { servir } = await import('./servidor.mjs');
  const servidor = await servir();
  const larguras = viewports.some(([w]) => w >= 1024) && viewports.some(([w]) => w < 600) ? [390, 1280] : [viewports[0]?.[0] || 390];
  for (const w of larguras) {
    const contexto = await browser.newContext({
      viewport: { width: w, height: w < 600 ? 844 : 800 },
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    const pe = await contexto.newPage();
    const erros = [];
    pe.on('pageerror', (e) => erros.push(e.message));
    pe.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
    pe.on('requestfailed', (r) => erros.push(`pedido falhou: ${r.url().slice(0, 80)}`));
    pe.on('response', (r) => r.status() >= 400 && r.url().startsWith(servidor.url) && erros.push(`${r.status()} em ${r.url().slice(servidor.url.length)}`));
    await pe.route('**/rest/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[{"whatsapp":"5511999999999"}]' }));
    await pe.goto(servidor.url + 'caneca-3d.html', { waitUntil: 'load' });
    const pronto = await pe.waitForFunction(() => document.getElementById('viewer-loading')?.hidden || !document.getElementById('viewer-fallback')?.hidden, null, { timeout: 15000 }).then(() => true).catch(() => false);
    if (!pronto) failures.push(`[estúdio ${w}] a prévia 3D não ficou pronta em 15 s`);
    const estado = await pe.evaluate(() => ({
      canvas: !!document.querySelector('#mug-viewport canvas.mug-3d-canvas'),
      fallback: !document.getElementById('viewer-fallback').hidden,
      rolagem: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      previa: !document.getElementById('save-preview').disabled,
      zap: document.getElementById('mug-order').href,
    }));
    if (estado.fallback || !estado.canvas) failures.push(`[estúdio ${w}] o 3D caiu no aviso de indisponível`);
    if (estado.rolagem) failures.push(`[estúdio ${w}] rolagem lateral na página`);
    if (!estado.previa) failures.push(`[estúdio ${w}] "Baixar prévia" continua desligado com o 3D pronto`);
    if (!/^https:\/\/wa\.me\/5511999999999\?text=/.test(estado.zap) || !new URL(estado.zap).searchParams.get('text').includes('Interior: Branco')) failures.push(`[estúdio ${w}] o pedido não leva as escolhas para o WhatsApp (${estado.zap.slice(0, 60)})`);
    // abre os blocos recolhidos: só assim dá para medir todos os campos da página
    await pe.evaluate(() => {
      for (const id of ['peca-cores', 'peca-cena', 'flat-details', 'bloco-canva']) {
        const bloco = document.getElementById(id);
        if (bloco) bloco.open = true;
      }
    });
    await pe.waitForTimeout(250);

    // a aba "Minha arte" é onde entra a arte pronta de quem não quer modelo
    await pe.click('#abas [data-aba="arte"]');
    await pe.waitForTimeout(250);
    // arte de exemplo entra, aparece na arte plana e o pedido menciona a arte
    await pe.click('#use-example');
    const comArte = await pe.waitForFunction(() => !document.getElementById('art-file-info').hidden, null, { timeout: 8000 }).then(() => true).catch(() => false);
    if (!comArte) failures.push(`[estúdio ${w}] a arte de exemplo não entrou`);
    await pe.waitForTimeout(400);
    const plana = await pe.evaluate(() => {
      const c = document.getElementById('flat-art'); const ctx = c.getContext('2d');
      const d = ctx.getImageData(0, 0, c.width, c.height).data; let pintados = 0;
      for (let i = 0; i < d.length; i += 16) if (d[i] < 235 || d[i + 1] < 235 || d[i + 2] < 235) pintados += 1;
      return { pintados, zap: new URL(document.getElementById('mug-order').href).searchParams.get('text') || '', erro: document.getElementById('art-error').hidden };
    });
    if (plana.pintados < 200) failures.push(`[estúdio ${w}] a arte plana ficou em branco depois de colocar a arte`);
    if (!plana.zap.includes('Arte:')) failures.push(`[estúdio ${w}] a mensagem do pedido não cita a arte`);
    if (!plana.erro) failures.push(`[estúdio ${w}] apareceu erro de arquivo com a arte de exemplo`);
    // nome, cores e vistas (as cores da peça ficam junto da peça, num bloco que abre)
    await pe.evaluate(() => { document.getElementById('peca-cores').open = true; });
    await pe.fill('#art-name', 'Malu');
    await pe.selectOption('#inside-color', 'rosa');
    await pe.click('[data-preset="preta"]');
    await pe.click('[data-view="back"]');
    await pe.waitForTimeout(700);
    const depois = await pe.evaluate(() => ({
      zap: new URL(document.getElementById('mug-order').href).searchParams.get('text') || '',
      pressed: document.querySelector('[data-view][aria-pressed="true"]')?.dataset.view,
      preset: document.querySelector('[data-preset][aria-pressed="true"]')?.dataset.preset,
      interior: document.getElementById('inside-color').value,
    }));
    if (!depois.zap.includes('"Malu"') || !depois.zap.includes('Interior: Preto')) failures.push(`[estúdio ${w}] o pedido não acompanha nome e cores escolhidos`);
    if (depois.pressed !== 'back') failures.push(`[estúdio ${w}] o botão de vista "Verso" não ficou marcado`);
    if (depois.preset !== 'preta' || depois.interior !== 'preta') failures.push(`[estúdio ${w}] a combinação "Preto e branco" não aplicou as duas cores`);
    // arquivo inválido é recusado com mensagem, sem erro de console
    await pe.setInputFiles('#art-file', { name: 'falso.png', mimeType: 'image/png', buffer: Buffer.from('<svg/>') });
    await pe.waitForTimeout(300);
    const recusa = await pe.evaluate(() => ({ visivel: !document.getElementById('art-error').hidden, texto: document.getElementById('art-error').textContent }));
    if (!recusa.visivel || !recusa.texto) failures.push(`[estúdio ${w}] arquivo inválido não gerou aviso`);
    // padrão visual dos campos: nenhum controle pode voltar à aparência crua do navegador
    const campos = await pe.evaluate(() => {
      const familias = ['Nunito', 'Fredoka'];
      const fora = [];
      const visivel = (el) => el.offsetParent !== null || el.getClientRects().length > 0;
      for (const campo of document.querySelectorAll('select, input[type="text"], input[type="search"], input[type="number"]')) {
        if (campo.classList.contains('studio-sr-only') || !visivel(campo)) continue;
        const estilo = getComputedStyle(campo);
        const raio = parseFloat(estilo.borderTopLeftRadius) || 0;
        const altura = campo.getBoundingClientRect().height;
        const borda = parseFloat(estilo.borderTopWidth) || 0;
        const daCasa = familias.some((f) => estilo.fontFamily.includes(f));
        if (raio < 8 || altura < 40 || borda < 1 || !daCasa) {
          fora.push({
            onde: campo.id || campo.name || campo.className || campo.tagName,
            raio: Math.round(raio), altura: Math.round(altura), borda, fonte: estilo.fontFamily.split(',')[0],
          });
        }
      }
      return fora;
    });
    if (campos.length) {
      failures.push(`[estúdio ${w}] campo(s) fora do padrão do site (canto arredondado, 40 px de altura, borda e fonte da marca): ${campos.map((c) => `${c.onde} raio ${c.raio}px altura ${c.altura}px fonte ${c.fonte}`).join(' · ')}`);
    }

    // painel em abas: escolher o modelo, e cada tipo de item no seu container
    await pe.click('#abas [data-aba="modelo"]');
    await pe.waitForTimeout(250);
    const filtros = await pe.evaluate(() => ({
      abas: [...document.querySelectorAll('#abas button')].map((b) => b.dataset.aba),
      grupos: [...document.querySelectorAll('#categoria-modelo optgroup')].map((g) => g.label),
      ocasioes: document.querySelectorAll('#categoria-modelo option').length,
      resultado: document.getElementById('resultado-modelos').textContent,
    }));
    if (filtros.abas.join(',') !== 'modelo,arte') failures.push(`[estúdio ${w}] sem modelo, as abas deviam ser Modelo e Minha arte (${filtros.abas.join(',')})`);
    if (filtros.grupos.length < 3 || filtros.ocasioes < 10) failures.push(`[estúdio ${w}] o seletor de ocasião não veio agrupado (${JSON.stringify(filtros)})`);
    if (!/\d+ modelos/.test(filtros.resultado)) failures.push(`[estúdio ${w}] a lista de modelos não diz quantos são ("${filtros.resultado}")`);

    await pe.selectOption('#categoria-modelo', 'natal');
    await pe.waitForTimeout(300);
    const soNatal = await pe.$$eval('#model-list .studio-model', (b) => b.map((x) => x.dataset.modelo));
    if (!soNatal.length || !soNatal.every((id) => id.startsWith('natal'))) failures.push(`[estúdio ${w}] a ocasião Natal mostrou ${soNatal.join(', ')}`);
    await pe.selectOption('#categoria-modelo', 'todos');
    await pe.fill('#busca-modelo', 'padrinho');
    await pe.waitForTimeout(300);
    // A busca precisa filtrar de verdade: trazer só o que fala de padrinho, e não o catálogo inteiro.
    const busca = await pe.evaluate(() => ({
      achados: [...document.querySelectorAll('#model-list .studio-model')].map((b) => b.dataset.modelo).filter(Boolean),
      textos: [...document.querySelectorAll('#model-list .studio-model')].map((b) => b.textContent.toLowerCase()),
      total: document.querySelectorAll('#model-list .studio-model').length,
    }));
    if (!busca.achados.length) failures.push(`[estúdio ${w}] a busca por "padrinho" não trouxe nada`);
    if (busca.achados.length > 12) failures.push(`[estúdio ${w}] a busca por "padrinho" trouxe ${busca.achados.length} modelos: não está filtrando`);
    const foraDoAssunto = busca.textos.filter((t) => !t.includes('padrinho'));
    if (foraDoAssunto.length) failures.push(`[estúdio ${w}] a busca por "padrinho" trouxe ${foraDoAssunto.length} modelo(s) que não falam de padrinho`);
    await pe.fill('#busca-modelo', '');
    await pe.waitForTimeout(250);

    // Coleções de arte: as ilustrações precisam chegar como camadas de verdade, com nome próprio,
    // cor da paleta e tamanho maior que o de um enfeite. Se virarem desenho fixo, a promessa some.
    const { TEMPLATES: catalogoDasColecoes } = await import('../simulador/modelos.js');
    for (const { nome, categoria, modelo } of [
      { nome: 'Ciclismo', categoria: 'ciclismo', modelo: 'esp-cic-01' },
      { nome: 'Cachorros', categoria: 'pet-cachorro', modelo: 'pet-cao-melhor-amigo' },
      { nome: 'Casa nova', categoria: 'casa-nova', modelo: 'atelie-primeiras-chaves' },
      { nome: 'Profissões e vocações', categoria: 'profissoes', modelo: 'atelie-projetar' },
      { nome: 'Leitura e livros', categoria: 'hobby-leitura', modelo: 'prazeres-leitura-capitulo' },
      { nome: 'Música', categoria: 'hobby-musica', modelo: 'prazeres-musica-lado-a' },
    ]) {
      await pe.evaluate(() => document.querySelector('#abas [data-aba="modelo"]').click());
      await pe.selectOption('#categoria-modelo', categoria);
      await pe.waitForTimeout(300);
      await pe.evaluate(() => { const b = document.getElementById('model-more'); if (b && !b.hidden && b.textContent.startsWith('Ver mais')) b.click(); });
      const daCategoria = await pe.$$eval('#model-list .studio-model', (b) => b.map((x) => x.dataset.modelo).filter(Boolean));
      const esperados = catalogoDasColecoes.filter(m => m.categoria === categoria).map(m => m.id).sort();
      if (JSON.stringify([...daCategoria].sort()) !== JSON.stringify(esperados)) {
        failures.push(`[estúdio ${w}] o assunto ${nome} mostrou ${daCategoria.join(', ') || 'nada'}`);
      }
      await pe.click(`[data-modelo="${modelo}"]`);
      await pe.waitForTimeout(500);
      await pe.evaluate(() => document.querySelector('#abas [data-aba="enfeites"]').click());
      await pe.waitForTimeout(250);
      const camadas = await pe.evaluate(() => {
        const itens = [...document.querySelectorAll('#lista-enfeites .studio-item')];
        return {
          quantos: itens.length,
          semNome: itens.filter((i) => !(i.querySelector('.studio-item__texto span')?.textContent || '').trim()).length,
        };
      });
      if (camadas.quantos < 2) failures.push(`[estúdio ${w}] ${modelo} trouxe só ${camadas.quantos} ilustração(ões) editável(is)`);
      if (camadas.semNome) failures.push(`[estúdio ${w}] ${camadas.semNome} ilustrações de ${modelo} ficaram sem nome no painel`);
      // abrir a primeira ilustração e trocar a cor: a arte tem de mudar de verdade
      // Trocar a cor precisa pintar o CORPO do desenho, não um detalhe. A checagem antiga comparava
      // uma assinatura amostrada e passava mesmo quando só 2% da ilustração respondia: foi assim
      // que 37 desenhos ficaram com a recoloração morta sem ninguém ver. Agora conta pixel.
      const trocaDeCor = await pe.evaluate(async () => {
        const flat = document.getElementById('flat-art');
        const ctx = flat.getContext('2d');
        const quadro = () => ctx.getImageData(0, 0, flat.width, flat.height).data;
        document.querySelector('#lista-enfeites .studio-item__cabeca').click();
        await new Promise((r) => setTimeout(r, 350));
        const corpo = document.querySelector('#lista-enfeites [data-corpo]');
        const antes = quadro();
        const botoes = [...corpo.querySelectorAll('.studio-cores button')];
        botoes.find((b) => b.getAttribute('aria-pressed') !== 'true')?.click();
        await new Promise((r) => setTimeout(r, 450));
        const depois = quadro();
        let mudaram = 0;
        for (let i = 0; i < antes.length; i += 4) {
          if (antes[i] !== depois[i] || antes[i + 1] !== depois[i + 1] || antes[i + 2] !== depois[i + 2]) mudaram++;
        }
        const faixa = corpo.querySelector('input[type="range"]');
        return { mudaram, total: antes.length / 4, cores: botoes.length, maximo: faixa ? Number(faixa.max) : 0 };
      });
      const fatia = trocaDeCor.mudaram / trocaDeCor.total;
      if (fatia < 0.005) {
        failures.push(`[estúdio ${w}] trocar a cor da ilustração de ${modelo} mexeu em ${(fatia * 100).toFixed(2)}% da arte: o corpo do desenho não obedece`);
      }
      if (trocaDeCor.cores < 6) failures.push(`[estúdio ${w}] a ilustração de ${modelo} ficou sem a paleta para escolher (${trocaDeCor.cores} cores)`);
      if (trocaDeCor.maximo < 1) failures.push(`[estúdio ${w}] a ilustração de ${modelo} não pode crescer além de um enfeite (máximo ${trocaDeCor.maximo})`);
    }

    /*
      Três armadilhas de rolagem que o cliente sentiu antes da gente:

      1. Com a lista inteira aberta a página passava de 13.000 px. Ao escolher um modelo a lista
         sumia, a página encolhia de uma vez e o navegador grampeava a rolagem no novo fim: a
         pessoa clicava num modelo e ia parar no rodapé, sem ver a caneca nem o próximo passo.
      2. Na largura de celular a prévia não acompanhava a edição, e a caneca ficava acima da tela.
      3. A roda do mouse sobre a prévia dava zoom e engolia a rolagem da página.
    */
    await pe.evaluate(() => document.querySelector('#abas [data-aba="modelo"]').click());
    await pe.selectOption('#categoria-modelo', 'todos');
    await pe.waitForTimeout(300);
    const rolagem = await pe.evaluate(async () => {
      const botaoMais = document.getElementById('model-more');
      let n = 0;
      while (botaoMais && !botaoMais.hidden && botaoMais.textContent.startsWith('Ver mais') && n < 20) {
        botaoMais.click(); n += 1; await new Promise((r) => setTimeout(r, 120));
      }
      const alturaComTudo = document.documentElement.scrollHeight;
      const cartoes = [...document.querySelectorAll('#model-list .studio-model')].filter((c) => c.dataset.modelo);
      const lista = document.getElementById('model-list');
      lista.scrollTop = lista.scrollHeight;
      window.scrollTo({ top: document.documentElement.scrollHeight * 0.55, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 250));
      const antes = { y: Math.round(window.scrollY), max: document.documentElement.scrollHeight - window.innerHeight };
      const alvo = cartoes.find((c) => { const r = c.getBoundingClientRect(); return r.top > 40 && r.bottom < window.innerHeight; }) || cartoes[cartoes.length - 1];
      alvo.click();
      await new Promise((r) => setTimeout(r, 1400));
      const peca = document.querySelector('.studio-preview').getBoundingClientRect();
      const abas = document.getElementById('abas').getBoundingClientRect();
      return {
        alturaComTudo,
        antes,
        depoisMax: document.documentElement.scrollHeight - window.innerHeight,
        pecaVisivel: peca.bottom > 0 && peca.top < window.innerHeight,
        // O próximo passo é o que diz se a pessoa ficou no lugar certo. O rodapé à vista não serve
        // de sinal: numa página curta ele aparece sem que ninguém tenha sido jogado para lá.
        proximoPassoVisivel: abas.top >= -4 && abas.top < window.innerHeight,
      };
    });
    if (rolagem.alturaComTudo > 6000) {
      failures.push(`[estúdio ${w}] a lista inteira deixa a página com ${rolagem.alturaComTudo} px: ao escolher um modelo a rolagem salta`);
    }
    if (!rolagem.pecaVisivel) {
      failures.push(`[estúdio ${w}] depois de escolher um modelo a caneca ficou fora da tela`);
    }
    if (!rolagem.proximoPassoVisivel) {
      failures.push(`[estúdio ${w}] depois de escolher um modelo o próximo passo (as abas) ficou fora da tela`);
    }

    // A roda sozinha tem de rolar a página; só Ctrl/⌘ dá zoom.
    const roda = await pe.evaluate(async () => {
      const canvas = document.querySelector('canvas.mug-3d-canvas');
      if (!canvas) return null;
      const r = canvas.getBoundingClientRect();
      const manda = (ctrl) => {
        const ev = new WheelEvent('wheel', { deltaY: -120, ctrlKey: ctrl, bubbles: true, cancelable: true,
          clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 });
        canvas.dispatchEvent(ev);
        return ev.defaultPrevented;
      };
      const sozinha = manda(false);
      await new Promise((res) => setTimeout(res, 120));
      const comCtrl = manda(true);
      return { sozinha, comCtrl };
    });
    if (roda && roda.sozinha) failures.push(`[estúdio ${w}] a roda do mouse sobre a caneca ainda engole a rolagem da página`);
    if (roda && !roda.comCtrl) failures.push(`[estúdio ${w}] Ctrl + roda deixou de dar zoom na caneca`);

    await pe.evaluate(() => document.querySelector('#abas [data-aba="modelo"]').click());
    await pe.selectOption('#categoria-modelo', 'todos');
    await pe.waitForTimeout(300);
    await pe.evaluate(() => { const b = document.getElementById('model-more'); if (b && !b.hidden && b.textContent.startsWith('Ver mais')) b.click(); });
    await pe.waitForSelector('[data-modelo="namorados-coracoes"]', { state: 'visible' });
    await pe.click('[data-modelo="namorados-coracoes"]');
    await pe.waitForTimeout(500);
    const comModelo = await pe.evaluate(() => ({
      abas: [...document.querySelectorAll('#abas button')].map((b) => b.dataset.aba),
      ativa: document.querySelector('#abas [aria-selected="true"]')?.dataset.aba,
      contas: [...document.querySelectorAll('#abas .studio-aba__conta')].map((s) => s.textContent),
      fotos: document.querySelectorAll('#lista-fotos .studio-item').length,
      frases: document.querySelectorAll('#lista-frases .studio-item').length,
      enfeites: document.querySelectorAll('#lista-enfeites .studio-item').length,
      painelFotos: !document.getElementById('painel-fotos').hidden,
      painelFrases: !document.getElementById('painel-frases').hidden,
      aviso: document.getElementById('art-warnings').textContent,
    }));
    if (comModelo.abas.join(',') !== 'modelo,fotos,frases,enfeites') failures.push(`[estúdio ${w}] com modelo, faltam abas (${comModelo.abas.join(',')})`);
    if (comModelo.ativa !== 'fotos') failures.push(`[estúdio ${w}] escolher o modelo não levou para a aba das fotos (${comModelo.ativa})`);
    if (comModelo.fotos !== 2 || comModelo.frases !== 2 || comModelo.enfeites !== 1) failures.push(`[estúdio ${w}] os itens não foram separados por tipo (${JSON.stringify(comModelo)})`);
    if (comModelo.contas.join(',') !== '2,2,1') failures.push(`[estúdio ${w}] as abas não mostram quantos itens têm (${comModelo.contas.join(',')})`);
    if (!comModelo.painelFotos || comModelo.painelFrases) failures.push(`[estúdio ${w}] mais de um container aberto ao mesmo tempo`);
    if (!/falta escolher/.test(comModelo.aviso)) failures.push(`[estúdio ${w}] o modelo com espaços vazios não avisou ("${comModelo.aviso}")`);

    // uma foto em cada espaço, pelo cartão (a mesma janela de arquivo que a pessoa usa)
    const fotoDeTeste = path.resolve(here, '..', 'assets', 'uso-caneca-cafe.webp');
    pe.on('filechooser', async (fc) => { await fc.setFiles(fotoDeTeste); });
    const vaziosAgora = () => pe.$$eval('#lista-fotos .studio-item__cabeca small', (ss) => ss.filter((s) => s.textContent.startsWith('Toque para escolher')).length);
    for (let i = 0; i < 2; i += 1) {
      await pe.evaluate(() => {
        const alvo = [...document.querySelectorAll('#lista-fotos .studio-item__cabeca')]
          .find((b) => b.querySelector('small')?.textContent.startsWith('Toque para escolher'));
        alvo?.click();
      });
      // espera a foto chegar antes do próximo espaço: a janela de arquivo demora o que demorar
      await pe.waitForFunction((restam) => [...document.querySelectorAll('#lista-fotos .studio-item__cabeca small')]
        .filter((s) => s.textContent.startsWith('Toque para escolher')).length === restam, 1 - i, { timeout: 12000 })
        .catch(() => {});
      await pe.waitForTimeout(250);
    }
    if (await vaziosAgora()) failures.push(`[estúdio ${w}] as duas fotos não entraram pelos cartões`);
    await pe.evaluate(() => document.querySelector('#abas [data-aba="frases"]').click());
    await pe.evaluate(() => document.querySelector('#lista-frases .studio-item__cabeca').click());
    await pe.waitForTimeout(300);
    await pe.fill('[data-corpo] input[type="text"]', 'a gente combina mesmo');
    await pe.waitForTimeout(500);
    const preenchido = await pe.evaluate(() => {
      const c = document.getElementById('flat-art');
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let pintados = 0;
      for (let i = 0; i < d.length; i += 16) if (d[i] < 235 || d[i + 1] < 235 || d[i + 2] < 235) pintados += 1;
      return {
        pintados,
        vazias: [...document.querySelectorAll('#lista-fotos .studio-item__cabeca small')].filter((s) => s.textContent.startsWith('Toque para escolher')).length,
        aviso: document.getElementById('art-warnings').textContent,
        zap: new URL(document.getElementById('mug-order').href).searchParams.get('text') || '',
      };
    });
    if (preenchido.pintados < 2000) failures.push(`[estúdio ${w}] a arte do modelo não apareceu na vista aberta`);
    if (preenchido.vazias) failures.push(`[estúdio ${w}] ficaram ${preenchido.vazias} espaços sem foto depois de escolher as duas`);
    if (/falta escolher/.test(preenchido.aviso)) failures.push(`[estúdio ${w}] o aviso de espaço vazio continuou depois de preencher tudo`);
    if (!preenchido.zap.includes('Corações ao redor') || !preenchido.zap.includes('Fotos escolhidas: 2 de 2') || !preenchido.zap.includes('a gente combina mesmo')) {
      failures.push(`[estúdio ${w}] o pedido não leva o modelo, as fotos e a frase escritos`);
    }

    const baixados = [];
    pe.on('download', (d) => baixados.push(d.suggestedFilename()));

    // o cadeado da prévia: travado (padrão) a caneca só gira; destravado, o item se move
    const cadeado = await pe.evaluate(async () => {
      const flat = document.getElementById('flat-art');
      const assinatura = () => {
        const d = flat.getContext('2d').getImageData(0, 0, flat.width, flat.height).data;
        let soma = 0;
        for (let i = 0; i < d.length; i += 997) soma += d[i];
        return soma;
      };
      const canvas = document.querySelector('canvas.mug-3d-canvas');
      const caixa = canvas.getBoundingClientRect();
      const cx = caixa.left + caixa.width / 2;
      const cy = caixa.top + caixa.height / 2;
      const evento = (tipo, x, y, ponteiro) => canvas.dispatchEvent(new PointerEvent(tipo, { clientX: x, clientY: y, bubbles: true, cancelable: true, pointerId: ponteiro, button: 0, buttons: 1 }));
      const arrasta = async (ponteiro) => {
        evento('pointerdown', cx, cy, ponteiro);
        await new Promise((r) => setTimeout(r, 120));
        evento('pointermove', cx, cy - 40, ponteiro);
        await new Promise((r) => setTimeout(r, 250));
        evento('pointerup', cx, cy - 40, ponteiro);
        await new Promise((r) => setTimeout(r, 350));
      };
      document.querySelector('#abas [data-aba="enfeites"]').click();
      await new Promise((r) => setTimeout(r, 250));
      const comeca = document.getElementById('travar').getAttribute('aria-pressed');
      const antesTravado = assinatura();
      await arrasta(11);
      const moveuTravado = assinatura() !== antesTravado;
      // um toque curto, mesmo travado, escolhe o item e abre a aba dele
      const abaAntes = document.querySelector('#abas [aria-selected="true"]').dataset.aba;
      evento('pointerdown', cx, cy, 12);
      await new Promise((r) => setTimeout(r, 80));
      evento('pointerup', cx + 2, cy + 1, 12);
      await new Promise((r) => setTimeout(r, 400));
      const abaDepois = document.querySelector('#abas [aria-selected="true"]').dataset.aba;
      // destravado, o mesmo arrasto move
      document.getElementById('travar').click();
      await new Promise((r) => setTimeout(r, 200));
      const antesLivre = assinatura();
      await arrasta(13);
      const moveuLivre = assinatura() !== antesLivre;
      const textoLivre = document.getElementById('travar-texto').textContent;
      document.getElementById('travar').click();
      await new Promise((r) => setTimeout(r, 200));
      return {
        comeca, moveuTravado, abaAntes, abaDepois, moveuLivre, textoLivre,
        textoTravado: document.getElementById('travar-texto').textContent,
        aberto: document.querySelectorAll('.studio-item--aberto').length,
      };
    });
    if (cadeado.comeca !== 'true') failures.push(`[estúdio ${w}] a arte devia começar travada`);
    if (cadeado.moveuTravado) failures.push(`[estúdio ${w}] com o cadeado fechado, arrastar na caneca mexeu na arte`);
    if (cadeado.abaDepois !== 'fotos') failures.push(`[estúdio ${w}] tocar na foto da caneca não abriu a aba Fotos (${cadeado.abaAntes} → ${cadeado.abaDepois})`);
    if (!cadeado.moveuLivre) failures.push(`[estúdio ${w}] com o cadeado aberto, arrastar não moveu o item`);
    if (cadeado.textoLivre !== 'Arte livre' || cadeado.textoTravado !== 'Arte travada') failures.push(`[estúdio ${w}] o cadeado não diz em que estado está (${cadeado.textoLivre} / ${cadeado.textoTravado})`);
    if (cadeado.aberto !== 1) failures.push(`[estúdio ${w}] devia haver um cartão aberto por vez (${cadeado.aberto})`);

    // acrescentar frase, enfeite e Pandinha (um só, como manda o manual)
    const acrescimos = await pe.evaluate(async () => {
      const conta = () => document.querySelectorAll('.studio-item').length;
      const inicio = conta();
      document.querySelector('#abas [data-aba="frases"]').click();
      document.getElementById('add-frase').click();
      await new Promise((r) => setTimeout(r, 300));
      const campo = document.querySelector('[data-corpo] input[type="text"]');
      campo.value = 'feito com carinho';
      campo.dispatchEvent(new Event('input'));
      document.querySelectorAll('[data-corpo] .studio-cor')[3].click();
      await new Promise((r) => setTimeout(r, 200));
      document.querySelector('#abas [data-aba="enfeites"]').click();
      const desenhos = document.querySelectorAll('#grade-enfeites .studio-forma').length;
      document.querySelectorAll('#grade-enfeites .studio-forma')[1].click();
      await new Promise((r) => setTimeout(r, 300));
      document.getElementById('add-pandinha').click();
      await new Promise((r) => setTimeout(r, 400));
      const comUm = conta();
      document.getElementById('add-pandinha').click();
      await new Promise((r) => setTimeout(r, 400));
      return { inicio, desenhos, comUm, depois: conta(), zap: new URL(document.getElementById('mug-order').href).searchParams.get('text') || '' };
    });
    if (acrescimos.depois !== acrescimos.inicio + 2) failures.push(`[estúdio ${w}] acrescentar frase e enfeite não deu certo (${JSON.stringify(acrescimos)})`);
    if (acrescimos.comUm !== acrescimos.depois) failures.push(`[estúdio ${w}] o segundo toque em "+ Pandinha" criou outro Pandinha (manual 6.4)`);
    if (acrescimos.desenhos < 6) failures.push(`[estúdio ${w}] a grade de enfeites mostrou só ${acrescimos.desenhos} desenhos`);
    if (!acrescimos.zap.includes('feito com carinho') || !acrescimos.zap.includes('Enfeites acrescentados')) {
      failures.push(`[estúdio ${w}] o pedido não acompanhou a frase e o enfeite novos`);
    }

    // biblioteca de letras: a lista aparece, a letra escolhida carrega do nosso endereço e muda a arte
    const letras = await pe.evaluate(async () => {
      const flat = document.getElementById('flat-art');
      const assinatura = () => {
        const d = flat.getContext('2d').getImageData(0, 0, flat.width, flat.height).data;
        let soma = 0;
        for (let i = 0; i < d.length; i += 997) soma += d[i];
        return soma;
      };
      document.querySelector('#abas [data-aba="frases"]').click();
      await new Promise((r) => setTimeout(r, 200));
      const cabeca = document.querySelector('#lista-frases .studio-item__cabeca');
      if (cabeca.getAttribute('aria-expanded') !== 'true') cabeca.click();
      await new Promise((r) => setTimeout(r, 1200));
      const total = document.querySelectorAll('.studio-letra').length;
      const antes = assinatura();
      document.querySelector('.studio-letra[data-fonte="Great Vibes"]')?.click();
      await new Promise((r) => setTimeout(r, 1200));
      return {
        total, mudou: assinatura() !== antes,
        carregada: document.fonts.check('400 16px "Great Vibes"'),
        sub: document.querySelector('#lista-frases .studio-item__cabeca small')?.textContent || '',
      };
    });
    if (letras.total < 12) failures.push(`[estúdio ${w}] a biblioteca de letras mostrou só ${letras.total} opções`);
    if (!letras.carregada) failures.push(`[estúdio ${w}] a letra escolhida não carregou do nosso próprio endereço`);
    if (!letras.mudou || !/Caligrafia/.test(letras.sub)) failures.push(`[estúdio ${w}] trocar a letra não mudou a arte ("${letras.sub}")`);

    // arte: curva da frase, elementos da marca, cor de fundo e centralizar
    const arteNova = await pe.evaluate(async () => {
      const flat = document.getElementById('flat-art');
      const assinatura = () => {
        const d = flat.getContext('2d').getImageData(0, 0, flat.width, flat.height).data;
        let soma = 0;
        for (let i = 0; i < d.length; i += 997) soma += d[i];
        return soma;
      };
      const espera = (ms) => new Promise((r) => setTimeout(r, ms));
      // curva da frase
      document.querySelector('#abas [data-aba="frases"]').click();
      await espera(200);
      const cabeca = document.querySelector('#lista-frases .studio-item__cabeca');
      if (cabeca.getAttribute('aria-expanded') !== 'true') cabeca.click();
      await espera(500);
      const curva = [...document.querySelectorAll('[data-corpo] input[type="range"]')]
        .find((r) => r.parentElement.textContent.includes('Curva'));
      const antesDaCurva = assinatura();
      if (curva) { curva.value = 70; curva.dispatchEvent(new Event('input')); }
      await espera(600);
      const curvou = assinatura() !== antesDaCurva;
      // centralizar no verso
      const antesDoLugar = assinatura();
      [...document.querySelectorAll('[data-corpo] button')].find((b) => b.textContent === 'Centralizar no verso')?.click();
      await espera(600);
      const centralizou = assinatura() !== antesDoLugar;
      // elemento do acervo
      document.querySelector('#abas [data-aba="enfeites"]').click();
      await espera(200);
      const elementos = document.querySelectorAll('#grade-elementos .studio-elemento').length;
      const antesDoElemento = document.querySelectorAll('.studio-item').length;
      document.querySelectorAll('#grade-elementos .studio-elemento')[0]?.click();
      await espera(900);
      const comElemento = document.querySelectorAll('.studio-item').length;
      // cor do fundo da arte
      document.querySelector('#abas [data-aba="modelo"]').click();
      await espera(200);
      const cores = document.querySelectorAll('#fundo-arte .studio-cor').length;
      const antesDoFundo = assinatura();
      document.querySelectorAll('#fundo-arte .studio-cor')[4]?.click();
      await espera(700);
      return {
        curvou, centralizou, elementos, acrescentou: comElemento - antesDoElemento, cores,
        trocouFundo: assinatura() !== antesDoFundo,
        temCurva: Boolean(curva),
      };
    });
    if (!arteNova.temCurva || !arteNova.curvou) failures.push(`[estúdio ${w}] a curva da frase não mudou a arte`);
    if (!arteNova.centralizou) failures.push(`[estúdio ${w}] "Centralizar no verso" não moveu a frase`);
    if (arteNova.elementos < 6 || arteNova.acrescentou !== 1) failures.push(`[estúdio ${w}] os elementos da marca não entraram (${JSON.stringify(arteNova)})`);
    if (arteNova.cores < 6 || !arteNova.trocouFundo) failures.push(`[estúdio ${w}] a cor de fundo da arte não mudou nada`);

    // filtro e recorte de fundo da foto
    const foto = await pe.evaluate(async () => {
      const flat = document.getElementById('flat-art');
      const assinatura = () => {
        const d = flat.getContext('2d').getImageData(0, 0, flat.width, flat.height).data;
        let soma = 0;
        for (let i = 0; i < d.length; i += 997) soma += d[i];
        return soma;
      };
      const espera = (ms) => new Promise((r) => setTimeout(r, ms));
      document.querySelector('#abas [data-aba="fotos"]').click();
      await espera(200);
      const cabeca = document.querySelector('#lista-fotos .studio-item__cabeca');
      if (cabeca.getAttribute('aria-expanded') !== 'true') cabeca.click();
      await espera(500);
      const antes = assinatura();
      const tratamento = [...document.querySelectorAll('[data-corpo] select')]
        .find((sel) => sel.parentElement.textContent.includes('Tratamento'));
      if (tratamento) { tratamento.value = 'pb'; tratamento.dispatchEvent(new Event('change')); }
      await espera(700);
      return {
        temTratamento: Boolean(tratamento),
        mudou: assinatura() !== antes,
        temRecorte: [...document.querySelectorAll('[data-corpo] button')].some((b) => b.textContent === 'Tirar o fundo claro'),
      };
    });
    if (!foto.temTratamento || !foto.mudou) failures.push(`[estúdio ${w}] o tratamento preto e branco não mudou a foto`);
    if (!foto.temRecorte) failures.push(`[estúdio ${w}] falta o botão de tirar o fundo claro da foto`);

    // cena e acabamento da prévia
    const cena = await pe.evaluate(async () => {
      document.getElementById('peca-cena').open = true;
      const cenas = document.querySelectorAll('#cenas button').length;
      const acabamentos = document.querySelectorAll('#acabamentos button').length;
      document.querySelector('#cenas [data-valor="madeira"]').click();
      await new Promise((r) => setTimeout(r, 700));
      const comCena = document.getElementById('cena-resumo').textContent;
      document.querySelector('#acabamentos [data-valor="fosco"]').click();
      await new Promise((r) => setTimeout(r, 500));
      const comFosco = document.getElementById('cena-resumo').textContent;
      document.querySelector('#cenas [data-valor="estudio"]').click();
      document.querySelector('#acabamentos [data-valor="brilhante"]').click();
      await new Promise((r) => setTimeout(r, 600));
      return { cenas, acabamentos, comCena, comFosco, video: !document.getElementById('save-video').hidden };
    });
    if (cena.cenas < 3 || cena.acabamentos !== 2) failures.push(`[estúdio ${w}] faltam cenas ou acabamentos (${JSON.stringify(cena)})`);
    if (!/Mesa de madeira/.test(cena.comCena) || !/fosco/.test(cena.comFosco)) failures.push(`[estúdio ${w}] a cena escolhida não aparece no resumo (${cena.comCena} / ${cena.comFosco})`);
    if (!cena.video) failures.push(`[estúdio ${w}] o botão do vídeo girando não apareceu`);

    // desfazer e refazer: o passo volta inteiro
    const historico = await pe.evaluate(async () => {
      const conta = () => document.querySelectorAll('.studio-item').length;
      document.querySelector('#abas [data-aba="frases"]').click();
      const inicio = conta();
      document.getElementById('add-frase').click();
      await new Promise((r) => setTimeout(r, 300));
      const comAFrase = conta();
      document.getElementById('desfazer').click();
      await new Promise((r) => setTimeout(r, 300));
      const desfeito = conta();
      document.getElementById('refazer').click();
      await new Promise((r) => setTimeout(r, 300));
      return { inicio, comAFrase, desfeito, refeito: conta() };
    });
    if (historico.comAFrase !== historico.inicio + 1 || historico.desfeito !== historico.inicio || historico.refeito !== historico.comAFrase) {
      failures.push(`[estúdio ${w}] desfazer e refazer não voltaram o passo (${JSON.stringify(historico)})`);
    }

    // alças da vista aberta: puxar um canto muda o tamanho da camada escolhida
    const alcas = await pe.evaluate(async () => {
      const flat = document.getElementById('flat-art');
      const assinatura = () => {
        const d = flat.getContext('2d').getImageData(0, 0, flat.width, flat.height).data;
        let soma = 0;
        for (let i = 0; i < d.length; i += 997) soma += d[i];
        return soma;
      };
      document.querySelector('#abas [data-aba="fotos"]').click();
      await new Promise((r) => setTimeout(r, 200));
      const cabecaDaFoto = document.querySelector('#lista-fotos .studio-item__cabeca');
      if (cabecaDaFoto.getAttribute('aria-expanded') !== 'true') cabecaDaFoto.click();
      await new Promise((r) => setTimeout(r, 300));
      const antes = assinatura();
      const caixa = flat.getBoundingClientRect();
      const x = caixa.left + 0.043 * caixa.width;
      const y = caixa.top + 0.09 * caixa.height;
      const evento = (tipo, px, py) => flat.dispatchEvent(new PointerEvent(tipo, { clientX: px, clientY: py, bubbles: true, cancelable: true, pointerId: 3, button: 0, buttons: 1 }));
      evento('pointerdown', x, y);
      await new Promise((r) => setTimeout(r, 100));
      evento('pointermove', x - 30, y - 14);
      await new Promise((r) => setTimeout(r, 250));
      evento('pointerup', x - 30, y - 14);
      await new Promise((r) => setTimeout(r, 350));
      return { mudou: assinatura() !== antes };
    });
    if (!alcas.mudou) failures.push(`[estúdio ${w}] puxar o canto na arte aberta não mudou o tamanho`);

    // salvar a arte como modelo meu, usar e apagar
    const meus = await pe.evaluate(async () => {
      document.getElementById('salvar-modelo').click();
      await new Promise((r) => setTimeout(r, 200));
      document.getElementById('nome-meu-modelo').value = 'Modelo de teste';
      document.getElementById('confirmar-meu-modelo').click();
      await new Promise((r) => setTimeout(r, 500));
      const ocasioes = [...document.querySelectorAll('#categoria-modelo option')].map((o) => o.value);
      document.querySelector('#abas [data-aba="modelo"]').click();
      const seletor = document.getElementById('categoria-modelo');
      seletor.value = 'meus';
      seletor.dispatchEvent(new Event('change'));
      await new Promise((r) => setTimeout(r, 400));
      const nomes = [...document.querySelectorAll('#model-list .studio-model__nome')].map((s) => s.textContent);
      const guardados = JSON.parse(localStorage.getItem('pm_caneca_meus_modelos') || '[]');
      document.querySelector('#abas [data-aba="fotos"]').click();
      document.getElementById('apagar-modelo').click();
      await new Promise((r) => setTimeout(r, 400));
      return {
        ocasioes, nomes,
        guardado: guardados.length === 1 && guardados[0].nome === 'Modelo de teste',
        temFoto: JSON.stringify(guardados).includes('data:image'),
        depoisDeApagar: JSON.parse(localStorage.getItem('pm_caneca_meus_modelos') || '[]').length,
      };
    });
    if (!meus.ocasioes.includes('meus') || !meus.nomes.includes('Modelo de teste')) {
      failures.push(`[estúdio ${w}] o modelo salvo não apareceu em Meus modelos (${JSON.stringify(meus)})`);
    }
    if (!meus.guardado) failures.push(`[estúdio ${w}] o modelo salvo não ficou guardado neste navegador`);
    if (meus.temFoto) failures.push(`[estúdio ${w}] o modelo salvo levou junto a foto da pessoa; ele deve guardar só a montagem`);
    if (meus.depoisDeApagar !== 0) failures.push(`[estúdio ${w}] apagar o modelo meu não o tirou da lista`);

    // apagar a foto volta a avisar do espaço vazio
    await pe.evaluate(async () => {
      document.querySelector('#abas [data-aba="fotos"]').click();
      await new Promise((r) => setTimeout(r, 200));
      // abre o cartão só se ele estiver fechado: tocar de novo na cabeça fecharia
      const cabeca = document.querySelector('#lista-fotos .studio-item__cabeca');
      if (cabeca.getAttribute('aria-expanded') !== 'true') cabeca.click();
      await new Promise((r) => setTimeout(r, 300));
      [...document.querySelectorAll('[data-corpo] button')].find((b) => b.textContent === 'Tirar a foto')?.click();
    });
    await pe.waitForTimeout(500);
    const removido = await pe.$eval('#art-warnings', (e) => e.textContent);
    if (!/falta escolher/.test(removido)) failures.push(`[estúdio ${w}] tirar uma foto não voltou a avisar do espaço vazio`);

    // levar a arte para o Canva: o clique no link baixa o PNG na medida da volta inteira
    await pe.click('#abas [data-aba="modelo"]');
    await pe.evaluate(() => { document.getElementById('bloco-canva').open = true; });
    // o teste não abre o Canva de verdade: tira o destino e fica só com o efeito do clique
    await pe.$eval('#abrir-canva', (a) => { a.removeAttribute('target'); a.setAttribute('href', '#'); });
    await pe.click('#abrir-canva');
    await pe.waitForTimeout(1500);
    if (!baixados.some((n) => /^arte-da-caneca-para-o-canva-2480x1063\.png$/.test(n))) {
      failures.push(`[estúdio ${w}] "Levar minha arte para o Canva" não baixou a arte na medida certa (${baixados.join(', ') || 'nada baixado'})`);
    }

    // vários nomes de uma vez: um arquivo com uma arte por nome
    await pe.evaluate(() => {
      document.querySelector('#abas [data-aba="frases"]').click();
      document.getElementById('lote').open = true;
      document.getElementById('lote-nomes').value = 'Malu\nTheo\nDona Cleide';
    });
    const lote = await pe.$eval('#lote', (e) => !e.hidden);
    if (!lote) failures.push(`[estúdio ${w}] o bloco de vários nomes não apareceu`);
    await pe.click('#lote-gerar');
    await pe.waitForFunction(() => /artes num arquivo|Escreva ao menos|Escolha qual/.test(document.getElementById('lote-status').textContent), null, { timeout: 30000 }).catch(() => {});
    const loteStatus = await pe.$eval('#lote-status', (e) => e.textContent);
    if (!/3 artes num arquivo/.test(loteStatus)) failures.push(`[estúdio ${w}] as artes em lote não saíram ("${loteStatus}")`);
    if (!baixados.some((n) => /^canecas-panda-mimo-3-nomes\.zip$/.test(n))) failures.push(`[estúdio ${w}] o arquivo com as artes de cada nome não foi baixado (${baixados.join(', ') || 'nada'})`);

    // prévia grande e link da montagem
    await pe.click('#save-4k');
    await pe.waitForTimeout(2500);
    if (!baixados.some((n) => /previa-4k/.test(n))) failures.push(`[estúdio ${w}] a prévia em 4K não foi baixada`);
    await pe.click('#copiar-link');
    await pe.waitForTimeout(800);
    const link = await pe.evaluate(() => navigator.clipboard.readText().catch(() => ''));
    if (!/#m=|#j=/.test(link)) failures.push(`[estúdio ${w}] o link da montagem não foi copiado (${link.slice(0, 40)})`);

    // trazer a arte pronta do Canva: volta para a aba Minha arte, ao redor, com a arte inteira
    await pe.setInputFiles('#canva-file', fotoDeTeste);
    await pe.waitForTimeout(900);
    const doCanva = await pe.evaluate(() => ({
      abas: [...document.querySelectorAll('#abas button')].map((b) => b.dataset.aba),
      ativa: document.querySelector('#abas [aria-selected="true"]')?.dataset.aba,
      layout: document.querySelector('input[name="layout"]:checked')?.value,
      status: document.getElementById('save-status').textContent,
      arquivo: document.getElementById('art-file-name').textContent,
    }));
    if (doCanva.abas.join(',') !== 'modelo,arte' || doCanva.ativa !== 'arte') failures.push(`[estúdio ${w}] a arte do Canva não abriu a aba Minha arte (${JSON.stringify(doCanva)})`);
    if (doCanva.layout !== 'wrap') failures.push(`[estúdio ${w}] a arte do Canva não foi aplicada ao redor da caneca`);
    if (!/Canva|proporção/i.test(doCanva.status)) failures.push(`[estúdio ${w}] a arte do Canva entrou sem dizer o que aconteceu ("${doCanva.status}")`);
    if (!doCanva.arquivo) failures.push(`[estúdio ${w}] a arte do Canva não aparece como arquivo escolhido`);


    // exportação da arte plana em 300 dpi, do gabarito e da prévia
    await pe.click('#save-print');
    await pe.click('#save-preview');
    // o gabarito mora no bloco do Canva, dentro da aba Modelo
    await pe.click('#abas [data-aba="modelo"]');
    await pe.evaluate(() => { document.getElementById('bloco-canva').open = true; });
    await pe.waitForTimeout(200);
    await pe.click('#save-guide');
    await pe.waitForFunction(() => /salva/.test(document.getElementById('save-status').textContent), null, { timeout: 10000 }).catch(() => {});
    await pe.waitForTimeout(800);
    if (!baixados.some((n) => /300dpi\.png$/.test(n))) failures.push(`[estúdio ${w}] "Baixar arte plana" não gerou o PNG em 300 dpi (${baixados.join(', ') || 'nada baixado'})`);
    if (!baixados.some((n) => /previa/.test(n))) failures.push(`[estúdio ${w}] "Baixar prévia" não gerou a imagem (${baixados.join(', ') || 'nada baixado'})`);
    if (!baixados.some((n) => /^gabarito-caneca-panda-mimo-2480x1063\.png$/.test(n))) failures.push(`[estúdio ${w}] o gabarito da arte não saiu em 2480 × 1063 px (${baixados.join(', ') || 'nada baixado'})`);
    // rascunho: recarrega e o trabalho volta igualzinho
    const antesDeRecarregar = await pe.evaluate(() => ({
      camadas: document.querySelectorAll('.studio-item').length,
      arquivo: document.getElementById('art-file-name').textContent,
    }));
    await pe.waitForTimeout(1600);
    await pe.reload({ waitUntil: 'load' });
    const apareceu = await pe.waitForFunction(() => !document.getElementById('rascunho').hidden, null, { timeout: 15000 }).then(() => true).catch(() => false);
    if (!apareceu) failures.push(`[estúdio ${w}] o rascunho guardado não foi oferecido depois de recarregar`);
    else {
      await pe.click('#rascunho-continuar');
      await pe.waitForFunction((alvo) => (alvo.camadas
        ? document.querySelectorAll('.studio-item').length === alvo.camadas
        : document.getElementById('art-file-name').textContent === alvo.arquivo), antesDeRecarregar, { timeout: 15000 }).catch(() => {});
      const voltou = await pe.evaluate(() => ({
        camadas: document.querySelectorAll('.studio-item').length,
        arquivo: document.getElementById('art-file-name').textContent,
      }));
      if (voltou.camadas !== antesDeRecarregar.camadas || voltou.arquivo !== antesDeRecarregar.arquivo) {
        failures.push(`[estúdio ${w}] o rascunho voltou diferente do que estava (${JSON.stringify(voltou)} em vez de ${JSON.stringify(antesDeRecarregar)})`);
      }
    }


    const medidaNaTela = await pe.$eval('#size-guide', (e) => e.textContent);
    if (!/21 × 9 cm \(2480 × 1063 px a 300 dpi\)/.test(medidaNaTela)) failures.push(`[estúdio ${w}] a página não diz o tamanho certo da arte ("${medidaNaTela}")`);
    const dir = path.join(here, 'shots', String(w));
    fs.mkdirSync(dir, { recursive: true });
    await pe.screenshot({ path: path.join(dir, 'estudio-caneca.png'), fullPage: true }).catch(() => {});
    // setPointerCapture só falha com ponteiro simulado (o OrbitControls o chama no pointerdown);
    // com dedo ou mouse de verdade o id existe e a captura funciona.
    erros.filter((e) => !/Failed to load resource|net::ERR_|PointerCapture/.test(e))
      .forEach((e) => failures.push(`[estúdio ${w}] erro: ${e}`));
    await pe.close();
    await contexto.close();
  }

  // Nada dizia em que passo a pessoa estava nem qual era o próximo: as abas eram a única navegação,
  // e quem não conhece o produto não sabia que tinha terminado. A barra de passo conduz, e o ponto
  // na aba mostra onde ainda falta fazer algo — inclusive nas frases, que nascem com texto de
  // exemplo e sairiam impressas assim ("chá do Theo") se ninguém avisasse.
  {
    const contexto = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const pp2 = await contexto.newPage();
    await pp2.goto(servidor.url + 'caneca-3d.html', { waitUntil: 'load' });
    await pp2.waitForTimeout(900);
    const passo = await pp2.evaluate(async () => {
      const leia = () => ({
        visivel: !document.getElementById('passo')?.hidden,
        conta: document.getElementById('passo-conta')?.textContent || '',
        falta: document.getElementById('passo-falta')?.textContent || '',
        botao: document.getElementById('passo-botao')?.textContent || '',
        pontos: [...document.querySelectorAll('#abas button')].filter((b) => b.dataset.passo === 'falta').map((b) => b.dataset.aba),
        aba: document.querySelector('#abas [aria-selected="true"]')?.dataset.aba,
      });
      const semModelo = leia();
      document.querySelector('[data-modelo="natal-flocos"]').click();
      await new Promise((r) => setTimeout(r, 1400));
      const comModelo = leia();
      document.getElementById('passo-botao').click();
      await new Promise((r) => setTimeout(r, 500));
      const adiante = leia();
      document.getElementById('passo-botao').click();
      await new Promise((r) => setTimeout(r, 500));
      const fim = leia();
      return { semModelo, comModelo, adiante, fim };
    });
    if (passo.semModelo.visivel) failures.push('[passo] a barra apareceu antes de escolher um modelo');
    if (!passo.comModelo.visivel) failures.push('[passo] a barra não apareceu depois de escolher um modelo');
    if (!/Passo \d+ de \d+/.test(passo.comModelo.conta)) failures.push(`[passo] a barra não diz em que passo a pessoa está ("${passo.comModelo.conta}")`);
    if (!passo.comModelo.pontos.includes('fotos')) failures.push('[passo] a aba das fotos não marcou que ainda falta escolher foto');
    if (!passo.comModelo.pontos.includes('frases')) failures.push('[passo] a aba das frases não marcou que o texto ainda é o de exemplo');
    if (!/^Faltam? /.test(passo.comModelo.falta)) failures.push(`[passo] a barra não diz o que falta ("${passo.comModelo.falta}")`);
    if (passo.adiante.aba === passo.comModelo.aba) failures.push('[passo] o botão de continuar não avançou de aba');
    if (!/^Continuar para /.test(passo.comModelo.botao)) failures.push(`[passo] o botão não convida para o próximo passo ("${passo.comModelo.botao}")`);
    if (/^Continuar para /.test(passo.fim.botao)) failures.push('[passo] no último passo o botão ainda manda continuar em vez de fechar');
    await contexto.close();
  }

  // Cores da peça, cena e acabamento, e a vista da arte aberta nasceram DENTRO do cartão da prévia.
  // Ao fazer a caneca grudar no topo, eles viraram irmãos do cartão e passaram a correr por trás dela
  // ao rolar, ficando inalcançáveis sem nada indicar que sumiram. O dono percebeu antes da gente.
  //
  // A checagem rola como gente rola, sem deslocamento calculado — uma primeira versão descontava a
  // altura da caneca grudada e, por isso, passava mesmo com o defeito de volta. Na tela larga a
  // coluna inteira gruda, então os blocos têm de continuar à mão enquanto se usa o editor. No
  // celular eles ficam depois do editor, e têm de estar à mão no fim da página.
  for (const [nome, w2, h2] of [['1280', 1280, 900], ['390', 390, 844]]) {
    const contexto = await browser.newContext({ viewport: { width: w2, height: h2 } });
    const pa = await contexto.newPage();
    await pa.goto(servidor.url + 'caneca-3d.html', { waitUntil: 'load' });
    await pa.waitForTimeout(900);
    const alcance = await pa.evaluate(async (larga) => {
      const ids = ['peca-cores', 'peca-cena', 'flat-details'];
      const faltando = ids.filter((id) => !document.getElementById(id));
      const daParaUsar = (id) => {
        const alvo = document.getElementById(id);
        const resumo = alvo.querySelector('summary') || alvo;
        const rr = resumo.getBoundingClientRect();
        if (!(rr.top >= 0 && rr.bottom <= window.innerHeight)) return { ok: false, motivo: 'fora da tela' };
        const noPonto = document.elementFromPoint(Math.round(rr.left + rr.width / 2), Math.round(rr.top + rr.height / 2));
        if (noPonto && alvo.contains(noPonto)) return { ok: true };
        return { ok: false, motivo: 'coberto por ' + (noPonto ? (noPonto.className || noPonto.tagName).toString().slice(0, 30) : 'nada') };
      };
      const presentes = ids.filter((id) => document.getElementById(id));
      let estado;
      if (larga) {
        // Na tela larga a coluna inteira gruda: os blocos têm de estar à mão ENQUANTO se usa o editor.
        const editor = document.querySelector('.studio-controls');
        window.scrollTo({ top: window.scrollY + editor.getBoundingClientRect().top + editor.offsetHeight / 2 - window.innerHeight / 2, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 300));
        estado = presentes.map((id) => ({ id, ...daParaUsar(id) }));
      } else {
        // No celular eles ficam depois do editor: a pessoa rola até eles saírem de trás da caneca.
        const conseguiu = new Map(presentes.map((id) => [id, { ok: false, motivo: 'nunca ficou à mão' }]));
        const passo = Math.round(window.innerHeight / 3);
        for (let y = 0; y <= document.documentElement.scrollHeight; y += passo) {
          window.scrollTo({ top: y, behavior: 'instant' });
          await new Promise((r) => setTimeout(r, 90));
          for (const id of presentes) if (!conseguiu.get(id).ok) { const r = daParaUsar(id); if (r.ok) conseguiu.set(id, r); }
        }
        estado = presentes.map((id) => ({ id, ...conseguiu.get(id) }));
      }
      return { faltando, estado };
    }, w2 > 850);
    for (const id of alcance.faltando) failures.push(`[peça ${nome}] o bloco ${id} sumiu da página`);
    for (const a of alcance.estado) {
      if (!a.ok) failures.push(`[peça ${nome}] não dá para usar ${a.id}: ${a.motivo}`);
    }
    await contexto.close();
  }

  // Cada miniatura do catálogo custa cerca de 5,5 ms e 300 KB de canvas. Desenhar as 138 de uma vez
  // seriam 0,8 s de tela parada e 40 MB de memória, e num celular médio bem mais. Elas nascem quando
  // o cartão chega perto da área visível da lista — o que não pode virar cartão em branco.
  {
    const contexto = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const pm = await contexto.newPage();
    await pm.goto(servidor.url + 'caneca-3d.html', { waitUntil: 'load' });
    await pm.waitForTimeout(900);
    const mini = await pm.evaluate(async () => {
      const lista = document.getElementById('model-list');
      const b = document.getElementById('model-more');
      let n = 0;
      while (b && !b.hidden && b.textContent.startsWith('Ver mais') && n < 20) { b.click(); n += 1; await new Promise((r) => setTimeout(r, 150)); }
      await new Promise((r) => setTimeout(r, 400));
      const cartoes = document.querySelectorAll('#model-list .studio-model').length;
      const desenhadasDeInicio = document.querySelectorAll('#model-list canvas').length;
      // as que estão à vista precisam ter tinta de verdade, não moldura vazia
      // O cartão "Trazer a minha arte" não tem miniatura por desenho: ele mostra um ícone.
      const aVista = [...document.querySelectorAll('#model-list .studio-model__art:not(.studio-model__art--livre)')].filter((f) => {
        const r = f.getBoundingClientRect(), c = lista.getBoundingClientRect();
        return r.bottom > c.top && r.top < c.bottom;
      });
      const pintadas = aVista.filter((f) => {
        const cv = f.querySelector('canvas');
        if (!cv) return false;
        const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
        for (let i = 0; i < d.length; i += 400) if (d[i + 3] > 10 && (d[i] < 235 || d[i + 1] < 235 || d[i + 2] < 235)) return true;
        return false;
      }).length;
      // rolar precisa trazer as próximas
      lista.scrollTop = lista.scrollHeight / 2;
      lista.dispatchEvent(new Event('scroll'));
      await new Promise((r) => setTimeout(r, 400));
      return { cartoes, desenhadasDeInicio, aVista: aVista.length, pintadas, depoisDeRolar: document.querySelectorAll('#model-list canvas').length };
    });
    if (mini.aVista && mini.pintadas < mini.aVista) {
      failures.push(`[catálogo] ${mini.aVista - mini.pintadas} de ${mini.aVista} cartões à vista ficaram sem a arte desenhada`);
    }
    if (mini.desenhadasDeInicio >= mini.cartoes) {
      failures.push(`[catálogo] desenhou ${mini.desenhadasDeInicio} miniaturas de ${mini.cartoes} cartões de uma vez: volta a travar a tela`);
    }
    if (mini.depoisDeRolar <= mini.desenhadasDeInicio) {
      failures.push('[catálogo] rolar a lista não desenhou nenhuma miniatura nova');
    }
    await contexto.close();
  }

  // No celular dá para fotografar o bolo ou o pet na hora, em vez de garimpar a galeria. O atalho só
  // existe onde há câmera de verdade: no computador o atributo `capture` é ignorado pelo navegador e
  // o botão só confundiria. De quebra é o caminho que resolve o HEIC do iPhone sem precisar lê-lo,
  // porque a câmera do navegador entrega JPEG.
  for (const [nome, toque, deveTer] of [['celular', true, true], ['computador', false, false]]) {
    const contexto = await browser.newContext({
      viewport: toque ? { width: 390, height: 844 } : { width: 1280, height: 900 },
      hasTouch: toque, isMobile: toque,
    });
    const pc = await contexto.newPage();
    await pc.goto(servidor.url + 'caneca-3d.html', { waitUntil: 'load' });
    await pc.waitForTimeout(900);
    const achado = await pc.evaluate(async () => {
      document.querySelector('[data-modelo="natal-flocos"]')?.click();
      await new Promise((r) => setTimeout(r, 900));
      document.querySelector('#lista-fotos .studio-item__cabeca')?.click();
      await new Promise((r) => setTimeout(r, 400));
      const corpo = document.querySelector('#lista-fotos [data-corpo]');
      const nomes = corpo ? [...corpo.querySelectorAll('button')].map((b) => b.textContent.trim()) : [];
      return { camera: nomes.includes('Usar a câmera'), escolher: nomes.includes('Escolher foto'), nomes: nomes.slice(0, 4) };
    });
    if (!achado.escolher) failures.push(`[fotos ${nome}] sumiu o botão de escolher foto (${achado.nomes.join(', ')})`);
    if (achado.camera !== deveTer) {
      failures.push(deveTer
        ? `[fotos ${nome}] falta o atalho "Usar a câmera" onde existe câmera`
        : `[fotos ${nome}] o atalho "Usar a câmera" apareceu onde não há câmera`);
    }
    await contexto.close();
  }

  // A página de provas das coleções é a que a gente olha antes de publicar arte nova. Se ela quebrar
  // calada, a revisão humana passa a ser feita no escuro.
  {
    const contexto = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const pp = await contexto.newPage();
    const erros = [];
    pp.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
    pp.on('pageerror', (e) => erros.push(e.message));
    await pp.goto(servidor.url + 'qa/provas-colecoes.html', { waitUntil: 'load' });
    await pp.waitForTimeout(900);
    const provas = await pp.evaluate(() => {
      const pintados = [...document.querySelectorAll('#modelos canvas')].filter((c) => {
        const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        // canvas em branco vem transparente (alfa 0), e transparente não é tinta: sem o alfa,
        // uma arte que não foi desenhada passaria por "escura" e o defeito passaria batido.
        for (let i = 0; i < d.length; i += 400) {
          if (d[i + 3] > 10 && (d[i] < 235 || d[i + 1] < 235 || d[i + 2] < 235)) return true;
        }
        return false;
      }).length;
      return {
        artes: document.querySelectorAll('#modelos article').length,
        pintados,
        colecoes: document.querySelectorAll('#grupo option').length - 1,
        conta: document.getElementById('conta').textContent,
      };
    });
    const { TEMPLATES } = await import('../simulador/modelos.js');
    if (provas.artes !== TEMPLATES.length) {
      failures.push(`[provas] a página mostra ${provas.artes} artes, e o catálogo tem ${TEMPLATES.length}`);
    }
    if (provas.pintados !== provas.artes) failures.push(`[provas] ${provas.artes - provas.pintados} arte(s) saíram em branco na página de provas`);
    if (provas.colecoes < 2) failures.push(`[provas] a página de provas não separou as coleções (${provas.colecoes})`);
    erros.filter((e) => !/Failed to load resource|net::ERR_/.test(e))
      .forEach((e) => failures.push(`[provas] erro: ${e}`));
    await pp.close();
    await contexto.close();
  }
  await servidor.close();
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
