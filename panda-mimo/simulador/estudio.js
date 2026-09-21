/**
 * Estúdio da caneca: liga o formulário ao editor de arte (arte.js) e à prévia 3D (caneca-3d.js).
 *
 * Nada sai deste navegador: a imagem escolhida fica em memória e só vira arquivo quando a pessoa
 * baixa a prévia, a arte plana ou o projeto. O pedido segue pelo WhatsApp, com as escolhas no texto.
 */
import { createMugViewer, MUG_SPEC } from './caneca-3d.js';
import { loadArtwork, composeArtwork, exportPrintArtwork } from './arte.js';

// Cores da cerâmica: dado físico da peça (manual 7.4), não cor de interface.
const CERAMICA = Object.freeze({
  branca: '#ffffff', preta: '#1d1b19', vermelha: '#b7262b', amarela: '#f0c233', rosa: '#f3a4b7', azul: '#1f5aa3',
});
const PRESETS = Object.freeze({
  branca: { inside: 'branca', handle: 'branca' },
  preta: { inside: 'preta', handle: 'preta' },
  rosa: { inside: 'rosa', handle: 'rosa' },
});
const LAYOUTS = { front: 'só na frente', both: 'nos dois lados', wrap: 'ao redor' };
const LETRAS = { Fredoka: 'Redondinha', Caveat: 'Manuscrita' };
const PANDA_ADESIVO = 'assets/panda-coracao.webp';
const ARTE_EXEMPLO = { url: 'assets/coracao-jeito.webp', nome: 'Arte da Panda Mimo (exemplo)' };
const PROJETO_TIPO = 'panda-mimo/caneca';
const PROJETO_VERSAO = 1;

const $ = (id) => document.getElementById(id);
const el = {
  viewport: $('mug-viewport'), loading: $('viewer-loading'), fallback: $('viewer-fallback'), retry: $('viewer-retry'),
  zoom: $('mug-zoom'), flat: $('flat-art'), flatDetails: $('flat-details'),
  form: $('mug-form'), inside: $('inside-color'), handle: $('handle-color'),
  drop: $('art-drop'), file: $('art-file'), choose: $('choose-art'), fileInfo: $('art-file-info'), fileName: $('art-file-name'),
  remove: $('remove-art'), example: $('use-example'), error: $('art-error'),
  scale: $('art-scale'), x: $('art-x'), y: $('art-y'), rotation: $('art-rotation'),
  scaleOut: $('scale-value'), xOut: $('x-value'), yOut: $('y-value'), rotationOut: $('rotation-value'), reset: $('reset-art'),
  name: $('art-name'), font: $('art-font'), panda: $('art-panda'),
  warnings: $('art-warnings'), savePreview: $('save-preview'), savePrint: $('save-print'), saveProject: $('save-project'),
  saveStatus: $('save-status'), order: $('mug-order'),
};
const viewButtons = [...document.querySelectorAll('.studio-view-buttons [data-view]')];
const presetButtons = [...document.querySelectorAll('.studio-color-presets [data-preset]')];

const state = {
  inside: 'branca', handle: 'branca',
  layout: 'front', scale: 1, offsetX: 0, offsetY: 0, rotation: 0,
  name: '', fontFamily: 'Fredoka', withPanda: true,
};
let artwork = null;      // { image, width, height, name, dispose }
let artworkBlob = null;  // arquivo original, para o projeto salvo
let viewer = null;
let pandaImage = null;
let frame = 0;
let lastPlacement = null;
const textureCanvas = document.createElement('canvas');

