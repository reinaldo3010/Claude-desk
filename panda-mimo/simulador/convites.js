/*
  Coleção "Convites e agradecimentos": padrinhos de casamento, padrinhos de batismo, madrinhas e
  daminhas, e a caneca de agradecimento.

  As ilustrações seguem a seção 9.1 do manual: desenhadas por curvas, cor só por token, uma tinta
  principal que a pessoa troca. O vocabulário está em `desenho.js`, que mede e centra sozinho.
*/
import { ilustracao } from './desenho.js';
import { foto, fotoRedonda, frase, ilustra } from './camadas.js';

const ESCURO = '--ink';
const CLARO = '--white';

export const GRUPO_CONVITES = 'Convites e agradecimentos';

const aliancas = ilustracao({
  primary: '--kraft',
  partes: [
    { circulo: [-14, 2, 22], fill: null, stroke: '--kraft', w: 6 },
    { circulo: [14, 2, 22], fill: null, stroke: '--kraft', w: 6 },
    { d: 'M -14 -24 L -9 -33 L -19 -33 Z', fill: '--sand', stroke: ESCURO, w: 2 },
    { d: 'M 14 -24 L 19 -33 L 9 -33 Z', fill: '--sand', stroke: ESCURO, w: 2 },
  ],
});

/** Duas tacas inclinadas uma para a outra, no brinde. */
const tacas = ilustracao({
  primary: '--sand',
  partes: [
    { d: 'M -48 -26 L -20 -34 L -18 -4 C -18 2 -30 5 -33 0 Z', fill: '--sand', stroke: ESCURO, w: 2.6 },
    { d: 'M -26 2 L -34 26', stroke: ESCURO, w: 2.6 },
    { d: 'M -44 28 L -22 28', stroke: ESCURO, w: 3 },
    { d: 'M 48 -26 L 20 -34 L 18 -4 C 18 2 30 5 33 0 Z', fill: '--sand', stroke: ESCURO, w: 2.6 },
    { d: 'M 26 2 L 34 26', stroke: ESCURO, w: 2.6 },
    { d: 'M 22 28 L 44 28', stroke: ESCURO, w: 3 },
    { circulo: [0, -30, 4], fill: '--peach' },
    { circulo: [-11, -40, 3], fill: '--peach' },
    { circulo: [11, -40, 3], fill: '--peach' },
    { circulo: [0, -48, 2.4], fill: '--peach' },
  ],
});

const gravataBorboleta = ilustracao({
  primary: '--hand-ink',
  partes: [
    { d: 'M -8 0 L -44 -20 C -50 -23 -50 20 -44 20 L -8 0 Z', fill: '--hand-ink', stroke: ESCURO, w: 2.6 },
    { d: 'M 8 0 L 44 -20 C 50 -23 50 20 44 20 L 8 0 Z', fill: '--hand-ink', stroke: ESCURO, w: 2.6 },
    { retangulo: [-9, -10, 18, 20, 5], fill: '--peach-ink', stroke: ESCURO, w: 2.4 },
  ],
});

const vestido = ilustracao({
  primary: CLARO,
  partes: [
    { d: 'M -14 -22 L 14 -22 L 10 -6 L 30 34 C 32 40 -32 40 -30 34 L -10 -6 Z',
      fill: CLARO, stroke: ESCURO, w: 2.8 },
    { d: 'M -14 -22 L 0 -14 L 14 -22', stroke: ESCURO, w: 2.2 },
    { d: 'M -10 -6 L 10 -6', stroke: ESCURO, w: 2 },
    { d: 'M -22 20 C -8 26 8 26 22 20', stroke: '--sand', w: 2.4 },
    { d: 'M -14 -22 C -14 -34 14 -34 14 -22', stroke: ESCURO, w: 2.4 },
    { d: 'M 0 -34 C 0 -44 12 -44 12 -36', stroke: ESCURO, w: 2.4 },
  ],
});

