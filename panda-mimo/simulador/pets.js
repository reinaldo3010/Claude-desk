/*
  Coleção "Pets": as ilustrações e os modelos de arte de quem tem cachorro, gato ou outro bichinho.

  As ilustrações seguem a seção 9.1 do manual: desenhadas por curvas, cor só por token da paleta,
  uma tinta principal que a pessoa troca. O vocabulário de desenho está em `desenho.js`.

  Coordenadas centradas na origem, y para baixo. `largura` e `altura` são a caixa da ilustração e
  entram no cálculo da seleção: precisam acompanhar o desenho de verdade, senão a alça mente.
*/

import { ilustracao } from './desenho.js';
import { foto, fotoRedonda, frase, ilustra } from './camadas.js';

const GRUPO = 'Pets e bichinhos';

const ESCURO = '--ink';
const CLARO = '--white';

/* ---------- cachorro ---------- */
const caoRosto = ilustracao({
  primary: '--kraft',
  partes: [
    // orelhas caídas, atrás da cabeça
    { elipse: [-34, 2, 15, 26, -16], fill: '--kraft', stroke: ESCURO, w: 2.6 },
    { elipse: [34, 2, 15, 26, 16], fill: '--kraft', stroke: ESCURO, w: 2.6 },
    // cabeça
    { d: 'M -33 -8 C -33 -32 -18 -44 0 -44 C 18 -44 33 -32 33 -8 C 33 16 19 32 0 32 C -19 32 -33 16 -33 -8 Z',
      fill: '--kraft', stroke: ESCURO, w: 2.8 },
    // focinheira
    { elipse: [0, 13, 21, 15], fill: CLARO, stroke: ESCURO, w: 2.2 },
    // manchinha de um olho só: o charme do vira-lata
    { d: 'M -30 -14 C -30 -30 -19 -39 -6 -37 C -10 -26 -12 -19 -12 -12 C -20 -9 -27 -10 -30 -14 Z', fill: '--sand' },
    // olhos
    { circulo: [-13, -11, 4.4], fill: ESCURO },
    { circulo: [13, -11, 4.4], fill: ESCURO },
    { circulo: [-11.6, -12.4, 1.5], fill: CLARO },
    { circulo: [14.4, -12.4, 1.5], fill: CLARO },
    // focinho e boca
    { d: 'M -7 5 C -7 1 7 1 7 5 C 7 9 3 12 0 12 C -3 12 -7 9 -7 5 Z', fill: ESCURO },
    { d: 'M 0 12 L 0 17', stroke: ESCURO, w: 2.2 },
    { d: 'M 0 17 C 0 23 -9 23 -10 17', stroke: ESCURO, w: 2.2 },
    { d: 'M 0 17 C 0 23 9 23 10 17', stroke: ESCURO, w: 2.2 },
  ],
});

const caoSentado = ilustracao({
  primary: '--kraft',
  partes: [
    // rabo
    { d: 'M 26 22 C 40 18 42 2 33 -6', stroke: '--kraft', w: 9 },
    // corpo
    { d: 'M -22 12 C -22 -8 -8 -18 4 -18 C 18 -18 27 -6 27 12 C 27 34 20 44 2 44 C -16 44 -22 34 -22 12 Z',
      fill: '--kraft', stroke: ESCURO, w: 2.8 },
    // peitinho claro
    { d: 'M -8 6 C -2 2 6 2 12 6 C 13 22 10 36 2 40 C -6 36 -9 22 -8 6 Z', fill: CLARO },
    // patas da frente
    { retangulo: [-16, 30, 13, 16, 6], fill: CLARO, stroke: ESCURO, w: 2.2 },
    { retangulo: [4, 30, 13, 16, 6], fill: CLARO, stroke: ESCURO, w: 2.2 },
    // orelhas
    { elipse: [-24, -28, 9, 20, -12], fill: '--kraft', stroke: ESCURO, w: 2.4 },
    { elipse: [22, -28, 9, 20, 12], fill: '--kraft', stroke: ESCURO, w: 2.4 },
    // cabeça
    { elipse: [-1, -34, 23, 21], fill: '--kraft', stroke: ESCURO, w: 2.8 },
    { elipse: [-1, -25, 14, 10], fill: CLARO, stroke: ESCURO, w: 2 },
    { circulo: [-9, -38, 3.4], fill: ESCURO },
    { circulo: [7, -38, 3.4], fill: ESCURO },
    { d: 'M -5 -29 C -5 -32 3 -32 3 -29 C 3 -26 0 -24 -1 -24 C -2 -24 -5 -26 -5 -29 Z', fill: ESCURO },
  ],
});

