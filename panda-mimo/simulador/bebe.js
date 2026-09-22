/*
  Coleção "Bebê e maternidade": chegada do bebê, chá de bebê, chá revelação, gravidez e o primeiro
  Dia das Mães.

  As ilustrações seguem a seção 9.1 do manual: desenhadas por curvas, cor só por token, uma tinta
  principal que a pessoa troca. O vocabulário está em `desenho.js`, que mede e centra sozinho.
*/
import { ilustracao } from './desenho.js';
import { foto, fotoRedonda, frase, ilustra } from './camadas.js';

const ESCURO = '--ink';
const CLARO = '--white';

export const GRUPO_BEBE = 'Bebê e maternidade';

const chupeta = ilustracao({
  primary: '--peach',
  partes: [
    { elipse: [0, 12, 30, 22], fill: '--peach', stroke: ESCURO, w: 2.8 },
    { elipse: [0, 12, 17, 12], fill: CLARO, stroke: ESCURO, w: 2.2 },
    { d: 'M -9 -10 C -9 -22 9 -22 9 -10 C 9 -2 -9 -2 -9 -10 Z', fill: '--sand', stroke: ESCURO, w: 2.4 },
    { d: 'M -13 -18 C -13 -34 13 -34 13 -18', stroke: ESCURO, w: 4 },
  ],
});

/** Um par de sapatinhos de trico, de lado: cano em cima, solinha comprida embaixo. */
const sapatinhos = ilustracao({
  primary: '--sage',
  partes: [
    { d: 'M -20 -4 L -20 -22 C -20 -28 -46 -28 -46 -22 L -46 -4 Z', fill: '--sage', stroke: ESCURO, w: 2.6 },
    { d: 'M -46 -4 L -20 -4 C -20 8 -30 12 -44 14 C -56 16 -60 12 -60 4 C -60 -2 -54 -4 -46 -4 Z',
      fill: '--sage', stroke: ESCURO, w: 2.6 },
    { d: 'M -46 -12 L -20 -12', stroke: CLARO, w: 2.4 },
    { d: 'M -56 6 L -24 4', stroke: ESCURO, w: 2 },
    { d: 'M 20 -4 L 20 -22 C 20 -28 46 -28 46 -22 L 46 -4 Z', fill: '--sage', stroke: ESCURO, w: 2.6 },
    { d: 'M 46 -4 L 20 -4 C 20 8 30 12 44 14 C 56 16 60 12 60 4 C 60 -2 54 -4 46 -4 Z',
      fill: '--sage', stroke: ESCURO, w: 2.6 },
    { d: 'M 20 -12 L 46 -12', stroke: CLARO, w: 2.4 },
    { d: 'M 56 6 L 24 4', stroke: ESCURO, w: 2 },
  ],
});

const carrinho = ilustracao({
  primary: '--peach',
  partes: [
    { d: 'M -34 6 L 34 6 C 34 -26 -2 -38 -22 -22 C -30 -16 -34 -6 -34 6 Z',
      fill: '--peach', stroke: ESCURO, w: 2.8 },
    { d: 'M -36 6 L 40 6 C 40 22 28 30 10 30 L -14 30 C -30 30 -38 22 -36 6 Z',
      fill: '--sand', stroke: ESCURO, w: 2.8 },
    { d: 'M 34 4 L 52 -18', stroke: ESCURO, w: 3.4 },
    { circulo: [-12, 40, 9], fill: CLARO, stroke: ESCURO, w: 2.8 },
    { circulo: [18, 40, 9], fill: CLARO, stroke: ESCURO, w: 2.8 },
    { d: 'M -2 -24 L -2 6', stroke: ESCURO, w: 2.2 },
  ],
});

const mamadeira = ilustracao({
  primary: '--sand',
  partes: [
    { d: 'M -18 -12 L 18 -12 L 18 34 C 18 42 12 46 0 46 C -12 46 -18 42 -18 34 Z',
      fill: '--sand', stroke: ESCURO, w: 2.8 },
    { retangulo: [-20, -22, 40, 11, 4], fill: CLARO, stroke: ESCURO, w: 2.6 },
    { d: 'M -8 -22 C -8 -38 8 -38 8 -22 Z', fill: '--peach', stroke: ESCURO, w: 2.6 },
    { d: 'M -12 2 L 2 2', stroke: CLARO, w: 2.6 },
    { d: 'M -12 14 L 2 14', stroke: CLARO, w: 2.6 },
    { d: 'M -12 26 L 2 26', stroke: CLARO, w: 2.6 },
  ],
});

