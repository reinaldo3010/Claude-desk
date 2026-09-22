/**
 * Estúdio da caneca: liga a página à arte em camadas (modelos.js), ao editor de arte (arte.js)
 * e à prévia 3D (caneca-3d.js).
 *
 * O painel é dividido em abas, uma para cada coisa que a pessoa pode mexer: Modelo, Fotos,
 * Frases e Enfeites (ou Minha arte, quando ela traz a arte pronta). Cada item da arte é um
 * cartão que abre no lugar, com os controles dele dentro. Clicar em cima da caneca escolhe o
 * item e já abre a aba dele, então a peça e o painel falam a mesma língua.
 *
 * Nada sai deste navegador: as fotos ficam em memória e só viram arquivo quando a pessoa baixa
 * a prévia, a arte plana, o gabarito ou o projeto. O pedido segue pelo WhatsApp, com as escolhas
 * escritas no texto.
 */
import { createMugViewer, MUG_SPEC, CENARIOS, ACABAMENTOS } from './caneca-3d.js';
import { loadArtwork, composeArtwork, exportPrintArtwork, exportGuideArtwork, tamanhoRecomendado, printAreaOf } from './arte.js';
import { FONTES_DA_ARTE, carregaFontes, fontePorValor } from './fontes.js';
import { ehIlustracao, TAMANHO_DA_ILUSTRACAO } from './colecoes.js';
import { fazZip } from './zip.js';
import { salvaRascunho, leRascunho, apagaRascunho, quandoFoi } from './rascunho.js';
import {
  gruposDeCategorias, ADESIVOS, ELEMENTOS, ENFEITES, FILTROS, CORES_DE_ARTE, FORMAS_DE_FOTO,
  modeloPorId, modelosDaCategoria, novaArte, desenhaArte, desenhaForma, camadaEm,
  alcasDaCamada, medidorDeTexto, cor, FRENTE, VERSO,
} from './modelos.js';

// Cores da cerâmica: dado físico da peça (manual 7.4), não cor de interface.
const CERAMICA = Object.freeze({
  branca: '#ffffff', preta: '#1d1b19', vermelha: '#b7262b', amarela: '#f0c233', rosa: '#f3a4b7', azul: '#1f5aa3',
});
const PRESETS = Object.freeze({
  branca: { inside: 'branca', handle: 'branca', nome: 'Toda branca' },
  preta: { inside: 'preta', handle: 'preta', nome: 'Preto e branco' },
  rosa: { inside: 'rosa', handle: 'rosa', nome: 'Toque rosa' },
});
const LAYOUTS = { front: 'só na frente', both: 'nos dois lados', wrap: 'ao redor' };
const nomeDaLetra = (familia) => fontePorValor(familia)?.nome || familia;
const PANDA_ADESIVO = 'assets/panda-coracao.webp';
const ARTE_EXEMPLO = { url: 'assets/coracao-jeito.webp', nome: 'Arte da Panda Mimo (exemplo)' };
const PROJETO_TIPO = 'panda-mimo/caneca';
const PROJETO_VERSAO = 4;
const MEUS_MODELOS = 'pm_caneca_meus_modelos';
const PASSOS_GUARDADOS = 60;
const VISIVEIS_DE_INICIO = 6;
const LIMITES = Object.freeze({
  fraseTamanho: [3, 22], enfeiteTamanho: [0.04, 0.5], adesivoTamanho: [0.06, 0.6],
  fotoLargura: [0.06, 0.6], giro: [-180, 180], arco: [-180, 180],
});
/** Onde um item se encaixa na volta: frente, meio (lado oposto à alça) e verso. */
const LUGARES = Object.freeze([
  { nome: 'Centralizar na frente', x: FRENTE },
  { nome: 'Centralizar no meio', x: 0.5 },
  { nome: 'Centralizar no verso', x: VERSO },
]);

/** As abas do painel, na ordem em que aparecem. */
const ABAS = Object.freeze({
  modelo: { rotulo: 'Modelo', painel: 'painel-modelo', dica: 'Escolha um modelo pronto para a ocasião, ou traga a sua arte.' },
  fotos: { rotulo: 'Fotos', painel: 'painel-fotos', dica: 'Coloque suas fotos nos espaços. Toque numa foto para ajustar.' },
  frases: { rotulo: 'Frases', painel: 'painel-frases', dica: 'Escreva do seu jeito. Cada frase tem letra, cor e tamanho próprios.' },
  enfeites: { rotulo: 'Enfeites', painel: 'painel-enfeites', dica: 'Corações, flores, estrelas e o Pandinha para enfeitar a volta.' },
  arte: { rotulo: 'Minha arte', painel: 'painel-arte', dica: 'Sua arte pronta na caneca: escolha o arquivo e ajuste o tamanho.' },
});

const $ = (id) => document.getElementById(id);
const el = {
  viewport: $('mug-viewport'), loading: $('viewer-loading'), fallback: $('viewer-fallback'), retry: $('viewer-retry'),
  zoom: $('mug-zoom'), flat: $('flat-art'), flatDetails: $('flat-details'),
  travar: $('travar'), travarTexto: $('travar-texto'), cadeadoArco: $('cadeado-arco'), gesto: $('studio-gesture'),
  cenas: $('cenas'), acabamentos: $('acabamentos'), cenaResumo: $('cena-resumo'), saveVideo: $('save-video'),
  form: $('mug-form'), inside: $('inside-color'), handle: $('handle-color'), pecaResumo: $('peca-resumo'),
  abas: $('abas'), dicaAba: $('dica-aba'), acoesArte: $('acoes-arte'),
  desfazer: $('desfazer'), refazer: $('refazer'),
  salvarModelo: $('salvar-modelo'), apagarModelo: $('apagar-modelo'), formMeuModelo: $('form-meu-modelo'),
  nomeMeuModelo: $('nome-meu-modelo'), confirmarMeuModelo: $('confirmar-meu-modelo'), cancelarMeuModelo: $('cancelar-meu-modelo'),
  categoria: $('categoria-modelo'), busca: $('busca-modelo'), resultado: $('resultado-modelos'),
  models: $('model-list'), moreModels: $('model-more'),
  listaFotos: $('lista-fotos'), listaFrases: $('lista-frases'), listaEnfeites: $('lista-enfeites'),
  gradeEnfeites: $('grade-enfeites'), gradeElementos: $('grade-elementos'), fundoArte: $('fundo-arte'),
  mostrarMargem: $('mostrar-margem'),
  addFoto: $('add-foto'), addFrase: $('add-frase'), addPandinha: $('add-pandinha'),
  drop: $('art-drop'), file: $('art-file'), choose: $('choose-art'), fileInfo: $('art-file-info'), fileName: $('art-file-name'),
  remove: $('remove-art'), example: $('use-example'), error: $('art-error'),
  scale: $('art-scale'), x: $('art-x'), y: $('art-y'), rotation: $('art-rotation'),
  scaleOut: $('scale-value'), xOut: $('x-value'), yOut: $('y-value'), rotationOut: $('rotation-value'), reset: $('reset-art'),
  name: $('art-name'), font: $('art-font'), panda: $('art-panda'),
  sizeGuide: $('size-guide'), saveGuide: $('save-guide'), abrirCanva: $('abrir-canva'),
  canvaFile: $('canva-file'), importarCanva: $('importar-canva'),
  rascunho: $('rascunho'), rascunhoTexto: $('rascunho-texto'), rascunhoContinuar: $('rascunho-continuar'), rascunhoApagar: $('rascunho-apagar'),
  compartilhar: $('compartilhar'), save4k: $('save-4k'), copiarLink: $('copiar-link'),
  lote: $('lote'), loteFrase: $('lote-frase'), loteNomes: $('lote-nomes'), loteGerar: $('lote-gerar'), loteStatus: $('lote-status'),
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
let abaAtual = 'modelo';
let categoria = 'todos';
let busca = '';
let mostrarTodosOsModelos = false;
let artwork = null;           // arte livre: { image, width, height, name, dispose }
let artworkBlob = null;
const fotos = new Map();      // id da camada de foto → { asset, blob }
const lixeira = new Map();    // fotos tiradas da arte, guardadas para o desfazer
const adesivos = new Map();   // arquivo → Image já carregada
const historico = { passado: [], futuro: [], ultimaChave: '', ultimoInstante: 0 };
let selecionada = null;       // id da camada em edição
let arrasto = null;           // gesto em andamento (mover, redimensionar ou girar)
// A arte nasce travada: na caneca, arrastar gira a peça. Quem quiser mover um item abre o cadeado.
let travado = true;
let toqueNaCaneca = null;
let cenaAtual = 'estudio';
let acabamentoAtual = 'brilhante';
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
const semAcento = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

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
const slug = (texto) => semAcento(texto).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const optionLabel = (select, value) => select.querySelector(`option[value="${value}"]`)?.textContent || value;
const camadaPorId = (id) => arte?.camadas.find((camada) => camada.id === id) || null;
const camadasDo = (tipo) => (arte ? arte.camadas.filter((camada) => (tipo === 'enfeites'
  ? camada.tipo === 'enfeite' || camada.tipo === 'adesivo' || camada.tipo === 'elemento'
  : camada.tipo === tipo)) : []);
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
  if (!arte.camadas.some((camada) => camada.id === selecionada)) selecionada = null;
  historico.ultimaChave = '';
  montaAbas();
  montaListas();
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
    setStatus('Este navegador não deixou guardar o modelo. Salve o projeto em arquivo no fim da página.');
    return;
  }
  arte.modelo = meu.id;
  modeloAtual = meu;
  el.formMeuModelo.hidden = true;
  el.nomeMeuModelo.value = '';
  montaCategorias();
  montaModelos();
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
  montaSeletorDeLote();
  guardaRascunho();
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
  // Margem de segurança: 5 mm de folga em toda a volta, o que a produção pede.
  if (el.mostrarMargem?.checked) {
    const folga = 5 / area.width * el.flat.width;
    const folgaY = 5 / area.height * el.flat.height;
    context.save();
    context.strokeStyle = cor('--peach-deep');
    context.globalAlpha = 0.6;
    context.setLineDash([4, 5]);
    context.lineWidth = 1.5;
    context.strokeRect(folga, folgaY, el.flat.width - folga * 2, el.flat.height - folgaY * 2);
    context.restore();
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
    const espacos = camadasDo('foto');
    const escolhidas = espacos.filter((camada) => fotos.get(camada.id)?.asset);
    lines.push(`• Modelo: ${modeloAtual?.nome || 'arte montada aqui'} (arte ao redor)`);
    lines.push(`• Fotos escolhidas: ${escolhidas.length} de ${espacos.length}`);
    const frases = frasesDaArte();
    if (frases.length) lines.push(`• Frases: ${frases.map((f) => `"${f}"`).join(' · ')}`);
    const enfeites = arte.camadas.filter((camada) => camada.tipo === 'enfeite').length;
    if (enfeites) lines.push(`• Enfeites acrescentados: ${enfeites}`);
  } else {
    if (artwork) lines.push(`• Arte: ${artwork.name}, ${LAYOUTS[state.layout]}`);
    if (state.name) lines.push(`• Nome ou frase: "${state.name}" (letra ${nomeDaLetra(state.fontFamily)})`);
  }
  const temPandinha = arte ? arte.camadas.some((camada) => camada.tipo === 'adesivo') : state.withPanda;
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

