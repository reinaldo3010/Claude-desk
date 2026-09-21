/*
  Os atalhos para escrever uma camada de modelo.

  Toda posição é fração da área de impressão (210 × 90 mm): `x` de 0 (borda junto da alça) a 1, `y`
  de 0 (topo) a 1. O tamanho de uma frase é em milímetros; o de um enfeite ou ilustração é fração
  da altura da área. Os modelos da casa e os das coleções usam os mesmos atalhos, para uma coleção
  nova não inventar um formato próprio.
*/

/** Espaço de foto. Para um círculo de verdade, `altura` = `largura` × 210 ÷ 90. */
export const foto = (id, rotulo, forma, x, y, largura, altura) =>
  ({ id, tipo: 'foto', rotulo, forma, x, y, largura, altura, rotacao: 0, ajuste: { scale: 1, offsetX: 0, offsetY: 0 } });

/** Espaço de foto redondo: a altura sai da largura, para o círculo não virar ovo. */
export const fotoRedonda = (id, rotulo, x, y, largura) =>
  foto(id, rotulo, 'circulo', x, y, largura, Number((largura * 210 / 90).toFixed(4)));

/** Frase editável. `tamanho` em milímetros; `largura` é o limite de quebra, em fração. */
export const frase = (id, rotulo, texto, x, y, tamanho, extra = {}) =>
  ({ id, tipo: 'frase', rotulo, texto, x, y, tamanho, largura: 0.3, fonte: 'Caveat', cor: '--hand-ink', rotacao: 0, ...extra });

/** O Pandinha adesivo, um por peça. */
export const panda = (x, y, tamanho = 0.15, arquivo = 'assets/panda-coracao.webp') =>
  ({ id: 'pandinha', tipo: 'adesivo', rotulo: 'Pandinha', arquivo, x, y, tamanho, rotacao: 0 });

/** Ilustração de coleção: entra como enfeite, então a pessoa move, gira e recolore como os outros. */
export const ilustra = (id, rotulo, forma, x, y, tamanho, cor = '--ink', extra = {}) =>
  ({ id, tipo: 'enfeite', rotulo, forma, x, y, tamanho, cor, rotacao: 0, ...extra });
