/*
  A caneca pixel a pixel, antes e depois de uma mudança (criado em 23/09/2026, quando o estúdio passou a
  montar garrafa e ecobag e o código da caneca foi separado sem ela poder mudar).

    node qa/mede-caneca.mjs fotografa <pasta>            fotografa o estúdio da caneca em 1280 e 390
    node qa/mede-caneca.mjs compara <pasta A> <pasta B>  diz o que mudou entre as duas fotografias

  Fotografa o 3D em cada vista, cor, acabamento e cena, e a arte aberta direto do canvas, e anota as
  posições da página. Rode "fotografa" duas vezes antes da mudança e compare as duas: só vale como prova
  se sair idêntico. O que muda de propósito (a posição de tudo, quando algo entra acima do estúdio)
  aparece como MEDIDA; o que muda no desenho aparece como DIFERE, com quantos pixels.
*/
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const [modo, a, b] = process.argv.slice(2);
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = await import(pathToFileURL(path.join(RAIZ, 'node_modules/playwright/index.mjs')).href);

if (modo === 'fotografa') {
  const SAIDA = path.resolve(a);
  const pagina = b || 'caneca-3d.html';
  fs.mkdirSync(SAIDA, { recursive: true });
  const { servir } = await import(pathToFileURL(path.join(RAIZ, 'qa/servidor.mjs')).href);
  const servidor = await servir(RAIZ);
  const browser = await chromium.launch();
  const medidas = {};
  for (const [w, h, toque] of [[1280, 800, false], [390, 844, true]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: toque, isMobile: toque, reducedMotion: 'reduce', deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    const erros = [];
    p.on('pageerror', (e) => erros.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
    await p.route('**/rest/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[{"whatsapp":"5511999999999"}]' }));
    await p.goto(servidor.url + pagina, { waitUntil: 'load' });
    if (pagina !== 'caneca-3d.html') {
      await p.evaluate(() => document.getElementById('monte')?.scrollIntoView({ block: 'start', behavior: 'instant' }));
    }
    await p.waitForFunction(() => document.querySelector('#mug-viewport canvas.mug-3d-canvas') && document.getElementById('viewer-loading')?.hidden, null, { timeout: 45000 });
    await p.waitForTimeout(1500);
    const foto3d = async (nome) => {
      await p.waitForTimeout(450);
      await p.locator('#mug-viewport canvas.mug-3d-canvas').screenshot({ path: path.join(SAIDA, `${w}-3d-${nome}.png`) });
      const plana = await p.evaluate(() => document.getElementById('flat-art').toDataURL('image/png'));
      fs.writeFileSync(path.join(SAIDA, `${w}-plana-${nome}.png`), Buffer.from(plana.split(',')[1], 'base64'));
    };
    const mede = () => p.evaluate(() => {
      const caixa = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x + scrollX), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)]; };
      return {
        pagina: document.documentElement.scrollHeight,
        largura: document.documentElement.scrollWidth,
        coluna: caixa('.studio-coluna-peca'), previa: caixa('.studio-preview'), viewport: caixa('#mug-viewport'),
        detalhes: caixa('.studio-peca-detalhes'), opcoes: caixa('.studio-opcoes'), plana: caixa('#flat-art'),
        controles: caixa('.studio-controls'), abas: caixa('#abas'), pedido: caixa('#mug-order'),
        vistas: caixa('.studio-view-tools'), heading: caixa('.studio-heading'), layout: caixa('.studio-layout'),
        planaPx: [document.getElementById('flat-art').width, document.getElementById('flat-art').height],
        zap: document.getElementById('mug-order').href,
        textos: [...document.querySelectorAll('.studio-layout h2, .studio-layout .studio-help, .studio-caption p, .studio-gesture, .studio-flat p')].map((e) => e.textContent.trim()).join(' | '),
      };
    });
    medidas[`${w}-abertura`] = await mede();
    await foto3d('abertura');
    await p.evaluate(() => document.querySelector('.studio-model[data-modelo="namorados-coracoes"]').click());
    await p.waitForFunction(() => document.querySelector('.studio-model[data-modelo="namorados-coracoes"][aria-pressed="true"]'), null, { timeout: 8000 });
    await p.waitForTimeout(1200);
    medidas[`${w}-modelo`] = await mede();
    await foto3d('modelo-frente');
    for (const vista of ['back', 'handle', 'inside', 'front']) {
      await p.evaluate((v) => document.querySelector(`.studio-view-buttons [data-view="${v}"]`).click(), vista);
      await foto3d(`vista-${vista}`);
    }
    await p.evaluate(() => document.querySelector('[data-preset="rosa"]').click());
    await foto3d('rosa');
    await p.evaluate(() => document.querySelector('#acabamentos button:last-child').click());
    await foto3d('fosco');
    for (const i of [2, 4]) {
      await p.evaluate((n) => document.querySelector(`#cenas button:nth-child(${n})`).click(), i);
      await p.waitForTimeout(500);
      await foto3d(`cena-${i}`);
    }
    medidas[`${w}-fim`] = await mede();
    medidas[`${w}-erros`] = erros;
    await ctx.close();
  }
  fs.writeFileSync(path.join(SAIDA, 'medidas.json'), JSON.stringify(medidas, null, 1));
  console.log(JSON.stringify(Object.fromEntries(Object.entries(medidas).map(([k, v]) => [k, Array.isArray(v) ? v : { pagina: v.pagina, plana: v.plana, coluna: v.coluna }])), null, 1));
  await browser.close();
  await servidor.close?.();
  process.exit(0);
}

