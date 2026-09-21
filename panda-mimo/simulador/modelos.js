/**
 * Arte da caneca em camadas: fotos, frases, enfeites e o Pandinha, livres na volta inteira.
 *
 * Toda medida é fração da área de impressão (210 × 90 mm), então o mesmo desenho serve para a
 * prévia 3D, para a vista aberta e para o arquivo de 300 dpi, sem recalcular nada.
 * x=0 é a borda esquerda da área (junto da alça) e x=1 a direita; y=0 é o topo.
 * A frente da caneca fica em x≈0,193 e o verso em x≈0,807 (marcas de dobra da arte aberta).
 *
 * Um modelo é só um conjunto inicial de camadas: depois de escolhido, tudo nele pode ser movido,
 * reescrito, trocado de cor, duplicado ou apagado, e camadas novas podem entrar.
 *
 * Cores saem da paleta da marca (manual, seção 7). Os valores abaixo são o valor de reserva usado
 * quando não há CSS (testes em Node); na página, cada token é lido de styles.css.
 */

// Onde a frente (u=.25) e o verso (u=.75) caem dentro da área de impressão da caneca padrão:
// a volta tem PI*82 mm e a área impressa, 210 mm centrados nela.
import { pesoDaFonte } from './fontes.js';
import { cor } from './paleta.js';
import { foto, frase, panda } from './camadas.js';
import { CATEGORIAS_DE_COLECAO, MODELOS_DE_COLECAO, proporcaoDaForma, desenhaIlustracaoDeColecao } from './colecoes.js';

const VOLTA_MM = Math.PI * 82, AREA_MM = 210;
export const FRENTE = (0.25 * VOLTA_MM - (VOLTA_MM - AREA_MM) / 2) / AREA_MM;
export const VERSO = 1 - FRENTE;

export { cor } from './paleta.js';

/** Cores que a pessoa escolhe para uma frase ou um enfeite: só a paleta, só o que se lê na cerâmica. */
export const CORES_DE_ARTE = Object.freeze([
  { token: '--ink', nome: 'Nanquim' },
  { token: '--peach-ink', nome: 'Pêssego escuro' },
  { token: '--hand-ink', nome: 'Pêssego' },
  { token: '--peach', nome: 'Pêssego claro' },
  { token: '--sage-deep', nome: 'Sálvia escura' },
  { token: '--sage', nome: 'Sálvia' },
  { token: '--kraft', nome: 'Kraft' },
  { token: '--sand', nome: 'Areia' },
]);

export const FORMAS_DE_FOTO = Object.freeze([
  { valor: 'arredondado', nome: 'Quadro' },
  { valor: 'circulo', nome: 'Círculo' },
  { valor: 'coracao', nome: 'Coração' },
  { valor: 'retangulo', nome: 'Reto' },
]);

/**
 * As ocasiões vêm agrupadas: o seletor do site monta um grupo por vez, então a lista pode
 * crescer sem virar uma parede de botões.
 */
export const CATEGORIAS = Object.freeze([
  { id: 'livre', grupo: 'Sua arte', nome: 'Sem modelo', descricao: 'Sua arte pronta, do jeito que você fez' },
  { id: 'natal', grupo: 'Datas comemorativas', nome: 'Natal', descricao: 'Fim de ano e amigo secreto' },
  { id: 'maes', grupo: 'Datas comemorativas', nome: 'Dia das Mães', descricao: 'Pra mãe, a avó, a madrinha' },
  { id: 'pais', grupo: 'Datas comemorativas', nome: 'Dia dos Pais', descricao: 'Pro pai, o avô, o padrinho' },
  { id: 'namorados', grupo: 'Datas comemorativas', nome: 'Namorados', descricao: 'Aniversário de namoro e Dia dos Namorados' },
  { id: 'professores', grupo: 'Datas comemorativas', nome: 'Professores', descricao: 'Fim de ano letivo e Dia dos Professores' },
  { id: 'aniversario', grupo: 'Momentos', nome: 'Aniversário', descricao: 'Parabéns com foto e idade' },
  { id: 'bebe', grupo: 'Bebê e maternidade', nome: 'Chegada do bebê', descricao: 'A chegada, o nome e os pezinhos' },
  { id: 'casamento', grupo: 'Convites e agradecimentos', nome: 'Padrinhos de casamento', descricao: 'Convite de padrinhos e lembrança dos noivos' },
  { id: 'amizade', grupo: 'Momentos', nome: 'Amizade e formatura', descricao: 'Amiga, turma, time do trabalho' },
  { id: 'pet', grupo: 'Pets e bichinhos', nome: 'Várias fotos do pet', descricao: 'Três fotos do bichinho e o nome' },
  ...CATEGORIAS_DE_COLECAO,
  { id: 'fotos', grupo: 'Do dia a dia', nome: 'Só fotos', descricao: 'Várias fotos ao redor, sem data' },
]);

