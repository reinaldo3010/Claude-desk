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