const ossinho = ilustracao({
  primary: '--sand',
  partes: [
    { d: 'M -46 -8 C -46 -17 -34 -19 -30 -12 L 30 -12 C 34 -19 46 -17 46 -8 C 46 -3 42 0 38 0 C 42 0 46 3 46 8 '
       + 'C 46 17 34 19 30 12 L -30 12 C -34 19 -46 17 -46 8 C -46 3 -42 0 -38 0 C -42 0 -46 -3 -46 -8 Z',
      fill: '--sand', stroke: ESCURO, w: 2.6 },
  ],
});

const casinha = ilustracao({
  primary: '--peach',
  partes: [
    { d: 'M -48 -8 L 0 -42 L 48 -8 Z', fill: '--peach', stroke: ESCURO, w: 2.8 },
    { retangulo: [-38, -10, 76, 52, 4], fill: '--sand', stroke: ESCURO, w: 2.8 },
    { d: 'M -16 42 L -16 14 C -16 4 16 4 16 14 L 16 42 Z', fill: ESCURO },
    { circulo: [0, -22, 5], fill: CLARO, stroke: ESCURO, w: 2 },
  ],
});

/* ---------- gato ---------- */
const gatoRosto = ilustracao({
  primary: '--sage-deep',
  partes: [
    // orelhas
    { d: 'M -34 -16 L -30 -46 L -6 -30 Z', fill: '--sage-deep', stroke: ESCURO, w: 2.6 },
    { d: 'M 34 -16 L 30 -46 L 6 -30 Z', fill: '--sage-deep', stroke: ESCURO, w: 2.6 },
    { d: 'M -28 -22 L -26 -37 L -14 -29 Z', fill: '--peach' },
    { d: 'M 28 -22 L 26 -37 L 14 -29 Z', fill: '--peach' },
    // cabeça
    { elipse: [0, -2, 34, 30], fill: '--sage-deep', stroke: ESCURO, w: 2.8 },
    // listras da testa
    { d: 'M -9 -30 L -5 -20', stroke: ESCURO, w: 2.4 },
    { d: 'M 2 -32 L 2 -21', stroke: ESCURO, w: 2.4 },
    { d: 'M 13 -30 L 9 -20', stroke: ESCURO, w: 2.4 },
    // olhos fechados de gato satisfeito
    { d: 'M -20 -4 C -16 -10 -10 -10 -6 -4', stroke: ESCURO, w: 2.8 },
    { d: 'M 6 -4 C 10 -10 16 -10 20 -4', stroke: ESCURO, w: 2.8 },
    // focinho
    { d: 'M -5 6 C -5 3 5 3 5 6 C 5 9 2 11 0 11 C -2 11 -5 9 -5 6 Z', fill: '--peach', stroke: ESCURO, w: 1.8 },
    { d: 'M 0 11 C 0 16 -7 17 -9 13', stroke: ESCURO, w: 2.2 },
    { d: 'M 0 11 C 0 16 7 17 9 13', stroke: ESCURO, w: 2.2 },
    // bigodes
    { d: 'M -12 8 L -31 4', stroke: ESCURO, w: 1.8 },
    { d: 'M -12 13 L -30 15', stroke: ESCURO, w: 1.8 },
    { d: 'M 12 8 L 31 4', stroke: ESCURO, w: 1.8 },
    { d: 'M 12 13 L 30 15', stroke: ESCURO, w: 1.8 },
  ],
});

const gatoSentado = ilustracao({
  primary: '--sage-deep',
  partes: [
    // rabo em curva, o que todo gato faz
    { d: 'M 22 34 C 40 34 42 12 30 6', stroke: '--sage-deep', w: 9 },
    { d: 'M -20 18 C -20 -6 -8 -16 2 -16 C 14 -16 24 -4 24 18 C 24 38 16 46 2 46 C -12 46 -20 38 -20 18 Z',
      fill: '--sage-deep', stroke: ESCURO, w: 2.8 },
    { d: 'M -6 10 C 0 6 6 6 11 10 C 12 26 9 38 2 42 C -5 38 -7 26 -6 10 Z', fill: CLARO },
    { elipse: [2, 43, 8, 5], fill: CLARO, stroke: ESCURO, w: 2 },
    // orelhas e cabeça
    { d: 'M -20 -30 L -17 -52 L -1 -40 Z', fill: '--sage-deep', stroke: ESCURO, w: 2.4 },
    { d: 'M 22 -30 L 19 -52 L 3 -40 Z', fill: '--sage-deep', stroke: ESCURO, w: 2.4 },
    { elipse: [1, -30, 22, 19], fill: '--sage-deep', stroke: ESCURO, w: 2.8 },
    { d: 'M -10 -33 C -7 -37 -3 -37 0 -33', stroke: ESCURO, w: 2.4 },
    { d: 'M 3 -33 C 6 -37 10 -37 13 -33', stroke: ESCURO, w: 2.4 },
    { d: 'M -3 -25 C -3 -27 5 -27 5 -25 C 5 -23 3 -21 1 -21 C -1 -21 -3 -23 -3 -25 Z', fill: '--peach' },
  ],
});

