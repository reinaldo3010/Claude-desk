# Estúdio leve e layout de vez — 23/09/2026

Pedido do dono, com um print: a caneca 3D sobrepondo o painel ao lado; o estúdio pulando para Fotos ao
escolher um modelo, sem deixar mudar a cor do fundo antes; o zoom que passou a exigir Ctrl; botões grandes
e "tudo muito grosso" perto do estilo da marca; a lista de ocasiões do navegador, grande e sem ordem; e a
vontade de ver a arte de um modelo maior antes de escolher.

Na mesma tarde, a segunda rodada, com outro print: a arte aberta "tem que aparecer logo abaixo da caneca
3D, e num tamanho maior, porque dá para editar por ali"; cores da peça, cena e acabamento "têm que aparecer
logo de cara" (quem ia saber que precisava clicar nelas?); o seletor de ocasião "ficou melhor do que antes,
mas ainda tá longe"; e "quando eu clico no modelo, ele ainda está dando a próxima fase".

## O pulo de fase da segunda rodada não era o código

O código já não pulava. A aba que o dono abriu foi carregada às 14h47; das 14h40 às 14h50 a prova de
defeito das checagens estava com o pulo para Fotos recolocado de propósito no próprio `estudio.js`. Ele pegou
justamente essa versão. Conferido com clique de mouse de verdade depois da prova: a aba fica em Modelo.

A prova de defeito mudou por causa disso: o defeito vai para uma pasta à parte, que o servidor do guardião
serve na frente dos arquivos do site (`QA_SOBREPOR`, em `qa/servidor.mjs`). O arquivo do site não é mais
tocado, e quem estiver com o estúdio aberto não vê defeito nenhum.

## O layout, com a medida de antes e depois

A causa do primeiro print era uma linha: abaixo de 850 px o estúdio virava uma coluna, mas herdava o
`align-items:start` da grade. A caneca não esticava, ficava com 422 px dentro de um painel de 640 e,
grudada no topo, cobria parte dele ao rolar. Medindo o resto, apareceu um defeito maior, que já estava no
ar: no celular uma regra de 320 px (telas até 480) desfazia a de 210 px, e a caneca grudada tomava a maior
parte da altura da tela.

| Tela | Antes | Depois |
|---|---|---|
| 320×568 | caneca grudada com 94% da altura | **44%** |
| 375×667 | 73% | **41%** |
| 390×844 | 57% | **38%** |
| 414×896 | 54% | **37%** |
| 700×640 | 57%, cobrindo 33 a 40% do painel | **35%**, na largura inteira |
| 800 a 850 | 27 a 40% do painel coberto | **duas colunas, 0%** |

As regras agora:

- **Duas colunas a partir de 760 px** (era 850). A caneca acompanha a largura da coluna
  (`clamp(300px, 42vw, 470px)`); em 1280 e 1366 ela continua com os 470 px de sempre.
- **Uma coluna abaixo de 760 px**: a caneca estica na largura inteira e fica baixa — `clamp(150px, 26vh,
  240px)` —, o selo e o cadeado flutuam sobre o canto de cima dela e os quatro botões de vista cabem numa
  linha até em 320 px.
- O ponto de corte existe em um lugar só no JavaScript (`umaColuna()` em `estudio.js`), igual ao do CSS.

## A peça à vista (segunda rodada)

Cores, acabamento, cena e arte aberta saíram da faixa no pé da página — três blocos fechados lado a lado,
dois deles quase vazios — e foram para a coluna da caneca, logo abaixo dela, num cartão só:

- **Cores da peça** em linha, com rótulo à esquerda: as três combinações prontas e, embaixo, as bolinhas
  de **interior** e **alça** na cor da cerâmica (eram duas listas do navegador). Depois, **Acabamento** e
  **Cena**, na mesma pílula das combinações. Nada abre com clique.
- O escolhido é leve, como o cartão de modelo escolhido: fundo areia, contorno e letra pêssego. O preto
  fica para a chamada do pedido e para a vista da caneca.
- **A arte aberta** vem logo depois, sempre aberta, na largura da coluna, e o canvas acompanha a densidade
  da tela (nunca abaixo dos 840 px de sempre).
- No celular a caneca continua grudando sozinha e o editor vem logo depois dela; cores, cena e arte aberta,
  também à vista, vêm depois do editor, num cartão próprio. Entre a caneca e o editor, empurrariam o
  editor para baixo da primeira tela.

| Medida | Antes | Depois |
|---|---|---|
| Arte aberta em 1280×800 | 240 px de largura, e só aberta depois de escolher um modelo | **618 × 265 px**, sempre à vista |
| Arte aberta em 1024 | 240 px | **490 × 210 px** |
| Onde começam as cores da peça (1280) | y = 1.541, atrás de um clique | **y = 934**, abertas |
| Onde começam as cores da peça (1024) | y = 1.475, atrás de um clique | **y = 883**, abertas |
| Altura da página (1280) | 2.228 px | 2.218 px |

Como a coluna passou a ter a caneca e a arte aberta, ela é mais alta que a janela quase sempre. Grudada
pelo topo, a arte aberta ficaria fora de alcance enquanto o editor rola; então, quando não cabe, a coluna
**gruda pelo pé**: rola com a página até a arte aberta aparecer inteira e ali fica, ao lado do pedido.
Quando cabe, gruda pelo topo, como sempre. Vistas e zoom ficam numa linha só onde cabem.