/*
  A ordem dos grupos no seletor, decidida a mão: primeiro a data que a pessoa veio procurar, depois
  o momento, depois o gosto de quem vai ganhar, e por último o dia a dia. Grupo novo entra aqui;
  o que ficar de fora cai no fim, mas o teste avisa para não esquecer.
*/
export const ORDEM_DOS_GRUPOS = Object.freeze([
  'Datas comemorativas',
  'Momentos',
  'Bebê e maternidade',
  'Convites e agradecimentos',
  'Pets e bichinhos',
  'Esportes e movimento',
  'Do dia a dia',
]);

/** Os grupos na ordem do seletor, cada um com as suas categorias. */
export function gruposDeCategorias() {
  const porGrupo = new Map();
  for (const item of CATEGORIAS) {
    if (item.id === 'livre') continue;
    if (!porGrupo.has(item.grupo)) porGrupo.set(item.grupo, []);
    porGrupo.get(item.grupo).push(item);
  }
  const ordenados = [...porGrupo.keys()].sort((a, b) => {
    const ia = ORDEM_DOS_GRUPOS.indexOf(a), ib = ORDEM_DOS_GRUPOS.indexOf(b);
    return (ia < 0 ? ORDEM_DOS_GRUPOS.length : ia) - (ib < 0 ? ORDEM_DOS_GRUPOS.length : ib);
  });
  return ordenados.map((nome) => [nome, porGrupo.get(nome)]);
}

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
  pata(ctx, t) {
    ctx.beginPath();
    ctx.ellipse(0, t * 0.16, t * 0.26, t * 0.22, 0, 0, Math.PI * 2);
    for (const [dx, dy, r, giro] of [[-0.26, -0.16, 0.11, -0.4], [-0.09, -0.3, 0.1, -0.15], [0.09, -0.3, 0.1, 0.15], [0.26, -0.16, 0.11, 0.4]]) {
      ctx.moveTo((dx + r) * t, dy * t);
      ctx.ellipse(dx * t, dy * t, r * t, r * t * 1.25, giro, 0, Math.PI * 2);
    }
    ctx.closePath();
  },
  xicara(ctx, t) {
    ctx.beginPath();
    ctx.moveTo(-t * 0.3, -t * 0.22);
    ctx.lineTo(t * 0.22, -t * 0.22);
    ctx.lineTo(t * 0.16, t * 0.3);
    ctx.quadraticCurveTo(-t * 0.07, t * 0.38, -t * 0.24, t * 0.3);
    ctx.closePath();
    ctx.moveTo(t * 0.22, -t * 0.12);
    ctx.quadraticCurveTo(t * 0.46, -t * 0.02, t * 0.19, t * 0.12);
    ctx.lineTo(t * 0.2, t * 0.02);
    ctx.quadraticCurveTo(t * 0.34, -t * 0.02, t * 0.21, -t * 0.06);
    ctx.closePath();
  },
};
const CONTORNO = new Set(['floco']);

/** Enfeites que a pessoa pode acrescentar, na ordem em que aparecem no painel. */
export const ENFEITES = Object.freeze([
  { forma: 'coracao', nome: 'Coração' },
  { forma: 'flor', nome: 'Flor' },
  { forma: 'estrela', nome: 'Estrela' },
  { forma: 'bolinha', nome: 'Bolinha' },
  { forma: 'pata', nome: 'Patinha' },
  { forma: 'floco', nome: 'Floco de neve' },
  { forma: 'confete', nome: 'Confete' },
  { forma: 'folha', nome: 'Folha' },
  { forma: 'xicara', nome: 'Xícara' },
]);

/** Desenha um enfeite solto (miniatura do painel, por exemplo), já centrado. */
export function desenhaForma(ctx, forma, tamanho, tinta) {
  if (desenhaIlustracaoDeColecao(ctx, forma, tamanho, tinta)) return;
  const desenha = FORMAS[forma] || FORMAS.coracao;
  if (CONTORNO.has(forma)) {
    ctx.strokeStyle = tinta;
    ctx.lineWidth = Math.max(0.35, tamanho * 0.07);
    ctx.lineCap = 'round';
    desenha(ctx, tamanho);
    ctx.stroke();
  } else {
    ctx.fillStyle = tinta;
    desenha(ctx, tamanho);
    ctx.fill();
  }
}

/**
 * Elementos do acervo da marca que entram na arte de quem monta: são as mesmas ilustrações do
 * site, com fundo transparente (manual 9). Nenhum deles tem texto ou logo: o que leva palavra
 * é composto no editor, com as letras da biblioteca.
 */
export const ELEMENTOS = Object.freeze([
  { arquivo: 'assets/coracao-costura.webp', nome: 'Coração de costura' },
  { arquivo: 'assets/laco.webp', nome: 'Laço' },
  { arquivo: 'assets/flor-nitida.webp', nome: 'Margarida' },
  { arquivo: 'assets/folha.webp', nome: 'Folhinha' },
  { arquivo: 'assets/pata-rosa.webp', nome: 'Patinha rosa' },
  { arquivo: 'assets/pata-preta.webp', nome: 'Patinha preta' },
  { arquivo: 'assets/sino.webp', nome: 'Sininho' },
  { arquivo: 'assets/ic-presente.webp', nome: 'Presente' },
]);

