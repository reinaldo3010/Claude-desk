/*
  Coleção "Datas comemorativas": Natal, Dia das Mães, Dia dos Pais, Namorados, Professores e Páscoa.

  As ilustrações seguem a seção 9.1 do manual: desenhadas por curvas, cor só por token, uma tinta
  principal que a pessoa troca. O vocabulário está em `desenho.js`, que mede e centra sozinho.

  Este arquivo reforça um grupo que já existia com uma arte por data. Os seis modelos antigos
  continuam no lugar, em `modelos.js`; aqui entram os que faltavam para cada data ter quatro.
*/
import { ilustracao } from './desenho.js';
import { foto, fotoRedonda, frase, ilustra } from './camadas.js';

const ESCURO = '--ink';
const CLARO = '--white';
const GRUPO = 'Datas comemorativas';

/* ---------- Natal ---------- */
const arvore = ilustracao({
  primary: '--sage-deep',
  partes: [
    { d: 'M 0 -46 L 20 -14 L -20 -14 Z', fill: '--sage-deep', stroke: ESCURO, w: 2.6 },
    { d: 'M 0 -28 L 29 10 L -29 10 Z', fill: '--sage-deep', stroke: ESCURO, w: 2.6 },
    { d: 'M 0 -8 L 38 34 L -38 34 Z', fill: '--sage-deep', stroke: ESCURO, w: 2.6 },
    { retangulo: [-7, 34, 14, 14, 2], fill: '--kraft', stroke: ESCURO, w: 2.6 },
    { d: 'M 0 -62 L 4 -52 L 15 -50 L 7 -43 L 9 -32 L 0 -38 L -9 -32 L -7 -43 L -15 -50 L -4 -52 Z',
      fill: '--hand-ink', stroke: ESCURO, w: 2.2 },
    { circulo: [-12, 0, 4], fill: '--peach' },
    { circulo: [14, 4, 4], fill: '--peach' },
    { circulo: [-20, 24, 4], fill: '--peach' },
    { circulo: [8, 26, 4], fill: '--peach' },
    { circulo: [2, -18, 3.4], fill: '--peach' },
  ],
});

const meiaDeNatal = ilustracao({
  primary: '--hand-ink',
  partes: [
    { d: 'M -18 -22 L 18 -22 L 18 10 C 18 24 30 22 36 32 C 40 40 32 46 20 46 C 2 46 -18 38 -18 20 Z',
      fill: '--hand-ink', stroke: ESCURO, w: 2.8 },
    { retangulo: [-23, -34, 46, 15, 5], fill: CLARO, stroke: ESCURO, w: 2.6 },
    { d: 'M -12 6 C -2 0 8 0 16 6', stroke: CLARO, w: 3 },
  ],
});

const bonecoDeNeve = ilustracao({
  primary: CLARO,
  partes: [
    { circulo: [0, 22, 24], fill: CLARO, stroke: ESCURO, w: 2.8 },
    { circulo: [0, -8, 17], fill: CLARO, stroke: ESCURO, w: 2.8 },
    { d: 'M -18 -18 C -8 -24 8 -24 18 -18 L 18 -14 C 8 -20 -8 -20 -18 -14 Z', fill: '--hand-ink', stroke: ESCURO, w: 2 },
    { retangulo: [-11, -42, 22, 24, 3], fill: ESCURO },
    { retangulo: [-18, -22, 36, 6, 3], fill: ESCURO },
    { circulo: [-6, -12, 2.6], fill: ESCURO },
    { circulo: [6, -12, 2.6], fill: ESCURO },
    { d: 'M 0 -7 L 13 -4 L 0 -1 Z', fill: '--peach', stroke: ESCURO, w: 1.6 },
    { circulo: [0, 14, 2.6], fill: ESCURO },
    { circulo: [0, 24, 2.6], fill: ESCURO },
    { d: 'M -20 12 L -38 0 M -30 6 L -36 -4 M -30 6 L -40 6', stroke: '--kraft', w: 3.4 },
    { d: 'M 20 12 L 38 0 M 30 6 L 36 -4 M 30 6 L 40 6', stroke: '--kraft', w: 3.4 },
  ],
});

const presente = ilustracao({
  primary: '--peach',
  partes: [
    { retangulo: [-30, -10, 60, 44, 4], fill: '--peach', stroke: ESCURO, w: 2.8 },
    { retangulo: [-34, -22, 68, 14, 4], fill: '--peach', stroke: ESCURO, w: 2.8 },
    { retangulo: [-6, -22, 12, 56, 0], fill: '--sand', stroke: ESCURO, w: 2.2 },
    { d: 'M -2 -24 C -22 -28 -24 -44 -12 -44 C -3 -44 -1 -32 0 -24 Z', fill: '--sand', stroke: ESCURO, w: 2.4 },
    { d: 'M 2 -24 C 22 -28 24 -44 12 -44 C 3 -44 1 -32 0 -24 Z', fill: '--sand', stroke: ESCURO, w: 2.4 },
  ],
});

const guirlanda = ilustracao({
  primary: '--sage-deep',
  partes: [
    ...Array.from({ length: 13 }, (naoUsado, i) => {
      const a = (i / 13) * Math.PI * 2 + 0.24;
      return { elipse: [Math.cos(a) * 44, Math.sin(a) * 44, 15, 7, (a * 180 / Math.PI) + (i % 2 ? 58 : 122)],
        fill: '--sage-deep', stroke: ESCURO, w: 1.6 };
    }),
    { circulo: [-18, 34, 4], fill: '--peach' },
    { circulo: [20, 32, 4], fill: '--peach' },
    { circulo: [-38, -14, 4], fill: '--peach' },
    { circulo: [36, -20, 4], fill: '--peach' },
    { d: 'M -2 -54 C -22 -58 -24 -72 -12 -72 C -3 -72 -1 -62 0 -54 Z', fill: '--hand-ink', stroke: ESCURO, w: 2.2 },
    { d: 'M 2 -54 C 22 -58 24 -72 12 -72 C 3 -72 1 -62 0 -54 Z', fill: '--hand-ink', stroke: ESCURO, w: 2.2 },
    { circulo: [0, -54, 5], fill: '--hand-ink', stroke: ESCURO, w: 2 },
  ],
});

