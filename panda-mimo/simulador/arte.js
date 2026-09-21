/**
 * Arte local da caneca. Nenhum arquivo é enviado ou persistido por este módulo.
 *
 * Coordenadas físicas, em mm, usam origem no canto superior esquerdo da parede
 * desenrolada. A costura u=0/1 fica na alça; frente u=.25, verso u=.75.
 * composeArtwork() entrega uma textura branca de toda a circunferência. Com uma arte em
 * camadas (modelos.js), a mesma função desenha a volta inteira: fotos, frases, enfeites
 * e o Pandinha, cada um no lugar em que a pessoa deixou.
 * exportPrintArtwork() desenha a mesma composição diretamente em 300 dpi,
 * recortada na área imprimível, sem guias, perspectiva ou espelhamento.
 */

import { desenhaArte, caixaDaCamada, medidorDeTexto, cor, FRENTE as FRENTE_U, VERSO as VERSO_U } from './modelos.js';

const MAX_BYTES = 20 * 1024 * 1024;
const MAX_PIXELS = 40_000_000;
const DEFAULT_SPEC = Object.freeze({ diameterMm: 82, heightMm: 95, printWidthMm: 210, printHeightMm: 90 });
const FORMATS = new Set(['image/png', 'image/jpeg', 'image/webp']);
const FONTS = new Set(['Fredoka', 'Caveat', 'Nunito']);
const EPSILON = 1e-6;

function fileError(message) {
  const error = new Error(message);
  error.name = 'ArtworkError';
  return error;
}

function assertDimensions(width, height) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw fileError('A imagem parece incompleta. Tente salvar uma nova cópia em PNG ou JPG.');
  }
  if (width * height > MAX_PIXELS) {
    throw fileError('Esta imagem é muito grande para a prévia. Use uma versão com até 40 megapixels.');
  }
}

function ascii(bytes, start, length) {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

/** Validate dimensions before invoking a browser decoder (including extended WebP). */
function inspectImage(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const invalid = () => fileError('Não conseguimos ler essa imagem. Tente uma nova cópia em PNG, JPG ou WebP.');
  const result = (type, width, height) => {
    assertDimensions(width, height);
    return { type, width, height };
  };
  if (bytes.length >= 24 && bytes[0] === 137 && ascii(bytes, 1, 7) === 'PNG\r\n\x1a\n') {
    if (view.getUint32(8) !== 13 || ascii(bytes, 12, 4) !== 'IHDR') throw invalid();
    const info = result('image/png', view.getUint32(16), view.getUint32(20));
    let offset = 8;
    while (offset + 12 <= bytes.length) {
      const length = view.getUint32(offset);
      const kind = ascii(bytes, offset + 4, 4);
      if (length > bytes.length - offset - 12) throw invalid();
      if (kind === 'acTL') throw fileError('Use uma imagem parada: PNG, JPG ou WebP sem animação.');
      offset += length + 12;
      if (kind === 'IEND') return info;
    }
    throw invalid();
  }
  if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216) {
    let offset = 2;
    let info;
    while (offset < bytes.length) {
      if (bytes[offset++] !== 255) throw invalid();
      while (bytes[offset] === 255) offset += 1;
      const marker = bytes[offset++];
      if (marker === 217 || marker === 218) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      if (offset + 2 > bytes.length) throw invalid();
      const length = view.getUint16(offset);
      if (length < 2 || length > bytes.length - offset) throw invalid();
      if (marker >= 192 && marker <= 207 && ![196, 200, 204].includes(marker)) {
        if (length < 8) throw invalid();
        info = result('image/jpeg', view.getUint16(offset + 5), view.getUint16(offset + 3));
      }
      offset += length;
    }
    if (info) return info;
    throw invalid();
  }
  if (bytes.length >= 30 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') {
    const end = view.getUint32(4, true) + 8;
    if (end > bytes.length || end < 30) throw invalid();
    let offset = 12;
    let info;
    let hasPixels = false;
    while (offset + 8 <= end) {
      const kind = ascii(bytes, offset, 4);
      const size = view.getUint32(offset + 4, true);
      const start = offset + 8;
      if (size > end - start) throw invalid();
      if (kind === 'ANIM' || kind === 'ANMF') throw fileError('Use uma imagem parada: PNG, JPG ou WebP sem animação.');
      if (kind === 'VP8X') {
        if (size < 10) throw invalid();
        if (bytes[start] & 2) throw fileError('Use uma imagem parada: PNG, JPG ou WebP sem animação.');
        const uint24 = at => bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16);
        info = result('image/webp', uint24(start + 4) + 1, uint24(start + 7) + 1);
      } else if (kind === 'VP8 ') {
        if (size < 10 || bytes[start + 3] !== 157 || bytes[start + 4] !== 1 || bytes[start + 5] !== 42) throw invalid();
        const frame = result('image/webp', view.getUint16(start + 6, true) & 16383, view.getUint16(start + 8, true) & 16383);
        info ||= frame;
        hasPixels = true;
      } else if (kind === 'VP8L') {
        if (size < 5 || bytes[start] !== 47) throw invalid();
        const bits = view.getUint32(start + 1, true);
        const frame = result('image/webp', (bits & 16383) + 1, ((bits >>> 14) & 16383) + 1);
        info ||= frame;
        hasPixels = true;
      }
      offset = start + size + (size % 2);
    }
    if (info && hasPixels) return info;
    throw invalid();
  }
  throw fileError('Escolha uma imagem em PNG, JPG ou WebP. SVG, GIF e outros formatos não entram na prévia.');
}