/** Tratamentos de foto: o mesmo filtro vale na prévia e no arquivo de impressão. */
export const FILTROS = Object.freeze([
  { valor: 'nenhum', nome: 'Como está', css: 'none' },
  { valor: 'pb', nome: 'Preto e branco', css: 'grayscale(1)' },
  { valor: 'sepia', nome: 'Sépia', css: 'sepia(0.75) saturate(1.2)' },
  { valor: 'claro', nome: 'Mais clara', css: 'brightness(1.16) saturate(0.96)' },
  { valor: 'escuro', nome: 'Mais escura', css: 'brightness(0.86)' },
  { valor: 'contraste', nome: 'Mais contraste', css: 'contrast(1.28) saturate(1.08)' },
  { valor: 'suave', nome: 'Desbotada', css: 'saturate(0.55) brightness(1.06)' },
]);

const filtroCss = (valor) => FILTROS.find((f) => f.valor === valor)?.css || 'none';

/**
 * Poses do Pandinha adesivo já aprovadas no acervo (manual 6.3). O 3D de cena (6.5) não entra
 * em peça de cliente, e vale sempre um Pandinha por caneca (6.4).
 */
export const ADESIVOS = Object.freeze([
  { arquivo: 'assets/panda-coracao.webp', nome: 'Abraçando um coração' },
  { arquivo: 'assets/panda-joinha.webp', nome: 'Fazendo joinha' },
  { arquivo: 'assets/panda-presente.webp', nome: 'Com um presente' },
  { arquivo: 'assets/panda-presente-2.webp', nome: 'Abrindo o presente' },
  { arquivo: 'assets/panda-caixa.webp', nome: 'Dentro da caixa' },
  { arquivo: 'assets/panda-carrinho.webp', nome: 'No carrinho' },
  { arquivo: 'assets/panda-copo.webp', nome: 'Com o copo' },
  { arquivo: 'assets/panda-dormindo.webp', nome: 'Dormindo' },
  { arquivo: 'assets/panda-carinha.webp', nome: 'Só a carinha' },
]);

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

/* Atalhos para escrever os modelos sem repetição. */

