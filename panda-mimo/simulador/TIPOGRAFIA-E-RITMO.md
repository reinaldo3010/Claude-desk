# Tipografia e ritmo do estúdio — 22/09/2026

Rodada de design, continuação do peso dos controles. O dono pediu que ficasse bonito; aqui está o
que a medição mostrou e o que mudou.

## O achado principal não era tamanho: era peso

| | antes | depois |
|---|---|---|
| peso 800 | **171 elementos** | 2 |
| peso 700 | 9 | 155 (139 são nomes dos cartões de modelo) |
| peso 600 | 8 | 31 |
| peso 400 | 165 | 165 |

Metade da interface estava em extra-negrito. Quando tudo grita, nada tem ênfase — e era isso que
dava o peso, mais do que o tamanho dos controles.

**E não era questão de gosto.** O manual da marca (seção 8) é explícito:

> **Nunito** — corpo em 400 ou 600. **Eyebrows em 800**, caixa alta, espaçamento .08 a .12 em.

Eyebrow é o rótulo miúdo em caixa alta, que deveria ser meia dúzia na página. Havia 171. O estúdio
tinha saído da identidade aprovada; isto é volta ao manual, não redesenho. Sobraram dois 800:
"MONTE SEU MIMO" e o selo "PRÉVIA EM 360°" — exatamente o que a regra prevê.

Títulos de bloco ficaram em 700; controles e rótulos de campo, em 600.

## Escala de letra: doze valores viraram três

Havia doze tamanhos entre `.7rem` e `.95rem`, escolhidos um a um ao longo do tempo. O resultado era
uma escala sem degraus — 13 e 14 px lado a lado, que o olho não separa.

```
--fs-rotulo: .7rem    selo e rótulo miúdo, caixa alta
--fs-corpo:  .85rem   controle, valor, nome, ajuda, legenda
--fs-secao:  1rem     título de bloco
```

**São três e não quatro de propósito.** Quatro degraus na faixa de 11 a 16 px voltam a se colar
(1,07× entre vizinhos). Com três, cada passo se enxerga: 11 → 13,6 → 16 px, a 1,21× e 1,18×.

A diferença entre um controle e o texto de ajuda ao lado passa a vir do **peso e da cor**, que é
como interface separa as coisas sem inchar a escala. Hoje o painel inteiro é 14 px.

## Entrelinha e espaçamento

- **Entrelinha:** de dezesseis valores computados para três.
- **Espaçamento entre blocos:** de treze valores irregulares (10, 11, 13, 14, 15, 17, 18, 22, 30…)
  para cinco na grade de 4 px — 12, 16, 20, 24, 28.

Só margens e gaps foram encaixados. **Paddings ficaram intactos**, porque definem a forma dos
controles ajustados na rodada anterior; mexer neles desfaria o trabalho do peso.

Nos empates o arredondamento foi **para baixo**: 14 virou 12, não 16. Deliberado — o pedido era menos
peso, e arredondar para cima engordaria tudo.

## O que não foi feito

A escala grande da página (57, 48, 26, 19 px no cabeçalho e no fechamento) não foi tocada: ela vem do
`styles.css`, que é compartilhado com o site inteiro. Mexer ali é outro trabalho, com outro risco.