/* ---------- Dia das Mães ---------- */
const buque = ilustracao({
  primary: '--peach',
  partes: [
    { d: 'M -14 22 L 14 22 L 22 50 L -22 50 Z', fill: '--kraft', stroke: ESCURO, w: 2.6 },
    { d: 'M -8 22 L -14 -8', stroke: '--sage-deep', w: 3 },
    { d: 'M 0 22 L 0 -18', stroke: '--sage-deep', w: 3 },
    { d: 'M 8 22 L 15 -6', stroke: '--sage-deep', w: 3 },
    { elipse: [-24, 6, 9, 5, -30], fill: '--sage' },
    { elipse: [22, 8, 9, 5, 30], fill: '--sage' },
    ...[[-14, -14], [0, -26], [15, -12]].flatMap(([cx, cy]) => [
      ...Array.from({ length: 6 }, (naoUsado, i) => {
        const a = (i / 6) * Math.PI * 2;
        return { elipse: [cx + Math.cos(a) * 8, cy + Math.sin(a) * 8, 6.5, 6.5], fill: '--peach', stroke: ESCURO, w: 1.6 };
      }),
      { circulo: [cx, cy, 5], fill: '--sand', stroke: ESCURO, w: 1.6 },
    ]),
  ],
});

const molduraDeCoracao = ilustracao({
  primary: '--peach',
  partes: [
    { d: 'M 0 52 C -40 24 -54 8 -54 -12 C -54 -32 -38 -44 -22 -44 C -11 -44 -4 -38 0 -30 '
       + 'C 4 -38 11 -44 22 -44 C 38 -44 54 -32 54 -12 C 54 8 40 24 0 52 Z',
      fill: '--peach', stroke: ESCURO, w: 3 },
    { d: 'M 0 38 C -30 18 -41 5 -41 -11 C -41 -25 -29 -33 -18 -33 C -9 -33 -3 -28 0 -22 '
       + 'C 3 -28 9 -33 18 -33 C 29 -33 41 -25 41 -11 C 41 5 30 18 0 38 Z',
      fill: CLARO, stroke: ESCURO, w: 2 },
  ],
});

const xicaraComFlor = ilustracao({
  primary: '--sand',
  partes: [
    { d: 'M -32 -18 L 26 -18 L 21 26 C 20 34 14 38 -3 38 C -20 38 -26 34 -27 26 Z',
      fill: '--sand', stroke: ESCURO, w: 2.8 },
    { d: 'M 26 -8 C 44 -8 48 14 27 18', stroke: ESCURO, w: 5 },
    { d: 'M -32 -18 L 26 -18', stroke: ESCURO, w: 2.8 },
    ...Array.from({ length: 6 }, (naoUsado, i) => {
      const a = (i / 6) * Math.PI * 2;
      return { elipse: [-3 + Math.cos(a) * 9, 8 + Math.sin(a) * 9, 7, 7], fill: '--peach', stroke: ESCURO, w: 1.6 };
    }),
    { circulo: [-3, 8, 5.5], fill: CLARO, stroke: ESCURO, w: 1.6 },
    { d: 'M -10 -24 C -18 -32 -2 -38 -10 -48', stroke: '--sage-deep', w: 2.6 },
    { d: 'M 8 -24 C 0 -32 16 -38 8 -48', stroke: '--sage-deep', w: 2.6 },
  ],
});

/* ---------- Dia dos Pais ---------- */
const gravata = ilustracao({
  primary: '--hand-ink',
  partes: [
    { d: 'M -14 -44 L 14 -44 L 20 -30 L 0 -18 L -20 -30 Z', fill: '--hand-ink', stroke: ESCURO, w: 2.6 },
    { d: 'M 0 -18 L 14 -26 L 20 22 C 20 42 -20 42 -20 22 L -14 -26 Z', fill: '--hand-ink', stroke: ESCURO, w: 2.8 },
    { d: 'M -10 -6 L 12 -12', stroke: CLARO, w: 2.6 },
    { d: 'M -14 12 L 15 4', stroke: CLARO, w: 2.6 },
  ],
});

const oculosBigode = ilustracao({
  primary: ESCURO,
  partes: [
    { circulo: [-22, -14, 15], fill: null, stroke: ESCURO, w: 3.4 },
    { circulo: [22, -14, 15], fill: null, stroke: ESCURO, w: 3.4 },
    { d: 'M -7 -16 C -3 -21 3 -21 7 -16', stroke: ESCURO, w: 3 },
    { d: 'M -37 -18 L -48 -24', stroke: ESCURO, w: 3 },
    { d: 'M 37 -18 L 48 -24', stroke: ESCURO, w: 3 },
    { d: 'M 0 14 C -6 8 -18 6 -30 10 C -42 14 -44 26 -34 28 C -20 30 -8 24 0 16 '
       + 'C 8 24 20 30 34 28 C 44 26 42 14 30 10 C 18 6 6 8 0 14 Z',
      fill: ESCURO },
  ],
});