/**
 * O cadeado da prévia. Fechado, arrastar na caneca só gira a peça: ninguém empurra a arte sem
 * querer. Um toque curto continua escolhendo o item, porque isso não muda nada na arte.
 */
function atualizaCadeado() {
  el.travar.setAttribute('aria-pressed', String(travado));
  el.travarTexto.textContent = travado ? 'Arte travada' : 'Arte livre';
  el.travar.setAttribute('aria-label', travado
    ? 'Arte travada. Abra o cadeado para mover os itens arrastando na caneca.'
    : 'Arte livre. Feche o cadeado para só girar a caneca.');
  // Cadeado aberto: o arco sai do lugar e fica de lado.
  el.cadeadoArco?.setAttribute('d', travado
    ? 'M8.4 10.5V7.8a3.6 3.6 0 0 1 7.2 0v2.7'
    : 'M8.4 10.5V7.8a3.6 3.6 0 0 1 7.2 0');
  el.gesto.textContent = travado
    ? 'Arraste para girar a caneca. Abra o cadeado para mover os itens com o dedo.'
    : 'Arraste um item para mover. Fora dele, a caneca gira.';
}

function alternaCadeado() {
  travado = !travado;
  toqueNaCaneca = null;
  arrasto = null;
  atualizaCadeado();
}

/** O dedo em cima da caneca: escolhe, arrasta e abre a aba do item. */
function aoPonteiro({ tipo, ponto, event }) {
  if (!arte || !ponto) {
    if (tipo === 'soltou') arrasto = null;
    return false;
  }
  const fracao = fracaoDoPonto3D(ponto);
  if (tipo === 'passou') return !travado && Boolean(camadaEm(arte, pontoMm(fracao), areaMm, medidor));
  if (tipo === 'apertou') {
    const camada = camadaEm(arte, pontoMm(fracao), areaMm, medidor);
    if (!camada) return false;
    if (travado) {
      // Guarda o toque e deixa o giro acontecer; se o dedo mal andou, isso vira uma escolha.
      toqueNaCaneca = { id: camada.id, x: event?.clientX ?? 0, y: event?.clientY ?? 0 };
      return false;
    }
    seleciona(camada.id, { mostrarPainel: true });
    registra(`mover:${camada.id}`);
    arrasto = { tipo: 'mover', id: camada.id, dx: camada.x - fracao.x, dy: camada.y - fracao.y };
    return true;
  }
  if (tipo === 'moveu' && arrasto) {
    moveCamada(arrasto, fracao);
    return true;
  }
  if (tipo === 'soltou') {
    arrasto = null;
    if (toqueNaCaneca) {
      const andou = Math.hypot((event?.clientX ?? 0) - toqueNaCaneca.x, (event?.clientY ?? 0) - toqueNaCaneca.y);
      if (andou < 6 && camadaPorId(toqueNaCaneca.id)) seleciona(toqueNaCaneca.id, { mostrarPainel: true });
      toqueNaCaneca = null;
    }
    return false;
  }
  if (tipo === 'dobrou') {
    const camada = camadaEm(arte, pontoMm(fracao), areaMm, medidor);
    if (camada) {
      seleciona(camada.id, { mostrarPainel: true });
      document.querySelector(`[data-corpo="${camada.id}"] input, [data-corpo="${camada.id}"] select, [data-corpo="${camada.id}"] button`)?.focus();
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
    viewer.setCenario(cenaAtual);
    viewer.setAcabamento(acabamentoAtual);
    viewer.setZoom(Number(el.zoom.value) / 100);
    viewer.setTexture(textureCanvas);
    // O vídeo só aparece onde o navegador sabe gravar o canvas.
    el.saveVideo.hidden = typeof MediaRecorder !== 'function' || !document.createElement('canvas').captureStream;
  } catch (error) {
    showFallback(error);
  }
}

/* ---------- cena e acabamento da prévia ---------- */
function montaCenas() {
  const monta = (alvo, itens, atual, aoEscolher) => {
    alvo.replaceChildren(...itens.map((item) => {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.dataset.valor = item.id;
      botao.textContent = item.nome;
      botao.title = item.descricao;
      botao.setAttribute('aria-pressed', String(atual() === item.id));
      botao.addEventListener('click', () => {
        aoEscolher(item.id);
        for (const outro of alvo.children) outro.setAttribute('aria-pressed', String(outro.dataset.valor === item.id));
        atualizaResumoDaCena();
      });
      return botao;
    }));
  };
  monta(el.cenas, CENARIOS, () => cenaAtual, (id) => { cenaAtual = id; viewer?.setCenario(id); });
  monta(el.acabamentos, ACABAMENTOS, () => acabamentoAtual, (id) => { acabamentoAtual = id; viewer?.setAcabamento(id); });
  atualizaResumoDaCena();
}

function atualizaResumoDaCena() {
  const cena = CENARIOS.find((c) => c.id === cenaAtual)?.nome || 'Fundo claro';
  const acabamento = ACABAMENTOS.find((a) => a.id === acabamentoAtual)?.nome.toLowerCase() || 'brilhante';
  if (el.cenaResumo) el.cenaResumo.textContent = `${cena} · ${acabamento}`;
}

/* ---------- abas ---------- */
const abasVisiveis = () => (arte ? ['modelo', 'fotos', 'frases', 'enfeites'] : ['modelo', 'arte']);

function contaDaAba(id) {
  if (!arte) return null;
  if (id === 'fotos') return camadasDo('foto').length;
  if (id === 'frases') return camadasDo('frase').length;
  if (id === 'enfeites') return camadasDo('enfeites').length;
  return null;
}

function montaAbas() {
  const visiveis = abasVisiveis();
  if (!visiveis.includes(abaAtual)) abaAtual = 'modelo';
  el.abas.replaceChildren(...visiveis.map((id) => {
    const aba = ABAS[id];
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.id = `aba-${id}`;
    botao.dataset.aba = id;
    botao.setAttribute('role', 'tab');
    botao.setAttribute('aria-controls', aba.painel);
    botao.setAttribute('aria-selected', String(abaAtual === id));
    botao.tabIndex = abaAtual === id ? 0 : -1;
    const nome = document.createElement('span');
    nome.textContent = aba.rotulo;
    botao.appendChild(nome);
    const conta = contaDaAba(id);
    if (conta !== null) {
      const marca = document.createElement('small');
      marca.className = 'studio-aba__conta';
      marca.textContent = String(conta);
      botao.appendChild(marca);
    }
    botao.addEventListener('click', () => mostraAba(id));
    return botao;
  }));
  atualizaPaineis();
}

function atualizaPaineis() {
  for (const [id, aba] of Object.entries(ABAS)) {
    const painel = $(aba.painel);
    if (painel) painel.hidden = id !== abaAtual;
  }
  el.dicaAba.textContent = ABAS[abaAtual]?.dica || '';
  el.acoesArte.hidden = !arte || abaAtual === 'modelo';
  if (el.acoesArte.hidden) el.formMeuModelo.hidden = true;
}

function mostraAba(id, { foco = false } = {}) {
  if (!abasVisiveis().includes(id)) return;
  abaAtual = id;
  for (const botao of el.abas.children) {
    const ativa = botao.dataset.aba === id;
    botao.setAttribute('aria-selected', String(ativa));
    botao.tabIndex = ativa ? 0 : -1;
    if (ativa && foco) botao.focus();
  }
  atualizaPaineis();
}

function andaNasAbas(event) {
  if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
  const visiveis = abasVisiveis();
  const atual = visiveis.indexOf(abaAtual);
  let destino = atual;
  if (event.key === 'ArrowRight') destino = (atual + 1) % visiveis.length;
  if (event.key === 'ArrowLeft') destino = (atual - 1 + visiveis.length) % visiveis.length;
  if (event.key === 'Home') destino = 0;
  if (event.key === 'End') destino = visiveis.length - 1;
  event.preventDefault();
  mostraAba(visiveis[destino], { foco: true });
}

const abaDaCamada = (camada) => (camada.tipo === 'foto' ? 'fotos' : camada.tipo === 'frase' ? 'frases' : 'enfeites');

/* ---------- aba modelo ---------- */
function montaCategorias() {
  const opcoes = [];
  const todos = document.createElement('option');
  todos.value = 'todos';
  todos.textContent = 'Todos os modelos';
  opcoes.push(todos);
  if (meusModelos.length) {
    const grupo = document.createElement('optgroup');
    grupo.label = 'Sua arte';
    const meus = document.createElement('option');
    meus.value = 'meus';
    meus.textContent = `Meus modelos (${meusModelos.length})`;
    grupo.appendChild(meus);
    opcoes.push(grupo);
  }
  for (const [nome, itens] of gruposDeCategorias()) {
    const grupo = document.createElement('optgroup');
    grupo.label = nome;
    for (const item of itens) {
      const opcao = document.createElement('option');
      opcao.value = item.id;
      opcao.textContent = item.nome;
      grupo.appendChild(opcao);
    }
    opcoes.push(grupo);
  }
  el.categoria.replaceChildren(...opcoes);
  el.categoria.value = [...el.categoria.options].some((o) => o.value === categoria) ? categoria : 'todos';
  categoria = el.categoria.value;
}

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
    pedeMiniatura(figura, modelo);
  } else {
    figura.classList.add('studio-model__art--livre');
    figura.innerHTML = '<svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true"><path d="M8 25v8h24v-8M20 27V7M12 15l8-8 8 8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  const nome = document.createElement('span');
  nome.className = 'studio-model__nome';
  nome.textContent = modelo ? modelo.nome : 'Trazer a minha arte';
  const descricao = document.createElement('small');
  descricao.textContent = modelo ? modelo.descricao : 'Sua arte pronta, do jeito que você fez';
  button.append(figura, nome, descricao);
  button.addEventListener('click', () => escolheModelo(modelo ? modelo.id : null));
  return button;
}

