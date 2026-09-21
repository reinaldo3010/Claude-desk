/**
 * Estúdio da caneca: liga o formulário à arte em camadas (modelos.js), ao editor de arte
 * (arte.js) e à prévia 3D (caneca-3d.js).
 *
 * A pessoa edita em cima da própria caneca: clica para escolher um item, arrasta para mover,
 * solta uma foto onde quiser. O painel ao lado mostra o mesmo item, com texto, fonte, cor,
 * tamanho e ordem.
 *
 * Nada sai deste navegador: as fotos ficam em memória e só viram arquivo quando a pessoa baixa
 * a prévia, a arte plana, o gabarito ou o projeto. O pedido segue pelo WhatsApp, com as escolhas
 * escritas no texto.
 */
import { createMugViewer, MUG_SPEC } from './caneca-3d.js';
import { loadArtwork, composeArtwork, exportPrintArtwork, exportGuideArtwork, tamanhoRecomendado, printAreaOf } from './arte.js';
import {
  CATEGORIAS, ADESIVOS, ENFEITES, CORES_DE_ARTE, FONTES, FORMAS_DE_FOTO, ROTULOS,
  modeloPorId, modelosDaCategoria, novaArte, desenhaArte, desenhaForma, camadaEm,
  alcasDaCamada, medidorDeTexto, cor,
} from './modelos.js';

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
const LETRAS = { Fredoka: 'Redondinha', Caveat: 'Manuscrita', Nunito: 'Simples' };
const PANDA_ADESIVO = 'assets/panda-coracao.webp';
const ARTE_EXEMPLO = { url: 'assets/coracao-jeito.webp', nome: 'Arte da Panda Mimo (exemplo)' };
const PROJETO_TIPO = 'panda-mimo/caneca';
const PROJETO_VERSAO = 4;
const MEUS_MODELOS = 'pm_caneca_meus_modelos';
const PASSOS_GUARDADOS = 60;
const LIMITES = Object.freeze({
  fraseTamanho: [3, 22], enfeiteTamanho: [0.04, 0.5], adesivoTamanho: [0.06, 0.6],
  fotoLargura: [0.06, 0.6], giro: [-180, 180],
});

