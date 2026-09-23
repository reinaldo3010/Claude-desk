/*
  As peças do estúdio, num lugar só (decisão do dono, 23/09/2026: o estúdio cresce para a garrafa,
  a ecobag e o que vier). Tudo o que muda de uma peça para outra mora aqui: a medida, as cores, as
  vistas, os textos da página, o que vai escrito no pedido e o nome dos arquivos. O desenho em 3D de
  cada peça fica no próprio arquivo (`caneca-3d.js`, `garrafa-3d.js`) e só carrega quando a pessoa
  escolhe a peça.

  As medidas são de REFERÊNCIA, como sempre foram as da caneca: não são a medição de uma peça do
  fornecedor. Quando a lista dele chegar, recalibra-se aqui, e a arte, a vista aberta, o arquivo de
  300 dpi e o gabarito acompanham.

  Este arquivo não carrega o three.js: os testes em Node leem as medidas daqui.
*/

/** Em milímetros. `heightMm` é a altura da faixa da peça que recebe a arte (o canvas da textura). */
export const ESPECIFICACOES = Object.freeze({
  caneca: Object.freeze({ diameterMm: 82, heightMm: 95, printWidthMm: 210, printHeightMm: 90 }),
  // Garrafa térmica de 1 L: uns 80 mm de diâmetro; a parede reta tem 200 mm e a arte, 230 × 180 mm,
  // com a emenda atrás da alça (medida de referência aprovada pelo dono em 23/09/2026).
  garrafa: Object.freeze({ diameterMm: 80, heightMm: 200, printWidthMm: 230, printHeightMm: 180 }),
  // Ecobag de algodão cru de uns 35 × 40 cm, com a arte de 25 × 30 cm no meio do painel da frente.
  // É plana: não dá a volta, então `widthMm` é a largura do painel, e não uma circunferência.
  ecobag: Object.freeze({ widthMm: 350, heightMm: 400, printWidthMm: 250, printHeightMm: 300, plana: true }),
});

/**
 * Onde a frente (u=.25) e o verso (u=.75) caem dentro da área de impressão, em fração dela. A peça
 * plana tem só a frente, que é o meio da arte.
 */
export function ladosDaPeca(spec) {
  if (spec.plana) return { frente: 0.5, verso: 0.5 };
  const volta = Math.PI * spec.diameterMm;
  const frente = (0.25 * volta - (volta - spec.printWidthMm) / 2) / spec.printWidthMm;
  return { frente, verso: 1 - frente };
}

// Cores da cerâmica: dado físico da peça (manual 7.4), não cor de interface.
export const CERAMICA = Object.freeze({
  branca: '#ffffff', preta: '#1d1b19', vermelha: '#b7262b', amarela: '#f0c233', rosa: '#f3a4b7', azul: '#1f5aa3',
});
// O nome de cada cor, como sai no pedido e no rótulo da bolinha.
export const NOMES_DA_CERAMICA = Object.freeze({
  branca: 'Branco', preta: 'Preto', vermelha: 'Vermelho', amarela: 'Amarelo', rosa: 'Rosa', azul: 'Azul',
});
export const COMBINACOES_DA_CANECA = Object.freeze({
  branca: { inside: 'branca', handle: 'branca', nome: 'Toda branca' },
  preta: { inside: 'preta', handle: 'preta', nome: 'Preto e branco' },
  rosa: { inside: 'rosa', handle: 'rosa', nome: 'Toque rosa' },
});

// As quatro cores em que as peças saem (manual 7.4). Dado físico da peça, como a cerâmica.
export const CORES_DAS_PECAS = Object.freeze({
  creme: '#F3EEE4', salvia: '#A8C5A2', pessego: '#FFB59C', preta: '#1F1D1A',
});
export const NOMES_DAS_CORES_DAS_PECAS = Object.freeze({
  creme: 'Creme', salvia: 'Sálvia', pessego: 'Pêssego', preta: 'Preta',
});