function montaModelos() {
  const filtrados = listaDeModelos(categoria).filter((modelo) => !busca
    || semAcento(`${modelo.nome} ${modelo.descricao}`).includes(busca));
  const escondido = arte && filtrados.slice(0, VISIVEIS_DE_INICIO).every((m) => m.id !== arte.modelo)
    && filtrados.some((m) => m.id === arte.modelo);
  const todos = mostrarTodosOsModelos || escondido;
  const visiveis = todos ? filtrados : filtrados.slice(0, VISIVEIS_DE_INICIO);
  const semModelo = categoria === 'todos' && !busca ? [cartaoDeModelo(null)] : [];
  // Sem soltar as pendências, remontar a lista guardaria cartões que já saíram do documento.
  miniaturasPendentes.clear();
  el.models.replaceChildren(...semModelo, ...visiveis.map(cartaoDeModelo));
  const sobram = filtrados.length - visiveis.length;
  el.moreModels.textContent = sobram ? `Ver mais ${sobram} ${sobram === 1 ? 'modelo' : 'modelos'}` : 'Ver menos modelos';
  el.moreModels.hidden = filtrados.length <= VISIVEIS_DE_INICIO;
  el.resultado.textContent = filtrados.length
    ? `${filtrados.length} ${filtrados.length === 1 ? 'modelo' : 'modelos'}${busca ? ` com "${el.busca.value.trim()}"` : ''}.`
    : 'Nada com esse nome. Tente outra palavra ou escolha outra ocasião.';
}

/*
  Desenhar uma miniatura custa cerca de 5,5 ms e 300 KB de canvas. Com 138 artes no catálogo, fazer
  todas de uma vez dá 0,8 s de trabalho e 40 MB de memória nesta máquina — num celular médio, vários
  segundos de tela parada. Então o canvas só nasce quando o cartão chega perto da área visível da
  lista. A caixa já reserva o espaço pela proporção, então nada pula de lugar quando a arte aparece.

  Aqui não vale IntersectionObserver: ele não entrega retorno em aba que não está desenhando, o que
  inclui o navegador do guardião — a miniatura nunca sairia no teste e a checagem não protegeria nada.
  Uma conferida de posição na rolagem, agendada por quadro, funciona em todo lugar e dá para medir.
*/
const miniaturasPendentes = new Map();
let quadroDeMiniaturas = 0;

function pedeMiniatura(figura, modelo) {
  miniaturasPendentes.set(figura, modelo);
  agendaMiniaturas();
}

function agendaMiniaturas() {
  if (quadroDeMiniaturas || !miniaturasPendentes.size) return;
  // setTimeout e não requestAnimationFrame: rAF só corre quando a aba está desenhando, e há
  // navegador embutido e aba em segundo plano onde ele nunca corre — a miniatura ficaria em branco
  // sem ninguém perceber. `getBoundingClientRect` já força o cálculo de layout que precisamos.
  quadroDeMiniaturas = setTimeout(() => { quadroDeMiniaturas = 0; pintaAsQueChegaram(); }, 0);
}

/** Desenha o que está dentro da lista, com uma folga para a arte já estar pronta quando a pessoa chega. */
function pintaAsQueChegaram() {
  if (!miniaturasPendentes.size) return;
  const caixa = el.models.getBoundingClientRect();
  const folga = 300;
  for (const [figura, modelo] of [...miniaturasPendentes]) {
    if (!figura.isConnected) { miniaturasPendentes.delete(figura); continue; }
    const f = figura.getBoundingClientRect();
    if (f.bottom < caixa.top - folga || f.top > caixa.bottom + folga) continue;
    miniaturasPendentes.delete(figura);
    pintaMiniatura(figura, modelo);
  }
}

function pintaMiniatura(figura, modelo) {
  if (figura.querySelector('canvas')) return;
  const canvas = document.createElement('canvas');
  canvas.width = 420;
  canvas.height = Math.round(420 * areaMm.height / areaMm.width);
  canvas.setAttribute('aria-hidden', 'true');
  figura.appendChild(canvas);
  desenhaMiniatura(canvas, modelo);
}

function marcaModeloEscolhido() {
  for (const button of el.models.children) {
    button.setAttribute('aria-pressed', String(arte ? button.dataset.modelo === arte.modelo : button.dataset.modelo === ''));
  }
}

/** Carrega as letras que a arte está usando; sem elas o navegador mede e desenha outra. */
function garanteFontes() {
  const usadas = arte
    ? arte.camadas.filter((camada) => camada.tipo === 'frase').map((camada) => camada.fonte)
    : [state.fontFamily];
  return carregaFontes(usadas).then(() => { montaListas(); schedule(); });
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
  if (mudou) { schedule(); montaModelos(); marcaModeloEscolhido(); montaListas(); }
}

function escolheModelo(id) {
  const modelo = id ? acheModelo(id) : null;
  if (modelo ? arte?.modelo === modelo.id : arte === null) {
    if (!modelo) mostraAba('arte');
    return;
  }
  for (const item of fotos.values()) item.asset?.dispose();
  fotos.clear();
  lixeira.clear();
  modeloAtual = modelo;
  arte = modelo ? novaArte(modelo) : null;
  selecionada = null;
  if (arte) { state.withPanda = true; contador = arte.camadas.length + 10; }
  setError('');
  setStatus('');
  limpaHistorico();
  marcaModeloEscolhido();
  atualizaModo();
  mostraAba(arte ? 'fotos' : 'arte');
  // Na tela larga, a vista aberta já abre: dá para arrastar e usar as alças ali.
  if (arte && el.flatDetails && window.innerWidth >= 850) el.flatDetails.open = true;
  garanteAdesivos();
  garanteFontes();
  schedule();
  levaParaAPeca();
}

