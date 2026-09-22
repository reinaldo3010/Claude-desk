# Peso dos controles e a faixa de ajustes — 22/09/2026

Rodada de design, a pedido do dono: "parece que os botões são todos muito grandes" e "em 80% de zoom
fica bem melhor".

## O diagnóstico: 44 px é regra de dedo, e virou regra de tudo

A rodada anterior subiu **todo** alvo de toque para 44 px. O número é certo para o dedo e errado para
o mouse. A conta que mostra isso é a proporção entre a altura do controle e o tamanho da letra:

| controle | antes | proporção | agora, no mouse | proporção |
|---|---|---|---|---|
| Botões de cena | 44 px · letra 12 | **3,7×** | 34 px | 2,8× |
| Cadeado | 44 px · letra 12 | **3,7×** | 34 px | 2,8× |
| Abas | 48 px · letra 14 | 3,4× | 40 px | 2,9× |
| Botões de vista | 44 px · letra 14 | 3,1× | 37 px | 2,6× |

Interface refinada vive entre 2,2× e 2,8×. **O teste do dono provava isso sem querer:** a 80% de
zoom, um botão de 44 px vira 35 px — exatamente a faixa boa. Ele estava corrigindo a proporção na
mão, com o zoom do navegador.

O corte é por `@media (pointer: fine)`. O dedo mantém 44 px; o mouse ganha o tamanho justo. A norma
pede 24 px mínimos para ponteiro fino, então sobra folga.

## A faixa de ajustes, e as três rolagens

O dono também estranhou a rolagem lateral junto da caneca. Medindo: havia **três áreas rolando ao
mesmo tempo** — a página, a coluna da peça (732 px mostrando 936 de conteúdo) e a lista de modelos.

O excedente da coluna eram os 244 px dos ajustes da peça. Eles saíram da coluna e viraram uma faixa
própria de largura inteira (1160 px) abaixo do layout, em colunas lado a lado. Resultado: **uma área
de rolagem só**, a coluna cabe sem estourar, e cores, cena e arte aberta têm espaço em vez de
espremidos numa coluna estreita.

## As checagens envelheceram junto com o desenho

As duas checagens escritas na rodada anterior reprovaram este trabalho — e estavam erradas, não o
código:

- a de alvo de toque cobrava 44 px sempre; passou a ler o ponteiro (44 com dedo, 24 com mouse);
- a dos ajustes da peça esperava que eles viajassem grudados com a coluna; passou a varrer a página
  em passos e cobrar que cada bloco fique inteiro na tela e sem nada por cima.

**É a terceira vez na mesma sessão que uma checagem envelhece com a mudança de desenho.** O risco é
sempre o mesmo: "consertar" o código para o teste passar e, com isso, desfazer a melhoria pedida.
Quando a checagem reprovar uma mudança deliberada, o primeiro passo é perguntar qual dos dois está
velho.

## Um tropeço que custou uma restauração

O primeiro corte moveu o bloco dos ajustes com um script que procurava o `</div>` do layout e pegou
outro, enfiando a seção no meio da prévia. As contagens de tags continuavam batendo, então nada
gritou. O arquivo foi restaurado do commit e a mudança refeita ancorada em `</main>`, que é único.


---

## A sobreposição que o dono viu num print

Depois de publicada a faixa de ajustes, a prévia passou a **cobrir** a faixa em janelas mais baixas.

**A causa:** sobrou na coluna da peça um `max-height: calc(100vh - 36px)` do desenho anterior, de
quando ela precisava rolar por dentro. Com os ajustes fora da coluna o limite perdeu a função, e
virou armadilha: em janela baixa o conteúdo passa do limite e vaza para fora da caixa. Como a coluna
é `position: sticky`, ou seja, elemento posicionado, **o que vaza pinta acima do conteúdo estático**
mesmo vindo antes no documento.

| janela | invasão antes | depois |
|---|---|---|
| 1366 × 768 | 0 px | 0 px |
| 1337 × 660 | 23 px | 0 px |
| 1280 × 580 | 103 px | 0 px |

Só aparecia em janela baixa, e as medições vinham sendo feitas a 768 — onde a coluna (675 px) ainda
cabe. **Foi o dono quem viu.**

A checagem nova varre a página em três alturas de janela e reprova se a prévia cobrir a faixa de
ajustes, a área de fechamento ou o rodapé. Confirmada com o defeito reinserido: acusa os mesmos
23 px e 103 px.

**Lição:** `max-height` sem `overflow` não corta nada — só muda o tamanho da caixa e deixa o conteúdo
vazar. Num elemento posicionado, o que vaza cobre o que vem depois.

## Uma checagem frágil por tempo fixo

No mesmo lote, o bloco da arte do Canva falhou sozinho: ele esperava 900 ms cravados pela mensagem de
status, mas os downloads logo acima (prévia, arte plana, vídeo, 4K) escrevem no **mesmo campo**, e um
deles terminando tarde sobrescrevia a mensagem. O caminho foi reproduzido à mão e a mensagem aparece
na hora e fica estável. A checagem passou a esperar a condição em vez de cravar tempo.