const martelo = ilustracao({
  primary: '--kraft',
  partes: [
    // cabo
    { retangulo: [-7, -12, 14, 56, 5], fill: '--kraft', stroke: ESCURO, w: 2.6 },
    // cabeça: bloco de um lado, unha do outro
    { d: 'M -34 -34 C -22 -40 22 -40 30 -34 L 30 -14 C 22 -8 -22 -8 -34 -14 '
       + 'C -40 -18 -42 -28 -38 -32 C -34 -28 -34 -22 -34 -14 Z',
      fill: '--sand', stroke: ESCURO, w: 2.6 },
    { d: 'M 14 -34 L 14 -12', stroke: ESCURO, w: 2.2 },
    { d: 'M -6 6 L 6 6', stroke: ESCURO, w: 2 },
    { d: 'M -6 20 L 6 20', stroke: ESCURO, w: 2 },
  ],
});

const churrasqueira = ilustracao({
  primary: '--sage-deep',
  partes: [
    { d: 'M -34 -6 C -34 22 -20 34 0 34 C 20 34 34 22 34 -6 Z', fill: '--sage-deep', stroke: ESCURO, w: 2.8 },
    { d: 'M -40 -6 L 40 -6', stroke: ESCURO, w: 3.4 },
    { d: 'M -20 34 L -28 50', stroke: ESCURO, w: 3.4 },
    { d: 'M 20 34 L 28 50', stroke: ESCURO, w: 3.4 },
    { d: 'M -14 -16 C -20 -26 -12 -30 -14 -40', stroke: '--peach', w: 3 },
    { d: 'M 2 -18 C -4 -30 4 -34 2 -46', stroke: '--peach', w: 3 },
    { d: 'M 16 -16 C 10 -26 18 -30 16 -40', stroke: '--peach', w: 3 },
  ],
});

/* ---------- Namorados ---------- */
const coracoesLigados = ilustracao({
  primary: '--peach',
  partes: [
    { d: 'M -14 30 C -44 10 -54 -2 -54 -16 C -54 -30 -42 -38 -30 -38 C -22 -38 -17 -33 -14 -27 '
       + 'C -11 -33 -6 -38 2 -38 C 14 -38 26 -30 26 -16 C 26 -2 16 10 -14 30 Z',
      fill: '--peach', stroke: ESCURO, w: 2.8 },
    { d: 'M 16 38 C -8 22 -16 12 -16 0 C -16 -12 -6 -19 4 -19 C 11 -19 15 -15 16 -10 '
       + 'C 17 -15 21 -19 28 -19 C 38 -19 48 -12 48 0 C 48 12 40 22 16 38 Z',
      fill: '--hand-ink', stroke: ESCURO, w: 2.8 },
  ],
});

const balaoDeCoracao = ilustracao({
  primary: '--peach',
  partes: [
    { d: 'M 0 6 C -26 -12 -34 -22 -34 -34 C -34 -48 -22 -56 -12 -56 C -5 -56 -2 -51 0 -46 '
       + 'C 2 -51 5 -56 12 -56 C 22 -56 34 -48 34 -34 C 34 -22 26 -12 0 6 Z',
      fill: '--peach', stroke: ESCURO, w: 2.8 },
    { d: 'M -5 6 L 0 14 L 5 6 Z', fill: '--peach', stroke: ESCURO, w: 2 },
    { d: 'M 0 14 C 10 24 -10 34 0 44 C 8 52 2 56 0 58', stroke: ESCURO, w: 2 },
  ],
});

const canecasDoCasal = ilustracao({
  primary: '--peach',
  partes: [
    { d: 'M -46 -14 L -10 -14 L -13 22 C -14 30 -18 33 -28 33 C -38 33 -43 30 -44 22 Z',
      fill: '--peach', stroke: ESCURO, w: 2.6 },
    { d: 'M -46 -14 C -58 -14 -60 4 -46 6', stroke: ESCURO, w: 4 },
    { d: 'M 10 -14 L 46 -14 L 43 22 C 42 30 38 33 28 33 C 18 33 14 30 13 22 Z',
      fill: '--sage', stroke: ESCURO, w: 2.6 },
    { d: 'M 46 -14 C 58 -14 60 4 46 6', stroke: ESCURO, w: 4 },
    { d: 'M 0 -18 C -9 -24 -14 -30 -14 -36 C -14 -43 -8 -46 -4 -46 C -2 -46 0 -44 0 -42 '
       + 'C 0 -44 2 -46 4 -46 C 8 -46 14 -43 14 -36 C 14 -30 9 -24 0 -18 Z',
      fill: '--hand-ink', stroke: ESCURO, w: 2.2 },
  ],
});

const cadeadoDeAmor = ilustracao({
  primary: '--kraft',
  partes: [
    { d: 'M -16 -10 L -16 -26 C -16 -38 16 -38 16 -26 L 16 -10', stroke: ESCURO, w: 5 },
    { retangulo: [-26, -10, 52, 44, 6], fill: '--kraft', stroke: ESCURO, w: 2.8 },
    { d: 'M 0 22 C -12 12 -16 6 -16 0 C -16 -6 -11 -9 -7 -9 C -4 -9 -1 -7 0 -4 '
       + 'C 1 -7 4 -9 7 -9 C 11 -9 16 -6 16 0 C 16 6 12 12 0 22 Z',
      fill: '--peach', stroke: ESCURO, w: 2 },
  ],
});