// O algodão cru da ecobag: a cor natural do tecido, dado físico da peça como a cerâmica.
export const CORES_DA_ECOBAG = Object.freeze({ cru: '#E9DDC7' });
export const NOMES_DAS_CORES_DA_ECOBAG = Object.freeze({ cru: 'Algodão cru' });

export const ACABAMENTOS_DA_CANECA = Object.freeze([
  { id: 'brilhante', nome: 'Brilhante', descricao: 'Vidrado de cerâmica, como a peça padrão' },
  { id: 'fosco', nome: 'Fosco', descricao: 'Sem brilho, toque aveludado' },
]);

/**
 * As cenas da prévia, com a descrição na palavra da peça ("Só a garrafa, com a sombra"). A peça pode
 * ficar só com algumas (`cenas`): a ecobag em cima da caixa de presente não é como ela se dá.
 */
export function cenasDaPeca(peca) {
  const todas = [
    { id: 'estudio', nome: 'Fundo claro', descricao: `Só a ${peca.palavra}, com a sombra` },
    { id: 'madeira', nome: 'Mesa de madeira', descricao: 'Como na mesa do café' },
    { id: 'linho', nome: 'Mesa clara', descricao: 'Toalha de linho, luz de manhã' },
    { id: 'presente', nome: 'Caixa de presente', descricao: 'Em cima da caixa kraft, com fita' },
  ];
  return peca.cenas ? todas.filter((cena) => peca.cenas.includes(cena.id)) : todas;
}

const cm = (mm) => String(Math.round(mm / 10));