const novelo = ilustracao({
  primary: '--peach',
  partes: [
    { circulo: [0, -4, 32], fill: '--peach', stroke: ESCURO, w: 2.6 },
    { d: 'M -28 -16 C -10 -30 12 -30 28 -14', stroke: ESCURO, w: 2 },
    { d: 'M -30 2 C -12 -14 14 -14 30 0', stroke: ESCURO, w: 2 },
    { d: 'M -20 18 C -6 0 16 -2 28 12', stroke: ESCURO, w: 2 },
    { d: 'M 22 22 C 32 26 32 36 24 36 C 19 36 18 28 22 22', stroke: ESCURO, w: 2 },
  ],
});

const peixinho = ilustracao({
  primary: '--sage',
  partes: [
    { d: 'M 14 0 C 14 -14 0 -22 -16 -22 C -30 -22 -38 -12 -38 0 C -38 12 -30 22 -16 22 C 0 22 14 14 14 0 Z',
      fill: '--sage', stroke: ESCURO, w: 2.4 },
    { d: 'M 14 0 L 38 -16 L 33 0 L 38 16 Z', fill: '--sage', stroke: ESCURO, w: 2.4 },
    { d: 'M -14 -20 C -10 -32 2 -34 8 -26 Z', fill: '--sage', stroke: ESCURO, w: 2.4 },
    { circulo: [-22, -7, 3.4], fill: ESCURO },
    { d: 'M -34 4 C -30 8 -25 8 -22 5', stroke: ESCURO, w: 2 },
  ],
});

/* ---------- comum às duas turmas ---------- */
const patinha = ilustracao({
  primary: '--peach-ink',
  partes: [
    { d: 'M -22 12 C -22 -2 -10 -8 0 -8 C 10 -8 22 -2 22 12 C 22 26 12 32 0 32 C -12 32 -22 26 -22 12 Z',
      fill: '--peach-ink' },
    { elipse: [-23, -12, 8.5, 11, -18], fill: '--peach-ink' },
    { elipse: [-8, -22, 8.5, 11.5, -6], fill: '--peach-ink' },
    { elipse: [8, -22, 8.5, 11.5, 6], fill: '--peach-ink' },
    { elipse: [23, -12, 8.5, 11, 18], fill: '--peach-ink' },
  ],
});

const coracaoPata = ilustracao({
  primary: '--peach',
  partes: [
    { d: 'M 0 38 C -34 14 -46 0 -46 -14 C -46 -30 -33 -40 -20 -40 C -11 -40 -4 -35 0 -28 '
       + 'C 4 -35 11 -40 20 -40 C 33 -40 46 -30 46 -14 C 46 0 34 14 0 38 Z',
      fill: '--peach', stroke: ESCURO, w: 2.6 },
    { d: 'M -12 8 C -12 -1 -6 -5 0 -5 C 6 -5 12 -1 12 8 C 12 16 6 20 0 20 C -6 20 -12 16 -12 8 Z', fill: CLARO },
    { elipse: [-13, -8, 5, 7, -18], fill: CLARO },
    { elipse: [-4, -14, 5, 7, -6], fill: CLARO },
    { elipse: [5, -14, 5, 7, 6], fill: CLARO },
    { elipse: [14, -8, 5, 7, 18], fill: CLARO },
  ],
});

const coleira = ilustracao({
  primary: '--peach-ink',
  partes: [
    { d: 'M -48 -16 C -30 -26 30 -26 48 -16 C 48 -8 48 -6 48 -4 C 30 -14 -30 -14 -48 -4 Z',
      fill: '--peach-ink', stroke: ESCURO, w: 2.4 },
    { circulo: [-34, -15, 3], fill: '--sand' },
    { circulo: [-18, -18, 3], fill: '--sand' },
    { circulo: [0, -19, 3], fill: '--sand' },
    { circulo: [18, -18, 3], fill: '--sand' },
    { circulo: [34, -15, 3], fill: '--sand' },
    { circulo: [0, -5, 4], fill: ESCURO },
    { d: 'M 0 -1 C -12 1 -13 16 0 20 C 13 16 12 1 0 -1 Z', fill: '--kraft', stroke: ESCURO, w: 2.4 },
    { d: 'M -5 8 C -5 5 -1 3 0 6 C 1 3 5 5 5 8 C 5 11 2 13 0 14 C -2 13 -5 11 -5 8 Z', fill: ESCURO },
  ],
});

const potinho = ilustracao({
  primary: '--sage',
  partes: [
    { d: 'M -40 -14 C -26 -24 26 -24 40 -14 C 36 6 30 18 20 20 L -20 20 C -30 18 -36 6 -40 -14 Z',
      fill: '--sage', stroke: ESCURO, w: 2.6 },
    { d: 'M -33 -10 C -20 -18 20 -18 33 -10 C 20 -4 -20 -4 -33 -10 Z', fill: '--sand' },
    { d: 'M -22 8 L 22 8', stroke: CLARO, w: 3 },
  ],
});

