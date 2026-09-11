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

## seu-mimo-studio/ (marca Seu Mimo Studio)

**Sessão nova começa por `seu-mimo-studio/COMECE-AQUI.md`** (documento de passagem: o que existe, o que
falta, o que já foi decidido) e depois `seu-mimo-studio/MARCA.md` (o manual da marca).

Marca separada da Panda Mimo, para público geral adulto, com paleta (café, oliva, bege, off white, papel
claro, fundo, preto) e tipografia (DM Serif Display, Montserrat) próprias. Nunca misturar cor, fonte,
mascote ou texto entre as duas marcas.

- Logotipo, símbolo e avatar estão prontos em `kit/svg/`, `kit/pdf/` e `kit/png/`. Use os arquivos; não
  recrie o letreiro em fonte nem redesenhe o símbolo.
- Fontes próprias em `kit/fontes/`, servidas do próprio site. Nada de Google Fonts em página pública.
- **O mascote é peça em aberto.** A construção vetorial em `kit/mascote/` foi reprovada pelo dono e fica
  só como registro; não sai em material publicado. A referência aprovada é
  `kit/mestres/referencia-mascote-1400.jpg`, e imagens novas saem do roteiro de
  `seu-mimo-studio/PROMPTS-MASCOTE.md`. Não desenhe o mascote de novo.
- O site da marca ainda não existe como código. Quando for construído, vai em `seu-mimo-studio/site/`,
  com a arquitetura do site da Panda Mimo e a identidade desta marca.
