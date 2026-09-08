# Homologação de nitidez e legibilidade

Execute `npm test` antes de publicar. Ele roda o auditor funcional nas 14 resoluções
e o guardião `nitidez.mjs`. Para iterar apenas na nitidez: `npm run test:nitidez`.
Os dois rodam no fluxo de publicação existente do GitHub Pages.

## Regressão corrigida

O selo original tem 820 px de largura. A frase em curvas “Consulte seu CEP” tem
23,2 px de altura nesse arquivo. Com 116 px no celular, as letras caíam para 3,28 px;
em 165 px, para 4,67 px. A imagem podia ser vetorial e passar no teste de resolução
sem ser legível. A regra `.occasions__head img` também atingia a faixa e a reduzia
a 150 px no celular. As frases agora são texto HTML e o seletor atua só na arte.

O experimento lado a lado com/sem `drop-shadow` não mostrou que o filtro sozinho
explicava a ilegibilidade. Os filtros foram retirados dos ícones para eliminar
efeitos desnecessários, mas a correção principal é tamanho de letra e composição.

## O que bloqueia a publicação

- Letras abaixo de 18 px nos selos/faixas, 16 px em etiqueta/balões e 14 px nas descrições.
- Contraste de texto abaixo de 4,5:1, texto cortado ou fora da tela.
- Frases de selos/faixas voltando a ser imagens; ícones de interface voltando a raster.
- Filtros, reescala de texto, `pixelated`/`crisp-edges` nos vetores de interface.
- SVG sem viewBox, com bitmap, recurso externo ou script incorporado.
- Imagem que não carregou ou raster ampliado acima de 10% da sua resolução efetiva.

Telas: 320 e 390 px a 1x; 1366 px a 1x, 1,25x e 1,5x; 1280 px a 2x; 390 px a 3x.
O guardião gera inventário e capturas em `qa/shots/nitidez/`. Cabeçalho fixo e botão
flutuante são ocultados/removidos do posicionamento fixo só durante as capturas de
seção, para não cobrir o conteúdo fotografado. Não há mudança no site por esse teste.

Defeitos inseridos de propósito verificam que as regras realmente reprovam: letra de
8 px, blur, baixo contraste, pixelated, selo raster e SVG com PNG embutido.

## Revisão humana obrigatória

Abra as capturas em 100% de zoom. Confira cada símbolo, cada frase, bordas, proporção,
leitura sem ampliar e fotos de produto. Observe o resultado em 1x antes do retina.
Confira a versão publicada e o hash do commit no workflow, não só o preview local.

Uma dimensão alta não prova que a foto está em foco: blur, letras deformadas ou
recortes ruins já existentes na fonte exigem tratar/substituir a própria fonte.
O guardião não afirma que todas as imagens são artisticamente perfeitas e não
substitui esta revisão. Os PDFs anteriores do manual são exportações históricas;
a regra atual está em `MARCA.md` e no manual visual HTML.
