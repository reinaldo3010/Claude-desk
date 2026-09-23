# Lições aprendidas no estúdio da caneca

O que custou tempo, o que deu errado e o que passou a ser regra. Escrito para a próxima sessão não
repetir. Companheiro de `COMECE-AQUI.md`.

---

## Do ambiente

- **`npx` está quebrado neste repositório.** O caminho tem `&` (`OneDrive - MINGARDI & ELIAS`) e o
  `npx` do Windows erra a resolução. Use `node node_modules/<pacote>/cli.js`. `npm install` e
  `npm test` funcionam normalmente.
- **`file://` bloqueia o canvas.** O estúdio desenha imagens em canvas e lê os pixels de volta; por
  `file://` o navegador marca o canvas como contaminado e tudo quebra. Por isso existe
  `qa/servidor.mjs`, usado pelo `npm run servir` e pelo próprio guardião.
- **Heredoc longo no Bash falha.** Blocos com mais de ~100 linhas passados por `<<'PY'` quebram com
  "unexpected EOF". Escreva o script de patch num arquivo do scratchpad e rode `python <arquivo>`.
- **Capturas de tela pelo painel do navegador são instáveis** quando a janela está atrás de outra.
  Para prova visual, use o Playwright (como em `qa/provas.mjs`), que é reprodutível.

## Do 3D

- **A UV da caneca é invertida de propósito.** Sem isso a arte sai espelhada. Ao mexer na geometria,
  mexa junto nas vistas e nas luzes: elas foram espelhadas para acompanhar a nova frente.
- **`sigmaRadians` do PMREM acima de 0,04 estoura o número de amostras** e o three.js avisa no
  console. Como o guardião reprova erro de console, isso vira falha.
- **O plano da mesa cobria a caixa de presente.** Cenário novo precisa de ordem de altura pensada: a
  mesa vai embaixo do objeto, não no mesmo plano.
- **Cenário sem enquadramento não aparece.** Ao trocar de cena, recalcule a distância da câmera; do
  contrário a peça ocupa a tela inteira e o cenário fica fora do quadro.
- **`setPointerCapture` falha com ponteiro simulado.** Em teste, o OrbitControls chama isso no
  pointerdown e o navegador recusa. O guardião ignora esse erro específico, e o código do estúdio
  embrulha as chamadas em `try/catch`.

## Do editor

- **Mover um controle de coluna pode tirar o estilo dele.** Os seletores de cor da peça voltaram à
  aparência crua do navegador quando saíram do painel. A correção foi um padrão único de campo para a
  página inteira, e o guardião passou a medir canto, altura, borda e fonte de todo campo visível.
- **Cartão que abre e fecha no mesmo clique confunde teste.** Em automação, cheque `aria-expanded`
  antes de clicar, senão o clique fecha o que você queria abrir.
- **Esperar por tempo fixo depois de escolher arquivo dá falso negativo.** Espere pelo estado (a
  contagem de espaços vazios mudar), não por milissegundos. Foi assim que sumiu uma falha
  intermitente no lote de fotos e outra no carrossel do site.
- **Texto em arco precisa de caixa própria.** A caixa de seleção tem de acompanhar a corda e a
  barriga da curva, e o desenho parte do ponto da camada, não do centro da caixa.
- **Desfazer precisa guardar o que está fora do objeto da arte.** As fotos vivem num mapa à parte, e
  cada passo guarda quais camadas tinham foto; sem isso, desfazer um "tirar a foto" não devolvia nada.

## De processo

- **Guardião primeiro, depois a comemoração.** Toda função nova entrou com checagem de ponta a ponta.
  Foi o guardião que pegou o espelhamento da arte, o campo sem estilo e o rascunho incompleto.
- **Defeito de prova.** Depois de escrever uma regra nova, quebre o site de propósito e confirme que
  ela reprova. Sem isso, a regra pode estar apenas passando por acaso.
- **O manual é parte do código.** Regra nova de arte entra em `MARCA.md` e no histórico do fim dele
  na mesma leva. Foi assim com a biblioteca de letras (8.1.1) e com as cenas da prévia (10.3).
- **Prometer só o que o serviço permite.** O Canva não abre projeto com arte por link de fora sem
  integração oficial; a página passou a dizer isso e a levar a arte como arquivo. Melhor uma frase
  honesta do que um botão que parece quebrado.
- **Nem tudo que o concorrente tem deve entrar.** Extrator de arte de terceiros, loja embutida e
  biblioteca de milhares de cliparts genéricos foram recusados por risco jurídico ou por apagarem a
  identidade da marca. Isso está registrado para não voltar como "ideia nova".
- **O diretório pode ter trabalho de outra sessão.** Confira `git status` antes de `git add -A`, e
  nunca commite o que não é seu sem perguntar.

## Das coleções de arte

- **Declarar o tamanho da ilustração na mão dá caixa errada.** As dezesseis primeiras ilustrações
  de pets tinham a caixa declarada maior que o desenho, e a alça de redimensionar pegava no vazio.
  A correção foi `ilustracao()` medir o desenho e centrar sozinho. Ninguém conta coordenada na mão.