async function decodeWithImage(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = 'async';
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = url;
    });
    image.onload = null;
    image.onerror = null;
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * @param {File} file PNG/JPEG/WebP local, até 20 MiB e 40 MP.
 * @returns {Promise<{image: ImageBitmap|HTMLImageElement, width:number, height:number, name:string, dispose:Function}>}
 * O chamador libera a imagem anterior com dispose() ao substituir/remover a arte.
 */
export async function loadArtwork(file) {
  if (!file || typeof file.arrayBuffer !== 'function' || !Number.isFinite(file.size)) {
    throw fileError('Escolha uma imagem do seu aparelho.');
  }
  if (!file.size) throw fileError('Este arquivo está vazio. Escolha outra imagem.');
  if (file.size > MAX_BYTES) throw fileError('A imagem precisa ter até 20 MB. Salve uma cópia menor e tente de novo.');
  if (file.type && !FORMATS.has(file.type.toLowerCase())) {
    throw fileError('Escolha uma imagem em PNG, JPG ou WebP.');
  }
  let image;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const header = inspectImage(bytes);
    // Use the verified type, including images selected by browsers with no MIME.
    const blob = new Blob([bytes], { type: header.type });
    if (typeof createImageBitmap === 'function') {
      try {
        image = await createImageBitmap(blob, { imageOrientation: 'from-image' });
      } catch {
        image = await decodeWithImage(blob);
      }
    } else {
      image = await decodeWithImage(blob);
    }
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    assertDimensions(width, height);
    // EXIF may swap axes, but never legitimately increases the number of pixels.
    if (width * height !== header.width * header.height) {
      throw fileError('As medidas dessa imagem não puderam ser conferidas. Salve uma nova cópia em PNG ou JPG.');
    }
    let disposed = false;
    return {
      image, width, height,
      name: String(file.name || 'Minha arte').split(/[\\/]/).pop().slice(0, 120),
      dispose() {
        if (disposed) return;
        disposed = true;
        if (typeof image.close === 'function') image.close();
        else image.removeAttribute('src');
      },
    };
  } catch (error) {
    if (image && typeof image.close === 'function') image.close();
    if (error?.name === 'ArtworkError') throw error;
    throw fileError('Não conseguimos abrir essa imagem. Tente salvar outra cópia em PNG, JPG ou WebP.');
  }
}

const number = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const positive = (value, fallback) => Math.max(EPSILON, number(value, fallback));

function physicalSpec(spec = {}) {
  const width = positive(spec.circumferenceMm ?? spec.widthMm, Math.PI * positive(spec.diameterMm, DEFAULT_SPEC.diameterMm));
  const height = positive(spec.heightMm, DEFAULT_SPEC.heightMm);
  const printWidth = Math.min(width, positive(spec.printWidthMm, DEFAULT_SPEC.printWidthMm));
  const printHeight = Math.min(height, positive(spec.printHeightMm, DEFAULT_SPEC.printHeightMm));
  return {
    canvasMm: { width, height },
    printArea: { x: (width - printWidth) / 2, y: (height - printHeight) / 2, width: printWidth, height: printHeight },
  };
}

