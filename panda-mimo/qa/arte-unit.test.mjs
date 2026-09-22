import test from 'node:test';
import assert from 'node:assert/strict';
import { computePlacement, composeArtwork, exportPrintArtwork, loadArtwork } from '../simulador/arte.js';

const near = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-8, `${message || ''}: ${actual} ≠ ${expected}`);
const spec = { diameterMm: 82, heightMm: 95, printWidthMm: 210, printHeightMm: 90 };

test('a proporção da arte é preservada e a frente fica em u=.25, com área junto da alça livre', () => {
  const result = computePlacement({ width: 1600, height: 1000 }, {}, spec);
  const item = result.items[0];
  near(item.width, 80);
  near(item.height, 50);
  near(item.centerX / result.canvasMm.width, 0.25);
  near(item.width / item.height, 1.6);
  near(result.printArea.x, (Math.PI * 82 - 210) / 2);
  assert.equal(result.isClipped, false);
});

test('arte vertical é contida na altura, sem esticar; ambos os lados usam a mesma escala', () => {
  const result = computePlacement({ width: 1000, height: 2000 }, { layout: 'both' }, spec);
  assert.equal(result.items.length, 2);
  for (const item of result.items) {
    near(item.width, 45);
    near(item.height, 90);
    assert.equal(item.isClipped, false);
  }
  near(result.items[1].centerX / result.canvasMm.width, 0.75);
});

test('arte envolvente cabe em 210 × 90 mm e deslocamento avisa corte na área de impressão', () => {
  const dimensions = { width: 2100, height: 900 };
  const fit = computePlacement(dimensions, { layout: 'wrap' }, spec);
  near(fit.items[0].width, 210);
  near(fit.items[0].height, 90);
  near(fit.items[0].bounds.x, fit.printArea.x);
  assert.equal(fit.isClipped, false);
  const moved = computePlacement(dimensions, { layout: 'wrap', offsetX: 0.1 }, spec);
  assert.equal(moved.isClipped, true);
  assert.ok(moved.items[0].bounds.x + moved.items[0].width > moved.printArea.x + moved.printArea.width);
});

test('rotação considera os cantos da imagem ao detectar corte', () => {
  const result = computePlacement({ width: 800, height: 800 }, { rotation: 45 }, spec);
  near(result.items[0].bounds.width, 80 * Math.SQRT2);
  near(result.items[0].bounds.height, 80 * Math.SQRT2);
  assert.equal(result.isClipped, true);
});

test('dpi efetivo usa pixels originais e tamanho físico: ampliar pela metade divide dpi por dois', () => {
  const natural = computePlacement({ width: 1200, height: 600 }, {}, spec);
  const doubled = computePlacement({ width: 1200, height: 600 }, { scale: 2 }, spec);
  near(natural.effectiveDpi, 1200 / (80 / 25.4));
  near(doubled.effectiveDpi, natural.effectiveDpi / 2);
});

test('área menor é respeitada; entrada inválida é normalizada sem infinito ou NaN', () => {
  const smaller = computePlacement({ width: 100, height: 100 }, {}, { ...spec, printWidthMm: 180, printHeightMm: 65 });
  assert.equal(smaller.isClipped, false);
  assert.ok(smaller.items[0].width < 80);
  const normalized = computePlacement({ width: 100, height: 100 }, { scale: Infinity, offsetX: -20, rotation: 800 }, spec);
  assert.equal(normalized.state.scale, 1);
  assert.equal(normalized.state.offsetX, -1);
  assert.equal(normalized.state.rotation, 180);
  assert.ok(Number.isFinite(normalized.items[0].width));
  assert.deepEqual(computePlacement(null, {}, spec).items, []);
});

