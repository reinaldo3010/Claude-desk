/**
 * Estúdio da caneca: liga o formulário ao editor de arte (arte.js), aos modelos de volta
 * inteira (modelos.js) e à prévia 3D (caneca-3d.js).
 *
 * Nada sai deste navegador: as fotos escolhidas ficam em memória e só viram arquivo quando a
 * pessoa baixa a prévia, a arte plana, o gabarito ou o projeto. O pedido segue pelo WhatsApp,
 * com as escolhas escritas no texto.
 */
import { createMugViewer, MUG_SPEC } from './caneca-3d.js';
import { loadArtwork, composeArtwork, exportPrintArtwork, exportGuideArtwork, tamanhoRecomendado, printAreaOf } from './arte.js';
import { CATEGORIAS, TEMPLATES, modeloPorId, modelosDaCategoria, desenhaModelo, cor } from './modelos.js';

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
const PROJETO_VERSAO = 2;
const AJUSTE_PADRAO = Object.freeze({ scale: 1, offsetX: 0, offsetY: 0, rotation: 0 });

const $ = (id) => document.getElementById(id);
const el = {
  viewport: $('mug-viewport'), loading: $('viewer-loading'), fallback: $('viewer-fallback'), retry: $('viewer-retry'),
  zoom: $('mug-zoom'), flat: $('flat-art'), flatDetails: $('flat-details'),
  form: $('mug-form'), inside: $('inside-color'), handle: $('handle-color'),
  categories: $('model-categories'), models: $('model-list'),
  templateMode: $('template-mode'), templateName: $('template-name'), slots: $('photo-slots'), texts: $('model-texts'),
  freeMode: $('free-mode'), freeName: $('free-name'),
  drop: $('art-drop'), file: $('art-file'), choose: $('choose-art'), fileInfo: $('art-file-info'), fileName: $('art-file-name'),
  remove: $('remove-art'), example: $('use-example'), error: $('art-error'),
  adjustTarget: $('adjust-target'), adjustments: $('art-adjustments'),
  scale: $('art-scale'), x: $('art-x'), y: $('art-y'), rotation: $('art-rotation'),
  scaleOut: $('scale-value'), xOut: $('x-value'), yOut: $('y-value'), rotationOut: $('rotation-value'), reset: $('reset-art'),
  name: $('art-name'), font: $('art-font'), panda: $('art-panda'),
  sizeGuide: $('size-guide'), saveGuide: $('save-guide'),
  warnings: $('art-warnings'), savePreview: $('save-preview'), savePrint: $('save-print'), saveProject: $('save-project'),
  saveStatus: $('save-status'), order: $('mug-order'),
};
const viewButtons = [...document.querySelectorAll('.studio-view-buttons [data-view]')];
const presetButtons = [...document.querySelectorAll('.studio-color-presets [data-preset]')];

const state = {
  inside: 'branca', handle: 'branca',
  layout: 'front', ...AJUSTE_PADRAO,
  name: '', fontFamily: 'Fredoka', withPanda: true,
};
let modelo = null;            // modelo escolhido (null = arte livre)
let categoria = 'todos';
let artwork = null;           // arte livre: { image, width, height, name, dispose }
let artworkBlob = null;
const fotos = new Map();      // modelo: id do espaço → { asset, blob, ajuste }
let espacoAtivo = null;
const frases = new Map();     // modelo: id do texto → valor escrito
let destinoDoArquivo = { tipo: 'livre' };
let viewer = null;
let pandaImage = null;
let frame = 0;
const textureCanvas = document.createElement('canvas');
const medida = tamanhoRecomendado(MUG_SPEC);
const areaImpressao = printAreaOf(MUG_SPEC);

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
const optionLabel = (select, value) => select.querySelector(`option[value="${value}"]`)?.textContent || value;
const fraseDe = (texto) => (frases.has(texto.id) ? frases.get(texto.id) : texto.valor);
const temFoto = () => [...fotos.values()].some((f) => f.asset);
const hasContent = () => Boolean(modelo || artwork || state.name || state.withPanda);