const MODELOS = [
  {
    id: 'namorados-coracoes', categoria: 'namorados', nome: 'Corações ao redor',
    descricao: 'Duas fotos e uma frase, com corações em toda a volta',
    fundo: '--paper', semente: 12,
    enfeites: { formas: ['coracao', 'bolinha'], cores: ['--peach', '--peach-deep', '--sand'], quantidade: 46, tamanho: [3.5, 9] },
    camadas: [
      foto('a', 'Foto da frente', 'coracao', FRENTE, 0.44, 0.30, 0.72),
      foto('b', 'Foto do verso', 'coracao', VERSO, 0.44, 0.30, 0.72),
      frase('principal', 'Frase do meio', 'a gente combina', 0.5, 0.42, 13, { largura: 0.2 }),
      frase('data', 'Data ou nome', 'desde 2019', 0.5, 0.62, 6, { largura: 0.18, fonte: 'Fredoka', cor: '--ink' }),
      panda(0.5, 0.88, 0.16),
    ],
  },
  {
    id: 'namorados-momentos', categoria: 'namorados', nome: 'Nossos momentos',
    descricao: 'Três fotos em fila com uma frase embaixo',
    fundo: '--cream', semente: 27,
    enfeites: { formas: ['coracao'], cores: ['--peach', '--sand'], quantidade: 26, tamanho: [3, 6.5] },
    camadas: [
      foto('a', 'Primeira foto', 'arredondado', FRENTE, 0.40, 0.26, 0.60),
      foto('b', 'Segunda foto', 'arredondado', 0.5, 0.40, 0.26, 0.60),
      foto('c', 'Terceira foto', 'arredondado', VERSO, 0.40, 0.26, 0.60),
      frase('f1', 'Frase da primeira', 'nossos momentos', FRENTE, 0.85, 9, { largura: 0.26, grupo: 'legenda' }),
      frase('f2', 'Frase da segunda', 'nossos momentos', 0.5, 0.85, 9, { largura: 0.26, grupo: 'legenda' }),
      frase('f3', 'Frase da terceira', 'nossos momentos', VERSO, 0.85, 9, { largura: 0.26, grupo: 'legenda' }),
      panda(0.345, 0.86, 0.14),
    ],
  },
  {
    id: 'aniversario-confete', categoria: 'aniversario', nome: 'Chuva de confete',
    descricao: 'Uma foto grande, nome e idade, com confete na volta toda',
    fundo: '--paper', semente: 41,
    enfeites: { formas: ['confete', 'bolinha', 'estrela'], cores: ['--peach', '--sage', '--kraft', '--peach-deep'], quantidade: 58, tamanho: [3, 8] },
    camadas: [
      foto('a', 'Foto do aniversariante', 'circulo', FRENTE, 0.46, 0.28, 0.68),
      frase('principal', 'Parabéns para', 'Parabéns, Malu!', VERSO, 0.40, 13, { largura: 0.3 }),
      frase('idade', 'Idade ou data', '25 anos', VERSO, 0.64, 7, { largura: 0.22, fonte: 'Fredoka', cor: '--ink' }),
      panda(0.5, 0.86, 0.16, 'assets/panda-presente.webp'),
    ],
  },
  {
    id: 'natal-flocos', categoria: 'natal', nome: 'Feliz Natal',
    descricao: 'Duas fotos, flocos de neve e o recado de fim de ano',
    fundo: '--cream', semente: 63,
    enfeites: { formas: ['floco', 'bolinha'], cores: ['--sage-deep', '--peach', '--kraft'], quantidade: 44, tamanho: [4, 9] },
    camadas: [
      foto('a', 'Foto da frente', 'circulo', FRENTE, 0.45, 0.26, 0.64),
      foto('b', 'Foto do verso', 'circulo', VERSO, 0.45, 0.26, 0.64),
      frase('principal', 'Frase do meio', 'Feliz Natal', 0.5, 0.40, 13, { largura: 0.2, cor: '--sage-deep' }),
      frase('assinatura', 'Assinatura', 'da nossa família pra sua', 0.5, 0.63, 5, { largura: 0.22, fonte: 'Fredoka', cor: '--ink' }),
      panda(0.5, 0.86, 0.15),
    ],
  },
  {
    id: 'maes-flores', categoria: 'maes', nome: 'Pra melhor mãe',
    descricao: 'Uma foto em coração, flores na volta e duas frases',
    fundo: '--paper', semente: 84,
    enfeites: { formas: ['flor', 'folha', 'bolinha'], cores: ['--peach', '--sage', '--sand'], quantidade: 48, tamanho: [4, 10] },
    camadas: [
      foto('a', 'Foto com a mãe', 'coracao', FRENTE, 0.45, 0.30, 0.72),
      frase('principal', 'Frase principal', 'melhor mãe do mundo', VERSO, 0.42, 12, { largura: 0.3 }),
      frase('assinatura', 'Assinatura', 'te amo, mãe', VERSO, 0.66, 6, { largura: 0.22, fonte: 'Fredoka', cor: '--ink' }),
      panda(0.5, 0.86, 0.15),
    ],
  },
  {
    id: 'pais-melhor', categoria: 'pais', nome: 'Pro melhor pai',
    descricao: 'Uma foto quadrada, frase grande e assinatura',
    fundo: '--cream', semente: 105,
    enfeites: { formas: ['estrela', 'bolinha'], cores: ['--kraft', '--sand', '--sage'], quantidade: 36, tamanho: [3.5, 8] },
    camadas: [
      foto('a', 'Foto com o pai', 'arredondado', FRENTE, 0.45, 0.27, 0.66),
      frase('principal', 'Frase principal', 'melhor pai do mundo', VERSO, 0.42, 12, { largura: 0.3, cor: '--peach-ink' }),
      frase('assinatura', 'Assinatura', 'obrigado por tudo', VERSO, 0.66, 6, { largura: 0.24, fonte: 'Fredoka', cor: '--ink' }),
      panda(0.5, 0.86, 0.15, 'assets/panda-joinha.webp'),
    ],
  },
  {
    id: 'professores-obrigado', categoria: 'professores', nome: 'Pra quem ensina',
    descricao: 'Uma foto da turma, frase de agradecimento e o nome',
    fundo: '--paper', semente: 126,
    enfeites: { formas: ['estrela', 'bolinha', 'folha'], cores: ['--sage', '--peach', '--kraft'], quantidade: 40, tamanho: [3.5, 8] },
    camadas: [
      foto('a', 'Foto da turma', 'arredondado', FRENTE, 0.45, 0.28, 0.66),
      frase('principal', 'Frase principal', 'obrigada por ensinar', VERSO, 0.40, 11, { largura: 0.3, cor: '--sage-deep' }),
      frase('assinatura', 'Nome ou turma', 'Turma do 3º ano', VERSO, 0.64, 6, { largura: 0.24, fonte: 'Fredoka', cor: '--ink' }),
      panda(0.5, 0.86, 0.15),
    ],
  },
  {
    id: 'casamento-padrinhos', categoria: 'casamento', nome: 'Convite de padrinhos',
    descricao: 'A pergunta na frente, a foto no verso e a data',
    fundo: '--cream', semente: 147,
    enfeites: { formas: ['flor', 'folha', 'coracao'], cores: ['--sage', '--peach', '--sand'], quantidade: 42, tamanho: [4, 9] },
    camadas: [
      frase('convite', 'A pergunta', 'você aceita ser meu padrinho?', FRENTE, 0.38, 9, { largura: 0.3 }),
      frase('nomes', 'Nomes dos noivos', 'Ana & Léo', FRENTE, 0.62, 7, { largura: 0.22, fonte: 'Fredoka', cor: '--ink' }),
      foto('a', 'Foto dos noivos', 'circulo', VERSO, 0.44, 0.26, 0.64),
      frase('data', 'Data do casamento', '12 · 09 · 2027', VERSO, 0.87, 5, { largura: 0.22, fonte: 'Fredoka', cor: '--ink' }),
      panda(0.5, 0.86, 0.15),
    ],
  },
  {
    id: 'bebe-chegada', categoria: 'bebe', nome: 'Chegou gente nova',
    descricao: 'Foto do bebê, nome e a data de chegada',
    fundo: '--paper', semente: 168,
    enfeites: { formas: ['bolinha', 'estrela', 'coracao'], cores: ['--sage', '--peach', '--sand'], quantidade: 44, tamanho: [3, 7] },
    camadas: [
      foto('a', 'Foto do bebê', 'circulo', FRENTE, 0.45, 0.26, 0.64),
      frase('principal', 'Nome do bebê', 'Theo chegou!', VERSO, 0.40, 12, { largura: 0.28, cor: '--sage-deep' }),
      frase('data', 'Data ou peso', '14 de março de 2027', VERSO, 0.64, 5.5, { largura: 0.26, fonte: 'Fredoka', cor: '--ink' }),
      panda(0.5, 0.86, 0.15, 'assets/panda-dormindo.webp'),
    ],
  },
  {
    id: 'pet-amor', categoria: 'pet', nome: 'Meu melhor amigo',
    descricao: 'Três fotos do bichinho, patinhas na volta e o nome',
    fundo: '--cream', semente: 189,
    enfeites: { formas: ['pata', 'coracao', 'bolinha'], cores: ['--kraft', '--peach', '--sand'], quantidade: 40, tamanho: [3.5, 8] },
    camadas: [
      foto('a', 'Foto 1', 'circulo', 0.18, 0.42, 0.20, 0.56),
      foto('b', 'Foto 2', 'circulo', 0.5, 0.42, 0.20, 0.56),
      foto('c', 'Foto 3', 'circulo', 0.82, 0.42, 0.20, 0.56),
      frase('f1', 'Nome do pet', 'Nina', 0.18, 0.85, 8, { largura: 0.18, grupo: 'nome' }),
      frase('f2', 'Nome do pet (meio)', 'Nina', 0.5, 0.85, 8, { largura: 0.18, grupo: 'nome' }),
      frase('f3', 'Nome do pet (fim)', 'Nina', 0.82, 0.85, 8, { largura: 0.18, grupo: 'nome' }),
      panda(0.34, 0.85, 0.13),
    ],
  },
  {
    id: 'amizade-formatura', categoria: 'amizade', nome: 'A gente conseguiu',
    descricao: 'Quatro fotos da turma e uma frase de comemoração',
    fundo: '--paper', semente: 210,
    enfeites: { formas: ['estrela', 'confete', 'bolinha'], cores: ['--peach', '--sage', '--kraft'], quantidade: 50, tamanho: [3, 7.5] },
    camadas: [
      foto('a', 'Foto 1', 'arredondado', 0.125, 0.40, 0.19, 0.56),
      foto('b', 'Foto 2', 'arredondado', 0.375, 0.40, 0.19, 0.56),
      foto('c', 'Foto 3', 'arredondado', 0.625, 0.40, 0.19, 0.56),
      foto('d', 'Foto 4', 'arredondado', 0.875, 0.40, 0.19, 0.56),
      frase('f1', 'Frase 1', 'a gente conseguiu', 0.25, 0.84, 8, { largura: 0.22, grupo: 'legenda' }),
      frase('f2', 'Frase 2', 'a gente conseguiu', 0.75, 0.84, 8, { largura: 0.22, grupo: 'legenda' }),
      panda(0.5, 0.84, 0.14),
    ],
  },
  {
    id: 'fotos-quatro', categoria: 'fotos', nome: 'Quatro fotos',
    descricao: 'Quatro fotos dando a volta, com uma frase curta',
    fundo: '--paper', semente: 231,
    enfeites: { formas: ['bolinha'], cores: ['--sand', '--peach'], quantidade: 22, tamanho: [2.5, 5] },
    camadas: [
      foto('a', 'Foto 1', 'arredondado', 0.125, 0.42, 0.20, 0.60),
      foto('b', 'Foto 2', 'arredondado', 0.375, 0.42, 0.20, 0.60),
      foto('c', 'Foto 3', 'arredondado', 0.625, 0.42, 0.20, 0.60),
      foto('d', 'Foto 4', 'arredondado', 0.875, 0.42, 0.20, 0.60),
      frase('f1', 'Frase 1', 'a gente junto', 0.125, 0.86, 8, { largura: 0.2, grupo: 'legenda' }),
      frase('f2', 'Frase 2', 'a gente junto', 0.375, 0.86, 8, { largura: 0.2, grupo: 'legenda' }),
      frase('f3', 'Frase 3', 'a gente junto', 0.625, 0.86, 8, { largura: 0.2, grupo: 'legenda' }),
      frase('f4', 'Frase 4', 'a gente junto', 0.875, 0.86, 8, { largura: 0.2, grupo: 'legenda' }),
    ],
  },
  {
    id: 'fotos-tira', categoria: 'fotos', nome: 'Tira de fotos',
    descricao: 'Seis fotos pequenas em duas fileiras, como uma tira de fotos',
    fundo: '--cream', semente: 252,
    enfeites: { formas: ['bolinha'], cores: ['--sand'], quantidade: 14, tamanho: [2, 4] },
    camadas: [
      foto('a', 'Foto 1 (de cima)', 'arredondado', 0.18, 0.29, 0.20, 0.40),
      foto('b', 'Foto 2 (de cima)', 'arredondado', 0.50, 0.29, 0.20, 0.40),
      foto('c', 'Foto 3 (de cima)', 'arredondado', 0.82, 0.29, 0.20, 0.40),
      foto('d', 'Foto 4 (de baixo)', 'arredondado', 0.18, 0.73, 0.20, 0.40),
      foto('e', 'Foto 5 (de baixo)', 'arredondado', 0.50, 0.73, 0.20, 0.40),
      foto('f', 'Foto 6 (de baixo)', 'arredondado', 0.82, 0.73, 0.20, 0.40),
    ],
  },
  {
    id: 'cafe-do-dia', categoria: 'fotos', nome: 'Primeiro o café',
    descricao: 'Uma frase grande na frente e uma foto no verso',
    fundo: '--paper', semente: 273,
    enfeites: { formas: ['xicara', 'bolinha', 'coracao'], cores: ['--kraft', '--sand', '--peach'], quantidade: 36, tamanho: [3.5, 8] },
    camadas: [
      frase('principal', 'Frase principal', 'primeiro o café', FRENTE, 0.42, 14, { largura: 0.3, cor: '--peach-ink' }),
      frase('assinatura', 'Frase de baixo', 'depois a gente conversa', FRENTE, 0.68, 5.5, { largura: 0.26, fonte: 'Fredoka', cor: '--ink' }),
      foto('a', 'Foto do verso', 'circulo', VERSO, 0.45, 0.24, 0.60),
      panda(0.5, 0.86, 0.15, 'assets/panda-copo.webp'),
    ],
  },
];

