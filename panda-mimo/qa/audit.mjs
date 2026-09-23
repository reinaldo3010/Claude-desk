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
/**
 * Escolhe uma ocasião no seletor do estúdio como uma pessoa faria: abre o painel e toca na pílula.
 * O seletor deixou de ser um <select> nativo em 23/09/2026 (a lista do navegador era grande e sem ordem).
 */
async function escolheAssunto(pagina, id) {
  await pagina.evaluate((id) => {
    const botao = document.getElementById('categoria-modelo');
    if (botao.getAttribute('aria-expanded') !== 'true') botao.click();
    document.querySelector(`#painel-assuntos [data-assunto="${id}"]`).click();
  }, id);
  await pagina.waitForTimeout(300);
}

const TODAS = [[320, 568], [360, 800], [375, 667], [375, 812], [390, 844], [393, 852], [414, 896], [768, 1024], [820, 1180], [1024, 768], [1280, 720], [1366, 768], [1440, 900], [1920, 1080]];
// QA_VIEWPORTS=390,1280 roda só essas larguras (útil para uma checagem rápida)
const filtro = (process.env.QA_VIEWPORTS || '').split(',').filter(Boolean).map(Number);
const viewports = filtro.length ? TODAS.filter(([w]) => filtro.includes(w)) : TODAS;
/*
  QA_SO=cardapio,minha-arte roda só esses blocos; o nome de cada um está no `roda('...')` que o abre.
  Um bloco leva de segundos a um ou dois minutos, e o guardião inteiro, uns 25: é por aqui que a prova
  de defeito e a conferência do dia a dia andam depressa (23/09/2026, pedido do dono, depois de uma
  tarde de esperas de 5 minutos para ver uma checagem só reprovar). Antes de publicar, roda tudo.
*/
const SO = new Set((process.env.QA_SO || '').split(',').map((b) => b.trim()).filter(Boolean));
const roda = (bloco) => !SO.size || SO.has(bloco);
const shotWidths = new Set([320, 390, 768, 1280, 1920]);
const failures = []; const warnings = []; const links = new Map(); let quadrosConferidos = false;
const fail = (w, msg) => failures.push(`[${w}px] ${msg}`);
/*
  Quando uma checagem quebra no meio — um clique esperando 30 s por um botão que um defeito escondeu —, o
  processo morria sem relatório, e com ele sumiam as reprovações já encontradas. A prova de defeito de
  23/09/2026 caiu nisso duas vezes: saída 1 e nenhuma linha dizendo o quê. Agora sai o que já reprovou e
  onde parou.
*/
const relataQuebra = (erro) => {
  console.error(`\n✗ o guardião parou no meio: ${String(erro?.message || erro).split('\n')[0]}`);
  if (failures.length) console.error(`\n✗ ${failures.length} problema(s) antes da parada:\n` + failures.map((f) => '  - ' + f).join('\n'));
  process.exit(1);
};
process.on('uncaughtException', relataQuebra);
process.on('unhandledRejection', relataQuebra);

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

