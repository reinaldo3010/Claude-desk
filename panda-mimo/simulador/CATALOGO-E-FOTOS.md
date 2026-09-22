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