/**
 * Depois de escolher um modelo, a pessoa precisa ver a caneca e o próximo passo.
 * Sem isto ela clicava num modelo lá no fim da lista e ia parar no rodapé: a lista some, a página
 * encolhe e o navegador gruda a rolagem no novo fim.
 *
 * O alvo são as abas, não a caneca: a caneca é sticky e está sempre no alto da tela, então olhar
 * para ela dizia "já está à vista" mesmo com a pessoa parada no rodapé. No celular a caneca grudada
 * cobre o topo, então as abas param logo abaixo dela.
 */
function levaParaAPeca() {
  const abas = document.getElementById('abas');
  if (!abas) return;
  const caixa = abas.getBoundingClientRect();
  if (caixa.top >= 0 && caixa.bottom <= window.innerHeight) return; // o próximo passo já está à vista
  const peca = document.querySelector('.studio-preview');
  const grudada = peca && getComputedStyle(peca).position === 'sticky' && window.innerWidth <= 850;
  // `scrollMarginTop` reserva o espaço da caneca grudada; sem ele as abas parariam atrás dela.
  // Vale `scrollIntoView` e não `window.scrollTo`: além de respeitar essa folga, ele é quem funciona
  // quando a página está dentro de um contêiner com escala.
  abas.style.scrollMarginTop = `${grudada ? Math.round(peca.getBoundingClientRect().height) + 8 : 8}px`;
  // Salto seco, e precisa ser 'instant': o CSS desta página tem `scroll-behavior: smooth` no html,
  // e 'auto' obedece a ele — a rolagem vira animada, não completa em navegador automatizado e a
  // checagem do guardião nunca pegaria a regressão. A troca de passo já mudou o painel inteiro;
  // meio segundo de rolagem por cima disso atrasa sem informar nada.
  abas.scrollIntoView({ block: 'start', behavior: 'instant' });
}

function atualizaModo() {
  el.apagarModelo.hidden = !(arte && ehMeuModelo(arte.modelo));
  if (!arte) el.formMeuModelo.hidden = true;
  montaAbas();
  montaListas();
  montaFundoDaArte();
  if (!arte) syncRangeOutputs();
}

/* ---------- cartões de camada ---------- */
/** Ilustração de coleção cresce mais que enfeite: ela nasce larga e a pessoa costuma querer maior. */
function limiteDeTamanho(camada) {
  return ehIlustracao(camada.forma) ? TAMANHO_DA_ILUSTRACAO : LIMITES.enfeiteTamanho;
}

function rotuloDaCamada(camada) {
  if (camada.tipo === 'frase') return String(camada.texto || '').trim().slice(0, 34) || 'Frase sem texto';
  if (camada.tipo === 'foto') return camada.rotulo || 'Foto';
  if (camada.tipo === 'enfeite') return ENFEITES.find((e) => e.forma === camada.forma)?.nome || camada.rotulo || 'Enfeite';
  return 'Pandinha';
}

function subtituloDaCamada(camada) {
  if (camada.tipo === 'foto') return fotos.get(camada.id)?.asset ? fotos.get(camada.id).asset.name : 'Toque para escolher a foto';
  if (camada.tipo === 'frase') return `${nomeDaLetra(camada.fonte)} · ${CORES_DE_ARTE.find((c) => c.token === camada.cor)?.nome || 'cor da marca'}`;
  if (camada.tipo === 'adesivo') return ADESIVOS.find((a) => a.arquivo === camada.arquivo)?.nome || 'Pandinha';
  return CORES_DE_ARTE.find((c) => c.token === camada.cor)?.nome || 'Enfeite';
}

function icone(camada) {
  const span = document.createElement('span');
  span.className = 'studio-item__icone';
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
    span.classList.add('studio-item__icone--vazio');
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
  if (camada.tipo === 'adesivo' && adesivos.has(camada.arquivo)) {
    const img = document.createElement('img');
    img.src = camada.arquivo;
    img.alt = '';
    span.appendChild(img);
    return span;
  }
  span.textContent = camada.tipo === 'frase' ? 'Aa' : '🐼';
  return span;
}

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

/** A biblioteca de letras: cada opção aparece escrita na própria letra. */
function campoDeLetras(valor, aoMudar) {
  const grade = document.createElement('div');
  grade.className = 'studio-letras';
  grade.setAttribute('role', 'group');
  grade.setAttribute('aria-label', 'Jeito da letra');
  for (const fonte of FONTES_DA_ARTE) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'studio-letra';
    botao.dataset.fonte = fonte.valor;
    botao.setAttribute('aria-pressed', String(valor === fonte.valor));
    botao.style.fontFamily = `"${fonte.valor}", var(--f-body)`;
    botao.style.fontWeight = String(fonte.peso);
    botao.textContent = fonte.nome;
    botao.addEventListener('click', () => {
      for (const outro of grade.children) outro.setAttribute('aria-pressed', String(outro === botao));
      aoMudar(fonte.valor);
    });
    grade.appendChild(botao);
  }
  const bloco = document.createElement('div');
  bloco.className = 'studio-campo';
  const titulo = document.createElement('span');
  titulo.textContent = 'Jeito da letra';
  bloco.append(titulo, grade);
  // As letras da biblioteca chegam na hora em que alguém abre o cartão, não no carregamento da página.
  carregaFontes().then(() => schedule());
  return bloco;
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

