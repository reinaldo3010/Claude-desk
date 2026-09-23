# O estúdio com garrafa e ecobag — 23/09/2026

Pedido do dono: "vamos começar a evoluir o estúdio para garrafas e ecobags", o próximo passo que ele
tinha anunciado ao pôr o estúdio da caneca dentro do site. Ele escolheu, entre opções, as três
recomendações:

1. **Modelos próprios de cada peça**, desenhados para o formato dela, começando por uma leva curta. Os
   199 da caneca não se esticam para as outras peças: a área da caneca é uma faixa de 21 × 9 cm; na
   garrafa (23 × 18 cm) e na ecobag (25 × 30 cm, em pé) a foto redonda viraria oval.
2. **Medidas de referência agora**, ajustáveis num lugar só quando a lista do fornecedor chegar.
3. **"Qual peça? Caneca · Garrafa · Ecobag" numa linha no topo do estúdio**, nos botões leves das cores.

Depois ele recusou a pergunta de quais ocasiões abririam a garrafa e mandou seguir: a leva foi a da
recomendação, duas ocasiões de quatro artes em cada peça.

## A caneca não mudou

A caneca foi fotografada antes de tudo (3D em cada vista, cor, acabamento e cena, e a arte aberta, em
1280 e 390) e de novo depois de cada etapa (`qa/mede-caneca.mjs`). As 40 imagens saíram
idênticas; a única diferença é a linha nova "Qual peça?", que desce o estúdio 52 px no computador e 58
no celular, e que foi a aprovada. Os textos da caneca não são reescritos: o estúdio guarda os da página na
abertura e os devolve quando a pessoa volta para ela.

## Como ficou

| Arquivo | Papel |
|---|---|
| `simulador/pecas.js` | Tudo que muda de uma peça para outra: medida, lados, cores, tintas, vistas, cenas, textos da página, pedido, tamanho do item novo, fundo da arte. Sem three.js: os testes em Node leem daqui. |
| `simulador/peca-3d.js` | O visualizador de qualquer peça: luz, cenas, câmera, gestos, foto, vídeo e a troca de peça (`setForma`). É o código que era da caneca, sem mudar a conta. |
| `simulador/caneca-3d.js` | Só a caneca: geometria, material cerâmico, vistas e enquadramento (`FORMA_DA_CANECA`). |
| `simulador/garrafa-3d.js` | A garrafa de 1 L: corpo de inox pintado, anel de aço, tampa com topo escuro e a argola de silicone presa por rebite. |
| `simulador/ecobag-3d.js` | A ecobag de algodão cru: painéis que estufam, fole que dobra no alto, bainha, alças de fita em arco e a trama do pano em relevo. |
| `simulador/atalhos-da-peca.js` | Os atalhos para escrever modelos na medida de cada peça (a caneca continua com `camadas.js`). |
| `simulador/garrafa-modelos.js` | Os 8 modelos da garrafa: Com o seu nome e Treino. |
| `simulador/ecobag-modelos.js` | Os 8 modelos da ecobag: Com o seu nome e Pequenos prazeres. |

**Medidas de referência** (não são do fornecedor): caneca 82 × 95 mm, arte 210 × 90; garrafa de 80 mm
de diâmetro, faixa de 200 mm, arte 230 × 180 com a emenda atrás da alça; ecobag 35 × 40 cm, arte de
250 × 300 mm no meio do painel da frente. A ecobag é a primeira peça **plana**: a arte não dá a volta,
a frente é o meio do painel, e "Onde vai a arte?" some (só existe a frente).

**Cores.** A garrafa sai nas quatro cores das peças do manual (7.4): creme, sálvia, pêssego e preta; a
tampa e a alça acompanham. A ecobag é de algodão cru e não ganha cor inventada: a ajuda diz a cor do
tecido, sem bolinhas. Na peça colorida a arte é desenhada sobre a cor dela (na prévia, na arte aberta e
nas miniaturas dos modelos), e o arquivo de 300 dpi sai **sem fundo**, porque quem pinta ali é a peça.

**Tintas que acompanham a cor (manual 7.4).** Os modelos da garrafa e da ecobag pintam as frases com
`--tinta-da-peca` e `--acento-da-peca`: nanquim suave e pêssego tinta na peça creme, sálvia e crua;
papel na pêssego e na preta. Trocar a cor da garrafa troca o texto junto, e o nome não some na garrafa
preta. As duas aparecem primeiro nas cores da frase, como "Tinta da garrafa" e "Destaque da garrafa".

**Cada peça guarda a própria montagem** enquanto a página está aberta (trocar e voltar devolve a caneca
como estava), e o rascunho do aparelho é um por peça: o da caneca continua na chave de sempre, e a
página oferece de volta o mais recente, dizendo de que peça é.

**O resto do estúdio é o mesmo nas três**: fotos, frases, enfeites, Pandinhas, Minha arte, vista aberta
com alças, desfazer, link da montagem, projeto em arquivo, Canva, vários nomes de uma vez, vídeo e 4K.
O item novo nasce na medida da peça (uma foto de uns 6 cm na garrafa, um nome de 16 mm), e o Pandinha
nunca cresce além dos 300 dpi da peça.

**No site**, "Ver com meu nome" aparece no detalhe da caneca, da garrafa e da ecobag e abre o estúdio já
na peça; o texto da seção Monte seu mimo fala das três.

## Os modelos

