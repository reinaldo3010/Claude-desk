/*
  O balcão das coleções de arte.

  Uma coleção traz categorias, modelos e ilustrações próprias. Este arquivo junta todas num lugar
  só, para `modelos.js` não precisar conhecer cada uma. Coleção nova entra aqui, em três linhas.

  Duas famílias de ilustração convivem, e de propósito:
  - as da coleção esportiva, convertidas de SVG, guardadas como listas de comandos (`esportes.js`);
  - as escritas à mão no vocabulário de `desenho.js`, que se medem sozinhas.
  As duas pintam só por token da paleta e obedecem à seção 9.1 do manual.

  E duas coleções trazem imagem em vez de curva: as poses do Pandinha (`pandinha-temas.js`), que
  entram na lista de poses, e as aquarelas (`aquarelas.js`), que entram nos elementos do acervo.
*/
import { MODELOS_ESPORTES, CATEGORIAS_ESPORTES } from './esportes-dados.js';
import { vetorEsportivo, desenhaVetorEsportivo } from './esportes.js';
import { ILUSTRACOES_PETS, MODELOS_PETS, CATEGORIAS_PETS } from './pets.js';
import { ILUSTRACOES_DATAS, MODELOS_DATAS, CATEGORIAS_DATAS } from './datas.js';
import { ILUSTRACOES_BEBE, MODELOS_BEBE, CATEGORIAS_BEBE } from './bebe.js';
import { ILUSTRACOES_CONVITES, MODELOS_CONVITES, CATEGORIAS_CONVITES } from './convites.js';
import { desenhaIlustracao } from './desenho.js';
import { ILUSTRACOES_REFINADAS } from './ilustracoes-refinadas.js';
import { acabamentoPapelaria } from './acabamento.js';
import { ILUSTRACOES_ATELIE, MODELOS_ATELIE, CATEGORIAS_ATELIE } from './atelie.js';
import { ILUSTRACOES_HOBBIES, MODELOS_HOBBIES, CATEGORIAS_HOBBIES } from './hobbies.js';
import { POSES_TEMATICAS, ADESIVOS_DO_ACERVO, MODELOS_PANDINHA, CATEGORIAS_PANDINHA } from './pandinha-temas.js';
import { AQUARELAS, MODELOS_AQUARELA, CATEGORIAS_AQUARELA } from './aquarelas.js';

/** As poses do Pandinha que as coleções trazem, e as imagens que entram nos elementos do acervo. */
export const POSES_DE_COLECAO = POSES_TEMATICAS;
export const ELEMENTOS_DE_COLECAO = Object.freeze([...ADESIVOS_DO_ACERVO, ...AQUARELAS]);

/** As ilustrações escritas à mão, de todas as coleções. */
export const ILUSTRACOES = Object.freeze({
  ...ILUSTRACOES_PETS, ...ILUSTRACOES_DATAS, ...ILUSTRACOES_BEBE, ...ILUSTRACOES_CONVITES,
  ...ILUSTRACOES_REFINADAS,
  ...ILUSTRACOES_ATELIE,
  ...ILUSTRACOES_HOBBIES,
});

export const CATEGORIAS_DE_COLECAO = Object.freeze([
  ...CATEGORIAS_DATAS, ...CATEGORIAS_BEBE, ...CATEGORIAS_CONVITES, ...CATEGORIAS_ESPORTES, ...CATEGORIAS_PETS,
  ...CATEGORIAS_ATELIE,
  ...CATEGORIAS_HOBBIES,
  ...CATEGORIAS_PANDINHA,
  ...CATEGORIAS_AQUARELA,
]);
export const MODELOS_DE_COLECAO = Object.freeze([
  ...MODELOS_DATAS.map(acabamentoPapelaria), ...MODELOS_BEBE.map(acabamentoPapelaria),
  ...MODELOS_CONVITES.map(acabamentoPapelaria), ...MODELOS_ESPORTES, ...MODELOS_PETS.map(acabamentoPapelaria),
  ...MODELOS_ATELIE,
  ...MODELOS_HOBBIES,
  ...MODELOS_PANDINHA,
  ...MODELOS_AQUARELA,
]);

/** Quanto uma ilustração é mais alta que larga; `null` quando a forma não é de coleção. */
export function proporcaoDaForma(forma) {
  const vetor = vetorEsportivo(forma);
  if (vetor) return vetor.height / vetor.width;
  const desenho = ILUSTRACOES[forma];
  return desenho ? desenho.altura / desenho.largura : null;
}

/** A forma é uma ilustração de coleção (e não um enfeite simples)? */
export const ehIlustracao = (forma) => proporcaoDaForma(forma) !== null;

/**
 * Quanto uma ilustração pode crescer, em fração da altura da área: elas nascem largas e a pessoa
 * costuma querer maior, então o limite dos enfeites pequenos aperta demais.
 */
export const TAMANHO_DA_ILUSTRACAO = Object.freeze([0.01, 2.4]);

/** Desenha a ilustração já centrada. Devolve `false` quando a forma não é de nenhuma coleção. */
export function desenhaIlustracaoDeColecao(ctx, forma, tamanho, tinta) {
  if (desenhaVetorEsportivo(ctx, forma, tamanho, tinta)) return true;
  const desenho = ILUSTRACOES[forma];
  if (!desenho) return false;
  desenhaIlustracao(ctx, desenho, tamanho, tinta);
  return true;
}
