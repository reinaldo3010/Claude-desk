# Claude-desk

## panda-mimo/ (site e marca Panda Mimo)

Antes de qualquer trabalho em `panda-mimo/`, leia **`panda-mimo/MARCA.md`**, o manual da marca.
Ele manda sobre cores, tipografia, logotipo, mascote, tom de voz, fotografia e aplicações.
A identidade está aprovada: evoluir é acrescentar dentro dessas regras, nunca redesenhar.

- Cores e fontes vêm dos tokens de `panda-mimo/styles.css`; não usar valores soltos.
- Textos seguem o tom de voz e o léxico da seção 3 do manual (mimo, peça, prévia, "a gente").
- Fotos de produto: quadro quadrado transparente, peça inteira, folga em volta, em 760 px e @2x 1520 px (seção 10).
- Arquivos-mestre (SVG, fontes, prompt para IA) ficam em `panda-mimo/marca/kit/`; elemento novo do acervo é vetorizado e entra lá também (seção 13.5 do manual).
- Nunca apagar assets existentes ao ampliar o acervo; nunca esconder problema de layout com `overflow: hidden`.
- Antes de publicar mudança no site, rodar o guardião: `cd panda-mimo && npm test` (rápido: `QA_VIEWPORTS=390 npm test`).
- Ao mudar uma regra da marca, atualizar o manual (texto em `MARCA.md`, visual em `marca/index.html`) e registrar no histórico ao final do `MARCA.md`.

## seu-mimo-studio/ (kit vetorial da marca Seu Mimo Studio)

Marca separada da Panda Mimo, com paleta (café, bege, oliva, off-white, preto) e tipografia
(DM Serif Display, Montserrat) próprias. Antes de qualquer trabalho, leia `seu-mimo-studio/MARCA.md`.
A identidade é construída em vetor: letreiro em curvas da DM Serif Display, símbolo e mascote gerados
por `kit/mascote/kit.py` (pose ou expressão nova nasce do gerador, nunca desenhada à parte). Nunca
misturar elementos das duas marcas; a prancha aprovada em `kit/mestres/` é a referência de sensação.
O mascote vetorial gerado aqui não foi aprovado pelo dono: o caminho oficial para imagens do mascote
é `seu-mimo-studio/PROMPTS-MASCOTE.md` (referência aprovada + Nano Banana + LoRA treinada).
