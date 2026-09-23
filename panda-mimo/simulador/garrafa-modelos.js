/*
  Os modelos da garrafa: a primeira leva (23/09/2026), duas ocasiões com quatro artes cada, como a regra
  das ocasiões da caneca. O dono decidiu que cada peça tem modelos desenhados para o formato dela: os da
  caneca não se esticam para cá, onde a foto redonda viraria oval.

  A área da garrafa tem 230 × 180 mm e dá a volta nela em pé: a frente fica em x ≈ 0,227 e o verso em
  x ≈ 0,773 (pecas.js), e quem olha de frente vê uns 8 cm de largura. Por isso cada arte tem uma coluna
  na frente e um respiro no verso, em vez da faixa corrida da caneca.

  O estilo é o das coleções da casa depois da revisão de papelaria: Nunito e Caveat, confete pouco e
  miúdo, nada girado. A arte vai sobre a cor da garrafa, sem fundo pintado, e as frases usam duas tintas
  que acompanham a cor escolhida (manual 7.4): `--tinta-da-peca` e `--acento-da-peca`, que o estúdio
  preenche com nanquim suave e pêssego tinta na garrafa creme e na sálvia, e com papel na pêssego e na
  preta.

  Medidas: posição em fração da área; frase em mm; desenho e Pandinha pela largura em mm, que vira
  fração da altura da área (180 mm). Os atalhos são os de `atalhos-da-peca.js`, os mesmos da ecobag.
*/
import { atalhosDaPeca, ACENTO, TINTA } from './atalhos-da-peca.js';

const { frente: F, verso: V, I, E, T, D, P, M } = atalhosDaPeca('garrafa');

export const CATEGORIAS_DA_GARRAFA = Object.freeze([
  { id: 'garrafa-nome', pecas: ['garrafa'], grupo: 'Do dia a dia', nome: 'Com o seu nome', descricao: 'Nome grande, pra escola, o trabalho e o treino' },
  { id: 'garrafa-treino', pecas: ['garrafa'], grupo: 'Esportes e movimento', nome: 'Treino', descricao: 'Academia, corrida, pedal e yoga' },
]);