/* ---------- utilidades ---------- */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Não foi possível carregar ${url}`));
    image.src = url;
  });
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function setStatus(message) { el.saveStatus.textContent = message || ''; }
function setError(message) {
  el.error.textContent = message || '';
  el.error.hidden = !message;
}
function slug(text) {
  return String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}
const hasContent = () => Boolean(artwork || state.name || state.withPanda);
const optionLabel = (select, value) => select.querySelector(`option[value="${value}"]`)?.textContent || value;

/* ---------- composição ---------- */
function schedule() {
  if (frame) return;
  frame = requestAnimationFrame(() => { frame = 0; render(); });
}

function render() {
  const { canvas, placement, warnings } = composeArtwork({ artwork, state, spec: MUG_SPEC, pandaImage, widthPx: 2048 }, textureCanvas);
  lastPlacement = placement;
  viewer?.setTexture(canvas);
  drawFlat(canvas, placement);
  el.warnings.textContent = warnings.join(' ');
  el.savePrint.disabled = !hasContent();
  updateOrderLink();
}

function drawFlat(source, placement) {
  const context = el.flat.getContext('2d');
  if (!context) return;
  const area = placement.printArea;
  const sx = area.x / placement.canvasMm.width * source.width;
  const sy = area.y / placement.canvasMm.height * source.height;
  const sw = area.width / placement.canvasMm.width * source.width;
  const sh = area.height / placement.canvasMm.height * source.height;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.clearRect(0, 0, el.flat.width, el.flat.height);
  context.drawImage(source, sx, sy, sw, sh, 0, 0, el.flat.width, el.flat.height);
  // Marca de dobra: onde fica a alça (extremos) e o centro da frente, como referência.
  context.save();
  context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--sand').trim() || 'GrayText';
  context.setLineDash([6, 8]);
  context.lineWidth = 1.5;
  for (const u of [0.25, 0.75]) {
    const x = ((u * placement.canvasMm.width - area.x) / area.width) * el.flat.width;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, el.flat.height);
    context.stroke();
  }
  context.restore();
}

/* ---------- pedido no WhatsApp ---------- */
function orderMessage() {
  const lines = ['Oi, Panda Mimo! Montei uma caneca no site 🐼', '• Caneca reta de 325 ml, branca por fora'];
  lines.push(`• Interior: ${optionLabel(el.inside, state.inside)} · Alça: ${optionLabel(el.handle, state.handle)}`);
  if (artwork) lines.push(`• Arte: ${artwork.name}, ${LAYOUTS[state.layout]}`);
  if (state.name) lines.push(`• Nome ou frase: "${state.name}" (letra ${LETRAS[state.fontFamily] || state.fontFamily})`);
  lines.push(state.withPanda ? '• Com o Pandinha' : '• Sem o Pandinha');
  lines.push('Vou anexar a prévia aqui na conversa.');
  return lines.join('\n');
}

function updateOrderLink() {
  const message = orderMessage();
  el.order.dataset.msg = message;
  // pagina.js troca o href por wa.me quando o número chega; só o texto muda aqui.
  try {
    const url = new URL(el.order.href, location.href);
    if (/wa\.me$/.test(url.hostname)) {
      url.searchParams.set('text', message);
      // Só grava se mudou: o observador do href chamaria esta função de novo.
      if (el.order.href !== url.toString()) el.order.href = url.toString();
    }
  } catch { /* href relativo antes do pagina.js: fica como está */ }
}

/* ---------- prévia 3D ---------- */
function applyColors() {
  viewer?.setColors({ inside: CERAMICA[state.inside], handle: CERAMICA[state.handle] });
}

function showFallback(error) {
  el.loading.hidden = true;
  el.fallback.hidden = false;
  el.savePreview.disabled = true;
  if (error) console.warn(error.message);
}

async function startViewer() {
  el.fallback.hidden = true;
  el.loading.hidden = false;
  if (viewer) { viewer.dispose(); viewer = null; }
  try {
    viewer = await createMugViewer(el.viewport, {
      onError: showFallback,
      onChange: (event) => {
        if (event?.type !== 'view') return;
        // Vista escolhida no botão fica marcada; giro livre desmarca todas.
        for (const button of viewButtons) button.setAttribute('aria-pressed', String(button.dataset.view === event.view));
      },
    });
    el.loading.hidden = true;
    el.savePreview.disabled = false;
    applyColors();
    viewer.setZoom(Number(el.zoom.value) / 100);
    viewer.setTexture(textureCanvas);
  } catch (error) {
    showFallback(error);
  }
}

/* ---------- arte ---------- */
function isProjectFile(file) {
  return file && (file.type === 'application/json' || /\.json$/i.test(file.name || ''));
}

async function handleFile(file) {
  if (!file) return;
  setError('');
  setStatus('');
  if (isProjectFile(file)) return openProject(file);
  try {
    const asset = await loadArtwork(file);
    artwork?.dispose();
    artwork = asset;
    artworkBlob = file;
    el.fileName.textContent = asset.name;
    el.fileInfo.hidden = false;
    schedule();
  } catch (error) {
    setError(error.message);
  }
}

function removeArtwork() {
  artwork?.dispose();
  artwork = null;
  artworkBlob = null;
  el.fileInfo.hidden = true;
  el.fileName.textContent = '';
  el.file.value = '';
  setError('');
  schedule();
}

async function useExample() {
  setError('');
  el.example.disabled = true;
  try {
    const response = await fetch(ARTE_EXEMPLO.url);
    if (!response.ok) throw new Error('exemplo indisponível');
    const blob = await response.blob();
    await handleFile(new File([blob], ARTE_EXEMPLO.nome + '.webp', { type: blob.type || 'image/webp' }));
  } catch {
    setError('A arte de exemplo não abriu agora. Escolha uma foto sua.');
  } finally {
    el.example.disabled = false;
  }
}

/* ---------- controles ---------- */
function syncRangeOutputs() {
  el.scaleOut.value = `${el.scale.value}%`;
  el.xOut.value = el.x.value;
  el.yOut.value = el.y.value;
  el.rotationOut.value = `${el.rotation.value}°`;
}

function readAdjustments() {
  state.scale = Number(el.scale.value) / 100;
  state.offsetX = Number(el.x.value) / 100;
  state.offsetY = Number(el.y.value) / 100;
  state.rotation = Number(el.rotation.value);
  syncRangeOutputs();
  schedule();
}

function resetAdjustments() {
  el.scale.value = '100';
  el.x.value = '0';
  el.y.value = '0';
  el.rotation.value = '0';
  readAdjustments();
}

function markPreset() {
  for (const button of presetButtons) {
    const preset = PRESETS[button.dataset.preset];
    button.setAttribute('aria-pressed', String(preset.inside === state.inside && preset.handle === state.handle));
  }
}

function setColors(inside, handle) {
  if (inside && CERAMICA[inside]) { state.inside = inside; el.inside.value = inside; }
  if (handle && CERAMICA[handle]) { state.handle = handle; el.handle.value = handle; }
  markPreset();
  applyColors();
  updateOrderLink();
}

function readTextOptions() {
  state.name = el.name.value.trim();
  state.fontFamily = el.font.value;
  state.withPanda = el.panda.checked;
  schedule();
}

function readLayout() {
  state.layout = el.form.elements.layout.value;
  schedule();
}

/* ---------- salvar ---------- */
async function savePreview() {
  if (!viewer) return;
  el.savePreview.disabled = true;
  try {
    const blob = await viewer.capture();
    download(blob, `caneca-panda-mimo-previa${state.name ? '-' + slug(state.name) : ''}.png`);
    setStatus('Prévia salva. Anexe na conversa do WhatsApp quando pedir.');
  } catch (error) {
    setStatus(error.message || 'Não foi possível salvar a prévia agora.');
  } finally {
    el.savePreview.disabled = false;
  }
}

async function savePrint() {
  if (!hasContent()) { setStatus('Coloque uma arte ou um nome primeiro.'); return; }
  el.savePrint.disabled = true;
  try {
    const { blob, widthPx, heightPx } = await exportPrintArtwork({ artwork, state, spec: MUG_SPEC, pandaImage });
    download(blob, `caneca-panda-mimo-arte-${MUG_SPEC.printWidthMm}x${MUG_SPEC.printHeightMm}mm-300dpi.png`);
    setStatus(`Arte plana salva em ${widthPx} × ${heightPx} px (300 dpi). A gente confere antes de produzir.`);
  } catch (error) {
    setStatus(error.message || 'Não foi possível preparar a arte agora.');
  } finally {
    el.savePrint.disabled = false;
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function saveProject() {
  el.saveProject.disabled = true;
  try {
    const project = {
      tipo: PROJETO_TIPO, versao: PROJETO_VERSAO, salvoEm: new Date().toISOString(),
      peca: { modelo: 'Caneca reta 325 ml', ...MUG_SPEC },
      escolhas: { ...state },
      arte: artwork && artworkBlob ? { nome: artwork.name, tipo: artworkBlob.type, dados: await blobToDataUrl(artworkBlob) } : null,
    };
    download(new Blob([JSON.stringify(project)], { type: 'application/json' }), `caneca-panda-mimo${state.name ? '-' + slug(state.name) : ''}.json`);
    setStatus('Projeto salvo. Para continuar depois, solte esse arquivo na área da arte.');
  } catch (error) {
    setStatus(error.message || 'Não foi possível salvar o projeto agora.');
  } finally {
    el.saveProject.disabled = false;
  }
}

async function openProject(file) {
  try {
    const project = JSON.parse(await file.text());
    if (project?.tipo !== PROJETO_TIPO || !project.escolhas) throw new Error('Esse arquivo não é um projeto de caneca da Panda Mimo.');
    const c = project.escolhas;
    setColors(c.inside, c.handle);
    if (LAYOUTS[c.layout]) { state.layout = c.layout; el.form.elements.layout.value = c.layout; }
    el.scale.value = String(Math.round(Number(c.scale || 1) * 100));
    el.x.value = String(Math.round(Number(c.offsetX || 0) * 100));
    el.y.value = String(Math.round(Number(c.offsetY || 0) * 100));
    el.rotation.value = String(Math.round(Number(c.rotation || 0)));
    el.name.value = String(c.name || '').slice(0, el.name.maxLength > 0 ? el.name.maxLength : 24);
    el.font.value = LETRAS[c.fontFamily] ? c.fontFamily : 'Fredoka';
    el.panda.checked = c.withPanda !== false;
    readAdjustments();
    readTextOptions();
    if (project.arte?.dados) {
      const response = await fetch(project.arte.dados);
      const blob = await response.blob();
      await handleFile(new File([blob], project.arte.nome || 'Minha arte', { type: project.arte.tipo || blob.type }));
    } else removeArtwork();
    setStatus('Projeto aberto. Continue de onde parou.');
  } catch (error) {
    setError(error.message || 'Não conseguimos abrir esse projeto.');
  }
}

/* ---------- ligação dos eventos ---------- */
function bind() {
  for (const button of viewButtons) button.addEventListener('click', () => viewer?.setView(button.dataset.view));
  el.zoom.addEventListener('input', () => viewer?.setZoom(Number(el.zoom.value) / 100));
  el.retry.addEventListener('click', startViewer);

  for (const button of presetButtons) button.addEventListener('click', () => {
    const preset = PRESETS[button.dataset.preset];
    if (preset) setColors(preset.inside, preset.handle);
  });
  el.inside.addEventListener('change', () => setColors(el.inside.value, null));
  el.handle.addEventListener('change', () => setColors(null, el.handle.value));

  el.choose.addEventListener('click', () => el.file.click());
  el.file.addEventListener('change', () => handleFile(el.file.files?.[0]));
  el.drop.addEventListener('dragover', (event) => { event.preventDefault(); el.drop.classList.add('dragging'); });
  el.drop.addEventListener('dragleave', () => el.drop.classList.remove('dragging'));
  el.drop.addEventListener('drop', (event) => {
    event.preventDefault();
    el.drop.classList.remove('dragging');
    handleFile(event.dataTransfer?.files?.[0]);
  });
  document.addEventListener('paste', (event) => {
    const item = [...(event.clipboardData?.items || [])].find((i) => i.kind === 'file' && i.type.startsWith('image/'));
    if (item) handleFile(item.getAsFile());
  });
  el.remove.addEventListener('click', removeArtwork);
  el.example.addEventListener('click', useExample);

  for (const input of [el.scale, el.x, el.y, el.rotation]) input.addEventListener('input', readAdjustments);
  el.reset.addEventListener('click', resetAdjustments);
  for (const radio of el.form.elements.layout) radio.addEventListener('change', readLayout);
  el.name.addEventListener('input', readTextOptions);
  el.font.addEventListener('change', readTextOptions);
  el.panda.addEventListener('change', readTextOptions);

  el.savePreview.addEventListener('click', savePreview);
  el.savePrint.addEventListener('click', savePrint);
  el.saveProject.addEventListener('click', saveProject);
  el.form.addEventListener('submit', (event) => event.preventDefault());

  // Quando pagina.js trocar o número do WhatsApp, o texto do pedido acompanha.
  new MutationObserver(updateOrderLink).observe(el.order, { attributes: true, attributeFilter: ['href'] });
  document.fonts?.addEventListener?.('loadingdone', schedule);
  window.addEventListener('pagehide', () => { viewer?.dispose(); artwork?.dispose(); });
}

async function init() {
  bind();
  syncRangeOutputs();
  markPreset();
  const fontsReady = document.fonts?.load
    ? Promise.allSettled(['600 16px "Fredoka"', '600 16px "Caveat"'].map((font) => document.fonts.load(font)))
    : Promise.resolve();
  const [panda] = await Promise.allSettled([loadImage(PANDA_ADESIVO), fontsReady]);
  if (panda.status === 'fulfilled') pandaImage = panda.value;
  else console.warn(panda.reason?.message);
  render();
  await startViewer();
}

init();