function pngHeader(width, height, animated = false) {
  // CRCs need not be decoded for the preflight size checks tested here.
  const bytes = new Uint8Array(animated ? 65 : 45);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 13);
  bytes.set(Buffer.from('IHDR'), 12);
  view.setUint32(16, width);
  view.setUint32(20, height);
  bytes[24] = 8;
  bytes[25] = 6;
  let end = 33;
  if (animated) {
    view.setUint32(end, 8);
    bytes.set(Buffer.from('acTL'), end + 4);
    end += 20;
  }
  bytes.set(Buffer.from('IEND'), end + 4);
  return bytes;
}

function fileFrom(bytes, type = 'image/png', name = 'arte.png') {
  return new File([bytes], name, { type });
}

test('upload rejeita SVG, arquivo falso, excesso de bytes/pixels e animação antes de decodificar', async () => {
  await assert.rejects(loadArtwork(fileFrom('<svg/>', 'image/svg+xml')), /PNG, JPG, WebP ou HEIC/);
  await assert.rejects(loadArtwork(fileFrom('<svg/>', 'image/png')), /SVG, GIF/);
  await assert.rejects(loadArtwork({ size: 20 * 1024 * 1024 + 1, arrayBuffer() { throw new Error('não deve ler'); } }), /20 MB/);
  await assert.rejects(loadArtwork(fileFrom(pngHeader(10000, 10000))), /40 megapixels/);
  await assert.rejects(loadArtwork(fileFrom(pngHeader(100, 100, true))), /sem animação/);
  await assert.rejects(loadArtwork(fileFrom(new Uint8Array())), /vazio/);
});

