# Os três P0 da auditoria de usabilidade — 22/09/2026

Da auditoria do estúdio (artefato com o checklist completo). Estes três quebravam a experiência na
primeira tentativa; os outros doze seguem em aberto.

## 1. Escolher um modelo jogava a pessoa para o rodapé

**O que acontecia.** A lista de modelos ficava inteira no fluxo da página. Com 138 artes abertas a
página passava de 13.000 px. Ao escolher um modelo a lista sumia, a página encolhia de uma vez e o
navegador grampeava a rolagem no novo fim — que era o rodapé. A caneca ficava 971 px acima da tela e
o painel de fotos, 792 px.

**O conserto.** Dois movimentos, um de estrutura e um de cortesia:

- `.studio-models` ganhou rolagem própria (`min(58vh, 560px)` na tela larga, `52vh` no celular),
  então a altura da página não depende mais de quantos modelos estão à mostra;
- `levaParaAPeca()` em `estudio.js` leva a pessoa para as abas — o próximo passo — quando elas não
  estão à vista.

**Três armadilhas nesse conserto**, todas pegas pelo guardião e não pela leitura do código:

1. Mirar na caneca não funciona: ela é `sticky` e está sempre no alto, então a função concluía "já
   está à vista" e saía sem fazer nada. O alvo tem de ser o próximo passo.
2. No celular a rolagem própria da lista chegou a ser desligada, por receio de scroll aninhado. Sem
   ela a página voltava a 11.877 px e o tombo continuava.
3. `behavior: 'auto'` obedece ao `scroll-behavior: smooth` do html, e rolagem animada não completa
   em navegador automatizado: a checagem passaria a nunca proteger nada. Vale `'instant'`.

**Medido depois**, partindo do rodapé com a lista inteira aberta:

| | desktop 1280 | celular 390 |
|---|---|---|
| partiu de | 1.339 | 2.216 |
| chegou a | 306 | 726 |
| abas na tela | y = 8 | y = 486, logo abaixo da caneca |
| página com tudo aberto | 2.101 px | 3.060 px (era 11.877) |

## 2. No celular dava para editar sem ver a caneca

**O que acontecia.** O CSS tinha `position:static` na prévia abaixo de 850 px. O painel de edição
começava a 1.246 px do topo; com ele na tela, a caneca estava 513 px acima. A pessoa escolhia foto e
trocava frase sem ver o resultado.

**O conserto.** A prévia gruda no topo também no celular. Para isso:

- os ajustes da peça (cores, cena, arte aberta) saíram de dentro do bloco que gruda e viraram
  `.studio-preview-extra` — senão o bloco tomaria a tela inteira (em 23/09/2026 eles voltaram para
  a coluna da peça, à vista, e a coluna passou a grudar pelo pé; ver `REDESENHO-LEVE.md`);
- os dois passaram a viver em `.studio-coluna-peca`. Na tela larga essa coluna é um item da grade que
  **estica** até a altura do editor, que é o que dá espaço para o `sticky` correr. No celular ela vira
  `display:contents` e some do fluxo, e aí o `sticky` corre contra a página toda;
- a caneca no celular passou de 390 px para 210 px de altura, deixando 334 px de tela para o editor.

**Cuidado que custou uma volta:** ao separar os ajustes em duas seções, a grade da tela larga ganhou
um terceiro filho e o editor caiu para a segunda linha, ao lado dos ajustes em vez da caneca. A
coluna própria resolve, e `align-items:stretch` no layout é o que faz ela esticar.

## 3. A roda do mouse sobre a caneca não rolava a página

**O que acontecia.** O OrbitControls consumia a roda para dar zoom. Como a prévia ocupa 668 × 470 px
de uma tela de 1366 × 768, quem punha o cursor ali sentia o site travado, sem nada explicando.

**O conserto.** O mesmo acordo dos mapas embutidos: roda sozinha rola a página, `Ctrl` (ou `⌘`) mais
roda dá zoom. Um ouvinte de captura em `caneca-3d.js` decide antes do OrbitControls ver o evento; com
`enableZoom` em falso o controle ignora a roda e não chama `preventDefault`. Na primeira vez que a
pessoa rola sem o modificador, aparece uma dica curta por 1,6 s. O toque não mudou: um dedo gira,
dois aproximam, e a barra de zoom continua sendo o caminho principal.

## O que impede de voltar

Três checagens novas em `qa/audit.mjs`, nas duas larguras:

- a lista inteira não pode deixar a página acima de 6.000 px;
- depois de escolher um modelo, a caneca e as abas têm de estar na tela (o rodapé à vista não
  serve de sinal: numa página curta ele aparece sem ninguém ter sido jogado para lá);
- a roda sozinha não pode ser consumida pelo 3D, e `Ctrl` + roda tem de continuar dando zoom.

## O que ficou de fora

Os doze pontos restantes da auditoria, entre eles os 3,6 MB de carga inicial, os sete modelos
visíveis de 138, a falta de indicação de passo e o alvo de toque de 22 px no rodapé.
