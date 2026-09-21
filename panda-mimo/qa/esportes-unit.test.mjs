import test from 'node:test';
import assert from 'node:assert/strict';
import { MODELOS_ESPORTES, VETORES_ESPORTES, CATEGORIAS_ESPORTES } from '../simulador/esportes-dados.js';
import { TEMPLATES, novaArte, caixaDaCamada, camadaEm, desenhaArte } from '../simulador/modelos.js';
import { desenhaVetorEsportivo } from '../simulador/esportes.js';
import { PALETA } from '../simulador/paleta.js';
import { readFile } from 'node:fs/promises';
const area = { x: 0, y: 0, width: 210, height: 90 };

function context() {
  let x = 0, y = 0;
  const stack = [], fills = [];
  const noop = () => {};
  return {
    fills, save() { stack.push([x,y]); }, restore() { [x,y] = stack.pop(); },
    translate(a,b) { x += a; y += b; },
    beginPath:noop,closePath:noop,moveTo:noop,lineTo:noop,bezierCurveTo:noop,quadraticCurveTo:noop,
    rotate:noop,rect:noop,roundRect:noop,arc:noop,ellipse:noop,stroke:noop,clip:noop,fillRect:noop,
    fillText:noop,setLineDash:noop,drawImage:noop,
    fill() { fills.push([x,y,this.fillStyle]); }, measureText(t) { return {width:t.length*2}; },
  };
}

test('24 modelos esportivos nativos preservam os 14 modelos anteriores', () => {
  assert.equal(MODELOS_ESPORTES.length,24);
  assert.equal(TEMPLATES.length,38);
  for (const c of CATEGORIAS_ESPORTES) assert.equal(MODELOS_ESPORTES.filter(m=>m.categoria===c.id).length,4);
  for (const m of MODELOS_ESPORTES) {
    assert.equal(m.camadas.filter(c=>c.tipo==='foto').length,1);
    assert.ok(m.camadas.some(c=>c.tipo==='frase'));
    assert.ok(m.camadas.filter(c=>c.tipo==='enfeite').length>=2);
    assert.ok(m.enfeites.quantidade>0);
  }
});

test('137 ilustrações são desenhadas por curvas vetoriais, sem carregar bitmaps', () => {
  assert.equal(Object.keys(VETORES_ESPORTES).length,137);
  for (const [id,v] of Object.entries(VETORES_ESPORTES)) {
    assert.ok(v.width>0 && v.height>0);
    const ctx=context();
    ctx.drawImage=()=>assert.fail('não deve rasterizar as ilustrações');
    assert.equal(desenhaVetorEsportivo(ctx,id,35,'#FF0000'),true);
    assert.ok(v.paths.every(p=>p.commands.every(([cmd,...n])=>['M','L','C','Z'].includes(cmd)&&n.every(Number.isFinite))));
    assert.ok(ctx.fills.some(f=>f[2]==='#FF0000') || v.paths.some(p=>p.stroke===v.primary));
  }
});

test('cada ilustração conserva proporção, seleção e edição isolada após salvar/restaurar', () => {
  for (const m of MODELOS_ESPORTES) {
    const arte=novaArte(m), layer=arte.camadas.find(c=>c.tipo==='enfeite');
    const bounds=caixaDaCamada(layer,area), v=VETORES_ESPORTES[layer.forma];
    assert.ok(Math.abs(bounds.height/bounds.width-v.height/v.width)<1e-9);
    const isolated={...arte,camadas:[layer]};
    assert.equal(camadaEm(isolated,{x:bounds.centroX,y:bounds.centroY},area)?.id,layer.id);
    const original=JSON.stringify(m);
    layer.x=.6;layer.tamanho*=1.2;layer.rotacao=25;layer.cor='--sage';
    const restored=JSON.parse(JSON.stringify(arte));
    assert.deepEqual(restored.camadas,arte.camadas);
    assert.equal(JSON.stringify(m),original);
  }
});

test('enfeites de fundo se redistribuem ao colocar a foto sobre um deles', () => {
  for (const m of MODELOS_ESPORTES) {
    const arte=novaArte(m);
    arte.camadas=arte.camadas.filter(c=>c.tipo==='foto');
    const before=context();desenhaArte(before,arte,area);
    const decorations=before.fills.slice(0,arte.enfeites.quantidade);
    const [x,y]=decorations.find(([x,y])=>x>25&&x<185&&y>24&&y<65) || decorations[0];
    arte.camadas[0].x=x/210;arte.camadas[0].y=y/90;
    const after=context();desenhaArte(after,arte,area);
    const moved=after.fills.slice(0,arte.enfeites.quantidade);
    assert.notDeepEqual(moved,decorations,m.id);
    const box=caixaDaCamada(arte.camadas[0],area);
    for (const [dx,dy] of moved) assert.ok(dx<box.x || dx>box.x+box.width || dy<box.y || dy>box.y+box.height,m.id);
  }
});

test('as ilustrações pintam só com tokens da paleta, para acompanhar o styles.css', () => {
  const tokens = new Set(Object.keys(PALETA));
  for (const [id, v] of Object.entries(VETORES_ESPORTES)) {
    assert.ok(tokens.has(v.primary), `${id}: cor principal "${v.primary}" não é token da paleta`);
    for (const p of v.paths) {
      for (const valor of [p.fill, p.stroke]) {
        if (valor === null || valor === undefined) continue;
        assert.ok(tokens.has(valor), `${id}: cor solta "${valor}" no desenho — use um token`);
      }
    }
  }
  // A tinta escolhida entra no lugar da principal; as outras seguem a paleta e viram cor de verdade.
  const ctx = context();
  const primeiro = Object.keys(VETORES_ESPORTES)[0];
  desenhaVetorEsportivo(ctx, primeiro, 35, '--peach');
  for (const [, , pintura] of ctx.fills) assert.match(String(pintura), /^#[0-9A-Fa-f]{6}$/, 'saiu token cru no canvas');
});

test('o arquivo de dados não guarda cor solta em lugar nenhum', async () => {
  const fonte = await readFile(new URL('../simulador/esportes-dados.js', import.meta.url), 'utf8');
  const soltas = [...new Set(fonte.match(/#[0-9A-Fa-f]{6}/g) || [])];
  assert.deepEqual(soltas, [], `cor solta no esportes-dados.js: ${soltas.join(', ')}`);
});
