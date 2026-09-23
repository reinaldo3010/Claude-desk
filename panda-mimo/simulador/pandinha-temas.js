/*
  Coleção "Com o Pandinha": 55 poses do Pandinha em profissões, saúde, esporte, paixões e ocasiões,
  e uma arte para cada.

  As poses nasceram por IA a partir do Pandinha oficial e foram aprovadas pelo dono para as canecas
  em 23/09/2026 (manual 6.3 e 13.5), em dois lotes no mesmo dia: 20 de manhã e 35 à tarde. Os mestres
  ficam em `marca/kit/png/pandinha-temas-20/` e `pandinha-temas-35/`; o que o site usa sai de lá por
  `marca/kit/prepara-imagens-do-estudio.py`. O segundo lote trouxe também quatro adesivos do acervo
  (laço, coração, margaridas, presente), que entram nos elementos e servem de acento nas ocasiões.

  O Pandinha aqui é o protagonista da arte, e continua sendo o adesivo (tipo `adesivo`): a pessoa
  troca a pose, muda o tamanho, gira, duplica e acrescenta outros, como com qualquer Pandinha.

  Cada arte mora num assunto da coleção e aparece também no assunto que já existia no estúdio
  (`tambemEm`): o ciclista está em "Pandinha no esporte" e em "Ciclismo".
*/
import { foto, fotoRedonda, frase, panda, elemento } from './camadas.js';
import { IMAGENS_DO_ACERVO } from './imagens-do-acervo.js';

/** As poses, na ordem da grade do estúdio. O nome é o que a pessoa lê. */
export const POSES_TEMATICAS = Object.freeze([
  ...[
    ['formatura', 'Formatura'], ['aniversario', 'Aniversário'], ['natal', 'Natal'], ['pascoa', 'Páscoa'],
    ['padrinho', 'Padrinho'], ['madrinha', 'Madrinha'], ['bebe', 'Chegada do bebê'], ['casa', 'Casa nova'],
    ['amizade', 'Amizade'], ['obrigado', 'Agradecimento'], ['cartinha', 'Com carinho'],
  ].map(([arquivo, nome]) => ({ arquivo: `assets/panda-${arquivo}.webp`, nome, grupo: 'Ocasiões' })),
  ...[
    ['engenharia', 'Engenharia'], ['professor', 'Sala de aula'], ['arquitetura', 'Arquitetura'],
    ['programacao', 'Programação'], ['ciencia', 'Ciência'], ['direito', 'Direito'], ['salao', 'Salão de beleza'],
    ['costura', 'Costura'], ['flores', 'Floricultura'], ['barista', 'Barista'],
  ].map(([arquivo, nome]) => ({ arquivo: `assets/panda-${arquivo}.webp`, nome, grupo: 'Profissões' })),
  ...[
    ['medicina', 'Medicina'], ['enfermagem', 'Enfermagem'], ['odontologia', 'Odontologia'], ['veterinaria', 'Veterinária'],
    ['psicologia', 'Psicologia'], ['nutricao', 'Nutrição'], ['fisioterapia', 'Fisioterapia'], ['farmacia', 'Farmácia'],
  ].map(([arquivo, nome]) => ({ arquivo: `assets/panda-${arquivo}.webp`, nome, grupo: 'Saúde' })),
  ...[
    ['ciclismo', 'Ciclismo'], ['academia', 'Academia'], ['corrida', 'Corrida'], ['yoga', 'Yoga'],
    ['treino', 'Treino funcional'], ['futebol', 'Futebol'], ['natacao', 'Natação'], ['tenis', 'Tênis'],
    ['basquete', 'Basquete'], ['volei', 'Vôlei'], ['skate', 'Skate'], ['patinacao', 'Patinação'],
    ['trilha', 'Trilha'], ['pilates', 'Pilates'], ['surf', 'Surfe'],
  ].map(([arquivo, nome]) => ({ arquivo: `assets/panda-${arquivo}.webp`, nome, grupo: 'Esportes' })),
  ...[
    ['cozinha', 'Cozinha'], ['confeitaria', 'Confeitaria'], ['jardinagem', 'Jardinagem'], ['pintura', 'Pintura'],
    ['musica', 'Música'], ['fotografia', 'Fotografia'], ['leitura', 'Leitura'], ['viagem', 'Viagem'],
    ['acampamento', 'Acampamento'], ['cinema', 'Cinema'], ['games', 'Games'],
  ].map(([arquivo, nome]) => ({ arquivo: `assets/panda-${arquivo}.webp`, nome, grupo: 'Paixões' })),
]);

/** Os adesivos do acervo que vieram com o segundo lote: entram na grade "Do acervo da Panda Mimo". */
export const ADESIVOS_DO_ACERVO = Object.freeze([
  { arquivo: 'assets/laco-pessego.webp', nome: 'Laço pêssego', grupo: 'Do acervo da Panda Mimo', tamanho: 0.22 },
  { arquivo: 'assets/coracao-botanico.webp', nome: 'Coração com folhas', grupo: 'Do acervo da Panda Mimo', tamanho: 0.22 },
  { arquivo: 'assets/margaridas.webp', nome: 'Margaridas', grupo: 'Do acervo da Panda Mimo', tamanho: 0.22 },
  { arquivo: 'assets/presente-carinho.webp', nome: 'Presente com laço', grupo: 'Do acervo da Panda Mimo', tamanho: 0.22 },
]);

const pose = (nome) => `assets/panda-${nome}.webp`;

/**
 * O Pandinha pela altura que ele ocupa na caneca, em mm: a largura sai da proporção do arquivo. Pose
 * larga demais para essa altura nasce no teto do controle de tamanho (0,6), senão o controle pularia
 * no primeiro toque da pessoa.
 */
const P = (nome, x, y, alturaMm) => {
  const { largura, altura } = IMAGENS_DO_ACERVO[pose(nome)];
  return panda(x, y, Number(Math.min(0.6, alturaMm * largura / altura / 90).toFixed(4)), pose(nome));
};
const T = (id, texto, x, y, mm, largura = 0.3, fonte = 'Nunito', cor = '--ink-soft') =>
  frase(id, texto, texto, x, y, mm, { largura, fonte, cor });
const TITULO = (id, texto, x, y, mm, largura = 0.34) => T(id, texto, x, y, mm, largura, 'Caveat', '--peach-ink');
/** Título em arco de arco-íris, por cima do Pandinha: `arco` positivo curva com o meio mais alto. */
const TITULO_ARCO = (id, texto, x, y, mm, largura, arco) =>
  frase(id, texto, texto, x, y, mm, { largura, fonte: 'Caveat', cor: '--peach-ink', arco });