const igreja = ilustracao({
  primary: '--sand',
  partes: [
    { d: 'M 0 -58 L 0 -46 M -5 -52 L 5 -52', stroke: ESCURO, w: 3 },
    { d: 'M 0 -44 L 16 -22 L -16 -22 Z', fill: '--peach', stroke: ESCURO, w: 2.6 },
    { retangulo: [-14, -22, 28, 26, 2], fill: '--sand', stroke: ESCURO, w: 2.6 },
    { d: 'M -40 4 L -14 -14 L 14 -14 L 40 4 Z', fill: '--peach', stroke: ESCURO, w: 2.6 },
    { retangulo: [-36, 4, 72, 34, 2], fill: '--sand', stroke: ESCURO, w: 2.8 },
    { d: 'M -8 38 L -8 16 C -8 6 8 6 8 16 L 8 38 Z', fill: '--kraft', stroke: ESCURO, w: 2.4 },
    { circulo: [-22, 16, 5], fill: CLARO, stroke: ESCURO, w: 2.2 },
    { circulo: [22, 16, 5], fill: CLARO, stroke: ESCURO, w: 2.2 },
    { circulo: [0, -8, 4], fill: CLARO, stroke: ESCURO, w: 2 },
  ],
});

const velaDeBatismo = ilustracao({
  primary: CLARO,
  partes: [
    { d: 'M 0 -34 C -8 -26 -8 -16 0 -16 C 8 -16 8 -26 0 -34 Z', fill: '--peach', stroke: ESCURO, w: 2.2 },
    { retangulo: [-13, -16, 26, 54, 3], fill: CLARO, stroke: ESCURO, w: 2.8 },
    { d: 'M -13 4 L 13 4', stroke: '--sand', w: 2.4 },
    { d: 'M 0 10 L 0 26 M -6 16 L 6 16', stroke: '--kraft', w: 2.6 },
    { d: 'M -20 38 L 20 38', stroke: ESCURO, w: 3.4 },
  ],
});

/** A concha do batismo, com a borda recortada em ondas e a agua caindo. */
const concha = ilustracao({
  primary: '--sand',
  partes: [
    { d: 'M -42 20 C -42 -4 -24 -22 0 -22 C 24 -22 42 -4 42 20 '
       + 'C 36 14 30 20 24 14 C 18 20 12 14 6 20 C 0 14 -6 20 -12 14 '
       + 'C -18 20 -24 14 -30 20 C -36 14 -38 18 -42 20 Z',
      fill: '--sand', stroke: ESCURO, w: 2.8 },
    { d: 'M -6 -20 C -14 -8 -20 2 -24 13', stroke: ESCURO, w: 2 },
    { d: 'M 0 -22 L 0 17', stroke: ESCURO, w: 2 },
    { d: 'M 6 -20 C 14 -8 20 2 24 13', stroke: ESCURO, w: 2 },
    { d: 'M -8 26 C -12 34 -6 40 0 36', stroke: '--sage', w: 3 },
    { d: 'M 10 28 C 6 36 12 42 18 38', stroke: '--sage', w: 3 },
  ],
});

/** A pomba do batismo: corpo, cabeca, bico, uma asa levantada e o rabo em leque. */
const pomba = ilustracao({
  primary: CLARO,
  partes: [
    { d: 'M -18 4 L -50 -10 L -48 2 L -54 12 L -20 16 Z', fill: CLARO, stroke: ESCURO, w: 2.6 },
    { d: 'M -20 2 C -20 -12 -6 -22 10 -22 C 22 -22 30 -16 32 -8 C 34 0 28 12 14 16 '
       + 'C 0 20 -20 16 -20 2 Z', fill: CLARO, stroke: ESCURO, w: 2.8 },
    { circulo: [24, -24, 11], fill: CLARO, stroke: ESCURO, w: 2.6 },
    { d: 'M 34 -26 L 46 -22 L 34 -18 Z', fill: '--peach', stroke: ESCURO, w: 2 },
    { circulo: [27, -27, 2.6], fill: ESCURO },
    { d: 'M 2 -6 C -4 -24 8 -40 20 -36 C 22 -22 16 -8 2 -6 Z', fill: '--sand', stroke: ESCURO, w: 2.4 },
    { d: 'M 10 -10 C 10 -22 14 -30 18 -33', stroke: ESCURO, w: 1.8 },
    { d: 'M 46 -20 C 54 -14 58 -6 56 2', stroke: '--sage-deep', w: 2.2 },
    { elipse: [53, -12, 6, 3, 40], fill: '--sage-deep' },
    { elipse: [58, -4, 6, 3, 70], fill: '--sage-deep' },
  ],
});