/** Quatro pegadas em diagonal, como quem passou correndo. */
const pegadas = ilustracao({
  primary: '--kraft',
  partes: [[-42, 14, -12], [-14, -4, 6], [14, 12, -8], [42, -6, 10]].flatMap(([x, y, giro]) => {
    const r = giro * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    const põe = (dx, dy) => [x + dx * c - dy * s, y + dx * s + dy * c];
    return [
      { elipse: [...põe(0, 5), 8, 6.5, giro], fill: '--kraft' },
      { elipse: [...põe(-7, -5), 3.2, 4, giro - 18], fill: '--kraft' },
      { elipse: [...põe(-2.4, -8.4), 3.2, 4.2, giro - 6], fill: '--kraft' },
      { elipse: [...põe(2.4, -8.4), 3.2, 4.2, giro + 6], fill: '--kraft' },
      { elipse: [...põe(7, -5), 3.2, 4, giro + 18], fill: '--kraft' },
    ];
  }),
});

/** Coroa de folhas: o lugar de uma foto de quem já foi embora, ou de um nome. */
const arcoDeFolhas = ilustracao({
  primary: '--sage-deep',
  partes: [
    ...Array.from({ length: 14 }, (naoUsado, i) => {
      // folhas apontando para fora, alternando o lado: lê como uma coroa, não como um anel cheio
      const a = (i / 14) * Math.PI * 2 + 0.3;
      const x = Math.cos(a) * 48, y = Math.sin(a) * 45 - 9;
      const giro = (a * 180 / Math.PI) + (i % 2 ? 66 : 114);
      return { elipse: [x, y, 13, 6, giro], fill: '--sage-deep', stroke: ESCURO, w: 1.4 };
    }),
    { d: 'M -46 -12 C -46 -40 -26 -52 0 -52 C 26 -52 46 -40 46 -12', stroke: '--sage-deep', w: 2.2 },
    { d: 'M -46 -12 C -46 14 -26 34 0 34 C 26 34 46 14 46 -12', stroke: '--sage-deep', w: 2.2 },
  ],
});

/** Estrela com rastro: a saudade que fica brilhando. */
const estrelaCometa = ilustracao({
  primary: '--hand-ink',
  partes: [
    { d: 'M -48 24 C -28 14 -10 2 2 -14', stroke: '--sand', w: 3 },
    { d: 'M -32 30 C -16 22 -4 12 6 -2', stroke: '--sand', w: 2.4 },
    { d: 'M 20 -32 L 27 -14 L 46 -12 L 32 0 L 36 18 L 20 8 L 4 18 L 8 0 L -6 -12 L 13 -14 Z',
      fill: '--hand-ink', stroke: ESCURO, w: 2.2 },
  ],
});

/** Xícara com patinha: o crachá de quem é mãe ou pai de pet. */
const xicaraPata = ilustracao({
  primary: '--peach',
  partes: [
    { d: 'M -34 -26 L 26 -26 L 21 26 C 20 34 14 38 -2 38 C -18 38 -25 34 -26 26 Z',
      fill: '--peach', stroke: ESCURO, w: 2.8 },
    { d: 'M 26 -14 C 44 -14 48 8 27 12', stroke: ESCURO, w: 5 },
    { d: 'M -34 -26 L 26 -26', stroke: ESCURO, w: 2.8 },
    { d: 'M -10 8 C -10 1 -5 -2 -4 -2 C 1 -2 6 1 6 8 C 6 14 1 17 -2 17 C -6 17 -10 14 -10 8 Z', fill: CLARO },
    { elipse: [-11, -8, 4, 5.4, -18], fill: CLARO },
    { elipse: [-3.6, -13, 4, 5.6, -6], fill: CLARO },
    { elipse: [3.6, -13, 4, 5.6, 6], fill: CLARO },
    { elipse: [11, -8, 4, 5.4, 18], fill: CLARO },
  ],
});

export const ILUSTRACOES_PETS = Object.freeze({
  'pet-cao-rosto': caoRosto,
  'pet-cao-sentado': caoSentado,
  'pet-ossinho': ossinho,
  'pet-casinha': casinha,
  'pet-gato-rosto': gatoRosto,
  'pet-gato-sentado': gatoSentado,
  'pet-novelo': novelo,
  'pet-peixinho': peixinho,
  'pet-patinha': patinha,
  'pet-coracao-pata': coracaoPata,
  'pet-coleira': coleira,
  'pet-potinho': potinho,
  'pet-pegadas': pegadas,
  'pet-arco-folhas': arcoDeFolhas,
  'pet-estrela': estrelaCometa,
  'pet-xicara-pata': xicaraPata,
});

