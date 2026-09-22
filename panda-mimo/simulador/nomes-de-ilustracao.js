/*
  O nome que a pessoa lê na lista de camadas do estúdio.

  A camada de ilustração é a única cujo nome não vem escrito no modelo: os lotes novos montam a
  camada num atalho próprio e, sem esta tabela, o rótulo saía do id interno — "convite aliancas",
  "estetoscopio", "graos". O cliente não tem por que ler id, e o manual (seção 3) pede português
  de gente.

  Coleção nova: escreva aqui o nome de cada desenho, com acento e maiúscula inicial. O teste em
  `qa/colecoes-unit.test.mjs` reprova modelo que chegue ao catálogo sem nome de verdade.
*/

export const NOMES_DE_ILUSTRACAO = Object.freeze({
  // Ateliê: profissões e casa nova
  'atelie-bicicleta': 'Bicicleta com cesta',
  'atelie-caderno': 'Caderno',
  'atelie-casa': 'Casinha',
  'atelie-chaves': 'Chaves com laço',
  'atelie-estetoscopio': 'Estetoscópio',
  'atelie-halter': 'Halter',
  'atelie-planta': 'Vaso de planta',
  'atelie-prancheta': 'Prancheta de projeto',

  // Pequenos Prazeres
  'hobby-avental': 'Avental',
  'hobby-camera': 'Câmera fotográfica',
  'hobby-ferramentas': 'Ferramentas de jardim',
  'hobby-fouet': 'Fouet',
  'hobby-graos': 'Grãos de café',
  'hobby-livro': 'Livro aberto',
  'hobby-mala': 'Mala de viagem',
  'hobby-marcador': 'Marcador de página',
  'hobby-prensa': 'Prensa de café',
  'hobby-regador': 'Regador',
  'hobby-vinil': 'Disco de vinil',
  'hobby-violao': 'Violão',

  // Emprestados de outras coleções
  'convite-aliancas': 'Alianças',
  'convite-arco': 'Arco de flores',
  'convite-coroa': 'Coroa de flores',
  'convite-laco': 'Laço',
  'data-buque': 'Buquê',
  'data-canecas-casal': 'Canecas do casal',
  'data-livros': 'Pilha de livros',
  'data-xicara-flor': 'Xícara com flor',
});

/** O nome da ilustração, ou `null` quando ainda não foi escrito — quem chama decide o que fazer. */
export const nomeDaIlustracao = (forma) => NOMES_DE_ILUSTRACAO[forma] || null;