const cestinhaDeFlores = ilustracao({
  primary: '--kraft',
  partes: [
    ...[[-16, -26], [2, -32], [18, -24]].flatMap(([cx, cy]) => [
      ...Array.from({ length: 6 }, (naoUsado, i) => {
        const a = (i / 6) * Math.PI * 2;
        return { elipse: [cx + Math.cos(a) * 7, cy + Math.sin(a) * 7, 5.6, 5.6], fill: '--peach', stroke: ESCURO, w: 1.4 };
      }),
      { circulo: [cx, cy, 4], fill: '--sand' },
    ]),
    { d: 'M -30 -10 L 30 -10 L 23 28 C 22 34 18 36 0 36 C -18 36 -22 34 -23 28 Z',
      fill: '--kraft', stroke: ESCURO, w: 2.8 },
    { d: 'M -30 -10 L 30 -10', stroke: ESCURO, w: 2.8 },
    { d: 'M -18 -10 C -18 -34 18 -34 18 -10', stroke: '--kraft', w: 4.4 },
    { d: 'M -24 6 L 24 6 M -22 20 L 22 20', stroke: ESCURO, w: 2 },
  ],
});

const envelope = ilustracao({
  primary: '--sand',
  partes: [
    { retangulo: [-46, -28, 92, 56, 4], fill: '--sand', stroke: ESCURO, w: 2.8 },
    { d: 'M -46 -26 L 0 8 L 46 -26', stroke: ESCURO, w: 2.4 },
    { d: 'M 0 22 C -14 12 -19 6 -19 -1 C -19 -8 -13 -12 -8 -12 C -4 -12 -1 -10 0 -7 '
       + 'C 1 -10 4 -12 8 -12 C 13 -12 19 -8 19 -1 C 19 6 14 12 0 22 Z',
      fill: '--peach', stroke: ESCURO, w: 2.4 },
  ],
});

const lacoDeFita = ilustracao({
  primary: '--peach',
  partes: [
    { d: 'M -7 0 C -30 -22 -52 -14 -48 4 C -45 18 -22 16 -7 4 Z', fill: '--peach', stroke: ESCURO, w: 2.6 },
    { d: 'M 7 0 C 30 -22 52 -14 48 4 C 45 18 22 16 7 4 Z', fill: '--peach', stroke: ESCURO, w: 2.6 },
    { d: 'M -6 6 L -16 36 L -4 30 L 0 40 L 4 30 L 16 36 L 6 6 Z', fill: '--peach', stroke: ESCURO, w: 2.6 },
    { circulo: [0, 2, 8], fill: '--peach-ink', stroke: ESCURO, w: 2.4 },
  ],
});

const arcoDeFlores = ilustracao({
  primary: '--sage-deep',
  partes: [
    { d: 'M -54 44 C -54 -18 -30 -46 0 -46 C 30 -46 54 -18 54 44', stroke: '--sage-deep', w: 3 },
    ...Array.from({ length: 11 }, (naoUsado, i) => {
      const t = i / 10;
      const a = Math.PI * (1 - t);
      const x = Math.cos(a) * 54;
      const y = -Math.sin(a) * 60 + 30;
      return { elipse: [x, y, 13, 6.5, (t * 180) + 90], fill: '--sage-deep', stroke: ESCURO, w: 1.4 };
    }),
    ...[[-38, -18], [0, -42], [38, -18]].flatMap(([cx, cy]) => [
      ...Array.from({ length: 6 }, (naoUsado, i) => {
        const a = (i / 6) * Math.PI * 2;
        return { elipse: [cx + Math.cos(a) * 7.5, cy + Math.sin(a) * 7.5, 6, 6], fill: '--peach', stroke: ESCURO, w: 1.4 };
      }),
      { circulo: [cx, cy, 4.4], fill: '--sand' },
    ]),
  ],
});