const F = (id, x, y, w, h, forma = 'arredondado') => foto(id, 'Sua foto', forma, x, y, w, h);
const D = (id, x, y, w) => fotoRedonda(id, 'Sua foto', x, y, w);
const NOMES = { coracao: 'Coração', folha: 'Folha', estrela: 'Estrela', flor: 'Flor', pata: 'Patinha', bolinha: 'Bolinha' };
/** Enfeite pequeno de acompanhamento, pelo tamanho em mm. */
const E = (id, forma, x, y, mm, cor, rotacao = 0) =>
  ({ id, tipo: 'enfeite', rotulo: NOMES[forma], forma, x, y, tamanho: Number((mm / 90).toFixed(4)), cor, rotacao });
/**
 * O ornamento: um enfeite pequeno centrado sob o bloco de texto. Solto pela arte, enfeite desse
 * tamanho parece sujeira na caneca; alinhado ao texto, ele fecha a frase.
 */
const COR_DO_ORNAMENTO = { pata: '--kraft', folha: '--sage' };
const ORNAMENTO = (id, x, y, forma = id) => E(id, forma, x, y, forma === 'pata' ? 5.5 : 5, COR_DO_ORNAMENTO[forma] || '--peach');
/** Adesivo do acervo como acento da arte (o laço do padrinho, o presente do aniversário), pela largura em mm. */
const ADESIVO = (id, arquivo, x, y, larguraMm) =>
  elemento(id, ADESIVOS_DO_ACERVO.find((a) => a.arquivo === `assets/${arquivo}.webp`).nome, `assets/${arquivo}.webp`, x, y, Number((larguraMm / 90).toFixed(4)));
const M = (id, categoria, tambemEm, nome, descricao, camadas, semente, fundo = '--white') => ({
  id: `pandinha-${id}`, categoria, tambemEm, nome, descricao, camadas, semente, fundo,
  enfeites: { formas: ['bolinha'], cores: ['--sand'], quantidade: 7, tamanho: [1.3, 2.1] },
});

export const CATEGORIAS_PANDINHA = Object.freeze([
  { id: 'pandinha-ocasioes', grupo: 'Com o Pandinha', nome: 'Pandinha nas ocasiões', descricao: 'Formatura, aniversário, Natal, Páscoa, padrinhos, bebê, casa nova, amizade e carinho' },
  { id: 'pandinha-profissoes', grupo: 'Com o Pandinha', nome: 'Pandinha nas profissões', descricao: 'Projetos, leis, ciência, beleza, ofícios e café' },
  { id: 'pandinha-saude', grupo: 'Com o Pandinha', nome: 'Pandinha na saúde', descricao: 'Medicina, enfermagem, odontologia, veterinária, psicologia, nutrição, fisioterapia e farmácia' },
  { id: 'pandinha-esportes', grupo: 'Com o Pandinha', nome: 'Pandinha no esporte', descricao: 'Pedal, academia, corrida, yoga, treino, futebol, natação, tênis, quadra, rodas, trilha, pilates e surfe' },
  { id: 'pandinha-paixoes', grupo: 'Com o Pandinha', nome: 'Pandinha nas paixões', descricao: 'Cozinha, confeitaria, jardim, pintura, música, fotografia, leitura, viagem, acampamento, cinema e games' },
]);