/** Os controles de uma camada, que aparecem dentro do cartão dela. */
function camposDaCamada(camada) {
  const partes = [];
  if (camada.tipo === 'frase') {
    partes.push(campoTexto('O que está escrito', camada.texto || '', 40, (valor) => {
      registra(`texto:${camada.id}`);
      const iguais = camada.grupo ? arte.camadas.filter((c) => c.grupo === camada.grupo) : [camada];
      for (const alvo of iguais) alvo.texto = valor;
      const titulo = el.listaFrases.querySelector(`[data-camada="${camada.id}"] .studio-item__texto > span`);
      if (titulo) titulo.textContent = rotuloDaCamada(camada);
      schedule();
    }));
    if (camada.grupo) {
      const nota = document.createElement('p');
      nota.className = 'studio-help';
      nota.textContent = 'Esta frase se repete na volta da caneca: mudou aqui, mudou nas outras.';
      partes.push(nota);
    }
    partes.push(campoDeLetras(camada.fonte, (valor) => {
      registra(`fonte:${camada.id}`);
      camada.fonte = valor;
      montaListas();
      garanteFontes();
    }));
    partes.push(campoCores(camada.cor, (token) => { registra(`cor:${camada.id}`); camada.cor = token; schedule(); }));
    partes.push(campoRange('Tamanho da letra', camada.tamanho, LIMITES.fraseTamanho, 0.5, (valor) => { registra(`tamanho:${camada.id}`); camada.tamanho = valor; schedule(); }));
    partes.push(campoRange('Curva da frase', camada.arco || 0, LIMITES.arco, 1, (valor) => { registra(`arco:${camada.id}`); camada.arco = valor; schedule(); }));
  }

  if (camada.tipo === 'foto') {
    const item = fotos.get(camada.id);
    const acoes = document.createElement('div');
    acoes.className = 'studio-item__acoes';
    acoes.append(botao(item?.asset ? 'Trocar foto' : 'Escolher foto', () => pedeArquivo({ tipo: 'camada', id: camada.id })));
    // "Usar a câmera" e não "Tirar foto agora": o botão de remover ao lado já se chama "Tirar a foto",
    // e dois botões começando com "tirar" — um que põe e outro que apaga — seria pedir erro.
    if (temCamera()) acoes.append(botao('Usar a câmera', () => pedeArquivo({ tipo: 'camada', id: camada.id }, { camera: true })));
    if (item?.asset) acoes.append(botao('Tirar a foto', () => tiraFoto(camada.id)));
    partes.push(acoes);
    partes.push(campoSelect('Formato', FORMAS_DE_FOTO, camada.forma, (valor) => { registra(`forma:${camada.id}`); camada.forma = valor; schedule(); }));
    if (item?.asset) {
      partes.push(campoSelect('Tratamento', FILTROS.map((f) => ({ valor: f.valor, nome: f.nome })), camada.filtro || 'nenhum', (valor) => {
        registra(`filtro:${camada.id}`);
        camada.filtro = valor;
        schedule();
      }));
      const fundo = document.createElement('div');
      fundo.className = 'studio-item__acoes';
      fundo.append(item.original
        ? botao('Voltar o fundo da foto', () => voltaOFundo(camada.id))
        : botao('Tirar o fundo claro', () => tiraOFundo(camada.id)));
      partes.push(fundo);
    }
    partes.push(campoRange('Tamanho', camada.largura, LIMITES.fotoLargura, 0.005, (valor) => {
      registra(`tamanho:${camada.id}`);
      const proporcao = camada.altura / camada.largura;
      camada.largura = valor;
      camada.altura = clamp(valor * proporcao, 0.05, 1);
      schedule();
    }));
    if (item?.asset) {
      // O enquadramento fino fica recolhido: o cartão continua curto para quem só quer a foto ali.
      const ajuste = camada.ajuste || (camada.ajuste = { scale: 1, offsetX: 0, offsetY: 0 });
      const bloco = document.createElement('details');
      bloco.className = 'studio-ajuste-fino';
      const titulo = document.createElement('summary');
      titulo.textContent = 'Enquadrar a foto';
      bloco.append(titulo,
        campoRange('Aproximar', ajuste.scale, [1, 3], 0.01, (valor) => { registra(`enquadra:${camada.id}`); ajuste.scale = valor; schedule(); }),
        campoRange('Para os lados', ajuste.offsetX, [-1, 1], 0.01, (valor) => { registra(`enquadra:${camada.id}`); ajuste.offsetX = valor; schedule(); }),
        campoRange('Para cima ou para baixo', ajuste.offsetY, [-1, 1], 0.01, (valor) => { registra(`enquadra:${camada.id}`); ajuste.offsetY = valor; schedule(); }));
      partes.push(bloco);
    }
  }

  if (camada.tipo === 'enfeite') {
    // A ilustração de uma coleção não está na lista de enfeites: ela entra como a opção de cima,
    // para a pessoa poder trocá-la por um enfeite simples sem perder de vista o que está ali.
    const desenhos = ENFEITES.map((e) => ({ valor: e.forma, nome: e.nome }));
    if (!desenhos.some((d) => d.valor === camada.forma)) desenhos.unshift({ valor: camada.forma, nome: camada.rotulo || 'Ilustração do modelo' });
    partes.push(campoSelect('Desenho', desenhos, camada.forma, (valor) => {
      registra(`forma:${camada.id}`);
      camada.forma = valor;
      montaListas();
      schedule();
    }));
    partes.push(campoCores(camada.cor, (token) => { registra(`cor:${camada.id}`); camada.cor = token; montaListas(); schedule(); }));
    const limites = limiteDeTamanho(camada);
    partes.push(campoRange('Tamanho', camada.tamanho, limites, 0.005, (valor) => { registra(`tamanho:${camada.id}`); camada.tamanho = valor; schedule(); }));
  }

  if (camada.tipo === 'adesivo') {
    partes.push(campoSelect('Pose do Pandinha', ADESIVOS.map((a) => ({ valor: a.arquivo, nome: a.nome })), camada.arquivo, async (valor) => {
      registra(`pose:${camada.id}`);
      camada.arquivo = valor;
      await garanteAdesivos();
      montaListas();
      schedule();
    }));
    partes.push(campoRange('Tamanho', camada.tamanho, LIMITES.adesivoTamanho, 0.005, (valor) => { registra(`tamanho:${camada.id}`); camada.tamanho = valor; schedule(); }));
    const nota = document.createElement('p');
    nota.className = 'studio-help';
    nota.textContent = 'Um Pandinha por caneca. Ele acompanha a arte, nunca fica na frente dela.';
    partes.push(nota);
  }

  partes.push(campoRange('Inclinação', camada.rotacao || 0, LIMITES.giro, 1, (valor) => { registra(`giro:${camada.id}`); camada.rotacao = valor; schedule(); }));

  const lugares = document.createElement('div');
  lugares.className = 'studio-item__acoes';
  for (const lugar of LUGARES) {
    lugares.append(botao(lugar.nome, () => {
      registra(`lugar:${camada.id}`);
      camada.x = lugar.x;
      schedule();
    }));
  }
  lugares.append(botao('Centralizar na altura', () => {
    registra(`lugar:${camada.id}`);
    camada.y = 0.5;
    schedule();
  }));
  partes.push(lugares);

  const ordem = document.createElement('div');
  ordem.className = 'studio-item__acoes';
  ordem.append(
    botao('Trazer para frente', () => mudaOrdem(camada.id, 1)),
    botao('Mandar para trás', () => mudaOrdem(camada.id, -1)),
  );
  if (camada.tipo !== 'adesivo') ordem.append(botao('Duplicar', () => duplica(camada.id)));
  ordem.append(botao('Apagar', () => apaga(camada.id)));
  partes.push(ordem);
  return partes;
}

function cartaoDeCamada(camada) {
  const aberto = selecionada === camada.id;
  const li = document.createElement('li');
  li.className = 'studio-item';
  if (aberto) li.classList.add('studio-item--aberto');
  const cabeca = document.createElement('button');
  cabeca.type = 'button';
  cabeca.className = 'studio-item__cabeca';
  cabeca.dataset.camada = camada.id;
  cabeca.setAttribute('aria-expanded', String(aberto));
  cabeca.setAttribute('aria-controls', `corpo-${camada.id}`);
  const textos = document.createElement('span');
  textos.className = 'studio-item__texto';
  const titulo = document.createElement('span');
  titulo.textContent = rotuloDaCamada(camada);
  const sub = document.createElement('small');
  sub.textContent = subtituloDaCamada(camada);
  textos.append(titulo, sub);
  const seta = document.createElement('span');
  seta.className = 'studio-item__seta';
  seta.setAttribute('aria-hidden', 'true');
  seta.textContent = aberto ? '−' : '+';
  cabeca.append(icone(camada), textos, seta);
  cabeca.addEventListener('click', () => {
    if (selecionada === camada.id) { seleciona(null); return; }
    seleciona(camada.id);
    if (camada.tipo === 'foto' && !fotos.get(camada.id)?.asset) pedeArquivo({ tipo: 'camada', id: camada.id });
  });
  li.appendChild(cabeca);
  const corpo = document.createElement('div');
  corpo.className = 'studio-item__corpo';
  corpo.id = `corpo-${camada.id}`;
  corpo.dataset.corpo = camada.id;
  corpo.hidden = !aberto;
  if (aberto) corpo.append(...camposDaCamada(camada));
  li.appendChild(corpo);
  return li;
}

function vazio(mensagem) {
  const li = document.createElement('li');
  li.className = 'studio-vazio';
  li.textContent = mensagem;
  return li;
}

function montaListas() {
  if (!arte) {
    el.listaFotos.replaceChildren();
    el.listaFrases.replaceChildren();
    el.listaEnfeites.replaceChildren();
    return;
  }
  const fotosDaArte = camadasDo('foto');
  const frases = camadasDo('frase');
  const enfeites = camadasDo('enfeites');
  el.listaFotos.replaceChildren(...(fotosDaArte.length
    ? fotosDaArte.map(cartaoDeCamada)
    : [vazio('Este modelo não tem espaço de foto. Toque em "Acrescentar foto" para abrir um.')]));
  el.listaFrases.replaceChildren(...(frases.length
    ? frases.map(cartaoDeCamada)
    : [vazio('Nenhuma frase por enquanto. Toque em "Acrescentar frase".')]));
  el.listaEnfeites.replaceChildren(...(enfeites.length
    ? enfeites.map(cartaoDeCamada)
    : [vazio('Nenhum enfeite por enquanto. Toque num desenho aí em cima.')]));
  for (const botaoDaAba of el.abas.children) {
    const conta = contaDaAba(botaoDaAba.dataset.aba);
    const marca = botaoDaAba.querySelector('.studio-aba__conta');
    if (marca && conta !== null) marca.textContent = String(conta);
  }
}

