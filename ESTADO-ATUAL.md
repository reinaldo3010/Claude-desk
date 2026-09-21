# Estado atual do trabalho

Frente aberta, o que ficou pronto e o que vem a seguir. Atualizado em 21 de setembro de 2026, antes
de uma compactação de contexto.

---

## Onde estamos

**Frente:** estúdio da caneca em 360° da Panda Mimo (`panda-mimo/caneca-3d.html`).
**Branch:** `codex/simulador-caneca-3d`. Nada publicado ainda: o fluxo de publicação roda a partir da
`main`, e esta branch não foi mesclada.

O simulador chegou nesta sessão como esqueleto sem a camada que liga as peças, e saiu como um editor
completo. O caminho, em oito commits:

1. `fe69bbc` estúdio concluído: prévia 3D ligada ao editor, com guardião próprio
2. `f8244ba` modelos de arte por ocasião, com fotos e frases
3. `13d95d3` a arte vira camadas editáveis, 14 modelos
4. `3605606` desfazer, alças de girar e redimensionar, modelos da pessoa
5. `ca91f18` painel reorganizado em abas, cadeado na prévia
6. `1a8b468` cenas, acabamento, vídeo, biblioteca de letras, Canva levando a arte
7. `e4cc923` arco, elementos da marca, filtros, rascunho, link, nomes em lote
8. `fad9cb4` limpeza

## Como está a qualidade

- 22 testes unitários (`npm run test:arte`), verdes.
- Guardião funcional em 390 e 1280 px, verde, cobrindo o site inteiro e o estúdio de ponta a ponta.
- Nitidez em sete combinações de tela e densidade, verde.
- axe-core sem violação, inclusive com o editor em uso.
- Um aviso que não bloqueia e é decisão do dono: o WhatsApp do site ainda é o número de reserva.

## Trabalho de outra sessão parado aqui

No diretório, **sem commit**, há uma coleção de esportes escrita por outra sessão:
`panda-mimo/simulador/esportes.js`, `panda-mimo/simulador/esportes-dados.js` e as mudanças que a
ligam em `simulador/modelos.js` e em `qa/modelos-unit.test.mjs`. São 137 vetores, 24 modelos e 6
categorias novas. Os testes unitários passam com ela no lugar. **Não foi tocada nem commitada.**
Antes de mexer, confirme com quem escreveu.

## O que vem a seguir, na ordem que faz sentido

1. **Tipos de caneca e cores da peça.** Depende da lista real do fornecedor: quais peças existem
   (mágica, cônica, alça de coração, 15 oz) e a área de impressão de cada uma. Com os números, cada
   peça vira uma entrada de `MUG_SPEC` e um item no seletor.
2. **Decidir a cena "caixa de presente".** Foi refeita; o dono quer olhar antes de manter.
3. **Trocar o número do WhatsApp** pelo real, no painel ou em `script.js`.
4. **Mesclar na `main` e publicar**, depois de o dono revisar as provas visuais dos modelos.
5. **Ideias registradas e recusadas de propósito** (não voltar a elas sem decisão nova): extrator de
   arte de terceiros por inteligência artificial, loja com checkout embutido, biblioteca de milhares
   de cliparts genéricos, mapas e fase da lua, arte gerada por inteligência artificial na peça.

## Por onde começar depois da compactação

1. `panda-mimo/simulador/COMECE-AQUI.md` — o que é, como rodar, como a arte funciona, o que falta.
2. `panda-mimo/simulador/LICOES-APRENDIDAS.md` — as armadilhas que já custaram tempo.
3. `panda-mimo/MARCA.md` — o manual; manda em cor, letra, mascote e tom de voz. O histórico no fim
   conta o que mudou e por quê.
4. Este arquivo, para o estado da frente.
