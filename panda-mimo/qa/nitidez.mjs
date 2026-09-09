import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { inspectSvgSource, inspectVisualPage } from './visual-quality.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = pathToFileURL(path.join(root, 'index.html')).href;
const shots = path.join(root, 'qa/shots/nitidez');
fs.mkdirSync(shots, {recursive:true});
const errors = [], reports = [];
for (const name of fs.readdirSync(path.join(root,'assets')).filter(n=>n.endsWith('.svg'))) {
  errors.push(...inspectSvgSource(fs.readFileSync(path.join(root,'assets',name),'utf8'), name));
}
assert(inspectSvgSource('<svg viewBox="0 0 10 10"><image href="data:image/png;base64,x"/></svg>','defeito').length > 0);
assert(inspectSvgSource('<svg viewBox="0 0 10 10" shape-rendering="crispEdges"/>','defeito').length > 0);
const browser = await chromium.launch({...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}), args:['--allow-file-access-from-files']});
try {
  for (const [width,height,dpr] of [[320,568,1],[390,844,1],[1366,900,1],[1366,900,1.25],[1366,900,1.5],[1280,900,2],[390,844,3]]) {
    const page = await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr,reducedMotion:'reduce'});
    // Dados locais reproduzíveis: a homologação não grava visitas no banco real.
    await page.route('**/rest/v1/**', r=>r.fulfill({status:200,body:'[]',contentType:'application/json'}));
    await page.goto(url,{waitUntil:'load'});
    await page.evaluate(async()=>{
      document.querySelectorAll('img[loading]').forEach(i=>i.loading='eager');
      window.PANDA_REVELA_TUDO?.();
      await document.fonts.ready;
      await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));
    });
    const report = await page.evaluate(inspectVisualPage);
    reports.push(report);
    errors.push(...report.errors.map(e=>`[${width}@${dpr}x] ${e}`));
    // Cabeçalho fixo e botão flutuante não devem cobrir as capturas de seção.
    const captureStyle = await page.addStyleTag({content:'.topbar{position:static!important}.fab{visibility:hidden!important}'});
    // A vista padrão mostra quatro lançamentos; "Ver mais" revela o azulejo antes da captura.
    await page.$eval('#mais-lancamentos', b=>b.click()).catch(()=>{});
    for (const [name,selector] of [['selos','.trust'],['faixa','#ocasioes'],['icones','#diferenciais'],['hero','.hero'],['redes','#siga'],['rodape','.footer'],['contato','#contato'],['personalizacao','#monte'],['azulejo','.product[data-slug=azulejo-com-frase]']]) {
      await page.locator(selector).screenshot({path:path.join(shots,`${width}-${dpr}x-${name}.png`)});
    }
    await captureStyle.evaluate(e=>e.remove());
    console.log(`${width}px @${dpr}x: ${report.images.length} imagens, ${report.errors.length} problema(s)`);
    if (width===390 && dpr===1) {
      const presentation = await page.evaluate(()=>{
        const product={slug:'azulejo-com-frase',lancamento:true,fotos:[{url:'assets/lanc-azulejo.webp'}]};
        return {
          original:vitrineHTML(product).includes('launch-message'),
          custom:vitrineHTML({...product,fotos:[{url:'https://example.com/minha-foto.png'}]}).includes('minha-foto.png'),
          published:!vitrineHTML({...product,lancamento:false}).includes('launch-message'),
          other:!vitrineHTML({...product,slug:'outro-produto'}).includes('launch-message'),
        };
      });
      assert(Object.values(presentation).every(Boolean), 'A adaptação do azulejo não pode sobrescrever foto nova nem outro produto');
      // Prova de regressão: reduzir letras, borrar, trocar vetor por raster e embutir frase.
      const bad = await page.addStyleTag({content:'.trust__badge h3{font-size:8px!important;filter:blur(1px)!important;color:#eeeeee!important}.promise__icon{image-rendering:pixelated!important}'});
      const broken = await page.evaluate(inspectVisualPage);
      assert(broken.errors.some(e=>e.includes('texto pequeno')));
      assert(broken.errors.some(e=>e.includes('filtrado')));
      assert(broken.errors.some(e=>e.includes('contraste')));
      assert(broken.errors.some(e=>e.includes('efeito sobre vetor')));
      await bad.evaluate(e=>e.remove());
      await page.locator('.trust__badge img').first().evaluate(i=>i.src='assets/badge-frete.webp');
      const raster = await page.evaluate(inspectVisualPage);
      assert(raster.errors.some(e=>e.includes('separar símbolo')));
      assert(raster.errors.some(e=>e.includes('vetor real')));
      console.log('Defeitos inseridos de propósito: todos detectados.');
    }
    await page.close();
  }
} finally { await browser.close(); }
fs.writeFileSync(path.join(shots,'inventario.json'),JSON.stringify(reports,null,2));
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
else console.log('✓ nitidez: critérios objetivos aprovados em 7 combinações de tela/densidade. Revisar capturas a 100%.');
