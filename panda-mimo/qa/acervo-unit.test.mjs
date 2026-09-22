/*
  O que este arquivo protege: a fronteira entre o acervo interno e o que o cliente vê.

  A seção 6.4 do manual proíbe vestir o Pandinha com uniformes ou temas de fora do universo da marca.
  Em 22/09/2026 o dono pediu, como exceção de trabalho, 20 poses temáticas (médico, dentista, chef,
  jogador). Elas existem em `marca/kit/png/pandinha-temas-20/` como acervo para revisão — e é aí que a
  regra continua de pé: enquanto o dono não aprovar a publicação, nenhuma página servida ao visitante
  pode apontar para essas artes.

  A galeria do próprio acervo é a exceção: ela é o acervo.

  Se um dia o dono aprovar o uso público, o caminho não é apagar este teste: é registrar a mudança de
  regra no histórico do `MARCA.md`, como manda o CLAUDE.md, e então afrouxar a checagem com o motivo
  escrito aqui.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/* `fileURLToPath` e não `.pathname`: o caminho deste repositório tem espaços, e o pathname os
   devolve como %20 — o `readdir` não acha a pasta. */
const raiz = fileURLToPath(new URL('..', import.meta.url));

/* Não entram na varredura: o próprio acervo, a saída do guardião e o que não é servido. */
const FORA = new Set(['marca', 'qa', 'node_modules', '.git']);
const SERVIDOS = /\.(html|css|js|mjs|json)$/i;

async function arquivosServidos(dir = raiz, achados = []) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (item.name.startsWith('.') || FORA.has(item.name)) continue;
    const caminho = join(dir, item.name);
    if (item.isDirectory()) await arquivosServidos(caminho, achados);
    else if (SERVIDOS.test(item.name)) achados.push(caminho);
  }
  return achados;
}

test('nenhuma página do site aponta para o acervo temático do Pandinha (manual 6.4)', async () => {
  const arquivos = await arquivosServidos();
  assert.ok(arquivos.length > 20, `varredura vazia demais (${arquivos.length}): o teste não estaria olhando nada`);

  const culpados = [];
  for (const caminho of arquivos) {
    const texto = await readFile(caminho, 'utf8');
    if (texto.includes('pandinha-temas-20')) culpados.push(relative(raiz, caminho));
  }

  assert.deepEqual(culpados, [],
    `Estes arquivos servidos ao visitante apontam para o Pandinha temático, que a seção 6.4 do manual ` +
    `não autoriza publicar: ${culpados.join(', ')}. O acervo é interno até o dono aprovar.`);
});