const $ = (id) => document.getElementById(id);
const el = {
  viewport: $('mug-viewport'), loading: $('viewer-loading'), fallback: $('viewer-fallback'), retry: $('viewer-retry'),
  zoom: $('mug-zoom'), flat: $('flat-art'), flatDetails: $('flat-details'),
  form: $('mug-form'), inside: $('inside-color'), handle: $('handle-color'),
  categories: $('model-categories'), models: $('model-list'), moreModels: $('model-more'),
  templateMode: $('template-mode'), templateName: $('template-name'),
  camadas: $('camadas'), props: $('camada-props'),
  desfazer: $('desfazer'), refazer: $('refazer'),
  salvarModelo: $('salvar-modelo'), apagarModelo: $('apagar-modelo'), formMeuModelo: $('form-meu-modelo'),
  nomeMeuModelo: $('nome-meu-modelo'), confirmarMeuModelo: $('confirmar-meu-modelo'), cancelarMeuModelo: $('cancelar-meu-modelo'),
  addFoto: $('add-foto'), addFrase: $('add-frase'), addEnfeite: $('add-enfeite'), addPandinha: $('add-pandinha'),
  freeMode: $('free-mode'), freeName: $('free-name'),
  drop: $('art-drop'), file: $('art-file'), choose: $('choose-art'), fileInfo: $('art-file-info'), fileName: $('art-file-name'),
  remove: $('remove-art'), example: $('use-example'), error: $('art-error'),
  adjustments: $('art-adjustments'), adjustTarget: $('adjust-target'),
  scale: $('art-scale'), x: $('art-x'), y: $('art-y'), rotation: $('art-rotation'),
  scaleOut: $('scale-value'), xOut: $('x-value'), yOut: $('y-value'), rotationOut: $('rotation-value'), reset: $('reset-art'),
  name: $('art-name'), font: $('art-font'), panda: $('art-panda'),
  sizeGuide: $('size-guide'), saveGuide: $('save-guide'), canvaFile: $('canva-file'), importarCanva: $('importar-canva'),
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
let arte = null;              // arte em camadas (null = arte livre, a pessoa trouxe a dela)
let modeloAtual = null;
let categoria = 'todos';
let mostrarTodosOsModelos = false;
let artwork = null;           // arte livre: { image, width, height, name, dispose }
let artworkBlob = null;
const fotos = new Map();      // id da camada de foto → { asset, blob }
const lixeira = new Map();    // fotos tiradas da arte, guardadas para o desfazer
const historico = { passado: [], futuro: [], ultimaChave: '', ultimoInstante: 0 };
const adesivos = new Map();   // arquivo → Image já carregada
let selecionada = null;       // id da camada em edição
let arrasto = null;           // { id, dx, dy } enquanto o dedo está pressionado
let destinoDoArquivo = { tipo: 'livre' };
let viewer = null;
let pandaImage = null;
let frame = 0;
let contador = 0;
const textureCanvas = document.createElement('canvas');
const medidorCanvas = document.createElement('canvas').getContext('2d');
const medidor = medidorCanvas ? medidorDeTexto(medidorCanvas) : null;
const medida = tamanhoRecomendado(MUG_SPEC);
const areaMm = printAreaOf(MUG_SPEC);
const VOLTA_MM = Math.PI * MUG_SPEC.diameterMm;
const ALTURA_MM = MUG_SPEC.heightMm;

/* ---------- utilidades ---------- */
const clamp = (valor, min, max) => Math.min(max, Math.max(min, valor));
const clone = (valor) => (typeof structuredClone === 'function' ? structuredClone(valor) : JSON.parse(JSON.stringify(valor)));
const novoId = () => `c${(contador += 1)}`;

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
const camadaPorId = (id) => arte?.camadas.find((camada) => camada.id === id) || null;
const camadasDeFoto = () => (arte ? arte.camadas.filter((camada) => camada.tipo === 'foto') : []);
const hasContent = () => Boolean(arte || artwork || state.name || state.withPanda);

/** Ponto da arte, em milímetros, a partir da fração da área de impressão. */
const pontoMm = (fracao) => ({ x: areaMm.x + fracao.x * areaMm.width, y: areaMm.y + fracao.y * areaMm.height });

/** O ponto que o dedo tocou no 3D vira fração da área de impressão. */
function fracaoDoPonto3D(ponto) {
  const mmX = ponto.u * VOLTA_MM;
  const mmY = (1 - ponto.v) * ALTURA_MM;
  return { x: (mmX - areaMm.x) / areaMm.width, y: (mmY - areaMm.y) / areaMm.height };
}

/** O mesmo para um clique na vista aberta, que mostra exatamente a área de impressão. */
function fracaoDoEventoPlano(event) {
  const bounds = el.flat.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return null;
  return { x: (event.clientX - bounds.left) / bounds.width, y: (event.clientY - bounds.top) / bounds.height };
}

/* ---------- desfazer e refazer ---------- */
const retrato = () => ({ arte: clone(arte), fotos: [...fotos.keys()] });

/**
 * Guarda como a arte está antes de mudar. Mudanças seguidas do mesmo tipo (arrastar, digitar,
 * puxar um controle) entram como um passo só: desfazer volta o gesto inteiro, não cada pixel.
 */
function registra(chave = 'estrutura') {
  if (!arte) return;
  const agora = Date.now();
  if (chave === historico.ultimaChave && agora - historico.ultimoInstante < 900) {
    historico.ultimoInstante = agora;
    return;
  }
  historico.ultimaChave = chave;
  historico.ultimoInstante = agora;
  historico.passado.push(retrato());
  if (historico.passado.length > PASSOS_GUARDADOS) historico.passado.shift();
  historico.futuro.length = 0;
  atualizaHistorico();
}

function limpaHistorico() {
  historico.passado.length = 0;
  historico.futuro.length = 0;
  historico.ultimaChave = '';
  atualizaHistorico();
}

function atualizaHistorico() {
  el.desfazer.disabled = !historico.passado.length;
  el.refazer.disabled = !historico.futuro.length;
}

/** Volta as fotos para o estado daquele passo: o que saiu fica na lixeira e pode voltar. */
function aplicaRetrato(retratoSalvo) {
  arte = retratoSalvo.arte;
  modeloAtual = acheModelo(arte.modelo);
  const querem = new Set(retratoSalvo.fotos);
  for (const [id, item] of [...fotos]) {
    if (!querem.has(id)) { lixeira.set(id, item); fotos.delete(id); }
  }
  for (const id of querem) {
    if (!fotos.has(id) && lixeira.has(id)) { fotos.set(id, lixeira.get(id)); lixeira.delete(id); }
  }
  if (!arte.camadas.some((camada) => camada.id === selecionada)) selecionada = arte.camadas.at(-1)?.id || null;
  historico.ultimaChave = '';
  montaCamadas();
  montaPropriedades();
  marcaModeloEscolhido();
  atualizaHistorico();
  schedule();
}

function desfaz() {
  if (!historico.passado.length) return;
  historico.futuro.push(retrato());
  aplicaRetrato(historico.passado.pop());
}

function refaz() {
  if (!historico.futuro.length) return;
  historico.passado.push(retrato());
  aplicaRetrato(historico.futuro.pop());
}

/* ---------- meus modelos (ficam só neste navegador) ---------- */
let meusModelos = [];

function carregaMeusModelos() {
  try {
    const guardado = JSON.parse(localStorage.getItem(MEUS_MODELOS) || '[]');
    meusModelos = Array.isArray(guardado) ? guardado.filter((m) => m?.id && Array.isArray(m.camadas)) : [];
  } catch {
    meusModelos = [];
  }
}

function guardaMeusModelos() {
  try {
    localStorage.setItem(MEUS_MODELOS, JSON.stringify(meusModelos));
    return true;
  } catch {
    return false;
  }
}

const acheModelo = (id) => meusModelos.find((m) => m.id === id) || modeloPorId(id);
const ehMeuModelo = (id) => meusModelos.some((m) => m.id === id);

function listaDeModelos(qual) {
  if (qual === 'meus') return meusModelos;
  const base = modelosDaCategoria(qual);
  return qual === 'todos' ? [...meusModelos, ...base] : base;
}

function salvaModeloAtual() {
  const nome = el.nomeMeuModelo.value.trim();
  if (!arte || !nome) { setError('Dê um nome para o seu modelo.'); return; }
  setError('');
  const meu = {
    id: `meu-${Date.now().toString(36)}`,
    categoria: 'meus',
    nome,
    descricao: 'Modelo seu, guardado neste navegador',
    fundo: arte.fundo,
    semente: arte.semente,
    enfeites: clone(arte.enfeites),
    // O modelo guarda a montagem, não as fotos: quem usar coloca as suas.
    camadas: clone(arte.camadas),
  };
  meusModelos = [meu, ...meusModelos].slice(0, 30);
  if (!guardaMeusModelos()) {
    meusModelos = meusModelos.filter((m) => m.id !== meu.id);
    setStatus('Este navegador não deixou guardar o modelo. Salve o projeto em arquivo no passo 4.');
    return;
  }
  arte.modelo = meu.id;
  modeloAtual = meu;
  el.formMeuModelo.hidden = true;
  el.nomeMeuModelo.value = '';
  montaCategorias();
  montaModelos();
  marcaModeloEscolhido();
  atualizaModo();
  setStatus(`"${nome}" entrou em Meus modelos. Ele fica só neste navegador.`);
}

function apagaMeuModelo() {
  if (!arte || !ehMeuModelo(arte.modelo)) return;
  const nome = modeloAtual?.nome || 'o modelo';
  meusModelos = meusModelos.filter((m) => m.id !== arte.modelo);
  guardaMeusModelos();
  if (categoria === 'meus' && !meusModelos.length) categoria = 'todos';
  montaCategorias();
  montaModelos();
  marcaModeloEscolhido();
  atualizaModo();
  setStatus(`"${nome}" saiu de Meus modelos. A arte continua aqui na tela.`);
}

/* ---------- composição ---------- */
function opcoesDeComposicao(extra = {}) {
  const base = { state, spec: MUG_SPEC, ...extra };
  if (!arte) return { ...base, artwork, pandaImage };
  const fotosDaArte = {};
  for (const [id, item] of fotos) {
    if (item.asset) fotosDaArte[id] = { image: item.asset.image, width: item.asset.width, height: item.asset.height };
  }
  return { ...base, arte, fotos: fotosDaArte, imagens: Object.fromEntries(adesivos), medidor };
}

function schedule() {
  if (frame) return;
  frame = requestAnimationFrame(() => { frame = 0; render(); });
}

function render() {
  const { canvas, placement, warnings } = composeArtwork(opcoesDeComposicao({ widthPx: 2048 }), textureCanvas);
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
  context.setTransform(1, 0, 0, 1, 0, 0);
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
  // Contorno e alças de quem está sendo editado. Ficam só aqui: não entram na textura,
  // na prévia baixada nem no arquivo de impressão.
  const camada = camadaPorId(selecionada);
  if (camada) desenhaSelecao(context, camada, area);
}

/** Quantos pixels do canvas cabem em um milímetro, e quantos em um pixel da tela. */
function escalasDaVistaAberta(area) {
  const bounds = el.flat.getBoundingClientRect();
  const porMm = el.flat.width / area.width;
  const porPixelDeTela = bounds.width ? el.flat.width / bounds.width : 1;
  return { porMm, porPixelDeTela, bounds };
}

function desenhaSelecao(context, camada, area) {
  const { porMm, porPixelDeTela } = escalasDaVistaAberta(area);
  const alcas = alcasDaCamada(camada, area, medidor);
  const caixa = alcas.caixa;
  const lado = 13 * porPixelDeTela;
  context.save();
  context.translate((caixa.centroX - area.x) * porMm, (caixa.centroY - area.y) * porMm);
  context.rotate((camada.rotacao || 0) * Math.PI / 180);
  const meiaLargura = caixa.width * porMm / 2;
  const meiaAltura = caixa.height * porMm / 2;
  context.strokeStyle = cor('--peach-ink');
  context.lineWidth = 2 * porPixelDeTela;
  context.setLineDash([5 * porPixelDeTela, 4 * porPixelDeTela]);
  context.strokeRect(-meiaLargura, -meiaAltura, meiaLargura * 2, meiaAltura * 2);
  context.setLineDash([]);
  // Haste e botão de girar, do lado em que ele coube.
  const sentido = alcas.giro.acima ? -1 : 1;
  context.beginPath();
  context.moveTo(0, sentido * meiaAltura);
  context.lineTo(0, sentido * (meiaAltura + 6 * porMm));
  context.stroke();
  context.fillStyle = cor('--paper');
  context.beginPath();
  context.arc(0, sentido * (meiaAltura + 6 * porMm), lado * 0.55, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    context.fillStyle = cor('--paper');
    context.beginPath();
    context.rect(dx * meiaLargura - lado / 2, dy * meiaAltura - lado / 2, lado, lado);
    context.fill();
    context.stroke();
  }
  context.restore();
}

/* ---------- pedido no WhatsApp ---------- */
function frasesDaArte() {
  const vistas = new Set();
  const lista = [];
  for (const camada of arte?.camadas || []) {
    if (camada.tipo !== 'frase') continue;
    const texto = String(camada.texto || '').trim();
    const chave = camada.grupo ? `g:${camada.grupo}` : `t:${texto}`;
    if (!texto || vistas.has(chave)) continue;
    vistas.add(chave);
    lista.push(texto);
  }
  return lista;
}

function orderMessage() {
  const lines = ['Oi, Panda Mimo! Montei uma caneca no site 🐼', '• Caneca reta de 325 ml, branca por fora'];
  lines.push(`• Interior: ${optionLabel(el.inside, state.inside)} · Alça: ${optionLabel(el.handle, state.handle)}`);
  if (arte) {
    const espacos = camadasDeFoto();
    const escolhidas = espacos.filter((camada) => fotos.get(camada.id)?.asset);
    lines.push(`• Modelo: ${modeloAtual?.nome || 'arte montada aqui'} (arte ao redor)`);
    lines.push(`• Fotos escolhidas: ${escolhidas.length} de ${espacos.length}`);
    const frases = frasesDaArte();
    if (frases.length) lines.push(`• Frases: ${frases.map((f) => `"${f}"`).join(' · ')}`);
    const enfeites = arte.camadas.filter((camada) => camada.tipo === 'enfeite').length;
    if (enfeites) lines.push(`• Enfeites acrescentados: ${enfeites}`);
  } else {
    if (artwork) lines.push(`• Arte: ${artwork.name}, ${LAYOUTS[state.layout]}`);
    if (state.name) lines.push(`• Nome ou frase: "${state.name}" (letra ${LETRAS[state.fontFamily] || state.fontFamily})`);
  }
  const temPandinha = arte ? arte.camadas.some((camada) => camada.tipo === 'adesivo') && state.withPanda : state.withPanda;
  lines.push(temPandinha ? '• Com o Pandinha' : '• Sem o Pandinha');
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

/** O dedo em cima da caneca: escolhe, arrasta e abre para editar. */
function aoPonteiro({ tipo, ponto }) {
  if (!arte || !ponto) {
    if (tipo === 'soltou') arrasto = null;
    return false;
  }
  const fracao = fracaoDoPonto3D(ponto);
  if (tipo === 'passou') return Boolean(camadaEm(arte, pontoMm(fracao), areaMm, medidor));
  if (tipo === 'apertou') {
    const camada = camadaEm(arte, pontoMm(fracao), areaMm, medidor);
    if (!camada) return false;
    seleciona(camada.id, { mostrarPainel: true });
    registra(`mover:${camada.id}`);
    arrasto = { id: camada.id, dx: camada.x - fracao.x, dy: camada.y - fracao.y };
    return true;
  }
  if (tipo === 'moveu' && arrasto) {
    moveCamada(arrasto, fracao);
    return true;
  }
  if (tipo === 'soltou') {
    arrasto = null;
    return false;
  }
  if (tipo === 'dobrou') {
    const camada = camadaEm(arte, pontoMm(fracao), areaMm, medidor);
    if (camada) {
      seleciona(camada.id);
      el.props.querySelector('input[type="text"], select, button')?.focus();
    }
  }
  return false;
}

function moveCamada(gesto, fracao) {
  const camada = camadaPorId(gesto.id);
  if (!camada) return;
  camada.x = clamp(fracao.x + gesto.dx, 0, 1);
  camada.y = clamp(fracao.y + gesto.dy, 0, 1);
  schedule();
}

async function startViewer() {
  el.fallback.hidden = true;
  el.loading.hidden = false;
  if (viewer) { viewer.dispose(); viewer = null; }
  try {
    viewer = await createMugViewer(el.viewport, {
      onError: showFallback,
      onPointer: aoPonteiro,
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
function desenhaMiniatura(canvas, modelo) {
  const context = canvas.getContext('2d');
  if (!context) return;
  const escalaX = canvas.width / areaMm.width;
  const escalaY = canvas.height / areaMm.height;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.setTransform(escalaX, 0, 0, escalaY, -areaMm.x * escalaX, -areaMm.y * escalaY);
  desenhaArte(context, novaArte(modelo), areaMm, { imagens: Object.fromEntries(adesivos) });
  context.setTransform(1, 0, 0, 1, 0, 0);
}

function cartaoDeModelo(modelo) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'studio-model';
  button.dataset.modelo = modelo ? modelo.id : '';
  button.setAttribute('aria-pressed', String(modelo ? arte?.modelo === modelo.id : arte === null));
  const figura = document.createElement('span');
  figura.className = 'studio-model__art';
  if (modelo) {
    const canvas = document.createElement('canvas');
    canvas.width = 420;
    canvas.height = Math.round(420 * areaMm.height / areaMm.width);
    canvas.setAttribute('aria-hidden', 'true');
    figura.appendChild(canvas);
    requestAnimationFrame(() => desenhaMiniatura(canvas, modelo));
  } else {
    figura.classList.add('studio-model__art--livre');
    figura.innerHTML = '<svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true"><path d="M8 25v8h24v-8M20 27V7M12 15l8-8 8 8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  const nome = document.createElement('span');
  nome.className = 'studio-model__nome';
  nome.textContent = modelo ? modelo.nome : 'Sem modelo';
  const descricao = document.createElement('small');
  descricao.textContent = modelo ? modelo.descricao : 'Sua arte pronta, do jeito que você fez';
  button.append(figura, nome, descricao);
  button.addEventListener('click', () => escolheModelo(modelo ? modelo.id : null));
  return button;
}

function montaCategorias() {
  const lista = [
    { id: 'todos', nome: 'Todos' },
    ...(meusModelos.length ? [{ id: 'meus', nome: 'Meus modelos' }] : []),
    ...CATEGORIAS.filter((c) => c.id !== 'livre'),
  ];
  el.categories.replaceChildren(...lista.map((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.categoria = item.id;
    button.textContent = item.nome;
    button.setAttribute('aria-pressed', String(categoria === item.id));
    button.addEventListener('click', () => {
      categoria = item.id;
      mostrarTodosOsModelos = false;
      for (const outro of el.categories.children) outro.setAttribute('aria-pressed', String(outro.dataset.categoria === categoria));
      montaModelos();
    });
    return button;
  }));
}

const VISIVEIS_DE_INICIO = 6;

function montaModelos() {
  const lista = listaDeModelos(categoria);
  // Com um modelo escolhido que está mais para baixo, a lista já abre inteira.
  const escondido = arte && !lista.slice(0, VISIVEIS_DE_INICIO).some((m) => m.id === arte.modelo) && lista.some((m) => m.id === arte.modelo);
  const todos = mostrarTodosOsModelos || escondido;
  const visiveis = todos ? lista : lista.slice(0, VISIVEIS_DE_INICIO);
  el.models.replaceChildren(cartaoDeModelo(null), ...visiveis.map(cartaoDeModelo));
  const sobram = lista.length - visiveis.length;
  el.moreModels.textContent = sobram ? `Ver mais ${sobram} ${sobram === 1 ? 'modelo' : 'modelos'}` : 'Ver menos modelos';
  el.moreModels.hidden = lista.length <= VISIVEIS_DE_INICIO;
}

function marcaModeloEscolhido() {
  for (const button of el.models.children) {
    button.setAttribute('aria-pressed', String(arte ? button.dataset.modelo === arte.modelo : button.dataset.modelo === ''));
  }
}

async function garanteAdesivos() {
  const arquivos = new Set((arte?.camadas || []).filter((c) => c.tipo === 'adesivo').map((c) => c.arquivo));
  let mudou = false;
  for (const arquivo of arquivos) {
    if (adesivos.has(arquivo)) continue;
    try {
      adesivos.set(arquivo, await loadImage(arquivo));
      mudou = true;
    } catch (erro) {
      console.warn(erro.message);
    }
  }
  if (mudou) { schedule(); montaModelos(); marcaModeloEscolhido(); }
}

function escolheModelo(id) {
  const modelo = id ? acheModelo(id) : null;
  if (modelo ? arte?.modelo === modelo.id : arte === null) return;
  for (const item of fotos.values()) item.asset?.dispose();
  fotos.clear();
  modeloAtual = modelo;
  arte = modelo ? novaArte(modelo) : null;
  selecionada = arte ? (camadasDeFoto()[0]?.id || arte.camadas[0]?.id || null) : null;
  setError('');
  setStatus('');
  limpaHistorico();
  marcaModeloEscolhido();
  atualizaModo();
  // Com um modelo na mão, a vista aberta já abre: dá para arrastar as coisas ali também.
  if (modelo && el.flatDetails) el.flatDetails.open = true;
  garanteAdesivos();
  schedule();
}

function atualizaModo() {
  el.templateMode.hidden = !arte;
  el.freeMode.hidden = Boolean(arte);
  el.freeName.hidden = Boolean(arte);
  el.adjustments.hidden = Boolean(arte);
  el.templateName.textContent = modeloAtual ? `${modeloAtual.nome}: ${modeloAtual.descricao}.` : '';
  el.apagarModelo.hidden = !(arte && ehMeuModelo(arte.modelo));
  el.salvarModelo.hidden = !arte;
  if (!arte) el.formMeuModelo.hidden = true;
  atualizaHistorico();
  montaCamadas();
  montaPropriedades();
  if (!arte) syncRangeOutputs();
}

/* ---------- camadas ---------- */
function rotuloDaCamada(camada) {
  if (camada.tipo === 'frase') return String(camada.texto || 'Frase').slice(0, 30) || 'Frase';
  if (camada.tipo === 'foto') return camada.rotulo || 'Foto';
  if (camada.tipo === 'enfeite') return ENFEITES.find((e) => e.forma === camada.forma)?.nome || 'Enfeite';
  return 'Pandinha';
}

function icone(camada) {
  const span = document.createElement('span');
  span.className = 'studio-camada__icone';
  span.setAttribute('aria-hidden', 'true');
  if (camada.tipo === 'foto') {
    const item = fotos.get(camada.id);
    if (item?.asset) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 72;
      const context = canvas.getContext('2d');
      const lado = Math.min(item.asset.width, item.asset.height);
      context?.drawImage(item.asset.image, (item.asset.width - lado) / 2, (item.asset.height - lado) / 2, lado, lado, 0, 0, 72, 72);
      span.appendChild(canvas);
      return span;
    }
    span.textContent = '+';
    span.classList.add('studio-camada__icone--vazio');
    return span;
  }
  if (camada.tipo === 'enfeite') {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 72;
    const context = canvas.getContext('2d');
    if (context) {
      context.translate(36, 36);
      desenhaForma(context, camada.forma, 52, cor(camada.cor));
    }
    span.appendChild(canvas);
    return span;
  }
  if (camada.tipo === 'adesivo') {
    const imagem = adesivos.get(camada.arquivo);
    if (imagem) {
      const img = document.createElement('img');
      img.src = camada.arquivo;
      img.alt = '';
      span.appendChild(img);
      return span;
    }
  }
  span.textContent = camada.tipo === 'frase' ? 'Aa' : '🐼';
  return span;
}

function montaCamadas() {
  if (!arte) { el.camadas.replaceChildren(); return; }
  // A lista mostra de cima para baixo o que está na frente na arte.
  const itens = [...arte.camadas].reverse().map((camada) => {
    const li = document.createElement('li');
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'studio-camada';
    botao.dataset.camada = camada.id;
    botao.setAttribute('aria-pressed', String(selecionada === camada.id));
    const textos = document.createElement('span');
    textos.className = 'studio-camada__texto';
    const titulo = document.createElement('span');
    titulo.textContent = rotuloDaCamada(camada);
    const tipo = document.createElement('small');
    if (camada.tipo === 'foto' && !fotos.get(camada.id)?.asset) tipo.textContent = 'Escolher foto';
    else if (camada.tipo === 'adesivo') tipo.textContent = ADESIVOS.find((a) => a.arquivo === camada.arquivo)?.nome || ROTULOS.adesivo;
    else tipo.textContent = ROTULOS[camada.tipo];
    textos.append(titulo, tipo);
    botao.append(icone(camada), textos);
    botao.addEventListener('click', () => {
      seleciona(camada.id);
      if (camada.tipo === 'foto' && !fotos.get(camada.id)?.asset) pedeArquivo({ tipo: 'camada', id: camada.id });
    });
    li.appendChild(botao);
    return li;
  });
  el.camadas.replaceChildren(...itens);
}

function seleciona(id, { mostrarPainel = false } = {}) {
  selecionada = id;
  for (const botao of el.camadas.querySelectorAll('.studio-camada')) {
    botao.setAttribute('aria-pressed', String(botao.dataset.camada === id));
  }
  montaPropriedades();
  // Escolheu clicando na caneca: o painel do item vem para onde a pessoa consegue ver.
  if (mostrarPainel) {
    const caixa = el.props.getBoundingClientRect();
    if (caixa.top < 0 || caixa.bottom > window.innerHeight) el.props.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  schedule();
}

/* --- construtores de campo do painel de propriedades --- */
function campo(rotulo, controle, classe = '') {
  const label = document.createElement('label');
  label.className = `studio-campo ${classe}`.trim();
  const span = document.createElement('span');
  span.textContent = rotulo;
  label.append(span, controle);
  return label;
}

function campoTexto(rotulo, valor, maximo, aoMudar) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = valor;
  input.maxLength = maximo;
  input.addEventListener('input', () => aoMudar(input.value));
  return campo(rotulo, input);
}

function campoSelect(rotulo, opcoes, valor, aoMudar) {
  const select = document.createElement('select');
  for (const opcao of opcoes) {
    const item = document.createElement('option');
    item.value = opcao.valor;
    item.textContent = opcao.nome;
    select.appendChild(item);
  }
  select.value = valor;
  select.addEventListener('change', () => aoMudar(select.value));
  return campo(rotulo, select);
}

function campoRange(rotulo, valor, [min, max], passo, aoMudar) {
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(passo);
  input.value = String(valor);
  input.addEventListener('input', () => aoMudar(Number(input.value)));
  return campo(rotulo, input, 'studio-campo--range');
}

function campoCores(valor, aoMudar) {
  const grupo = document.createElement('div');
  grupo.className = 'studio-cores';
  grupo.setAttribute('role', 'group');
  grupo.setAttribute('aria-label', 'Cor');
  for (const item of CORES_DE_ARTE) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'studio-cor';
    botao.style.setProperty('--tinta', `var(${item.token})`);
    botao.title = item.nome;
    botao.setAttribute('aria-label', item.nome);
    botao.setAttribute('aria-pressed', String(valor === item.token));
    botao.addEventListener('click', () => {
      for (const outro of grupo.children) outro.setAttribute('aria-pressed', String(outro === botao));
      aoMudar(item.token);
    });
    grupo.appendChild(botao);
  }
  const bloco = document.createElement('div');
  bloco.className = 'studio-campo';
  const titulo = document.createElement('span');
  titulo.textContent = 'Cor';
  bloco.append(titulo, grupo);
  return bloco;
}

function botao(texto, aoClicar, classe = 'studio-text-button') {
  const elemento = document.createElement('button');
  elemento.type = 'button';
  elemento.className = classe;
  elemento.textContent = texto;
  elemento.addEventListener('click', aoClicar);
  return elemento;
}

function montaPropriedades() {
  if (!arte) { el.props.replaceChildren(); return; }
  const camada = camadaPorId(selecionada);
  if (!camada) {
    const aviso = document.createElement('p');
    aviso.className = 'studio-help';
    aviso.textContent = 'Clique num item da caneca ou da lista para editar.';
    el.props.replaceChildren(aviso);
    return;
  }
  const partes = [];
  const titulo = document.createElement('p');
  titulo.className = 'studio-props__titulo';
  titulo.textContent = `Editando: ${rotuloDaCamada(camada)}`;
  partes.push(titulo);

  if (camada.tipo === 'frase') {
    partes.push(campoTexto('Frase', camada.texto || '', 40, (valor) => {
      registra(`texto:${camada.id}`);
      const iguais = camada.grupo ? arte.camadas.filter((c) => c.grupo === camada.grupo) : [camada];
      for (const alvo of iguais) alvo.texto = valor;
      const botaoDaLista = el.camadas.querySelector(`[data-camada="${camada.id}"] .studio-camada__texto > span`);
      if (botaoDaLista) botaoDaLista.textContent = rotuloDaCamada(camada);
      schedule();
    }));
    if (camada.grupo) {
      const nota = document.createElement('p');
      nota.className = 'studio-help';
      nota.textContent = 'Esta frase se repete na volta da caneca: mudou aqui, mudou nas outras.';
      partes.push(nota);
    }
    partes.push(campoSelect('Jeito da letra', FONTES, camada.fonte, (valor) => { registra(`fonte:${camada.id}`); camada.fonte = valor; schedule(); }));
    partes.push(campoCores(camada.cor, (token) => { registra(`cor:${camada.id}`); camada.cor = token; schedule(); }));
    partes.push(campoRange('Tamanho da letra', camada.tamanho, LIMITES.fraseTamanho, 0.5, (valor) => { registra(`tamanho:${camada.id}`); camada.tamanho = valor; schedule(); }));
  }

  if (camada.tipo === 'foto') {
    const item = fotos.get(camada.id);
    const acoes = document.createElement('div');
    acoes.className = 'studio-props__acoes';
    acoes.append(botao(item?.asset ? 'Trocar foto' : 'Escolher foto', () => pedeArquivo({ tipo: 'camada', id: camada.id })));
    if (item?.asset) acoes.append(botao('Tirar a foto', () => tiraFoto(camada.id)));
    partes.push(acoes);
    partes.push(campoSelect('Formato', FORMAS_DE_FOTO, camada.forma, (valor) => { registra(`forma:${camada.id}`); camada.forma = valor; schedule(); }));
    partes.push(campoRange('Tamanho', camada.largura, LIMITES.fotoLargura, 0.005, (valor) => {
      registra(`tamanho:${camada.id}`);
      const proporcao = camada.altura / camada.largura;
      camada.largura = valor;
      camada.altura = clamp(valor * proporcao, 0.05, 1);
      schedule();
    }));
    if (item?.asset) {
      const ajuste = camada.ajuste || (camada.ajuste = { scale: 1, offsetX: 0, offsetY: 0 });
      partes.push(campoRange('Aproximar a foto', ajuste.scale, [1, 3], 0.01, (valor) => { registra(`enquadra:${camada.id}`); ajuste.scale = valor; schedule(); }));
      partes.push(campoRange('Foto para os lados', ajuste.offsetX, [-1, 1], 0.01, (valor) => { registra(`enquadra:${camada.id}`); ajuste.offsetX = valor; schedule(); }));
      partes.push(campoRange('Foto para cima ou para baixo', ajuste.offsetY, [-1, 1], 0.01, (valor) => { registra(`enquadra:${camada.id}`); ajuste.offsetY = valor; schedule(); }));
    }
  }

  if (camada.tipo === 'enfeite') {
    const grade = document.createElement('div');
    grade.className = 'studio-formas';
    grade.setAttribute('role', 'group');
    grade.setAttribute('aria-label', 'Desenho do enfeite');
    for (const item of ENFEITES) {
      const botaoForma = document.createElement('button');
      botaoForma.type = 'button';
      botaoForma.className = 'studio-forma';
      botaoForma.title = item.nome;
      botaoForma.setAttribute('aria-label', item.nome);
      botaoForma.setAttribute('aria-pressed', String(camada.forma === item.forma));
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 56;
      canvas.setAttribute('aria-hidden', 'true');
      const context = canvas.getContext('2d');
      if (context) {
        context.translate(28, 28);
        desenhaForma(context, item.forma, 40, cor(camada.cor));
      }
      botaoForma.appendChild(canvas);
      botaoForma.addEventListener('click', () => {
        registra(`forma:${camada.id}`);
        camada.forma = item.forma;
        montaCamadas();
        montaPropriedades();
        schedule();
      });
      grade.appendChild(botaoForma);
    }
    partes.push(grade);
    partes.push(campoCores(camada.cor, (token) => { registra(`cor:${camada.id}`); camada.cor = token; montaCamadas(); montaPropriedades(); schedule(); }));
    partes.push(campoRange('Tamanho', camada.tamanho, LIMITES.enfeiteTamanho, 0.005, (valor) => { registra(`tamanho:${camada.id}`); camada.tamanho = valor; schedule(); }));
  }

  if (camada.tipo === 'adesivo') {
    partes.push(campoSelect('Pose do Pandinha', ADESIVOS.map((a) => ({ valor: a.arquivo, nome: a.nome })), camada.arquivo, async (valor) => {
      registra(`pose:${camada.id}`);
      camada.arquivo = valor;
      await garanteAdesivos();
      montaCamadas();
      schedule();
    }));
    partes.push(campoRange('Tamanho', camada.tamanho, LIMITES.adesivoTamanho, 0.005, (valor) => { registra(`tamanho:${camada.id}`); camada.tamanho = valor; schedule(); }));
    const nota = document.createElement('p');
    nota.className = 'studio-help';
    nota.textContent = 'Um Pandinha por caneca. Ele acompanha a arte, nunca fica na frente dela.';
    partes.push(nota);
  }

  partes.push(campoRange('Inclinação', camada.rotacao || 0, LIMITES.giro, 1, (valor) => { registra(`giro:${camada.id}`); camada.rotacao = valor; schedule(); }));

  const ordem = document.createElement('div');
  ordem.className = 'studio-props__acoes';
  ordem.append(
    botao('Trazer para frente', () => mudaOrdem(camada.id, 1)),
    botao('Mandar para trás', () => mudaOrdem(camada.id, -1)),
  );
  if (camada.tipo !== 'adesivo') ordem.append(botao('Duplicar', () => duplica(camada.id)));
  ordem.append(botao('Apagar', () => apaga(camada.id)));
  partes.push(ordem);
  el.props.replaceChildren(...partes);
}

function mudaOrdem(id, direcao) {
  registra('estrutura');
  const indice = arte.camadas.findIndex((camada) => camada.id === id);
  const destino = indice + direcao;
  if (indice < 0 || destino < 0 || destino >= arte.camadas.length) return;
  const [camada] = arte.camadas.splice(indice, 1);
  arte.camadas.splice(destino, 0, camada);
  montaCamadas();
  schedule();
}

function duplica(id) {
  const camada = camadaPorId(id);
  if (!camada) return;
  registra('estrutura');
  const copia = { ...camada, id: novoId(), x: clamp(camada.x + 0.03, 0, 1), y: clamp(camada.y + 0.05, 0, 1) };
  delete copia.grupo;
  if (camada.tipo === 'foto') {
    copia.ajuste = { ...(camada.ajuste || {}) };
    copia.rotulo = `${camada.rotulo || 'Foto'} (cópia)`;
    const original = fotos.get(camada.id);
    if (original?.asset) fotos.set(copia.id, { asset: original.asset, blob: original.blob, compartilhada: true });
  }
  arte.camadas.push(copia);
  seleciona(copia.id);
  montaCamadas();
  schedule();
}

function apaga(id) {
  registra('estrutura');
  const indice = arte.camadas.findIndex((camada) => camada.id === id);
  if (indice < 0) return;
  const [camada] = arte.camadas.splice(indice, 1);
  if (camada.tipo === 'foto') tiraFoto(id, false);
  selecionada = arte.camadas[Math.min(indice, arte.camadas.length - 1)]?.id || null;
  montaCamadas();
  montaPropriedades();
  schedule();
}

/** Onde colocar algo novo: no pedaço da caneca que a pessoa está olhando. */
function lugarLivre() {
  const u = viewer?.frenteVisivel?.();
  if (!Number.isFinite(u)) return { x: 0.5, y: 0.5 };
  const fracao = (u * VOLTA_MM - areaMm.x) / areaMm.width;
  return { x: clamp(fracao, 0.08, 0.92), y: 0.5 };
}

function acrescenta(camada) {
  registra('estrutura');
  arte.camadas.push(camada);
  montaCamadas();
  seleciona(camada.id);
  schedule();
  return camada;
}

function adicionaFoto() {
  if (!arte) return;
  const lugar = lugarLivre();
  const camada = acrescenta({
    id: novoId(), tipo: 'foto', rotulo: `Foto ${camadasDeFoto().length + 1}`, forma: 'arredondado',
    x: lugar.x, y: 0.45, largura: 0.24, altura: 0.6, rotacao: 0, ajuste: { scale: 1, offsetX: 0, offsetY: 0 },
  });
  pedeArquivo({ tipo: 'camada', id: camada.id });
}

function adicionaFrase() {
  if (!arte) return;
  const lugar = lugarLivre();
  acrescenta({
    id: novoId(), tipo: 'frase', rotulo: 'Frase', texto: 'escreva aqui',
    x: lugar.x, y: 0.5, tamanho: 10, largura: 0.28, fonte: 'Caveat', cor: '--hand-ink', rotacao: 0,
  });
  el.props.querySelector('input[type="text"]')?.focus();
}

function adicionaEnfeite() {
  if (!arte) return;
  const lugar = lugarLivre();
  acrescenta({
    id: novoId(), tipo: 'enfeite', forma: 'coracao', cor: '--peach-deep',
    x: lugar.x, y: 0.5, tamanho: 0.14, rotacao: 0,
  });
}

async function adicionaPandinha() {
  if (!arte) return;
  el.panda.checked = true;
  state.withPanda = true;
  const existente = arte.camadas.find((camada) => camada.tipo === 'adesivo');
  if (existente) { seleciona(existente.id); return; }
  const lugar = lugarLivre();
  acrescenta({
    id: novoId(), tipo: 'adesivo', rotulo: 'Pandinha', arquivo: ADESIVOS[0].arquivo,
    x: lugar.x, y: 0.78, tamanho: 0.18, rotacao: 0,
  });
  await garanteAdesivos();
  montaCamadas();
  schedule();
}

/* ---------- fotos ---------- */
function pedeArquivo(destino) {
  destinoDoArquivo = destino;
  el.file.value = '';
  el.file.click();
}

function isProjectFile(file) {
  return file && (file.type === 'application/json' || /\.json$/i.test(file.name || ''));
}

function tiraFoto(id, redesenhar = true) {
  if (redesenhar) registra(`foto:${id}`);
  const item = fotos.get(id);
  // A foto vai para a lixeira em vez de sumir: o desfazer precisa dela de volta.
  if (item) lixeira.set(id, item);
  fotos.delete(id);
  const camada = camadaPorId(id);
  if (camada?.ajuste) Object.assign(camada.ajuste, { scale: 1, offsetX: 0, offsetY: 0 });
  if (redesenhar) {
    montaCamadas();
    montaPropriedades();
    schedule();
  }
}

async function handleFile(file, destino = destinoDoArquivo) {
  if (!file) return;
  setError('');
  setStatus('');
  if (isProjectFile(file)) return openProject(file);
  try {
    const asset = await loadArtwork(file);
    if (destino?.tipo === 'camada' && arte) {
      registra(`foto:${destino.id}`);
      const anterior = fotos.get(destino.id);
      if (anterior) lixeira.set(`${destino.id}:${Date.now()}`, anterior);
      fotos.set(destino.id, { asset, blob: file });
      seleciona(destino.id);
      montaCamadas();
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

/** Soltar uma imagem em cima da caneca: se caiu numa foto, troca; se não, cria uma ali. */
async function soltaNaCaneca(event) {
  const arquivo = event.dataTransfer?.files?.[0];
  if (!arquivo || !arte) return;
  event.preventDefault();
  const ponto = viewer?.pontoEm?.(event);
  let destino = null;
  if (ponto) {
    const fracao = fracaoDoPonto3D(ponto);
    const camada = camadaEm(arte, pontoMm(fracao), areaMm, medidor);
    if (camada?.tipo === 'foto') destino = { tipo: 'camada', id: camada.id };
    else {
      const nova = acrescenta({
        id: novoId(), tipo: 'foto', rotulo: `Foto ${camadasDeFoto().length + 1}`, forma: 'arredondado',
        x: clamp(fracao.x, 0.06, 0.94), y: clamp(fracao.y, 0.1, 0.9), largura: 0.24, altura: 0.6,
        rotacao: 0, ajuste: { scale: 1, offsetX: 0, offsetY: 0 },
      });
      destino = { tipo: 'camada', id: nova.id };
    }
  } else {
    const vazia = camadasDeFoto().find((camada) => !fotos.get(camada.id)?.asset);
    destino = vazia ? { tipo: 'camada', id: vazia.id } : null;
  }
  if (destino) await handleFile(arquivo, destino);
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
    await handleFile(new File([blob], `${ARTE_EXEMPLO.nome}.webp`, { type: blob.type || 'image/webp' }), { tipo: 'livre' });
  } catch {
    setError('A arte de exemplo não abriu agora. Escolha uma foto sua.');
  } finally {
    el.example.disabled = false;
  }
}

/* ---------- ajustes da arte livre ---------- */
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

/* ---------- Canva: ida e volta ---------- */
async function saveGuide() {
  el.saveGuide.disabled = true;
  try {
    const { blob, larguraPx, alturaPx } = await exportGuideArtwork(MUG_SPEC);
    download(blob, `gabarito-caneca-panda-mimo-${larguraPx}x${alturaPx}.png`);
    setStatus(`Gabarito salvo em ${larguraPx} × ${alturaPx} px. No Canva, crie um design desse tamanho e use o gabarito como fundo.`);
  } catch (error) {
    setStatus(error.message || 'Não foi possível preparar o gabarito agora.');
  } finally {
    el.saveGuide.disabled = false;
  }
}

async function importaDoCanva(file) {
  if (!file) return;
  escolheModelo(null);
  state.layout = 'wrap';
  if (el.form.elements.layout) el.form.elements.layout.value = 'wrap';
  resetAdjustments();
  await handleFile(file, { tipo: 'livre' });
  if (!artwork) return;
  const proporcao = artwork.width / artwork.height;
  const certa = MUG_SPEC.printWidthMm / MUG_SPEC.printHeightMm;
  if (Math.abs(proporcao - certa) / certa > 0.03) {
    setStatus(`A arte veio em ${artwork.width} × ${artwork.height} px, proporção diferente da volta da caneca. Ela entra inteira, com folga em volta. Para preencher tudo, use ${medida.larguraPx} × ${medida.alturaPx} px.`);
  } else {
    setStatus('Arte do Canva aplicada na volta inteira da caneca. Gire a peça para conferir.');
  }
}

/* ---------- salvar ---------- */
async function savePreview() {
  if (!viewer) return;
  el.savePreview.disabled = true;
  try {
    const blob = await viewer.capture();
    download(blob, `caneca-panda-mimo-previa${modeloAtual ? `-${slug(modeloAtual.nome)}` : ''}.png`);
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
    const { blob, widthPx, heightPx } = await exportPrintArtwork(opcoesDeComposicao());
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
    const arquivoDe = async (blob, nome) => (blob ? { nome, tipo: blob.type, dados: await blobToDataUrl(blob) } : null);
    const fotosSalvas = {};
    if (arte) {
      for (const [id, item] of fotos) {
        if (!item.asset || !item.blob) continue;
        fotosSalvas[id] = await arquivoDe(item.blob, item.asset.name);
      }
    }
    const project = {
      tipo: PROJETO_TIPO, versao: PROJETO_VERSAO, salvoEm: new Date().toISOString(),
      peca: { modelo: 'Caneca reta 325 ml', ...MUG_SPEC },
      escolhas: { ...state },
      arte: arte ? { ...arte, camadas: arte.camadas.map((camada) => ({ ...camada })) } : null,
      fotos: fotosSalvas,
      arteLivre: arte ? null : await arquivoDe(artworkBlob, artwork?.name),
    };
    download(new Blob([JSON.stringify(project)], { type: 'application/json' }), `caneca-panda-mimo${modeloAtual ? `-${slug(modeloAtual.nome)}` : ''}.json`);
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
    if (project.arte?.camadas?.length) {
      escolheModelo(project.arte.modelo || null);
      arte = { ...project.arte, camadas: project.arte.camadas.map((camada) => ({ ...camada })) };
      modeloAtual = acheModelo(arte.modelo);
      contador = arte.camadas.length + 10;
      selecionada = arte.camadas[0]?.id || null;
      marcaModeloEscolhido();
      atualizaModo();
      await garanteAdesivos();
      for (const [id, registro] of Object.entries(project.fotos || {})) {
        if (registro?.dados) await handleFile(await arquivoDeDados(registro), { tipo: 'camada', id });
      }
    } else {
      escolheModelo(null);
      if (LAYOUTS[c.layout]) { state.layout = c.layout; el.form.elements.layout.value = c.layout; }
      el.scale.value = String(Math.round((Number(c.scale) || 1) * 100));
      el.x.value = String(Math.round((Number(c.offsetX) || 0) * 100));
      el.y.value = String(Math.round((Number(c.offsetY) || 0) * 100));
      el.rotation.value = String(Math.round(Number(c.rotation) || 0));
      readAdjustments();
      const registro = project.arteLivre || project.arte;
      if (registro?.dados) await handleFile(await arquivoDeDados(registro), { tipo: 'livre' });
      else removeArtwork();
    }
    schedule();
    setStatus('Projeto aberto. Continue de onde parou.');
  } catch (error) {
    setError(error.message || 'Não conseguimos abrir esse projeto.');
  }
}

/* ---------- edição na vista aberta ---------- */
/** A alça que está debaixo do dedo, se houver: os quatro cantos aumentam, o de cima gira. */
function alcaSobOPonto(event) {
  const camada = camadaPorId(selecionada);
  if (!camada) return null;
  const { bounds } = escalasDaVistaAberta(areaMm);
  if (!bounds.width) return null;
  const porPixel = bounds.width / areaMm.width;
  const naTela = (ponto) => ({
    x: bounds.left + (ponto.x - areaMm.x) * porPixel,
    y: bounds.top + (ponto.y - areaMm.y) * porPixel,
  });
  const perto = (ponto) => Math.hypot(event.clientX - ponto.x, event.clientY - ponto.y) <= 16;
  const alcas = alcasDaCamada(camada, areaMm, medidor);
  if (perto(naTela(alcas.giro))) return { tipo: 'girar', camada, caixa: alcas.caixa };
  for (const canto of alcas.cantos) {
    if (perto(naTela(canto))) return { tipo: 'redimensionar', camada, caixa: alcas.caixa };
  }
  return null;
}

/** Aumenta ou diminui a camada mantendo o centro parado, pelo quanto o dedo se afastou dele. */
function redimensiona(gesto, ponto) {
  const distancia = Math.hypot(ponto.x - gesto.centro.x, ponto.y - gesto.centro.y);
  const fator = clamp(distancia / Math.max(gesto.distanciaInicial, 0.5), 0.15, 8);
  const camada = gesto.camada;
  if (camada.tipo === 'frase') {
    camada.tamanho = clamp(gesto.base.tamanho * fator, LIMITES.fraseTamanho[0], LIMITES.fraseTamanho[1]);
    camada.largura = clamp(gesto.base.largura * fator, 0.05, 0.95);
  } else if (camada.tipo === 'foto') {
    camada.largura = clamp(gesto.base.largura * fator, LIMITES.fotoLargura[0], LIMITES.fotoLargura[1]);
    camada.altura = clamp(gesto.base.altura * fator, 0.06, 1);
  } else {
    const limite = camada.tipo === 'adesivo' ? LIMITES.adesivoTamanho : LIMITES.enfeiteTamanho;
    camada.tamanho = clamp(gesto.base.tamanho * fator, limite[0], limite[1]);
  }
  schedule();
}

/** Gira pelo ângulo que o dedo descreveu em volta do centro, encostando no reto quando chega perto. */
function gira(gesto, ponto) {
  const angulo = Math.atan2(ponto.y - gesto.centro.y, ponto.x - gesto.centro.x);
  let graus = gesto.base.rotacao + (angulo - gesto.anguloInicial) * 180 / Math.PI;
  graus = ((graus + 180) % 360 + 360) % 360 - 180;
  for (const marco of [-180, -90, 0, 90, 180]) if (Math.abs(graus - marco) < 4) graus = marco;
  gesto.camada.rotacao = Math.round(graus);
  montaPropriedades();
  schedule();
}

// Segurar o ponteiro mantém o arrasto mesmo se o dedo sair do desenho; nem todo navegador
// (nem um evento simulado em teste) tem ponteiro ativo, então a falha aqui é inofensiva.
const capturaPonteiro = (event) => { try { el.flat.setPointerCapture(event.pointerId); } catch { /* sem captura */ } };
const soltaPonteiro = (event) => { try { el.flat.releasePointerCapture(event.pointerId); } catch { /* idem */ } };

function ligaVistaAberta() {
  el.flat.addEventListener('pointerdown', (event) => {
    if (!arte) return;
    const fracao = fracaoDoEventoPlano(event);
    if (!fracao) return;
    const ponto = pontoMm(fracao);
    const alca = alcaSobOPonto(event);
    if (alca) {
      registra(`${alca.tipo}:${alca.camada.id}`);
      const centro = { x: alca.caixa.centroX, y: alca.caixa.centroY };
      arrasto = {
        tipo: alca.tipo, id: alca.camada.id, camada: alca.camada, centro,
        distanciaInicial: Math.hypot(ponto.x - centro.x, ponto.y - centro.y),
        anguloInicial: Math.atan2(ponto.y - centro.y, ponto.x - centro.x),
        base: { ...alca.camada },
      };
      capturaPonteiro(event);
      event.preventDefault();
      return;
    }
    const camada = camadaEm(arte, ponto, areaMm, medidor);
    // Clicar no vazio solta a seleção: somem o contorno e as alças.
    if (!camada) { if (selecionada) seleciona(null); return; }
    seleciona(camada.id);
    registra(`mover:${camada.id}`);
    arrasto = { tipo: 'mover', id: camada.id, dx: camada.x - fracao.x, dy: camada.y - fracao.y };
    capturaPonteiro(event);
    event.preventDefault();
  });
  el.flat.addEventListener('pointermove', (event) => {
    if (!arte) return;
    const fracao = fracaoDoEventoPlano(event);
    if (!fracao) return;
    if (arrasto?.tipo === 'redimensionar') { redimensiona(arrasto, pontoMm(fracao)); return; }
    if (arrasto?.tipo === 'girar') { gira(arrasto, pontoMm(fracao)); return; }
    if (arrasto) { moveCamada(arrasto, fracao); return; }
    const alca = alcaSobOPonto(event);
    if (alca) el.flat.style.cursor = alca.tipo === 'girar' ? 'grab' : 'nwse-resize';
    else el.flat.style.cursor = camadaEm(arte, pontoMm(fracao), areaMm, medidor) ? 'grab' : '';
  });
  const solta = (event) => {
    if (!arrasto) return;
    arrasto = null;
    montaPropriedades();
    soltaPonteiro(event);
  };
  el.flat.addEventListener('pointerup', solta);
  el.flat.addEventListener('pointercancel', solta);
  el.flat.addEventListener('dragover', (event) => { if (arte) event.preventDefault(); });
  el.flat.addEventListener('drop', async (event) => {
    if (!arte) return;
    const arquivo = event.dataTransfer?.files?.[0];
    const fracao = fracaoDoEventoPlano(event);
    if (!arquivo || !fracao) return;
    event.preventDefault();
    const camada = camadaEm(arte, pontoMm(fracao), areaMm, medidor);
    if (camada?.tipo === 'foto') await handleFile(arquivo, { tipo: 'camada', id: camada.id });
    else {
      const nova = acrescenta({
        id: novoId(), tipo: 'foto', rotulo: `Foto ${camadasDeFoto().length + 1}`, forma: 'arredondado',
        x: clamp(fracao.x, 0.06, 0.94), y: clamp(fracao.y, 0.1, 0.9), largura: 0.24, altura: 0.6,
        rotacao: 0, ajuste: { scale: 1, offsetX: 0, offsetY: 0 },
      });
      await handleFile(arquivo, { tipo: 'camada', id: nova.id });
    }
  });
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

  el.addFoto.addEventListener('click', adicionaFoto);
  el.addFrase.addEventListener('click', adicionaFrase);
  el.addEnfeite.addEventListener('click', adicionaEnfeite);
  el.addPandinha.addEventListener('click', adicionaPandinha);

  el.choose.addEventListener('click', () => pedeArquivo({ tipo: 'livre' }));
  el.file.addEventListener('change', () => handleFile(el.file.files?.[0]));
  el.drop.addEventListener('dragover', (event) => { event.preventDefault(); el.drop.classList.add('dragging'); });
  el.drop.addEventListener('dragleave', () => el.drop.classList.remove('dragging'));
  el.drop.addEventListener('drop', (event) => {
    event.preventDefault();
    el.drop.classList.remove('dragging');
    handleFile(event.dataTransfer?.files?.[0], { tipo: 'livre' });
  });
  el.viewport.addEventListener('dragover', (event) => { if (arte) event.preventDefault(); });
  el.viewport.addEventListener('drop', soltaNaCaneca);
  document.addEventListener('paste', (event) => {
    const item = [...(event.clipboardData?.items || [])].find((i) => i.kind === 'file' && i.type.startsWith('image/'));
    if (!item) return;
    const destino = arte && selecionada && camadaPorId(selecionada)?.tipo === 'foto'
      ? { tipo: 'camada', id: selecionada } : { tipo: 'livre' };
    handleFile(item.getAsFile(), destino);
  });
  el.remove.addEventListener('click', removeArtwork);
  el.example.addEventListener('click', useExample);

  for (const input of [el.scale, el.x, el.y, el.rotation]) input.addEventListener('input', readAdjustments);
  el.reset.addEventListener('click', resetAdjustments);
  for (const radio of el.form.elements.layout) radio.addEventListener('change', readLayout);
  el.name.addEventListener('input', readTextOptions);
  el.font.addEventListener('change', readTextOptions);
  el.panda.addEventListener('change', readTextOptions);

  el.moreModels.addEventListener('click', () => { mostrarTodosOsModelos = !mostrarTodosOsModelos; montaModelos(); });
  el.desfazer.addEventListener('click', desfaz);
  el.refazer.addEventListener('click', refaz);
  el.salvarModelo.addEventListener('click', () => {
    el.formMeuModelo.hidden = !el.formMeuModelo.hidden;
    if (!el.formMeuModelo.hidden) {
      el.nomeMeuModelo.value = modeloAtual?.nome ? `${modeloAtual.nome} do meu jeito` : 'Meu modelo';
      el.nomeMeuModelo.focus();
      el.nomeMeuModelo.select();
    }
  });
  el.confirmarMeuModelo.addEventListener('click', salvaModeloAtual);
  el.nomeMeuModelo.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); salvaModeloAtual(); }
  });
  el.cancelarMeuModelo.addEventListener('click', () => { el.formMeuModelo.hidden = true; });
  el.apagarModelo.addEventListener('click', apagaMeuModelo);
  // Ctrl+Z e Ctrl+Shift+Z, menos quando a pessoa está digitando (lá o desfazer é do campo).
  document.addEventListener('keydown', (event) => {
    if (!arte || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) return;
    event.preventDefault();
    if (event.shiftKey) refaz(); else desfaz();
  });
  el.saveGuide.addEventListener('click', saveGuide);
  el.importarCanva.addEventListener('click', () => { el.canvaFile.value = ''; el.canvaFile.click(); });
  el.canvaFile.addEventListener('change', () => importaDoCanva(el.canvaFile.files?.[0]));
  el.savePreview.addEventListener('click', savePreview);
  el.savePrint.addEventListener('click', savePrint);
  el.saveProject.addEventListener('click', saveProject);
  el.form.addEventListener('submit', (event) => event.preventDefault());
  ligaVistaAberta();

  // Quando pagina.js trocar o número do WhatsApp, o texto do pedido acompanha.
  new MutationObserver(updateOrderLink).observe(el.order, { attributes: true, attributeFilter: ['href'] });
  document.fonts?.addEventListener?.('loadingdone', () => { montaModelos(); marcaModeloEscolhido(); schedule(); });
  window.addEventListener('pagehide', () => {
    viewer?.dispose();
    artwork?.dispose();
    for (const item of fotos.values()) if (!item.compartilhada) item.asset?.dispose();
  });
}

async function init() {
  carregaMeusModelos();
  bind();
  el.sizeGuide.textContent = `${medida.larguraCm.toFixed(0)} × ${medida.alturaCm.toFixed(0)} cm (${medida.larguraPx} × ${medida.alturaPx} px a ${medida.dpi} dpi)`;
  montaCategorias();
  montaModelos();
  atualizaModo();
  markPreset();
  syncRangeOutputs();
  const fontsReady = document.fonts?.load
    ? Promise.allSettled(['600 16px "Fredoka"', '600 16px "Caveat"', '600 16px "Nunito"'].map((font) => document.fonts.load(font)))
    : Promise.resolve();
  const [panda] = await Promise.allSettled([loadImage(PANDA_ADESIVO), fontsReady]);
  if (panda.status === 'fulfilled') {
    pandaImage = panda.value;
    adesivos.set(PANDA_ADESIVO, panda.value);
  } else console.warn(panda.reason?.message);
  render();
  await startViewer();
}

init();
