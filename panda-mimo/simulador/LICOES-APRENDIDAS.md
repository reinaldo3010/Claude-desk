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
