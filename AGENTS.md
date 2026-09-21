# Instruções do repositório

As regras deste repositório estão em **`CLAUDE.md`**, na mesma pasta. Leia esse arquivo inteiro antes
de mexer em qualquer coisa: ele vale para qualquer assistente que trabalhe aqui, não só para um.

Este arquivo existe só para quem procura por `AGENTS.md`. Ele não guarda regra própria, de propósito:
duas listas de regras acabam divergindo, e aí ninguém sabe qual vale.

O resumo do resumo, para não começar errado:

1. **Sessão nova começa por `ESTADO-ATUAL.md`**, na raiz.
2. Antes de tocar em `panda-mimo/`, leia `panda-mimo/MARCA.md`. Antes de tocar em
   `seu-mimo-studio/`, leia `seu-mimo-studio/COMECE-AQUI.md` e `seu-mimo-studio/MARCA.md`.
3. Cor e letra vêm dos tokens do `styles.css` de cada marca. Nunca misturar as duas marcas.
4. Antes de publicar, rode o guardião da pasta: `npm test`.
5. `npx` não funciona aqui (o caminho tem `&`). Use `node node_modules/<pacote>/cli.js`.
6. O diretório pode ter trabalho de outra sessão. Confira `git status` antes de `git add -A` e não
   commite o que não é seu sem perguntar.
