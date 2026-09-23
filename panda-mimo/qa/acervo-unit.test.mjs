/*
  O que este arquivo protege: a fronteira entre o kit da marca e o site publicado.

  Histórico. Em 22/09/2026 esta checagem guardava a regra 6.4 do manual: as 20 poses temáticas do
  Pandinha eram acervo de revisão, e nenhuma página podia apontar para elas. Em 23/09/2026 o dono
  aprovou as poses e as aquarelas para as canecas (manual, histórico 2.17), e elas entraram no
  estúdio. A regra de marca mudou; a fronteira técnica, não.

  A fronteira: `marca/kit/` não vai para o ar. O passo de publicação
  (`.github/workflows/panda-mimo-pages.yml`) copia o site sem essa pasta, então um arquivo do kit
  funciona no servidor local e dá 404 no site publicado. O site usa as versões preparadas em
  `assets/` por `marca/kit/prepara-imagens-do-estudio.py`, nunca o mestre.

  E a volta: toda imagem que o estúdio usa e que o preparador gerou tem o mestre guardado no kit
  (CLAUDE.md: elemento novo do acervo entra no kit também).
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/* `fileURLToPath` e não `.pathname`: o caminho deste repositório tem espaços, e o pathname os
   devolve como %20 — o `readdir` não acha a pasta. */
const raiz = fileURLToPath(new URL('..', import.meta.url));

/* Não entram na varredura: o próprio kit, a saída do guardião e o que não é servido. */
const FORA = new Set(['qa', 'node_modules', '.git']);
const SERVIDOS = /\.(html|css|js|mjs|json|webmanifest)$/i;

async function arquivosServidos(dir = raiz, achados = []) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (item.name.startsWith('.') || FORA.has(item.name)) continue;
    const caminho = join(dir, item.name);
    if (item.isDirectory()) {
      if (relative(raiz, caminho).replace(/\\/g, '/') === 'marca/kit') continue;
      await arquivosServidos(caminho, achados);
    } else if (SERVIDOS.test(item.name)) achados.push(caminho);
  }
  return achados;
}

/*
  O que conta como "apontar": um caminho que o navegador pediria. Aspas simples ou duplas, `src=`,
  `href=` e `url(` — e não a crase, que é como os comentários deste código citam um caminho.
*/
const PEDE_DO_KIT = /(?:['"]|\burl\(\s*)(?:\.{0,2}\/)*(?:marca\/)?kit\/[^'")\s]*|(?:['"]|\burl\(\s*)(?:\.{0,2}\/)*marca\/kit\b/g;

test('nenhuma página servida pede arquivo do kit, que não vai para o ar', async () => {
  const arquivos = await arquivosServidos();
  assert.ok(arquivos.length > 20, `varredura vazia demais (${arquivos.length}): o teste não estaria olhando nada`);

  const culpados = [];
  for (const caminho of arquivos) {
    const texto = await readFile(caminho, 'utf8');
    for (const achado of texto.match(PEDE_DO_KIT) || []) culpados.push(`${relative(raiz, caminho)}: ${achado}`);
  }
  assert.deepEqual(culpados, [],
    'Estes arquivos servidos ao visitante pedem um arquivo de marca/kit/, que não é publicado e dá 404 no ar. '
    + 'Use a versão preparada em assets/ (marca/kit/prepara-imagens-do-estudio.py).');
});

test('toda imagem preparada para o estúdio tem o mestre guardado no kit', async () => {
  const preparador = await readFile(join(raiz, 'marca', 'kit', 'prepara-imagens-do-estudio.py'), 'utf8');
  const pares = [...preparador.matchAll(/\('([a-z0-9-]+\/[a-z0-9-]+)', '([a-z0-9-]+)'\)/g)];
  assert.ok(pares.length >= 26, `o preparador listou só ${pares.length} imagens: a leitura da lista quebrou`);
  const faltam = pares
    .filter(([, mestre, nome]) => !existsSync(join(raiz, 'marca', 'kit', 'png', `${mestre}.png`)) || !existsSync(join(raiz, 'assets', `${nome}.webp`)))
    .map(([, mestre, nome]) => `${mestre} → ${nome}`);
  assert.deepEqual(faltam, [], `mestre ou versão do site faltando: ${faltam.join(', ')}`);
});
