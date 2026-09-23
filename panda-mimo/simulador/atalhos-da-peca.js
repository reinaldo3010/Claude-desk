/*
  Os atalhos para escrever os modelos de uma peça que não é a caneca (a garrafa, a ecobag), na medida
  dela. Os da caneca moram em `camadas.js` e medem pela área de 210 × 90 mm; estes recebem a peça e
  medem pela área dela, para uma foto redonda sair redonda e um Pandinha de 6 cm sair com 6 cm.

  Posição em fração da área; frase em mm; desenho, enfeite e Pandinha pela largura em mm, que vira
  fração da altura da área, como a caneca faz com os 90 mm dela.

  O estilo é o das coleções da casa depois da revisão de papelaria: Nunito e Caveat, confete pouco e
  miúdo, nada girado. A arte vai sobre a cor da peça, sem fundo pintado, e as frases usam as duas
  tintas que acompanham a cor escolhida (manual 7.4): `--tinta-da-peca` e `--acento-da-peca`, que o
  estúdio preenche pela peça e pela cor dela.
*/
import { foto, frase, panda } from './camadas.js';
import { ESPECIFICACOES, ladosDaPeca } from './pecas.js';
import { nomeDaIlustracao } from './nomes-de-ilustracao.js';
import { ILUSTRACOES } from './colecoes.js';

export const TINTA = '--tinta-da-peca';
export const ACENTO = '--acento-da-peca';

export function atalhosDaPeca(peca) {
  const spec = ESPECIFICACOES[peca];
  const { printWidthMm: largura, printHeightMm: altura } = spec;
  const { frente, verso } = ladosDaPeca(spec);
  return {
    frente, verso,
    /** Desenho de coleção pela largura em mm, na tinta principal dele. */
    I: (id, forma, x, y, mm) => ({
      id, tipo: 'enfeite', rotulo: nomeDaIlustracao(forma) || forma, forma, x, y, tamanho: mm / altura, rotacao: 0,
      cor: ILUSTRACOES[forma].primary,
    }),
    /** Enfeite simples (coração, folha…) pela largura em mm. */
    E: (id, rotulo, forma, x, y, mm, cor = '--peach-deep') => ({ id, tipo: 'enfeite', rotulo, forma, x, y, tamanho: mm / altura, rotacao: 0, cor }),
    /** Frase: texto, lugar, corpo em mm e largura máxima em mm. */
    T: (id, rotulo, texto, x, y, mm, larguraMm, fonte = 'Nunito', cor = TINTA, extra = {}) =>
      frase(id, rotulo, texto, x, y, mm, { largura: larguraMm / largura, fonte, cor, ...extra }),
    /** Foto redonda pela largura em mm: a altura sai da proporção da área, e o círculo não vira ovo. */
    D: (id, x, y, mm) => foto(id, 'Sua foto', 'circulo', x, y, mm / largura, mm / altura),
    /** Foto de outro formato (quadro, coração), pela largura e altura em mm. */
    F: (id, forma, x, y, larguraMm, alturaMm) => foto(id, 'Sua foto', forma, x, y, larguraMm / largura, alturaMm / altura),
    /** O Pandinha numa pose do acervo, pela largura em mm. */
    P: (arquivo, x, y, mm) => panda(x, y, mm / altura, `assets/panda-${arquivo}.webp`),
    M: (id, categoria, nome, descricao, camadas, semente, confete = null) => ({
      id: `${peca}-${id}`, peca, categoria, nome, descricao, camadas, semente, fundo: null,
      enfeites: confete && { formas: ['bolinha'], cores: ['--peach-deep', '--kraft', '--sage-deep'], quantidade: confete, tamanho: [1.6, 2.8] },
    }),
  };
}
