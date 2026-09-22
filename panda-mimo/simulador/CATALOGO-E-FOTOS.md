# Catálogo leve e foto pela câmera — 22/09/2026

Dois itens da auditoria do estúdio, feitos com medição antes e depois. Nenhum pixel do que já
existia mudou.

## 1. A miniatura nasce quando chega na tela

**O custo real, medido antes de mexer:** desenhar uma miniatura do catálogo leva cerca de **5,5 ms**
e ocupa 420 × 180 px de canvas. Com 138 artes, abrir a lista inteira eram **764 ms de tela parada e
40 MB de memória** nesta máquina — num celular médio, vários segundos. O botão "Ver mais" existia por
um motivo de verdade, e a recomendação original da auditoria ("mostrar mais de uma vez") era ingênua.

**Depois:** 6 miniaturas ao abrir e **2,6 MB**; o resto aparece conforme a pessoa rola. A caixa do
cartão reserva a altura pela proporção 210/90, então nada pula de lugar quando a arte entra.

**Duas escolhas que o ambiente impôs, e que valem para a próxima vez:**

- **`IntersectionObserver` não serve aqui.** Seria a ferramenta natural, mas ele não entrega retorno
  em aba que não está desenhando — o que inclui navegador embutido e aba em segundo plano. A
  miniatura ficaria em branco sem ninguém perceber, e o guardião não veria.
- **`requestAnimationFrame` tem o mesmo problema**, e era o que o código usava para desenhar as
  miniaturas. Zero quadros em 2 s de teste. O agendamento passou a ser `setTimeout`, que corre em
  todo lugar; `getBoundingClientRect` já força o cálculo de layout que a conta precisa.

## 2. "Usar a câmera" no celular

No celular o seletor só abria a galeria. Para uma caneca de presente, fotografar o pet ou o bolo
naquele momento é caminho natural. O botão aparece só onde há câmera de verdade
(`(hover: none) and (pointer: coarse)`); no computador o atributo `capture` seria ignorado e o botão
só confundiria.

**De quebra resolve o HEIC do iPhone sem precisar lê-lo:** a câmera do navegador entrega JPEG.

O nome não é "Tirar foto agora" de propósito: o botão de remover ao lado já se chama "Tirar a foto",
e dois botões começando com "tirar" — um que põe e outro que apaga — seria pedir erro.

### O HEIC direto continua em aberto, e é maior do que parecia

`loadArtwork` confere as medidas lidas do cabeçalho contra as da imagem decodificada, como defesa
contra arquivo corrompido. Para HEIC isso exige um leitor de caixas ISO-BMFF que encontre o `ispe`.
É trabalho real e não dá para conferir sem um arquivo HEIC e um Safari de verdade. Enquanto isso, o
caminho da câmera atende o mesmo cliente.

## O que impede de voltar

Duas checagens novas em `qa/audit.mjs`, cada uma conferida com defeito inserido de propósito:

- **catálogo**: os cartões à vista têm de ter arte desenhada; não pode desenhar tudo de uma vez; e
  rolar a lista tem de trazer miniaturas novas.
- **fotos**: o atalho da câmera aparece no contexto com toque e não aparece no computador, nas duas
  pontas, e "Escolher foto" continua onde estava.


---

## 3. O catálogo inteiro à mão, e a regressão que veio junto

Com a miniatura barata, o "Ver mais 132 modelos" deixou de ter razão: os 139 cartões passaram a
nascer na lista, que tem rolagem própria. A página não cresceu — 2.103 px antes e depois — porque a
rolagem é da lista, com 11.894 px de conteúdo numa janela de 464 px. Trocar de assunto ou digitar na
busca volta a lista ao topo, senão quem estava no meio das 138 filtrava e continuava olhando o vazio.

A paginação foi removida inteira (`VISIVEIS_DE_INICIO`, o estado `mostrarTodosOsModelos`, o botão e o
ouvinte) em vez de desligada: código morto alguém tenta reanimar depois.

### A regressão: os ajustes da peça ficaram inalcançáveis

**O dono percebeu antes da gente.** Ao fazer a caneca grudar no topo, "Cores da peça", "Cena e
acabamento" e "Ver a arte aberta" saíram de dentro do cartão da prévia e viraram irmãos dele. Ao
rolar, passavam **por trás** da caneca grudada. Nada tinha sido removido — mas o acesso, sim.

Pior: na medição eles apareciam como "visível, 533 × 52 px", e isso foi aceito como prova. Estavam
visíveis atrás da caneca. **Foi medida a coisa errada.**

O conserto é diferente em cada largura, porque o objetivo é diferente:

- **Tela larga:** quem gruda é a **coluna inteira** (`.studio-coluna-peca`), não só a caneca. Os três
  sobem junto, como sempre subiram. O `align-items:start` do layout voltou, e é ele que deixa a
  coluna ter altura de conteúdo enquanto a área da grade continua alta o bastante para o sticky
  correr.
- **Celular:** lá a caneca precisa grudar sozinha, senão não sobra tela para editar. Os três foram
  para depois do editor, com `order`, onde dá para abrir e mexer sem nada por cima.

O cartão voltou a ser um só: vão zero e bordas emendadas, porque cada bloco tem `border-top` de
divisória e a legenda fecha a base arredondada.

### A checagem que quase não protegeu nada

A primeira versão da checagem descontava a altura da caneca grudada antes de rolar até o bloco — ou
seja, compensava exatamente o que estava quebrado, e passava com o defeito de volta. Está reescrita
para rolar como gente rola: na tela larga os blocos têm de estar à mão enquanto se usa o editor; no
celular, a varredura desce a página em passos até o bloco sair de trás da caneca. Com o defeito
reinserido, acusa `não dá para usar peca-cores: coberto por mug-3d-canvas`.