function readableName(value) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 64);
}

function normalizedState(state = {}) {
  return {
    scale: clamp(number(state.scale, 1), 0.2, 2.5),
    offsetX: clamp(number(state.offsetX, 0), -1, 1),
    offsetY: clamp(number(state.offsetY, 0), -1, 1),
    rotation: clamp(number(state.rotation, 0), -180, 180),
    layout: ['front', 'both', 'wrap'].includes(state.layout) ? state.layout : 'front',
    name: readableName(state.name),
    fontFamily: FONTS.has(state.fontFamily) ? state.fontFamily : 'Fredoka',
    withPanda: Boolean(state.withPanda),
  };
}

/** Pure millimetre geometry shared by preview and print; never depends on canvas resolution. */
export function computePlacement(dimensions, state = {}, spec = {}) {
  const normalized = normalizedState(state);
  const { canvasMm, printArea } = physicalSpec(spec);
  const centers = (normalized.layout === 'both' ? [0.25, 0.75] : [normalized.layout === 'wrap' ? 0.5 : 0.25])
    .map(u => u * canvasMm.width);
  // Every initial face fits the actual printable limits, even for a smaller template.
  const slotWidth = normalized.layout === 'wrap' ? printArea.width : Math.max(EPSILON, Math.min(80,
    ...centers.map(x => 2 * Math.max(0, Math.min(x - printArea.x, printArea.x + printArea.width - x)))));
  const footerHeight = normalized.name || normalized.withPanda ? Math.min(18, printArea.height * 0.25) : 0;
  const contentHeight = printArea.height - footerHeight;
  const widthPx = positive(dimensions?.width, 0);
  const heightPx = positive(dimensions?.height, 0);
  const hasArtwork = Number.isFinite(dimensions?.width) && dimensions.width > 0 && Number.isFinite(dimensions?.height) && dimensions.height > 0;
  const ratio = hasArtwork ? Math.min(slotWidth / widthPx, contentHeight / heightPx) * normalized.scale : 0;
  const width = widthPx * ratio;
  const height = heightPx * ratio;
  const angle = normalized.rotation * Math.PI / 180;
  const boxWidth = Math.abs(width * Math.cos(angle)) + Math.abs(height * Math.sin(angle));
  const boxHeight = Math.abs(width * Math.sin(angle)) + Math.abs(height * Math.cos(angle));
  const effectiveDpi = hasArtwork ? 25.4 / ratio : null;
  const items = hasArtwork ? centers.map(center => {
    const centerX = center + normalized.offsetX * slotWidth / 2;
    const centerY = printArea.y + contentHeight / 2 + normalized.offsetY * printArea.height / 2;
    const bounds = { x: centerX - boxWidth / 2, y: centerY - boxHeight / 2, width: boxWidth, height: boxHeight };
    const isClipped = bounds.x < printArea.x - EPSILON || bounds.y < printArea.y - EPSILON ||
      bounds.x + bounds.width > printArea.x + printArea.width + EPSILON ||
      bounds.y + bounds.height > printArea.y + printArea.height + EPSILON;
    return { centerX, centerY, width, height, rotation: normalized.rotation, angle, bounds, effectiveDpi, isClipped };
  }) : [];
  return {
    canvasMm, printArea, centers, slotWidth, contentHeight, footerHeight,
    state: normalized, items, effectiveDpi,
    isClipped: items.some(item => item.isClipped),
  };
}

function mergedState(options) {
  return {
    ...options.state,
    ...(options.name === undefined ? {} : { name: options.name }),
    ...(options.fontFamily === undefined ? {} : { fontFamily: options.fontFamily }),
  };
}

/**
 * Geometria e avisos de uma arte em camadas: dpi de cada foto e espaços ainda vazios.
 * O medidor de texto vem de um canvas qualquer; sem canvas, a caixa da frase usa o limite.
 */