export const TEMPLATES = Object.freeze([...MODELOS, ...MODELOS_DE_COLECAO].map((m) => Object.freeze({ ...m, camadas: Object.freeze(m.camadas) })));
export const modeloPorId = (id) => TEMPLATES.find((m) => m.id === id) || null;
export const modelosDaCategoria = (categoria) =>
  (!categoria || categoria === 'todos' ? TEMPLATES : TEMPLATES.filter((m) => m.categoria === categoria));

const clone = (valor) => (typeof structuredClone === 'function' ? structuredClone(valor) : JSON.parse(JSON.stringify(valor)));

/** Uma arte editável a partir de um modelo: daqui para a frente tudo nela pode mudar. */
export function novaArte(modelo) {
  return {
    modelo: modelo.id,
    fundo: modelo.fundo,
    semente: modelo.semente,
    enfeites: clone(modelo.enfeites || null),
    camadas: clone(modelo.camadas),
  };
}

export const ROTULOS = Object.freeze({ foto: 'Foto', frase: 'Frase', enfeite: 'Enfeite', adesivo: 'Pandinha', elemento: 'Elemento da marca' });

/** Retângulo da camada em milímetros, já sem rotação (a rotação entra no teste de clique). */
export function caixaDaCamada(camada, printArea, medidor) {
  const centroX = printArea.x + camada.x * printArea.width;
  let centroY = printArea.y + camada.y * printArea.height;
  let largura;
  let altura;
  if (camada.tipo === 'foto') {
    largura = camada.largura * printArea.width;
    altura = camada.altura * printArea.height;
  } else if (camada.tipo === 'frase') {
    const limite = camada.largura * printArea.width;
    const medida = medidor ? medidor(camada) : limite;
    largura = Math.max(2, Math.min(limite, medida));
    altura = camada.tamanho * 1.35;
    // Frase em arco ocupa outro pedaço da área: a corda é mais curta e a barriga da curva
    // desce (arco positivo) ou sobe (negativo). A caixa acompanha, senão as alças mentem.
    const arco = Number(camada.arco) || 0;
    if (Math.abs(arco) > 1) {
      const angulo = Math.abs(arco) * Math.PI / 180;
      const raio = largura / angulo;
      const barriga = raio * (1 - Math.cos(Math.min(angulo, Math.PI * 2) / 2));
      largura = Math.min(largura, 2 * raio * Math.sin(Math.min(angulo, Math.PI) / 2)) + camada.tamanho * 0.8;
      altura += barriga;
      centroY += (arco > 0 ? 1 : -1) * barriga / 2;
    }
  } else {
    largura = camada.tamanho * printArea.height;
    // Ilustração de coleção não é quadrada: a caixa acompanha a proporção do desenho.
    const proporcao = camada.tipo === 'enfeite' ? proporcaoDaForma(camada.forma) : null;
    altura = proporcao ? largura * proporcao : largura;
  }
  return { x: centroX - largura / 2, y: centroY - altura / 2, width: largura, height: altura, centroX, centroY };
}