- **A curva não chega no ponto de controle.** Medir uma bézier pelos pontos de controle infla a
  caixa; `limitesDaIlustracao` amostra a curva. Há teste para isso, com número apertado dos dois lados.
- **Comando minúsculo de SVG é relativo.** Aceitar `l` como se fosse `L` desenha outra coisa em
  silêncio. O código recusa alto, no desenho e na medida.
- **Canvas em branco vem transparente, e transparente passa por escuro.** A primeira versão da
  checagem "a arte saiu em branco" olhava só o RGB: alfa 0 dá (0,0,0), que parece tinta preta. O
  defeito de prova passou batido até a checagem olhar o alfa.
- **Cor clara demais some no fundo claro.** As pegadas em areia sobre papel praticamente não
  apareciam na prova. Ilustração decorativa em fundo claro pede pelo menos kraft.
- **Desenhar, olhar, corrigir.** Toda ilustração saiu errada em algum detalhe na primeira versão —
  orelha de cachorro que virava orelha de urso, boca de peixe no meio do corpo. Só apareceu olhando
  a prova. Vale renderizar a folha de contato antes de montar os modelos.
- **Coleção nova não pode pular para a frente do seletor.** Ao entrar, a coleção esportiva ficou
  antes das datas comemorativas porque foi espalhada no topo do array. A ordem dos grupos passou a
  ser uma lista escrita à mão (`ORDEM_DOS_GRUPOS`), com teste.

## Das imagens do acervo (23/09/2026)

- **Checagem que conta camada deixa passar camada invisível.** O elemento do acervo entrava na lista e
  nunca era desenhado, e o guardião só conferia que a lista cresceu. Imagem na arte se confere por
  pixel: tira a foto da vista aberta com a seleção na mesma camada antes e depois (senão as alças contam
  como desenho) e mede quanto mudou.
- **Defeito que só aparece na primeira pintura não aparece depois.** A miniatura sem o Pandinha só existe
  na abertura do estúdio; quando a checagem rodava mais tarde, a lista já tinha sido refeita com a imagem
  carregada e ela passava com o defeito de volta. Foi o defeito de prova que mostrou — mais uma vez, a
  checagem estava errada, não o código.
- **Mexer na caixa de uma camada mexe no confete.** O sorteio das bolinhas de fundo desvia da caixa de
  todas as camadas; a caixa do Pandinha ficou mais alta e o confete de "amizade-formatura" mudou de
  lugar. Só a medida da arte dos 138 modelos, antes e depois, pegou. Hoje isso é teste
  (`qa/artes-aprovadas-unit.test.mjs`), com a impressão digital calculada pelo motor antigo, tirado do git.
- **Duas portas para a mesma imagem baixam duas vezes.** A abertura pedia o Pandinha por um caminho e a
  miniatura por outro; com cache desligado, 70 KB em dobro. Toda imagem do acervo passa por `pedeImagem`.
- **Arquivo servido chega com CRLF.** Instrumentar um módulo trocando texto na rota do Playwright falha
  calado se a âncora tiver `\n`: normalize o fim de linha antes de procurar.
- **Barra invertida em heredoc se corrompe neste ambiente.** Um `\n` dentro de `<<'PY'` chegou ao
  arquivo como quebra de linha de verdade. Remendo com barra invertida vai num arquivo `.py` escrito à parte.

## Do layout (23/09/2026)

- **Trocar a grade por flex numa media query herda o resto da regra.** O `align-items:start` da grade
  continuou valendo na coluna flex do celular, e em coluna ele quer dizer "não estique": a caneca ficou
  com 422 px num painel de 640 e, grudada, cobria o painel. Ao mudar `display` numa quebra, revise
  `align-items` e `justify-*` junto.
- **Meça a caneca grudada em porcentagem da altura da tela, não em pixel.** Uma regra de 320 px para
  telas até 480 desfazia a de 210 px da quebra maior, e ninguém viu: a caneca tomava 94% de um 320×568.
  A checagem nova cobra no máximo 45%, em dez tamanhos de tela.
- **Esconder com `position:absolute` precisa de um pai posicionado.** A descrição escondida dos 199
  cartões de modelo ficou presa à página, fora da rolagem da lista, e a página foi a 13.654 px. O
  guardião pegou pela altura da página, não pela aparência.
- **Checagem escrita para o comportamento de ontem cobra o comportamento de ontem.** Três checagens
  exigiam o pulo para Fotos, porque era o certo quando foram escritas. Mudou a decisão do dono, a
  checagem muda junto — cobrando a decisão nova, e nunca apagada para passar.
- **Conteúdo que surge acima do que a pessoa clicou empurra o clique.** A barra do modelo escolhido
  aparecia no topo da aba e a lista descia 110 px: o cartão clicado fugia de baixo do mouse (e a arte
  maior abria para o cartão errado). Compense a rolagem pela altura exata do que entrou.


## Da segunda rodada do layout (23/09/2026)