/*
  Cada peça:
  - `nome` é o que o botão de "Qual peça?" diz; `palavra` entra nas frases ("gire a garrafa");
    as três peças são femininas, então "a", "sua" e "da" servem a todas.
  - `cores` diz que partes da peça têm cor e de que paleta. A caneca tem interior e alça; a garrafa,
    uma cor só, que a tampa e a alça acompanham.
  - `textos` preenche os lugares da página marcados com `data-texto` (e `data-rotulo`, para o leitor
    de tela). A caneca não precisa: os textos dela são os da própria página.
*/
export const PECAS = Object.freeze({
  caneca: Object.freeze({
    id: 'caneca',
    nome: 'Caneca',
    descricao: 'Caneca reta 325 ml',
    palavra: 'caneca',
    plural: 'canecas',
    spec: ESPECIFICACOES.caneca,
    lados: ladosDaPeca(ESPECIFICACOES.caneca),
    forma3d: () => import('./caneca-3d.js').then((m) => m.FORMA_DA_CANECA),
    vistas: Object.freeze({ front: 'Frente', back: 'Verso', handle: 'Alça', inside: 'Interior' }),
    cores: Object.freeze({
      partes: [{ chave: 'inside', rotulo: 'Interior', alvo: 'cores-interior' }, { chave: 'handle', rotulo: 'Alça', alvo: 'cores-alca' }],
      paleta: CERAMICA, nomes: NOMES_DA_CERAMICA, combinacoes: COMBINACOES_DA_CANECA,
    }),
    acabamentos: ACABAMENTOS_DA_CANECA,
    // Onde e de que tamanho um item novo nasce, em fração da área (a escala vale para enfeite, Pandinha e
    // elemento, que se medem pela altura dela). Os números da caneca são os de sempre.
    novos: Object.freeze({ foto: { largura: 0.24, altura: 0.6 }, frase: { tamanho: 10, largura: 0.28 }, escala: 1 }),
    // A cerâmica branca é o fundo da sublimação: onde não há arte, sai branco.
    substrato: 'white',
    pedido: (state, nome) => ['• Caneca reta de 325 ml, branca por fora', `• Interior: ${nome(state.inside)} · Alça: ${nome(state.handle)}`],
  }),
  garrafa: Object.freeze({
    id: 'garrafa',
    nome: 'Garrafa',
    descricao: 'Garrafa térmica 1 L',
    palavra: 'garrafa',
    plural: 'garrafas',
    spec: ESPECIFICACOES.garrafa,
    lados: ladosDaPeca(ESPECIFICACOES.garrafa),
    forma3d: () => import('./garrafa-3d.js').then((m) => m.FORMA_DA_GARRAFA),
    vistas: Object.freeze({ front: 'Frente', back: 'Verso', handle: 'Alça', inside: 'Tampa' }),
    cores: Object.freeze({
      partes: [{ chave: 'corpo', rotulo: 'Garrafa', alvo: 'cores-corpo' }],
      paleta: CORES_DAS_PECAS, nomes: NOMES_DAS_CORES_DAS_PECAS, combinacoes: null,
    }),
    acabamentos: Object.freeze([]),
    // A área é o dobro da altura da caneca: o item novo nasce na medida da garrafa (foto de uns 6 cm, nome
    // de 16 mm), não miúdo como sairia com os números da caneca.
    novos: Object.freeze({ foto: { largura: 0.26, altura: 0.34 }, frase: { tamanho: 16, largura: 0.36 }, escala: 0.6 }),
    // A arte vai sobre a cor da garrafa: onde não há arte, aparece a garrafa, e o arquivo sai sem fundo.
    substrato: null,
    // As duas tintas dos modelos da garrafa, pela cor dela (manual 7.4: arte em papel na peça preta e na
    // pêssego, em nanquim nas outras). O estúdio as preenche em `--tinta-da-peca` e `--acento-da-peca`.
    tintas: Object.freeze({
      creme: { tinta: '--ink-soft', acento: '--peach-ink' },
      salvia: { tinta: '--ink-soft', acento: '--peach-ink' },
      pessego: { tinta: '--paper', acento: '--paper' },
      preta: { tinta: '--paper', acento: '--paper' },
    }),
    pedido: (state, nome) => ['• Garrafa térmica de 1 L, inox com tampa e alça', `• Cor da garrafa: ${nome(state.corpo)}`],
    textos: Object.freeze({
      tituloHand: 'Sua garrafa.',
      tituloLede: 'Uma foto, uma lembrança, um carinho.<br>Gire a garrafa e veja sua ideia de todos os lados.',
      carregando: 'Preparando sua garrafa…',
      ajudaDasCores: 'A tampa e a alça acompanham a cor da garrafa.',
      ajudaDaCena: 'Veja a garrafa como ela vai aparecer na foto do presente.',
      sobreAArteAberta: 'Esta é a área que envolve a garrafa, com a emenda atrás da alça. Puxe um canto para aumentar e o botão de cima para girar.',
      margem: 'É a faixa de 5 mm nas bordas da arte. A garrafa é estampada com a folha envolvendo a peça, e essa folha pode escorregar um fio de milímetro. O que estiver fora da margem corre o risco de sair cortado — então nome, data e rosto ficam para dentro dela.',
      legenda: 'Modelo de referência de 1 L. A gente confere a peça, a cor e a arte final antes de produzir.',
      intro: 'Escolha um modelo, coloque as fotos e escreva do seu jeito. Clique em cima da garrafa para mexer em qualquer item.',
      boasvindasGira: '<strong>Ponha suas fotos e escreva do seu jeito.</strong> A garrafa gira para você ver de todos os lados antes de decidir.',
      canvaVolta: 'A volta da garrafa tem ',
      dpi: 'São 300 pontinhos de tinta por polegada — a densidade em que a estampa sai nítida. Na prática: uma foto precisa ter mais ou menos 2.720 × 2.130 pontos para ocupar a volta inteira sem ficar borrada. Foto de WhatsApp costuma ter menos, e por isso a gente avisa quando a sua está apertada.',
      ajudaDosEnfeites: 'Toque num desenho para acrescentar na garrafa.',
      video: 'Baixar vídeo da garrafa girando',
      rotuloPrevia: 'Prévia da garrafa',
      rotuloViewport: 'Prévia da garrafa em três dimensões',
      rotuloVistas: 'Escolher vista da garrafa',
      rotuloZoom: 'Aproximar a garrafa',
      rotuloControles: 'Montar a arte da garrafa',
    }),
  }),
  ecobag: Object.freeze({
    id: 'ecobag',
    nome: 'Ecobag',
    descricao: 'Ecobag de algodão cru 35 × 40 cm',
    palavra: 'ecobag',
    plural: 'ecobags',
    spec: ESPECIFICACOES.ecobag,
    lados: ladosDaPeca(ESPECIFICACOES.ecobag),
    forma3d: () => import('./ecobag-3d.js').then((m) => m.FORMA_DA_ECOBAG),
    vistas: Object.freeze({ front: 'Frente', back: 'Verso', handle: 'Lado', inside: 'Por dentro' }),
    // Uma cor só, a do tecido: o catálogo vende a ecobag em algodão cru, e não se inventa cor que o
    // fornecedor não tem. Sem bolinhas para escolher; a ajuda diz a cor.
    cores: Object.freeze({ partes: [], paleta: CORES_DA_ECOBAG, nomes: NOMES_DAS_CORES_DA_ECOBAG, combinacoes: null, fixa: 'cru' }),
    acabamentos: Object.freeze([]),
    cenas: Object.freeze(['estudio', 'madeira', 'linho']),
    // A arte é um painel em pé de 25 × 30 cm, só na frente: "nos dois lados" e "ao redor" não existem.
    layouts: Object.freeze(['front']),
    novos: Object.freeze({ foto: { largura: 0.28, altura: 0.233 }, frase: { tamanho: 20, largura: 0.5 }, escala: 0.5 }),
    substrato: null,
    tintas: Object.freeze({ cru: { tinta: '--ink-soft', acento: '--peach-ink' } }),
    pedido: () => ['• Ecobag de algodão cru, 35 × 40 cm', '• Arte na frente'],
    textos: Object.freeze({
      tituloHand: 'Sua ecobag.',
      tituloLede: 'Uma foto, uma lembrança, um carinho.<br>Gire a ecobag e veja sua ideia de todos os lados.',
      carregando: 'Preparando sua ecobag…',
      ajudaDasCores: 'Algodão cru, na cor natural do tecido.',
      ajudaDaCena: 'Veja a ecobag como ela vai aparecer na foto do presente.',
      sobreAArteAberta: 'Esta é a área da frente da ecobag. Puxe um canto para aumentar e o botão de cima para girar.',
      margem: 'É a faixa de 5 mm nas bordas da arte. A estampa vai por cima do tecido e pode escorregar um fio de milímetro. O que estiver fora da margem corre o risco de sair cortado — então nome, data e rosto ficam para dentro dela.',
      legenda: 'Modelo de referência de 35 × 40 cm. A gente confere a peça e a arte final antes de produzir.',
      intro: 'Escolha um modelo, coloque as fotos e escreva do seu jeito. Clique em cima da ecobag para mexer em qualquer item.',
      boasvindasGira: '<strong>Ponha suas fotos e escreva do seu jeito.</strong> A ecobag gira para você ver de todos os lados antes de decidir.',
      canvaVolta: 'A arte da ecobag tem ',
      dpi: 'São 300 pontinhos de tinta por polegada — a densidade em que a estampa sai nítida. Na prática: uma foto precisa ter mais ou menos 2.950 × 3.540 pontos para ocupar a arte inteira sem ficar borrada. Foto de WhatsApp costuma ter menos, e por isso a gente avisa quando a sua está apertada.',
      ajudaDosEnfeites: 'Toque num desenho para acrescentar na ecobag.',
      video: 'Baixar vídeo da ecobag girando',
      rotuloPrevia: 'Prévia da ecobag',
      rotuloViewport: 'Prévia da ecobag em três dimensões',
      rotuloVistas: 'Escolher vista da ecobag',
      rotuloZoom: 'Aproximar a ecobag',
      rotuloControles: 'Montar a arte da ecobag',
    }),
  }),
});

export const PECA_PADRAO = 'caneca';
export const pecaPorId = (id) => PECAS[id] || PECAS[PECA_PADRAO];

/** O tamanho da arte em palavras, para o título da arte aberta ("área de 21 × 9 cm"). */
export const areaEmPalavras = (spec) => `área de ${cm(spec.printWidthMm)} × ${cm(spec.printHeightMm)} cm`;