export const MODELOS_DA_GARRAFA = Object.freeze([
  M('nome-grande', 'garrafa-nome', 'Nome em destaque', 'O nome grande na frente, entre um coração e uma fileira de corações, e um coração com recado no verso', [
    E('coracao1', 'Coração', 'coracao', F, 0.1, 18),
    T('frase', 'Frase', 'garrafa da', F, 0.22, 16, 64, 'Caveat', ACENTO),
    T('nome', 'Nome', 'Malu', F, 0.45, 40, 74),
    T('linha', 'Frase de baixo', 'escola · treino · vida', F, 0.64, 9, 72),
    E('coracao2', 'Coração', 'coracao', F - 0.07, 0.8, 9),
    E('coracao3', 'Coração', 'coracao', F, 0.8, 11),
    E('coracao4', 'Coração', 'coracao', F + 0.07, 0.8, 9),
    E('coracao5', 'Coração do verso', 'coracao', V, 0.38, 32),
    T('verso', 'Frase do verso', 'bebe água, tá?', V, 0.62, 16, 72, 'Caveat', ACENTO),
  ], 1001, 14),
  M('nome-foto', 'garrafa-nome', 'Nome com foto', 'Retrato redondo na frente, o nome grande embaixo e um recado com coração no verso', [
    D('foto', F, 0.3, 62),
    T('nome', 'Nome', 'Theo', F, 0.65, 26, 72),
    T('frase', 'Frase', 'vai com tudo', F, 0.81, 14, 66, 'Caveat', ACENTO),
    T('verso', 'Frase do verso', 'um gole de cada vez', V, 0.44, 16, 76, 'Caveat', ACENTO),
    E('coracao', 'Coração do verso', 'coracao', V, 0.62, 16),
  ], 1002, 16),
  M('nome-flores', 'garrafa-nome', 'Nome entre flores', 'O nome dentro de uma coroa de flores e um buquê grande no verso', [
    I('coroa', 'convite-coroa', F, 0.37, 80),
    T('nome', 'Nome', 'Clara', F, 0.37, 19, 48, 'Caveat', ACENTO),
    T('linha', 'Frase de baixo', 'um dia de cada vez', F, 0.74, 10, 72),
    E('flor', 'Flor', 'flor', F, 0.86, 12, '--sage-deep'),
    I('buque', 'data-buque', V, 0.4, 60),
    T('verso', 'Frase do verso', 'floresça', V, 0.74, 18, 60, 'Caveat', ACENTO),
  ], 1003),
  M('nome-pandinha', 'garrafa-nome', 'Nome e Pandinha', 'O Pandinha abraçando o coração, com o nome em arco por cima e um recado no verso', [
    T('nome', 'Nome', 'Bia', F, 0.16, 24, 64, 'Nunito', TINTA, { arco: 50 }),
    P('coracao', F, 0.53, 60),
    T('frase', 'Frase', 'com carinho', F, 0.87, 14, 66, 'Caveat', ACENTO),
    T('verso', 'Frase do verso', 'feita pra você', V, 0.44, 16, 72, 'Caveat', ACENTO),
    E('coracao', 'Coração do verso', 'coracao', V, 0.62, 16),
  ], 1004, 12),
  M('academia', 'garrafa-treino', 'Foco no treino', 'O Pandinha na academia, título em duas linhas e o halter no verso', [
    T('titulo', 'Título', 'FOCO', F, 0.14, 28, 66),
    T('subtitulo', 'Frase do título', 'no treino', F, 0.32, 18, 64, 'Caveat', ACENTO),
    P('academia', F, 0.6, 60),
    T('nome', 'Nome', 'Malu', F, 0.9, 12, 56),
    I('halter', 'atelie-halter', V, 0.4, 62),
    T('verso', 'Frase do verso', 'um dia de cada vez', V, 0.64, 15, 76, 'Caveat', ACENTO),
  ], 1005),
  M('corrida', 'garrafa-treino', 'Cada km conta', 'O Pandinha correndo na frente e um retrato redondo no verso', [
    P('corrida', F, 0.33, 60),
    T('frase', 'Frase', 'cada km conta', F, 0.67, 18, 72, 'Caveat', ACENTO),
    T('nome', 'Nome', 'Rafa', F, 0.84, 16, 60),
    D('foto', V, 0.38, 60),
    T('verso', 'Frase do verso', 'minha melhor versão', V, 0.72, 13, 76, 'Caveat', ACENTO),
  ], 1006, 10),
  M('pedal', 'garrafa-treino', 'Partiu pedal', 'A bicicleta com cestinha na frente e o Pandinha ciclista no verso', [
    T('titulo', 'Título', 'partiu pedal', F, 0.15, 20, 72, 'Caveat', ACENTO),
    I('bike', 'atelie-bicicleta', F, 0.47, 78),
    T('nome', 'Nome', 'Clara', F, 0.78, 18, 60),
    P('ciclismo', V, 0.43, 60),
    T('verso', 'Frase do verso', 'colecionando caminhos', V, 0.84, 12, 80, 'Caveat', ACENTO),
  ], 1007),
  M('yoga', 'garrafa-treino', 'Respira fundo', 'O Pandinha no yoga com a frase em arco por cima e folhas no verso', [
    T('frase', 'Frase', 'respira fundo', F, 0.2, 18, 70, 'Caveat', ACENTO, { arco: 50 }),
    P('yoga', F, 0.58, 62),
    T('nome', 'Nome', 'Lia', F, 0.9, 12, 50),
    E('folha1', 'Folha', 'folha', V - 0.06, 0.34, 18, '--sage-deep'),
    E('folha2', 'Folha', 'folha', V + 0.06, 0.3, 14, '--sage-deep'),
    T('verso', 'Frase do verso', 'e confia', V, 0.54, 20, 60, 'Caveat', ACENTO),
  ], 1008, 8),
]);