/**
 * Os quatro cantos e o botão de girar de uma camada, em milímetros, já com a inclinação aplicada.
 * É o que a vista aberta desenha como alças e o que o dedo procura antes de mover a camada.
 */
export function alcasDaCamada(camada, printArea, medidor, folgaDoGiro = 6) {
  const caixa = caixaDaCamada(camada, printArea, medidor);
  const angulo = (camada.rotacao || 0) * Math.PI / 180;
  const cos = Math.cos(angulo), sin = Math.sin(angulo);
  const meiaLargura = caixa.width / 2, meiaAltura = caixa.height / 2;
  const ponto = (dx, dy) => ({ x: caixa.centroX + dx * cos - dy * sin, y: caixa.centroY + dx * sin + dy * cos });
  // O botão de girar fica acima; sem espaço lá em cima, ele passa para baixo.
  const cabeEmCima = caixa.centroY - meiaAltura - folgaDoGiro > printArea.y;
  return {
    caixa,
    cantos: [
      { id: 'no', ...ponto(-meiaLargura, -meiaAltura) },
      { id: 'ne', ...ponto(meiaLargura, -meiaAltura) },
      { id: 'se', ...ponto(meiaLargura, meiaAltura) },
      { id: 'so', ...ponto(-meiaLargura, meiaAltura) },
    ],
    giro: { id: 'giro', ...ponto(0, cabeEmCima ? -meiaAltura - folgaDoGiro : meiaAltura + folgaDoGiro), acima: cabeEmCima },
  };
}

