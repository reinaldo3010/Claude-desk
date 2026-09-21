/**
 * Modelos de arte da caneca: artes de volta inteira (360°) com espaços de foto e frases editáveis.
 *
 * Toda medida é fração da área de impressão (210 × 90 mm), então o mesmo desenho serve para a
 * prévia 3D, para a arte aberta na tela e para o arquivo de 300 dpi, sem recalcular nada.
 * x=0 é a borda esquerda da área (junto da alça) e x=1 a direita; y=0 é o topo.
 * A frente da caneca fica em x≈0,193 e o verso em x≈0,807 (marcas de dobra da arte aberta).
 *
 * Cores saem da paleta da marca (manual, seção 7). Os valores abaixo são o valor de reserva usado
 * quando não há CSS (testes em Node); na página, cada token é lido de styles.css.
 */

// Onde a frente (u=.25) e o verso (u=.75) caem dentro da área de impressão da caneca padrão:
// a volta tem PI*82 mm e a área impressa, 210 mm centrados nela.
const VOLTA_MM = Math.PI * 82, AREA_MM = 210;
export const FRENTE = (0.25 * VOLTA_MM - (VOLTA_MM - AREA_MM) / 2) / AREA_MM;
export const VERSO = 1 - FRENTE;

const PALETA = Object.freeze({
  '--ink': '#171512', '--ink-soft': '#4A443D', '--paper': '#FBF6EF', '--cream': '#F6F4EF',
  '--sand': '#E7D8C3', '--sand-soft': '#F1E7D8', '--kraft': '#C9A57E', '--peach': '#FFB59C',
  '--peach-deep': '#E8916F', '--peach-ink': '#A25030', '--hand-ink': '#CB6B44',
  '--sage': '#A8C5A2', '--sage-deep': '#6E8C67', '--white': '#FFFDF8',
});

/** Um token da paleta vira cor; na página vem do styles.css, fora dela do valor de reserva. */
export function cor(token) {
  if (typeof token !== 'string' || !token.startsWith('--')) return token || PALETA['--ink'];
  if (typeof getComputedStyle === 'function' && typeof document !== 'undefined') {
    const lido = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    if (lido) return lido;
  }
  return PALETA[token] || PALETA['--ink'];
}

export const CATEGORIAS = Object.freeze([
  { id: 'livre', nome: 'Sem modelo', descricao: 'Sua foto sozinha, do seu jeito' },
  { id: 'namorados', nome: 'Namorados', descricao: 'Aniversário de namoro, casamento, Dia dos Namorados' },
  { id: 'aniversario', nome: 'Aniversário', descricao: 'Parabéns com foto e idade' },
  { id: 'natal', nome: 'Natal', descricao: 'Fim de ano e amigo secreto' },
  { id: 'maes', nome: 'Dia das Mães', descricao: 'Pra mãe, a avó, a madrinha' },
  { id: 'pais', nome: 'Dia dos Pais', descricao: 'Pro pai, o avô, o padrinho' },
  { id: 'fotos', nome: 'Só fotos', descricao: 'Várias fotos ao redor, sem data' },
]);