const coroaDeFlores = ilustracao({
  primary: '--peach',
  partes: [
    { d: 'M -44 20 C -44 -10 -24 -24 0 -24 C 24 -24 44 -10 44 20', stroke: '--sage-deep', w: 3 },
    ...Array.from({ length: 9 }, (naoUsado, i) => {
      const t = i / 8;
      const a = Math.PI * (1 - t);
      return { elipse: [Math.cos(a) * 44, -Math.sin(a) * 38 + 16, 11, 5.5, (t * 180) + 90],
        fill: '--sage-deep', stroke: ESCURO, w: 1.4 };
    }),
    ...[[-26, -8], [0, -20], [26, -8]].flatMap(([cx, cy]) => [
      ...Array.from({ length: 6 }, (naoUsado, i) => {
        const a = (i / 6) * Math.PI * 2;
        return { elipse: [cx + Math.cos(a) * 8, cy + Math.sin(a) * 8, 6.4, 6.4], fill: '--peach', stroke: ESCURO, w: 1.4 };
      }),
      { circulo: [cx, cy, 4.6], fill: '--sand' },
    ]),
    { d: 'M -46 22 C -50 34 -44 44 -38 46', stroke: '--peach', w: 3 },
    { d: 'M 46 22 C 50 34 44 44 38 46', stroke: '--peach', w: 3 },
  ],
});

const cruzComFolhas = ilustracao({
  primary: '--kraft',
  partes: [
    { retangulo: [-8, -44, 16, 84, 3], fill: '--kraft', stroke: ESCURO, w: 2.8 },
    { retangulo: [-30, -22, 60, 16, 3], fill: '--kraft', stroke: ESCURO, w: 2.8 },
    { elipse: [-26, 22, 12, 6, -28], fill: '--sage-deep', stroke: ESCURO, w: 1.6 },
    { elipse: [-18, 34, 12, 6, -12], fill: '--sage', stroke: ESCURO, w: 1.6 },
    { elipse: [26, 22, 12, 6, 28], fill: '--sage-deep', stroke: ESCURO, w: 1.6 },
    { elipse: [18, 34, 12, 6, 12], fill: '--sage', stroke: ESCURO, w: 1.6 },
    { d: 'M -22 40 C -12 30 12 30 22 40', stroke: '--sage-deep', w: 2.4 },
  ],
});

export const ILUSTRACOES_CONVITES = Object.freeze({
  'convite-aliancas': aliancas,
  'convite-tacas': tacas,
  'convite-gravata-borboleta': gravataBorboleta,
  'convite-vestido': vestido,
  'convite-igreja': igreja,
  'convite-vela': velaDeBatismo,
  'convite-concha': concha,
  'convite-pomba': pomba,
  'convite-cestinha': cestinhaDeFlores,
  'convite-envelope': envelope,
  'convite-laco': lacoDeFita,
  'convite-arco': arcoDeFlores,
  'convite-coroa': coroaDeFlores,
  'convite-cruz': cruzComFolhas,
});

/* ====================================================================================
   Os modelos. "Padrinhos de casamento" já existia com uma arte (em `modelos.js`); aqui entram as
   três que faltavam para ela e os três assuntos novos, com quatro artes cada.
   A frente da caneca cai em x ≈ 0,19 e o verso em x ≈ 0,81.
   ==================================================================================== */

export const CATEGORIAS_CONVITES = Object.freeze([
  { id: 'batismo', grupo: GRUPO_CONVITES, nome: 'Padrinhos de batismo', descricao: 'O convite e a lembrança do batizado' },
  { id: 'madrinhas', grupo: GRUPO_CONVITES, nome: 'Madrinhas e daminhas', descricao: 'Pra quem entra na igreja com você' },
  { id: 'agradecimento', grupo: GRUPO_CONVITES, nome: 'Agradecimento', descricao: 'Pra dizer obrigado de um jeito que fica' },
]);

