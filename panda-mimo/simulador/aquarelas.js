/*
  Coleção "Aquarela": seis ilustrações delicadas e uma arte para cada.

  Nasceram por IA a pedido do dono e foram aprovadas para as canecas em 23/09/2026. São a exceção
  à regra das curvas (manual 9.1): aquarela vetorizada perde a textura do papel, que é o que ela tem
  de bonito. A regra existe porque bitmap ampliado embaça na sublimação, então a resposta está no
  limite de tamanho — a imagem nunca cresce a ponto de a impressão cair abaixo de 300 dpi — e no
  teste que confere isso contra o arquivo.

  Entram como elemento do acervo (tipo `elemento`): mover, girar, mudar de tamanho, duplicar.
  Não trocam de cor, porque a cor é a pintura.
*/
import { foto, fotoRedonda, frase, elemento } from './camadas.js';
import { IMAGENS_DO_ACERVO } from './imagens-do-acervo.js';

export const AQUARELAS = Object.freeze([
  { arquivo: 'assets/aquarela-buque.webp', nome: 'Buquê de flores', grupo: 'Em aquarela', tamanho: 0.45 },
  { arquivo: 'assets/aquarela-cachorrinho.webp', nome: 'Cachorrinho com laço', grupo: 'Em aquarela', tamanho: 0.45 },
  { arquivo: 'assets/aquarela-bicicleta.webp', nome: 'Bicicleta florida', grupo: 'Em aquarela', tamanho: 0.45 },
  { arquivo: 'assets/aquarela-cafe.webp', nome: 'Café e livros', grupo: 'Em aquarela', tamanho: 0.45 },
  { arquivo: 'assets/aquarela-ursinho.webp', nome: 'Ursinho com coração', grupo: 'Em aquarela', tamanho: 0.45 },
  { arquivo: 'assets/aquarela-casa.webp', nome: 'Casinha com jardim', grupo: 'Em aquarela', tamanho: 0.45 },
]);

/** A aquarela pela altura que ela ocupa na caneca, em mm: a largura sai da proporção do arquivo. */
const A = (nome, x, y, alturaMm) => {
  const arquivo = `assets/aquarela-${nome}.webp`;
  const { largura, altura } = IMAGENS_DO_ACERVO[arquivo];
  const rotulo = AQUARELAS.find((a) => a.arquivo === arquivo).nome;
  return elemento('aquarela', rotulo, arquivo, x, y, Number((alturaMm * largura / altura / 90).toFixed(4)));
};
const T = (id, texto, x, y, mm, largura = 0.3, fonte = 'Nunito', cor = '--ink-soft') =>
  frase(id, texto, texto, x, y, mm, { largura, fonte, cor });
const TITULO = (id, texto, x, y, mm, largura = 0.34) => T(id, texto, x, y, mm, largura, 'Caveat', '--peach-ink');
const F = (id, x, y, w, h, forma = 'arredondado') => foto(id, 'Sua foto', forma, x, y, w, h);
const D = (id, x, y, w) => fotoRedonda(id, 'Sua foto', x, y, w);
const NOMES = { coracao: 'Coração', folha: 'Folha', flor: 'Flor', bolinha: 'Bolinha', pata: 'Patinha', estrela: 'Estrela' };
const E = (id, forma, x, y, mm, cor, rotacao = 0) =>
  ({ id, tipo: 'enfeite', rotulo: NOMES[forma], forma, x, y, tamanho: Number((mm / 90).toFixed(4)), cor, rotacao });
/**
 * O ornamento: um enfeite pequeno centrado sob o bloco de texto. Solto pela arte, enfeite desse
 * tamanho parece sujeira na caneca; alinhado ao texto, ele fecha a frase.
 */
const ORNAMENTO = (id, x, y, forma = id) => E(id, forma, x, y, forma === 'pata' ? 5.5 : 5, forma === 'pata' ? '--kraft' : '--peach');
const M = (id, tambemEm, nome, descricao, camadas, semente, fundo = '--white') => ({
  id: `aquarela-${id}`, categoria: 'aquarela', tambemEm, nome, descricao, camadas, semente, fundo,
  enfeites: { formas: ['bolinha'], cores: ['--sand'], quantidade: 6, tamanho: [1.2, 1.9] },
});