Estilo das coleções da casa depois da revisão de papelaria (`acabamento.js`): Nunito e Caveat, confete
pouco e miúdo, nada girado, arte sobre a cor da peça. Quatro artes por ocasião, como a regra da caneca.

- **Garrafa**: *Com o seu nome* (Nome em destaque, Nome com foto, Nome entre flores, Nome e Pandinha) e
  *Treino* (Foco no treino, Cada km conta, Partiu pedal, Respira fundo). Uma coluna na frente, com o
  protagonista grande, e um recado no verso.
- **Ecobag**: *Com o seu nome* (as mesmas quatro ideias, em cartaz) e *Pequenos prazeres* (Entre
  páginas, Primeiro o café, A vida floresce, Próxima parada).

As ocasiões de uma peça só aparecem no cardápio dela (`pecas` na categoria).

## O que o guardião cobra

Bloco `pecas` (1280 e 390), com clique de verdade:

- a linha "Qual peça?" à vista e sem nada por cima dela, com a página parada e depois de rolar;
- trocar para a garrafa troca o 3D e a **arte** dele (o corpo sálvia sai sálvia na prévia);
- textos, vistas, cores e pedido da garrafa; sem acabamento; arte aberta de 23 × 18 cm;
- catálogo e cardápio da garrafa só com os modelos e as ocasiões dela, cada ocasião com 4;
- miniatura do modelo sobre a cor da garrafa; tinta das frases em papel na garrafa preta; o pedido
  levando o modelo e a cor;
- arte plana da garrafa em 2717 × 2126 px (230 × 180 mm a 300 dpi) e sem fundo;
- a ecobag: vistas, sem "Onde vai a arte?", três cenas, arte aberta de 25 × 30 cm, os modelos dela e o
  arquivo em 2953 × 3543 px sem fundo;
- a caneca volta com o modelo, os textos, as vistas, o acabamento e a proporção dela.

Bloco `estudio-no-site`: "Ver com meu nome" na garrafa e na ecobag abre o estúdio na peça, também vindo
do fim da página; no copo, que o estúdio ainda não monta, ele não aparece.

Testes unitários (`qa/pecas-unit.test.mjs`): a caneca com as medidas de sempre; toda peça cabendo na
própria volta; nenhum texto da caneca esquecido numa peça nova; as bolinhas de cor com lugar na página;
o item novo num tamanho de gente; e os modelos das peças novas com as regras dos da caneca, medidas na
área de cada uma (quatro por ocasião, letra da marca, cor da paleta, margem de 5 mm, foto, frase e
Pandinha sem se cobrir, 300 dpi, planta diferente).

Doze provas de defeito, na pasta sobreposta, reprovaram cada uma das checagens novas com o defeito
recolocado. O guardião inteiro passou nas 14 resoluções, com a nitidez nas 7 combinações de tela.

## Três defeitos que apareceram no caminho

- **A coluna da peça cobria a linha "Qual peça?".** Dentro da grade das duas colunas, a coluna grudada
  pelo pé subia até o topo do estúdio. A linha foi para fora da grade, logo acima dela, e a página
  inicial passou a trazer as duas partes.
- **A garrafa mostrava a arte da caneca.** A arte da garrafa é mais alta, o canvas muda de medida, e o
  WebGL não aceita reenviar textura com outra medida: ficava a antiga. Agora textura de medida nova é
  textura nova.
- **"Ver com meu nome" passava do estúdio.** Vindo do fim da página, a troca de peça encurtava a lista
  de modelos no meio da rolagem suave, e a página parava 800 px acima. Agora ela rola depois da troca.

## O que fica com o dono

1. **A tinta na garrafa pêssego.** O manual manda a arte em papel na peça pêssego (7.4), mas papel sobre
   pêssego tem contraste de 1,6:1, e a própria 7.3 proíbe branco sobre pêssego. O estúdio segue a 7.4;
   trocar a pêssego para nanquim (11:1) é uma linha em `pecas.js`.
2. **As medidas e as cores do fornecedor** da garrafa e da ecobag (e se a ecobag sai em outra cor).
3. **Estampa no verso da ecobag.** Hoje a arte vai só na frente.
4. **O copo térmico** e as outras peças: o caminho é o mesmo (seção "Peça nova", abaixo).
5. **Quantidade no pedido** (o simulador de desenho levava de 1 a 500), sugerida e ainda sem resposta.

## Peça nova, passo a passo

1. A medida em `ESPECIFICACOES` e a peça em `PECAS` (`pecas.js`), com os textos de cada `data-texto` e
   `data-rotulo` da página — o teste reprova peça que deixe texto da caneca para trás.
2. O 3D num arquivo `<peca>-3d.js` que exporte a forma (`monta`, vistas, enquadramento, sombra), na
   escala de 50 mm por unidade e com a frente em -Z.
3. As cores da peça, se tiver, num grupo de bolinhas marcado com `data-peca` em `caneca-3d.html`.
4. O botão em "Qual peça?", o `PECAS_DO_ESTUDIO` e o `baseDoProduto` em `script.js`.
5. Os modelos em `<peca>-modelos.js`, com `atalhosDaPeca`, quatro por ocasião, e o registro em
   `modelos.js` (`CATEGORIAS` e `MODELOS_POR_PECA`).
6. A peça nas checagens do bloco `pecas` e nas levas de `qa/pecas-unit.test.mjs`.