/* ====================================================================================
   Os modelos da coleção.

   A frente da caneca cai em x ≈ 0,19 e o verso em x ≈ 0,81 (`FRENTE` e `VERSO` em modelos.js).
   Cada modelo muda de composição de verdade: muda quantas fotos tem, o formato delas, onde o texto
   fica e qual ilustração manda na cena. Repetir a mesma planta e trocar a frase não é variedade.
   ==================================================================================== */

export const CATEGORIAS_PETS = Object.freeze([
  { id: 'pet-cachorro', grupo: GRUPO, nome: 'Cachorros', descricao: 'Pro cachorro da casa, com foto e nome' },
  { id: 'pet-gato', grupo: GRUPO, nome: 'Gatos', descricao: 'Pro gato que manda em todo mundo' },
  { id: 'pet-saudade', grupo: GRUPO, nome: 'Homenagem ao pet', descricao: 'Pra lembrar de quem deixou saudade' },
  { id: 'pet-tutor', grupo: GRUPO, nome: 'Mãe e pai de pet', descricao: 'Pra quem cria bichinho como filho' },
]);

const enfeitesDePata = { formas: ['pata', 'bolinha'], cores: ['--sand', '--kraft', '--peach'], quantidade: 26, tamanho: [3, 6.5] };
const enfeitesDeCoracao = { formas: ['coracao', 'bolinha'], cores: ['--peach', '--sand', '--sage'], quantidade: 30, tamanho: [3, 7] };
const enfeitesDeFolha = { formas: ['folha', 'bolinha'], cores: ['--sage', '--sand', '--kraft'], quantidade: 24, tamanho: [3, 6.5] };
const enfeitesDeEstrela = { formas: ['estrela', 'bolinha'], cores: ['--sand', '--peach', '--sage'], quantidade: 28, tamanho: [2.5, 6] };