/* ---------- composição ---------- */
function opcoesDeComposicao(extra = {}) {
  const base = { state, spec: MUG_SPEC, pandaImage, ...extra };
  if (!modelo) return { ...base, artwork };
  const templatePhotos = {};
  for (const [id, item] of fotos) {
    if (item.asset) templatePhotos[id] = { image: item.asset.image, width: item.asset.width, height: item.asset.height, ...item.ajuste };
  }
  const templateTexts = {};
  for (const texto of modelo.textos) templateTexts[texto.id] = fraseDe(texto);
  return { ...base, template: modelo, templatePhotos, templateTexts };
}

function schedule() {
  if (frame) return;
  frame = requestAnimationFrame(() => { frame = 0; render(); });
}

function render() {
  const { canvas, placement, warnings } = composeArtwork(opcoesDeComposicao({ widthPx: 2048, placeholder: true }), textureCanvas);
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
  // Marca de dobra: onde ficam a frente e o verso da caneca.
  context.save();
  context.strokeStyle = cor('--sand');
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
  if (modelo) {
    lines.push(`• Modelo: ${modelo.nome} (arte ao redor, ${modelo.fotos.length} ${modelo.fotos.length === 1 ? 'foto' : 'fotos'})`);
    const escolhidas = modelo.fotos.filter((f) => fotos.get(f.id)?.asset);
    lines.push(`• Fotos escolhidas: ${escolhidas.length} de ${modelo.fotos.length}`);
    for (const texto of modelo.textos) {
      const valor = fraseDe(texto).trim();
      if (valor) lines.push(`• ${texto.rotulo}: "${valor}"`);
    }
  } else {
    if (artwork) lines.push(`• Arte: ${artwork.name}, ${LAYOUTS[state.layout]}`);
    if (state.name) lines.push(`• Nome ou frase: "${state.name}" (letra ${LETRAS[state.fontFamily] || state.fontFamily})`);
  }
  lines.push(state.withPanda ? '• Com o Pandinha' : '• Sem o Pandinha');
  lines.push('Vou anexar a prévia aqui na conversa.');
  return lines.join('\n');
}