/* Formas dos enfeites, desenhadas em milímetros e centradas na origem. */
const FORMAS = {
  coracao(ctx, t) {
    ctx.beginPath();
    ctx.moveTo(0, t * 0.38);
    ctx.bezierCurveTo(-t * 0.62, -t * 0.02, -t * 0.42, -t * 0.52, 0, -t * 0.22);
    ctx.bezierCurveTo(t * 0.42, -t * 0.52, t * 0.62, -t * 0.02, 0, t * 0.38);
    ctx.closePath();
  },
  bolinha(ctx, t) { ctx.beginPath(); ctx.arc(0, 0, t * 0.34, 0, Math.PI * 2); ctx.closePath(); },
  estrela(ctx, t) {
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const raio = t * (i % 2 ? 0.17 : 0.42);
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * raio, Math.sin(a) * raio);
    }
    ctx.closePath();
  },
  floco(ctx, t) {
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      const x = Math.cos(a) * t * 0.42, y = Math.sin(a) * t * 0.42;
      ctx.moveTo(0, 0); ctx.lineTo(x, y);
      ctx.moveTo(x * 0.6, y * 0.6);
      ctx.lineTo(x * 0.6 + Math.cos(a + 1.05) * t * 0.15, y * 0.6 + Math.sin(a + 1.05) * t * 0.15);
      ctx.moveTo(x * 0.6, y * 0.6);
      ctx.lineTo(x * 0.6 + Math.cos(a - 1.05) * t * 0.15, y * 0.6 + Math.sin(a - 1.05) * t * 0.15);
    }
  },
  flor(ctx, t) {
    ctx.beginPath();
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2;
      ctx.ellipse(Math.cos(a) * t * 0.24, Math.sin(a) * t * 0.24, t * 0.2, t * 0.1, a, 0, Math.PI * 2);
    }
    // Miolo vazado: a pétala fica desenhada, não um borrão.
    ctx.moveTo(t * 0.09, 0);
    ctx.arc(0, 0, t * 0.09, 0, Math.PI * 2, true);
  },
  confete(ctx, t) {
    ctx.beginPath();
    ctx.rect(-t * 0.1, -t * 0.3, t * 0.2, t * 0.6);
    ctx.closePath();
  },
  folha(ctx, t) {
    ctx.beginPath();
    ctx.moveTo(0, -t * 0.42);
    ctx.quadraticCurveTo(t * 0.36, 0, 0, t * 0.42);
    ctx.quadraticCurveTo(-t * 0.36, 0, 0, -t * 0.42);
    ctx.closePath();
  },
};
const CONTORNO = new Set(['floco']);