export function computeArtePlacement(arte, state = {}, spec = {}, fotos = {}, medidor = null) {
  const normalized = normalizedState(state);
  const { canvasMm, printArea } = physicalSpec(spec);
  const slots = arte.camadas.filter((camada) => camada.tipo === 'foto').map((camada) => {
    const caixa = caixaDaCamada(camada, printArea, medidor);
    const foto = fotos[camada.id];
    const larguraPx = positive(foto?.width, 0);
    const alturaPx = positive(foto?.height, 0);
    const preenchido = Boolean(foto?.image) && larguraPx > EPSILON && alturaPx > EPSILON;
    // A foto cobre o espaço: o lado que "sobra" é cortado, e o dpi sai do lado que manda.
    const escala = preenchido
      ? Math.max(caixa.width / larguraPx, caixa.height / alturaPx) * clamp(number(camada.ajuste?.scale, 1), 0.2, 2.5)
      : 0;
    return {
      id: camada.id, rotulo: camada.rotulo, caixa, preenchido,
      effectiveDpi: preenchido ? 25.4 / escala : null,
    };
  });
  return {
    canvasMm, printArea, arte, slots,
    state: normalized,
    vazios: slots.filter((slot) => !slot.preenchido).map((slot) => slot.rotulo),
    effectiveDpi: slots.filter((slot) => slot.preenchido).reduce((menor, slot) => (menor === null ? slot.effectiveDpi : Math.min(menor, slot.effectiveDpi)), null),
  };
}

function arteWarnings(placement) {
  const warnings = [];
  const baixas = placement.slots.filter((slot) => slot.preenchido && slot.effectiveDpi < 150);
  if (baixas.length) {
    warnings.push(`${baixas.length === 1 ? 'Uma foto está' : `${baixas.length} fotos estão`} com cerca de ${Math.max(1, Math.round(Math.min(...baixas.map((slot) => slot.effectiveDpi))))} dpi neste tamanho. Fotos maiores deixam a impressão mais nítida.`);
  }
  if (placement.vazios.length) {
    warnings.push(`Ainda falta escolher: ${placement.vazios.join(', ')}. Espaço vazio sai impresso como fundo.`);
  }
  return warnings;
}

function warningsFor(placement) {
  if (placement.arte) return arteWarnings(placement);
  const warnings = [];
  if (placement.effectiveDpi !== null && placement.effectiveDpi < 150) {
    warnings.push(`A imagem tem cerca de ${Math.max(1, Math.round(placement.effectiveDpi))} dpi neste tamanho. Uma imagem maior deixa a impressão mais nítida.`);
  }
  if (placement.isClipped) warnings.push('Parte da arte ficou fora da área de impressão e será cortada. Diminua ou reposicione a imagem.');
  return warnings;
}

function makeCanvas(canvas, width, height) {
  const target = canvas || document.createElement('canvas');
  target.width = width;
  target.height = height;
  return target;
}

function drawContained(context, image, x, y, width, height) {
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  if (!imageWidth || !imageHeight) return;
  const scale = Math.min(width / imageWidth, height / imageHeight);
  const w = imageWidth * scale;
  const h = imageHeight * scale;
  context.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
}