const macacao = ilustracao({
  primary: '--peach',
  partes: [
    { d: 'M -26 -18 L -12 -26 C -4 -20 4 -20 12 -26 L 26 -18 L 30 -2 L 20 2 L 20 22 '
       + 'C 20 32 14 36 4 36 L -4 36 C -14 36 -20 32 -20 22 L -20 2 L -30 -2 Z',
      fill: '--peach', stroke: ESCURO, w: 2.8 },
    { d: 'M -4 22 L -4 36', stroke: ESCURO, w: 2.2 },
    { circulo: [-12, 8, 3], fill: CLARO },
    { circulo: [8, 14, 3], fill: CLARO },
    { d: 'M -8 -44 C -8 -52 8 -52 8 -44 C 8 -38 0 -36 0 -30', stroke: ESCURO, w: 2.4 },
    { d: 'M -18 -26 L 18 -26', stroke: ESCURO, w: 2.2 },
  ],
});

const ursinho = ilustracao({
  primary: '--kraft',
  partes: [
    { circulo: [-22, -26, 11], fill: '--kraft', stroke: ESCURO, w: 2.6 },
    { circulo: [22, -26, 11], fill: '--kraft', stroke: ESCURO, w: 2.6 },
    { circulo: [-22, -26, 5], fill: '--peach' },
    { circulo: [22, -26, 5], fill: '--peach' },
    { elipse: [0, -12, 26, 23], fill: '--kraft', stroke: ESCURO, w: 2.8 },
    { elipse: [0, -4, 14, 10], fill: '--sand', stroke: ESCURO, w: 2 },
    { circulo: [-9, -16, 3], fill: ESCURO },
    { circulo: [9, -16, 3], fill: ESCURO },
    { d: 'M -4 -8 C -4 -11 4 -11 4 -8 C 4 -5 1 -3 0 -3 C -1 -3 -4 -5 -4 -8 Z', fill: ESCURO },
    { elipse: [0, 26, 22, 19], fill: '--kraft', stroke: ESCURO, w: 2.8 },
    { elipse: [-26, 20, 9, 12, -22], fill: '--kraft', stroke: ESCURO, w: 2.4 },
    { elipse: [26, 20, 9, 12, 22], fill: '--kraft', stroke: ESCURO, w: 2.4 },
    { elipse: [0, 30, 12, 9], fill: '--sand' },
  ],
});

const luaEstrelas = ilustracao({
  primary: '--kraft',
  partes: [
    { d: 'M 14 -34 C -12 -34 -30 -14 -30 8 C -30 30 -12 46 12 46 C 22 46 32 42 38 36 '
       + 'C 14 38 -8 24 -8 4 C -8 -14 2 -30 14 -34 Z', fill: '--kraft', stroke: ESCURO, w: 2.8 },
    { d: 'M 34 -30 L 38 -20 L 48 -18 L 40 -11 L 42 -1 L 34 -6 L 26 -1 L 28 -11 L 20 -18 L 30 -20 Z',
      fill: '--peach', stroke: ESCURO, w: 2 },
    { d: 'M 38 10 L 41 17 L 48 18 L 43 23 L 44 30 L 38 26 L 32 30 L 33 23 L 28 18 L 35 17 Z',
      fill: '--sage', stroke: ESCURO, w: 1.8 },
  ],
});

