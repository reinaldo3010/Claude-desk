/*
  Os modelos da ecobag: a primeira leva (23/09/2026), duas ocasiões com quatro artes cada, como a regra
  das ocasiões da caneca. Cada peça tem modelos desenhados para o formato dela (decisão do dono).

  A arte da ecobag é um painel em pé de 250 × 300 mm, só na frente, e quem olha vê o painel inteiro
  de uma vez: cada arte é um cartaz de cima para baixo, com um protagonista grande no meio, e não a
  faixa corrida da caneca nem a coluna estreita da garrafa.

  Os atalhos (e o estilo, e as tintas que acompanham a cor da peça) são os de `atalhos-da-peca.js`.
*/
import { atalhosDaPeca, ACENTO } from './atalhos-da-peca.js';

const { I, E, T, D, P, M } = atalhosDaPeca('ecobag');
const C = 0.5; // o meio do painel

export const CATEGORIAS_DA_ECOBAG = Object.freeze([
  { id: 'ecobag-nome', pecas: ['ecobag'], grupo: 'Do dia a dia', nome: 'Com o seu nome', descricao: 'Nome grande, pra feira, a praia e o dia a dia' },
  { id: 'ecobag-prazeres', pecas: ['ecobag'], grupo: 'Hobbies e paixões', nome: 'Pequenos prazeres', descricao: 'Leitura, café, jardim e viagem' },
]);

export const MODELOS_DA_ECOBAG = Object.freeze([
  M('nome-grande', 'ecobag-nome', 'Nome em destaque', 'O nome bem grande entre corações, com uma frase em cima e outra embaixo', [
    E('coracao1', 'Coração', 'coracao', C, 0.1, 24),
    T('frase', 'Frase', 'sacola da', C, 0.22, 24, 120, 'Caveat', ACENTO),
    T('nome', 'Nome', 'Malu', C, 0.42, 60, 210),
    T('linha', 'Frase de baixo', 'feira · praia · vida', C, 0.6, 13, 200),
    E('coracao2', 'Coração', 'coracao', C - 0.08, 0.72, 12),
    E('coracao3', 'Coração', 'coracao', C, 0.72, 14),
    E('coracao4', 'Coração', 'coracao', C + 0.08, 0.72, 12),
    T('rodape', 'Frase do pé', 'leve o que é bom', C, 0.86, 22, 190, 'Caveat', ACENTO),
  ], 2001, 16),
  M('nome-foto', 'ecobag-nome', 'Nome com foto', 'Um retrato redondo grande, o nome embaixo e uma frase curta', [
    D('foto', C, 0.33, 150),
    T('nome', 'Nome', 'Theo', C, 0.7, 44, 200),
    T('frase', 'Frase', 'vai com tudo', C, 0.86, 24, 180, 'Caveat', ACENTO),
  ], 2002, 18),
  M('nome-flores', 'ecobag-nome', 'Nome entre flores', 'O nome dentro de uma coroa de flores grande e uma flor no pé', [
    I('coroa', 'convite-coroa', C, 0.38, 190),
    T('nome', 'Nome', 'Clara', C, 0.38, 40, 110, 'Caveat', ACENTO),
    T('linha', 'Frase de baixo', 'um dia de cada vez', C, 0.77, 15, 200),
    E('flor', 'Flor', 'flor', C, 0.88, 16, '--sage-deep'),
  ], 2003),
  M('nome-pandinha', 'ecobag-nome', 'Nome e Pandinha', 'O Pandinha abraçando o coração, com o nome em arco por cima', [
    T('nome', 'Nome', 'Bia', C, 0.15, 38, 150, 'Nunito', undefined, { arco: 40 }),
    P('coracao', C, 0.52, 66),
    T('frase', 'Frase', 'com carinho', C, 0.8, 26, 180, 'Caveat', ACENTO),
    E('coracao', 'Coração', 'coracao', C, 0.92, 14),
  ], 2004, 12),
  M('leitura', 'ecobag-prazeres', 'Entre páginas', 'O Pandinha lendo, um livro aberto e o nome de quem ama ler', [
    T('titulo', 'Título', 'entre páginas', C, 0.13, 30, 200, 'Caveat', ACENTO),
    P('leitura', C, 0.38, 92),
    T('frase', 'Frase', 'uma história por vez', C, 0.62, 14, 200),
    I('livro', 'hobby-livro', C, 0.75, 64),
    T('nome', 'Nome', 'Ana', C, 0.9, 18, 120),
  ], 2005, 10),
  M('cafe', 'ecobag-prazeres', 'Primeiro o café', 'A prensa e os grãos de café no alto, com a frase grande embaixo', [
    I('prensa', 'hobby-prensa', 0.36, 0.34, 70),
    I('graos', 'hobby-graos', 0.66, 0.4, 50),
    T('frase', 'Frase', 'primeiro o café', C, 0.64, 32, 210, 'Caveat', ACENTO),
    T('linha', 'Frase de baixo', 'depois a gente conversa', C, 0.76, 12, 200),
    T('nome', 'Nome', 'Bia', C, 0.88, 18, 120),
  ], 2006),
  M('jardim', 'ecobag-prazeres', 'A vida floresce', 'O regador debaixo de um arco de flores, com flores miúdas no pé', [
    I('arco', 'convite-arco', C, 0.36, 180),
    I('regador', 'hobby-regador', C, 0.42, 90),
    T('frase', 'Frase', 'a vida floresce', C, 0.7, 30, 200, 'Caveat', ACENTO),
    T('nome', 'Nome', 'Lia', C, 0.84, 18, 120),
    E('flor1', 'Flor', 'flor', 0.36, 0.93, 14, '--sage-deep'),
    E('flor2', 'Flor', 'flor', 0.64, 0.93, 14, '--sage-deep'),
  ], 2007),
  M('viagem', 'ecobag-prazeres', 'Próxima parada', 'O Pandinha viajante com a mala ao lado e o nome de quem vai', [
    T('titulo', 'Título', 'próxima parada', C, 0.12, 30, 210, 'Caveat', ACENTO),
    P('viagem', C, 0.42, 92),
    I('mala', 'hobby-mala', 0.8, 0.6, 46),
    T('frase', 'Frase', 'o mundo é grande', C, 0.76, 16, 200),
    T('nome', 'Nome', 'Rafa', C, 0.88, 18, 120),
  ], 2008, 10),
]);