/** Quem está debaixo do dedo: a camada mais de cima cujo retângulo (girado) contém o ponto. */
export function camadaEm(arte, ponto, printArea, medidor, folgaMm = 1.5) {
  for (let i = arte.camadas.length - 1; i >= 0; i -= 1) {
    const camada = arte.camadas[i];
    const caixa = caixaDaCamada(camada, printArea, medidor);
    const angulo = -(camada.rotacao || 0) * Math.PI / 180;
    const dx = ponto.x - caixa.centroX;
    const dy = ponto.y - caixa.centroY;
    const px = dx * Math.cos(angulo) - dy * Math.sin(angulo);
    const py = dx * Math.sin(angulo) + dy * Math.cos(angulo);
    if (Math.abs(px) <= caixa.width / 2 + folgaMm && Math.abs(py) <= caixa.height / 2 + folgaMm) return camada;
  }
  return null;
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
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
  }
  ctx.closePath();
}

function ajustaFonte(ctx, texto, fonte, tamanho, largura) {
  const peso = pesoDaFonte(fonte);
  let corpo = tamanho;
  ctx.font = `${peso} ${corpo}px "${fonte}"`;
  const medida = ctx.measureText(texto).width;
  if (medida > largura && medida > 0) {
    corpo *= largura / medida;
    ctx.font = `${peso} ${corpo}px "${fonte}"`;
  }
  return corpo;
}

/** O medidor usado no teste de clique: mesma conta de largura que o desenho faz. */
export function medidorDeTexto(ctx) {
  return (camada) => {
    ctx.font = `${pesoDaFonte(camada.fonte)} ${camada.tamanho}px "${camada.fonte}"`;
    return ctx.measureText(String(camada.texto ?? '')).width;
  };
}