const nuvemDeCoracoes = ilustracao({
  primary: CLARO,
  partes: [
    { d: 'M -44 8 C -56 8 -58 -8 -46 -12 C -48 -28 -28 -36 -18 -24 C -10 -38 14 -36 18 -20 '
       + 'C 34 -26 48 -10 40 2 C 46 6 44 8 38 8 Z', fill: CLARO, stroke: ESCURO, w: 2.8 },
    { d: 'M -22 34 C -32 26 -35 22 -35 17 C -35 12 -31 10 -28 10 C -25 10 -23 12 -22 14 '
       + 'C -21 12 -19 10 -16 10 C -13 10 -9 12 -9 17 C -9 22 -12 26 -22 34 Z', fill: '--peach' },
    { d: 'M 6 42 C -4 34 -7 30 -7 25 C -7 20 -3 18 0 18 C 3 18 5 20 6 22 '
       + 'C 7 20 9 18 12 18 C 15 18 19 20 19 25 C 19 30 16 34 6 42 Z', fill: '--sage' },
    { d: 'M 28 30 C 20 24 18 21 18 17 C 18 13 21 11 24 11 C 26 11 27 12 28 14 '
       + 'C 29 12 30 11 32 11 C 35 11 38 13 38 17 C 38 21 36 24 28 30 Z', fill: '--kraft' },
  ],
});

const coracaoComPezinhos = ilustracao({
  primary: '--peach',
  partes: [
    { d: 'M 0 44 C -38 18 -52 2 -52 -16 C -52 -34 -38 -44 -24 -44 C -13 -44 -5 -38 0 -30 '
       + 'C 5 -38 13 -44 24 -44 C 38 -44 52 -34 52 -16 C 52 2 38 18 0 44 Z',
      fill: '--peach', stroke: ESCURO, w: 2.8 },
    { elipse: [-11, 2, 8, 11, -10], fill: CLARO },
    { circulo: [-19, -10, 3], fill: CLARO },
    { circulo: [-13, -13, 2.6], fill: CLARO },
    { circulo: [-7, -14, 2.4], fill: CLARO },
    { circulo: [-2, -12, 2.2], fill: CLARO },
    { elipse: [13, 6, 8, 11, 10], fill: CLARO },
    { circulo: [21, -6, 3], fill: CLARO },
    { circulo: [15, -9, 2.6], fill: CLARO },
    { circulo: [9, -10, 2.4], fill: CLARO },
    { circulo: [4, -8, 2.2], fill: CLARO },
  ],
});

/** Balão com interrogação: o chá revelação antes de alguém saber. */
const balaoRevelacao = ilustracao({
  primary: '--sand',
  partes: [
    { elipse: [0, -18, 32, 38], fill: '--sand', stroke: ESCURO, w: 2.8 },
    { d: 'M -6 19 L 0 28 L 6 19 Z', fill: '--sand', stroke: ESCURO, w: 2.2 },
    { d: 'M 0 28 C 12 38 -12 48 0 58', stroke: ESCURO, w: 2.2 },
    { d: 'M -11 -30 C -11 -42 12 -42 12 -30 C 12 -22 0 -21 0 -12', stroke: ESCURO, w: 4.4 },
    { circulo: [0, -1, 3.4], fill: ESCURO },
  ],
});

/** De lado: cabeca, costas retas e a barriga para a frente, com um coracao em cima dela. */
const barriga = ilustracao({
  primary: '--peach',
  partes: [
    { circulo: [-8, -46, 15], fill: '--peach', stroke: ESCURO, w: 2.8 },
    { d: 'M -18 -32 C -24 -26 -25 -18 -24 -8 C -23 6 -24 24 -26 44 L -6 44 '
       + 'C -6 26 -4 14 2 6 C 18 -6 18 -26 2 -32 Z', fill: '--peach', stroke: ESCURO, w: 2.8 },
    { d: 'M 2 -32 C -6 -28 -10 -20 -10 -10', stroke: ESCURO, w: 2 },
    { d: 'M 0 6 C -10 -2 -14 -6 -14 -12 C -14 -17 -10 -20 -6 -20 C -3 -20 -1 -18 0 -16 '
       + 'C 1 -18 3 -20 6 -20 C 10 -20 14 -17 14 -12 C 14 -6 10 -2 0 6 Z', fill: CLARO },
  ],
});

