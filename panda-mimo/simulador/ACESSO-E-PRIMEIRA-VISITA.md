# Alvos de toque, ajuda, primeira visita, teclado e HEIC — 22/09/2026

Cinco itens da auditoria numa rodada só, todos acréscimos: nada foi removido nem movido.

## O que entrou

- **Alvo de toque de 44 px** em tudo. Antes: rodapé 22 px, "voltar" 23, cadeado 38, botões de texto 36,
  botões de vista e cena 42, logotipo 42. O ganho é por `padding` e `min-height` — nenhuma tipografia
  nem espaçamento entre elementos mudou.
- **Ajuda ao lado do termo**: "O que é a margem de segurança?" junto do próprio controle, e "O que
  quer dizer 300 dpi?" junto da medida. O texto existia solto e longe; agora chega na hora da dúvida.
- **Primeira visita**: três passos sobre como funciona, uma vez só, guardados em `localStorage` com
  try/catch (janela anônima não quebra, só mostra de novo). **Sem preço e sem prazo** — o dono ainda
  não definiu, e inventar número seria pior do que não dizer nada.
- **Teclado**: atalho "Ir direto para o editor da arte" (eram 28 tabulações até o primeiro modelo) e a
  caneca gira pelas setas, com `+`/`−` para aproximar. O `aria-label` detalhado saiu do contêiner e
  foi para o canvas, que agora recebe foco.
- **HEIC/HEIF**, o padrão de foto do iPhone: leitor de caixas ISO-BMFF que acha a medida no `ispe`.

### O limite assumido do HEIC

Qual `ispe` é o da imagem principal se resolve por `pitm` e `ipma`; aqui se pega o maior, porque o
arquivo costuma trazer a miniatura junto. Por isso a medida é palpite, e a conferência estrita contra
a imagem decodificada é dispensada só para ele — quem segura o tamanho continua sendo
`assertDimensions` sobre o que o navegador decodificou.

O teste usa um HEIC **sintético**, montado no próprio teste. A decodificação é do navegador: no
Safari deve abrir, no Chrome cai na mensagem que já existe pedindo PNG ou JPG — o que já é melhor do
que o arquivo não aparecer como selecionável. **Falta conferir com um arquivo real.**

## A regressão que esta rodada revelou, e que não era dela

Na tela larga a caneca **tinha parado de grudar**, por causa do lote anterior. Quando a vista da arte
aberta abre sozinha (o que acontece acima de 850 px), a coluna da peça fica com 1661 px contra 1547
do editor. Sendo a coluna a mais alta, ela define a altura da linha da grade e o `sticky` fica sem
espaço para correr: a caneca sobe junto com a página e a pessoa volta a editar sem ver a peça — o
problema que o lote anterior existia para resolver.

O guardião anterior passou porque as checagens escritas não cobriam esse caso. Foi achado agora
porque a falha foi **instrumentada em vez de adivinhada**: três hipóteses estavam erradas antes de o
diagnóstico apontar `canvas y = -251`.

**Conserto:** a coluna cabe na tela (`max-height: calc(100vh - 36px)`) e rola por dentro. A caneca
fica sempre no topo e os ajustes ficam a uma rolagem de distância.

**Lição para a próxima:** `position: sticky` num item de grade só corre se a OUTRA coluna for mais
alta. Coluna que cresce sozinha (um `<details>` que abre) mata o sticky sem aviso.

## O que impede de voltar

Checagem em `qa/audit.mjs` nas duas larguras: nenhum controle abaixo de 44 px; as duas explicações
presentes; as boas-vindas aparecem na primeira abertura e fecham no clique; o atalho para `#abas`
existe; a caneca recebe foco e as setas a giram; e o seletor aceita HEIC.