export const CATEGORIAS_AQUARELA = Object.freeze([
  { id: 'aquarela', grupo: 'Aquarela', nome: 'Aquarelas delicadas', descricao: 'Flores, bichinhos, casa e café em aquarela' },
]);

export const MODELOS_AQUARELA = Object.freeze([
  M('buque', ['maes'], 'Você faz tudo florescer', 'Buquê em aquarela à frente, dedicatória no meio e retrato em coração', [
    A('buque', 0.19, 0.5, 62),
    TITULO('titulo', 'você faz tudo florescer', 0.532, 0.3, 10, 0.36),
    T('nome', 'Mãe', 0.532, 0.5, 11, 0.2),
    T('detalhe', 'com amor, Sofia e Theo', 0.532, 0.66, 5, 0.3),
    ORNAMENTO('coracao', 0.532, 0.8),
    F('foto', 0.83, 0.43, 0.2, 0.56, 'coracao'),
  ], 1201, '--paper'),
  M('cachorrinho', ['pet-cachorro'], 'Amigo de quatro patas', 'Retrato redondo à frente, o cachorrinho em aquarela no meio e o nome no verso', [
    D('foto', 0.19, 0.43, 0.19),
    A('cachorrinho', 0.5, 0.5, 62),
    TITULO('titulo', 'amigo de quatro patas', 0.81, 0.31, 9, 0.33),
    T('nome', 'Thor', 0.81, 0.51, 11, 0.2),
    T('detalhe', 'desde 2021', 0.81, 0.66, 5, 0.24),
    ORNAMENTO('pata', 0.81, 0.8),
  ], 1202),
  M('bicicleta', ['ciclismo'], 'Pedalando entre flores', 'A bicicleta florida ocupando a frente e uma coluna com retrato, frase e nome', [
    A('bicicleta', 0.37, 0.52, 70),
    D('foto', 0.82, 0.25, 0.15),
    TITULO('titulo', 'pedalando entre flores', 0.82, 0.54, 8.5, 0.3),
    T('nome', 'Alice', 0.82, 0.7, 7.5, 0.2),
    T('detalhe', 'leve como um domingo', 0.82, 0.81, 4.4, 0.28),
    ORNAMENTO('coracao', 0.82, 0.905),
  ], 1203, '--paper'),
  M('cafe', ['hobby-cafe'], 'Um café e uma boa história', 'Título em duas linhas, café com livros em aquarela e retrato redondo no verso', [
    T('linha1', 'um café e', 0.19, 0.3, 9.5, 0.28),
    TITULO('linha2', 'uma boa história', 0.19, 0.47, 10.5, 0.3),
    T('nome', 'Marta', 0.19, 0.67, 7.5, 0.24),
    ORNAMENTO('coracao', 0.19, 0.81),
    A('cafe', 0.585, 0.5, 60),
    D('foto', 0.89, 0.44, 0.15),
  ], 1204),
  M('ursinho', ['bebe'], 'Chegou nosso amor', 'Título em duas linhas, retrato em coração e o ursinho em aquarela no verso', [
    T('linha1', 'chegou', 0.21, 0.28, 9.5, 0.3),
    TITULO('linha2', 'nosso amor', 0.21, 0.46, 13),
    T('nome', 'Theo · 12 de maio', 0.21, 0.68, 5.5, 0.3),
    ORNAMENTO('coracao', 0.21, 0.82),
    F('foto', 0.5, 0.44, 0.2, 0.6, 'coracao'),
    A('ursinho', 0.81, 0.5, 64),
  ], 1205, '--paper'),
  M('casa', ['casa-nova'], 'Nosso cantinho', 'Duas fotos arredondadas, a casinha em aquarela ao centro e a frase embaixo', [
    F('foto1', 0.17, 0.41, 0.2, 0.56),
    F('foto2', 0.83, 0.41, 0.2, 0.56),
    T('nome1', 'Família Souza', 0.17, 0.8, 5, 0.24),
    T('nome2', 'desde 2026', 0.83, 0.8, 5, 0.22),
    A('casa', 0.5, 0.43, 58),
    TITULO('titulo', 'nosso cantinho', 0.5, 0.87, 9.5, 0.36),
    ORNAMENTO('coracao', 0.17, 0.9),
    ORNAMENTO('coracao2', 0.83, 0.9, 'coracao'),
  ], 1206),
]);