const movelDoBerco = ilustracao({
  primary: '--sage',
  partes: [
    { d: 'M -44 -34 C -22 -46 22 -46 44 -34', stroke: '--kraft', w: 3.4 },
    { d: 'M -34 -37 L -34 -18', stroke: ESCURO, w: 2 },
    { d: 'M 0 -43 L 0 -24', stroke: ESCURO, w: 2 },
    { d: 'M 34 -37 L 34 -18', stroke: ESCURO, w: 2 },
    { circulo: [-34, -4, 14], fill: '--sage', stroke: ESCURO, w: 2.6 },
    { d: 'M 0 6 C -12 -4 -16 -10 -16 -16 C -16 -21 -12 -24 -8 -24 C -4 -24 -1 -22 0 -19 '
       + 'C 1 -22 4 -24 8 -24 C 12 -24 16 -21 16 -16 C 16 -10 12 -4 0 6 Z',
      fill: '--peach', stroke: ESCURO, w: 2.6 },
    { d: 'M 34 -18 L 39 -7 L 51 -6 L 42 2 L 45 14 L 34 8 L 23 14 L 26 2 L 17 -6 L 29 -7 Z',
      fill: '--sand', stroke: ESCURO, w: 2.2 },
  ],
});

const trouxinha = ilustracao({
  primary: '--sand',
  partes: [
    { d: 'M -34 6 C -34 -14 -18 -26 0 -26 C 18 -26 34 -14 34 6 C 34 22 18 30 0 30 '
       + 'C -18 30 -34 22 -34 6 Z', fill: '--sand', stroke: ESCURO, w: 2.8 },
    { d: 'M -24 -18 C -18 -30 18 -30 24 -18', stroke: ESCURO, w: 3 },
    { d: 'M -9 -26 C -20 -40 -2 -46 0 -34 C 2 -46 20 -40 9 -26 Z', fill: '--sand', stroke: ESCURO, w: 2.4 },
    { elipse: [0, 6, 15, 13], fill: '--peach', stroke: ESCURO, w: 2.2 },
    { circulo: [-5, 3, 2.4], fill: ESCURO },
    { circulo: [5, 3, 2.4], fill: ESCURO },
    { d: 'M -3 10 C -1 12 1 12 3 10', stroke: ESCURO, w: 2 },
  ],
});

export const ILUSTRACOES_BEBE = Object.freeze({
  'bebe-chupeta': chupeta,
  'bebe-sapatinhos': sapatinhos,
  'bebe-carrinho': carrinho,
  'bebe-mamadeira': mamadeira,
  'bebe-macacao': macacao,
  'bebe-ursinho': ursinho,
  'bebe-lua': luaEstrelas,
  'bebe-nuvem': nuvemDeCoracoes,
  'bebe-coracao-pes': coracaoComPezinhos,
  'bebe-balao': balaoRevelacao,
  'bebe-barriga': barriga,
  'bebe-movel': movelDoBerco,
  'bebe-trouxinha': trouxinha,
});

/* ====================================================================================
   Os modelos. "Chegada do bebê" já existia com uma arte (em `modelos.js`); aqui entram as três
   que faltavam para ela e os três assuntos novos, com quatro artes cada.
   A frente da caneca cai em x ≈ 0,19 e o verso em x ≈ 0,81.
   ==================================================================================== */

export const CATEGORIAS_BEBE = Object.freeze([
  { id: 'bebe-cha', grupo: GRUPO_BEBE, nome: 'Chá de bebê', descricao: 'Lembrança do chá, com foto e o nome do bebê' },
  { id: 'bebe-revelacao', grupo: GRUPO_BEBE, nome: 'Chá revelação', descricao: 'Antes e depois de todo mundo saber' },
  { id: 'bebe-gravidez', grupo: GRUPO_BEBE, nome: 'Gravidez e primeiro Dia das Mães', descricao: 'Pra quem está esperando e pra primeira vez' },
]);

const nuvens = { formas: ['bolinha', 'coracao'], cores: ['--sand', '--sage', '--peach'], quantidade: 26, tamanho: [3, 6.5] };
const estrelinhasBebe = { formas: ['estrela', 'bolinha'], cores: ['--sand', '--peach', '--sage'], quantidade: 28, tamanho: [2.5, 6] };
const coracoesBebe = { formas: ['coracao', 'bolinha'], cores: ['--peach', '--sand', '--sage'], quantidade: 30, tamanho: [3, 7] };
const confetesBebe = { formas: ['confete', 'bolinha'], cores: ['--peach', '--sage', '--kraft'], quantidade: 30, tamanho: [3, 7] };