const petalasConvite = { formas: ['flor', 'bolinha'], cores: ['--sand', '--peach', '--sage'], quantidade: 26, tamanho: [3, 6.5] };
const folhasConvite = { formas: ['folha', 'bolinha'], cores: ['--sage', '--sand', '--kraft'], quantidade: 24, tamanho: [3, 6.5] };
const coracoesConvite = { formas: ['coracao', 'bolinha'], cores: ['--peach', '--sand', '--sage'], quantidade: 28, tamanho: [3, 7] };
const estrelasConvite = { formas: ['estrela', 'confete'], cores: ['--sand', '--kraft', '--sage'], quantidade: 26, tamanho: [2.5, 6] };

export const MODELOS_CONVITES = [
  /* ---------- padrinhos de casamento (assunto que já existia) ---------- */
  {
    id: 'casamento-convite', categoria: 'casamento', nome: 'Quer ser meu padrinho?',
    descricao: 'O envelope aberto, a foto de vocês e o convite escrito',
    fundo: '--white', semente: 801, enfeites: folhasConvite,
    camadas: [
      ilustra('i1', 'Envelope', 'convite-envelope', 0.19, 0.4, 0.44, '--sand'),
      ilustra('i2', 'Alianças', 'convite-aliancas', 0.19, 0.8, 0.24, '--kraft'),
      fotoRedonda('a', 'Foto com o padrinho', 0.5, 0.42, 0.175),
      frase('f1', 'Convite', 'quer ser meu padrinho?', 0.81, 0.34, 8, { fonte: 'Fredoka', cor: '--ink', largura: 0.26 }),
      frase('f2', 'Data', '08 de novembro', 0.81, 0.58, 6, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.24 }),
    ],
  },
  {
    id: 'casamento-brinde', categoria: 'casamento', nome: 'Brinde dos padrinhos',
    descricao: 'As taças, duas fotos e o nome do casal',
    fundo: '--cream', semente: 802, enfeites: estrelasConvite,
    camadas: [
      ilustra('i1', 'Taças', 'convite-tacas', 0.1, 0.4, 0.4, '--sand'),
      ilustra('i2', 'Gravata-borboleta', 'convite-gravata-borboleta', 0.9, 0.34, 0.32, '--hand-ink'),
      ilustra('i3', 'Vestido', 'convite-vestido', 0.9, 0.74, 0.2, '--white'),
      foto('a', 'Primeira foto', 'arredondado', 0.31, 0.4, 0.16, 0.48),
      foto('b', 'Segunda foto', 'arredondado', 0.52, 0.4, 0.16, 0.48),
      frase('f1', 'Frase', 'obrigado por segurar a nossa mão', 0.42, 0.8, 6, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.32 }),
      frase('f2', 'Nomes', 'Ana e Léo', 0.71, 0.4, 8, { fonte: 'Fredoka', cor: '--ink', largura: 0.14 }),
    ],
  },
  {
    id: 'casamento-arco', categoria: 'casamento', nome: 'Debaixo do arco',
    descricao: 'A foto dentro do arco de flores, com o nome dos noivos',
    fundo: '--paper', semente: 803, enfeites: petalasConvite,
    camadas: [
      ilustra('i1', 'Arco de flores', 'convite-arco', 0.19, 0.48, 0.74, '--sage-deep'),
      ilustra('i2', 'Alianças', 'convite-aliancas', 0.56, 0.4, 0.26, '--kraft'),
      foto('a', 'Foto dos noivos', 'coracao', 0.19, 0.46, 0.15, 0.4),
      frase('f1', 'Nomes', 'Bia & Caio', 0.82, 0.34, 12, { fonte: 'Fredoka', cor: '--ink', largura: 0.24 }),
      frase('f2', 'Data', '14 de dezembro de 2026', 0.82, 0.58, 5.5, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.26 }),
    ],
  },

  /* ---------- padrinhos de batismo ---------- */
  {
    id: 'batismo-convite', categoria: 'batismo', nome: 'Padrinhos de batismo',
    descricao: 'A concha e a vela, a foto do bebê e o convite',
    fundo: '--white', semente: 811, enfeites: folhasConvite,
    camadas: [
      ilustra('i1', 'Concha do batismo', 'convite-concha', 0.5, 0.34, 0.34, '--sand'),
      ilustra('i2', 'Vela', 'convite-vela', 0.5, 0.78, 0.16, '--white'),
      foto('a', 'Foto do bebê', 'arredondado', 0.19, 0.4, 0.18, 0.52),
      frase('f1', 'Convite', 'quer batizar o nosso filho?', 0.81, 0.36, 7.5, { fonte: 'Fredoka', cor: '--ink', largura: 0.26 }),
      frase('f2', 'Nome do bebê', 'do Joaquim', 0.81, 0.6, 7, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.22 }),
    ],
  },
  {
    id: 'batismo-igreja', categoria: 'batismo', nome: 'Na igreja, com vocês',
    descricao: 'A igreja, a foto em coração e a data do batizado',
    fundo: '--cream', semente: 812, enfeites: folhasConvite,
    camadas: [
      ilustra('i1', 'Igreja', 'convite-igreja', 0.81, 0.4, 0.4, '--sand'),
      ilustra('i2', 'Pomba', 'convite-pomba', 0.63, 0.78, 0.26, '--white'),
      foto('a', 'Foto do batizado', 'coracao', 0.19, 0.4, 0.19, 0.5),
      frase('f1', 'Frase', 'o dia em que você virou nosso', 0.48, 0.3, 6, { fonte: 'Nunito', cor: '--ink', largura: 0.24 }),
      frase('f2', 'Data', '05.10.2026', 0.48, 0.52, 9, { fonte: 'Fredoka', cor: '--ink', largura: 0.2 }),
    ],
  },
  {
    id: 'batismo-cruz', categoria: 'batismo', nome: 'Com fé e com a gente',
    descricao: 'A cruz com folhas, duas fotos e o nome dos padrinhos',
    fundo: '--paper', semente: 813, enfeites: folhasConvite,
    camadas: [
      ilustra('i1', 'Cruz com folhas', 'convite-cruz', 0.5, 0.22, 0.2, '--kraft'),
      ilustra('i2', 'Pomba', 'convite-pomba', 0.36, 0.84, 0.2, '--white'),
      ilustra('i3', 'Vela', 'convite-vela', 0.64, 0.84, 0.13, '--white'),
      fotoRedonda('a', 'Primeira foto', 0.19, 0.42, 0.155),
      fotoRedonda('b', 'Segunda foto', 0.81, 0.42, 0.155),
      frase('f1', 'Frase', 'que vocês guiem esse caminho', 0.5, 0.52, 6, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.24 }),
      frase('f2', 'Nomes', 'tia Lu e tio Rui', 0.5, 0.68, 7, { fonte: 'Fredoka', cor: '--ink', largura: 0.2 }),
    ],
  },
  {
    id: 'batismo-lembranca', categoria: 'batismo', nome: 'Lembrança do batizado',
    descricao: 'Três fotos do dia, com a concha e a vela nas pontas',
    fundo: '--white', semente: 814, enfeites: estrelasConvite,
    camadas: [
      ilustra('i1', 'Concha do batismo', 'convite-concha', 0.06, 0.38, 0.22, '--sand'),
      ilustra('i2', 'Cruz com folhas', 'convite-cruz', 0.94, 0.38, 0.2, '--kraft'),
      ilustra('i3', 'Pomba', 'convite-pomba', 0.5, 0.8, 0.22, '--white'),
      fotoRedonda('a', 'Primeira foto', 0.24, 0.38, 0.14),
      fotoRedonda('b', 'Segunda foto', 0.5, 0.38, 0.14),
      fotoRedonda('c', 'Terceira foto', 0.76, 0.38, 0.14),
      frase('f1', 'Frase', 'lembrança do batizado', 0.29, 0.7, 6, { fonte: 'Nunito', cor: '--ink', largura: 0.24 }),
      frase('f2', 'Nome do bebê', 'da Elisa', 0.74, 0.7, 8, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.18 }),
    ],
  },

  /* ---------- madrinhas e daminhas ---------- */
  {
    id: 'madrinhas-convite', categoria: 'madrinhas', nome: 'Quer ser minha madrinha?',
    descricao: 'A coroa de flores, a foto de vocês e o convite',
    fundo: '--white', semente: 821, enfeites: petalasConvite,
    camadas: [
      ilustra('i1', 'Coroa de flores', 'convite-coroa', 0.19, 0.36, 0.44, '--peach'),
      ilustra('i2', 'Laço', 'convite-laco', 0.19, 0.78, 0.26, '--peach'),
      foto('a', 'Foto de vocês', 'arredondado', 0.5, 0.4, 0.19, 0.54),
      frase('f1', 'Convite', 'quer ser minha madrinha?', 0.81, 0.34, 7.5, { fonte: 'Fredoka', cor: '--ink', largura: 0.26 }),
      frase('f2', 'Nome', 'da noiva Marina', 0.81, 0.58, 6, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.24 }),
    ],
  },
  {
    id: 'madrinhas-daminha', categoria: 'madrinhas', nome: 'Minha daminha',
    descricao: 'A cestinha de flores, a foto da daminha e o pedido',
    fundo: '--paper', semente: 822, enfeites: petalasConvite,
    camadas: [
      ilustra('i1', 'Cestinha de flores', 'convite-cestinha', 0.19, 0.4, 0.4, '--kraft'),
      ilustra('i2', 'Laço', 'convite-laco', 0.19, 0.82, 0.22, '--peach'),
      fotoRedonda('a', 'Foto da daminha', 0.81, 0.42, 0.175),
      frase('f1', 'Pedido', 'quer jogar as pétalas pra mim?', 0.5, 0.32, 6, { fonte: 'Nunito', cor: '--ink', largura: 0.24 }),
      frase('f2', 'Nome', 'Alice', 0.5, 0.56, 12, { fonte: 'Fredoka', cor: '--ink', largura: 0.18 }),
    ],
  },
  {
    id: 'madrinhas-time', categoria: 'madrinhas', nome: 'O time da noiva',
    descricao: 'Duas fotos, o vestido e as taças do dia de arrumar',
    fundo: '--cream', semente: 823, enfeites: coracoesConvite,
    camadas: [
      ilustra('i1', 'Vestido', 'convite-vestido', 0.1, 0.38, 0.28, '--white'),
      ilustra('i2', 'Taças', 'convite-tacas', 0.9, 0.38, 0.34, '--sand'),
      foto('a', 'Primeira foto', 'arredondado', 0.4, 0.4, 0.16, 0.48),
      foto('b', 'Segunda foto', 'arredondado', 0.61, 0.4, 0.16, 0.48),
      frase('f1', 'Frase', 'time da noiva', 0.2, 0.82, 7, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.18 }),
      frase('f2', 'Frase', 'desde sempre', 0.8, 0.82, 7, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.18 }),
    ],
  },
  {
    id: 'madrinhas-fila', categoria: 'madrinhas', nome: 'Todas de uma vez',
    descricao: 'Três fotos em fila, com a coroa e a cestinha nas pontas',
    fundo: '--white', semente: 824, enfeites: petalasConvite,
    camadas: [
      ilustra('i1', 'Coroa de flores', 'convite-coroa', 0.06, 0.44, 0.2, '--peach'),
      ilustra('i2', 'Cestinha de flores', 'convite-cestinha', 0.94, 0.44, 0.19, '--kraft'),
      ilustra('i3', 'Laço', 'convite-laco', 0.5, 0.86, 0.17, '--peach'),
      foto('a', 'Primeira foto', 'arredondado', 0.19, 0.4, 0.15, 0.44),
      foto('b', 'Segunda foto', 'arredondado', 0.5, 0.4, 0.15, 0.44),
      foto('c', 'Terceira foto', 'arredondado', 0.81, 0.4, 0.15, 0.44),
      frase('f1', 'Frase', 'sem vocês não tinha graça', 0.35, 0.78, 6, { fonte: 'Nunito', cor: '--ink', largura: 0.22 }),
      frase('f2', 'Data', '14.12.2026', 0.65, 0.78, 7, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.18 }),
    ],
  },

  /* ---------- agradecimento ---------- */
  {
    id: 'agradecimento-obrigado', categoria: 'agradecimento', nome: 'Obrigado por tudo',
    descricao: 'O envelope com coração, a foto e o obrigado escrito à mão',
    fundo: '--white', semente: 831, enfeites: coracoesConvite,
    camadas: [
      ilustra('i1', 'Envelope', 'convite-envelope', 0.81, 0.38, 0.42, '--sand'),
      ilustra('i2', 'Laço', 'convite-laco', 0.63, 0.78, 0.22, '--peach'),
      fotoRedonda('a', 'Foto de vocês', 0.19, 0.42, 0.185),
      frase('f1', 'Título', 'obrigado', 0.47, 0.34, 14, { fonte: 'Fredoka', cor: '--ink', largura: 0.22 }),
      frase('f2', 'Frase', 'por estar sempre por perto', 0.47, 0.58, 5.5, { fonte: 'Nunito', cor: '--sage-deep', largura: 0.24 }),
    ],
  },
  {
    id: 'agradecimento-flores', categoria: 'agradecimento', nome: 'Com flores e com o nome',
    descricao: 'A coroa em volta da foto, com o nome de quem recebe',
    fundo: '--paper', semente: 832, enfeites: petalasConvite,
    camadas: [
      ilustra('i1', 'Coroa de flores', 'convite-coroa', 0.19, 0.44, 0.62, '--peach'),
      ilustra('i2', 'Envelope', 'convite-envelope', 0.56, 0.42, 0.28, '--sand'),
      fotoRedonda('a', 'Foto', 0.19, 0.46, 0.125),
      frase('f1', 'Nome', 'dona Cida', 0.82, 0.34, 12, { fonte: 'Fredoka', cor: '--ink', largura: 0.24 }),
      frase('f2', 'Frase', 'a casa é sua', 0.82, 0.58, 8, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.22 }),
    ],
  },
  {
    id: 'agradecimento-equipe', categoria: 'agradecimento', nome: 'Pro time inteiro',
    descricao: 'Duas fotos, as taças e o agradecimento de quem organizou',
    fundo: '--cream', semente: 833, enfeites: estrelasConvite,
    camadas: [
      ilustra('i1', 'Taças', 'convite-tacas', 0.1, 0.36, 0.36, '--sand'),
      ilustra('i2', 'Laço', 'convite-laco', 0.1, 0.76, 0.24, '--peach'),
      ilustra('i3', 'Envelope', 'convite-envelope', 0.9, 0.4, 0.34, '--sand'),
      foto('a', 'Primeira foto', 'arredondado', 0.32, 0.4, 0.16, 0.48),
      foto('b', 'Segunda foto', 'arredondado', 0.53, 0.4, 0.16, 0.48),
      frase('f1', 'Frase', 'nada disso sairia sem vocês', 0.43, 0.8, 6.5, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.3 }),
      frase('f2', 'Nome', 'da equipe toda', 0.72, 0.4, 6.5, { fonte: 'Nunito', cor: '--ink', largura: 0.18 }),
    ],
  },
  {
    id: 'agradecimento-padrinhos', categoria: 'agradecimento', nome: 'Obrigado, padrinhos',
    descricao: 'As alianças, a foto em coração e o recado dos noivos',
    fundo: '--white', semente: 834, enfeites: folhasConvite,
    camadas: [
      ilustra('i1', 'Alianças', 'convite-aliancas', 0.19, 0.4, 0.4, '--kraft'),
      ilustra('i2', 'Arco de flores', 'convite-arco', 0.81, 0.44, 0.52, '--sage-deep'),
      foto('a', 'Foto dos noivos', 'coracao', 0.5, 0.38, 0.17, 0.44),
      frase('f1', 'Frase', 'obrigado por dizer sim com a gente', 0.5, 0.72, 6, { fonte: 'Nunito', cor: '--ink', largura: 0.26 }),
      frase('f2', 'Nomes', 'Bia & Caio', 0.5, 0.87, 8, { fonte: 'Caveat', cor: '--hand-ink', largura: 0.22 }),
    ],
  },
];