test('dimensões do WebP extendido e do seu payload são checadas antes da decodificação', async () => {
  const bytes = new Uint8Array(48);
  bytes.set(Buffer.from('RIFF'), 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(4, 40, true);
  bytes.set(Buffer.from('WEBPVP8X'), 8);
  view.setUint32(16, 10, true);
  // Tiny advertised canvas, but 10,000 × 10,000 VP8 pixels.
  bytes[24] = 9;
  bytes[27] = 9;
  bytes.set(Buffer.from('VP8 '), 30);
  view.setUint32(34, 10, true);
  bytes.set([157, 1, 42], 41);
  view.setUint16(44, 10000, true);
  view.setUint16(46, 10000, true);
  await assert.rejects(loadArtwork(fileFrom(bytes, 'image/webp')), /40 megapixels/);
});

test('decoder mantém dimensões e libera bitmap uma vez; EXIF permite troca dos eixos', async () => {
  const original = globalThis.createImageBitmap;
  let closed = 0;
  globalThis.createImageBitmap = async () => ({ width: 200, height: 300, close() { closed += 1; } });
  try {
    const asset = await loadArtwork(fileFrom(pngHeader(300, 200), '', 'foto.png'));
    assert.equal(asset.width, 200);
    assert.equal(asset.height, 300);
    asset.dispose();
    asset.dispose();
    assert.equal(closed, 1);
  } finally {
    if (original === undefined) delete globalThis.createImageBitmap;
    else globalThis.createImageBitmap = original;
  }
});

function fakeCanvas() {
  const context = {
    transforms: [], draws: [], clips: [],
    setTransform(...args) { this.transforms.push(args); },
    fillRect() {}, save() {}, restore() {}, beginPath() {},
    rect(...args) { this.clips.push(args); }, clip() {}, translate() {}, rotate() {},
    drawImage(...args) { this.draws.push(args); },
    measureText(text) { return { width: text.length * 5 }; }, fillText() {},
  };
  return {
    width: 0, height: 0, context,
    getContext() { return context; },
    toBlob(callback) { callback(new Blob([pngHeader(this.width, this.height)], { type: 'image/png' })); },
  };
}

test('preview e export mantêm geometria em mm; export inclui apenas área útil e metadado300dpi', async () => {
  const originalDocument = globalThis.document;
  const canvases = [];
  globalThis.document = { createElement() { const canvas = fakeCanvas(); canvases.push(canvas); return canvas; } };
  try {
    const options = {
      artwork: { width: 1600, height: 1000, image: { width: 1600, height: 1000 } },
      state: { layout: 'both', scale: 1.2, offsetX: 0.15, offsetY: -0.1, rotation: -7 }, spec,
    };
    const preview = composeArtwork({ ...options, widthPx: 1024 });
    const output = await exportPrintArtwork(options);
    assert.deepEqual(output.placement, preview.placement);
    assert.equal(output.widthPx, 2480);
    assert.equal(output.heightPx, 1063);
    assert.equal(output.dpi, 300);
    assert.deepEqual(canvases[0].context.draws, canvases[1].context.draws);
    const cropTransform = canvases[1].context.transforms[1];
    near(cropTransform[0], 2480 / 210);
    near(cropTransform[3], 1063 / 90);
    near(cropTransform[4], -preview.placement.printArea.x * 2480 / 210);
    const bytes = new Uint8Array(await output.blob.arrayBuffer());
    const view = new DataView(bytes.buffer);
    assert.equal(Buffer.from(bytes.subarray(37, 41)).toString(), 'pHYs');
    assert.equal(view.getUint32(41), 11811);
    assert.equal(view.getUint32(45), 11811);
    assert.equal(bytes[49], 1);
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});

/*
  HEIC é o padrão de foto do iPhone, e quem escolhe pelo app Arquivos manda esse arquivo — antes ele
  nem aparecia como selecionável. Aqui se monta um HEIC sintético (ftyp + meta > iprp > ipco > ispe)
  para cobrar o leitor de caixas: sem um arquivo de verdade e um Safari, é o que dá para conferir.
  A decodificação em si é do navegador; quem não souber abrir cai na mensagem que já existe.
*/
function caixa(tipo, corpo) {
  const dados = new Uint8Array(8 + corpo.length);
  new DataView(dados.buffer).setUint32(0, dados.length);
  dados.set([...tipo].map((c) => c.charCodeAt(0)), 4);
  dados.set(corpo, 8);
  return dados;
}
function junta(...partes) {
  const total = partes.reduce((a, p) => a + p.length, 0);
  const saida = new Uint8Array(total);
  let i = 0;
  for (const p of partes) { saida.set(p, i); i += p.length; }
  return saida;
}
function ispe(largura, altura) {
  const corpo = new Uint8Array(12);
  const v = new DataView(corpo.buffer);
  v.setUint32(4, largura);
  v.setUint32(8, altura);
  return caixa('ispe', corpo);
}
function heicFalso(largura, altura, { comMiniatura = true, marca = 'heic' } = {}) {
  const ftyp = caixa('ftyp', junta(
    new Uint8Array([...marca].map((c) => c.charCodeAt(0))),
    new Uint8Array(4),
    new Uint8Array([...marca].map((c) => c.charCodeAt(0))),
  ));
  const medidas = comMiniatura ? junta(ispe(320, 240), ispe(largura, altura)) : ispe(largura, altura);
  const meta = caixa('meta', junta(new Uint8Array(4), caixa('iprp', caixa('ipco', medidas))));
  return junta(ftyp, meta);
}

test('HEIC do iPhone é aceito, e a medida sai do maior ispe (não da miniatura)', async () => {
  // O navegador do teste não decodifica HEIC. O que se cobra é que ele PASSE pelo farejador e pare
  // só na decodificação: é a diferença entre "não dá para escolher esse arquivo" e "seu navegador
  // não abre esse formato, salve como JPG".
  await assert.rejects(loadArtwork(fileFrom(heicFalso(4032, 3024), 'image/heic', 'foto.heic')),
    /Não conseguimos abrir essa imagem/);
  // arquivo grande demais é barrado pelo ispe, antes de qualquer decodificação
  await assert.rejects(loadArtwork(fileFrom(heicFalso(9000, 9000), 'image/heic', 'foto.heic')), /40 megapixels/);
  // marca desconhecida continua recusada com a mensagem de formato
  await assert.rejects(loadArtwork(fileFrom(heicFalso(100, 100, { marca: 'qt  ' }), 'image/heic', 'x.heic')), /SVG, GIF/);
});