export const MODELOS_BEBE = [
  /* ---------- chegada do bebê (assunto que já existia) ---------- */
  {
    id: 'bebe-berco', categoria: 'bebe', nome: 'Dorme, que a gente cuida',
    descricao: 'O móbile e a lua, a foto do bebê e o nome',
    fundo: '--white', semente: 701, enfeites: estrelinhasBebe,
    camadas: [
      ilustra('i1', 'Móbile do berço', 'bebe-movel', 0.19, 0.28, 0.46, '--sage'),
      ilustra('i2', 'Lua e estrelas', 'bebe-lua', 0.19, 0.72, 0.26, '--kraft'),
      fotoRedonda('a', 'Foto do bebê', 0.5, 0.42, 0.175),
      frase('f1', 'Nome do bebê', 'Antônio', 0.81, 0.34, 12, { fonte: 'Fredoka', cor: '--ink', largura: 0.24 }),
      frase('f2', 'Frase', 'chegou pra bagunçar tudo', 0.81, 0.56, 5.5, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.26 }),
    ],
  },
  {
    id: 'bebe-pezinhos', categoria: 'bebe', nome: 'Os pezinhos',
    descricao: 'Coração com pezinhos, a foto em coração e os dados do nascimento',
    fundo: '--paper', semente: 702, enfeites: coracoesBebe,
    camadas: [
      ilustra('i1', 'Coração com pezinhos', 'bebe-coracao-pes', 0.19, 0.4, 0.5, '--peach'),
      ilustra('i2', 'Sapatinhos', 'bebe-sapatinhos', 0.19, 0.8, 0.26, '--sage'),
      foto('a', 'Foto do bebê', 'coracao', 0.5, 0.4, 0.19, 0.5),
      frase('f1', 'Nome do bebê', 'Cecília', 0.81, 0.26, 11, { fonte: 'Fredoka', cor: '--ink', largura: 0.24 }),
      frase('f2', 'Nascimento', '12.03.2026 · 3,2 kg', 0.81, 0.46, 5.5, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.26 }),
      frase('f3', 'Frase', 'o nosso maior mimo', 0.81, 0.68, 7, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.24 }),
    ],
  },
  {
    id: 'bebe-enxoval', categoria: 'bebe', nome: 'O enxoval inteiro',
    descricao: 'Macacão, mamadeira e chupeta, com duas fotos e o nome',
    fundo: '--cream', semente: 703, enfeites: nuvens,
    camadas: [
      ilustra('i1', 'Macacão', 'bebe-macacao', 0.1, 0.4, 0.3, '--peach'),
      ilustra('i2', 'Mamadeira', 'bebe-mamadeira', 0.9, 0.34, 0.2, '--sand'),
      ilustra('i3', 'Chupeta', 'bebe-chupeta', 0.9, 0.72, 0.22, '--peach'),
      foto('a', 'Primeira foto', 'arredondado', 0.32, 0.4, 0.16, 0.48),
      foto('b', 'Segunda foto', 'arredondado', 0.53, 0.4, 0.16, 0.48),
      frase('f1', 'Nome do bebê', 'Miguel', 0.72, 0.38, 9, { fonte: 'Fredoka', cor: '--ink', largura: 0.14 }),
      frase('f2', 'Frase', 'tudo pronto pra você chegar', 0.42, 0.8, 6, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.3 }),
    ],
  },

  /* ---------- chá de bebê ---------- */
  {
    id: 'bebe-cha-ursinho', categoria: 'bebe-cha', nome: 'Chá do ursinho',
    descricao: 'O ursinho na frente, a foto no meio e a data do chá',
    fundo: '--white', semente: 711, enfeites: nuvens,
    camadas: [
      ilustra('i1', 'Ursinho', 'bebe-ursinho', 0.19, 0.42, 0.5, '--kraft'),
      ilustra('i2', 'Sapatinhos', 'bebe-sapatinhos', 0.36, 0.8, 0.24, '--sage'),
      fotoRedonda('a', 'Foto da festa', 0.53, 0.42, 0.175),
      frase('f1', 'Nome do bebê', 'chá do Theo', 0.81, 0.32, 10, { fonte: 'Fredoka', cor: '--ink', largura: 0.24 }),
      frase('f2', 'Data', '18 de maio', 0.81, 0.54, 7, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.2 }),
    ],
  },
  {
    id: 'bebe-cha-nuvem', categoria: 'bebe-cha', nome: 'Chuva de amor',
    descricao: 'A nuvem de corações, duas fotos e o obrigado da família',
    fundo: '--paper', semente: 712, enfeites: coracoesBebe,
    camadas: [
      ilustra('i1', 'Nuvem de corações', 'bebe-nuvem', 0.1, 0.36, 0.42, '--white'),
      ilustra('i2', 'Nuvem de corações', 'bebe-nuvem', 0.9, 0.36, 0.34, '--white'),
      foto('a', 'Primeira foto', 'arredondado', 0.31, 0.42, 0.16, 0.46),
      foto('b', 'Segunda foto', 'arredondado', 0.52, 0.42, 0.16, 0.46),
      frase('f1', 'Frase', 'obrigado por vir molhar a mão', 0.42, 0.8, 6, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.32 }),
      frase('f2', 'Nome do bebê', 'Aurora', 0.71, 0.42, 9, { fonte: 'Fredoka', cor: '--ink', largura: 0.16 }),
    ],
  },
  {
    id: 'bebe-cha-carrinho', categoria: 'bebe-cha', nome: 'Já tem carrinho',
    descricao: 'O carrinho, a foto em coração e a lembrancinha do chá',
    fundo: '--cream', semente: 713, enfeites: confetesBebe,
    camadas: [
      ilustra('i1', 'Carrinho de bebê', 'bebe-carrinho', 0.81, 0.4, 0.48, '--peach'),
      ilustra('i2', 'Chupeta', 'bebe-chupeta', 0.63, 0.78, 0.2, '--peach'),
      foto('a', 'Foto do chá', 'coracao', 0.19, 0.4, 0.19, 0.5),
      frase('f1', 'Frase', 'lembrancinha do chá', 0.5, 0.3, 6.5, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.24 }),
      frase('f2', 'Nome do bebê', 'do Bento', 0.5, 0.5, 11, { fonte: 'Fredoka', cor: '--ink', largura: 0.2 }),
    ],
  },
  {
    id: 'bebe-cha-trouxinha', categoria: 'bebe-cha', nome: 'A trouxinha chegou',
    descricao: 'Três fotos do chá, com a trouxinha e a lua',
    fundo: '--white', semente: 714, enfeites: estrelinhasBebe,
    camadas: [
      ilustra('i1', 'Trouxinha', 'bebe-trouxinha', 0.07, 0.4, 0.28, '--sand'),
      ilustra('i2', 'Lua e estrelas', 'bebe-lua', 0.93, 0.4, 0.26, '--kraft'),
      ilustra('i3', 'Chupeta', 'bebe-chupeta', 0.5, 0.82, 0.18, '--peach'),
      fotoRedonda('a', 'Primeira foto', 0.24, 0.38, 0.14),
      fotoRedonda('b', 'Segunda foto', 0.5, 0.38, 0.14),
      fotoRedonda('c', 'Terceira foto', 0.76, 0.38, 0.14),
      frase('f1', 'Frase', 'o dia em que a gente comemorou você', 0.29, 0.7, 5.5, { fonte: 'Nunito', cor: '--ink', largura: 0.3 }),
      frase('f2', 'Nome do bebê', 'Maitê', 0.74, 0.7, 8, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.16 }),
    ],
  },

  /* ---------- chá revelação ---------- */
  {
    id: 'bebe-revelacao-balao', categoria: 'bebe-revelacao', nome: 'Menino ou menina?',
    descricao: 'O balão da revelação, a foto do casal e a pergunta',
    fundo: '--white', semente: 721, enfeites: confetesBebe,
    camadas: [
      ilustra('i1', 'Balão da revelação', 'bebe-balao', 0.19, 0.4, 0.34, '--peach'),
      ilustra('i2', 'Sapatinhos', 'bebe-sapatinhos', 0.19, 0.84, 0.24, '--sage'),
      foto('a', 'Foto do casal', 'arredondado', 0.5, 0.4, 0.19, 0.54),
      frase('f1', 'Pergunta', 'menino ou menina?', 0.81, 0.34, 9, { fonte: 'Fredoka', cor: '--ink', largura: 0.26 }),
      frase('f2', 'Data', 'a gente descobre dia 20', 0.81, 0.58, 5.5, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.26 }),
    ],
  },
  {
    id: 'bebe-revelacao-azul-rosa', categoria: 'bebe-revelacao', nome: 'Aposte comigo',
    descricao: 'Dois balões, duas fotos e o palpite de quem ganha a caneca',
    fundo: '--cream', semente: 722, enfeites: confetesBebe,
    camadas: [
      ilustra('i1', 'Balão da revelação', 'bebe-balao', 0.08, 0.4, 0.3, '--sage'),
      ilustra('i2', 'Balão da revelação', 'bebe-balao', 0.92, 0.4, 0.3, '--peach'),
      foto('a', 'Primeira foto', 'arredondado', 0.31, 0.4, 0.16, 0.48),
      foto('b', 'Segunda foto', 'arredondado', 0.52, 0.4, 0.16, 0.48),
      frase('f1', 'Frase', 'qual é o seu palpite?', 0.42, 0.8, 7, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.26 }),
      frase('f2', 'Nome', 'time da tia Lu', 0.72, 0.4, 7, { fonte: 'Fredoka', cor: '--ink', largura: 0.16 }),
    ],
  },
  {
    id: 'bebe-revelacao-nuvem', categoria: 'bebe-revelacao', nome: 'A gente já sabe',
    descricao: 'A nuvem e o balão, a foto no meio e o anúncio',
    fundo: '--paper', semente: 723, enfeites: nuvens,
    camadas: [
      ilustra('i1', 'Nuvem de corações', 'bebe-nuvem', 0.81, 0.34, 0.46, '--white'),
      ilustra('i2', 'Balão da revelação', 'bebe-balao', 0.63, 0.74, 0.2, '--peach'),
      fotoRedonda('a', 'Foto do casal', 0.19, 0.42, 0.185),
      frase('f1', 'Anúncio', 'é menina!', 0.47, 0.36, 13, { fonte: 'Fredoka', cor: '--ink', largura: 0.22 }),
      frase('f2', 'Frase', 'e a gente não aguentou esperar', 0.47, 0.6, 5.5, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.26 }),
    ],
  },
  {
    id: 'bebe-revelacao-lembranca', categoria: 'bebe-revelacao', nome: 'Lembrança da revelação',
    descricao: 'A foto em coração, o balão e o agradecimento de quem foi',
    fundo: '--white', semente: 724, enfeites: coracoesBebe,
    camadas: [
      ilustra('i1', 'Balão da revelação', 'bebe-balao', 0.85, 0.4, 0.32, '--peach'),
      ilustra('i2', 'Coração com pezinhos', 'bebe-coracao-pes', 0.15, 0.78, 0.22, '--peach'),
      foto('a', 'Foto da festa', 'coracao', 0.28, 0.38, 0.18, 0.48),
      frase('f1', 'Frase', 'obrigado por descobrir com a gente', 0.56, 0.32, 6, { fonte: 'Nunito', cor: '--ink', largura: 0.28 }),
      frase('f2', 'Nomes', 'Duda e Rafa', 0.56, 0.56, 9, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.22 }),
    ],
  },

  /* ---------- gravidez e primeiro Dia das Mães ---------- */
  {
    id: 'bebe-gravidez-espera', categoria: 'bebe-gravidez', nome: 'Esperando você',
    descricao: 'A silhueta da barriga, a foto do ultrassom e a contagem',
    fundo: '--white', semente: 731, enfeites: coracoesBebe,
    camadas: [
      ilustra('i1', 'Barriga', 'bebe-barriga', 0.81, 0.4, 0.27, '--peach'),
      ilustra('i2', 'Coração com pezinhos', 'bebe-coracao-pes', 0.81, 0.82, 0.18, '--peach'),
      foto('a', 'Foto do ultrassom', 'arredondado', 0.19, 0.4, 0.18, 0.52),
      frase('f1', 'Frase', 'esperando você', 0.5, 0.34, 11, { fonte: 'Fredoka', cor: '--ink', largura: 0.24 }),
      frase('f2', 'Contagem', 'faltam 12 semanas', 0.5, 0.58, 5.5, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.24 }),
    ],
  },
  {
    id: 'bebe-gravidez-anuncio', categoria: 'bebe-gravidez', nome: 'A gente vai ser três',
    descricao: 'Duas fotos, os sapatinhos e o anúncio da gravidez',
    fundo: '--cream', semente: 732, enfeites: nuvens,
    camadas: [
      ilustra('i1', 'Sapatinhos', 'bebe-sapatinhos', 0.5, 0.26, 0.3, '--sage'),
      ilustra('i2', 'Ursinho', 'bebe-ursinho', 0.34, 0.8, 0.18, '--kraft'),
      ilustra('i3', 'Chupeta', 'bebe-chupeta', 0.66, 0.8, 0.16, '--peach'),
      foto('a', 'Primeira foto', 'arredondado', 0.19, 0.4, 0.17, 0.5),
      foto('b', 'Segunda foto', 'arredondado', 0.81, 0.4, 0.17, 0.5),
      frase('f1', 'Anúncio', 'em breve a gente vai ser três', 0.5, 0.52, 6.5, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.28 }),
      frase('f2', 'Mês', 'setembro', 0.5, 0.68, 8, { fonte: 'Fredoka', cor: '--ink', largura: 0.16 }),
    ],
  },
  {
    id: 'bebe-primeiro-maes', categoria: 'bebe-gravidez', nome: 'Primeiro Dia das Mães',
    descricao: 'A foto de vocês dois, a nuvem e a data do primeiro',
    fundo: '--paper', semente: 733, enfeites: coracoesBebe,
    camadas: [
      ilustra('i1', 'Nuvem de corações', 'bebe-nuvem', 0.81, 0.32, 0.44, '--white'),
      ilustra('i2', 'Sapatinhos', 'bebe-sapatinhos', 0.66, 0.76, 0.24, '--sage'),
      foto('a', 'Foto de vocês', 'coracao', 0.19, 0.4, 0.19, 0.5),
      frase('f1', 'Título', 'meu primeiro', 0.46, 0.34, 8, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.22 }),
      frase('f2', 'Título', 'Dia das Mães', 0.46, 0.52, 11, { fonte: 'Fredoka', cor: '--ink', largura: 0.24 }),
      frase('f3', 'Ano', '2026', 0.46, 0.72, 6, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.14 }),
    ],
  },
  {
    id: 'bebe-gravidez-diario', categoria: 'bebe-gravidez', nome: 'Semana a semana',
    descricao: 'Três fotos da barriga crescendo, com a contagem embaixo',
    fundo: '--white', semente: 734, enfeites: estrelinhasBebe,
    camadas: [
      ilustra('i1', 'Barriga', 'bebe-barriga', 0.05, 0.46, 0.14, '--peach'),
      ilustra('i2', 'Barriga', 'bebe-barriga', 0.95, 0.46, 0.18, '--peach'),
      ilustra('i3', 'Coração com pezinhos', 'bebe-coracao-pes', 0.5, 0.84, 0.15, '--peach'),
      foto('a', 'Primeira foto', 'arredondado', 0.19, 0.4, 0.15, 0.44),
      foto('b', 'Segunda foto', 'arredondado', 0.5, 0.4, 0.15, 0.44),
      foto('c', 'Terceira foto', 'arredondado', 0.81, 0.4, 0.15, 0.44),
      frase('f1', 'Frase', 'semana a semana', 0.35, 0.8, 5.5, { fonte: 'Nunito', cor: '--ink', largura: 0.2 }),
      frase('f2', 'Nome', 'da mamãe Bia', 0.65, 0.8, 7, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.2 }),
    ],
  },
];