function updateOrderLink() {
  const message = orderMessage();
  el.order.dataset.msg = message;
  try {
    const url = new URL(el.order.href, location.href);
    if (/wa\.me$/.test(url.hostname)) {
      url.searchParams.set('text', message);
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

/* ---------- modelos ---------- */
function desenhaMiniatura(canvas, item) {
  const context = canvas.getContext('2d');
  if (!context) return;
  const escalaX = canvas.width / areaImpressao.width;
  const escalaY = canvas.height / areaImpressao.height;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.setTransform(escalaX, 0, 0, escalaY, -areaImpressao.x * escalaX, -areaImpressao.y * escalaY);
  desenhaModelo(context, item, areaImpressao, { placeholder: true });
  context.setTransform(1, 0, 0, 1, 0, 0);
}

function cartaoDeModelo(item) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'studio-model';
  button.dataset.modelo = item ? item.id : '';
  button.setAttribute('aria-pressed', String(item ? modelo?.id === item.id : modelo === null));
  const figura = document.createElement('span');
  figura.className = 'studio-model__art';
  if (item) {
    const canvas = document.createElement('canvas');
    canvas.width = 420;
    canvas.height = Math.round(420 * areaImpressao.height / areaImpressao.width);
    canvas.setAttribute('aria-hidden', 'true');
    figura.appendChild(canvas);
    requestAnimationFrame(() => desenhaMiniatura(canvas, item));
  } else {
    figura.classList.add('studio-model__art--livre');
    figura.innerHTML = '<svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true"><path d="M8 25v8h24v-8M20 27V7M12 15l8-8 8 8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  const nome = document.createElement('span');
  nome.className = 'studio-model__nome';
  nome.textContent = item ? item.nome : 'Sem modelo';
  const descricao = document.createElement('small');
  descricao.textContent = item ? item.descricao : 'Sua arte pronta, do jeito que você fez';
  button.append(figura, nome, descricao);
  button.addEventListener('click', () => escolheModelo(item ? item.id : null));
  return button;
}

function montaCategorias() {
  const lista = [{ id: 'todos', nome: 'Todos' }, ...CATEGORIAS.filter((c) => c.id !== 'livre')];
  el.categories.replaceChildren(...lista.map((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.categoria = item.id;
    button.textContent = item.nome;
    button.setAttribute('aria-pressed', String(categoria === item.id));
    button.addEventListener('click', () => {
      categoria = item.id;
      for (const outro of el.categories.children) outro.setAttribute('aria-pressed', String(outro.dataset.categoria === categoria));
      montaModelos();
    });
    return button;
  }));
}

function montaModelos() {
  const lista = modelosDaCategoria(categoria);
  el.models.replaceChildren(cartaoDeModelo(null), ...lista.map(cartaoDeModelo));
}

function marcaModeloEscolhido() {
  for (const button of el.models.children) {
    button.setAttribute('aria-pressed', String(modelo ? button.dataset.modelo === modelo.id : button.dataset.modelo === ''));
  }
}

function escolheModelo(id) {
  const novo = id ? modeloPorId(id) : null;
  if (novo?.id === modelo?.id) return;
  modelo = novo;
  setError('');
  setStatus('');
  if (modelo) {
    for (const espaco of modelo.fotos) {
      if (!fotos.has(espaco.id)) fotos.set(espaco.id, { asset: null, blob: null, ajuste: { ...AJUSTE_PADRAO } });
    }
    espacoAtivo = modelo.fotos[0]?.id || null;
  } else espacoAtivo = null;
  marcaModeloEscolhido();
  montaEspacos();
  montaFrases();
  atualizaModo();
  schedule();
}

function atualizaModo() {
  el.templateMode.hidden = !modelo;
  el.freeMode.hidden = Boolean(modelo);
  el.freeName.hidden = Boolean(modelo);
  el.templateName.textContent = modelo ? `${modelo.nome}: ${modelo.descricao}.` : '';
  el.adjustments.hidden = Boolean(modelo) && !temFoto();
  syncAdjustFromTarget();
}

function miniaturaDaFoto(item, espaco) {
  const figura = document.createElement('span');
  figura.className = 'studio-slot__thumb';
  if (item?.asset) {
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 96;
    canvas.setAttribute('aria-hidden', 'true');
    const context = canvas.getContext('2d');
    const imagem = item.asset.image;
    const lado = Math.min(item.asset.width, item.asset.height);
    if (context) {
      context.drawImage(imagem, (item.asset.width - lado) / 2, (item.asset.height - lado) / 2, lado, lado, 0, 0, 96, 96);
    }
    figura.appendChild(canvas);
  } else {
    figura.classList.add('studio-slot__thumb--vazio');
    figura.textContent = String(espaco.rotulo.match(/\d/) || '+');
  }
  return figura;
}

function montaEspacos() {
  if (!modelo) { el.slots.replaceChildren(); return; }
  el.slots.replaceChildren(...modelo.fotos.map((espaco) => {
    const item = fotos.get(espaco.id);
    const linha = document.createElement('div');
    linha.className = 'studio-slot';
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'studio-slot__pick';
    botao.dataset.espaco = espaco.id;
    botao.setAttribute('aria-pressed', String(espacoAtivo === espaco.id));
    const textos = document.createElement('span');
    textos.className = 'studio-slot__texto';
    const titulo = document.createElement('span');
    titulo.textContent = espaco.rotulo;
    const estado = document.createElement('small');
    estado.textContent = item?.asset ? item.asset.name : 'Escolher foto';
    textos.append(titulo, estado);
    botao.append(miniaturaDaFoto(item, espaco), textos);
    botao.addEventListener('click', () => {
      selecionaEspaco(espaco.id);
      if (!fotos.get(espaco.id)?.asset) pedeArquivo({ tipo: 'slot', id: espaco.id });
    });
    linha.appendChild(botao);
    if (item?.asset) {
      const acoes = document.createElement('span');
      acoes.className = 'studio-slot__acoes';
      const trocar = document.createElement('button');
      trocar.type = 'button';
      trocar.className = 'studio-text-button';
      trocar.textContent = 'Trocar';
      trocar.setAttribute('aria-label', `Trocar a ${espaco.rotulo.toLowerCase()}`);
      trocar.addEventListener('click', () => { selecionaEspaco(espaco.id); pedeArquivo({ tipo: 'slot', id: espaco.id }); });
      const tirar = document.createElement('button');
      tirar.type = 'button';
      tirar.className = 'studio-text-button';
      tirar.textContent = 'Remover';
      tirar.setAttribute('aria-label', `Remover a ${espaco.rotulo.toLowerCase()}`);
      tirar.addEventListener('click', () => removeFotoDoEspaco(espaco.id));
      acoes.append(trocar, tirar);
      linha.appendChild(acoes);
    }
    return linha;
  }));
}

function montaFrases() {
  if (!modelo || !modelo.textos.length) { el.texts.replaceChildren(); return; }
  el.texts.replaceChildren(...modelo.textos.map((texto) => {
    const label = document.createElement('label');
    label.className = 'studio-name';
    label.htmlFor = `texto-${texto.id}`;
    label.textContent = texto.rotulo;
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `texto-${texto.id}`;
    input.maxLength = texto.max;
    input.value = fraseDe(texto);
    input.addEventListener('input', () => {
      frases.set(texto.id, input.value);
      schedule();
    });
    label.appendChild(input);
    return label;
  }));
}

function selecionaEspaco(id) {
  espacoAtivo = id;
  for (const botao of el.slots.querySelectorAll('.studio-slot__pick')) {
    botao.setAttribute('aria-pressed', String(botao.dataset.espaco === id));
  }
  syncAdjustFromTarget();
}

function removeFotoDoEspaco(id) {
  const item = fotos.get(id);
  item?.asset?.dispose();
  fotos.set(id, { asset: null, blob: null, ajuste: { ...AJUSTE_PADRAO } });
  montaEspacos();
  atualizaModo();
  schedule();
}

/* ---------- arte ---------- */
function pedeArquivo(destino) {
  destinoDoArquivo = destino;
  el.file.value = '';
  el.file.click();
}

function isProjectFile(file) {
  return file && (file.type === 'application/json' || /\.json$/i.test(file.name || ''));
}

async function handleFile(file, destino = destinoDoArquivo) {
  if (!file) return;
  setError('');
  setStatus('');
  if (isProjectFile(file)) return openProject(file);
  try {
    const asset = await loadArtwork(file);
    if (destino?.tipo === 'slot' && modelo) {
      const anterior = fotos.get(destino.id);
      anterior?.asset?.dispose();
      fotos.set(destino.id, { asset, blob: file, ajuste: { ...(anterior?.ajuste || AJUSTE_PADRAO) } });
      espacoAtivo = destino.id;
      montaEspacos();
      atualizaModo();
    } else {
      artwork?.dispose();
      artwork = asset;
      artworkBlob = file;
      el.fileName.textContent = asset.name;
      el.fileInfo.hidden = false;
    }
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
    await handleFile(new File([blob], ARTE_EXEMPLO.nome + '.webp', { type: blob.type || 'image/webp' }), { tipo: 'livre' });
  } catch {
    setError('A arte de exemplo não abriu agora. Escolha uma foto sua.');
  } finally {
    el.example.disabled = false;
  }
}

/* ---------- ajustes (valem para a arte livre ou para a foto escolhida) ---------- */
function alvoDoAjuste() {
  if (!modelo) return state;
  const item = espacoAtivo ? fotos.get(espacoAtivo) : null;
  return item?.asset ? item.ajuste : null;
}

function syncRangeOutputs() {
  el.scaleOut.value = `${el.scale.value}%`;
  el.xOut.value = el.x.value;
  el.yOut.value = el.y.value;
  el.rotationOut.value = `${el.rotation.value}°`;
}

function syncAdjustFromTarget() {
  const alvo = alvoDoAjuste();
  const ativo = Boolean(alvo);
  for (const input of [el.scale, el.x, el.y, el.rotation]) input.disabled = !ativo;
  if (alvo) {
    el.scale.value = String(Math.round(alvo.scale * 100));
    el.x.value = String(Math.round(alvo.offsetX * 100));
    el.y.value = String(Math.round(alvo.offsetY * 100));
    el.rotation.value = String(Math.round(alvo.rotation));
  }
  syncRangeOutputs();
  if (!modelo) el.adjustTarget.textContent = 'Ajusta a arte que está na caneca.';
  else if (alvo) el.adjustTarget.textContent = `Ajusta ${modelo.fotos.find((f) => f.id === espacoAtivo)?.rotulo.toLowerCase() || 'a foto escolhida'}.`;
  else el.adjustTarget.textContent = 'Escolha uma foto para ajustar.';
}

function readAdjustments() {
  const alvo = alvoDoAjuste();
  if (!alvo) return;
  alvo.scale = Number(el.scale.value) / 100;
  alvo.offsetX = Number(el.x.value) / 100;
  alvo.offsetY = Number(el.y.value) / 100;
  alvo.rotation = Number(el.rotation.value);
  syncRangeOutputs();
  schedule();
}

function resetAdjustments() {
  const alvo = alvoDoAjuste();
  if (!alvo) return;
  Object.assign(alvo, AJUSTE_PADRAO);
  syncAdjustFromTarget();
  schedule();
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
    download(blob, `caneca-panda-mimo-previa${modelo ? '-' + slug(modelo.nome) : ''}.png`);
    setStatus('Prévia salva. Anexe na conversa do WhatsApp quando pedir.');
  } catch (error) {
    setStatus(error.message || 'Não foi possível salvar a prévia agora.');
  } finally {
    el.savePreview.disabled = false;
  }
}

async function savePrint() {
  if (!hasContent()) { setStatus('Escolha um modelo, uma arte ou um nome primeiro.'); return; }
  el.savePrint.disabled = true;
  try {
    const { blob, widthPx, heightPx } = await exportPrintArtwork(opcoesDeComposicao({ placeholder: false }));
    download(blob, `caneca-panda-mimo-arte-${MUG_SPEC.printWidthMm}x${MUG_SPEC.printHeightMm}mm-300dpi.png`);
    setStatus(`Arte plana salva em ${widthPx} × ${heightPx} px (300 dpi). A gente confere antes de produzir.`);
  } catch (error) {
    setStatus(error.message || 'Não foi possível preparar a arte agora.');
  } finally {
    el.savePrint.disabled = false;
  }
}

async function saveGuide() {
  el.saveGuide.disabled = true;
  try {
    const { blob, larguraPx, alturaPx } = await exportGuideArtwork(MUG_SPEC);
    download(blob, `gabarito-caneca-panda-mimo-${larguraPx}x${alturaPx}.png`);
    setStatus(`Gabarito salvo em ${larguraPx} × ${alturaPx} px. No Canva, crie um projeto desse tamanho e use o gabarito como fundo.`);
  } catch (error) {
    setStatus(error.message || 'Não foi possível preparar o gabarito agora.');
  } finally {
    el.saveGuide.disabled = false;
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
    const arquivoDe = async (blob, nome) => (blob ? { nome, tipo: blob.type, dados: await blobToDataUrl(blob) } : null);
    const fotosSalvas = {};
    if (modelo) {
      for (const [id, item] of fotos) {
        if (!item.asset || !item.blob) continue;
        fotosSalvas[id] = { ...(await arquivoDe(item.blob, item.asset.name)), ajuste: { ...item.ajuste } };
      }
    }
    const project = {
      tipo: PROJETO_TIPO, versao: PROJETO_VERSAO, salvoEm: new Date().toISOString(),
      peca: { modelo: 'Caneca reta 325 ml', ...MUG_SPEC },
      escolhas: { ...state },
      modelo: modelo ? modelo.id : null,
      frases: modelo ? Object.fromEntries(modelo.textos.map((t) => [t.id, fraseDe(t)])) : {},
      fotos: fotosSalvas,
      arte: modelo ? null : await arquivoDe(artworkBlob, artwork?.name),
    };
    download(new Blob([JSON.stringify(project)], { type: 'application/json' }), `caneca-panda-mimo${modelo ? '-' + slug(modelo.nome) : ''}.json`);
    setStatus('Projeto salvo. Para continuar depois, solte esse arquivo na área da arte.');
  } catch (error) {
    setStatus(error.message || 'Não foi possível salvar o projeto agora.');
  } finally {
    el.saveProject.disabled = false;
  }
}

async function arquivoDeDados(registro) {
  const response = await fetch(registro.dados);
  const blob = await response.blob();
  return new File([blob], registro.nome || 'Minha foto', { type: registro.tipo || blob.type });
}

async function openProject(file) {
  try {
    const project = JSON.parse(await file.text());
    if (project?.tipo !== PROJETO_TIPO || !project.escolhas) throw new Error('Esse arquivo não é um projeto de caneca da Panda Mimo.');
    const c = project.escolhas;
    setColors(c.inside, c.handle);
    el.name.value = String(c.name || '').slice(0, 24);
    el.font.value = LETRAS[c.fontFamily] ? c.fontFamily : 'Fredoka';
    el.panda.checked = c.withPanda !== false;
    readTextOptions();
    escolheModelo(project.modelo || null);
    if (modelo) {
      for (const [id, valor] of Object.entries(project.frases || {})) frases.set(id, String(valor).slice(0, 40));
      montaFrases();
      for (const espaco of modelo.fotos) {
        const registro = project.fotos?.[espaco.id];
        if (!registro?.dados) { removeFotoDoEspaco(espaco.id); continue; }
        await handleFile(await arquivoDeDados(registro), { tipo: 'slot', id: espaco.id });
        const item = fotos.get(espaco.id);
        if (item && registro.ajuste) Object.assign(item.ajuste, registro.ajuste);
      }
    } else {
      if (LAYOUTS[c.layout]) { state.layout = c.layout; el.form.elements.layout.value = c.layout; }
      Object.assign(state, { scale: Number(c.scale) || 1, offsetX: Number(c.offsetX) || 0, offsetY: Number(c.offsetY) || 0, rotation: Number(c.rotation) || 0 });
      if (project.arte?.dados) await handleFile(await arquivoDeDados(project.arte), { tipo: 'livre' });
      else removeArtwork();
    }
    syncAdjustFromTarget();
    schedule();
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

  el.choose.addEventListener('click', () => pedeArquivo({ tipo: 'livre' }));
  el.file.addEventListener('change', () => handleFile(el.file.files?.[0]));
  const solta = (event) => {
    event.preventDefault();
    el.drop.classList.remove('dragging');
    handleFile(event.dataTransfer?.files?.[0], { tipo: 'livre' });
  };
  el.drop.addEventListener('dragover', (event) => { event.preventDefault(); el.drop.classList.add('dragging'); });
  el.drop.addEventListener('dragleave', () => el.drop.classList.remove('dragging'));
  el.drop.addEventListener('drop', solta);
  // Com um modelo escolhido, soltar um arquivo preenche o espaço de foto selecionado.
  el.slots.addEventListener('dragover', (event) => event.preventDefault());
  el.slots.addEventListener('drop', (event) => {
    event.preventDefault();
    if (espacoAtivo) handleFile(event.dataTransfer?.files?.[0], { tipo: 'slot', id: espacoAtivo });
  });
  document.addEventListener('paste', (event) => {
    const item = [...(event.clipboardData?.items || [])].find((i) => i.kind === 'file' && i.type.startsWith('image/'));
    if (item) handleFile(item.getAsFile(), modelo && espacoAtivo ? { tipo: 'slot', id: espacoAtivo } : { tipo: 'livre' });
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
  el.saveGuide.addEventListener('click', saveGuide);
  el.saveProject.addEventListener('click', saveProject);
  el.form.addEventListener('submit', (event) => event.preventDefault());

  // Quando pagina.js trocar o número do WhatsApp, o texto do pedido acompanha.
  new MutationObserver(updateOrderLink).observe(el.order, { attributes: true, attributeFilter: ['href'] });
  document.fonts?.addEventListener?.('loadingdone', () => { montaModelos(); marcaModeloEscolhido(); schedule(); });
  window.addEventListener('pagehide', () => {
    viewer?.dispose();
    artwork?.dispose();
    for (const item of fotos.values()) item.asset?.dispose();
  });
}

async function init() {
  bind();
  el.sizeGuide.textContent = `${medida.larguraCm.toFixed(0)} × ${medida.alturaCm.toFixed(0)} cm (${medida.larguraPx} × ${medida.alturaPx} px a ${medida.dpi} dpi)`;
  montaCategorias();
  montaModelos();
  atualizaModo();
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