/* ---------- Professores ---------- */
const maca = ilustracao({
  primary: '--hand-ink',
  partes: [
    { d: 'M 0 -22 C -8 -32 -26 -30 -30 -14 C -34 4 -24 32 -12 32 C -6 32 -4 29 0 29 '
       + 'C 4 29 6 32 12 32 C 24 32 34 4 30 -14 C 26 -30 8 -32 0 -22 Z',
      fill: '--hand-ink', stroke: ESCURO, w: 2.8 },
    { d: 'M 0 -22 L 0 -36', stroke: ESCURO, w: 3 },
    { d: 'M 2 -32 C 14 -44 26 -40 24 -32 C 22 -24 10 -24 2 -32 Z', fill: '--sage-deep', stroke: ESCURO, w: 2.2 },
    { d: 'M -18 -12 C -22 -6 -22 4 -19 12', stroke: CLARO, w: 3 },
  ],
});

const livros = ilustracao({
  primary: '--sage-deep',
  partes: [
    { retangulo: [-34, 12, 68, 16, 3], fill: '--sage-deep', stroke: ESCURO, w: 2.6 },
    { retangulo: [-30, -4, 62, 16, 3], fill: '--peach', stroke: ESCURO, w: 2.6 },
    { retangulo: [-26, -20, 56, 16, 3], fill: '--kraft', stroke: ESCURO, w: 2.6 },
    { d: 'M -20 12 L -20 28', stroke: ESCURO, w: 2 },
    { d: 'M -16 -4 L -16 12', stroke: ESCURO, w: 2 },
    { d: 'M -12 -20 L -12 -4', stroke: ESCURO, w: 2 },
    { d: 'M 8 -20 L 8 2 L 14 -4 L 20 2 L 20 -20 Z', fill: '--hand-ink', stroke: ESCURO, w: 2.2 },
  ],
});

const lapis = ilustracao({
  primary: '--peach',
  partes: [
    { d: 'M -8 -44 L 8 -44 L 8 24 L 0 38 L -8 24 Z', fill: '--peach', stroke: ESCURO, w: 2.6 },
    { d: 'M -8 18 L 8 18', stroke: ESCURO, w: 2.2 },
    { d: 'M -4 30 L 0 38 L 4 30 Z', fill: ESCURO },
    { retangulo: [-8, -52, 16, 10, 2], fill: '--sand', stroke: ESCURO, w: 2.4 },
    { d: 'M -8 -30 L 8 -30', stroke: ESCURO, w: 2.2 },
  ],
});

const quadroNegro = ilustracao({
  primary: '--sage-deep',
  partes: [
    { retangulo: [-46, -34, 92, 60, 4], fill: '--sage-deep', stroke: ESCURO, w: 2.8 },
    { retangulo: [-50, 26, 100, 8, 3], fill: '--kraft', stroke: ESCURO, w: 2.4 },
    { d: 'M -30 -16 L -14 -16', stroke: CLARO, w: 3 },
    { d: 'M -30 -4 L 4 -4', stroke: CLARO, w: 3 },
    { d: 'M -30 8 L -6 8', stroke: CLARO, w: 3 },
    { d: 'M 25 14 C 13 4 9 -2 9 -8 C 9 -15 14 -18 18 -18 C 21 -18 24 -16 25 -13 '
       + 'C 26 -16 29 -18 32 -18 C 36 -18 41 -15 41 -8 C 41 -2 37 4 25 14 Z', fill: '--peach' },
  ],
});

/* ---------- Páscoa ---------- */
const coelho = ilustracao({
  primary: CLARO,
  partes: [
    { elipse: [-13, -38, 8, 24, -8], fill: CLARO, stroke: ESCURO, w: 2.6 },
    { elipse: [13, -38, 8, 24, 8], fill: CLARO, stroke: ESCURO, w: 2.6 },
    { elipse: [-13, -38, 4, 16, -8], fill: '--peach' },
    { elipse: [13, -38, 4, 16, 8], fill: '--peach' },
    { elipse: [0, 2, 26, 22], fill: CLARO, stroke: ESCURO, w: 2.8 },
    { circulo: [-10, -2, 3.4], fill: ESCURO },
    { circulo: [10, -2, 3.4], fill: ESCURO },
    { d: 'M -4 8 C -4 5 4 5 4 8 C 4 11 1 13 0 13 C -1 13 -4 11 -4 8 Z', fill: '--peach', stroke: ESCURO, w: 1.6 },
    { d: 'M 0 13 C 0 18 -6 19 -8 16', stroke: ESCURO, w: 2 },
    { d: 'M 0 13 C 0 18 6 19 8 16', stroke: ESCURO, w: 2 },
    { d: 'M -8 6 L -24 3', stroke: ESCURO, w: 1.6 },
    { d: 'M 8 6 L 24 3', stroke: ESCURO, w: 1.6 },
  ],
});

const ovoDePascoa = ilustracao({
  primary: '--peach',
  partes: [
    { d: 'M 0 -40 C 18 -40 30 -16 30 4 C 30 24 17 38 0 38 C -17 38 -30 24 -30 4 C -30 -16 -18 -40 0 -40 Z',
      fill: '--peach', stroke: ESCURO, w: 2.8 },
    { d: 'M -27 -8 C -16 -16 -8 -2 2 -10 C 12 -18 20 -6 28 -12', stroke: CLARO, w: 3.4 },
    { d: 'M -29 14 C -18 6 -10 20 0 12 C 10 4 20 18 29 10', stroke: CLARO, w: 3.4 },
    { circulo: [-12, 27, 3.4], fill: CLARO },
    { circulo: [4, 30, 3.4], fill: CLARO },
    { circulo: [-4, -26, 3.4], fill: CLARO },
  ],
});