## O comportamento

- **Escolher o modelo não troca de etapa.** A aba continua Modelo, com o modelo escolhido e as cores de
  fundo no topo dela; quem leva adiante é o botão "Continuar para fotos". Quando essa barra surge acima da
  lista, a rolagem é compensada pela altura exata dela: o cartão clicado não sai de baixo do mouse.
- **Trocar a cor do fundo não refaz a lista.** Antes, cada cor reconstruía os 199 cartões.
- **A roda sobre a caneca dá zoom**, e a barra de zoom acompanha. No limite do zoom a volta seguinte da roda
  é da página — por isso quem só quer rolar não fica preso sobre a prévia (o problema que tinha levado ao Ctrl).
- **A pinça de dois dedos voltou.** Com o zoom do OrbitControls desligado para a regra do Ctrl, ela tinha
  parado de funcionar no celular.

## O visual, no tom do site

- Traço de 1 px em todo o estúdio (eram 14 bordas de 1,5 px). O manual registra a exceção na seção 9.
- Botões na medida de ferramenta onde há mouse; o dedo continua com 44 px. Preto só na chamada principal,
  "Pedir esse mimo no WhatsApp"; o "Continuar" é pêssego, como a chamada principal do site; o resto é
  contorno fino.
- O aviso de cada aba é texto, sem a faixa tingida que vazava do alinhamento.
- "+ Acrescentar" virou pílula tracejada, não caixa de largura inteira. Camadas, abas e boas-vindas mais leves.
- Cartão de modelo com miniatura e nome. A descrição continua no cartão para leitor de tela e aparece na
  arte maior.

## Seletor de ocasião: um cardápio

A lista nativa do navegador saía com os nomes grandes e sem ordem. A primeira troca, pílulas num painel que
abria no lugar, virou uma parede de 43 botões com rolagem própria, colada na lista de modelos, que também
rola — foi essa que o dono achou "ainda longe". Agora:

- **Na tela larga**, um cardápio que flutua sobre a página a partir do botão e cresce para o lado da caneca:
  "Todos os modelos" em cima e os onze grupos em quatro ou cinco colunas, o grupo num rótulo miúdo e cada
  ocasião numa linha, com quantos modelos tem. Em 1280×800 e em 1024×634 cabe inteiro, sem rolagem.
  Não empurra a lista de modelos.
- **No celular**, uma folha que sobe de baixo, com título, X e fundo escurecido, em duas colunas.
- Fecha com Esc, com um clique fora (ou no fundo da folha), no X e ao escolher. Pelo mouse o foco fica no
  botão; pelo teclado, a seta para baixo entra na lista e anda entre as ocasiões.

## A arte do modelo, maior

- **Com o mouse**: descansar 380 ms num cartão mostra a arte a 480 px, com nome e descrição, ao lado do
  cartão (na tela larga, por cima da caneca), sem cobri-lo. Sai quando o mouse sai ou a lista rola.
- **Com o dedo**: segurar 450 ms abre a arte maior numa folha, com "Usar este modelo". O toque curto
  continua escolhendo; o toque que solta depois de segurar não escolhe o modelo por baixo da folha. Uma
  linha de ajuda, só em tela de toque, avisa que dá para segurar.

## O que o guardião passou a cobrar

- Layout em 10 tamanhos, de 320×568 a 1024×768: em duas colunas a caneca nunca cobre o painel; em uma, ela
  tem a largura do painel e no máximo 45% da altura da tela; nunca rolagem lateral.
- Escolher o modelo fica em Modelo, o cartão não anda, o botão de continuar existe e a cor do fundo aparece.
  A caneca tem de estar à vista depois do clique, a partir do ponto mais fundo em que alguém ainda escolhe
  um modelo (o pé da lista no pé da tela). Antes a checagem rolava a 55% da página, o que só fazia sentido
  com a caneca grudada pelo topo; com a arte aberta embaixo dela, a 55% a lista já saiu da tela.
- A roda dá zoom (a barra acompanha) e, no limite, devolve a rolagem para a página.
- O seletor abre, fecha com Esc e ao escolher, e o botão passa a dizer a ocasião.
- A arte maior aparece com o mouse (com a arte desenhada e sem cobrir o cartão) e some ao sair; com o dedo,
  a folha abre, o toque de soltar não escolhe por baixo e "Usar este modelo" escolhe.
- **Peça à vista** (1280×800, 1024×768 e 1280×720 em tela 2x): cores, acabamento e cena sem bloco que abre,
  com todas as opções à vista e logo abaixo da caneca; a arte aberta logo depois, na largura da coluna e na
  densidade da tela; o escolhido nunca em pílula preta; e, com o editor mais alto que a coluna, a arte aberta
  inteira à vista no botão do pedido.
- **Cardápio**: na tela larga flutua (não é modal), não empurra a lista, tem pelo menos quatro colunas, cabe
  sem rolagem em 1280×800, cada ocasião tem a contagem certa, a seta anda e o clique fora fecha sem escolher;
  no celular é folha modal, com X, em duas colunas, que fecha no X e no fundo.
- As bolinhas de cor da peça, à vista desde a abertura, têm os 44 px do dedo.

Três checagens antigas cobravam o pulo para Fotos, que era o comportamento certo quando foram escritas;
passaram a cobrar a decisão nova, sem afrouxar.