export const MODELOS_PANDINHA = Object.freeze([
  // ---- profissões ----
  M('medicina', 'pandinha-saude', ['profissoes'], 'Cuidar é o meu jeito', 'Pandinha de estetoscópio, nome no meio e retrato redondo', [
    P('medicina', 0.2, 0.5, 62),
    TITULO('titulo', 'cuidar é o meu jeito', 0.52, 0.3, 10.5, 0.32),
    T('nome', 'Dra. Beatriz', 0.52, 0.51, 8.5, 0.3),
    T('detalhe', 'de amar as pessoas', 0.52, 0.66, 5, 0.3),
    ORNAMENTO('coracao', 0.52, 0.8),
    D('foto', 0.82, 0.44, 0.19),
  ], 1101),
  M('enfermagem', 'pandinha-saude', ['profissoes'], 'Coragem e cuidado', 'Título em duas linhas, retrato em coração e o Pandinha da enfermagem', [
    T('linha1', 'coragem e', 0.21, 0.28, 9.5, 0.32),
    TITULO('linha2', 'cuidado', 0.21, 0.46, 14),
    T('nome', 'Enf. Júlia', 0.21, 0.68, 7, 0.3),
    ORNAMENTO('coracao', 0.21, 0.82),
    F('foto', 0.52, 0.44, 0.21, 0.6, 'coracao'),
    T('legenda', 'obrigada por cada plantão', 0.52, 0.87, 5, 0.3, 'Caveat', '--ink-soft'),
    P('enfermagem', 0.81, 0.5, 61),
  ], 1102, '--paper'),
  M('odontologia', 'pandinha-saude', ['profissoes'], 'Cuidando de sorrisos', 'Retrato à frente, o Pandinha dentista no meio e o nome no verso', [
    F('foto', 0.18, 0.42, 0.23, 0.6),
    T('legenda', 'sorria, é por você', 0.18, 0.84, 5.5, 0.26, 'Caveat', '--peach-ink'),
    P('odontologia', 0.5, 0.5, 62),
    TITULO('titulo', 'cuidando de sorrisos', 0.81, 0.31, 10, 0.32),
    T('nome', 'Dr. Rafael', 0.81, 0.52, 8, 0.3),
    T('detalhe', 'cirurgião-dentista', 0.81, 0.67, 4.8, 0.3),
    ORNAMENTO('estrela', 0.81, 0.8),
  ], 1103),
  M('veterinaria', 'pandinha-saude', ['profissoes'], 'Amor de quatro patas', 'Duas fotos redondas, o Pandinha veterinário ao centro e a frase embaixo', [
    D('foto1', 0.18, 0.41, 0.17),
    D('foto2', 0.82, 0.41, 0.17),
    T('nome1', 'Dra. Lívia', 0.18, 0.8, 5.2, 0.24),
    T('nome2', 'e o Paçoca', 0.82, 0.8, 5.2, 0.24),
    P('veterinaria', 0.5, 0.43, 58),
    TITULO('titulo', 'amor de quatro patas', 0.5, 0.87, 9.5, 0.44),
    ORNAMENTO('pata', 0.18, 0.9),
    ORNAMENTO('pata2', 0.82, 0.9, 'pata'),
  ], 1104, '--paper'),
  M('engenharia', 'pandinha-profissoes', ['profissoes'], 'Ideias que ficam de pé', 'Retrato grande à frente, assinatura no meio e o Pandinha de capacete', [
    F('foto', 0.22, 0.45, 0.3, 0.74, 'retangulo'),
    TITULO('titulo', 'ideias que ficam de pé', 0.546, 0.3, 9.5, 0.32),
    T('nome', 'Eng. Tiago', 0.546, 0.5, 8, 0.26),
    T('detalhe', 'projeto, café e coragem', 0.546, 0.66, 4.6, 0.28),
    ORNAMENTO('estrela', 0.546, 0.8),
    P('engenharia', 0.84, 0.52, 58),
  ], 1105),
  M('professor', 'pandinha-profissoes', ['professores'], 'Ensinar é plantar', 'O Pandinha com livros, retrato no meio e dedicatória da turma', [
    P('professor', 0.19, 0.5, 59),
    F('foto', 0.47, 0.44, 0.22, 0.62),
    TITULO('titulo', 'ensinar é plantar', 0.78, 0.3, 11),
    T('nome', 'Profa. Carla', 0.78, 0.5, 8, 0.3),
    T('detalhe', 'com carinho, sua turma', 0.78, 0.66, 4.8, 0.32),
    E('broto1', 'folha', 0.768, 0.8, 5.5, '--sage', -38),
    E('broto2', 'folha', 0.792, 0.8, 5.5, '--sage', 38),
  ], 1106, '--paper'),

  // ---- esportes ----
  M('ciclismo', 'pandinha-esportes', ['ciclismo'], 'Um pedal de cada vez', 'Título, nome e detalhe à frente, o Pandinha ciclista no meio e retrato em coração', [
    TITULO('titulo', 'um pedal de cada vez', 0.19, 0.31, 9.5, 0.3),
    T('nome', 'Lucas', 0.19, 0.51, 10, 0.24),
    T('detalhe', 'quilômetros de alegria', 0.19, 0.66, 5, 0.28),
    ORNAMENTO('estrela', 0.19, 0.8),
    P('ciclismo', 0.5, 0.5, 66),
    F('foto', 0.8, 0.43, 0.2, 0.56, 'coracao'),
  ], 1107),
  M('academia', 'pandinha-esportes', ['musculacao'], 'Força que vem de dentro', 'Título em duas linhas, retrato no meio e o Pandinha com halteres', [
    T('linha1', 'força que', 0.21, 0.28, 9.5, 0.32),
    TITULO('linha2', 'vem de dentro', 0.21, 0.46, 12),
    T('nome', 'Bruna', 0.21, 0.68, 8, 0.26),
    ORNAMENTO('coracao', 0.21, 0.82),
    F('foto', 0.5, 0.44, 0.2, 0.62),
    P('academia', 0.81, 0.5, 61),
  ], 1108, '--paper'),
  M('corrida', 'pandinha-esportes', ['corrida'], 'Corro pra ficar leve', 'Retrato em coração, o Pandinha correndo no meio e o nome no verso', [
    F('foto', 0.19, 0.43, 0.22, 0.64, 'coracao'),
    T('legenda', 'a rua me chama', 0.19, 0.87, 5.5, 0.24, 'Caveat', '--peach-ink'),
    P('corrida', 0.5, 0.5, 64),
    TITULO('titulo', 'corro pra ficar leve', 0.81, 0.31, 10, 0.3),
    T('nome', 'Pedro', 0.81, 0.51, 9, 0.24),
    T('detalhe', 'cada quilômetro conta', 0.81, 0.66, 4.8, 0.3),
    ORNAMENTO('coracao', 0.81, 0.8),
  ], 1109),
  M('yoga', 'pandinha-esportes', ['yoga-pilates'], 'Respira e segue', 'Frase à frente, o Pandinha no tapete ao centro e retrato redondo', [
    TITULO('titulo', 'respira e segue', 0.2, 0.32, 11),
    T('nome', 'Marina', 0.2, 0.52, 9, 0.26),
    T('detalhe', 'namastê', 0.2, 0.67, 5.5, 0.2),
    E('broto1', 'folha', 0.188, 0.8, 5.5, '--sage', -38),
    E('broto2', 'folha', 0.212, 0.8, 5.5, '--sage', 38),
    P('yoga', 0.5, 0.5, 60),
    D('foto', 0.8, 0.44, 0.19),
  ], 1110, '--paper'),
  M('treino', 'pandinha-esportes', ['funcional'], 'Suor com sorriso', 'Retrato grande à frente, frase no meio e o Pandinha do treino funcional', [
    F('foto', 0.23, 0.45, 0.3, 0.74),
    TITULO('titulo', 'suor com sorriso', 0.56, 0.32, 10.5, 0.28),
    T('nome', 'Diego', 0.56, 0.52, 9, 0.24),
    T('detalhe', 'treino funcional', 0.56, 0.67, 5, 0.26),
    ORNAMENTO('estrela', 0.56, 0.8),
    P('treino', 0.85, 0.5, 60),
  ], 1111),
  M('futebol', 'pandinha-esportes', ['futebol'], 'Paixão que rola', 'Duas fotos retas, o Pandinha com a bola no meio e a frase embaixo', [
    F('foto1', 0.17, 0.41, 0.2, 0.56, 'retangulo'),
    F('foto2', 0.83, 0.41, 0.2, 0.56, 'retangulo'),
    T('nome1', 'Gabriel', 0.17, 0.8, 5.2, 0.22),
    T('nome2', 'camisa 10', 0.83, 0.8, 5.2, 0.22),
    P('futebol', 0.5, 0.43, 58),
    TITULO('titulo', 'paixão que rola', 0.5, 0.87, 9.5, 0.4),
    ORNAMENTO('estrela', 0.17, 0.9),
    ORNAMENTO('estrela2', 0.83, 0.9, 'estrela'),
  ], 1112, '--paper'),
  M('natacao', 'pandinha-esportes', [], 'A água é o meu lugar', 'O Pandinha da natação à frente, nome no meio e retrato em coração', [
    P('natacao', 0.2, 0.5, 62),
    TITULO('titulo', 'a água é o meu lugar', 0.52, 0.31, 10, 0.32),
    T('nome', 'Helena', 0.52, 0.52, 9, 0.26),
    T('detalhe', 'braçada por braçada', 0.52, 0.67, 5, 0.3),
    ORNAMENTO('coracao', 0.52, 0.8),
    F('foto', 0.82, 0.43, 0.2, 0.56, 'coracao'),
  ], 1113),

  // ---- paixões ----
  M('cozinha', 'pandinha-paixoes', ['hobby-cozinha'], 'Cozinhar é um carinho', 'Título em duas linhas, retrato redondo no meio e o Pandinha chef', [
    T('linha1', 'cozinhar é', 0.21, 0.28, 9.5, 0.32),
    TITULO('linha2', 'um carinho', 0.21, 0.46, 13),
    T('nome', 'Chef Ana', 0.21, 0.68, 7.5, 0.28),
    ORNAMENTO('coracao', 0.21, 0.82),
    D('foto', 0.5, 0.44, 0.18),
    P('cozinha', 0.81, 0.5, 62),
  ], 1114),
  M('confeitaria', 'pandinha-paixoes', ['hobby-cozinha'], 'A vida pede um docinho', 'Retrato redondo à frente, o Pandinha do cupcake no meio e a assinatura no verso', [
    D('foto', 0.19, 0.42, 0.19),
    T('legenda', 'feito com açúcar e afeto', 0.19, 0.86, 5, 0.3, 'Caveat', '--peach-ink'),
    P('confeitaria', 0.5, 0.5, 60),
    TITULO('titulo', 'a vida pede um docinho', 0.81, 0.31, 9, 0.33),
    T('nome', 'Ateliê da Nina', 0.81, 0.52, 7.5, 0.3),
    T('detalhe', 'confeitaria afetiva', 0.81, 0.67, 4.8, 0.3),
    ORNAMENTO('coracao', 0.81, 0.8),
  ], 1115, '--paper'),
  M('jardinagem', 'pandinha-paixoes', ['hobby-jardim'], 'Cultivando alegria', 'O Pandinha regando à frente, nome no meio e retrato arredondado', [
    P('jardinagem', 0.2, 0.5, 59),
    TITULO('titulo', 'cultivando alegria', 0.52, 0.31, 10.5, 0.32),
    T('nome', 'Rosa', 0.52, 0.52, 10, 0.2),
    T('detalhe', 'cada flor, um cuidado', 0.52, 0.67, 5, 0.3),
    ORNAMENTO('flor', 0.52, 0.8),
    F('foto', 0.82, 0.43, 0.21, 0.6),
  ], 1116),
  M('pintura', 'pandinha-paixoes', [], 'Cores que contam histórias', 'O Pandinha de pincel à frente, retrato reto no meio e assinatura no verso', [
    P('pintura', 0.19, 0.5, 60),
    F('foto', 0.47, 0.44, 0.22, 0.62, 'retangulo'),
    TITULO('titulo', 'cores que contam', 0.78, 0.29, 10.5, 0.34),
    TITULO('titulo2', 'histórias', 0.78, 0.45, 10.5, 0.34),
    T('nome', 'Teresa', 0.78, 0.63, 8, 0.24),
    ORNAMENTO('estrela', 0.78, 0.78),
  ], 1117, '--paper'),
  M('musica', 'pandinha-paixoes', ['hobby-musica'], 'Música é abraço', 'Duas fotos arredondadas, o Pandinha com violão no meio e a frase embaixo', [
    F('foto1', 0.17, 0.41, 0.2, 0.56),
    F('foto2', 0.83, 0.41, 0.2, 0.56),
    T('nome1', 'Caio', 0.17, 0.8, 5.5, 0.22),
    T('nome2', 'nosso som', 0.83, 0.8, 5.2, 0.22),
    P('musica', 0.5, 0.43, 57),
    TITULO('titulo', 'música é abraço', 0.5, 0.87, 9.5, 0.4),
    ORNAMENTO('coracao', 0.17, 0.9),
    ORNAMENTO('coracao2', 0.83, 0.9, 'coracao'),
  ], 1118),
  M('fotografia', 'pandinha-paixoes', [], 'Guardando instantes', 'Retrato grande em coração à frente, frase no meio e o Pandinha com a câmera', [
    F('foto', 0.23, 0.45, 0.3, 0.74, 'coracao'),
    TITULO('titulo', 'guardando instantes', 0.559, 0.31, 10, 0.33),
    T('nome', 'Luísa', 0.559, 0.51, 9, 0.24),
    T('detalhe', 'um clique, uma memória', 0.559, 0.66, 4.8, 0.28),
    ORNAMENTO('coracao', 0.559, 0.8),
    P('fotografia', 0.85, 0.5, 58),
  ], 1119, '--paper'),
  M('leitura', 'pandinha-paixoes', ['hobby-leitura'], 'Páginas que acolhem', 'O Pandinha lendo à frente, retrato redondo no meio e a frase no verso', [
    P('leitura', 0.19, 0.5, 58),
    D('foto', 0.47, 0.44, 0.18),
    TITULO('titulo', 'um livro, um café', 0.78, 0.3, 10.5),
    T('nome', 'Clara', 0.78, 0.5, 9, 0.24),
    T('detalhe', 'páginas que acolhem', 0.78, 0.66, 4.8, 0.3),
    ORNAMENTO('coracao', 0.78, 0.8),
  ], 1120),

  // ======== segundo lote (23/09/2026, à tarde) ========
  // ---- saúde ----
  M('psicologia', 'pandinha-saude', ['profissoes'], 'Escuta que acolhe', 'Retrato redondo à frente, dedicatória no meio e o Pandinha do coração no verso', [
    D('foto', 0.18, 0.44, 0.19),
    TITULO('titulo', 'escuta que acolhe', 0.48, 0.3, 10, 0.32),
    T('nome', 'Dra. Camila', 0.48, 0.51, 8.5, 0.3),
    T('detalhe', 'psicologia com carinho', 0.48, 0.66, 5, 0.3),
    ORNAMENTO('coracao', 0.48, 0.8),
    P('psicologia', 0.8, 0.5, 60),
  ], 1121),
  M('nutricao', 'pandinha-saude', ['profissoes'], 'Comer bem é carinho', 'O Pandinha com a tigela de frutas à frente, nome no meio e retrato reto', [
    P('nutricao', 0.2, 0.5, 60),
    TITULO('titulo', 'comer bem é carinho', 0.52, 0.3, 9.5, 0.32),
    T('nome', 'Nutri Paula', 0.52, 0.51, 8.5, 0.3),
    T('detalhe', 'saúde em cada prato', 0.52, 0.66, 5, 0.3),
    ORNAMENTO('folha', 0.52, 0.8),
    F('foto', 0.82, 0.44, 0.2, 0.6, 'retangulo'),
  ], 1122, '--paper'),
  M('fisioterapia', 'pandinha-saude', ['profissoes'], 'Movimento é vida', 'O Pandinha do elástico à frente, frase no meio e duas fotos no verso', [
    P('fisioterapia', 0.175, 0.5, 60),
    TITULO('titulo', 'movimento é vida', 0.46, 0.3, 9, 0.28),
    T('nome', 'Fisio Rodrigo', 0.46, 0.51, 7.5, 0.28),
    T('detalhe', 'um passo de cada vez', 0.46, 0.66, 4.8, 0.28),
    ORNAMENTO('coracao', 0.46, 0.8),
    F('foto1', 0.68, 0.42, 0.15, 0.44),
    F('foto2', 0.87, 0.42, 0.15, 0.44),
    T('legenda', 'cada evolução conta', 0.775, 0.82, 5.5, 0.36, 'Caveat', '--peach-ink'),
  ], 1123),
  M('farmacia', 'pandinha-saude', ['profissoes'], 'Fórmula de carinho', 'Frase à frente, o Pandinha do pilão no meio e retrato arredondado', [
    TITULO('titulo', 'fórmula de carinho', 0.19, 0.31, 9, 0.3),
    T('nome', 'Dr. André', 0.19, 0.51, 9.5, 0.26),
    T('detalhe', 'farmacêutico', 0.19, 0.66, 5, 0.26),
    ORNAMENTO('estrela', 0.19, 0.8),
    P('farmacia', 0.5, 0.5, 62),
    F('foto', 0.8, 0.43, 0.2, 0.56),
  ], 1124, '--paper'),

  // ---- profissões ----
  M('arquitetura', 'pandinha-profissoes', ['profissoes'], 'Projetando sonhos', 'Retrato grande e redondo à frente, assinatura no meio e o Pandinha com a maquete', [
    D('foto', 0.21, 0.45, 0.27),
    TITULO('titulo', 'projetando sonhos', 0.54, 0.3, 9.5, 0.3),
    T('nome', 'Arq. Sofia', 0.54, 0.5, 8, 0.26),
    T('detalhe', 'cada traço, um lar', 0.54, 0.66, 4.8, 0.28),
    ORNAMENTO('estrela', 0.54, 0.8),
    P('arquitetura', 0.84, 0.52, 58),
  ], 1125),
  M('programacao', 'pandinha-profissoes', ['profissoes'], 'Movido a café e boas ideias', 'Título em duas linhas, retrato reto no meio e o Pandinha do notebook', [
    T('linha1', 'movido a café', 0.21, 0.28, 9, 0.32),
    TITULO('linha2', 'e boas ideias', 0.21, 0.46, 12),
    T('nome', 'Dev Bruno', 0.21, 0.68, 7.5, 0.28),
    ORNAMENTO('estrela', 0.21, 0.82),
    F('foto', 0.5, 0.44, 0.2, 0.6, 'retangulo'),
    P('programacao', 0.81, 0.5, 61),
  ], 1126, '--paper'),
  M('ciencia', 'pandinha-profissoes', ['profissoes'], 'Curiosidade que transforma', 'O Pandinha do microscópio à frente, retrato em coração no meio e o título no verso', [
    P('ciencia', 0.19, 0.5, 60),
    F('foto', 0.47, 0.44, 0.22, 0.62, 'coracao'),
    TITULO('titulo', 'curiosidade que', 0.78, 0.29, 10, 0.34),
    TITULO('titulo2', 'transforma', 0.78, 0.45, 10, 0.34),
    T('nome', 'Dra. Íris', 0.78, 0.63, 8, 0.26),
    ORNAMENTO('estrela', 0.78, 0.78),
  ], 1127),
  M('direito', 'pandinha-profissoes', ['profissoes'], 'Justiça com coração', 'Retrato reto à frente, o Pandinha da balança no meio e a assinatura no verso', [
    F('foto', 0.18, 0.42, 0.23, 0.6, 'retangulo'),
    T('legenda', 'orgulho da família', 0.18, 0.84, 5.5, 0.26, 'Caveat', '--peach-ink'),
    P('direito', 0.5, 0.5, 62),
    TITULO('titulo', 'justiça com coração', 0.81, 0.31, 9.5, 0.32),
    T('nome', 'Dr. Henrique', 0.81, 0.52, 8, 0.3),
    T('detalhe', 'advocacia', 0.81, 0.67, 5, 0.3),
    ORNAMENTO('estrela', 0.81, 0.8),
  ], 1128, '--paper'),
  M('salao', 'pandinha-profissoes', ['profissoes'], 'Cada fio, um carinho', 'O Pandinha do secador à frente e três fotos arredondadas de trabalhos, com a frase embaixo', [
    P('salao', 0.17, 0.5, 58),
    F('foto1', 0.47, 0.34, 0.14, 0.4),
    F('foto2', 0.65, 0.34, 0.14, 0.4),
    F('foto3', 0.83, 0.34, 0.14, 0.4),
    TITULO('titulo', 'cada fio, um carinho', 0.65, 0.66, 10, 0.5),
    T('nome', 'Studio da Lu · beleza', 0.65, 0.8, 6, 0.4),
    ORNAMENTO('coracao', 0.65, 0.9),
  ], 1129),
  M('costura', 'pandinha-profissoes', ['profissoes'], 'Feito à mão', 'Duas fotos em coração à frente, assinatura do ateliê no meio e o Pandinha da máquina de costura', [
    F('foto1', 0.13, 0.42, 0.16, 0.46, 'coracao'),
    F('foto2', 0.32, 0.42, 0.16, 0.46, 'coracao'),
    T('legenda', 'ponto a ponto, uma história', 0.225, 0.83, 5.5, 0.36, 'Caveat', '--peach-ink'),
    TITULO('titulo', 'feito à mão', 0.585, 0.3, 10.5, 0.26),
    T('nome', 'Ateliê Dona Rosa', 0.585, 0.51, 7, 0.26),
    T('detalhe', 'costura com amor', 0.585, 0.66, 4.8, 0.26),
    ORNAMENTO('coracao', 0.585, 0.8),
    P('costura', 0.85, 0.5, 58),
  ], 1130, '--paper'),
  M('flores', 'pandinha-profissoes', ['profissoes'], 'Cada flor, um recado', 'Título em arco sobre o Pandinha do buquê, retrato redondo à frente e a assinatura no verso', [
    TITULO_ARCO('titulo', 'cada flor, um recado', 0.5, 0.15, 10, 0.46, 34),
    P('flores', 0.5, 0.61, 56),
    D('foto', 0.16, 0.46, 0.19),
    T('nome', 'Flores da Ana', 0.84, 0.42, 8, 0.26),
    T('detalhe', 'buquês com afeto', 0.84, 0.57, 5, 0.26),
    ORNAMENTO('flor', 0.84, 0.72),
  ], 1131),
  M('barista', 'pandinha-profissoes', ['profissoes', 'hobby-cafe'], 'Café com amor', 'Retrato arredondado à frente, a assinatura do barista no meio e o Pandinha do latte', [
    F('foto', 0.18, 0.44, 0.2, 0.6),
    TITULO('titulo', 'café com amor', 0.48, 0.3, 10.5, 0.32),
    T('nome', 'Barista João', 0.48, 0.51, 8.5, 0.3),
    T('detalhe', 'espresso, latte e carinho', 0.48, 0.66, 5, 0.3),
    ORNAMENTO('coracao', 0.48, 0.8),
    P('barista', 0.8, 0.5, 60),
  ], 1132, '--paper'),

  // ---- esportes ----
  M('tenis', 'pandinha-esportes', [], 'Game, set e alegria', 'Frase à frente, o Pandinha da raquete no meio e retrato reto no verso', [
    TITULO('titulo', 'game, set e alegria', 0.19, 0.31, 8.5, 0.3),
    T('nome', 'Carol', 0.19, 0.51, 10, 0.24),
    T('detalhe', 'tênis de domingo', 0.19, 0.66, 5, 0.26),
    ORNAMENTO('estrela', 0.19, 0.8),
    P('tenis', 0.5, 0.5, 64),
    F('foto', 0.8, 0.43, 0.2, 0.56, 'retangulo'),
  ], 1133),
  M('basquete', 'pandinha-esportes', [], 'Amor pela quadra', 'Duas fotos em coração, o Pandinha do basquete ao centro e a frase embaixo', [
    F('foto1', 0.17, 0.41, 0.2, 0.56, 'coracao'),
    F('foto2', 0.83, 0.41, 0.2, 0.56, 'coracao'),
    T('nome1', 'Rafa', 0.17, 0.8, 5.5, 0.22),
    T('nome2', 'camisa 23', 0.83, 0.8, 5.2, 0.22),
    P('basquete', 0.5, 0.43, 58),
    TITULO('titulo', 'amor pela quadra', 0.5, 0.87, 9.5, 0.4),
    ORNAMENTO('estrela', 0.17, 0.9),
    ORNAMENTO('estrela2', 0.83, 0.9, 'estrela'),
  ], 1134, '--paper'),
  M('volei', 'pandinha-esportes', [], 'Saque e sorriso', 'Duas fotos redondas à frente, o nome no meio e o Pandinha do vôlei no verso', [
    D('foto1', 0.13, 0.42, 0.15),
    D('foto2', 0.32, 0.42, 0.15),
    T('legenda', 'nosso time', 0.225, 0.82, 6, 0.3, 'Caveat', '--peach-ink'),
    TITULO('titulo', 'saque e sorriso', 0.585, 0.3, 9, 0.26),
    T('nome', 'Duda', 0.585, 0.51, 9, 0.24),
    T('detalhe', 'vôlei de praia', 0.585, 0.66, 5, 0.26),
    ORNAMENTO('estrela', 0.585, 0.8),
    P('volei', 0.85, 0.5, 58),
  ], 1135),
  M('skate', 'pandinha-esportes', [], 'Rolê do bem', 'O Pandinha do skate à frente, a frase no meio e duas fotos retas no verso', [
    P('skate', 0.175, 0.5, 60),
    TITULO('titulo', 'rolê do bem', 0.46, 0.3, 10.5, 0.28),
    T('nome', 'Enzo', 0.46, 0.51, 9, 0.24),
    T('detalhe', 'manobra por manobra', 0.46, 0.66, 4.8, 0.28),
    ORNAMENTO('estrela', 0.46, 0.8),
    F('foto1', 0.68, 0.42, 0.15, 0.44, 'retangulo'),
    F('foto2', 0.87, 0.42, 0.15, 0.44, 'retangulo'),
    T('legenda', 'sessão de sábado', 0.775, 0.82, 5.5, 0.36, 'Caveat', '--peach-ink'),
  ], 1136, '--paper'),
  M('patinacao', 'pandinha-esportes', [], 'Deslizando pela vida', 'Título em arco sobre o Pandinha dos patins, retrato em coração à frente e o nome no verso', [
    TITULO_ARCO('titulo', 'deslizando pela vida', 0.5, 0.15, 10, 0.46, 34),
    P('patinacao', 0.5, 0.61, 56),
    F('foto', 0.16, 0.46, 0.19, 0.54, 'coracao'),
    T('nome', 'Lara', 0.84, 0.42, 9, 0.24),
    T('detalhe', 'patins e liberdade', 0.84, 0.57, 5, 0.26),
    ORNAMENTO('coracao', 0.84, 0.72),
  ], 1137),
  M('trilha', 'pandinha-esportes', [], 'O caminho é o prêmio', 'Retrato reto à frente, a frase no meio e o Pandinha trilheiro no verso', [
    F('foto', 0.18, 0.44, 0.2, 0.6, 'retangulo'),
    TITULO('titulo', 'o caminho é o prêmio', 0.48, 0.3, 9, 0.32),
    T('nome', 'Tiago', 0.48, 0.51, 9, 0.26),
    T('detalhe', 'trilhas e cachoeiras', 0.48, 0.66, 5, 0.3),
    ORNAMENTO('folha', 0.48, 0.8),
    P('trilha', 0.8, 0.5, 62),
  ], 1138, '--paper'),
  M('pilates', 'pandinha-esportes', ['yoga-pilates'], 'Equilíbrio é tudo', 'Retrato em coração à frente, a frase no meio e o Pandinha do pilates no verso', [
    F('foto', 0.18, 0.44, 0.2, 0.56, 'coracao'),
    TITULO('titulo', 'equilíbrio é tudo', 0.48, 0.3, 10, 0.32),
    T('nome', 'Bia', 0.48, 0.51, 9, 0.24),
    T('detalhe', 'pilates e respiro', 0.48, 0.66, 5, 0.3),
    E('broto1', 'folha', 0.468, 0.8, 5.5, '--sage', -38),
    E('broto2', 'folha', 0.492, 0.8, 5.5, '--sage', 38),
    P('pilates', 0.8, 0.5, 62),
  ], 1139),
  M('surf', 'pandinha-esportes', [], 'Alma de onda', 'O Pandinha da prancha à frente, a frase no meio e duas fotos redondas no verso', [
    P('surf', 0.175, 0.5, 62),
    TITULO('titulo', 'alma de onda', 0.46, 0.3, 10.5, 0.28),
    T('nome', 'Gui', 0.46, 0.51, 9, 0.24),
    T('detalhe', 'sal, sol e prancha', 0.46, 0.66, 5, 0.28),
    ORNAMENTO('estrela', 0.46, 0.8),
    D('foto1', 0.68, 0.42, 0.15),
    D('foto2', 0.87, 0.42, 0.15),
    T('legenda', 'temporada 2026', 0.775, 0.82, 5.5, 0.34, 'Caveat', '--peach-ink'),
  ], 1140, '--paper'),

  // ---- ocasiões ----
  M('formatura', 'pandinha-ocasioes', ['amizade'], 'Conquista nossa', 'Duas fotos arredondadas à frente, o nome da formanda no meio e o Pandinha de beca no verso', [
    F('foto1', 0.13, 0.42, 0.16, 0.46),
    F('foto2', 0.32, 0.42, 0.16, 0.46),
    T('legenda', 'da matrícula ao diploma', 0.225, 0.83, 5.5, 0.36, 'Caveat', '--peach-ink'),
    TITULO('titulo', 'conquista nossa', 0.585, 0.3, 9, 0.26),
    T('nome', 'Letícia', 0.585, 0.51, 9, 0.24),
    T('detalhe', 'formanda de 2026', 0.585, 0.66, 4.8, 0.26),
    ORNAMENTO('estrela', 0.585, 0.8),
    P('formatura', 0.85, 0.5, 58),
  ], 1141),
  M('aniversario', 'pandinha-ocasioes', ['aniversario'], 'Mais um ano de alegria', 'O Pandinha do bolo à frente com um presente ao lado, três fotos redondas e a frase embaixo', [
    P('aniversario', 0.17, 0.48, 58),
    ADESIVO('presente', 'presente-carinho', 0.33, 0.84, 15),
    D('foto1', 0.47, 0.34, 0.14),
    D('foto2', 0.65, 0.34, 0.14),
    D('foto3', 0.83, 0.34, 0.14),
    TITULO('titulo', 'mais um ano de alegria', 0.65, 0.66, 10, 0.5),
    T('nome', 'Malu · 7 anos', 0.65, 0.8, 6, 0.4),
  ], 1142, '--paper'),
  M('natal', 'pandinha-ocasioes', ['natal'], 'Natal com o Pandinha', 'Título em arco sobre o Pandinha do presente, retrato arredondado à frente e a assinatura da família', [
    TITULO_ARCO('titulo', 'Feliz Natal', 0.5, 0.15, 12, 0.46, 30),
    P('natal', 0.5, 0.61, 56),
    F('foto', 0.16, 0.46, 0.2, 0.56),
    T('nome', 'Família Silva', 0.84, 0.42, 8, 0.26),
    T('detalhe', 'Natal de 2026', 0.84, 0.57, 5, 0.26),
    ORNAMENTO('estrela', 0.84, 0.72),
  ], 1143),
  M('pascoa', 'pandinha-ocasioes', ['pascoa'], 'Páscoa com o Pandinha', 'O Pandinha da cestinha à frente com margaridas, três fotos em coração e a frase embaixo', [
    P('pascoa', 0.17, 0.48, 58),
    ADESIVO('margaridas', 'margaridas', 0.345, 0.85, 14),
    F('foto1', 0.47, 0.34, 0.14, 0.4, 'coracao'),
    F('foto2', 0.65, 0.34, 0.14, 0.4, 'coracao'),
    F('foto3', 0.83, 0.34, 0.14, 0.4, 'coracao'),
    TITULO('titulo', 'Feliz Páscoa', 0.65, 0.66, 11, 0.5),
    T('nome', 'com carinho, vovó Lia', 0.65, 0.8, 6, 0.4),
  ], 1144, '--paper'),
  M('padrinho', 'pandinha-ocasioes', ['casamento', 'batismo'], 'Aceita ser meu padrinho?', 'Convite em arco sobre o Pandinha, retrato reto à frente e o laço pêssego na assinatura', [
    TITULO_ARCO('titulo', 'aceita ser meu padrinho?', 0.5, 0.15, 9, 0.46, 30),
    P('padrinho', 0.5, 0.61, 56),
    F('foto', 0.16, 0.46, 0.2, 0.56, 'retangulo'),
    T('nome', 'Tio Marcos', 0.84, 0.42, 8, 0.26),
    T('detalhe', 'com amor, Ana e Leo', 0.84, 0.57, 5, 0.26),
    ADESIVO('laco', 'laco-pessego', 0.84, 0.74, 13),
  ], 1145),
  M('madrinha', 'pandinha-ocasioes', ['madrinhas', 'batismo'], 'Aceita ser minha madrinha?', 'O Pandinha de lacinho à frente, o convite em duas linhas e duas fotos em coração no verso', [
    P('madrinha', 0.175, 0.5, 60),
    TITULO('linha1', 'aceita ser', 0.46, 0.27, 10, 0.28),
    TITULO('linha2', 'minha madrinha?', 0.46, 0.43, 9.5, 0.28),
    T('nome', 'Carol', 0.46, 0.61, 8.5, 0.24),
    ADESIVO('laco', 'laco-pessego', 0.46, 0.79, 13),
    F('foto1', 0.68, 0.42, 0.15, 0.42, 'coracao'),
    F('foto2', 0.87, 0.42, 0.15, 0.42, 'coracao'),
    T('legenda', 'batizado do Theo', 0.775, 0.82, 5.5, 0.34, 'Caveat', '--peach-ink'),
  ], 1146, '--paper'),
  M('bebe', 'pandinha-ocasioes', ['bebe'], 'Boas-vindas, amor', 'O Pandinha da mantinha à frente, nome e peso no meio e retrato redondo com a data', [
    P('bebe', 0.2, 0.5, 60),
    TITULO('titulo', 'boas-vindas, amor', 0.52, 0.3, 9.5, 0.32),
    T('nome', 'Theo', 0.52, 0.51, 10, 0.2),
    T('detalhe', '3,2 kg de alegria', 0.52, 0.66, 5, 0.3),
    ORNAMENTO('coracao', 0.52, 0.8),
    D('foto', 0.82, 0.42, 0.19),
    T('legenda', '12 de maio de 2026', 0.82, 0.86, 5, 0.24, 'Caveat', '--peach-ink'),
  ], 1147),
  M('casa', 'pandinha-ocasioes', ['casa-nova'], 'Lar, doce lar', 'Retrato reto à frente com a legenda das chaves, o casal no meio e o Pandinha da casinha', [
    F('foto', 0.18, 0.43, 0.2, 0.56, 'retangulo'),
    T('legenda', 'nossas primeiras chaves', 0.18, 0.86, 5, 0.28, 'Caveat', '--peach-ink'),
    TITULO('titulo', 'lar, doce lar', 0.48, 0.3, 10.5, 0.32),
    T('nome', 'Lia & Pedro', 0.48, 0.51, 8.5, 0.3),
    T('detalhe', 'Rua das Flores, 120', 0.48, 0.66, 5, 0.3),
    ORNAMENTO('coracao', 0.48, 0.8),
    P('casa', 0.8, 0.5, 62),
  ], 1148, '--paper'),
  M('amizade', 'pandinha-ocasioes', ['amizade'], 'Amizade é abrigo', 'Duas fotos retas à frente, a frase no meio com o coração de folhas e o Pandinha da amizade', [
    F('foto1', 0.13, 0.42, 0.16, 0.46, 'retangulo'),
    F('foto2', 0.32, 0.42, 0.16, 0.46, 'retangulo'),
    T('legenda', 'eu e você, desde sempre', 0.225, 0.83, 5.5, 0.36, 'Caveat', '--peach-ink'),
    TITULO('titulo', 'amizade é abrigo', 0.585, 0.3, 8.5, 0.26),
    T('nome', 'Ju & Bia', 0.585, 0.51, 9, 0.24),
    ADESIVO('coracao', 'coracao-botanico', 0.585, 0.73, 13),
    P('amizade', 0.85, 0.5, 58),
  ], 1149),
  M('obrigado', 'pandinha-ocasioes', ['agradecimento'], 'Obrigado por tudo', 'Agradecimento à frente com o coração de folhas, o Pandinha da margarida e retrato em coração', [
    TITULO('titulo', 'obrigado por tudo', 0.19, 0.31, 9, 0.3),
    T('nome', 'Tia Rê', 0.19, 0.51, 10, 0.24),
    T('detalhe', 'de toda a turma', 0.19, 0.66, 5, 0.26),
    ADESIVO('coracao', 'coracao-botanico', 0.19, 0.82, 12),
    P('obrigado', 0.5, 0.5, 62),
    F('foto', 0.8, 0.43, 0.2, 0.56, 'coracao'),
    T('legenda', 'com amor, 5º ano B', 0.8, 0.86, 5, 0.24, 'Caveat', '--peach-ink'),
  ], 1150, '--paper'),
  M('cartinha', 'pandinha-ocasioes', ['namorados'], 'Escrevi pra você', 'Retrato grande arredondado à frente, o recado no meio e o Pandinha da cartinha', [
    F('foto', 0.22, 0.43, 0.3, 0.7),
    T('legenda', 'nós dois', 0.22, 0.9, 5.5, 0.2, 'Caveat', '--peach-ink'),
    TITULO('titulo', 'escrevi pra você', 0.546, 0.3, 10, 0.32),
    T('nome', 'Lu', 0.546, 0.5, 10, 0.2),
    T('detalhe', 'com todo o meu carinho', 0.546, 0.66, 4.8, 0.28),
    ADESIVO('coracao', 'coracao-botanico', 0.546, 0.81, 11),
    P('cartinha', 0.845, 0.52, 58),
  ], 1151),

  // ---- paixões ----
  M('viagem', 'pandinha-paixoes', ['hobby-viagens'], 'Mundo afora', 'Retrato redondo à frente, o Pandinha viajante no meio e o próximo destino no verso', [
    D('foto', 0.19, 0.43, 0.19),
    P('viagem', 0.5, 0.5, 62),
    TITULO('titulo', 'mundo afora', 0.81, 0.31, 11, 0.3),
    T('nome', 'Bia & Léo', 0.81, 0.51, 8.5, 0.28),
    T('detalhe', 'próximo destino: Lisboa', 0.81, 0.66, 4.8, 0.3),
    ORNAMENTO('estrela', 0.81, 0.8),
  ], 1152, '--paper'),
  M('acampamento', 'pandinha-paixoes', ['hobby-viagens'], 'Noites de fogueira', 'O Pandinha da barraca à frente e três fotos retas das noites, com a frase embaixo', [
    P('acampamento', 0.17, 0.5, 58),
    F('foto1', 0.47, 0.34, 0.14, 0.4, 'retangulo'),
    F('foto2', 0.65, 0.34, 0.14, 0.4, 'retangulo'),
    F('foto3', 0.83, 0.34, 0.14, 0.4, 'retangulo'),
    TITULO('titulo', 'noites de fogueira', 0.65, 0.66, 10, 0.5),
    T('nome', 'acampamento 2026', 0.65, 0.8, 6, 0.4),
    ORNAMENTO('estrela', 0.65, 0.9),
  ], 1153),
  M('cinema', 'pandinha-paixoes', [], 'Pipoca, filme e você', 'O Pandinha da pipoca à frente, a frase no meio e retrato reto com o filme favorito', [
    P('cinema', 0.2, 0.5, 60),
    TITULO('titulo', 'pipoca, filme e você', 0.52, 0.3, 9, 0.32),
    T('nome', 'Clara', 0.52, 0.51, 9, 0.24),
    T('detalhe', 'sextas de cinema', 0.52, 0.66, 5, 0.3),
    ORNAMENTO('estrela', 0.52, 0.8),
    F('foto', 0.82, 0.42, 0.2, 0.56, 'retangulo'),
    T('legenda', 'nosso filme favorito', 0.82, 0.86, 5, 0.24, 'Caveat', '--peach-ink'),
  ], 1154, '--paper'),
  M('games', 'pandinha-paixoes', [], 'Mais uma fase', 'Frase à frente, o Pandinha do controle no meio e retrato redondo do parceiro de jogo', [
    TITULO('titulo', 'mais uma fase', 0.19, 0.31, 10.5, 0.3),
    T('nome', 'Davi', 0.19, 0.51, 10, 0.24),
    T('detalhe', 'player 1', 0.19, 0.66, 5, 0.26),
    ORNAMENTO('estrela', 0.19, 0.8),
    P('games', 0.5, 0.5, 64),
    D('foto', 0.8, 0.42, 0.19),
    T('legenda', 'meu parceiro de jogo', 0.8, 0.86, 5, 0.26, 'Caveat', '--peach-ink'),
  ], 1155),
]);