function seleciona(id, { mostrarPainel = false } = {}) {
  selecionada = id;
  const camada = camadaPorId(id);
  if (camada) mostraAba(abaDaCamada(camada));
  montaListas();
  if (camada && mostrarPainel) {
    const cartao = document.querySelector(`[data-camada="${id}"]`);
    const caixa = cartao?.getBoundingClientRect();
    if (caixa && (caixa.top < 0 || caixa.bottom > window.innerHeight)) cartao.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  schedule();
}

function mudaOrdem(id, direcao) {
  registra('estrutura');
  const indice = arte.camadas.findIndex((camada) => camada.id === id);
  const destino = indice + direcao;
  if (indice < 0 || destino < 0 || destino >= arte.camadas.length) return;
  const [camada] = arte.camadas.splice(indice, 1);
  arte.camadas.splice(destino, 0, camada);
  montaListas();
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
}

function apaga(id) {
  registra('estrutura');
  const indice = arte.camadas.findIndex((camada) => camada.id === id);
  if (indice < 0) return;
  const [camada] = arte.camadas.splice(indice, 1);
  if (camada.tipo === 'foto') tiraFoto(id, false);
  selecionada = null;
  montaAbas();
  montaListas();
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
  montaAbas();
  seleciona(camada.id);
  return camada;
}

function adicionaFoto() {
  if (!arte) return;
  const lugar = lugarLivre();
  const camada = acrescenta({
    id: novoId(), tipo: 'foto', rotulo: `Foto ${camadasDo('foto').length + 1}`, forma: 'arredondado',
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
  document.querySelector(`[data-corpo="${selecionada}"] input[type="text"]`)?.focus();
}

function adicionaEnfeite(forma) {
  if (!arte) return;
  const lugar = lugarLivre();
  acrescenta({
    id: novoId(), tipo: 'enfeite', forma, cor: '--peach-deep',
    x: lugar.x, y: 0.5, tamanho: 0.14, rotacao: 0,
  });
}

function adicionaElemento(arquivo) {
  if (!arte) return;
  const lugar = lugarLivre();
  acrescenta({
    id: novoId(), tipo: 'elemento', arquivo, rotulo: ELEMENTOS.find((e) => e.arquivo === arquivo)?.nome || 'Elemento',
    x: lugar.x, y: 0.5, tamanho: 0.2, rotacao: 0,
  });
  garanteAdesivos();
}

async function adicionaPandinha() {
  if (!arte) return;
  const existente = arte.camadas.find((camada) => camada.tipo === 'adesivo');
  if (existente) { seleciona(existente.id, { mostrarPainel: true }); return; }
  const lugar = lugarLivre();
  acrescenta({
    id: novoId(), tipo: 'adesivo', rotulo: 'Pandinha', arquivo: ADESIVOS[0].arquivo,
    x: lugar.x, y: 0.78, tamanho: 0.18, rotacao: 0,
  });
  await garanteAdesivos();
  montaListas();
  schedule();
}

/** O seletor de letra da arte livre usa a mesma biblioteca dos modelos. */
function montaSeletorDeLetras() {
  el.font.replaceChildren(...FONTES_DA_ARTE.map((fonte) => {
    const opcao = document.createElement('option');
    opcao.value = fonte.valor;
    opcao.textContent = fonte.nome;
    return opcao;
  }));
  el.font.value = state.fontFamily;
}

function montaGradeDeElementos() {
  el.gradeElementos.replaceChildren(...ELEMENTOS.map((item) => {
    const botaoElemento = document.createElement('button');
    botaoElemento.type = 'button';
    botaoElemento.className = 'studio-elemento';
    botaoElemento.title = `Acrescentar ${item.nome.toLowerCase()}`;
    botaoElemento.setAttribute('aria-label', `Acrescentar ${item.nome.toLowerCase()}`);
    const img = document.createElement('img');
    img.src = item.arquivo;
    img.alt = '';
    img.loading = 'lazy';
    botaoElemento.appendChild(img);
    botaoElemento.addEventListener('click', () => adicionaElemento(item.arquivo));
    return botaoElemento;
  }));
}

/** A cor de fundo da arte: o mesmo modelo muda de clima trocando só isso. */
function montaFundoDaArte() {
  el.fundoArte.hidden = !arte;
  if (!arte) { el.fundoArte.replaceChildren(); return; }
  const titulo = document.createElement('p');
  titulo.className = 'studio-campo';
  const texto = document.createElement('span');
  texto.textContent = 'Cor do fundo da arte';
  titulo.appendChild(texto);
  const grupo = document.createElement('div');
  grupo.className = 'studio-cores';
  grupo.setAttribute('role', 'group');
  grupo.setAttribute('aria-label', 'Cor do fundo da arte');
  const opcoes = [{ token: '--white', nome: 'Branco' }, { token: '--paper', nome: 'Papel' }, { token: '--cream', nome: 'Creme' },
    { token: '--sand-soft', nome: 'Areia clara' }, { token: '--sand', nome: 'Areia' }, { token: '--peach', nome: 'Pêssego' },
    { token: '--sage', nome: 'Sálvia' }, { token: '--kraft', nome: 'Kraft' }];
  for (const item of opcoes) {
    const botaoCor = document.createElement('button');
    botaoCor.type = 'button';
    botaoCor.className = 'studio-cor';
    botaoCor.style.setProperty('--tinta', `var(${item.token})`);
    botaoCor.title = item.nome;
    botaoCor.setAttribute('aria-label', `Fundo ${item.nome.toLowerCase()}`);
    botaoCor.setAttribute('aria-pressed', String(arte.fundo === item.token));
    botaoCor.addEventListener('click', () => {
      registra('fundo-da-arte');
      arte.fundo = item.token;
      for (const outro of grupo.children) outro.setAttribute('aria-pressed', String(outro === botaoCor));
      montaModelos();
      marcaModeloEscolhido();
      schedule();
    });
    grupo.appendChild(botaoCor);
  }
  titulo.appendChild(grupo);
  el.fundoArte.replaceChildren(titulo);
}

function montaGradeDeEnfeites() {
  el.gradeEnfeites.replaceChildren(...ENFEITES.map((item) => {
    const botaoForma = document.createElement('button');
    botaoForma.type = 'button';
    botaoForma.className = 'studio-forma';
    botaoForma.title = `Acrescentar ${item.nome.toLowerCase()}`;
    botaoForma.setAttribute('aria-label', `Acrescentar ${item.nome.toLowerCase()}`);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 56;
    canvas.setAttribute('aria-hidden', 'true');
    const context = canvas.getContext('2d');
    if (context) {
      context.translate(28, 28);
      desenhaForma(context, item.forma, 40, cor('--peach-deep'));
    }
    botaoForma.appendChild(canvas);
    botaoForma.addEventListener('click', () => adicionaEnfeite(item.forma));
    return botaoForma;
  }));
}

/* ---------- fotos ---------- */
/**
 * Tira o fundo liso e claro de uma foto, a partir das bordas. Funciona em foto de estúdio, de
 * produto ou de pet em fundo de papel; em foto de cena, o aviso explica que não dá.
 * O original fica guardado: dá para voltar atrás a qualquer momento.
 */
async function tiraOFundo(id) {
  const item = fotos.get(id);
  if (!item?.asset) return;
  setStatus('Tirando o fundo da foto…');
  try {
    const { width, height, image } = item.asset;
    const tela = document.createElement('canvas');
    tela.width = width;
    tela.height = height;
    const contexto = tela.getContext('2d', { willReadFrequently: true });
    contexto.drawImage(image, 0, 0, width, height);
    const dados = contexto.getImageData(0, 0, width, height);
    const px = dados.data;
    const cantos = [0, (width - 1) * 4, (height - 1) * width * 4, ((height - 1) * width + width - 1) * 4];
    const base = [0, 1, 2].map((canal) => Math.round(cantos.reduce((soma, i) => soma + px[i + canal], 0) / cantos.length));
    const tolerancia = 62;
    const parecido = (i) => Math.hypot(px[i] - base[0], px[i + 1] - base[1], px[i + 2] - base[2]) < tolerancia;
    const visitado = new Uint8Array(width * height);
    const fila = [];
    for (let x = 0; x < width; x += 1) { fila.push(x, (height - 1) * width + x); }
    for (let y = 0; y < height; y += 1) { fila.push(y * width, y * width + width - 1); }
    let apagados = 0;
    while (fila.length) {
      const ponto = fila.pop();
      if (visitado[ponto]) continue;
      visitado[ponto] = 1;
      const i = ponto * 4;
      if (!parecido(i)) continue;
      px[i + 3] = 0;
      apagados += 1;
      const x = ponto % width;
      const y = (ponto - x) / width;
      if (x > 0) fila.push(ponto - 1);
      if (x < width - 1) fila.push(ponto + 1);
      if (y > 0) fila.push(ponto - width);
      if (y < height - 1) fila.push(ponto + width);
    }
    const fatia = apagados / (width * height);
    if (fatia < 0.02) { setStatus('O fundo desta foto não é liso o bastante para sair sozinho. Tente recortar num formato (círculo ou coração).'); return; }
    if (fatia > 0.94) { setStatus('Quase tudo saiu junto com o fundo, então nada foi mudado. Esta foto precisa de recorte à mão.'); return; }
    contexto.putImageData(dados, 0, 0);
    const recortada = typeof createImageBitmap === 'function' ? await createImageBitmap(tela) : tela;
    registra(`fundo:${id}`);
    fotos.set(id, { ...item, original: item.asset, asset: { ...item.asset, image: recortada } });
    montaListas();
    schedule();
    setStatus(`Fundo tirado (${Math.round(fatia * 100)}% da foto). Se não ficou bom, dá para voltar atrás.`);
  } catch (erro) {
    setStatus(erro.message || 'Não foi possível tirar o fundo desta foto.');
  }
}

function voltaOFundo(id) {
  const item = fotos.get(id);
  if (!item?.original) return;
  registra(`fundo:${id}`);
  fotos.set(id, { ...item, asset: item.original, original: null });
  montaListas();
  schedule();
  setStatus('Fundo da foto de volta como estava.');
}

/**
 * Abre o seletor de arquivo. Com `camera`, pede a câmera de trás em vez da galeria — no celular é o
 * caminho natural de quem vai dar a caneca de presente e quer fotografar o bolo ou o pet agora.
 * De quebra resolve o HEIC do iPhone sem precisar lê-lo: a câmera do navegador entrega JPEG.
 */
function pedeArquivo(destino, { camera = false } = {}) {
  destinoDoArquivo = destino;
  el.file.value = '';
  if (camera) el.file.setAttribute('capture', 'environment');
  else el.file.removeAttribute('capture');
  el.file.click();
}

/** Só onde existe câmera de verdade: no computador o atributo é ignorado e o botão só confundiria. */
const temCamera = () => window.matchMedia('(hover: none) and (pointer: coarse)').matches;

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
    montaListas();
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
        id: novoId(), tipo: 'foto', rotulo: `Foto ${camadasDo('foto').length + 1}`, forma: 'arredondado',
        x: clamp(fracao.x, 0.06, 0.94), y: clamp(fracao.y, 0.1, 0.9), largura: 0.24, altura: 0.6,
        rotacao: 0, ajuste: { scale: 1, offsetX: 0, offsetY: 0 },
      });
      destino = { tipo: 'camada', id: nova.id };
    }
  } else {
    const vazia = camadasDo('foto').find((camada) => !fotos.get(camada.id)?.asset);
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
  let nome = `Interior ${optionLabel(el.inside, state.inside).toLowerCase()} · alça ${optionLabel(el.handle, state.handle).toLowerCase()}`;
  for (const button of presetButtons) {
    const preset = PRESETS[button.dataset.preset];
    const igual = preset.inside === state.inside && preset.handle === state.handle;
    button.setAttribute('aria-pressed', String(igual));
    if (igual) nome = preset.nome;
  }
  if (el.pecaResumo) el.pecaResumo.textContent = nome;
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
  if (!arte) state.withPanda = el.panda.checked;
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

/**
 * Leva a arte para o Canva. O Canva não abre um projeto já com a arte dentro por um link de fora,
 * então o site baixa o PNG na medida certa e abre o Canva na aba ao lado: lá é arrastar o arquivo.
 */
async function levaParaOCanva() {
  try {
    if (!hasContent()) {
      const { blob, larguraPx, alturaPx } = await exportGuideArtwork(MUG_SPEC);
      download(blob, `gabarito-caneca-panda-mimo-${larguraPx}x${alturaPx}.png`);
      setStatus(`Ainda não há arte, então baixamos o gabarito (${larguraPx} × ${alturaPx} px). No Canva, crie um design desse tamanho e use o gabarito como fundo.`);
      return;
    }
    setStatus('Preparando sua arte para levar ao Canva…');
    const { blob, widthPx, heightPx } = await exportPrintArtwork(opcoesDeComposicao());
    download(blob, `arte-da-caneca-para-o-canva-${widthPx}x${heightPx}.png`);
    setStatus(`Arte baixada em ${widthPx} × ${heightPx} px. No Canva, crie um design desse tamanho e arraste o arquivo para dentro. Quando terminar, volte aqui em "Trazer a arte do Canva".`);
  } catch (error) {
    setStatus(error.message || 'Não foi possível preparar a arte para o Canva agora.');
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
  mostraAba('arte');
  const proporcao = artwork.width / artwork.height;
  const certa = MUG_SPEC.printWidthMm / MUG_SPEC.printHeightMm;
  if (Math.abs(proporcao - certa) / certa > 0.03) {
    setStatus(`A arte veio em ${artwork.width} × ${artwork.height} px, proporção diferente da volta da caneca. Ela entra inteira, com folga em volta. Para preencher tudo, use ${medida.larguraPx} × ${medida.alturaPx} px.`);
  } else {
    setStatus('Arte do Canva aplicada na volta inteira da caneca. Gire a peça para conferir.');
  }
}

/* ---------- rascunho: o trabalho não se perde ao fechar a aba ---------- */
let rascunhoPendente = 0;

function montagemAtual() {
  return {
    versao: PROJETO_VERSAO,
    escolhas: { ...state },
    arte: arte ? { ...arte, camadas: arte.camadas.map((camada) => ({ ...camada })) } : null,
    cena: cenaAtual,
    acabamento: acabamentoAtual,
  };
}

function guardaRascunho() {
  clearTimeout(rascunhoPendente);
  rascunhoPendente = setTimeout(async () => {
    const fotosSalvas = {};
    for (const [id, item] of fotos) if (item.blob) fotosSalvas[id] = item.blob;
    await salvaRascunho({ ...montagemAtual(), fotos: fotosSalvas, arteLivre: artworkBlob || null, nomeDaArte: artwork?.name || '' });
  }, 1200);
}

async function ofereceRascunho() {
  const guardado = await leRascunho();
  if (!guardado || (!guardado.arte && !guardado.arteLivre)) return;
  el.rascunhoTexto.textContent = `Você começou uma caneca ${quandoFoi(guardado.salvoEm)} e ela ficou guardada neste aparelho.`;
  el.rascunho.hidden = false;
  el.rascunhoContinuar.onclick = async () => {
    el.rascunho.hidden = true;
    await aplicaMontagem(guardado);
    setStatus('Rascunho aberto. Continue de onde parou.');
  };
  el.rascunhoApagar.onclick = async () => {
    el.rascunho.hidden = true;
    await apagaRascunho();
    setStatus('Rascunho apagado. Comece à vontade.');
  };
}

/** Coloca na tela uma montagem guardada (rascunho, projeto em arquivo ou link). */
async function aplicaMontagem(dados, { fotos: fotosDoArquivo = null } = {}) {
  const c = dados.escolhas || {};
  setColors(c.inside, c.handle);
  el.name.value = String(c.name || '').slice(0, 24);
  el.font.value = fontePorValor(c.fontFamily) ? c.fontFamily : 'Fredoka';
  el.panda.checked = c.withPanda !== false;
  readTextOptions();
  if (dados.cena) { cenaAtual = dados.cena; viewer?.setCenario(cenaAtual); }
  if (dados.acabamento) { acabamentoAtual = dados.acabamento; viewer?.setAcabamento(acabamentoAtual); }
  montaCenas();
  if (dados.arte?.camadas?.length) {
    escolheModelo(dados.arte.modelo || null);
    arte = { ...dados.arte, camadas: dados.arte.camadas.map((camada) => ({ ...camada })) };
    modeloAtual = acheModelo(arte.modelo);
    contador = arte.camadas.length + 10;
    selecionada = null;
    state.withPanda = true;
    limpaHistorico();
    marcaModeloEscolhido();
    atualizaModo();
    await garanteAdesivos();
    await garanteFontes();
    const guardadas = fotosDoArquivo || dados.fotos || {};
    for (const [id, guardada] of Object.entries(guardadas)) {
      const arquivo = guardada instanceof Blob
        ? new File([guardada], 'foto.webp', { type: guardada.type || 'image/webp' })
        : await arquivoDeDados(guardada);
      await handleFile(arquivo, { tipo: 'camada', id });
    }
    mostraAba('fotos');
  } else {
    escolheModelo(null);
    if (LAYOUTS[c.layout]) { state.layout = c.layout; el.form.elements.layout.value = c.layout; }
    el.scale.value = String(Math.round((Number(c.scale) || 1) * 100));
    el.x.value = String(Math.round((Number(c.offsetX) || 0) * 100));
    el.y.value = String(Math.round((Number(c.offsetY) || 0) * 100));
    el.rotation.value = String(Math.round(Number(c.rotation) || 0));
    readAdjustments();
    const livre = dados.arteLivre;
    if (livre instanceof Blob) await handleFile(new File([livre], dados.nomeDaArte || 'Minha arte', { type: livre.type }), { tipo: 'livre' });
    else if (livre?.dados) await handleFile(await arquivoDeDados(livre), { tipo: 'livre' });
    else removeArtwork();
  }
  limpaHistorico();
  schedule();
}

/* ---------- link da montagem (sem as fotos) ---------- */
const paraBase64Url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deBase64Url = (texto) => Uint8Array.from(atob(texto.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function comprime(texto) {
  const bytes = new TextEncoder().encode(texto);
  if (typeof CompressionStream !== 'function') return { bytes, cru: true };
  const fluxo = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return { bytes: new Uint8Array(await new Response(fluxo).arrayBuffer()), cru: false };
}

async function descomprime(bytes, cru) {
  if (cru || typeof DecompressionStream !== 'function') return new TextDecoder().decode(bytes);
  const fluxo = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new TextDecoder().decode(await new Response(fluxo).arrayBuffer());
}

async function copiaLink() {
  try {
    const { bytes, cru } = await comprime(JSON.stringify(montagemAtual()));
    const endereco = `${location.origin}${location.pathname}#${cru ? 'j' : 'm'}=${paraBase64Url(bytes)}`;
    if (endereco.length > 60000) { setStatus('Esta montagem ficou grande demais para um link. Salve o projeto em arquivo.'); return; }
    await navigator.clipboard.writeText(endereco);
    setStatus('Link copiado. Ele leva a montagem, mas não as fotos: quem abrir coloca as dele.');
  } catch {
    setStatus('Este navegador não deixou copiar. Use "Salvar tudo em um arquivo".');
  }
}

async function abreLinkDaMontagem() {
  const marca = location.hash.match(/^#([jm])=(.+)$/);
  if (!marca) return false;
  try {
    const texto = await descomprime(deBase64Url(marca[2]), marca[1] === 'j');
    const dados = JSON.parse(texto);
    if (!dados?.escolhas) return false;
    await aplicaMontagem(dados);
    setStatus('Montagem aberta pelo link. As fotos ficam com quem montou: escolha as suas.');
    history.replaceState(null, '', location.pathname);
    return true;
  } catch {
    return false;
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

async function saveVideo() {
  if (!viewer) return;
  const rotulo = el.saveVideo.textContent;
  el.saveVideo.disabled = true;
  setStatus('Gravando a caneca dando uma volta…');
  try {
    const blob = await viewer.gravaVolta({
      segundos: 5,
      aoAndar: (t) => { el.saveVideo.textContent = `Gravando… ${Math.round(t * 100)}%`; },
    });
    if (!blob) { setStatus('Este navegador não grava vídeo. Baixe a prévia em imagem.'); return; }
    download(blob, `caneca-panda-mimo-girando${modeloAtual ? `-${slug(modeloAtual.nome)}` : ''}.webm`);
    setStatus('Vídeo salvo em WebM, pronto para mandar no WhatsApp ou postar.');
  } catch (error) {
    setStatus(error.message || 'Não foi possível gravar o vídeo agora.');
  } finally {
    el.saveVideo.textContent = rotulo;
    el.saveVideo.disabled = false;
  }
}

/** Manda a prévia direto pelo aparelho (WhatsApp, e-mail, o que a pessoa escolher). */
async function compartilha() {
  if (!viewer) return;
  el.compartilhar.disabled = true;
  try {
    const blob = await viewer.capture();
    const arquivo = new File([blob], 'caneca-panda-mimo.png', { type: 'image/png' });
    if (!navigator.canShare?.({ files: [arquivo] })) {
      setStatus('Este aparelho não compartilha arquivo direto. Baixe a prévia e anexe na conversa.');
      return;
    }
    await navigator.share({ files: [arquivo], text: orderMessage(), title: 'Minha caneca Panda Mimo' });
    setStatus('Prévia mandada. É só escolher a conversa.');
  } catch (error) {
    if (error?.name !== 'AbortError') setStatus('Não deu para compartilhar agora. Baixe a prévia e anexe na conversa.');
  } finally {
    el.compartilhar.disabled = false;
  }
}

async function savePreview4k() {
  if (!viewer) return;
  el.save4k.disabled = true;
  setStatus('Preparando a prévia grande…');
  try {
    const blob = await viewer.capture({ largura: 3840 });
    download(blob, `caneca-panda-mimo-previa-4k${modeloAtual ? `-${slug(modeloAtual.nome)}` : ''}.png`);
    setStatus('Prévia em 4K salva, boa para post e anúncio.');
  } catch (error) {
    setStatus(error.message || 'Não foi possível salvar a prévia grande agora.');
  } finally {
    el.save4k.disabled = false;
  }
}

/* ---------- vários nomes de uma vez ---------- */
function montaSeletorDeLote() {
  const frases = camadasDo('frase');
  el.loteFrase.replaceChildren(...frases.map((camada) => {
    const opcao = document.createElement('option');
    opcao.value = camada.id;
    opcao.textContent = `${camada.rotulo || 'Frase'}: "${String(camada.texto || '').slice(0, 24)}"`;
    return opcao;
  }));
  el.lote.hidden = !arte || !frases.length;
}

async function geraLote() {
  const nomes = [...new Set(el.loteNomes.value.split(/\r?\n/).map((linha) => linha.trim()).filter(Boolean))];
  if (!arte || !nomes.length) { el.loteStatus.textContent = 'Escreva ao menos um nome.'; return; }
  if (nomes.length > 60) { el.loteStatus.textContent = 'São até 60 nomes por vez. Faça em duas levas.'; return; }
  const camada = camadaPorId(el.loteFrase.value);
  if (!camada) { el.loteStatus.textContent = 'Escolha qual frase troca de nome.'; return; }
  el.loteGerar.disabled = true;
  const original = camada.texto;
  const irmas = camada.grupo ? arte.camadas.filter((c) => c.grupo === camada.grupo) : [camada];
  try {
    const arquivos = [];
    for (let i = 0; i < nomes.length; i += 1) {
      el.loteStatus.textContent = `Gerando ${i + 1} de ${nomes.length}…`;
      for (const irma of irmas) irma.texto = nomes[i];
      // eslint-disable-next-line no-await-in-loop
      const { blob } = await exportPrintArtwork(opcoesDeComposicao());
      // eslint-disable-next-line no-await-in-loop
      const dados = new Uint8Array(await blob.arrayBuffer());
      arquivos.push({ nome: `${String(i + 1).padStart(2, '0')}-${slug(nomes[i]) || 'nome'}.png`, dados });
    }
    download(fazZip(arquivos), `canecas-panda-mimo-${arquivos.length}-nomes.zip`);
    el.loteStatus.textContent = `${arquivos.length} artes num arquivo só, prontas para a produção.`;
    setStatus(`${arquivos.length} artes geradas. Mande o arquivo junto com o pedido no WhatsApp.`);
  } catch (erro) {
    el.loteStatus.textContent = erro.message || 'Não foi possível gerar as artes agora.';
  } finally {
    for (const irma of irmas) irma.texto = original;
    el.loteGerar.disabled = false;
    montaListas();
    schedule();
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
    el.font.value = fontePorValor(c.fontFamily) ? c.fontFamily : 'Fredoka';
    el.panda.checked = c.withPanda !== false;
    readTextOptions();
    if (project.arte?.camadas?.length) {
      escolheModelo(project.arte.modelo || null);
      arte = { ...project.arte, camadas: project.arte.camadas.map((camada) => ({ ...camada })) };
      modeloAtual = acheModelo(arte.modelo);
      contador = arte.camadas.length + 10;
      selecionada = null;
      state.withPanda = true;
      limpaHistorico();
      marcaModeloEscolhido();
      atualizaModo();
      await garanteAdesivos();
      await garanteFontes();
      for (const [id, registro] of Object.entries(project.fotos || {})) {
        if (registro?.dados) await handleFile(await arquivoDeDados(registro), { tipo: 'camada', id });
      }
      mostraAba('fotos');
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
    limpaHistorico();
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
    const limite = camada.tipo === 'adesivo' ? LIMITES.adesivoTamanho : limiteDeTamanho(camada);
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
    const mexeuNaForma = arrasto.tipo !== 'mover';
    arrasto = null;
    if (mexeuNaForma) montaListas();
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
        id: novoId(), tipo: 'foto', rotulo: `Foto ${camadasDo('foto').length + 1}`, forma: 'arredondado',
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

  el.travar.addEventListener('click', alternaCadeado);
  el.abas.addEventListener('keydown', andaNasAbas);
  el.categoria.addEventListener('change', () => {
    categoria = el.categoria.value;
    mostrarTodosOsModelos = false;
    montaModelos();
  });
  el.busca.addEventListener('input', () => {
    busca = semAcento(el.busca.value.trim());
    mostrarTodosOsModelos = false;
    montaModelos();
  });
  el.moreModels.addEventListener('click', () => { mostrarTodosOsModelos = !mostrarTodosOsModelos; montaModelos(); });
  el.mostrarMargem.addEventListener('change', schedule);

  el.addFoto.addEventListener('click', adicionaFoto);
  el.addFrase.addEventListener('click', adicionaFrase);
  el.addPandinha.addEventListener('click', adicionaPandinha);

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

  el.choose.addEventListener('click', () => pedeArquivo({ tipo: 'livre' }));
  // Rolar a lista (ou a página, que move a lista junto) traz as próximas miniaturas.
  el.models.addEventListener('scroll', agendaMiniaturas, { passive: true });
  window.addEventListener('scroll', agendaMiniaturas, { passive: true });
  window.addEventListener('resize', agendaMiniaturas, { passive: true });
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
  el.font.addEventListener('change', () => { readTextOptions(); garanteFontes(); });
  el.panda.addEventListener('change', readTextOptions);

  el.saveGuide.addEventListener('click', saveGuide);
  // O clique abre o Canva pelo próprio link e, no mesmo gesto, baixa a arte.
  el.abrirCanva.addEventListener('click', levaParaOCanva);
  el.importarCanva.addEventListener('click', () => { el.canvaFile.value = ''; el.canvaFile.click(); });
  el.canvaFile.addEventListener('change', () => importaDoCanva(el.canvaFile.files?.[0]));
  el.savePreview.addEventListener('click', savePreview);
  el.saveVideo.addEventListener('click', saveVideo);
  el.save4k.addEventListener('click', savePreview4k);
  el.compartilhar.addEventListener('click', compartilha);
  el.copiarLink.addEventListener('click', copiaLink);
  el.loteGerar.addEventListener('click', geraLote);
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
  montaGradeDeEnfeites();
  montaGradeDeElementos();
  montaSeletorDeLetras();
  montaCenas();
  atualizaCadeado();
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
  // Link de montagem tem prioridade; sem ele, o rascunho deste aparelho é oferecido.
  if (!(await abreLinkDaMontagem())) await ofereceRascunho();
  el.compartilhar.hidden = typeof navigator.canShare !== 'function'
    || !navigator.canShare({ files: [new File([new Blob(['x'])], 'x.png', { type: 'image/png' })] });
}

init();