const cestaDePascoa = ilustracao({
  primary: '--kraft',
  partes: [
    { elipse: [-14, -14, 12, 15], fill: '--peach', stroke: ESCURO, w: 2.2 },
    { elipse: [12, -16, 12, 15], fill: '--sage', stroke: ESCURO, w: 2.2 },
    { d: 'M -34 -8 L 34 -8 L 26 30 C 25 36 20 38 0 38 C -20 38 -25 36 -26 30 Z',
      fill: '--kraft', stroke: ESCURO, w: 2.8 },
    { d: 'M -34 -8 L 34 -8', stroke: ESCURO, w: 2.8 },
    { d: 'M -22 -8 C -22 -34 22 -34 22 -8', stroke: '--kraft', w: 5 },
    { d: 'M -20 4 L 20 4', stroke: ESCURO, w: 2 },
    { d: 'M -22 18 L 22 18', stroke: ESCURO, w: 2 },
  ],
});

const cenoura = ilustracao({
  primary: '--peach-deep',
  partes: [
    { d: 'M -14 -18 L 14 -18 L 0 44 Z', fill: '--peach-deep', stroke: ESCURO, w: 2.6 },
    { d: 'M -8 -2 L 6 -6', stroke: '--sand', w: 2.4 },
    { d: 'M -4 12 L 6 8', stroke: '--sand', w: 2.4 },
    { d: 'M -4 -20 C -16 -34 -10 -44 -2 -40 C -2 -32 -2 -26 -2 -20 Z', fill: '--sage-deep', stroke: ESCURO, w: 2.2 },
    { d: 'M 2 -20 C 2 -36 10 -44 16 -38 C 14 -30 8 -24 2 -20 Z', fill: '--sage-deep', stroke: ESCURO, w: 2.2 },
  ],
});

export const ILUSTRACOES_DATAS = Object.freeze({
  'data-arvore': arvore,
  'data-meia': meiaDeNatal,
  'data-boneco-neve': bonecoDeNeve,
  'data-presente': presente,
  'data-guirlanda': guirlanda,
  'data-buque': buque,
  'data-moldura-coracao': molduraDeCoracao,
  'data-xicara-flor': xicaraComFlor,
  'data-gravata': gravata,
  'data-oculos-bigode': oculosBigode,
  'data-martelo': martelo,
  'data-churrasqueira': churrasqueira,
  'data-coracoes-ligados': coracoesLigados,
  'data-balao-coracao': balaoDeCoracao,
  'data-canecas-casal': canecasDoCasal,
  'data-cadeado': cadeadoDeAmor,
  'data-maca': maca,
  'data-livros': livros,
  'data-lapis': lapis,
  'data-quadro': quadroNegro,
  'data-coelho': coelho,
  'data-ovo': ovoDePascoa,
  'data-cesta': cestaDePascoa,
  'data-cenoura': cenoura,
});

/** A Páscoa é a única data que faltava no seletor; as outras cinco já existiam com uma arte cada. */
export const CATEGORIAS_DATAS = Object.freeze([
  { id: 'pascoa', grupo: GRUPO, nome: 'Páscoa', descricao: 'Coelho, ovo e cesta, com foto e nome' },
]);

/* ====================================================================================
   Os modelos que faltavam. Cada data tinha uma arte só; com estes, cada uma tem quatro.
   A frente da caneca cai em x ≈ 0,19 e o verso em x ≈ 0,81.
   ==================================================================================== */

const flocos = { formas: ['floco', 'bolinha'], cores: ['--sand', '--sage', '--kraft'], quantidade: 30, tamanho: [3, 7] };
const azevinho = { formas: ['folha', 'bolinha'], cores: ['--sage', '--peach', '--sand'], quantidade: 28, tamanho: [3, 7] };
const petalas = { formas: ['flor', 'bolinha'], cores: ['--peach', '--sand', '--sage'], quantidade: 28, tamanho: [3, 7] };
const estrelinhas = { formas: ['estrela', 'bolinha'], cores: ['--sand', '--kraft', '--sage'], quantidade: 26, tamanho: [2.5, 6.5] };
const coracoes = { formas: ['coracao', 'bolinha'], cores: ['--peach', '--peach-deep', '--sand'], quantidade: 34, tamanho: [3, 7.5] };
const confetes = { formas: ['confete', 'bolinha'], cores: ['--peach', '--sage', '--kraft'], quantidade: 30, tamanho: [3, 7] };