- **A prova de defeito não pode estragar o arquivo que o dono está vendo.** A primeira prova reescrevia
  `estudio.js` com o defeito dentro, rodava o guardião e devolvia o original dez minutos depois. Nesse
  meio tempo o dono abriu o estúdio pelo `npm run servir` e pegou justamente a versão com o pulo para
  Fotos que tinha sido recolocado de propósito. Agora o defeito vai para uma pasta à parte e o servidor
  do guardião a serve na frente dos arquivos de verdade:
  `QA_SOBREPOR=<pasta> QA_VIEWPORTS=1280 node qa/audit.mjs`, com a pasta imitando os caminhos do site
  (`<pasta>/simulador/estudio.js`). O arquivo do site nunca é tocado.
- **Quando o dono diz "ainda está acontecendo", confira a hora do que ele abriu antes do código.** O
  `performance.timeOrigin` da aba contra a hora de gravação dos arquivos resolveu em um minuto o que ler o
  código não resolveria: o código estava certo, a aba era de outra hora.
- **Regra de media query escrita ANTES da regra base perde para ela.** As vistas e o zoom numa linha só
  não aconteciam: o `@media (min-width:760px)` estava acima de `.studio-view-tools`, e a regra base, de
  mesmo peso e depois no arquivo, desfazia a troca. Media query que ajusta uma regra vai depois dela.
- **Coluna mais alta que a janela gruda pelo pé.** Com a arte aberta embaixo da caneca, a coluna passa da
  tela quase sempre. Grudada pelo topo, a arte aberta ficaria inalcançável enquanto o editor rola;
  grudada pelo pé (`position:sticky; bottom; align-self:end`, ligada só quando não cabe), ela rola com a
  página até o pé aparecer e ali fica. Quando cabe, o topo continua valendo.
- **O que aparece na abertura entra na regra do dedo.** As bolinhas de cor da frase têm 34 px desde
  sempre e nunca foram cobradas, porque moram dentro de um item fechado. As da peça ficam à vista, e o
  guardião cobrou os 44 px no mesmo dia. Controle que sai de um bloco fechado precisa ser medido de novo.
- **`<dialog>` serve de menu e de folha com o mesmo elemento.** `show()` na tela larga (flutua, não
  prende o foco), `showModal()` no celular (fundo escurecido, Esc de graça). As duas chamadas levam o foco
  para dentro sozinhas; pelo mouse ele é devolvido ao botão, senão um item amanhece com anel.

## Da Minha arte em camadas e do processo (23/09/2026)

- **Desenhar antes de ler o rascunho apaga o rascunho.** A abertura chamava `render()` antes de
  `ofereceRascunho()`, e todo `render()` agenda um salvamento: 1,2 s depois a caneca vazia ia por cima do
  trabalho guardado. Só se guarda o que valeria a pena oferecer de volta (`guardaRascunho`).
- **Campo que muda o desenho precisa carregar a letra dele.** O nome da arte livre voltava do rascunho sem
  `garanteFontes()` e saía na letra padrão do navegador. Em camada, a frase carrega a própria letra.
- **O navegador do Claude é o do dono.** Ele testa na mesma aba, ao mesmo tempo: antes de mexer, guarde o
  rascunho dele numa chave à parte (`copia-do-...` no IndexedDB `panda-mimo-caneca`) e devolva no fim.
  Clique pela referência do elemento (`find` e `ref`), nunca por coordenada medida antes: depois de
  recarregar, o navegador devolve a rolagem de antes e o clique cai em outro botão (um "Baixar prévia"
  saiu assim).
- **O guardião roda por bloco.** `QA_SO=minha-arte QA_VIEWPORTS=1280 node qa/audit.mjs` leva 33 s; o
  guardião inteiro, uns 25 minutos. Numa tarde, 13 provas de defeito rodando o guardião inteiro custaram
  mais de uma hora de espera, e o dono cobrou. Regra: no trabalho e na prova de defeito, só os blocos que
  a mudança toca; o guardião inteiro uma vez, antes de publicar (em segundo plano, fazendo outra coisa).

## Do estúdio dentro do site (23/09/2026)

- **Uma marcação só para duas páginas.** A home busca o `.studio-layout` de `caneca-3d.html` e importa o
  `estudio.js` quando a seção se aproxima; duplicar o HTML faria toda mudança do estúdio precisar ser feita
  duas vezes. A classe `studio-page` no contêiner faz as regras `.studio-page …` valerem lá dentro.
- **Dentro de uma página com barra do topo grudada, tudo que gruda soma a barra.** A caneca parava a 0 px,
  por baixo dos 73 px da barra do site. `--estudio-topo` leva a altura da barra para o CSS e para as
  rolagens do estúdio (`topoDaPagina()`).
- **Foco devolvido sem `preventScroll` desfaz a rolagem que veio antes.** Fechar o detalhe do produto
  devolvia o foco ao cartão, e o navegador arrastava a página de volta ao catálogo depois de ela ter ido
  ao estúdio. O defeito já existia com o simulador de desenho; o bloco novo do guardião pegou.