/** Sorteio sempre igual para o mesmo modelo: a arte nunca muda entre a prévia e o arquivo final. */
function sorteio(semente) {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MODELOS = [
  {
    id: 'namorados-coracoes', categoria: 'namorados', nome: 'Corações ao redor',
    descricao: 'Duas fotos e uma frase, com corações em toda a volta',
    fundo: '--paper', semente: 12,
    enfeites: { formas: ['coracao', 'bolinha'], cores: ['--peach', '--peach-deep', '--sand'], quantidade: 46, tamanho: [3.5, 9] },
    fotos: [
      { id: 'a', rotulo: 'Foto da frente', forma: 'coracao', x: FRENTE, y: 0.44, largura: 0.30, altura: 0.72 },
      { id: 'b', rotulo: 'Foto do verso', forma: 'coracao', x: VERSO, y: 0.44, largura: 0.30, altura: 0.72 },
    ],
    textos: [
      { id: 'principal', rotulo: 'Frase do meio', valor: 'a gente combina', max: 22, fonte: 'Caveat', cor: '--hand-ink', x: 0.5, y: 0.42, largura: 0.20, tamanho: 13 },
      { id: 'data', rotulo: 'Data ou nome', valor: 'desde 2019', max: 18, fonte: 'Fredoka', cor: '--ink', x: 0.5, y: 0.62, largura: 0.18, tamanho: 6 },
    ],
  },
  {
    id: 'namorados-momentos', panda: 0.5, categoria: 'namorados', nome: 'Nossos momentos',
    descricao: 'Três fotos em fila com uma frase embaixo',
    fundo: '--cream', semente: 27,
    enfeites: { formas: ['coracao'], cores: ['--peach', '--sand'], quantidade: 26, tamanho: [3, 6.5] },
    fotos: [
      { id: 'a', rotulo: 'Primeira foto', forma: 'arredondado', x: FRENTE, y: 0.40, largura: 0.26, altura: 0.60 },
      { id: 'b', rotulo: 'Segunda foto', forma: 'arredondado', x: 0.5, y: 0.40, largura: 0.26, altura: 0.60 },
      { id: 'c', rotulo: 'Terceira foto', forma: 'arredondado', x: VERSO, y: 0.40, largura: 0.26, altura: 0.60 },
    ],
    textos: [
      { id: 'principal', rotulo: 'Frase de baixo', valor: 'nossos momentos', max: 26, fonte: 'Caveat', cor: '--hand-ink', x: FRENTE, y: 0.85, largura: 0.28, tamanho: 9, repetir: [FRENTE, 0.5, VERSO] },
    ],
  },
  {
    id: 'aniversario-confete', categoria: 'aniversario', nome: 'Chuva de confete',
    descricao: 'Uma foto grande, nome e idade, com confete na volta toda',
    fundo: '--paper', semente: 41,
    enfeites: { formas: ['confete', 'bolinha', 'estrela'], cores: ['--peach', '--sage', '--kraft', '--peach-deep'], quantidade: 58, tamanho: [3, 8] },
    fotos: [
      { id: 'a', rotulo: 'Foto do aniversariante', forma: 'circulo', x: FRENTE, y: 0.46, largura: 0.28, altura: 0.68 },
    ],
    textos: [
      { id: 'principal', rotulo: 'Parabéns para', valor: 'Parabéns, Malu!', max: 24, fonte: 'Caveat', cor: '--hand-ink', x: VERSO, y: 0.40, largura: 0.30, tamanho: 13 },
      { id: 'idade', rotulo: 'Idade ou data', valor: '25 anos', max: 16, fonte: 'Fredoka', cor: '--ink', x: VERSO, y: 0.64, largura: 0.22, tamanho: 7 },
    ],
  },
  {
    id: 'natal-flocos', categoria: 'natal', nome: 'Feliz Natal',
    descricao: 'Duas fotos, flocos de neve e o recado de fim de ano',
    fundo: '--cream', semente: 63,
    enfeites: { formas: ['floco', 'bolinha'], cores: ['--sage-deep', '--peach', '--kraft'], quantidade: 44, tamanho: [4, 9] },
    fotos: [
      { id: 'a', rotulo: 'Foto da frente', forma: 'circulo', x: FRENTE, y: 0.45, largura: 0.26, altura: 0.64 },
      { id: 'b', rotulo: 'Foto do verso', forma: 'circulo', x: VERSO, y: 0.45, largura: 0.26, altura: 0.64 },
    ],
    textos: [
      { id: 'principal', rotulo: 'Frase do meio', valor: 'Feliz Natal', max: 20, fonte: 'Caveat', cor: '--sage-deep', x: 0.5, y: 0.40, largura: 0.20, tamanho: 13 },
      { id: 'assinatura', rotulo: 'Assinatura', valor: 'da nossa família pra sua', max: 30, fonte: 'Fredoka', cor: '--ink', x: 0.5, y: 0.63, largura: 0.22, tamanho: 5 },
    ],
  },
  {
    id: 'maes-flores', categoria: 'maes', nome: 'Pra melhor mãe',
    descricao: 'Uma foto em coração, flores na volta e duas frases',
    fundo: '--paper', semente: 84,
    enfeites: { formas: ['flor', 'folha', 'bolinha'], cores: ['--peach', '--sage', '--sand'], quantidade: 48, tamanho: [4, 10] },
    fotos: [
      { id: 'a', rotulo: 'Foto com a mãe', forma: 'coracao', x: FRENTE, y: 0.45, largura: 0.30, altura: 0.72 },
    ],
    textos: [
      { id: 'principal', rotulo: 'Frase principal', valor: 'melhor mãe do mundo', max: 26, fonte: 'Caveat', cor: '--hand-ink', x: VERSO, y: 0.42, largura: 0.30, tamanho: 12 },
      { id: 'assinatura', rotulo: 'Assinatura', valor: 'te amo, mãe', max: 20, fonte: 'Fredoka', cor: '--ink', x: VERSO, y: 0.66, largura: 0.22, tamanho: 6 },
    ],
  },
  {
    id: 'pais-melhor', categoria: 'pais', nome: 'Pro melhor pai',
    descricao: 'Uma foto quadrada, frase grande e assinatura',
    fundo: '--cream', semente: 105,
    enfeites: { formas: ['estrela', 'bolinha'], cores: ['--kraft', '--sand', '--sage'], quantidade: 36, tamanho: [3.5, 8] },
    fotos: [
      { id: 'a', rotulo: 'Foto com o pai', forma: 'arredondado', x: FRENTE, y: 0.45, largura: 0.27, altura: 0.66 },
    ],
    textos: [
      { id: 'principal', rotulo: 'Frase principal', valor: 'melhor pai do mundo', max: 26, fonte: 'Caveat', cor: '--peach-ink', x: VERSO, y: 0.42, largura: 0.30, tamanho: 12 },
      { id: 'assinatura', rotulo: 'Assinatura', valor: 'obrigado por tudo', max: 24, fonte: 'Fredoka', cor: '--ink', x: VERSO, y: 0.66, largura: 0.24, tamanho: 6 },
    ],
  },
  {
    id: 'fotos-quatro', panda: 0.5, categoria: 'fotos', nome: 'Quatro fotos',
    descricao: 'Quatro fotos dando a volta, com uma frase curta',
    fundo: '--paper', semente: 126,
    enfeites: { formas: ['bolinha'], cores: ['--sand', '--peach'], quantidade: 22, tamanho: [2.5, 5] },
    fotos: [
      { id: 'a', rotulo: 'Foto 1', forma: 'arredondado', x: 0.125, y: 0.42, largura: 0.20, altura: 0.60 },
      { id: 'b', rotulo: 'Foto 2', forma: 'arredondado', x: 0.375, y: 0.42, largura: 0.20, altura: 0.60 },
      { id: 'c', rotulo: 'Foto 3', forma: 'arredondado', x: 0.625, y: 0.42, largura: 0.20, altura: 0.60 },
      { id: 'd', rotulo: 'Foto 4', forma: 'arredondado', x: 0.875, y: 0.42, largura: 0.20, altura: 0.60 },
    ],
    textos: [
      { id: 'principal', rotulo: 'Frase de baixo', valor: 'a gente junto', max: 22, fonte: 'Caveat', cor: '--hand-ink', x: 0.125, y: 0.86, largura: 0.22, tamanho: 8, repetir: [0.125, 0.375, 0.625, 0.875] },
    ],
  },
  {
    id: 'fotos-tira', panda: 0.5, categoria: 'fotos', nome: 'Tira de fotos',
    descricao: 'Seis fotos pequenas em duas fileiras, como uma tira de fotos',
    fundo: '--cream', semente: 147,
    enfeites: { formas: ['bolinha'], cores: ['--sand'], quantidade: 14, tamanho: [2, 4] },
    fotos: [
      { id: 'a', rotulo: 'Foto 1 (de cima)', forma: 'arredondado', x: 0.18, y: 0.29, largura: 0.20, altura: 0.40 },
      { id: 'b', rotulo: 'Foto 2 (de cima)', forma: 'arredondado', x: 0.50, y: 0.29, largura: 0.20, altura: 0.40 },
      { id: 'c', rotulo: 'Foto 3 (de cima)', forma: 'arredondado', x: 0.82, y: 0.29, largura: 0.20, altura: 0.40 },
      { id: 'd', rotulo: 'Foto 4 (de baixo)', forma: 'arredondado', x: 0.18, y: 0.73, largura: 0.20, altura: 0.40 },
      { id: 'e', rotulo: 'Foto 5 (de baixo)', forma: 'arredondado', x: 0.50, y: 0.73, largura: 0.20, altura: 0.40 },
      { id: 'f', rotulo: 'Foto 6 (de baixo)', forma: 'arredondado', x: 0.82, y: 0.73, largura: 0.20, altura: 0.40 },
    ],
    textos: [],
  },
];

export const TEMPLATES = Object.freeze(MODELOS.map((m) => Object.freeze({
  ...m,
  fotos: Object.freeze(m.fotos.map((f) => Object.freeze({ ...f }))),
  textos: Object.freeze(m.textos.map((t) => Object.freeze({ ...t }))),
})));

export const modeloPorId = (id) => TEMPLATES.find((m) => m.id === id) || null;
export const modelosDaCategoria = (categoria) =>
  (!categoria || categoria === 'todos' ? TEMPLATES : TEMPLATES.filter((m) => m.categoria === categoria));

/** Retângulos em mm de cada espaço de foto e de cada frase, dentro da área de impressão. */
export function geometriaDoModelo(modelo, printArea) {
  const caixa = (item, largura, altura) => ({
    x: printArea.x + (item.x - largura / 2) * printArea.width,
    y: printArea.y + (item.y - altura / 2) * printArea.height,
    width: largura * printArea.width,
    height: altura * printArea.height,
  });
  return {
    fotos: modelo.fotos.map((foto) => ({ ...foto, caixa: caixa(foto, foto.largura, foto.altura) })),
    textos: modelo.textos.map((texto) => ({
      ...texto,
      posicoes: (texto.repetir || [texto.x]).map((x) => ({
        x: printArea.x + x * printArea.width,
        y: printArea.y + texto.y * printArea.height,
        largura: texto.largura * printArea.width,
      })),
    })),
  };
}

function caminhoDaForma(ctx, forma, caixa) {
  const { x, y, width: w, height: h } = caixa;
  ctx.beginPath();
  if (forma === 'circulo') {
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  } else if (forma === 'coracao') {
    const cx = x + w / 2, topo = y + h * 0.28;
    ctx.moveTo(cx, y + h);
    ctx.bezierCurveTo(x - w * 0.10, y + h * 0.52, x + w * 0.08, y - h * 0.10, cx, topo);
    ctx.bezierCurveTo(x + w * 0.92, y - h * 0.10, x + w * 1.10, y + h * 0.52, cx, y + h);
  } else {
    const r = Math.min(w, h) * (forma === 'arredondado' ? 0.16 : 0.02);
    ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
  }
  ctx.closePath();
}

function desenhaFotoNoEspaco(ctx, espaco, foto) {
  const caixa = espaco.caixa;
  ctx.save();
  caminhoDaForma(ctx, espaco.forma, caixa);
  ctx.clip();
  const larguraPx = foto.image.naturalWidth || foto.image.width;
  const alturaPx = foto.image.naturalHeight || foto.image.height;
  if (larguraPx && alturaPx) {
    // Cobre o espaço inteiro (sem esticar) e aceita o ajuste de quem está montando.
    const escala = Math.max(caixa.width / larguraPx, caixa.height / alturaPx) * (foto.scale || 1);
    const w = larguraPx * escala, h = alturaPx * escala;
    ctx.translate(caixa.x + caixa.width / 2 + (foto.offsetX || 0) * caixa.width / 2,
      caixa.y + caixa.height / 2 + (foto.offsetY || 0) * caixa.height / 2);
    ctx.rotate((foto.rotation || 0) * Math.PI / 180);
    ctx.drawImage(foto.image, -w / 2, -h / 2, w, h);
  }
  ctx.restore();
}

function desenhaEspacoVazio(ctx, espaco) {
  const caixa = espaco.caixa;
  ctx.save();
  ctx.fillStyle = cor('--sand-soft');
  caminhoDaForma(ctx, espaco.forma, caixa);
  ctx.fill();
  ctx.strokeStyle = cor('--kraft');
  ctx.lineWidth = 0.6;
  ctx.setLineDash([2.2, 2.2]);
  ctx.stroke();
  ctx.restore();
}

function ajustaFonte(ctx, texto, fonte, tamanho, largura) {
  let corpo = tamanho;
  ctx.font = `600 ${corpo}px "${fonte}"`;
  const medida = ctx.measureText(texto).width;
  if (medida > largura) {
    corpo *= largura / medida;
    ctx.font = `600 ${corpo}px "${fonte}"`;
  }
  return corpo;
}

/**
 * Desenha o modelo dentro da área de impressão, em milímetros.
 * @param {CanvasRenderingContext2D} ctx já transformado para milímetros e recortado na área
 * @param {object} modelo item de TEMPLATES
 * @param {{x:number,y:number,width:number,height:number}} printArea área útil em mm
 * @param {{textos?:Object, fotos?:Object, placeholder?:boolean, pandaImage?:CanvasImageSource}} dados
 */
export function desenhaModelo(ctx, modelo, printArea, dados = {}) {
  const geometria = geometriaDoModelo(modelo, printArea);
  ctx.save();
  ctx.fillStyle = cor(modelo.fundo);
  ctx.fillRect(printArea.x, printArea.y, printArea.width, printArea.height);

  // Enfeites: sempre no mesmo lugar, longe das fotos e das frases.
  const reservados = [
    ...geometria.fotos.map((f) => f.caixa),
    ...geometria.textos.flatMap((t) => t.posicoes.map((p) => ({
      x: p.x - p.largura / 2, y: p.y - t.tamanho * 0.8, width: p.largura, height: t.tamanho * 1.7,
    }))),
  ];
  const conf = modelo.enfeites;
  if (conf?.quantidade) {
    const aleatorio = sorteio(modelo.semente || 1);
    const folga = 1.5;
    for (let i = 0, postos = 0; i < conf.quantidade * 6 && postos < conf.quantidade; i += 1) {
      const t = conf.tamanho[0] + aleatorio() * (conf.tamanho[1] - conf.tamanho[0]);
      const px = printArea.x + aleatorio() * printArea.width;
      const py = printArea.y + aleatorio() * printArea.height;
      const colide = reservados.some((r) => px + t / 2 + folga > r.x && px - t / 2 - folga < r.x + r.width
        && py + t / 2 + folga > r.y && py - t / 2 - folga < r.y + r.height);
      if (colide) continue;
      postos += 1;
      const forma = conf.formas[Math.floor(aleatorio() * conf.formas.length)];
      const tinta = cor(conf.cores[Math.floor(aleatorio() * conf.cores.length)]);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate((aleatorio() - 0.5) * 0.9);
      ctx.globalAlpha = 0.55 + aleatorio() * 0.45;
      if (CONTORNO.has(forma)) {
        ctx.strokeStyle = tinta;
        ctx.lineWidth = Math.max(0.35, t * 0.07);
        ctx.lineCap = 'round';
        FORMAS[forma](ctx, t);
        ctx.stroke();
      } else {
        ctx.fillStyle = tinta;
        FORMAS[forma](ctx, t);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Fotos: moldura clara por baixo, imagem recortada na forma, contorno por cima.
  for (const espaco of geometria.fotos) {
    const foto = dados.fotos?.[espaco.id];
    if (foto?.image) {
      ctx.save();
      ctx.fillStyle = cor('--white');
      caminhoDaForma(ctx, espaco.forma, espaco.caixa);
      ctx.fill();
      ctx.restore();
      desenhaFotoNoEspaco(ctx, espaco, foto);
      ctx.save();
      ctx.strokeStyle = cor('--white');
      ctx.lineWidth = 1.1;
      caminhoDaForma(ctx, espaco.forma, espaco.caixa);
      ctx.stroke();
      ctx.restore();
    } else if (dados.placeholder !== false) {
      desenhaEspacoVazio(ctx, espaco);
    }
  }

  // Frases.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const texto of geometria.textos) {
    const valor = (dados.textos?.[texto.id] ?? texto.valor ?? '').trim();
    if (!valor) continue;
    ctx.fillStyle = cor(texto.cor);
    for (const posicao of texto.posicoes) {
      ajustaFonte(ctx, valor, texto.fonte, texto.tamanho, posicao.largura);
      ctx.fillText(valor, posicao.x, posicao.y);
    }
  }

  // Um Pandinha por peça (manual 6.4), inteiro e num lugar livre: ele acompanha, não atrapalha.
  if (dados.pandaImage) {
    const lado = Math.min(13, printArea.height * 0.17);
    const y = printArea.y + printArea.height - lado - 1.5;
    const candidatos = [modelo.panda, 0.5, 0.31, 0.69, 0.06, 0.94].filter((v) => typeof v === 'number');
    const livre = candidatos.find((fracao) => {
      const x = printArea.x + fracao * printArea.width - lado / 2;
      return !reservados.some((r) => x + lado > r.x && x < r.x + r.width && y + lado > r.y && y < r.y + r.height);
    });
    // Sem espaço livre, ele fica de fora: melhor sem Pandinha do que cortando uma foto.
    if (livre !== undefined) ctx.drawImage(dados.pandaImage, printArea.x + livre * printArea.width - lado / 2, y, lado, lado);
  }
  ctx.restore();
  return geometria;
}
