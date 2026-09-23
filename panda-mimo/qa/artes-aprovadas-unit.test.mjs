/*
  O que este arquivo protege: as artes que o dono já aprovou.

  A regra que manda no repositório (CLAUDE.md): nenhuma alteração pode regredir o visual. Para as
  artes prontas, isso quer dizer que mexer no motor do desenho não pode mover um traço delas sem
  querer. Em 23/09/2026 quase aconteceu: a caixa do Pandinha passou a seguir a imagem, o confete do
  fundo desvia da caixa, e o confete de "amizade-formatura" mudou de lugar. A medida pegou antes de
  sair; este teste impede a volta.

  O número abaixo é a impressão digital (`qa/impressao-da-arte.mjs`) dos 138 modelos que existiam em
  22/09/2026, calculada com o motor daquele dia, tirado do git, e conferida contra o de hoje: iguais.

  Se um dia uma arte aprovada mudar DE PROPÓSITO, porque o dono pediu, atualize o número aqui com a
  data e o motivo. Nunca para calar o teste.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { impressaoDasArtes } from './impressao-da-arte.mjs';
import { IMAGENS_DO_ACERVO } from '../simulador/imagens-do-acervo.js';
import * as motor from '../simulador/modelos.js';

const APROVADAS_ATE_22_09 = { quantos: 138, impressao: '8657ebe9e36abd633eab6fa4' };

/* Coleções que chegaram depois de 22/09/2026. Lote novo acrescenta o prefixo aqui. */
const DEPOIS = /^(pandinha|aquarela)-/;

test('as 138 artes aprovadas até 22/09/2026 saem traço por traço como saíam', () => {
  const aprovadas = motor.TEMPLATES.filter((m) => !DEPOIS.test(m.id));
  assert.equal(aprovadas.length, APROVADAS_ATE_22_09.quantos,
    `havia ${APROVADAS_ATE_22_09.quantos} modelos aprovados e agora há ${aprovadas.length}: sumiu um, ou um lote novo não entrou em DEPOIS`);
  assert.equal(impressaoDasArtes(motor, aprovadas, IMAGENS_DO_ACERVO), APROVADAS_ATE_22_09.impressao,
    'o desenho de uma arte já aprovada mudou. Sem querer, é regressão; se o dono pediu, atualize a impressão com a data e o motivo.');
});
