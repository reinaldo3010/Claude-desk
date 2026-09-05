# Claude-desk

## panda-mimo/ (site e marca Panda Mimo)

Antes de qualquer trabalho em `panda-mimo/`, leia **`panda-mimo/MARCA.md`**, o manual da marca.
Ele manda sobre cores, tipografia, logotipo, mascote, tom de voz, fotografia e aplicações.
A identidade está aprovada: evoluir é acrescentar dentro dessas regras, nunca redesenhar.

- Cores e fontes vêm dos tokens de `panda-mimo/styles.css`; não usar valores soltos.
- Textos seguem o tom de voz e o léxico da seção 3 do manual (mimo, peça, prévia, "a gente").
- Fotos de produto: quadro quadrado transparente, peça inteira, folga em volta (seção 10).
- Nunca apagar assets existentes ao ampliar o acervo; nunca esconder problema de layout com `overflow: hidden`.
- Antes de publicar mudança no site, rodar o guardião: `cd panda-mimo && npm test` (rápido: `QA_VIEWPORTS=390 npm test`).
- Ao mudar uma regra da marca, atualizar o manual (texto em `MARCA.md`, visual em `marca/index.html`) e registrar no histórico ao final do `MARCA.md`.