function drawComposition(canvas, placement, options, cropToPrint = false) {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw fileError('Seu navegador não conseguiu preparar a prévia. Tente atualizar a página.');
  const region = cropToPrint ? placement.printArea : { x: 0, y: 0, ...placement.canvasMm };
  context.setTransform(1, 0, 0, 1, 0, 0);
  // White is the physical ceramic / unprinted substrate, not a page design token.
  context.fillStyle = 'white';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.setTransform(canvas.width / region.width, 0, 0, canvas.height / region.height,
    -region.x * canvas.width / region.width, -region.y * canvas.height / region.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.save();
  const area = placement.printArea;
  context.beginPath();
  context.rect(area.x, area.y, area.width, area.height);
  context.clip();
  if (options.arte) {
    desenhaArte(context, options.arte, area, {
      fotos: options.fotos,
      imagens: options.imagens,
      semPandinha: !placement.state.withPanda,
    });
    context.restore();
    context.setTransform(1, 0, 0, 1, 0, 0);
    return;
  }
  if (options.artwork?.image) {
    for (const item of placement.items) {
      context.save();
      context.translate(item.centerX, item.centerY);
      context.rotate(item.angle);
      context.drawImage(options.artwork.image, -item.width / 2, -item.height / 2, item.width, item.height);
      context.restore();
    }
  }
  const { name, fontFamily, withPanda } = placement.state;
  const hasArtwork = Boolean(options.artwork?.image);
  const ink = typeof getComputedStyle === 'function' ? getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() : '';
  context.fillStyle = options.inkColor || ink || 'CanvasText';
  if (name) {
    const hasLargePanda = withPanda && options.pandaImage && !hasArtwork;
    const centerY = hasArtwork ? area.y + area.height - placement.footerHeight / 2 : area.y + area.height * (hasLargePanda ? 0.8 : 0.5);
    const maxWidth = placement.slotWidth - (withPanda && options.pandaImage && hasArtwork ? 22 : 6);
    let fontSize = hasArtwork ? 8 : 11;
    context.font = `600 ${fontSize}px "${fontFamily}"`;
    const measured = context.measureText(name).width;
    if (measured > maxWidth) fontSize *= maxWidth / measured;
    context.font = `600 ${fontSize}px "${fontFamily}"`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    for (const center of placement.centers) {
      context.fillText(name, center + (withPanda && options.pandaImage && hasArtwork ? 10 : 0), centerY);
    }
  }
  // One approved sticker per physical mug, including the two-face layout.
  if (withPanda && options.pandaImage) {
    const center = placement.centers[0];
    if (hasArtwork) {
      const size = Math.min(16, placement.footerHeight - 2);
      drawContained(context, options.pandaImage, center - placement.slotWidth / 2 + 2, area.y + area.height - placement.footerHeight + 1, size, size);
    } else {
      const size = Math.min(42, placement.slotWidth - 6, area.height * 0.6);
      drawContained(context, options.pandaImage, center - size / 2, area.y + area.height * (name ? 0.35 : 0.5) - size / 2, size, size);
    }
  }
  context.restore();
  context.setTransform(1, 0, 0, 1, 0, 0);
}

/**
 * @param {{artwork?:object, state?:object, spec?:object, pandaImage?:CanvasImageSource, name?:string, fontFamily?:string, inkColor?:string, widthPx?:number}} options
 * @param {HTMLCanvasElement} [canvas] Texture target; reused to avoid allocations.
 * @returns {{canvas:HTMLCanvasElement, placement:object, warnings:string[]}}
 */
export function composeArtwork(options = {}, canvas) {
  const placement = options.arte
    ? computeArtePlacement(options.arte, mergedState(options), options.spec, options.fotos, options.medidor)
    : computePlacement(options.artwork, mergedState(options), options.spec);
  const width = Math.round(clamp(number(options.widthPx, 2048), 256, 4096));
  const height = Math.max(1, Math.round(width * placement.canvasMm.height / placement.canvasMm.width));
  const target = makeCanvas(canvas, width, height);
  drawComposition(target, placement, options);
  return { canvas: target, placement, warnings: warningsFor(placement) };
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Canvas PNG encoders normally write 96 dpi. Replace pHYs with true 300 dpi metadata.
async function pngAtDpi(blob, dpi) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const chunk = new Uint8Array(21);
  const chunkView = new DataView(chunk.buffer);
  chunkView.setUint32(0, 9);
  chunk.set([112, 72, 89, 115], 4); // pHYs
  chunkView.setUint32(8, Math.round(dpi / 0.0254));
  chunkView.setUint32(12, Math.round(dpi / 0.0254));
  chunk[16] = 1;
  chunkView.setUint32(17, crc32(chunk.subarray(4, 17)));
  const parts = [bytes.subarray(0, 8)];
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset);
    const kind = ascii(bytes, offset + 4, 4);
    if (length > bytes.length - offset - 12) throw fileError('Não conseguimos preparar o arquivo da arte. Tente novamente.');
    if (kind !== 'pHYs') parts.push(bytes.subarray(offset, offset + length + 12));
    if (kind === 'IHDR') parts.push(chunk);
    offset += length + 12;
  }
  return new Blob(parts, { type: 'image/png' });
}