if (modo === 'compara') {
  const A = path.resolve(a), B = path.resolve(b);
  const nomes = fs.readdirSync(A).filter((n) => n.endsWith('.png'));
  const browser = await chromium.launch();
  const p = await browser.newPage();
  let diferentes = 0;
  for (const nome of nomes) {
    const fa = path.join(A, nome), fb = path.join(B, nome);
    if (!fs.existsSync(fb)) { console.log(`FALTA  ${nome}`); diferentes += 1; continue; }
    const ba = fs.readFileSync(fa), bb = fs.readFileSync(fb);
    if (ba.equals(bb)) continue;
    const r = await p.evaluate(async ([x, y]) => {
      const carrega = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
      const [ia, ib] = await Promise.all([carrega(x), carrega(y)]);
      if (ia.width !== ib.width || ia.height !== ib.height) return { tamanho: `${ia.width}x${ia.height} vs ${ib.width}x${ib.height}` };
      const c = document.createElement('canvas'); c.width = ia.width; c.height = ia.height;
      const g = c.getContext('2d');
      g.drawImage(ia, 0, 0); const da = g.getImageData(0, 0, c.width, c.height).data;
      g.clearRect(0, 0, c.width, c.height); g.drawImage(ib, 0, 0); const db = g.getImageData(0, 0, c.width, c.height).data;
      let n = 0, maior = 0;
      for (let i = 0; i < da.length; i += 4) {
        const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]), Math.abs(da[i + 3] - db[i + 3]));
        if (d > 0) { n += 1; maior = Math.max(maior, d); }
      }
      return { pixels: n, total: da.length / 4, maior };
    }, [`data:image/png;base64,${ba.toString('base64')}`, `data:image/png;base64,${bb.toString('base64')}`]);
    if (r.tamanho || r.pixels) { diferentes += 1; console.log(`DIFERE ${nome}: ${JSON.stringify(r)}`); }
  }
  const ma = JSON.parse(fs.readFileSync(path.join(A, 'medidas.json'), 'utf8'));
  const mb = JSON.parse(fs.readFileSync(path.join(B, 'medidas.json'), 'utf8'));
  for (const chave of Object.keys(ma)) {
    const va = JSON.stringify(ma[chave]), vb = JSON.stringify(mb[chave]);
    if (va !== vb) {
      diferentes += 1;
      for (const campo of Object.keys(ma[chave] || {})) {
        if (JSON.stringify(ma[chave][campo]) !== JSON.stringify(mb[chave]?.[campo])) console.log(`MEDIDA ${chave}.${campo}: ${JSON.stringify(ma[chave][campo]).slice(0, 300)} -> ${JSON.stringify(mb[chave]?.[campo]).slice(0, 300)}`);
      }
    }
  }
  console.log(diferentes ? `${diferentes} diferença(s) em ${nomes.length} imagens e ${Object.keys(ma).length} medidas` : `idêntico: ${nomes.length} imagens e ${Object.keys(ma).length} medidas`);
  await browser.close();
  process.exit(diferentes ? 1 : 0);
}
