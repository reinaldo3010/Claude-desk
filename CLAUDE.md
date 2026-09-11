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
- **O mascote está resolvido.** A arte definitiva vive em `kit/mascote-2d/`, com folha de modelo
  (12 expressões, 16 ações), folhas de poses e as poses soltas em PNG transparente. É a única que sai
  publicada. **Não desenhe o mascote** e não o gere por IA: pose nova se desenha a partir da folha de
  modelo. Duas coisas ficaram para trás e o guardião reprova as duas: a construção vetorial de
  `kit/mascote/` e `kit/svg/mascote-*.svg` (reprovada pelo dono) e o render 3D
  `kit/mestres/referencia-mascote-*` (referência provisória).
- O mascote do site sai do kit, não de arte guardada no site:
  `cd seu-mimo-studio/kit/mascote-2d && python exporta-para-o-site.py`.
- O site da marca está em `seu-mimo-studio/site/`: HTML, CSS e JavaScript puros, sem build, com a
  arquitetura técnica do site da Panda Mimo e a identidade desta marca. Leia `site/LEIAME.md` antes de
  mexer.
- Cores e fontes vêm dos tokens de `site/styles.css`; o guardião reprova valor solto no código.
- Antes de publicar mudança no site, rodar o guardião: `cd seu-mimo-studio/site && npm test`
  (rápido: `QA_VIEWPORTS=390 npm test`). Ele confere, além de layout e acessibilidade, que nenhuma cor,
  fonte ou palavra da Panda Mimo entrou aqui.
- Dado que ainda não existe (CNPJ, endereço, WhatsApp real, data de publicação) fica **entre colchetes
  e à vista**, com a classe `.falta`. Nunca inventar e nunca esconder: o guardião reprova colchete sem
  a marca e avisa quantos faltam.
- Publicação no Cloudflare Pages, com `seu-mimo-studio/site` como raiz publicada; banco em projeto
  Supabase próprio, tabelas com prefixo `sms_`. As duas decisões estão em `COMECE-AQUI.md` seção 3.

## O `npx` não funciona neste repositório

O caminho tem um `&` (`OneDrive - MINGARDI & ELIAS`) e o `npx` do Windows quebra a resolução de
caminho por causa dele. Use `node node_modules/<pacote>/cli.js` no lugar — por exemplo
`node node_modules/playwright/cli.js install chromium`. O `npm install` e o `npm test` funcionam normalmente.