/** Output: print-only PNG, 300 dpi metadata, artwork at the same mm placement as the preview. */
export async function exportPrintArtwork(options = {}) {
  const placement = options.arte
    ? computeArtePlacement(options.arte, mergedState(options), options.spec, options.fotos, options.medidor)
    : computePlacement(options.artwork, mergedState(options), options.spec);
  const dpi = 300;
  const widthPx = Math.round(placement.printArea.width / 25.4 * dpi);
  const heightPx = Math.round(placement.printArea.height / 25.4 * dpi);
  const target = makeCanvas(null, widthPx, heightPx);
  drawComposition(target, placement, options, true);
  const raw = await new Promise((resolve, reject) => target.toBlob(blob => blob ? resolve(blob) : reject(fileError('Não conseguimos preparar o arquivo da arte. Tente novamente.')), 'image/png'));
  const blob = await pngAtDpi(raw, dpi);
  return { blob, widthPx, heightPx, dpi, placement, warnings: warningsFor(placement) };
}

/** Área de impressão em milímetros, para quem precisa desenhar dentro dela (modelos e miniaturas). */
export function printAreaOf(spec = {}) {
  return physicalSpec(spec).printArea;
}

/** Medidas que a pessoa precisa saber para montar a arte fora do site (Canva, por exemplo). */
export function tamanhoRecomendado(spec = {}, dpi = 300) {
  const { printArea } = physicalSpec(spec);
  return {
    larguraMm: printArea.width, alturaMm: printArea.height,
    larguraCm: printArea.width / 10, alturaCm: printArea.height / 10,
    larguraPx: Math.round(printArea.width / 25.4 * dpi),
    alturaPx: Math.round(printArea.height / 25.4 * dpi),
    dpi,
  };
}

/**
 * Gabarito da arte de volta inteira: um PNG do tamanho exato da área de impressão, com a margem
 * de segurança, as marcas da frente e do verso e o lado da alça. Serve de fundo no Canva.
 */
export async function exportGuideArtwork(spec = {}) {
  const { printArea } = physicalSpec(spec);
  const medida = tamanhoRecomendado(spec);
  const canvas = makeCanvas(null, medida.larguraPx, medida.alturaPx);
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw fileError('Seu navegador não conseguiu preparar o gabarito. Tente atualizar a página.');
  const escala = canvas.width / printArea.width;
  context.setTransform(escala, 0, 0, escala, 0, 0);
  context.fillStyle = cor('--white');
  context.fillRect(0, 0, printArea.width, printArea.height);
  const margem = 5;
  const marcas = [
    { u: FRENTE_U, texto: 'FRENTE' },
    { u: VERSO_U, texto: 'VERSO' },
  ];
  context.strokeStyle = cor('--sand');
  context.lineWidth = 0.5;
  context.strokeRect(0.25, 0.25, printArea.width - 0.5, printArea.height - 0.5);
  context.setLineDash([3, 3]);
  context.strokeStyle = cor('--peach-deep');
  context.strokeRect(margem, margem, printArea.width - 2 * margem, printArea.height - 2 * margem);
  context.setLineDash([]);
  context.fillStyle = cor('--ink-soft');
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  for (const marca of marcas) {
    // FRENTE_U e VERSO_U já são frações da área de impressão (modelos.js).
    const x = marca.u * printArea.width;
    context.setLineDash([2, 4]);
    context.strokeStyle = cor('--kraft');
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, printArea.height);
    context.stroke();
    context.setLineDash([]);
    context.font = '600 4px "Fredoka", sans-serif';
    context.fillText(marca.texto, x, 8);
  }
  context.save();
  context.font = '600 3.4px "Fredoka", sans-serif';
  for (const [x, giro] of [[3.2, -Math.PI / 2], [printArea.width - 3.2, Math.PI / 2]]) {
    context.save();
    context.translate(x, printArea.height / 2);
    context.rotate(giro);
    context.fillText('LADO DA ALÇA', 0, 0);
    context.restore();
  }
  context.restore();
  context.font = '600 3.6px "Fredoka", sans-serif';
  context.fillText(`Área de impressão ${medida.larguraCm.toFixed(0)} × ${medida.alturaCm.toFixed(0)} cm · ${medida.larguraPx} × ${medida.alturaPx} px a ${medida.dpi} dpi`, printArea.width / 2, printArea.height - 7);
  context.font = '3px "Nunito", sans-serif';
  context.fillText('O tracejado é a margem de segurança: nada importante fora dele.', printArea.width / 2, printArea.height - 2.6);
  const raw = await new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(fileError('Não conseguimos preparar o gabarito. Tente novamente.')), 'image/png'));
  return { blob: await pngAtDpi(raw, medida.dpi), ...medida };
}