export const MODELOS_DATAS = [
  /* ---------- Natal ---------- */
  {
    id: 'natal-arvore', categoria: 'natal', nome: 'Debaixo da árvore',
    descricao: 'A árvore na frente, a foto no meio e o nome de quem ganha',
    fundo: '--white', semente: 601, enfeites: flocos,
    camadas: [
      ilustra('i1', 'Árvore de Natal', 'data-arvore', 0.19, 0.44, 0.44, '--sage-deep'),
      ilustra('i2', 'Presente', 'data-presente', 0.34, 0.78, 0.22, '--peach'),
      fotoRedonda('a', 'Foto do Natal', 0.5, 0.42, 0.175),
      frase('f1', 'Nome', 'Helena', 0.81, 0.3, 12, { fonte: 'Fredoka', cor: '--ink', largura: 0.22 }),
      frase('f2', 'Frase', 'feliz Natal', 0.81, 0.48, 9, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.22 }),
      frase('f3', 'Ano', '2026', 0.81, 0.66, 6, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.16 }),
    ],
  },
  {
    id: 'natal-guirlanda', categoria: 'natal', nome: 'Guirlanda da família',
    descricao: 'A foto dentro da guirlanda e o sobrenome da casa',
    fundo: '--paper', semente: 602, enfeites: azevinho,
    camadas: [
      ilustra('i1', 'Guirlanda', 'data-guirlanda', 0.19, 0.46, 0.8, '--sage-deep'),
      ilustra('i2', 'Meia de Natal', 'data-meia', 0.56, 0.44, 0.34, '--hand-ink'),
      fotoRedonda('a', 'Foto da família', 0.19, 0.48, 0.125),
      frase('f1', 'Sobrenome', 'os Almeida', 0.82, 0.34, 12, { fonte: 'Fredoka', cor: '--ink', largura: 0.24 }),
      frase('f2', 'Frase', 'juntos de novo neste Natal', 0.82, 0.56, 5.5, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.26 }),
    ],
  },
  {
    id: 'natal-amigo-secreto', categoria: 'natal', nome: 'Amigo secreto',
    descricao: 'Duas fotos, o boneco de neve e um recado curto',
    fundo: '--cream', semente: 603, enfeites: flocos,
    camadas: [
      ilustra('i1', 'Boneco de neve', 'data-boneco-neve', 0.09, 0.42, 0.42, '--white'),
      ilustra('i2', 'Presente', 'data-presente', 0.91, 0.4, 0.34, '--peach'),
      ilustra('i3', 'Meia de Natal', 'data-meia', 0.9, 0.78, 0.2, '--hand-ink'),
      foto('a', 'Primeira foto', 'arredondado', 0.3, 0.4, 0.16, 0.48),
      foto('b', 'Segunda foto', 'arredondado', 0.5, 0.4, 0.16, 0.48),
      frase('f1', 'Recado', 'tirei você e fiquei feliz', 0.4, 0.78, 7, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.3 }),
      frase('f2', 'Nome', 'Rafa', 0.68, 0.4, 10, { fonte: 'Fredoka', cor: '--ink', largura: 0.12 }),
    ],
  },

  /* ---------- Dia das Mães ---------- */
  {
    id: 'maes-buque', categoria: 'maes', nome: 'Um buquê que não murcha',
    descricao: 'O buquê na frente, a foto no meio e a palavra mãe no verso',
    fundo: '--white', semente: 611, enfeites: petalas,
    camadas: [
      ilustra('i1', 'Buquê', 'data-buque', 0.19, 0.44, 0.52, '--peach'),
      ilustra('i2', 'Xícara com flor', 'data-xicara-flor', 0.36, 0.78, 0.22, '--sand'),
      fotoRedonda('a', 'Foto com a mãe', 0.52, 0.42, 0.175),
      frase('f1', 'Título', 'mãe', 0.81, 0.34, 16, { fonte: 'Fredoka', cor: '--ink', largura: 0.18 }),
      frase('f2', 'Frase', 'meu lugar seguro', 0.81, 0.56, 7, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.24 }),
    ],
  },
  {
    id: 'maes-moldura', categoria: 'maes', nome: 'Você, no coração',
    descricao: 'A foto dentro de uma moldura de coração, com o nome dos filhos',
    fundo: '--paper', semente: 612, enfeites: coracoes,
    camadas: [
      ilustra('i1', 'Moldura de coração', 'data-moldura-coracao', 0.19, 0.44, 0.82, '--peach'),
      ilustra('i2', 'Buquê', 'data-buque', 0.81, 0.44, 0.44, '--peach'),
      foto('a', 'Foto da mãe', 'coracao', 0.19, 0.42, 0.18, 0.46),
      frase('f1', 'Frase', 'com amor,', 0.51, 0.34, 7, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.18 }),
      frase('f2', 'Nomes dos filhos', 'Bruno e Clara', 0.51, 0.5, 8, { fonte: 'Fredoka', cor: '--ink', largura: 0.2 }),
      frase('f3', 'Data', 'Dia das Mães 2026', 0.51, 0.7, 5, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.22 }),
    ],
  },
  {
    id: 'maes-cafe', categoria: 'maes', nome: 'O café com você',
    descricao: 'Duas fotos, a xícara com flor e a frase do costume da casa',
    fundo: '--cream', semente: 613, enfeites: petalas,
    camadas: [
      ilustra('i1', 'Xícara com flor', 'data-xicara-flor', 0.1, 0.42, 0.42, '--sand'),
      ilustra('i2', 'Moldura de coração', 'data-moldura-coracao', 0.9, 0.42, 0.34, '--peach'),
      foto('a', 'Primeira foto', 'arredondado', 0.31, 0.4, 0.16, 0.48),
      foto('b', 'Segunda foto', 'arredondado', 0.52, 0.4, 0.16, 0.48),
      frase('f1', 'Frase', 'o melhor café é o que eu tomo com você', 0.42, 0.78, 6.5, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.34 }),
      frase('f2', 'Nome', 'mãe Sônia', 0.71, 0.4, 8, { fonte: 'Fredoka', cor: '--ink', largura: 0.14 }),
    ],
  },

  /* ---------- Dia dos Pais ---------- */
  {
    id: 'pais-gravata', categoria: 'pais', nome: 'O melhor chefe da casa',
    descricao: 'A gravata na frente, a foto no meio e o título no verso',
    fundo: '--white', semente: 621, enfeites: estrelinhas,
    camadas: [
      ilustra('i1', 'Gravata', 'data-gravata', 0.81, 0.4, 0.4, '--hand-ink'),
      ilustra('i2', 'Óculos e bigode', 'data-oculos-bigode', 0.81, 0.82, 0.2, '--ink'),
      foto('a', 'Foto com o pai', 'arredondado', 0.19, 0.4, 0.19, 0.54),
      frase('f1', 'Título', 'pai', 0.5, 0.34, 16, { fonte: 'Fredoka', cor: '--ink', largura: 0.16 }),
      frase('f2', 'Frase', 'meu primeiro herói', 0.5, 0.58, 7, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.24 }),
    ],
  },
  {
    id: 'pais-churrasco', categoria: 'pais', nome: 'O rei da churrasqueira',
    descricao: 'A churrasqueira, a foto e a piada de domingo',
    fundo: '--cream', semente: 622, enfeites: estrelinhas,
    camadas: [
      ilustra('i1', 'Churrasqueira', 'data-churrasqueira', 0.19, 0.42, 0.52, '--sage-deep'),
      ilustra('i2', 'Óculos e bigode', 'data-oculos-bigode', 0.19, 0.84, 0.22, '--ink'),
      foto('a', 'Foto do churrasco', 'arredondado', 0.5, 0.4, 0.19, 0.54),
      frase('f1', 'Título', 'o rei da churrasqueira', 0.81, 0.34, 8, { fonte: 'Fredoka', cor: '--ink', largura: 0.26 }),
      frase('f2', 'Frase', 'e ninguém discute', 0.81, 0.58, 7, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.24 }),
    ],
  },
  {
    id: 'pais-conserta', categoria: 'pais', nome: 'Conserta tudo',
    descricao: 'Duas fotos, o martelo e a frase de quem resolve',
    fundo: '--paper', semente: 623, enfeites: confetes,
    camadas: [
      ilustra('i1', 'Martelo', 'data-martelo', 0.09, 0.4, 0.4, '--kraft'),
      ilustra('i2', 'Gravata', 'data-gravata', 0.91, 0.4, 0.3, '--hand-ink'),
      foto('a', 'Primeira foto', 'arredondado', 0.3, 0.4, 0.16, 0.48),
      foto('b', 'Segunda foto', 'arredondado', 0.51, 0.4, 0.16, 0.48),
      frase('f1', 'Frase', 'meu pai conserta tudo, até o meu dia', 0.41, 0.8, 6.5, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.34 }),
      frase('f2', 'Nome', 'seu Nelson', 0.71, 0.4, 7.5, { fonte: 'Fredoka', cor: '--ink', largura: 0.14 }),
    ],
  },

  /* ---------- Namorados ---------- */
  {
    id: 'namorados-cadeado', categoria: 'namorados', nome: 'A nossa data',
    descricao: 'O cadeado do casal, a foto e a data de quando começou',
    fundo: '--white', semente: 631, enfeites: coracoes,
    camadas: [
      ilustra('i1', 'Cadeado', 'data-cadeado', 0.19, 0.42, 0.46, '--kraft'),
      ilustra('i2', 'Corações ligados', 'data-coracoes-ligados', 0.81, 0.44, 0.36, '--peach'),
      foto('a', 'Foto do casal', 'coracao', 0.5, 0.4, 0.2, 0.52),
      frase('f1', 'Nomes', 'Lia e Téo', 0.81, 0.24, 11, { fonte: 'Fredoka', cor: '--ink', largura: 0.22 }),
      frase('f2', 'Data', 'desde 14.02.2021', 0.81, 0.76, 6, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.24 }),
    ],
  },
  {
    id: 'namorados-canecas', categoria: 'namorados', nome: 'A gente combina',
    descricao: 'As duas canecas, duas fotos e a frase do par',
    fundo: '--cream', semente: 632, enfeites: coracoes,
    camadas: [
      ilustra('i1', 'Canecas do casal', 'data-canecas-casal', 0.5, 0.38, 0.52, '--peach'),
      ilustra('i2', 'Balão de coração', 'data-balao-coracao', 0.08, 0.44, 0.34, '--peach'),
      ilustra('i3', 'Balão de coração', 'data-balao-coracao', 0.92, 0.44, 0.34, '--hand-ink'),
      fotoRedonda('a', 'Foto de um', 0.29, 0.42, 0.15),
      fotoRedonda('b', 'Foto do outro', 0.71, 0.42, 0.15),
      frase('f1', 'Frase', 'a gente combina mesmo', 0.5, 0.72, 7.5, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.26 }),
    ],
  },

  /* ---------- Professores ---------- */
  {
    id: 'professores-quadro', categoria: 'professores', nome: 'No quadro, pra sempre',
    descricao: 'O quadro-negro, a foto da turma e o nome de quem ensinou',
    fundo: '--white', semente: 641, enfeites: confetes,
    camadas: [
      ilustra('i1', 'Quadro-negro', 'data-quadro', 0.81, 0.42, 0.56, '--sage-deep'),
      ilustra('i2', 'Maçã', 'data-maca', 0.66, 0.78, 0.2, '--hand-ink'),
      fotoRedonda('a', 'Foto da turma', 0.19, 0.42, 0.175),
      frase('f1', 'Nome', 'profe Carol', 0.5, 0.34, 11, { fonte: 'Fredoka', cor: '--ink', largura: 0.22 }),
      frase('f2', 'Frase', 'a senhora ficou na gente', 0.5, 0.58, 6, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.24 }),
    ],
  },
  {
    id: 'professores-livros', categoria: 'professores', nome: 'Obrigado por ensinar',
    descricao: 'Os livros, duas fotos e o agradecimento da turma',
    fundo: '--paper', semente: 642, enfeites: confetes,
    camadas: [
      ilustra('i1', 'Livros', 'data-livros', 0.1, 0.36, 0.36, '--sage-deep'),
      ilustra('i2', 'Maçã', 'data-maca', 0.1, 0.74, 0.2, '--hand-ink'),
      ilustra('i3', 'Lápis', 'data-lapis', 0.9, 0.42, 0.13, '--peach'),
      foto('a', 'Primeira foto', 'arredondado', 0.32, 0.4, 0.16, 0.48),
      foto('b', 'Segunda foto', 'arredondado', 0.53, 0.4, 0.16, 0.48),
      frase('f1', 'Frase', 'obrigado por ensinar mais que a matéria', 0.42, 0.8, 6, { fonte: 'Nunito', cor: '--ink', largura: 0.34 }),
      frase('f2', 'Turma', '3º ano B', 0.73, 0.4, 8, { fonte: 'Fredoka', cor: '--ink', largura: 0.14 }),
    ],
  },
  {
    id: 'professores-lapis', categoria: 'professores', nome: 'Da turma toda',
    descricao: 'O lápis e a maçã, a foto e o nome da turma que deu de presente',
    fundo: '--cream', semente: 643, enfeites: estrelinhas,
    camadas: [
      ilustra('i1', 'Lápis', 'data-lapis', 0.12, 0.42, 0.15, '--peach'),
      ilustra('i2', 'Livros', 'data-livros', 0.88, 0.44, 0.34, '--sage-deep'),
      ilustra('i3', 'Maçã', 'data-maca', 0.25, 0.8, 0.18, '--hand-ink'),
      fotoRedonda('a', 'Foto da turma', 0.45, 0.42, 0.17),
      frase('f1', 'Nome', 'profa. Rita', 0.68, 0.32, 9, { fonte: 'Fredoka', cor: '--ink', largura: 0.18 }),
      frase('f2', 'Frase', 'com carinho, a turma toda', 0.68, 0.56, 5.5, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.22 }),
    ],
  },

  /* ---------- Páscoa ---------- */
  {
    id: 'pascoa-coelho', categoria: 'pascoa', nome: 'Feliz Páscoa',
    descricao: 'O coelho na frente, a foto no meio e o nome no verso',
    fundo: '--white', semente: 651, enfeites: petalas,
    camadas: [
      ilustra('i1', 'Coelho', 'data-coelho', 0.19, 0.4, 0.44, '--white'),
      ilustra('i2', 'Cenoura', 'data-cenoura', 0.34, 0.66, 0.16, '--peach-deep'),
      fotoRedonda('a', 'Foto da Páscoa', 0.5, 0.42, 0.175),
      frase('f1', 'Nome', 'Manu', 0.81, 0.32, 12, { fonte: 'Fredoka', cor: '--ink', largura: 0.2 }),
      frase('f2', 'Frase', 'feliz Páscoa', 0.81, 0.52, 8, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.22 }),
    ],
  },
  {
    id: 'pascoa-cesta', categoria: 'pascoa', nome: 'A cesta da casa',
    descricao: 'A cesta cheia, duas fotos e o sobrenome da família',
    fundo: '--paper', semente: 652, enfeites: confetes,
    camadas: [
      ilustra('i1', 'Cesta', 'data-cesta', 0.1, 0.4, 0.42, '--kraft'),
      ilustra('i2', 'Ovo de Páscoa', 'data-ovo', 0.9, 0.4, 0.36, '--peach'),
      foto('a', 'Primeira foto', 'arredondado', 0.31, 0.4, 0.16, 0.48),
      foto('b', 'Segunda foto', 'arredondado', 0.52, 0.4, 0.16, 0.48),
      frase('f1', 'Sobrenome', 'os Ribeiro', 0.71, 0.38, 9, { fonte: 'Fredoka', cor: '--ink', largura: 0.16 }),
      frase('f2', 'Frase', 'chocolate de manhã também vale', 0.42, 0.8, 6, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.32 }),
    ],
  },
  {
    id: 'pascoa-ovo', categoria: 'pascoa', nome: 'Dentro do ovo',
    descricao: 'O ovo grande no verso, a foto em coração e o recado',
    fundo: '--cream', semente: 653, enfeites: petalas,
    camadas: [
      ilustra('i1', 'Ovo de Páscoa', 'data-ovo', 0.81, 0.42, 0.56, '--peach'),
      ilustra('i2', 'Coelho', 'data-coelho', 0.5, 0.76, 0.24, '--white'),
      foto('a', 'Foto', 'coracao', 0.19, 0.4, 0.19, 0.5),
      frase('f1', 'Recado', 'a melhor parte da Páscoa', 0.5, 0.3, 6.5, { fonte: 'Nunito', cor: '--ink', largura: 0.24 }),
      frase('f2', 'Nome', 'é você', 0.5, 0.5, 9, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.2 }),
    ],
  },
  {
    id: 'pascoa-tres', categoria: 'pascoa', nome: 'A turma do chocolate',
    descricao: 'Três fotos em fila, o coelho e a cenoura nas pontas',
    fundo: '--white', semente: 654, enfeites: confetes,
    camadas: [
      ilustra('i1', 'Coelho', 'data-coelho', 0.06, 0.4, 0.26, '--white'),
      ilustra('i2', 'Cenoura', 'data-cenoura', 0.94, 0.4, 0.26, '--peach-deep'),
      ilustra('i3', 'Ovo de Páscoa', 'data-ovo', 0.5, 0.8, 0.22, '--peach'),
      fotoRedonda('a', 'Primeira foto', 0.23, 0.38, 0.14),
      fotoRedonda('b', 'Segunda foto', 0.5, 0.38, 0.14),
      fotoRedonda('c', 'Terceira foto', 0.77, 0.38, 0.14),
      frase('f1', 'Frase', 'a turma do chocolate', 0.28, 0.72, 6.5, { fonte: 'Nunito', cor: '--ink', largura: 0.24 }),
      frase('f2', 'Ano', 'Páscoa 2026', 0.74, 0.72, 7, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.2 }),
    ],
  },
];
