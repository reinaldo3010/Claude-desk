# Indicador de passo — 22/09/2026

Item da auditoria: nada dizia em que etapa a pessoa estava, nem qual era a próxima, nem quando tinha
terminado. As abas eram a única navegação, e quem não conhece o produto não sabia que acabou.

## O que entrou

Uma barra entre o painel e a área do pedido:

```
Passo 2 de 4 · Fotos
Faltam 2 fotos.                      [ Continuar para frases ]
```

E um ponto discreto na aba que ainda tem pendência, para a atenção ir onde falta fazer algo.
No último passo o botão muda para **Ver como ficou e pedir** e leva à área de fechamento.

## O achado que veio junto: as frases de exemplo

As frases nascem com texto de exemplo — "chá do Theo", "time da tia Lu". **Se o cliente não trocar,
é isso que sai impresso na caneca dele.** É o erro mais caro que dá para cometer aqui: peça
produzida, cliente insatisfeito, retrabalho e frete.

`situacaoDoPasso('frases')` compara cada frase com a do modelo original (`modeloPorId(arte.modelo)`)
e avisa enquanto o texto ainda for o de exemplo. Some sozinho quando a pessoa escreve o dela.

## Duas decisões de produto

- **"Enfeites" nunca cobra nada.** É tempero, não obrigação: ninguém devia sentir que faltou algo por
  não ter posto um coração.
- **Nada bloqueia.** Dá para continuar e pedir com foto faltando. A barra informa, não impede — quem
  manda é o cliente, não o sistema. O aviso do que falta já existia perto do botão de pedido e
  continua lá.

## Detalhes de implementação

- O ponto de atenção é atualizado **sem remontar as abas**: remontar rouba o foco de quem navega por
  teclado no meio da montagem.
- O botão tem 48 px de altura, acima dos 44 recomendados — de quebra resolve parte do item de alvos
  de toque da auditoria.
- A barra só aparece depois de escolher um modelo; antes disso não há passo nenhum para indicar.

## O que impede de voltar

Checagem em `qa/audit.mjs`, conferida com defeito de prova (`a barra não apareceu depois de escolher
um modelo`): a barra não pode aparecer antes de haver modelo; tem de dizer o passo e o que falta;
as abas de fotos e frases têm de marcar pendência num modelo recém-escolhido; o botão tem de avançar
de aba; e no último passo ele não pode continuar mandando "Continuar para".