if (roda('site')) for (const [w, h] of viewports) {
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
    const groups = ['.products', '.steps', '.occasions', '.promises', '.care', '.faq__list', '.gallery', '.trust__in', '.hero__actions', '.contact__actions', '.follow__links', '.footer__nav', '.topbar__in'];
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
  await page.focus('#busca-pecas'); await page.waitForTimeout(100);
  if (!(await page.$eval('.fab', (f) => f.classList.contains('is-hidden')))) fail(w, 'botão flutuante visível com o teclado aberto');
  await page.$eval('#busca-pecas', (i) => i.blur());
  await page.evaluate(() => document.getElementById('contato').scrollIntoView({ behavior: 'instant', block: 'center' })); await page.waitForTimeout(350);
  if (!(await page.$eval('.fab', (f) => f.classList.contains('is-hidden')))) fail(w, 'botão flutuante sobre a seção de contato');
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(350);
  if (await page.$eval('.fab', (f) => f.classList.contains('is-hidden'))) fail(w, 'botão flutuante não volta a aparecer');

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
if (roda('cabecalho')) {
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
if (roda('conversao')) {
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
  const permitidas = ['Quero criar meu mimo', 'Ver as peças', 'Quero essa', 'Pedir esse mimo no WhatsApp', 'Orçamento para 10+ unidades', 'Me avise', 'Pedir pelo WhatsApp', 'Perguntar no WhatsApp', 'Ver no Instagram', 'Ver com meu nome', 'Enviar depoimento', 'Voltar pro início', 'Limpar busca', 'Ver mais'];
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
if (roda('conteudo')) {
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
if (roda('nitidez')) for (const [w, h, dpr] of [[1280, 800, 2], [390, 844, 3]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  await page.goto(page_url, { waitUntil: 'load' });
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await page.evaluate(() => { window.PANDA_REVELA_TUDO && window.PANDA_REVELA_TUDO(); document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; }); });
  await page.evaluate(async () => { const passo = innerHeight * .8; for (let y = 0; y < document.documentElement.scrollHeight; y += passo) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } scrollTo(0, 0); });
  // o detalhe do produto também entra na medição
  await page.$eval('.product[data-slug="canecas"] .product__ver', (b) => b.click()).catch(() => {});
  await page.waitForTimeout(150);
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
if (roda('medicao')) {
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
if (roda('banco')) {
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
if (roda('painel')) {
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
if (roda('paginas')) {
  const raiz = path.resolve(here, '..');
  // Lido do disco, e não pelo servidor: a pasta da prova de defeito (QA_SOBREPOR) passa na frente aqui também.
  const ler = (f) => {
    const deCima = process.env.QA_SOBREPOR ? path.resolve(process.env.QA_SOBREPOR, f) : null;
    return fs.readFileSync(deCima && fs.existsSync(deCima) ? deCima : path.resolve(raiz, f), 'utf8');
  };
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
      // Desde 23/09/2026 o estúdio mora na própria seção Monte seu mimo, que busca a marcação desta página.
      if (!new RegExp(`href="${pg}"`).test(index) && !new RegExp(`id="estudio-no-site"[^>]*data-origem="${pg}"`).test(index)) failures.push(`[estúdio] o index não leva ao estúdio (${pg}) nem o traz na seção Monte seu mimo`);
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
  if (roda('estudio')) for (const w of larguras) {
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
    /*
      A miniatura do modelo tem de mostrar o Pandinha já na primeira pintura, na abertura do estúdio.
      Era pintada antes de a imagem chegar e nunca repintada: a lista abria com todos os modelos sem
      o Pandinha. Só aparece aqui, antes de qualquer coisa refazer a lista — depois, a imagem já
      chegou e a checagem passaria mesmo com o defeito (foi o que o defeito de prova mostrou).
    */
    const pandinhaNaMiniatura = await pe.waitForFunction(() => {
      const c = document.querySelector('.studio-model[data-modelo="namorados-coracoes"] canvas');
      if (!c) return false;
      // o Pandinha desse modelo fica em x 0,5 e y 0,88, com 16% da altura da área de largura
      const meia = Math.round(c.height * 0.16 * 0.6);
      const d = c.getContext('2d').getImageData(Math.round(c.width * 0.5) - meia, Math.round(c.height * 0.88) - meia, meia * 2, meia * 2).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && d[i] < 70 && d[i + 1] < 70 && d[i + 2] < 70) n++;
      return n > 20;
    }, null, { timeout: 8000, polling: 150 }).then(() => true).catch(() => false);
    if (!pandinhaNaMiniatura) failures.push(`[estúdio ${w}] a miniatura do "Corações ao redor" abriu sem o Pandinha`);
    const estado = await pe.evaluate(() => ({
      canvas: !!document.querySelector('#mug-viewport canvas.mug-3d-canvas'),
      fallback: !document.getElementById('viewer-fallback').hidden,
      rolagem: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      previa: !document.getElementById('save-preview').disabled,
      zap: document.getElementById('mug-order').href,
      abas: [...document.querySelectorAll('#abas button')].map((b) => b.dataset.aba).join(','),
    }));
    // Na abertura, sem modelo e sem arte, as abas são Modelo e Minha arte.
    if (estado.abas !== 'modelo,arte') failures.push(`[estúdio ${w}] na abertura as abas deviam ser Modelo e Minha arte (${estado.abas})`);
    if (estado.fallback || !estado.canvas) failures.push(`[estúdio ${w}] o 3D caiu no aviso de indisponível`);
    if (estado.rolagem) failures.push(`[estúdio ${w}] rolagem lateral na página`);
    if (!estado.previa) failures.push(`[estúdio ${w}] "Baixar prévia" continua desligado com o 3D pronto`);
    if (!/^https:\/\/wa\.me\/5511999999999\?text=/.test(estado.zap) || !new URL(estado.zap).searchParams.get('text').includes('Interior: Branco')) failures.push(`[estúdio ${w}] o pedido não leva as escolhas para o WhatsApp (${estado.zap.slice(0, 60)})`);
    // abre os blocos recolhidos: só assim dá para medir todos os campos da página (cores, cena e arte
    // aberta ficam à vista desde 23/09/2026; resta o bloco do Canva)
    await pe.evaluate(() => {
      for (const id of ['bloco-canva']) {
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
    // nome, cores e vistas. O nome da arte trazida pronta é uma frase de verdade (23/09/2026): nasce pelo
    // "+ Nome ou frase" da própria aba, abre para escrever e vai para a mensagem do pedido. As cores da
    // peça ficam junto da peça, à vista, em bolinhas.
    await pe.click('#arte-add-frase');
    await pe.waitForTimeout(300);
    const campoDoNome = pe.locator('#lista-frases [data-corpo]:not([hidden]) input[type="text"]').first();
    if (!(await campoDoNome.isVisible().catch(() => false))) failures.push(`[estúdio ${w}] "+ Nome ou frase" não abriu a frase para escrever`);
    else await campoDoNome.fill('Malu');
    // Confere antes de clicar: com as cores escondidas, o clique esperaria 30 s e derrubaria o guardião.
    const coresAVista = await pe.locator('#cores-interior [data-cor="rosa"]').isVisible() && await pe.locator('[data-preset="preta"]').isVisible();
    if (!coresAVista) failures.push(`[estúdio ${w}] as cores da peça não estão à vista para escolher`);
    if (coresAVista) {
    await pe.click('#cores-interior [data-cor="rosa"]');
    await pe.waitForTimeout(200);
    const soInterior = await pe.evaluate(() => ({
      zap: new URL(document.getElementById('mug-order').href).searchParams.get('text') || '',
      combinacao: document.querySelector('[data-preset][aria-pressed="true"]')?.dataset.preset || null,
      marcada: document.querySelector('#cores-interior [aria-pressed="true"]')?.dataset.cor,
    }));
    if (!soInterior.zap.includes('Interior: Rosa · Alça: Branco') || soInterior.combinacao || soInterior.marcada !== 'rosa') {
      failures.push(`[estúdio ${w}] a bolinha do interior não trocou só o interior (${JSON.stringify({ ...soInterior, zap: soInterior.zap.slice(0, 120) })})`);
    }
    await pe.click('[data-preset="preta"]');
    await pe.click('[data-view="back"]');
    await pe.waitForTimeout(700);
    const depois = await pe.evaluate(() => ({
      zap: new URL(document.getElementById('mug-order').href).searchParams.get('text') || '',
      pressed: document.querySelector('[data-view][aria-pressed="true"]')?.dataset.view,
      preset: document.querySelector('[data-preset][aria-pressed="true"]')?.dataset.preset,
      interior: document.querySelector('#cores-interior [aria-pressed="true"]')?.dataset.cor,
      alca: document.querySelector('#cores-alca [aria-pressed="true"]')?.dataset.cor,
    }));
    if (!depois.zap.includes('"Malu"') || !depois.zap.includes('Interior: Preto')) failures.push(`[estúdio ${w}] o pedido não acompanha nome e cores escolhidos`);
    if (depois.pressed !== 'back') failures.push(`[estúdio ${w}] o botão de vista "Verso" não ficou marcado`);
    if (depois.preset !== 'preta' || depois.interior !== 'preta' || depois.alca !== 'preta') failures.push(`[estúdio ${w}] a combinação "Preto e branco" não aplicou as duas cores`);
    }
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
      grupos: [...document.querySelectorAll('#painel-assuntos .studio-assunto__titulo')].map((g) => g.textContent),
      ocasioes: document.querySelectorAll('#painel-assuntos [data-assunto]').length,
      resultado: document.getElementById('resultado-modelos').textContent,
    }));
    // Com a arte de exemplo dentro, a Minha arte ganha Frases e Enfeites para pôr por cima (23/09/2026).
    if (filtros.abas.join(',') !== 'modelo,arte,frases,enfeites') failures.push(`[estúdio ${w}] com a arte trazida pronta, as abas deviam ser Modelo, Minha arte, Frases e Enfeites (${filtros.abas.join(',')})`);
    if (filtros.grupos.length < 3 || filtros.ocasioes < 10) failures.push(`[estúdio ${w}] o seletor de ocasião não veio agrupado (${JSON.stringify(filtros)})`);
    if (!/\d+ modelos/.test(filtros.resultado)) failures.push(`[estúdio ${w}] a lista de modelos não diz quantos são ("${filtros.resultado}")`);

    // O seletor abre, fecha com Esc e fecha ao escolher; o botão passa a dizer a ocasião.
    const seletor = await pe.evaluate(async () => {
      const espera = (ms) => new Promise((r) => setTimeout(r, ms));
      const botao = document.getElementById('categoria-modelo');
      const painel = document.getElementById('painel-assuntos');
      const fechadoNoComeco = !painel.open;
      botao.click(); await espera(150);
      const abriu = painel.open && botao.getAttribute('aria-expanded') === 'true';
      painel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await espera(120);
      const escFecha = !painel.open && botao.getAttribute('aria-expanded') === 'false';
      botao.click(); await espera(120);
      painel.querySelector('[data-assunto="natal"]').click();
      await espera(350);
      return { fechadoNoComeco, abriu, escFecha, fechouAoEscolher: !painel.open, rotulo: botao.textContent.trim() };
    });
    if (!seletor.fechadoNoComeco || !seletor.abriu || !seletor.escFecha || !seletor.fechouAoEscolher || seletor.rotulo !== 'Natal') {
      failures.push(`[estúdio ${w}] o seletor de ocasião não abre, fecha ou escolhe como devia (${JSON.stringify(seletor)})`);
    }
    const soNatal = await pe.$$eval('#model-list .studio-model', (b) => b.map((x) => x.dataset.modelo));
    // O assunto mostra exatamente os modelos dele e os que aparecem também ali (`tambemEm`), pela regra do
    // catálogo. O prefixo do id servia de atalho até o Pandinha do Natal morar noutra coleção e aparecer aqui.
    const { TEMPLATES: catalogoDoNatal } = await import('../simulador/modelos.js');
    const esperadosNoNatal = catalogoDoNatal.filter((m) => m.categoria === 'natal' || (m.tambemEm || []).includes('natal')).map((m) => m.id).sort();
    if (!soNatal.length || JSON.stringify([...soNatal].sort()) !== JSON.stringify(esperadosNoNatal)) {
      failures.push(`[estúdio ${w}] a ocasião Natal mostrou ${soNatal.join(', ')}; o catálogo pede ${esperadosNoNatal.join(', ')}`);
    }
    await escolheAssunto(pe, 'todos');
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
      await escolheAssunto(pe, categoria);
      await pe.waitForTimeout(300);
      await pe.evaluate(() => { const b = document.getElementById('model-more'); if (b && !b.hidden && b.textContent.startsWith('Ver mais')) b.click(); });
      const daCategoria = await pe.$$eval('#model-list .studio-model', (b) => b.map((x) => x.dataset.modelo).filter(Boolean));
      // Um modelo mora numa categoria e pode aparecer também noutra (`tambemEm`), como no estúdio.
      const esperados = catalogoDasColecoes.filter(m => m.categoria === categoria || (m.tambemEm || []).includes(categoria)).map(m => m.id).sort();
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
      As imagens do acervo na arte: poses do Pandinha, elementos da marca e aquarelas. Três defeitos
      passaram por aqui sem ninguém ver, porque a checagem dos elementos só contava camadas:
      1. o elemento acrescentado pela grade entrava na lista de camadas e não era desenhado;
      2. a miniatura do modelo era pintada antes de o Pandinha chegar, e nunca repintada (essa
         checagem mora na abertura do estúdio, porque só ali o defeito aparece);
      3. o elemento aparecia na lista como "Pandinha", com 🐼, e sem controle de tamanho.
      Agora conta pixel. E uma regra mudou em 23/09/2026: quantos Pandinhas vão numa caneca é
      escolha de quem monta, então dois toques em "+ Pandinha" dão dois Pandinhas.
    */
    const acervo = await pe.evaluate(async () => {
      const espera = (ms) => new Promise((r) => setTimeout(r, ms));
      const esperaAte = async (condicao, ms = 8000) => {
        const fim = Date.now() + ms;
        while (Date.now() < fim) { if (await condicao()) return true; await espera(120); }
        return false;
      };
      // (a miniatura com o Pandinha é conferida logo na abertura do estúdio, onde o defeito aparecia)
      document.querySelector('#abas [data-aba="modelo"]').click();
      const botaoDoAssunto = document.getElementById('categoria-modelo');
      if (botaoDoAssunto.getAttribute('aria-expanded') !== 'true') botaoDoAssunto.click();
      document.querySelector('#painel-assuntos [data-assunto="todos"]').click();
      await espera(300);
      const cartao = document.querySelector('.studio-model[data-modelo="namorados-coracoes"]');
      cartao.scrollIntoView({ block: 'nearest', behavior: 'instant' });

      // 1 e 3. a aquarela da grade é desenhada, tem nome próprio e controle de tamanho
      cartao.click();
      await espera(900);
      document.querySelector('#abas [data-aba="enfeites"]').click();
      await espera(300);
      const flat = document.getElementById('flat-art');
      const quadro = () => flat.getContext('2d').getImageData(0, 0, flat.width, flat.height).data;
      const diferenca = (a, b) => {
        let n = 0;
        for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) n++;
        return n / (a.length / 4);
      };
      // A seleção fica no Pandinha do modelo nas duas fotos: as alças não podem contar como desenho.
      const selecionaOPandinha = async () => {
        const cabeca = [...document.querySelectorAll('#lista-enfeites .studio-item')]
          .find((li) => li.querySelector('.studio-item__texto > span')?.textContent === 'Pandinha')?.querySelector('.studio-item__cabeca');
        if (cabeca && cabeca.getAttribute('aria-expanded') !== 'true') cabeca.click();
        await espera(350);
      };
      await selecionaOPandinha();
      const antes = quadro();
      const buque = [...document.querySelectorAll('#grade-aquarelas .studio-elemento')].find((b) => /buquê/i.test(b.getAttribute('aria-label')));
      buque?.click();
      const cartaoDoBuque = () => [...document.querySelectorAll('#lista-enfeites .studio-item')]
        .find((li) => li.querySelector('.studio-item__texto > span')?.textContent === 'Buquê de flores');
      await esperaAte(() => cartaoDoBuque());
      const tamanho = [...(cartaoDoBuque()?.querySelectorAll('label') || [])].find((l) => l.textContent.trim().startsWith('Tamanho'))?.querySelector('input');
      const icone = cartaoDoBuque()?.querySelector('.studio-item__icone img')?.getAttribute('src') || '';
      let fatia = 0;
      await esperaAte(async () => { await selecionaOPandinha(); fatia = diferenca(antes, quadro()); return fatia >= 0.02; });

      // 4. quantidade livre
      const pandinhas = () => [...document.querySelectorAll('#lista-enfeites .studio-item__texto > span')].filter((s) => s.textContent === 'Pandinha').length;
      const antesDosPandinhas = pandinhas();
      document.getElementById('add-pandinha').click();
      await espera(500);
      document.getElementById('add-pandinha').click();
      await espera(500);
      const depoisDosPandinhas = pandinhas();
      // 5. a grade de poses acrescenta o Pandinha na pose tocada
      document.querySelector('.studio-poses').open = true;
      const poses = document.querySelectorAll('#grade-poses .studio-elemento');
      [...poses].find((b) => /medicina/i.test(b.getAttribute('aria-label')))?.click();
      await espera(700);
      const naPose = [...document.querySelectorAll('#lista-enfeites .studio-item small')].some((s) => s.textContent === 'Medicina');
      const duplicar = [...document.querySelectorAll('#lista-enfeites [data-corpo] button')].some((b) => b.textContent === 'Duplicar');
      document.querySelector('#abas [data-aba="modelo"]').click();
      return {
        fatia, temBuque: Boolean(cartaoDoBuque()), maximo: tamanho ? Number(tamanho.max) : 0, icone,
        antesDosPandinhas, depoisDosPandinhas, poses: poses.length, naPose, duplicar,
      };
    });
    if (!acervo.temBuque) failures.push(`[estúdio ${w}] a aquarela da grade não entrou na lista com o nome dela`);
    if (acervo.fatia < 0.02) {
      failures.push(`[estúdio ${w}] a aquarela acrescentada pela grade não apareceu na arte (mexeu em ${(acervo.fatia * 100).toFixed(2)}% da vista aberta)`);
    }
    if (acervo.maximo < 0.8) failures.push(`[estúdio ${w}] a aquarela ficou sem controle de tamanho, ou curto demais (máximo ${acervo.maximo})`);
    if (!acervo.icone.includes('aquarela-buque')) failures.push(`[estúdio ${w}] a camada da aquarela ficou sem a imagem dela na lista ("${acervo.icone}")`);
    if (acervo.depoisDosPandinhas !== acervo.antesDosPandinhas + 2) {
      failures.push(`[estúdio ${w}] dois toques em "+ Pandinha" deram ${acervo.depoisDosPandinhas - acervo.antesDosPandinhas}: a quantidade é livre desde 23/09/2026`);
    }
    if (acervo.poses < 29 || !acervo.naPose) failures.push(`[estúdio ${w}] a grade de poses não acrescentou o Pandinha na pose tocada (${JSON.stringify(acervo)})`);
    if (!acervo.duplicar) failures.push(`[estúdio ${w}] o Pandinha ficou sem "Duplicar"`);

    /*
      Três armadilhas de rolagem que o cliente sentiu antes da gente:

      1. Com a lista inteira aberta a página passava de 13.000 px. Ao escolher um modelo a lista
         sumia, a página encolhia de uma vez e o navegador grampeava a rolagem no novo fim: a
         pessoa clicava num modelo e ia parar no rodapé, sem ver a caneca nem o próximo passo.
      2. Na largura de celular a prévia não acompanhava a edição, e a caneca ficava acima da tela.
      3. A roda do mouse sobre a prévia dava zoom e engolia a rolagem da página.
    */
    await pe.evaluate(() => document.querySelector('#abas [data-aba="modelo"]').click());
    await escolheAssunto(pe, 'todos');
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
      // Do ponto mais fundo em que alguém ainda escolhe um modelo: o pé da lista encostado no pé da tela.
      // Rolava-se a 55% da página quando a caneca grudava pelo topo e estava em qualquer altura; com a
      // arte aberta embaixo dela (23/09/2026), a 55% a lista já saiu da tela e o clique seria num cartão
      // que ninguém vê.
      const peDaLista = lista.getBoundingClientRect().bottom + window.scrollY;
      window.scrollTo({ top: Math.max(0, peDaLista - window.innerHeight + 8), behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 250));
      const antes = { y: Math.round(window.scrollY), max: document.documentElement.scrollHeight - window.innerHeight };
      const alvo = cartoes.find((c) => { const r = c.getBoundingClientRect(); return r.top > 40 && r.bottom < window.innerHeight; }) || cartoes[cartoes.length - 1];
      const topoAntes = alvo.getBoundingClientRect().top;
      alvo.click();
      await new Promise((r) => setTimeout(r, 1400));
      const peca = document.querySelector('.studio-preview').getBoundingClientRect();
      return {
        alturaComTudo,
        antes,
        depoisMax: document.documentElement.scrollHeight - window.innerHeight,
        pecaVisivel: peca.bottom > 0 && peca.top < window.innerHeight,
        // Escolher o modelo não pula de etapa (decisão do dono, 23/09/2026): a aba continua Modelo, o
        // cartão clicado não sai de baixo do dedo, e quem leva adiante é o botão de continuar.
        cartaoAndou: Math.round(alvo.getBoundingClientRect().top - topoAntes),
        aba: document.querySelector('#abas [aria-selected="true"]')?.dataset.aba,
        continuar: document.getElementById('passo-botao')?.textContent.trim() || '',
        fundoNoTopo: !document.getElementById('fundo-arte').hidden,
      };
    });
    if (rolagem.alturaComTudo > 6000) {
      failures.push(`[estúdio ${w}] a lista inteira deixa a página com ${rolagem.alturaComTudo} px: ao escolher um modelo a rolagem salta`);
    }
    if (!rolagem.pecaVisivel) {
      failures.push(`[estúdio ${w}] depois de escolher um modelo a caneca ficou fora da tela`);
    }
    if (rolagem.aba !== 'modelo') failures.push(`[estúdio ${w}] escolher um modelo pulou para a aba ${rolagem.aba}; tem de ficar em Modelo`);
    if (Math.abs(rolagem.cartaoAndou) > 4) failures.push(`[estúdio ${w}] o cartão clicado andou ${rolagem.cartaoAndou} px na tela ao escolher o modelo`);
    if (!/^Continuar para /.test(rolagem.continuar)) failures.push(`[estúdio ${w}] depois de escolher o modelo falta o botão de seguir ("${rolagem.continuar}")`);
    if (!rolagem.fundoNoTopo) failures.push(`[estúdio ${w}] a cor do fundo não apareceu na aba Modelo depois de escolher o modelo`);

    /*
      A roda sobre a caneca dá zoom (o dono pediu de volta em 23/09/2026) e, no limite do zoom, devolve
      a volta seguinte para a página — assim ninguém fica preso com o cursor sobre a prévia.
    */
    const roda = await pe.evaluate(async () => {
      const canvas = document.querySelector('canvas.mug-3d-canvas');
      if (!canvas) return null;
      const espera = (ms) => new Promise((res) => setTimeout(res, ms));
      const r = canvas.getBoundingClientRect();
      const barra = document.getElementById('mug-zoom');
      const manda = (delta) => {
        const ev = new WheelEvent('wheel', { deltaY: delta, bubbles: true, cancelable: true,
          clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 });
        canvas.dispatchEvent(ev);
        return ev.defaultPrevented;
      };
      const inicio = Number(barra.value);
      const aproximou = manda(-120);
      await espera(80);
      const barraSubiu = Number(barra.value) > inicio;
      let voltas = 0;
      while (voltas < 30 && manda(120)) voltas += 1;
      const noLimite = Number(barra.value);
      const devolveParaAPagina = !manda(120);
      // Devolve o zoom de antes: as checagens seguintes tocam no centro da peça esperando uma foto ali.
      barra.value = String(inicio);
      barra.dispatchEvent(new Event('input'));
      await espera(300);
      return { aproximou, barraSubiu, noLimite, devolveParaAPagina, voltas };
    });
    if (roda && (!roda.aproximou || !roda.barraSubiu)) failures.push(`[estúdio ${w}] a roda sobre a caneca deixou de dar zoom, ou a barra não acompanha (${JSON.stringify(roda)})`);
    if (roda && (roda.noLimite !== 75 || !roda.devolveParaAPagina)) failures.push(`[estúdio ${w}] no limite do zoom a roda não volta para a página (${JSON.stringify(roda)})`);

    await pe.evaluate(() => document.querySelector('#abas [data-aba="modelo"]').click());
    await escolheAssunto(pe, 'todos');
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
      painelModelo: !document.getElementById('painel-modelo').hidden,
      painelFotos: !document.getElementById('painel-fotos').hidden,
      painelFrases: !document.getElementById('painel-frases').hidden,
      aviso: document.getElementById('art-warnings').textContent,
    }));
    if (comModelo.abas.join(',') !== 'modelo,fotos,frases,enfeites') failures.push(`[estúdio ${w}] com modelo, faltam abas (${comModelo.abas.join(',')})`);
    // Escolher o modelo fica em Modelo (decisão do dono, 23/09/2026); quem leva às fotos é o botão de continuar.
    if (comModelo.ativa !== 'modelo') failures.push(`[estúdio ${w}] escolher o modelo pulou para a aba ${comModelo.ativa}; tem de ficar em Modelo`);
    if (comModelo.fotos !== 2 || comModelo.frases !== 2 || comModelo.enfeites !== 1) failures.push(`[estúdio ${w}] os itens não foram separados por tipo (${JSON.stringify(comModelo)})`);
    if (comModelo.contas.join(',') !== '2,2,1') failures.push(`[estúdio ${w}] as abas não mostram quantos itens têm (${comModelo.contas.join(',')})`);
    if (!comModelo.painelModelo || comModelo.painelFotos || comModelo.painelFrases) failures.push(`[estúdio ${w}] mais de um container aberto ao mesmo tempo`);
    if (!/falta escolher/.test(comModelo.aviso)) failures.push(`[estúdio ${w}] o modelo com espaços vazios não avisou ("${comModelo.aviso}")`);
    // As checagens seguintes partem da aba das fotos, como partiam: chega-se lá pelo botão de continuar.
    await pe.evaluate(() => document.getElementById('passo-botao').click());
    await pe.waitForTimeout(400);
    const naAbaDasFotos = await pe.evaluate(() => document.querySelector('#abas [aria-selected="true"]')?.dataset.aba);
    if (naAbaDasFotos !== 'fotos') failures.push(`[estúdio ${w}] "Continuar para fotos" não levou para a aba das fotos (${naAbaDasFotos})`);

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

    // acrescentar frase, enfeite e Pandinha (quantos quiser, desde 23/09/2026)
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
    // frase, enfeite e dois Pandinhas: cada toque em "+ Pandinha" acrescenta um
    if (acrescimos.depois !== acrescimos.inicio + 4) failures.push(`[estúdio ${w}] acrescentar frase, enfeite e dois Pandinhas não deu certo (${JSON.stringify(acrescimos)})`);
    if (acrescimos.depois !== acrescimos.comUm + 1) failures.push(`[estúdio ${w}] o segundo toque em "+ Pandinha" não acrescentou outro Pandinha`);
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
      const cenas = document.querySelectorAll('#cenas button').length;
      const acabamentos = document.querySelectorAll('#acabamentos button').length;
      document.querySelector('#cenas [data-valor="madeira"]').click();
      await new Promise((r) => setTimeout(r, 700));
      const comCena = document.querySelector('#cenas [aria-pressed="true"]')?.textContent || '';
      document.querySelector('#acabamentos [data-valor="fosco"]').click();
      await new Promise((r) => setTimeout(r, 500));
      const comFosco = (document.querySelector('#acabamentos [aria-pressed="true"]')?.textContent || '').toLowerCase();
      document.querySelector('#cenas [data-valor="estudio"]').click();
      document.querySelector('#acabamentos [data-valor="brilhante"]').click();
      await new Promise((r) => setTimeout(r, 600));
      return { cenas, acabamentos, comCena, comFosco, video: !document.getElementById('save-video').hidden };
    });
    if (cena.cenas < 3 || cena.acabamentos !== 2) failures.push(`[estúdio ${w}] faltam cenas ou acabamentos (${JSON.stringify(cena)})`);
    if (!/Mesa de madeira/.test(cena.comCena) || !/fosco/.test(cena.comFosco)) failures.push(`[estúdio ${w}] a cena ou o acabamento escolhido não ficou marcado (${cena.comCena} / ${cena.comFosco})`);
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
      const ocasioes = [...document.querySelectorAll('#painel-assuntos [data-assunto]')].map((o) => o.dataset.assunto);
      document.querySelector('#abas [data-aba="modelo"]').click();
      const botaoDoAssunto = document.getElementById('categoria-modelo');
      if (botaoDoAssunto.getAttribute('aria-expanded') !== 'true') botaoDoAssunto.click();
      document.querySelector('#painel-assuntos [data-assunto="meus"]').click();
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
    // Espera a mensagem em vez de cravar um tempo: os downloads logo acima escrevem no mesmo campo
    // de status, e um deles terminando tarde sobrescrevia a mensagem do Canva. A falha era da
    // checagem, não do produto — e um tempo fixo aqui volta a mentir no primeiro dia lento.
    await pe.waitForFunction(() => /Canva|proporção/i.test(document.getElementById('save-status')?.textContent || ''),
      { timeout: 8000 }).catch(() => {});
    const doCanva = await pe.evaluate(() => ({
      abas: [...document.querySelectorAll('#abas button')].map((b) => b.dataset.aba),
      ativa: document.querySelector('#abas [aria-selected="true"]')?.dataset.aba,
      layout: document.querySelector('input[name="layout"]:checked')?.value,
      status: document.getElementById('save-status').textContent,
      arquivo: document.getElementById('art-file-name').textContent,
    }));
    // A arte do Canva é arte trazida pronta: abre a Minha arte, com Frases e Enfeites para pôr por cima.
    if (doCanva.abas.join(',') !== 'modelo,arte,frases,enfeites' || doCanva.ativa !== 'arte') failures.push(`[estúdio ${w}] a arte do Canva não abriu a aba Minha arte com frases e enfeites (${JSON.stringify(doCanva)})`);
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
      // Espera tudo o que compara: as camadas e, na Minha arte, a arte por baixo delas, que carrega depois.
      await pe.waitForFunction((alvo) => document.querySelectorAll('.studio-item').length === alvo.camadas
        && document.getElementById('art-file-name').textContent === alvo.arquivo, antesDeRecarregar, { timeout: 15000 }).catch(() => {});
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

  // A prévia gruda no topo, e elemento posicionado pinta ACIMA do conteúdo estático mesmo vindo antes
  // no documento. Bastou um `max-height` sobrando na coluna para o conteúdo vazar da caixa e a caneca
  // cobrir a faixa de ajustes logo abaixo — o dono viu antes da gente, num print. A janela baixa é o
  // caso que revela: é onde a coluna encosta no limite da tela.
  if (roda('sobreposicao')) for (const [nome, w4, h4] of [['1366x768', 1366, 768], ['1337x660', 1337, 660], ['1280x580', 1280, 580]]) {
    const contexto = await browser.newContext({ viewport: { width: w4, height: h4 } });
    const ps = await contexto.newPage();
    await ps.goto(servidor.url + 'caneca-3d.html', { waitUntil: 'load' });
    await ps.waitForTimeout(800);
    const choque = await ps.evaluate(async () => {
      const peca = document.querySelector('.studio-preview');
      const abaixo = ['.studio-peca-detalhes', '.studio-finish', 'footer'].map((s2) => document.querySelector(s2)).filter(Boolean);
      let pior = { invade: 0, sobre: null };
      for (let y = 0; y <= document.documentElement.scrollHeight; y += 60) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 30));
        const rp = peca.getBoundingClientRect();
        for (const alvo of abaixo) {
          const ra = alvo.getBoundingClientRect();
          const invade = Math.min(rp.bottom, ra.bottom) - Math.max(rp.top, ra.top);
          if (invade > 2 && rp.right > ra.left && rp.left < ra.right && invade > pior.invade) {
            pior = { invade: Math.round(invade), sobre: (alvo.className || alvo.tagName).toString().slice(0, 28), scroll: y };
          }
        }
      }
      const col = document.querySelector('.studio-coluna-peca');
      return { pior, transborda: col.scrollHeight > Math.round(col.getBoundingClientRect().height) + 2 };
    });
    if (choque.pior.invade > 2) {
      failures.push(`[sobreposição ${nome}] a prévia cobre ${choque.pior.sobre} em ${choque.pior.invade} px (rolagem ${choque.pior.scroll})`);
    }
    if (choque.transborda) failures.push(`[sobreposição ${nome}] o conteúdo da coluna da peça vaza para fora da caixa`);
    await contexto.close();
  }

  /*
    O layout em todas as larguras. O bug do print do dono (23/09/2026) morava entre 700 e 850 px: a
    caneca não esticava, ficava com 422 px no meio de um painel de 640 e, grudada no topo, cobria 27 a
    40% dele. E no celular a caneca grudada tomava 54 a 94% da altura da tela. As regras:
    - em duas colunas (760 px ou mais), a caneca nunca cobre o painel, em nenhum ponto da rolagem;
    - em uma coluna, a caneca tem a largura do painel e no máximo 45% da altura da tela;
    - nunca rolagem lateral.
  */
  if (roda('layout')) for (const [w5, h5, toque] of [[320, 568, true], [375, 667, true], [390, 844, true], [414, 896, true], [700, 640, false],
    [759, 700, false], [760, 700, false], [800, 640, false], [850, 700, false], [1024, 768, false]]) {
    const contexto = await browser.newContext({ viewport: { width: w5, height: h5 }, hasTouch: toque, isMobile: toque });
    const pl = await contexto.newPage();
    await pl.goto(servidor.url + 'caneca-3d.html', { waitUntil: 'load' });
    await pl.waitForTimeout(700);
    const medida = await pl.evaluate(async () => {
      const espera = (ms) => new Promise((r) => setTimeout(r, ms));
      const peca = document.querySelector('.studio-preview');
      const painel = document.querySelector('.studio-controls');
      const umaColuna = window.matchMedia('(max-width: 759px)').matches;
      let pior = 0;
      for (const fracao of [0.2, 0.45, 0.7]) {
        window.scrollTo({ top: document.documentElement.scrollHeight * fracao, behavior: 'instant' });
        await espera(120);
        if (umaColuna) continue;
        const c = painel.getBoundingClientRect();
        let cobertos = 0, total = 0;
        for (let x = c.left + 8; x < c.right - 8; x += 20) {
          for (let y = Math.max(c.top, 0) + 8; y < Math.min(c.bottom, innerHeight) - 8; y += 20) {
            total += 1;
            const e = document.elementFromPoint(x, y);
            if (e && peca.contains(e)) cobertos += 1;
          }
        }
        if (total) pior = Math.max(pior, cobertos / total);
      }
      const p = peca.getBoundingClientRect(), c = painel.getBoundingClientRect();
      return {
        umaColuna, pior,
        larguraPeca: Math.round(p.width), larguraPainel: Math.round(c.width),
        alturaPeca: Math.round(p.height), alturaTela: innerHeight,
        lateral: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    });
    const onde = `[layout ${w5}x${h5}]`;
    if (medida.lateral) failures.push(`${onde} rolagem lateral na página`);
    if (!medida.umaColuna && medida.pior > 0) failures.push(`${onde} a caneca cobre ${Math.round(medida.pior * 100)}% do painel ao rolar`);
    if (medida.umaColuna && Math.abs(medida.larguraPeca - medida.larguraPainel) > 2) {
      failures.push(`${onde} a caneca grudada tem ${medida.larguraPeca} px e o painel ${medida.larguraPainel}: ela tem de cobrir a largura inteira, não um pedaço`);
    }
    if (medida.umaColuna && medida.alturaPeca > medida.alturaTela * 0.45) {
      failures.push(`${onde} a caneca grudada toma ${Math.round(100 * medida.alturaPeca / medida.alturaTela)}% da altura da tela (máximo 45%)`);
    }
    await contexto.close();
  }

  // A arte do modelo, maior: com o mouse descansando no cartão, e com o dedo segurando.
  if (roda('arte-maior')) {
    const contexto = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const pm = await contexto.newPage();
    await pm.goto(servidor.url + 'caneca-3d.html', { waitUntil: 'load' });
    await pm.waitForSelector('[data-modelo="namorados-coracoes"] canvas', { state: 'attached' });
    await pm.waitForTimeout(500);
    const cartao = pm.locator('[data-modelo="namorados-coracoes"]');
    await cartao.scrollIntoViewIfNeeded();
    await cartao.hover();
    await pm.waitForTimeout(700);
    const aberta = await pm.evaluate(() => {
      const caixa = document.querySelector('.studio-previa-modelo');
      if (!caixa || !caixa.classList.contains('vendo')) return { vendo: false };
      const c = caixa.querySelector('canvas');
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let tinta = 0;
      for (let i = 3; i < d.length; i += 400) if (d[i] > 0) tinta += 1;
      const rc = document.querySelector('[data-modelo="namorados-coracoes"]').getBoundingClientRect();
      const rp = caixa.getBoundingClientRect();
      return { vendo: true, nome: caixa.querySelector('strong').textContent, tinta, cobreOCartao: rp.left < rc.right && rp.right > rc.left && rp.top < rc.bottom && rp.bottom > rc.top };
    });
    await pm.mouse.move(5, 5);
    await pm.waitForTimeout(300);
    const fechou = await pm.evaluate(() => !document.querySelector('.studio-previa-modelo')?.classList.contains('vendo'));
    if (!aberta.vendo) failures.push('[arte maior] descansar o mouse no cartão não mostrou a arte maior');
    else {
      if (aberta.nome !== 'Corações ao redor') failures.push(`[arte maior] mostrou "${aberta.nome}" para o cartão Corações ao redor`);
      if (aberta.tinta < 20) failures.push('[arte maior] a arte maior saiu em branco');
      if (aberta.cobreOCartao) failures.push('[arte maior] a arte maior cobre o próprio cartão do modelo');
    }
    if (!fechou) failures.push('[arte maior] a arte maior não some quando o mouse sai do cartão');
    await contexto.close();

    const toque = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const pt = await toque.newPage();
    await pt.goto(servidor.url + 'caneca-3d.html', { waitUntil: 'load' });
    await pt.waitForSelector('[data-modelo="namorados-coracoes"]', { state: 'attached' });
    await pt.waitForTimeout(500);
    const segurou = await pt.evaluate(async () => {
      const espera = (ms) => new Promise((r) => setTimeout(r, ms));
      const cartao = document.querySelector('[data-modelo="namorados-coracoes"]');
      cartao.scrollIntoView({ block: 'center', behavior: 'instant' });
      await espera(200);
      const r = cartao.getBoundingClientRect();
      const ponto = { clientX: r.x + r.width / 2, clientY: r.y + r.height / 2, pointerType: 'touch', bubbles: true, isPrimary: true, pointerId: 7 };
      cartao.dispatchEvent(new PointerEvent('pointerdown', ponto));
      await espera(650);
      const folha = document.querySelector('dialog.studio-folha-modelo');
      const abriu = Boolean(folha?.open);
      cartao.dispatchEvent(new PointerEvent('pointerup', ponto));
      cartao.click();   // o toque que solta não pode escolher o modelo por baixo da folha
      await espera(200);
      const escolheuPorBaixo = cartao.getAttribute('aria-pressed') === 'true';
      [...(folha?.querySelectorAll('button') || [])].find((b) => b.textContent === 'Usar este modelo')?.click();
      await espera(700);
      return { abriu, escolheuPorBaixo, fechouAoUsar: !folha?.open, escolhido: cartao.isConnected ? cartao.getAttribute('aria-pressed') : document.querySelector('[data-modelo="namorados-coracoes"]')?.getAttribute('aria-pressed') };
    });
    if (!segurou.abriu) failures.push('[arte maior 390 com dedo] segurar o dedo no cartão não abriu a arte maior');
    if (segurou.escolheuPorBaixo) failures.push('[arte maior 390 com dedo] soltar o dedo escolheu o modelo por baixo da folha');
    if (!segurou.fechouAoUsar || segurou.escolhido !== 'true') failures.push(`[arte maior 390 com dedo] "Usar este modelo" não escolheu o modelo (${JSON.stringify(segurou)})`);
    await toque.close();
  }


  // Quatro acréscimos da rodada de acessibilidade e primeira visita, cobrados de uma vez porque
  // dependem da mesma página montada: alvo de toque de 44 px, dúvida explicada ao lado do termo que
  // a levanta, boas-vindas que aparecem uma vez só, e a caneca girando pelo teclado.
  // O piso muda com o ponteiro: 44 px onde há dedo, 24 px (o mínimo da norma) onde há mouse. Medir
  // 44 no desktop obrigaria a interface a ficar pesada — um botão de 44 px com letra de 12 é 3,7
  // vezes a altura da própria letra, e o dono reclamou disso antes da gente perceber.
  if (roda('toque')) for (const [nome, w3, h3, toque] of [['1280', 1280, 900, false], ['390 com dedo', 390, 844, true]]) {
    const piso = toque ? 44 : 24;
    const contexto = await browser.newContext({ viewport: { width: w3, height: h3 }, hasTouch: toque, isMobile: toque });
    const pz = await contexto.newPage();
    await pz.goto(servidor.url + 'caneca-3d.html', { waitUntil: 'load' });
    await pz.waitForTimeout(900);
    await pz.evaluate((v) => { window.__piso = v; }, piso);
    const r = await pz.evaluate(async () => {
      const pequenos = [...document.querySelectorAll('button, a[href]')]
        .filter((e) => { const c = e.getBoundingClientRect(); return c.width > 0 && c.height > 0 && c.height < window.__piso; })
        .map((e) => `${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24)} (${Math.round(e.getBoundingClientRect().height)}px)`);
      const bv = document.getElementById('boasvindas');
      const primeira = { existe: !!bv, visivel: bv ? !bv.hidden : false };
      bv?.querySelector('button')?.click();
      await new Promise((res) => setTimeout(res, 200));
      const depoisDeFechar = bv ? bv.hidden : null;
      const canvas = document.querySelector('canvas.mug-3d-canvas');
      let setaTratada = null;
      if (canvas) {
        canvas.focus();
        const ev = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
        canvas.dispatchEvent(ev);
        setaTratada = ev.defaultPrevented;
      }
      return {
        pequenos,
        duvidas: document.querySelectorAll('.studio-duvida summary').length,
        primeira, depoisDeFechar,
        atalhos: [...document.querySelectorAll('a.skip')].map((a) => a.getAttribute('href')),
        canvasFocavel: canvas ? canvas.tabIndex === 0 : false,
        setaTratada,
        aceitaHeic: (document.getElementById('art-file')?.accept || '').includes('heic'),
      };
    });
    if (r.pequenos.length) failures.push(`[toque ${nome}] ${r.pequenos.length} controle(s) com menos de ${piso} px: ${r.pequenos.slice(0, 4).join(', ')}`);
    if (r.duvidas < 2) failures.push(`[ajuda ${nome}] sumiram as explicações ao lado dos termos (${r.duvidas})`);
    if (!r.primeira.existe || !r.primeira.visivel) failures.push(`[primeira visita ${nome}] as boas-vindas não apareceram na primeira abertura`);
    if (r.depoisDeFechar === false) failures.push(`[primeira visita ${nome}] as boas-vindas não fecham no clique`);
    if (!r.atalhos.includes('#abas')) failures.push(`[teclado ${nome}] falta o atalho que pula direto para o editor`);
    if (!r.canvasFocavel) failures.push(`[teclado ${nome}] a caneca não recebe foco de teclado`);
    if (r.setaTratada === false) failures.push(`[teclado ${nome}] as setas não giram a caneca`);
    if (!r.aceitaHeic) failures.push(`[fotos ${nome}] o seletor voltou a recusar HEIC, o padrão do iPhone`);
    await contexto.close();
  }

  // Nada dizia em que passo a pessoa estava nem qual era o próximo: as abas eram a única navegação,
  // e quem não conhece o produto não sabia que tinha terminado. A barra de passo conduz, e o ponto
  // na aba mostra onde ainda falta fazer algo — inclusive nas frases, que nascem com texto de
  // exemplo e sairiam impressas assim ("chá do Theo") se ninguém avisasse.
  if (roda('passo')) {
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
      const passos = [];
      for (let i = 0; i < 3; i += 1) {
        document.getElementById('passo-botao').click();
        await new Promise((r) => setTimeout(r, 500));
        passos.push(leia());
      }
      return { semModelo, comModelo, adiante: passos[0], fim: passos[2] };
    });
    if (passo.semModelo.visivel) failures.push('[passo] a barra apareceu antes de escolher um modelo');
    if (!passo.comModelo.visivel) failures.push('[passo] a barra não apareceu depois de escolher um modelo');
    if (!/Passo \d+ de \d+/.test(passo.comModelo.conta)) failures.push(`[passo] a barra não diz em que passo a pessoa está ("${passo.comModelo.conta}")`);
    if (!passo.comModelo.pontos.includes('fotos')) failures.push('[passo] a aba das fotos não marcou que ainda falta escolher foto');
    if (!passo.comModelo.pontos.includes('frases')) failures.push('[passo] a aba das frases não marcou que o texto ainda é o de exemplo');
    // O modelo fica na aba Modelo; o que falta (as fotos) aparece no passo seguinte, que é onde se resolve.
    if (passo.comModelo.aba !== 'modelo') failures.push(`[passo] escolher o modelo pulou para ${passo.comModelo.aba}`);
    if (!/^Faltam? /.test(passo.adiante.falta)) failures.push(`[passo] a barra não diz o que falta ("${passo.adiante.falta}")`);
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
  if (roda('peca')) for (const [nome, w2, h2] of [['1280', 1280, 900], ['390', 390, 844]]) {
    const contexto = await browser.newContext({ viewport: { width: w2, height: h2 } });
    const pa = await contexto.newPage();
    await pa.goto(servidor.url + 'caneca-3d.html', { waitUntil: 'load' });
    await pa.waitForTimeout(900);
    const alcance = await pa.evaluate(async (larga) => {
      const ids = ['peca-cores', 'peca-acabamento', 'peca-cena', 'flat-details'];
      const faltando = ids.filter((id) => !document.getElementById(id));
      const daParaUsar = (id) => {
        const alvo = document.getElementById(id);
        const rr = alvo.getBoundingClientRect();
        if (!(rr.top >= 0 && rr.bottom <= window.innerHeight)) return { ok: false, motivo: 'fora da tela' };
        const noPonto = document.elementFromPoint(Math.round(rr.left + rr.width / 2), Math.round(rr.top + rr.height / 2));
        if (noPonto && alvo.contains(noPonto)) return { ok: true };
        return { ok: false, motivo: 'coberto por ' + (noPonto ? (noPonto.className || noPonto.tagName).toString().slice(0, 30) : 'nada') };
      };
      const presentes = ids.filter((id) => document.getElementById(id));
      // Na tela larga os blocos da peça vêm logo abaixo da caneca; no celular, depois do editor.
      // A varredura desce a página em passos e cobra que cada bloco fique, em algum momento, inteiro
      // na tela e sem nada por cima — que é o que "dá para usar" quer dizer.
      const conseguiu = new Map(presentes.map((id) => [id, { ok: false, motivo: 'nunca ficou à mão' }]));
      const passo = Math.round(window.innerHeight / 3);
      for (let y = 0; y <= document.documentElement.scrollHeight; y += passo) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 90));
        for (const id of presentes) if (!conseguiu.get(id).ok) { const r = daParaUsar(id); if (r.ok) conseguiu.set(id, r); }
      }
      const estado = presentes.map((id) => ({ id, ...conseguiu.get(id) }));
      return { faltando, estado };
    });
    for (const id of alcance.faltando) failures.push(`[peça ${nome}] o bloco ${id} sumiu da página`);
    for (const a of alcance.estado) {
      if (!a.ok) failures.push(`[peça ${nome}] não dá para usar ${a.id}: ${a.motivo}`);
    }
    await contexto.close();
  }

  /*
    A peça à vista (pedido do dono, 23/09/2026): "essas cores da peça, cena e acabamento têm que aparecer
    logo de cara", e a arte aberta "tem que aparecer logo abaixo da caneca 3D, e num tamanho maior,
    porque dá para editar por ali". Na tela larga:
    - cores, acabamento e cena ficam à vista, sem bloco que abre, e logo abaixo da caneca;
    - a arte aberta vem logo depois, na largura da coluna, em densidade de tela;
    - o escolhido das opções é leve, não pílula preta;
    - quando o editor passa da coluna, a coluna gruda pelo pé: do meio ao fim do editor a arte aberta
      continua inteira à vista.
  */
  if (roda('peca-a-vista')) for (const [w6, h6, escala] of [[1280, 800, 1], [1024, 768, 1], [1280, 720, 2]]) {
    const contexto = await browser.newContext({ viewport: { width: w6, height: h6 }, deviceScaleFactor: escala });
    const pv = await contexto.newPage();
    await pv.goto(servidor.url + 'caneca-3d.html', { waitUntil: 'load' });
    await pv.waitForTimeout(900);
    const vista = await pv.evaluate(async () => {
      const espera = (ms) => new Promise((r) => setTimeout(r, ms));
      const caixa = (seletor) => document.querySelector(seletor)?.getBoundingClientRect();
      const previa = caixa('.studio-preview');
      const opcoes = caixa('.studio-opcoes');
      const flat = document.getElementById('flat-art');
      const secaoFlat = caixa('#flat-details');
      const coluna = caixa('.studio-coluna-peca');
      const fechados = ['peca-cores', 'peca-acabamento', 'peca-cena', 'flat-details']
        .filter((id) => { const e = document.getElementById(id); return !e || e.closest('details:not([open])') || !e.offsetParent; });
      const visiveis = (seletor) => [...document.querySelectorAll(seletor)].filter((b) => b.getBoundingClientRect().width > 0).length;
      const botoes = {
        combinacoes: visiveis('#peca-cores [data-preset]'), interior: visiveis('#cores-interior .studio-cor'), alca: visiveis('#cores-alca .studio-cor'),
        acabamentos: visiveis('#acabamentos button'), cenas: visiveis('#cenas button'),
      };
      const tinta = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
      const pretas = [...document.querySelectorAll('.studio-opcoes [aria-pressed="true"]')].filter((b) => {
        const fundo = getComputedStyle(b).backgroundColor;
        const cor = document.createElement('span'); cor.style.color = tinta; document.body.append(cor);
        const tintaRgb = getComputedStyle(cor).color; cor.remove();
        return fundo === tintaRgb;
      }).map((b) => b.textContent.trim() || b.dataset.cor);
      /*
        A cola pelo pé, com o editor mais alto que a coluna (o bloco do Canva e o de vários nomes abertos):
        a coluna tem uma folga para correr, e dois pontos da rolagem separam os jeitos de grudar. No meio
        da folga, só grudando pelo pé a arte aberta está à vista (grudada pelo topo ela fica abaixo da tela
        até o fim do layout). Perto do fim, a coluna parada já subiu e levou a arte aberta junto. Ir ao
        botão do pedido não separava nada: ali o fim do layout empurra qualquer coluna para cima.
      */
      document.getElementById('bloco-canva').open = true;
      document.getElementById('lote').open = true;
      await espera(300);
      const layout = document.querySelector('.studio-layout');
      const alturas = { coluna: Math.round(document.querySelector('.studio-coluna-peca').getBoundingClientRect().height), editor: Math.round(document.querySelector('.studio-controls').getBoundingClientRect().height) };
      const folga = Math.round(layout.getBoundingClientRect().height - alturas.coluna);
      const fimDoLayout = layout.getBoundingClientRect().bottom + window.scrollY;
      const flatComFimAbaixo = async (d) => {
        window.scrollTo({ top: Math.max(0, fimDoLayout - window.innerHeight - d), behavior: 'instant' });
        await espera(200);
        const r = flat.getBoundingClientRect();
        return { ok: r.top >= 0 && r.bottom <= window.innerHeight, caixa: [Math.round(r.top), Math.round(r.bottom)] };
      };
      const noMeio = folga >= 300 ? await flatComFimAbaixo(Math.round(folga / 2 + 80)) : null;
      const pertoDoFim = folga >= 300 ? await flatComFimAbaixo(30) : null;
      return {
        folga, noMeio, pertoDoFim,
        fechados, botoes, pretas, alturas,
        colado: Math.round(opcoes.top - previa.bottom),
        mesmaColuna: Math.abs(opcoes.left - previa.left) <= 2 && Math.abs(secaoFlat.left - previa.left) <= 2,
        flatLogoDepois: Math.round(secaoFlat.top - opcoes.bottom),
        larguraFlat: Math.round(flat.getBoundingClientRect().width),
        larguraColuna: Math.round(coluna.width),
        densidade: +(flat.width / flat.getBoundingClientRect().width).toFixed(2),
        dpr: window.devicePixelRatio,
      };
    });
    const onde = `[peça à vista ${w6}x${h6}${escala > 1 ? ' @2x' : ''}]`;
    if (vista.fechados.length) failures.push(`${onde} ${vista.fechados.join(', ')} ainda escondido(s) atrás de um clique`);
    const b6 = vista.botoes;
    if (b6.combinacoes !== 3 || b6.interior !== 6 || b6.alca !== 6 || b6.acabamentos !== 2 || b6.cenas !== 4) failures.push(`${onde} faltam opções à vista (${JSON.stringify(b6)})`);
    if (vista.pretas.length) failures.push(`${onde} o escolhido das opções da peça voltou a ser pílula preta (${vista.pretas.join(', ')})`);
    if (Math.abs(vista.colado) > 2 || !vista.mesmaColuna) failures.push(`${onde} as opções da peça não estão logo abaixo da caneca (vão de ${vista.colado} px)`);
    if (Math.abs(vista.flatLogoDepois) > 2) failures.push(`${onde} a arte aberta não vem logo depois das opções (vão de ${vista.flatLogoDepois} px)`);
    if (vista.larguraFlat < vista.larguraColuna - 80) failures.push(`${onde} a arte aberta tem ${vista.larguraFlat} px numa coluna de ${vista.larguraColuna}: tem de ocupar a coluna`);
    // Pelo menos um pixel do canvas por pixel da tela, até os 2.480 px da arte a 300 dpi.
    if (vista.densidade < Math.min(vista.dpr, 2480 / vista.larguraFlat) - 0.02) failures.push(`${onde} a arte aberta está em ${vista.densidade} pixel por ponto de tela numa tela de ${vista.dpr}x: sai borrada`);
    if (vista.noMeio && !vista.noMeio.ok) failures.push(`${onde} no meio do editor a arte aberta ficou fora da tela (${vista.noMeio.caixa.join(' a ')} px, folga ${vista.folga} px): a coluna tinha de grudar pelo pé`);
    if (vista.pertoDoFim && !vista.pertoDoFim.ok) failures.push(`${onde} perto do fim do editor a arte aberta ficou fora da tela (${vista.pertoDoFim.caixa.join(' a ')} px, folga ${vista.folga} px): a coluna tinha de grudar pelo pé`);
    if (!vista.noMeio) warnings.push(`${onde} o editor passou da coluna só ${vista.folga} px (${JSON.stringify(vista.alturas)}): a cola pelo pé não foi posta à prova`);
    await contexto.close();
  }

  /*
    O seletor de ocasião como cardápio (pedido do dono, 23/09/2026: a lista do navegador e depois o
    painel de pílulas "desse jeito não fica bom"). Na tela larga ele flutua: abrir não empurra a lista de
    modelos, as ocasiões saem em colunas, cabe inteiro sem rolagem própria em 1280x800, cada ocasião diz
    quantos modelos tem, e fecha com um clique fora. No celular é uma folha modal que fecha no X e no
    fundo escurecido. Pelo teclado, a seta anda entre as ocasiões.
  */
  if (roda('cardapio')) {
    const { TEMPLATES: catalogoDoCardapio } = await import('../simulador/modelos.js');
    const doNatal = catalogoDoCardapio.filter((m) => m.categoria === 'natal' || (m.tambemEm || []).includes('natal')).length;
    for (const [w7, h7, toque] of [[1280, 800, false], [390, 844, true]]) {
      const contexto = await browser.newContext({ viewport: { width: w7, height: h7 }, hasTouch: toque, isMobile: toque });
      const pc = await contexto.newPage();
      await pc.goto(servidor.url + 'caneca-3d.html', { waitUntil: 'load' });
      await pc.waitForTimeout(900);
      await pc.evaluate(() => document.getElementById('boasvindas-fechar')?.click());
      await pc.evaluate(() => { const b = document.getElementById('categoria-modelo'); window.scrollTo({ top: b.getBoundingClientRect().top + window.scrollY - 120, behavior: 'instant' }); });
      await pc.waitForTimeout(200);
      const antes = await pc.evaluate(() => Math.round(document.getElementById('model-list').getBoundingClientRect().top));
      if (toque) await pc.tap('#categoria-modelo'); else await pc.click('#categoria-modelo');
      await pc.waitForTimeout(400);
      const cardapio = await pc.evaluate(() => {
        const painel = document.getElementById('painel-assuntos');
        const titulos = [...painel.querySelectorAll('.studio-assunto__titulo')];
        const natal = painel.querySelector('[data-assunto="natal"] .studio-assunto__conta');
        return {
          aberto: painel.open, modal: painel.matches(':modal'),
          colunas: new Set(titulos.map((t) => Math.round(t.getBoundingClientRect().left))).size,
          rolaPorDentro: painel.scrollHeight > painel.clientHeight + 2,
          natal: natal ? Number(natal.textContent) : null,
          semConta: [...painel.querySelectorAll('[data-assunto]')].filter((b) => !/^\d+$/.test(b.querySelector('.studio-assunto__conta')?.textContent || '')).length,
          lista: Math.round(document.getElementById('model-list').getBoundingClientRect().top),
          fechar: (() => { const x = document.getElementById('fechar-assuntos').getBoundingClientRect(); return x.width > 0 && x.height > 0; })(),
          dentro: (() => { const r = painel.getBoundingClientRect(); return r.left >= 0 && r.right <= window.innerWidth + 1; })(),
        };
      });
      const onde = `[cardápio ${w7}]`;
      if (!cardapio.aberto) failures.push(`${onde} o seletor de ocasião não abriu`);
      if (cardapio.natal !== doNatal) failures.push(`${onde} o Natal diz ${cardapio.natal} modelos; o catálogo tem ${doNatal}`);
      if (cardapio.semConta) failures.push(`${onde} ${cardapio.semConta} ocasião(ões) sem a contagem de modelos`);
      if (!cardapio.dentro) failures.push(`${onde} o cardápio sai para fora da tela`);
      if (toque) {
        if (!cardapio.modal || !cardapio.fechar) failures.push(`${onde} no celular o seletor tinha de abrir como folha, com o X (${JSON.stringify(cardapio)})`);
        if (cardapio.colunas < 2) failures.push(`${onde} a folha tem ${cardapio.colunas} coluna(s); cabem duas`);
        // o X fecha; e o toque no fundo escurecido também
        // Se o X ou o fundo falharem, a folha é fechada à força: aberta, ela deixaria o resto da página
        // inerte, e o próximo toque esperaria para sempre.
        const fechaAForca = () => pc.evaluate(() => { const d = document.getElementById('painel-assuntos'); const ficou = d.open; d.close(); return !ficou; });
        if (cardapio.fechar) await pc.tap('#fechar-assuntos');
        await pc.waitForTimeout(300);
        const fechouNoX = await fechaAForca();
        await pc.tap('#categoria-modelo');
        await pc.waitForTimeout(400);
        await pc.touchscreen.tap(Math.round(w7 / 2), 30);
        await pc.waitForTimeout(300);
        const fechouNoFundo = await fechaAForca();
        if (!fechouNoX || !fechouNoFundo) failures.push(`${onde} a folha não fecha no X (${fechouNoX}) ou no fundo escurecido (${fechouNoFundo})`);
      } else {
        if (cardapio.modal) failures.push(`${onde} na tela larga o seletor abriu como janela modal; tem de flutuar sobre a página`);
        if (Math.abs(cardapio.lista - antes) > 1) failures.push(`${onde} abrir o seletor empurrou a lista de modelos ${cardapio.lista - antes} px`);
        if (cardapio.colunas < 4) failures.push(`${onde} o cardápio tem ${cardapio.colunas} coluna(s); na tela larga são pelo menos quatro`);
        if (cardapio.rolaPorDentro) failures.push(`${onde} o cardápio não coube inteiro: rola por dentro em ${w7}x${h7}`);
        // pelo teclado: a seta desce do botão para a lista e anda entre as ocasiões
        await pc.keyboard.press('ArrowDown');
        await pc.keyboard.press('ArrowDown');
        const noTeclado = await pc.evaluate(() => document.activeElement?.dataset.assunto || document.activeElement?.id);
        if (!noTeclado || noTeclado === 'todos' || noTeclado === 'categoria-modelo') failures.push(`${onde} a seta não anda entre as ocasiões (foco em ${noTeclado})`);
        // um clique fora fecha, sem escolher nada
        await pc.mouse.click(Math.round(w7 * 0.25), h7 - 40);
        await pc.waitForTimeout(250);
        const fora = await pc.evaluate(() => ({ aberto: document.getElementById('painel-assuntos').open, rotulo: document.getElementById('categoria-modelo').textContent.trim() }));
        if (fora.aberto || fora.rotulo !== 'Todos os modelos') failures.push(`${onde} o clique fora não fechou o cardápio, ou escolheu algo (${JSON.stringify(fora)})`);
      }
      await contexto.close();
    }
  }

  /*
    A Minha arte em camadas (pedido do dono, 23/09/2026: "o nome eu não consigo mexer, ele sempre vai
    ficar embaixo"; "se eu coloco o Pandinha, a foto eu não consigo expandir"; "quero ter a liberdade de
    mover o nome, aumentar, diminuir, colocar mais de um Pandinha"). O caso é o do dono: um rascunho de
    antes das camadas, com a arte ao redor e o nome "Prof. Amanda" em Indie Flower, sem Pandinha.
    - o rascunho guardado não some ao abrir a página duas vezes sem tocar em "Continuar de onde parei";
    - ele abre na Minha arte com as abas de Frases e Enfeites, e o nome já é frase, na letra carregada;
    - a arte ocupa a altura inteira (o rodapé que guardava lugar para nome e Pandinha não existe mais);
    - arrastar o nome com o mouse na arte aberta o leva junto;
    - "+ Pandinha" duas vezes dá dois Pandinhas lado a lado, não um escondido embaixo do outro.
    O nome e os Pandinhas são achados pela tinta escura na arte aberta, como a gente acharia olhando.
  */
  if (roda('minha-arte')) {
    const contexto = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const pa = await contexto.newPage();
    const errosDaArte = [];
    pa.on('pageerror', (e) => errosDaArte.push(e.message));
    await pa.goto(servidor.url + 'caneca-3d.html', { waitUntil: 'load' });
    await pa.waitForTimeout(900);
    await pa.evaluate(async () => {
      const tela = document.createElement('canvas');
      tela.width = 1400; tela.height = 600;
      const c = tela.getContext('2d');
      c.fillStyle = 'rgb(110, 140, 103)'; // a arte de teste: uma cor só, de ponta a ponta
      c.fillRect(0, 0, tela.width, tela.height);
      const arteLivre = await new Promise((r) => tela.toBlob(r, 'image/png'));
      const banco = await new Promise((ok, erro) => {
        const pedido = indexedDB.open('panda-mimo-caneca', 1);
        pedido.onupgradeneeded = () => { if (!pedido.result.objectStoreNames.contains('rascunho')) pedido.result.createObjectStore('rascunho'); };
        pedido.onsuccess = () => ok(pedido.result);
        pedido.onerror = () => erro(pedido.error);
      });
      await new Promise((ok, erro) => {
        const tx = banco.transaction('rascunho', 'readwrite');
        tx.objectStore('rascunho').put({
          versao: 4, arte: null, arteLivre, nomeDaArte: 'arte-ao-redor.png', fotos: {}, salvoEm: Date.now(),
          escolhas: { inside: 'branca', handle: 'branca', layout: 'wrap', scale: 1, offsetX: 0, offsetY: 0, rotation: 0, name: 'Prof. Amanda', fontFamily: 'Indie Flower', withPanda: false },
        }, 'atual');
        tx.oncomplete = ok;
        tx.onerror = () => erro(tx.error);
      });
      banco.close();
    });
    // duas aberturas seguidas, sem tocar em nada, cada uma esperando mais que o 1,2 s do salvamento
    await pa.reload({ waitUntil: 'load' });
    await pa.waitForTimeout(2800);
    await pa.reload({ waitUntil: 'load' });
    const oferecido = await pa.waitForFunction(() => !document.getElementById('rascunho').hidden, null, { timeout: 12000 }).then(() => true).catch(() => false);
    if (!oferecido) failures.push('[minha arte] o rascunho sumiu ao abrir a página duas vezes sem tocar em "Continuar de onde parei"');
    else {
      await pa.click('#rascunho-continuar');
      await pa.waitForFunction(() => document.querySelectorAll('#lista-frases .studio-item').length > 0, null, { timeout: 12000 }).catch(() => {});
      await pa.evaluate(() => document.getElementById('flat-art').scrollIntoView({ block: 'center', behavior: 'instant' }));
      await pa.waitForTimeout(700);
      // Onde está a tinta escura (o nome e os Pandinhas) na arte aberta, e de que cor é um ponto dela.
      const olha = () => pa.evaluate(() => {
        const flat = document.getElementById('flat-art');
        const d = flat.getContext('2d').getImageData(0, 0, flat.width, flat.height).data;
        const escuro = (i) => d[i] < 70 && d[i + 1] < 70 && d[i + 2] < 70;
        let x0 = Infinity, x1 = -1, y0 = Infinity, y1 = -1, n = 0;
        const faixa = { x0: Infinity, x1: -1 };
        for (let y = 0; y < flat.height; y += 2) {
          for (let x = 0; x < flat.width; x += 2) {
            const i = (y * flat.width + x) * 4;
            if (!escuro(i)) continue;
            n += 1; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
            if (y > flat.height * 0.62 && y < flat.height * 0.94) { faixa.x0 = Math.min(faixa.x0, x); faixa.x1 = Math.max(faixa.x1, x); }
          }
        }
        const ponto = (fx, fy) => { const i = (Math.round(fy * flat.height) * flat.width + Math.round(fx * flat.width)) * 4; return [d[i], d[i + 1], d[i + 2]]; };
        const caixa = flat.getBoundingClientRect();
        return {
          tinta: n ? { cx: (x0 + x1) / 2 / flat.width, cy: (y0 + y1) / 2 / flat.height } : null,
          larguraDaFaixa: faixa.x1 >= 0 ? (faixa.x1 - faixa.x0) / flat.width : 0,
          cantoDeBaixo: ponto(0.08, 0.975), cantoDeCima: ponto(0.92, 0.03),
          tela: { left: caixa.left, top: caixa.top, width: caixa.width, height: caixa.height },
        };
      });
      // A letra chega pela rede: espera por ela (com limite), em vez de olhar uma vez só.
      await pa.waitForFunction(() => [...document.fonts].some((f) => f.family.replace(/"/g, '') === 'Indie Flower' && f.status === 'loaded'), null, { timeout: 10000 }).catch(() => {});
      const migrada = await pa.evaluate(() => ({
        abas: [...document.querySelectorAll('#abas button')].map((b) => b.dataset.aba).join(','),
        frases: [...document.querySelectorAll('#lista-frases .studio-item__texto > span')].map((t) => t.textContent),
        letra: [...document.fonts].filter((f) => f.family.replace(/"/g, '') === 'Indie Flower').map((f) => f.status),
        pandinhas: document.querySelectorAll('#lista-enfeites .studio-item').length,
      }));
      const antes = await olha();
      const ehArte = ([r, g, b]) => Math.abs(r - 110) < 14 && Math.abs(g - 140) < 14 && Math.abs(b - 103) < 14;
      if (migrada.abas !== 'modelo,arte,frases,enfeites') failures.push(`[minha arte] o rascunho não abriu na Minha arte com frases e enfeites (${migrada.abas})`);
      if (migrada.frases.join('|') !== 'Prof. Amanda') failures.push(`[minha arte] o nome do rascunho antigo não virou frase (${JSON.stringify(migrada.frases)})`);
      if (!migrada.letra.includes('loaded')) failures.push(`[minha arte] a letra do nome (Indie Flower) não carregou: o nome sai na letra padrão do navegador (${JSON.stringify(migrada.letra)})`);
      if (migrada.pandinhas !== 0) failures.push(`[minha arte] apareceu Pandinha num rascunho que não tinha (${migrada.pandinhas})`);
      if (!ehArte(antes.cantoDeBaixo) || !ehArte(antes.cantoDeCima)) failures.push(`[minha arte] a arte ao redor não ocupa a altura inteira: embaixo ${antes.cantoDeBaixo}, em cima ${antes.cantoDeCima}`);
      if (!antes.tinta) failures.push('[minha arte] o nome não aparece na arte aberta');
      else {
        // arrasta o nome com o mouse, de onde a tinta está para mais acima e à direita
        const de = { x: antes.tela.left + antes.tinta.cx * antes.tela.width, y: antes.tela.top + antes.tinta.cy * antes.tela.height };
        const para = { x: de.x + antes.tela.width * 0.2, y: antes.tela.top + antes.tela.height * 0.35 };
        await pa.mouse.move(de.x, de.y);
        await pa.mouse.down();
        await pa.mouse.move((de.x + para.x) / 2, (de.y + para.y) / 2, { steps: 6 });
        await pa.mouse.move(para.x, para.y, { steps: 6 });
        await pa.mouse.up();
        await pa.waitForTimeout(500);
        const depois = await olha();
        const andou = depois.tinta ? { dx: depois.tinta.cx - antes.tinta.cx, dy: depois.tinta.cy - antes.tinta.cy } : null;
        if (!andou || andou.dx < 0.12 || andou.dy > -0.2) failures.push(`[minha arte] arrastar o nome na arte aberta não o levou junto (${JSON.stringify(andou)})`);
        // dois Pandinhas: o segundo nasce ao lado do primeiro
        await pa.click('#abas [data-aba="arte"]');
        await pa.click('#arte-add-pandinha');
        await pa.waitForTimeout(900);
        const umPandinha = await olha();
        await pa.click('#abas [data-aba="arte"]');
        await pa.click('#arte-add-pandinha');
        await pa.waitForTimeout(900);
        const doisPandinhas = await olha();
        const pandinhas = await pa.evaluate(() => document.querySelectorAll('#lista-enfeites .studio-item').length);
        if (pandinhas !== 2) failures.push(`[minha arte] dois toques em "+ Pandinha" deram ${pandinhas} Pandinha(s)`);
        if (!(umPandinha.larguraDaFaixa > 0) || doisPandinhas.larguraDaFaixa < umPandinha.larguraDaFaixa * 1.5) {
          failures.push(`[minha arte] os dois Pandinhas nasceram um em cima do outro (faixa de ${umPandinha.larguraDaFaixa.toFixed(3)} para ${doisPandinhas.larguraDaFaixa.toFixed(3)} da largura)`);
        }
      }
    }
    for (const e of errosDaArte) failures.push(`[minha arte] erro: ${e}`);
    await contexto.close();
  }

  // Cada miniatura do catálogo custa cerca de 5,5 ms e 300 KB de canvas. Desenhar as 138 de uma vez
  // seriam 0,8 s de tela parada e 40 MB de memória, e num celular médio bem mais. Elas nascem quando
  // o cartão chega perto da área visível da lista — o que não pode virar cartão em branco.
  if (roda('miniaturas')) {
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
  if (roda('camera')) for (const [nome, toque, deveTer] of [['celular', true, true], ['computador', false, false]]) {
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
  if (roda('provas')) {
    const contexto = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const pp = await contexto.newPage();
    const erros = [];
    pp.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
    pp.on('pageerror', (e) => erros.push(e.message));
    await pp.goto(servidor.url + 'qa/provas-colecoes.html', { waitUntil: 'load' });
    // Espera a página avisar que as imagens do acervo chegaram e a arte foi redesenhada com elas.
    await pp.waitForSelector('body[data-pronto]', { timeout: 20000 }).catch(() => failures.push('[provas] a página de provas não terminou de carregar as imagens'));
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
  /*
    O estúdio dentro do site (pedido do dono, 23/09/2026): a seção "Monte seu mimo" é o estúdio da caneca
    em 360°, no lugar do simulador de desenho.
    - a abertura do site não baixa o estúdio: ele só chega quando a seção se aproxima;
    - rolando até a seção, ele abre sem erro, sem id repetido e sem o simulador antigo;
    - a caneca gruda logo abaixo da barra do topo do site, nunca por baixo dela;
    - o botão flutuante do WhatsApp sai do caminho sobre o estúdio;
    - escolher o modelo fica em Modelo, e o pedido vai para o WhatsApp com a montagem;
    - o link de montagem copiado ali abre a home já com o estúdio e a montagem;
    - "Ver com meu nome" aparece no detalhe da caneca, da garrafa e da ecobag e leva ao estúdio já na
      peça; no das peças que o estúdio ainda não monta (o copo, por enquanto), não aparece.
  */
  /*
    As peças do estúdio (decisão do dono, 23/09/2026: o estúdio cresce para a garrafa e a ecobag).
    - A linha "Qual peça?" fica acima das duas colunas e nada a cobre: dentro da grade, a coluna da peça,
      grudada pelo pé, subia por cima dela.
    - Trocar para a garrafa troca o 3D e a ARTE dele: quando o canvas da arte mudava de medida (a da
      garrafa é mais alta), o corpo da garrafa continuava mostrando a arte da caneca.
    - Textos, cores, vistas e pedido são da garrafa; ela não tem acabamento para escolher; a arte aberta
      tem a proporção dela; o catálogo não mostra modelo da caneca; e o arquivo de impressão sai na medida
      da garrafa e sem fundo (quem pinta ali é a cor da garrafa).
    - A caneca volta como estava, com o modelo escolhido e os textos dela.
  */
  if (roda('pecas')) for (const [w9, h9, toque] of [[1280, 800, false], [390, 844, true]]) {
    const contexto = await browser.newContext({ viewport: { width: w9, height: h9 }, hasTouch: toque, isMobile: toque, acceptDownloads: true });
    const pp = await contexto.newPage();
    const onde = `[peças ${w9}]`;
    const erros = [];
    pp.on('pageerror', (e) => erros.push(e.message));
    pp.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
    await pp.route('**/rest/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[{"whatsapp":"5511999999999"}]' }));
    await pp.goto(servidor.url + 'caneca-3d.html', { waitUntil: 'load' });
    const abriu = await pp.waitForFunction(() => document.getElementById('viewer-loading')?.hidden && document.querySelector('#mug-viewport canvas.mug-3d-canvas'), null, { timeout: 20000 }).then(() => true).catch(() => false);
    if (!abriu) { failures.push(`${onde} o estúdio não abriu`); await contexto.close(); continue; }
    await pp.click('#boasvindas-fechar').catch(() => {});
    const linha = await pp.evaluate(async () => {
      const espera = (ms) => new Promise((r) => setTimeout(r, ms));
      const cobertos = [];
      for (const y of [0, 40]) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await espera(90);
        for (const b of document.querySelectorAll('[data-peca-botao]')) {
          const r = b.getBoundingClientRect();
          if (r.bottom <= 0 || r.top >= innerHeight) continue;
          const no = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          if (!b.contains(no)) cobertos.push(`${b.dataset.pecaBotao} com a página em ${y} px, por ${no?.className || no?.tagName}`);
        }
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
      return { cobertos, pressionada: document.querySelector('[data-peca-botao][aria-pressed="true"]')?.dataset.pecaBotao };
    });
    if (linha.pressionada !== 'caneca') failures.push(`${onde} o estúdio não abriu na caneca (${linha.pressionada})`);
    if (linha.cobertos.length) failures.push(`${onde} a linha "Qual peça?" ficou coberta: ${linha.cobertos.join('; ')}`);
    // Algo montado na caneca, para conferir na volta.
    await pp.evaluate(() => document.querySelector('.studio-model[data-modelo="namorados-coracoes"]').click());
    await pp.waitForTimeout(400);
    await pp.locator('[data-peca-botao="garrafa"]').click();
    const trocou = await pp.waitForFunction(() => document.querySelector('[data-peca-botao="garrafa"]')?.getAttribute('aria-pressed') === 'true', null, { timeout: 15000 }).then(() => true).catch(() => false);
    if (!trocou) { failures.push(`${onde} o botão "Garrafa" não trocou a peça`); await contexto.close(); continue; }
    const salvia = pp.locator('#cores-corpo [data-cor="salvia"]');
    if (!(await salvia.isVisible().catch(() => false))) failures.push(`${onde} as cores da garrafa não estão à vista`);
    else await salvia.click();
    await pp.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await pp.waitForTimeout(900);
    // O corpo da garrafa, no meio da prévia, tem de sair na cor escolhida (sálvia puxa para o verde).
    const foto3d = (await pp.locator('#mug-viewport canvas.mug-3d-canvas').screenshot()).toString('base64');
    const corDoCorpo = await pp.evaluate(async (b64) => {
      const img = new Image();
      await new Promise((ok) => { img.onload = ok; img.src = `data:image/png;base64,${b64}`; });
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      // Um pedaço liso do corpo, abaixo do meio da frente (onde a peça vazia mostra o Pandinha).
      const d = g.getImageData(Math.round(img.width * 0.49), Math.round(img.height * 0.8), Math.max(2, Math.round(img.width * 0.03)), Math.max(2, Math.round(img.height * 0.04))).data;
      let r = 0, gr = 0, bl = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; gr += d[i + 1]; bl += d[i + 2]; n += 1; }
      return { r: Math.round(r / n), g: Math.round(gr / n), b: Math.round(bl / n) };
    }, foto3d);
    if (!(corDoCorpo.g > corDoCorpo.r + 8 && corDoCorpo.g > corDoCorpo.b + 8)) failures.push(`${onde} a garrafa sálvia não saiu sálvia na prévia (média ${JSON.stringify(corDoCorpo)}): a textura da peça de antes ficou`);
    const naGarrafa = await pp.evaluate(() => {
      const zap = new URL(document.getElementById('mug-order').href, location.href).searchParams.get('text') || document.getElementById('mug-order').dataset.msg || '';
      const plana = document.getElementById('flat-art');
      return {
        zap,
        titulo: document.querySelector('[data-texto="tituloHand"]')?.textContent,
        ajuda: document.querySelector('[data-texto="ajudaDasCores"]')?.textContent,
        vistas: [...document.querySelectorAll('.studio-view-buttons [data-view]')].map((b) => b.textContent).join(','),
        acabamento: !document.getElementById('peca-acabamento').hidden,
        interior: !document.getElementById('cores-interior').closest('[data-peca]').hidden,
        proporcao: plana.width / plana.height,
        medida: document.getElementById('flat-medida')?.textContent,
        daCaneca: [...document.querySelectorAll('#model-list .studio-model[data-modelo]:not([data-modelo=""])')].filter((b) => !b.dataset.modelo.startsWith('garrafa-')).map((b) => b.dataset.modelo).slice(0, 3),
      };
    });
    if (!/Montei uma garrafa/.test(naGarrafa.zap) || !/Cor da garrafa: Sálvia/.test(naGarrafa.zap)) failures.push(`${onde} o pedido não diz que é a garrafa sálvia (${naGarrafa.zap.slice(0, 90)})`);
    if (naGarrafa.titulo !== 'Sua garrafa.' || !/tampa e a alça/.test(naGarrafa.ajuda || '')) failures.push(`${onde} os textos continuaram os da caneca (${naGarrafa.titulo} · ${naGarrafa.ajuda})`);
    if (naGarrafa.vistas !== 'Frente,Verso,Alça,Tampa') failures.push(`${onde} as vistas da garrafa estão erradas (${naGarrafa.vistas})`);
    if (naGarrafa.acabamento) failures.push(`${onde} a garrafa oferece acabamento, que ela não tem`);
    if (naGarrafa.interior) failures.push(`${onde} as bolinhas de interior e alça da caneca continuam na garrafa`);
    if (Math.abs(naGarrafa.proporcao - 230 / 180) > 0.02 || naGarrafa.medida !== 'área de 23 × 18 cm') failures.push(`${onde} a arte aberta não tem a medida da garrafa (${naGarrafa.proporcao.toFixed(3)} · ${naGarrafa.medida})`);
    if (naGarrafa.daCaneca.length) failures.push(`${onde} o catálogo da garrafa mostra modelo da caneca (${naGarrafa.daCaneca.join(', ')})`);
    // Os modelos da garrafa (primeira leva, 23/09/2026): o catálogo e o cardápio são dela, a miniatura
    // mostra a arte sobre a cor da garrafa, e a tinta das frases vira papel na garrafa preta (manual 7.4).
    const catalogo = await pp.evaluate(() => {
      const itens = [...document.querySelectorAll('#lista-assuntos [data-assunto]')].map((b) => [b.dataset.assunto, Number(b.querySelector('.studio-assunto__conta')?.textContent)]);
      const miniatura = document.querySelector('#model-list .studio-model[data-modelo^="garrafa-"] canvas');
      const canto = miniatura ? [...miniatura.getContext('2d').getImageData(2, 2, 1, 1).data].slice(0, 3) : null;
      return {
        modelos: document.querySelectorAll('#model-list .studio-model[data-modelo^="garrafa-"]').length,
        ocasioes: itens.filter(([id]) => id !== 'todos' && id !== 'meus'),
        canto,
      };
    });
    if (catalogo.modelos < 8) failures.push(`${onde} o catálogo da garrafa tem ${catalogo.modelos} modelos dela, e não os 8 da primeira leva`);
    if (!catalogo.ocasioes.length || catalogo.ocasioes.some(([id, conta]) => !id.startsWith('garrafa-') || conta < 4)) failures.push(`${onde} o cardápio da garrafa mostra ocasião que não é dela ou magra (${JSON.stringify(catalogo.ocasioes)})`);
    if (!catalogo.canto || Math.abs(catalogo.canto[0] - 168) > 6 || Math.abs(catalogo.canto[1] - 197) > 6 || Math.abs(catalogo.canto[2] - 162) > 6) failures.push(`${onde} a miniatura do modelo não mostra a arte sobre a garrafa sálvia (canto ${JSON.stringify(catalogo.canto)})`);
    await pp.evaluate(() => document.querySelector('#model-list .studio-model[data-modelo="garrafa-nome-grande"]')?.click());
    await pp.waitForTimeout(400);
    await pp.locator('#cores-corpo [data-cor="preta"]').click();
    await pp.waitForTimeout(400);
    const naPreta = await pp.evaluate(() => ({
      tinta: getComputedStyle(document.documentElement).getPropertyValue('--tinta-da-peca').trim().toUpperCase(),
      papel: getComputedStyle(document.documentElement).getPropertyValue('--paper').trim().toUpperCase(),
      zap: new URL(document.getElementById('mug-order').href, location.href).searchParams.get('text') || document.getElementById('mug-order').dataset.msg || '',
    }));
    if (!naPreta.tinta || naPreta.tinta !== naPreta.papel) failures.push(`${onde} na garrafa preta a tinta das frases não virou papel (${naPreta.tinta})`);
    if (!/Modelo: Nome em destaque/.test(naPreta.zap) || !/Cor da garrafa: Preta/.test(naPreta.zap)) failures.push(`${onde} o pedido não leva o modelo e a cor da garrafa (${naPreta.zap.slice(0, 120)})`);
    await pp.locator('#cores-corpo [data-cor="salvia"]').click();
    await pp.waitForTimeout(300);
    // O arquivo de impressão: na medida da garrafa (230 × 180 mm a 300 dpi) e sem fundo.
    const [baixado] = await Promise.all([
      pp.waitForEvent('download', { timeout: 20000 }).catch(() => null),
      pp.evaluate(() => document.getElementById('save-print').click()),
    ]);
    if (!baixado) failures.push(`${onde} "Baixar arte plana" não baixou nada na garrafa`);
    else {
      const nome = baixado.suggestedFilename();
      const bytes = fs.readFileSync(await baixado.path());
      const largura = bytes.readUInt32BE(16), altura = bytes.readUInt32BE(20), tipoDeCor = bytes[25];
      if (nome !== 'garrafa-panda-mimo-arte-230x180mm-300dpi.png') failures.push(`${onde} a arte da garrafa saiu com o nome ${nome}`);
      if (largura !== 2717 || altura !== 2126) failures.push(`${onde} a arte da garrafa saiu em ${largura} × ${altura} px, e não 2717 × 2126 (230 × 180 mm a 300 dpi)`);
      const canto = await pp.evaluate(async (b64) => {
        const img = new Image();
        await new Promise((ok) => { img.onload = ok; img.src = `data:image/png;base64,${b64}`; });
        const c = document.createElement('canvas'); c.width = 8; c.height = 8;
        const g = c.getContext('2d'); g.drawImage(img, 0, 0);
        return g.getImageData(1, 1, 1, 1).data[3];
      }, bytes.toString('base64'));
      if (tipoDeCor !== 6 || canto !== 0) failures.push(`${onde} a arte da garrafa saiu com fundo pintado (canto com alfa ${canto}): ela vai sobre a cor da peça`);
    }
    // A ecobag, a peça plana: arte só na frente (sem "Onde vai a arte?"), painel em pé de 25 × 30 cm,
    // três cenas (ela não sobe na caixa de presente), os modelos dela e o arquivo sem fundo na medida.
    await pp.locator('[data-peca-botao="ecobag"]').click();
    const foiEcobag = await pp.waitForFunction(() => document.querySelector('[data-peca-botao="ecobag"]')?.getAttribute('aria-pressed') === 'true', null, { timeout: 15000 }).then(() => true).catch(() => false);
    if (!foiEcobag) failures.push(`${onde} o botão "Ecobag" não trocou a peça`);
    else {
      await pp.waitForTimeout(700);
      const naEcobag = await pp.evaluate(() => {
        const plana = document.getElementById('flat-art');
        return {
          zap: new URL(document.getElementById('mug-order').href, location.href).searchParams.get('text') || '',
          vistas: [...document.querySelectorAll('.studio-view-buttons [data-view]')].map((b) => b.textContent).join(','),
          ondeVai: !document.querySelector('.studio-layout-field').hidden,
          cenas: document.querySelectorAll('#cenas button').length,
          proporcao: plana.width / plana.height,
          medida: document.getElementById('flat-medida')?.textContent,
          modelos: [...document.querySelectorAll('#model-list .studio-model[data-modelo]:not([data-modelo=""])')].map((b) => b.dataset.modelo),
          ajuda: document.querySelector('[data-texto="ajudaDasCores"]')?.textContent,
        };
      });
      if (!/Montei uma ecobag/.test(naEcobag.zap)) failures.push(`${onde} o pedido não diz que é a ecobag (${naEcobag.zap.slice(0, 80)})`);
      if (naEcobag.vistas !== 'Frente,Verso,Lado,Por dentro') failures.push(`${onde} as vistas da ecobag estão erradas (${naEcobag.vistas})`);
      if (naEcobag.ondeVai) failures.push(`${onde} a ecobag oferece "Onde vai a arte?", mas a arte dela vai só na frente`);
      if (naEcobag.cenas !== 3) failures.push(`${onde} a ecobag tem ${naEcobag.cenas} cenas, e não as três dela`);
      if (Math.abs(naEcobag.proporcao - 250 / 300) > 0.02 || naEcobag.medida !== 'área de 25 × 30 cm') failures.push(`${onde} a arte aberta não tem a medida da ecobag (${naEcobag.proporcao.toFixed(3)} · ${naEcobag.medida})`);
      if (naEcobag.modelos.length < 8 || naEcobag.modelos.some((id) => !id.startsWith('ecobag-'))) failures.push(`${onde} o catálogo da ecobag não é o dela (${naEcobag.modelos.slice(0, 4).join(', ')})`);
      if (!/Algodão cru/.test(naEcobag.ajuda || '')) failures.push(`${onde} a ecobag não diz a cor do tecido (${naEcobag.ajuda})`);
      const [arquivo] = await Promise.all([
        pp.waitForEvent('download', { timeout: 20000 }).catch(() => null),
        pp.evaluate(() => document.getElementById('save-print').click()),
      ]);
      if (!arquivo) failures.push(`${onde} "Baixar arte plana" não baixou nada na ecobag`);
      else {
        const bytes = fs.readFileSync(await arquivo.path());
        const largura = bytes.readUInt32BE(16), altura = bytes.readUInt32BE(20);
        if (arquivo.suggestedFilename() !== 'ecobag-panda-mimo-arte-250x300mm-300dpi.png' || largura !== 2953 || altura !== 3543 || bytes[25] !== 6) {
          failures.push(`${onde} a arte da ecobag saiu como ${arquivo.suggestedFilename()}, ${largura} × ${altura} px, tipo de cor ${bytes[25]} (esperado 2953 × 3543, com transparência)`);
        }
      }
    }
    // De volta à caneca: o modelo escolhido e os textos dela.
    await pp.locator('[data-peca-botao="caneca"]').click();
    const voltou = await pp.waitForFunction(() => document.querySelector('[data-peca-botao="caneca"]')?.getAttribute('aria-pressed') === 'true', null, { timeout: 15000 }).then(() => true).catch(() => false);
    await pp.waitForTimeout(500);
    const naCaneca = await pp.evaluate(() => ({
      modelo: document.querySelector('#model-list .studio-model[aria-pressed="true"]')?.dataset.modelo,
      ajuda: document.querySelector('[data-texto="ajudaDasCores"]')?.textContent,
      vistas: [...document.querySelectorAll('.studio-view-buttons [data-view]')].map((b) => b.textContent).join(','),
      acabamento: !document.getElementById('peca-acabamento').hidden,
      proporcao: document.getElementById('flat-art').width / document.getElementById('flat-art').height,
    }));
    if (!voltou || naCaneca.modelo !== 'namorados-coracoes') failures.push(`${onde} a caneca não voltou com a montagem dela (${JSON.stringify(naCaneca)})`);
    if (naCaneca.ajuda !== 'Por fora, branca. O carinho fica por sua conta.' || naCaneca.vistas !== 'Frente,Verso,Alça,Interior' || !naCaneca.acabamento) failures.push(`${onde} a caneca voltou sem os textos, as vistas ou o acabamento dela (${JSON.stringify(naCaneca)})`);
    if (Math.abs(naCaneca.proporcao - 210 / 90) > 0.02) failures.push(`${onde} a arte aberta da caneca ficou com a proporção da garrafa (${naCaneca.proporcao.toFixed(3)})`);
    erros.forEach((e) => failures.push(`${onde} erro: ${e}`));
    await contexto.close();
  }

  if (roda('estudio-no-site')) for (const [w8, h8, toque] of [[1280, 800, false], [390, 844, true]]) {
    const contexto = await browser.newContext({ viewport: { width: w8, height: h8 }, hasTouch: toque, isMobile: toque, permissions: ['clipboard-read', 'clipboard-write'] });
    const ph = await contexto.newPage();
    const errosDaHome = [];
    const pedidos = [];
    ph.on('pageerror', (e) => errosDaHome.push(e.message));
    ph.on('request', (r) => pedidos.push(r.url()));
    await ph.goto(servidor.url + 'index.html', { waitUntil: 'load' });
    await ph.waitForTimeout(1200);
    const onde = `[estúdio no site ${w8}]`;
    const cedo = pedidos.filter((u) => /\/simulador\/|three/.test(u));
    if (cedo.length) failures.push(`${onde} a abertura do site já baixou o estúdio (${cedo.slice(0, 3).map((u) => u.split('/').pop()).join(', ')})`);
    await ph.evaluate(() => document.getElementById('monte').scrollIntoView({ block: 'start', behavior: 'instant' }));
    const abriu = await ph.waitForFunction(() => !!document.querySelector('#estudio-no-site canvas.mug-3d-canvas'), null, { timeout: 20000 }).then(() => true).catch(() => false);
    if (!abriu) {
      failures.push(`${onde} o estúdio não abriu na seção Monte seu mimo`);
    } else {
      await ph.waitForTimeout(800);
      const pagina = await ph.evaluate(() => {
        const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
        return {
          repetidos: [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))],
          lateral: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          velho: !!document.getElementById('builder') || !!document.querySelector('.preview'),
        };
      });
      if (pagina.repetidos.length) failures.push(`${onde} id repetido na página: ${pagina.repetidos.join(', ')}`);
      if (pagina.lateral) failures.push(`${onde} rolagem lateral com o estúdio na página`);
      if (pagina.velho) failures.push(`${onde} o simulador de desenho continua na página`);
      // Rola pelo estúdio como gente: a peça que gruda pelo topo (a caneca no celular, a coluna no
      // computador quando cabe) tem de parar logo abaixo da barra do site, e o botão flutuante some.
      const grude = await ph.evaluate(async () => {
        const espera = (ms) => new Promise((r) => setTimeout(r, ms));
        const barra = document.querySelector('.topbar');
        const alvo = document.querySelector(window.innerWidth < 760 ? '.studio-preview' : '.studio-coluna-peca');
        const caixa = document.querySelector('.studio-layout').getBoundingClientRect();
        const comeco = caixa.top + window.scrollY, fim = caixa.bottom + window.scrollY - window.innerHeight;
        let pior = 0, fabAparecendo = 0, vezes = 0;
        for (let y = comeco; y < fim; y += 120) {
          window.scrollTo({ top: y, behavior: 'instant' });
          await espera(60);
          vezes += 1;
          if (!document.querySelector('.fab')?.classList.contains('is-hidden')) fabAparecendo += 1;
          const pelaCabeca = getComputedStyle(alvo).position === 'sticky' && getComputedStyle(alvo).top !== 'auto';
          if (!pelaCabeca) continue;
          const b = barra.getBoundingClientRect().bottom;
          const r = alvo.getBoundingClientRect();
          if (r.top < b - 1 && r.bottom > b) pior = Math.max(pior, Math.round(b - r.top));
        }
        return { pior, fabAparecendo, vezes };
      });
      if (grude.pior) failures.push(`${onde} a caneca grudada ficou ${grude.pior} px por baixo da barra do topo do site`);
      if (grude.fabAparecendo > 1) failures.push(`${onde} o botão flutuante do WhatsApp apareceu por cima do estúdio (${grude.fabAparecendo} de ${grude.vezes} pontos da rolagem)`);
      // escolhe um modelo e confere o pedido
      await ph.evaluate(() => document.querySelector('#model-list .studio-model:not([data-modelo=""])').click());
      await ph.waitForTimeout(1200);
      const pedido = await ph.evaluate(() => ({ aba: document.querySelector('#abas [aria-selected="true"]')?.dataset.aba, zap: document.getElementById('mug-order').href }));
      if (pedido.aba !== 'modelo') failures.push(`${onde} escolher o modelo no site pulou para ${pedido.aba}`);
      if (!/^https:\/\/wa\.me\/\d+\?text=/.test(pedido.zap) || !/Modelo:/.test(decodeURIComponent(pedido.zap.replace(/\+/g, ' ')))) {
        failures.push(`${onde} o pedido do estúdio não vai para o WhatsApp com a montagem (${pedido.zap.slice(0, 70)})`);
      }
      if (!toque) {
        await ph.evaluate(() => document.getElementById('copiar-link').click());
        await ph.waitForTimeout(900);
        const link = await ph.evaluate(() => navigator.clipboard.readText().catch(() => ''));
        if (!/(index\.html|\/)#[jm]=/.test(link)) failures.push(`${onde} o link da montagem não aponta para a home (${link.slice(0, 60)})`);
        else {
          const nova = await contexto.newPage();
          nova.on('pageerror', (e) => errosDaHome.push(e.message));
          await nova.goto(link, { waitUntil: 'load' });
          const voltou = await nova.waitForFunction(() => !!document.querySelector('#model-list [aria-pressed="true"]:not([data-modelo=""])'), null, { timeout: 20000 }).then(() => true).catch(() => false);
          if (!voltou) failures.push(`${onde} o link da montagem não abriu o estúdio com a montagem na home`);
          await nova.close();
        }
      }
    }
    // "Ver com meu nome": no detalhe da caneca, da garrafa e da ecobag leva ao estúdio, já na peça; no do
    // copo (que o estúdio ainda não monta) não aparece. Até 23/09/2026 só a caneca mostrava.
    const detalhe = await ph.evaluate(async () => {
      const espera = (ms) => new Promise((r) => setTimeout(r, ms));
      const abre = async (slug) => {
        document.querySelector(`.product[data-slug="${slug}"] .product__ver`)?.click();
        await espera(350);
        const botao = document.getElementById('detalhe-personalizar');
        return { aberto: document.getElementById('detalhe').open, visivel: !!botao && !botao.hidden };
      };
      const naSecao = () => { const r = document.getElementById('monte').getBoundingClientRect(); return r.top < window.innerHeight * 0.5 && r.bottom > 0; };
      const pecaDoEstudio = () => document.querySelector('[data-peca-botao][aria-pressed="true"]')?.dataset.pecaBotao;
      const vaiAte = async (peca) => {
        // espera a chegada (a rolagem é suave) e a troca de peça, e não um tempo fixo
        for (let i = 0; i < 60 && !(naSecao() && pecaDoEstudio() === peca); i += 1) await espera(100);
        await espera(300);
        return { naSecao: naSecao(), peca: pecaDoEstudio(), fechou: !document.getElementById('detalhe').open };
      };
      const copo = await abre('copos-termicos');
      document.getElementById('detalhe').close();
      await espera(150);
      const garrafa = await abre('garrafas-termicas');
      document.getElementById('detalhe-personalizar').click();
      const foiNaGarrafa = await vaiAte('garrafa');
      const ecobag = await abre('ecobags');
      document.getElementById('detalhe-personalizar').click();
      const foiNaEcobag = await vaiAte('ecobag');
      const caneca = await abre('canecas');
      document.getElementById('detalhe-personalizar').click();
      const foiNaCaneca = await vaiAte('caneca');
      return { copo, garrafa, ecobag, caneca, foiNaGarrafa, foiNaEcobag, foiNaCaneca };
    });
    if (!detalhe.caneca.aberto || !detalhe.caneca.visivel) failures.push(`${onde} o detalhe da caneca não mostra "Ver com meu nome" (${JSON.stringify(detalhe.caneca)})`);
    if (!detalhe.garrafa.aberto || !detalhe.garrafa.visivel) failures.push(`${onde} o detalhe da garrafa não mostra "Ver com meu nome" (${JSON.stringify(detalhe.garrafa)})`);
    if (!detalhe.ecobag.aberto || !detalhe.ecobag.visivel) failures.push(`${onde} o detalhe da ecobag não mostra "Ver com meu nome" (${JSON.stringify(detalhe.ecobag)})`);
    if (detalhe.copo.visivel) failures.push(`${onde} o detalhe do copo mostra "Ver com meu nome", mas o estúdio ainda não monta copo`);
    if (!detalhe.foiNaEcobag.naSecao || !detalhe.foiNaEcobag.fechou || detalhe.foiNaEcobag.peca !== 'ecobag') failures.push(`${onde} "Ver com meu nome" da ecobag não abriu o estúdio na ecobag (${JSON.stringify(detalhe.foiNaEcobag)})`);
    if (!detalhe.foiNaGarrafa.naSecao || !detalhe.foiNaGarrafa.fechou || detalhe.foiNaGarrafa.peca !== 'garrafa') failures.push(`${onde} "Ver com meu nome" da garrafa não abriu o estúdio na garrafa (${JSON.stringify(detalhe.foiNaGarrafa)})`);
    if (!detalhe.foiNaCaneca.naSecao || !detalhe.foiNaCaneca.fechou || detalhe.foiNaCaneca.peca !== 'caneca') failures.push(`${onde} "Ver com meu nome" da caneca não levou ao estúdio na caneca (${JSON.stringify(detalhe.foiNaCaneca)})`);
    errosDaHome.forEach((e) => failures.push(`${onde} erro: ${e}`));
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