function desenhaFoto(ctx, camada, caixa, foto) {
  ctx.save();
  ctx.translate(caixa.centroX, caixa.centroY);
  ctx.rotate((camada.rotacao || 0) * Math.PI / 180);
  ctx.translate(-caixa.centroX, -caixa.centroY);
  if (foto?.image) {
    ctx.save();
    ctx.fillStyle = cor('--white');
    caminhoDaForma(ctx, camada.forma, caixa);
    ctx.fill();
    ctx.restore();
    ctx.save();
    caminhoDaForma(ctx, camada.forma, caixa);
    ctx.clip();
    // O filtro é do desenho, não do arquivo: a foto original continua intacta na memória.
    if (camada.filtro && camada.filtro !== 'nenhum') ctx.filter = filtroCss(camada.filtro);
    const larguraPx = foto.image.naturalWidth || foto.image.width || foto.width;
    const alturaPx = foto.image.naturalHeight || foto.image.height || foto.height;
    if (larguraPx && alturaPx) {
      const ajuste = camada.ajuste || {};
      // Cobre o espaço inteiro (sem esticar) e aceita o enquadramento de quem está montando.
      const escala = Math.max(caixa.width / larguraPx, caixa.height / alturaPx) * (ajuste.scale || 1);
      const w = larguraPx * escala, h = alturaPx * escala;
      ctx.translate(caixa.centroX + (ajuste.offsetX || 0) * caixa.width / 2, caixa.centroY + (ajuste.offsetY || 0) * caixa.height / 2);
      ctx.drawImage(foto.image, -w / 2, -h / 2, w, h);
    }
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = cor('--white');
    ctx.lineWidth = 1.1;
    caminhoDaForma(ctx, camada.forma, caixa);
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.save();
    ctx.fillStyle = cor('--sand-soft');
    caminhoDaForma(ctx, camada.forma, caixa);
    ctx.fill();
    ctx.strokeStyle = cor('--kraft');
    ctx.lineWidth = 0.6;
    ctx.setLineDash([2.2, 2.2]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  ctx.restore();
}

function desenhaEnfeite(ctx, camada, caixa) {
  ctx.save();
  ctx.translate(caixa.centroX, caixa.centroY);
  ctx.rotate((camada.rotacao || 0) * Math.PI / 180);
  desenhaForma(ctx, camada.forma, caixa.width, cor(camada.cor));
  ctx.restore();
}

/**
 * Texto em arco: cada letra vai girada no seu pedaço da curva, como nas canecas de letreiro.
 * Arco positivo sobe (sorriso ao contrário), negativo desce. Arco zero desenha reto.
 */
function desenhaEmArco(ctx, texto, graus) {
  const angulo = Math.abs(graus) * Math.PI / 180;
  const letras = [...texto];
  const larguras = letras.map((letra) => ctx.measureText(letra).width);
  const total = larguras.reduce((soma, valor) => soma + valor, 0);
  if (!total) return;
  const raio = total / angulo;
  const paraCima = graus > 0;
  let percorrido = 0;
  for (let i = 0; i < letras.length; i += 1) {
    const meio = percorrido + larguras[i] / 2;
    const passo = (meio / total - 0.5) * angulo;
    percorrido += larguras[i];
    ctx.save();
    if (paraCima) {
      ctx.rotate(passo);
      ctx.translate(0, -raio);
    } else {
      ctx.rotate(-passo);
      ctx.translate(0, raio);
      ctx.rotate(Math.PI);
    }
    ctx.fillText(letras[i], 0, 0);
    ctx.restore();
  }
}

function desenhaFrase(ctx, camada, caixa, printArea) {
  const texto = String(camada.texto ?? '').trim();
  if (!texto) return;
  const arco = Number(camada.arco) || 0;
  // O texto nasce no ponto da camada; a caixa é que se desloca para abraçar a curva.
  const origemX = printArea.x + camada.x * printArea.width;
  const origemY = printArea.y + camada.y * printArea.height;
  ctx.save();
  ctx.translate(origemX, origemY);
  ctx.rotate((camada.rotacao || 0) * Math.PI / 180);
  ctx.fillStyle = cor(camada.cor);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ajustaFonte(ctx, texto, camada.fonte, camada.tamanho, camada.largura * printArea.width);
  if (Math.abs(arco) > 1) {
    // O centro do arco fica onde estava o meio do texto: a frase cresce para fora dali.
    const raio = ctx.measureText(texto).width / (Math.abs(arco) * Math.PI / 180);
    ctx.translate(0, arco > 0 ? raio : -raio);
    desenhaEmArco(ctx, texto, arco);
  } else {
    ctx.fillText(texto, 0, 0);
  }
  ctx.restore();
}

function desenhaAdesivo(ctx, camada, caixa, imagem) {
  if (!imagem) return;
  ctx.save();
  ctx.translate(caixa.centroX, caixa.centroY);
  ctx.rotate((camada.rotacao || 0) * Math.PI / 180);
  const largura = caixa.width;
  const proporcao = (imagem.naturalHeight || imagem.height || 1) / (imagem.naturalWidth || imagem.width || 1);
  const altura = largura * proporcao;
  ctx.drawImage(imagem, -largura / 2, -altura / 2, largura, altura);
  ctx.restore();
}

/**
 * Desenha a arte inteira dentro da área de impressão, em milímetros.
 * @param {CanvasRenderingContext2D} ctx já transformado para milímetros
 * @param {{fundo:string, semente:number, enfeites:object, camadas:Array}} arte
 * @param {{x:number,y:number,width:number,height:number}} printArea área útil em mm
 * @param {{fotos?:Object, imagens?:Object, semPandinha?:boolean}} dados
 * @returns {Array<{camada:object, caixa:object}>} onde cada camada ficou, para o clique e o contorno
 */
export function desenhaArte(ctx, arte, printArea, dados = {}) {
  const medidor = medidorDeTexto(ctx);
  const visiveis = arte.camadas.filter((camada) => !(dados.semPandinha && camada.tipo === 'adesivo'));
  const caixas = visiveis.map((camada) => ({ camada, caixa: caixaDaCamada(camada, printArea, medidor) }));
  ctx.save();
  ctx.fillStyle = cor(arte.fundo);
  ctx.fillRect(printArea.x, printArea.y, printArea.width, printArea.height);

  // Enfeites do fundo: sempre no mesmo lugar, longe das fotos e das frases.
  const conf = arte.enfeites;
  if (conf?.quantidade) {
    const reservados = caixas.map((item) => item.caixa);
    const aleatorio = sorteio(arte.semente || 1);
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
      desenhaForma(ctx, forma, t, tinta);
      ctx.restore();
    }
  }

  for (const { camada, caixa } of caixas) {
    if (camada.tipo === 'foto') desenhaFoto(ctx, camada, caixa, dados.fotos?.[camada.id]);
    else if (camada.tipo === 'frase') desenhaFrase(ctx, camada, caixa, printArea);
    else if (camada.tipo === 'enfeite') desenhaEnfeite(ctx, camada, caixa);
    else if (camada.tipo === 'adesivo' || camada.tipo === 'elemento') desenhaAdesivo(ctx, camada, caixa, dados.imagens?.[camada.arquivo]);
  }
  ctx.restore();
  return caixas;
}