export const MODELOS_PETS = [
  /* ---------- cachorros ---------- */
  {
    id: 'pet-cao-melhor-amigo', categoria: 'pet-cachorro', nome: 'Meu melhor amigo',
    descricao: 'Foto redonda na frente, o cachorro sentado no verso e o nome no meio',
    fundo: '--paper', semente: 501, enfeites: enfeitesDePata,
    camadas: [
      ilustra('i1', 'Cachorro sentado', 'pet-cao-sentado', 0.81, 0.46, 0.62, '--kraft'),
      ilustra('i2', 'Pegadas', 'pet-pegadas', 0.5, 0.82, 0.26, '--kraft'),
      fotoRedonda('a', 'Foto do bichinho', 0.19, 0.42, 0.185),
      frase('f1', 'Nome do pet', 'Nina', 0.5, 0.36, 12, { fonte: 'Fredoka', cor: '--ink', largura: 0.22 }),
      frase('f2', 'Frase', 'meu melhor amigo', 0.5, 0.55, 7, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.24 }),
    ],
  },
  {
    id: 'pet-cao-coracao', categoria: 'pet-cachorro', nome: 'Coração de quatro patas',
    descricao: 'Foto em coração no meio, com osso, coleira e uma frase curta',
    fundo: '--white', semente: 502, enfeites: enfeitesDeCoracao,
    camadas: [
      ilustra('i1', 'Coração com patinha', 'pet-coracao-pata', 0.19, 0.42, 0.46, '--peach'),
      ilustra('i2', 'Coleira', 'pet-coleira', 0.81, 0.62, 0.34, '--peach-ink'),
      ilustra('i3', 'Ossinho', 'pet-ossinho', 0.5, 0.86, 0.16, '--kraft'),
      foto('a', 'Foto do bichinho', 'coracao', 0.5, 0.40, 0.2, 0.52),
      frase('f1', 'Nome do pet', 'Thor', 0.81, 0.3, 11, { fonte: 'Fredoka', cor: '--ink', largura: 0.22 }),
      frase('f2', 'Frase', 'dono do meu coração', 0.81, 0.43, 6, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.26 }),
    ],
  },
  {
    id: 'pet-cao-companhia', categoria: 'pet-cachorro', nome: 'Duas fotos, um capeta',
    descricao: 'Duas fotos lado a lado, a casinha e uma frase de quem entende',
    fundo: '--cream', semente: 503, enfeites: enfeitesDePata,
    camadas: [
      ilustra('i1', 'Casinha', 'pet-casinha', 0.79, 0.4, 0.54, '--peach'),
      ilustra('i2', 'Ossinho', 'pet-ossinho', 0.79, 0.78, 0.2, '--kraft'),
      ilustra('i3', 'Patinha', 'pet-patinha', 0.5, 0.82, 0.16, '--kraft'),
      foto('a', 'Primeira foto', 'arredondado', 0.16, 0.4, 0.18, 0.54),
      foto('b', 'Segunda foto', 'arredondado', 0.38, 0.4, 0.18, 0.54),
      frase('f1', 'Frase', 'ele destrói tudo e eu amo mesmo assim', 0.27, 0.83, 7.5, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.32 }),
      frase('f2', 'Nome do pet', 'Bento', 0.58, 0.38, 11, { fonte: 'Fredoka', cor: '--ink', largura: 0.14 }),
    ],
  },
  {
    id: 'pet-cao-ficha', categoria: 'pet-cachorro', nome: 'A ficha do cachorro',
    descricao: 'Rosto do cão, foto e os dados do bichinho em linhas curtas',
    fundo: '--paper', semente: 504, enfeites: enfeitesDePata,
    camadas: [
      ilustra('i1', 'Rosto de cachorro', 'pet-cao-rosto', 0.19, 0.38, 0.44, '--kraft'),
      ilustra('i2', 'Potinho', 'pet-potinho', 0.19, 0.78, 0.18, '--sage'),
      fotoRedonda('a', 'Foto do bichinho', 0.5, 0.42, 0.175),
      frase('f1', 'Nome do pet', 'Amora', 0.81, 0.24, 11, { fonte: 'Fredoka', cor: '--ink', largura: 0.24 }),
      frase('f2', 'Raça', 'vira-lata caramelo', 0.81, 0.44, 6, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.26 }),
      frase('f3', 'Chegada em casa', 'em casa desde 2021', 0.81, 0.58, 6, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.26 }),
      frase('f4', 'Frase', 'o amor da casa', 0.81, 0.74, 7, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.24 }),
    ],
  },

  /* ---------- gatos ---------- */
  {
    id: 'pet-gato-dono', categoria: 'pet-gato', nome: 'Quem manda aqui',
    descricao: 'O gato sentado na frente, a foto no meio e a frase no verso',
    fundo: '--white', semente: 511, enfeites: enfeitesDePata,
    camadas: [
      ilustra('i1', 'Gato sentado', 'pet-gato-sentado', 0.19, 0.5, 0.58, '--sage-deep'),
      ilustra('i2', 'Novelo', 'pet-novelo', 0.36, 0.78, 0.16, '--peach'),
      fotoRedonda('a', 'Foto do gato', 0.53, 0.42, 0.175),
      frase('f1', 'Nome do gato', 'Frida', 0.81, 0.32, 12, { fonte: 'Fredoka', cor: '--ink', largura: 0.22 }),
      frase('f2', 'Frase', 'a dona da casa', 0.81, 0.5, 7, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.24 }),
    ],
  },
  {
    id: 'pet-gato-bigodes', categoria: 'pet-gato', nome: 'Cara de poucos amigos',
    descricao: 'Rosto de gato grande, foto quadrada e uma frase de quem convive',
    fundo: '--cream', semente: 512, enfeites: enfeitesDeCoracao,
    camadas: [
      ilustra('i1', 'Rosto de gato', 'pet-gato-rosto', 0.19, 0.4, 0.5, '--sage-deep'),
      ilustra('i2', 'Peixinho', 'pet-peixinho', 0.19, 0.8, 0.14, '--sage'),
      foto('a', 'Foto do gato', 'arredondado', 0.5, 0.4, 0.19, 0.52),
      frase('f1', 'Nome do gato', 'Mel', 0.81, 0.3, 12, { fonte: 'Fredoka', cor: '--ink', largura: 0.2 }),
      frase('f2', 'Frase', 'me ignora, mas dorme no meu pé', 0.81, 0.52, 6, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.28 }),
      frase('f3', 'Frase', 'todo dia', 0.5, 0.82, 7, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.2 }),
    ],
  },
  {
    id: 'pet-gato-brincadeira', categoria: 'pet-gato', nome: 'Novelo e soneca',
    descricao: 'Duas fotos redondas, novelo e peixinho, com o nome no meio',
    fundo: '--paper', semente: 513, enfeites: enfeitesDePata,
    camadas: [
      ilustra('i1', 'Novelo', 'pet-novelo', 0.09, 0.4, 0.26, '--peach'),
      ilustra('i2', 'Peixinho', 'pet-peixinho', 0.91, 0.4, 0.22, '--sage'),
      ilustra('i3', 'Pegadas', 'pet-pegadas', 0.5, 0.84, 0.22, '--kraft'),
      fotoRedonda('a', 'Primeira foto', 0.29, 0.4, 0.15),
      fotoRedonda('b', 'Segunda foto', 0.71, 0.4, 0.15),
      frase('f1', 'Nome do gato', 'Simba', 0.5, 0.34, 11, { fonte: 'Fredoka', cor: '--ink', largura: 0.18 }),
      frase('f2', 'Frase', 'dorme o dia todo', 0.5, 0.52, 6, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.2 }),
    ],
  },
  {
    id: 'pet-gato-ficha', categoria: 'pet-gato', nome: 'A ficha do gato',
    descricao: 'Foto em coração, coleira e os dados do bichinho',
    fundo: '--white', semente: 514, enfeites: enfeitesDeCoracao,
    camadas: [
      ilustra('i1', 'Gato sentado', 'pet-gato-sentado', 0.87, 0.47, 0.52, '--sage-deep'),
      ilustra('i2', 'Coleira', 'pet-coleira', 0.19, 0.78, 0.26, '--peach-ink'),
      foto('a', 'Foto do gato', 'coracao', 0.19, 0.36, 0.19, 0.5),
      frase('f1', 'Nome do gato', 'Luna', 0.52, 0.26, 11, { fonte: 'Fredoka', cor: '--ink', largura: 0.24 }),
      frase('f2', 'Idade', '3 anos de reinado', 0.52, 0.44, 6, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.26 }),
      frase('f3', 'Frase', 'come, dorme, reclama', 0.52, 0.58, 6, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.26 }),
      frase('f4', 'Frase', 'e é perfeita', 0.52, 0.76, 7.5, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.22 }),
    ],
  },

  /* ---------- homenagem ---------- */
  {
    id: 'pet-saudade-coroa', categoria: 'pet-saudade', nome: 'Pra sempre em casa',
    descricao: 'A foto dentro da coroa de folhas, com o nome e os anos',
    fundo: '--paper', semente: 521, enfeites: enfeitesDeFolha,
    camadas: [
      ilustra('i1', 'Coroa de folhas', 'pet-arco-folhas', 0.19, 0.42, 0.78, '--sage-deep'),
      ilustra('i2', 'Patinha', 'pet-patinha', 0.5, 0.3, 0.12, '--sand'),
      fotoRedonda('a', 'Foto do bichinho', 0.19, 0.42, 0.135),
      frase('f1', 'Nome do pet', 'Mel', 0.72, 0.34, 12, { fonte: 'Fredoka', cor: '--ink', largura: 0.22 }),
      frase('f2', 'Anos', '2012 — 2025', 0.72, 0.5, 6, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.22 }),
      frase('f3', 'Frase', 'treze anos de festa na porta', 0.5, 0.78, 6.5, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.34 }),
    ],
  },
  {
    id: 'pet-saudade-estrela', categoria: 'pet-saudade', nome: 'Virou estrela',
    descricao: 'A estrela com rastro, a foto e uma frase de despedida',
    fundo: '--cream', semente: 522, enfeites: enfeitesDeEstrela,
    camadas: [
      ilustra('i1', 'Estrela com rastro', 'pet-estrela', 0.81, 0.34, 0.42, '--hand-ink'),
      ilustra('i2', 'Pegadas', 'pet-pegadas', 0.81, 0.74, 0.2, '--kraft'),
      fotoRedonda('a', 'Foto do bichinho', 0.19, 0.42, 0.185),
      frase('f1', 'Nome do pet', 'Bidu', 0.5, 0.34, 11, { fonte: 'Fredoka', cor: '--ink', largura: 0.2 }),
      frase('f2', 'Frase', 'agora brilha lá de cima', 0.5, 0.54, 6, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.24 }),
      frase('f3', 'Frase', 'e continua sendo meu', 0.5, 0.74, 7, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.24 }),
    ],
  },
  {
    id: 'pet-saudade-pegadas', categoria: 'pet-saudade', nome: 'Pegadas no coração',
    descricao: 'Pegadas atravessando a peça, com duas fotos e a frase',
    fundo: '--white', semente: 523, enfeites: enfeitesDeFolha,
    camadas: [
      ilustra('i1', 'Pegadas', 'pet-pegadas', 0.5, 0.16, 0.36, '--kraft'),
      ilustra('i2', 'Pegadas', 'pet-pegadas', 0.5, 0.88, 0.3, '--sand'),
      ilustra('i3', 'Coração com patinha', 'pet-coracao-pata', 0.5, 0.44, 0.34, '--peach'),
      foto('a', 'Primeira foto', 'arredondado', 0.19, 0.46, 0.18, 0.52),
      foto('b', 'Segunda foto', 'arredondado', 0.81, 0.46, 0.18, 0.52),
      frase('f1', 'Frase', 'você deixou pegadas aqui dentro', 0.5, 0.7, 6.5, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.24 }),
    ],
  },
  {
    id: 'pet-saudade-nome', categoria: 'pet-saudade', nome: 'O nome que a gente não esquece',
    descricao: 'O nome grande, a foto em coração e a coleira pendurada',
    fundo: '--paper', semente: 524, enfeites: enfeitesDeCoracao,
    camadas: [
      ilustra('i1', 'Coleira', 'pet-coleira', 0.19, 0.44, 0.4, '--peach-ink'),
      ilustra('i2', 'Patinha', 'pet-patinha', 0.35, 0.8, 0.14, '--sand'),
      ilustra('i3', 'Coroa de folhas', 'pet-arco-folhas', 0.81, 0.44, 0.6, '--sage-deep'),
      foto('a', 'Foto do bichinho', 'coracao', 0.81, 0.42, 0.15, 0.4),
      frase('f1', 'Nome do pet', 'Lola', 0.5, 0.4, 16, { fonte: 'Fredoka', cor: '--ink', largura: 0.22 }),
      frase('f2', 'Frase', 'sempre a melhor parte do dia', 0.5, 0.62, 5.5, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.26 }),
    ],
  },

  /* ---------- mãe e pai de pet ---------- */
  {
    id: 'pet-tutor-mae', categoria: 'pet-tutor', nome: 'Mãe de pet',
    descricao: 'A xícara com patinha, a foto de vocês dois e o título',
    fundo: '--white', semente: 531, enfeites: enfeitesDeCoracao,
    camadas: [
      ilustra('i1', 'Xícara com patinha', 'pet-xicara-pata', 0.19, 0.42, 0.44, '--peach'),
      ilustra('i2', 'Patinha', 'pet-patinha', 0.35, 0.78, 0.13, '--kraft'),
      foto('a', 'Foto de vocês', 'arredondado', 0.53, 0.42, 0.18, 0.52),
      frase('f1', 'Título', 'mãe de pet', 0.81, 0.32, 12, { fonte: 'Fredoka', cor: '--ink', largura: 0.24 }),
      frase('f2', 'Nome', 'da Nina e do Thor', 0.81, 0.5, 6, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.26 }),
      frase('f3', 'Frase', 'e muito orgulhosa', 0.81, 0.68, 7, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.24 }),
    ],
  },
  {
    id: 'pet-tutor-pai', categoria: 'pet-tutor', nome: 'Pai de pet',
    descricao: 'Cachorro e gato dos dois lados, a foto no meio e o título',
    fundo: '--cream', semente: 532, enfeites: enfeitesDePata,
    camadas: [
      ilustra('i1', 'Rosto de cachorro', 'pet-cao-rosto', 0.13, 0.42, 0.38, '--kraft'),
      ilustra('i2', 'Rosto de gato', 'pet-gato-rosto', 0.87, 0.42, 0.34, '--sage-deep'),
      fotoRedonda('a', 'Foto de vocês', 0.5, 0.38, 0.165),
      frase('f1', 'Título', 'pai de pet', 0.5, 0.66, 11, { fonte: 'Fredoka', cor: '--ink', largura: 0.22 }),
      frase('f2', 'Frase', 'dois filhos, quatro patas cada', 0.5, 0.82, 5.5, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.3 }),
    ],
  },
  {
    id: 'pet-tutor-familia', categoria: 'pet-tutor', nome: 'A família toda',
    descricao: 'Três fotos em fila, o coração com patinha e a frase da casa',
    fundo: '--paper', semente: 533, enfeites: enfeitesDeCoracao,
    camadas: [
      ilustra('i1', 'Coração com patinha', 'pet-coracao-pata', 0.5, 0.82, 0.2, '--peach'),
      ilustra('i2', 'Patinha', 'pet-patinha', 0.06, 0.4, 0.18, '--kraft'),
      ilustra('i3', 'Patinha', 'pet-patinha', 0.94, 0.4, 0.18, '--kraft'),
      fotoRedonda('a', 'Primeira foto', 0.22, 0.38, 0.14),
      fotoRedonda('b', 'Segunda foto', 0.5, 0.38, 0.14),
      fotoRedonda('c', 'Terceira foto', 0.78, 0.38, 0.14),
      frase('f1', 'Frase', 'a minha família tem quatro patas', 0.28, 0.72, 6, { fonte: 'Nunito', cor: '--ink', largura: 0.3 }),
      frase('f2', 'Sobrenome', 'família Borges', 0.75, 0.72, 7, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.24 }),
    ],
  },
  {
    id: 'pet-tutor-rotina', categoria: 'pet-tutor', nome: 'Café, passeio, repete',
    descricao: 'A rotina de quem tem bichinho, com potinho, coleira e uma foto',
    fundo: '--white', semente: 534, enfeites: enfeitesDeEstrela,
    camadas: [
      ilustra('i1', 'Potinho', 'pet-potinho', 0.14, 0.3, 0.32, '--sage'),
      ilustra('i2', 'Coleira', 'pet-coleira', 0.14, 0.66, 0.34, '--peach-ink'),
      ilustra('i3', 'Xícara com patinha', 'pet-xicara-pata', 0.86, 0.44, 0.44, '--peach'),
      foto('a', 'Foto do bichinho', 'arredondado', 0.42, 0.42, 0.18, 0.52),
      frase('f1', 'Frase', 'café primeiro', 0.62, 0.3, 9, { fonte: 'Fredoka', cor: '--ink', largura: 0.2 }),
      frase('f2', 'Frase', 'depois o passeio', 0.62, 0.46, 9, { fonte: 'Fredoka', cor: '--ink', largura: 0.2 }),
      frase('f3', 'Frase', 'todo santo dia', 0.5, 0.8, 7, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.24 }),
    ],
  },
];
