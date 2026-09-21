import { chromium } from 'playwright';
import { servir } from './servidor.mjs';
import path from 'node:path';
const s = await servir();
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('EXCEÇÃO', e.message));
p.on('console', (m) => m.type() === 'error' && console.log('ERRO', m.text()));
p.on('filechooser', async (fc) => { await fc.setFiles(path.resolve('.', 'assets', 'uso-caneca-cafe.webp')); });
await p.goto(s.url + 'caneca-3d.html', { waitUntil: 'load' });
await p.waitForFunction(() => document.querySelectorAll('#model-list .studio-model').length > 1);
await p.click('[data-modelo="namorados-coracoes"]');
await p.waitForTimeout(700);
// uma foto, para o rascunho ter conteúdo de verdade
await p.evaluate(() => [...document.querySelectorAll('#lista-fotos .studio-item__cabeca')].find((b) => b.querySelector('small')?.textContent.startsWith('Toque'))?.click());
await p.waitForTimeout(1600);

// lote em ZIP
const baixa = p.waitForEvent('download');
await p.evaluate(() => {
  document.querySelector('#abas [data-aba="frases"]').click();
  document.getElementById('lote').open = true;
  document.getElementById('lote-nomes').value = 'Malu\nTheo\nDona Cleide';
  document.getElementById('lote-gerar').click();
});
const zip = await baixa;
await zip.saveAs(process.argv[2] + '/lote.zip');
console.log('zip:', zip.suggestedFilename());

// link da montagem
await p.click('#copiar-link');
await p.waitForTimeout(600);
const link = await p.evaluate(() => navigator.clipboard.readText());
console.log('link tem', link.length, 'caracteres');

// rascunho: recarrega e confere o aviso
await p.waitForTimeout(1600);
await p.reload({ waitUntil: 'load' });
await p.waitForFunction(() => !document.getElementById('rascunho').hidden, null, { timeout: 15000 }).catch(() => console.log('AVISO: rascunho não apareceu'));
console.log('rascunho:', await p.$eval('#rascunho-texto', (e) => e.textContent));
await p.click('#rascunho-continuar');
await p.waitForTimeout(2500);
console.log('depois do rascunho:', await p.evaluate(() => ({
  camadas: document.querySelectorAll('.studio-item').length,
  fotos: [...document.querySelectorAll('#lista-fotos .studio-item__cabeca small')].map((s) => s.textContent),
})));

// abrir pelo link, numa aba limpa
const p2 = await ctx.newPage();
await p2.goto(link, { waitUntil: 'load' });
await p2.waitForTimeout(3500);
console.log('pelo link:', await p2.evaluate(() => ({
  modelo: document.getElementById('template-name').textContent.slice(0, 30),
  camadas: document.querySelectorAll('.studio-item').length,
  status: document.getElementById('save-status').textContent,
})));
await b.close();
await s.close();
