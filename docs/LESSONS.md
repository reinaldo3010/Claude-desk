# Lições

O que estava errado no esqueleto, o que é verdade sobre os dados do Claude Code,
e o que vai quebrar quando ele for atualizado.

---

## O erro que definiu o resto

O esqueleto lia o uso do cache de um dashboard de terceiros
(`claude-codex-usage-dashboard`) e, como não sabia o formato daquele arquivo,
varria o objeto inteiro procurando chaves por regex:

```js
const isFive = /(5h|five.?hour|session)/.test(p);
if (/(util|percent|pct|used|usage)/.test(p)) { … }
```

Havia uma tarefa inteira de "fase 1" só para descobrir empiricamente o formato
daquele cache, rodando o setup do outro projeto e comparando com a saída.

**Essa tarefa não precisava existir.** Desde a v2.1.x o Claude Code entrega os
limites de graça, direto, no stdin do `statusLine`:

```json
{
  "rate_limits": {
    "five_hour":   { "used_percentage": 23.5, "resets_at": 1738425600 },
    "seven_day":   { "used_percentage": 41.2, "resets_at": 1738857600 },
    "spend_limit": { "used_percentage": 62.8, "resets_at": 1740787200 }
  }
}
```

Escrevendo a própria statusLine, o deck vira o **produtor** do dado em vez de
consumidor de segunda mão. A fase de descoberta evapora, a dependência do
projeto de terceiro some, e um `git pull` deles deixa de ser risco.

A lição generaliza: quando existe uma fonte oficial, procurar antes de escrever
o parser tolerante economiza mais do que qualquer regex bem-feita. O parser
tolerante continua no código (`scanUnknown`), mas como **plano C**, não como
arquitetura.

## O que mais estava na mesa e o esqueleto ignorava

O mesmo stdin traz, sem custo:

| Campo | Uso no painel |
|---|---|
| `context_window.used_percentage` | quanto falta para compactar |
| `cost.total_cost_usd` | gasto acumulado da sessão |
| `prompt_cache.hit_ratio` | eficiência do cache |
| `model.display_name`, `version` | qual modelo, qual versão |
| `workspace.git_worktree`, `workspace.repo` | branch e repositório |
| `pr.number`, `pr.review_state` | PR aberto e estado da revisão |
| `effort.level`, `thinking.enabled`, `fast_mode` | configuração da sessão |
| `session_id`, `session_name` | dá para mostrar várias sessões, não uma |

O esqueleto mostrava dois percentuais. Havia um painel inteiro ali de graça.

## Hooks: 4 escutados, ~30 disponíveis

O esqueleto usava `UserPromptSubmit`, `Notification`, `Stop` e `SessionEnd`,
via um `.cmd` que chamava `curl`. Três problemas.

**Primeiro, o repertório.** Existem cerca de 30 eventos de ciclo de vida.
Escutando `PreToolUse` o painel deixa de dizer "algo acontecendo" e passa a
dizer "rodando comando". `StopFailure` distingue "acabou" de "estourou o
limite". `SubagentStart`/`Stop` contam quantos subagentes estão vivos.
`PermissionRequest` entrega o pedido de permissão com a ferramenta e os
argumentos.

**Segundo, o transporte.** Hooks aceitam `type: "http"` — um POST direto para o
deck, com o payload JSON completo. Sem arquivo `.cmd`, sem `curl`, sem
diferença entre sistemas operacionais.

**Terceiro, o travamento.** A preocupação do esqueleto era legítima ("confirme
que os hooks nunca travam o Claude Code se o deck estiver desligado") mas a
solução, pela descrição, era frágil: um `.cmd` que sai com 0 de propósito, mais
um timeout de `curl` para validar. Hooks HTTP com `"async": true` não esperam
resposta e não entram na conta do timeout. O problema deixa de existir por
construção, em vez de ser contornado.

> **Ressalva de procedência.** Dos seis arquivos que o prompt original listava,
> dois não chegaram junto: `deck-event.cmd` e `claude-deck.ahk`. O que este
> documento diz sobre o `.cmd` vem da descrição no próprio prompt e das
> chamadas a ele no `hooks-snippet.json` e no `INSTALL.md` — não da leitura do
> arquivo. E o `install/claude-deck.ahk` deste repositório é uma reescrita do
> zero, não uma revisão do original: nenhuma comparação com o script anterior
> foi feita, então um detalhe que ele resolvesse bem pode ter se perdido.

## O "aperte 1" era uma roleta

O esqueleto assumia que o prompt de permissão numera `1` sim, `2` sim e não
perguntar, `3` não — e reconhecia que não tinha verificado.

Não é só que a suposição pode estar errada. É que **a abordagem** está errada:
a numeração varia entre versões e entre tipos de permissão, e se a janela alvo
estiver errada o "1" vai parar em outro lugar. Digitar às cegas num prompt
cujo estado você não observa é uma aposta, e o prejuízo de errar é aprovar algo
que você recusaria.

O `PermissionRequest` do tipo `http` inverte isso: o Claude Code **espera** a
resposta do deck, e a resposta carrega a decisão. Sem numeração, sem janela,
sem foco. E o painel mostra o comando exato antes de você decidir — o que o
mecanismo de teclas nunca poderia fazer, porque ele não sabe o que está
aprovando.

Duas honestidades sobre isso:

1. **Não foi possível verificar ponta a ponta daqui.** Não há sessão real do
   Claude Code neste ambiente pedindo permissão. O portão está testado contra
   o contrato documentado (decisão, prazo, fila cheia, encerramento) mas o
   aperto de mão com o Claude Code de verdade é um teste que só a sua máquina
   faz. Por isso ele vem **desligado por padrão** e marcado como experimental.
2. **"Sempre" não tem equivalente em hook.** Não existe decisão que signifique
   "não perguntar mais". Esse botão continua usando teclas, e por isso pede
   confirmação em dois toques.

O modo de falha foi escolhido, não herdado: prazo esgotado devolve "sem
decisão" e o terminal pergunta. Silêncio nunca vira aprovação.

## Bugs que os testes e o olho pegaram

Nenhum destes apareceu em revisão de código. Todos apareceram ao rodar.

**`+{Tab}` digitava lixo.** A gramática de teclas casava `{Nome}` antes de
considerar o modificador, então `+{Tab}` virava `shift+"{"` mais as letras
`T`, `a`, `b`. O botão "Modo plano" digitaria `{Tab}` no prompt em vez de
alternar o modo. Pegou num teste de tradução de teclas.

**`unref()` no temporizador do portão.** Parecia higiene ("não segure o
processo"). Na prática, se aquele temporizador fosse a única coisa viva, o Node
saía antes do prazo vencer — e o hook do Claude Code ficaria esperando uma
resposta que nunca viria. Pegou porque o teste do prazo travou.

**`display` numa classe anula `[hidden]`.** O cartão de permissão tinha o
atributo `hidden`, mas `.gate-layer { display: grid }` vence a folha do
navegador. Resultado: o cartão aparecia por cima do painel o tempo todo, sem
nenhuma permissão pendente. Só apareceu na primeira captura de tela.

**Sessão viva medida pela idade do snapshot.** A statusLine roda em gatilhos
(prompt enviado, resposta pronta, troca de modelo), não em intervalo fixo.
Meia hora lendo código não gera atualização nenhuma, e um limite de 90 segundos
marcava como morta uma sessão aberta na sua frente. Agora cruza com o último
evento de hook daquela sessão.

**Payload `null` derrubava a máquina de estados.** O valor padrão de parâmetro
em JavaScript só cobre `undefined`. Um `null` explícito passava direto e
quebrava no primeiro acesso a campo.

## Acender o botão certo é uma questão de honestidade

As abas Modelo e Esforço são seletores: o botão da opção em uso acende. Isso
exige saber qual opção está em uso, e a fonte disponível — a statusLine —
não responde exatamente essa pergunta.

Ela informa o **modelo resolvido** (`claude-opus-5`), não o apelido que foi
digitado. Os apelidos `opus`, `opus[1m]` e `opusplan` resolvem para a mesma
família e chegam indistinguíveis. Havia três saídas:

1. acender os três — mentira;
2. acender o primeiro — mentira pior, porque parece precisa;
3. acender só a família e deixar os outros dois sem indicador.

A terceira. Os três botões funcionam; só um mostra estado, e é o único sobre
o qual existe informação. O mesmo vale para `ultracode`, que a documentação
diz reportar como `xhigh`: o botão que acende é "Extra", e o rótulo do
Ultracode carrega `xhigh + orquestração` para o painel não deixar dúvida.

Um indicador que às vezes mente é pior do que indicador nenhum: você para de
olhar para ele, e aí ele não serve nem quando está certo.

Sobre a procedência: apelidos e níveis foram lidos da documentação do Claude
Code, não da memória, e estão travados por teste. Um apelido inventado não
daria erro visível — viraria um comando inválido digitado no terminal.

## O que quebra numa atualização do Claude Code

Em ordem de probabilidade.

**1. O endpoint de uso OAuth.** `api.anthropic.com/api/oauth/usage` não é
documentado. Pode mudar de forma ou sumir sem aviso. *Contenção:* é plano B,
toda falha é silenciosa, e o painel continua com o dado da statusLine.

**2. A grafia da decisão de permissão.** A documentação descreve
`permissionDecision` dentro de `hookSpecificOutput` no formato geral, e
`decision` na tabela específica do `PermissionRequest`. O deck emite as duas.
Se as duas deixarem de valer, o portão para de decidir — e o efeito é o
terminal perguntar, que é o comportamento sem portão. *Falha para o lado
seguro.*

**3. Apelidos de modelo e níveis de esforço.** `/model` e `/effort` aceitam
argumento em linha, e os valores aceitos podem mudar quando um modelo novo
sai. Um apelido descontinuado vira um comando inválido no terminal — visível,
mas chato. *Onde olhar:* as páginas `modelo` e `esforco` em `src/actions.js`,
e o teste "os comandos digitados são exatamente os documentados".

**4. Nomes de evento de hook.** São ~30 e crescem. Um nome que suma vira um
hook que nunca dispara: o painel fica menos informado, não quebrado. Eventos
novos caem no `default` e viram linha de log. *Onde olhar:* `HOOK_EVENTS` em
`src/settings.js` e o `switch` em `src/store.js`.

**5. Campos novos na statusLine.** São aditivos por contrato — a documentação
marca quase tudo como "pode estar ausente", e o parser trata tudo como
opcional. Um campo novo é oportunidade, não risco.

**6. `rate_limits` sumir para algum plano.** Já é condicional hoje: só aparece
para Pro e Max, e só depois da primeira resposta da API. O painel degrada para
"--" e o `doctor` explica o motivo em vez de mandar você caçar um bug.

**O que não quebra:** a leitura dos snapshots (formato nosso), a injeção de
teclas (não depende do Claude Code) e a interface.

## Sobre a segurança, sem enrolação

A pergunta original era boa: "se alguém na minha rede acertar o token, ele
digita no meu terminal — vale restringir por IP ou por janela de tempo?"

**Por IP.** Recomendação única, sem menu.

Janela de tempo protege pouco: você usa o deck justamente quando está
trabalhando, que é quando o dano de uma aprovação errada é maior. Já o tablet
tem IP fixo, então `allowFrom` é uma linha de configuração que elimina a classe
inteira de "alguém na rede com o token".

Vale ser claro sobre o que o token faz e não faz. Ele não é o problema — ele
vaza pelo histórico do navegador, pela URL do quiosque, pelo print que você
manda no grupo. As camadas existem porque o token vai vazar:

| Camada | O que impede |
|---|---|
| Faixa de IP | qualquer origem que não seja o tablet |
| Token em tempo constante | descobrir o segredo por medição de tempo |
| Limite por minuto | rajada automatizada |
| Só um `id` de ação na API | escolher o texto que vai para o terminal |
| Log de auditoria | descobrir depois que aconteceu |

O que deliberadamente **não** existe: sistema de login. Cerimônia demais para
um painel de parede, e a superfície real é a rede, não a senha.

## O que eu faria diferente da próxima vez

Verificar a fonte de dados **antes** de projetar o consumidor. Metade da
complexidade do esqueleto — o parser por regex, a fase de descoberta, a
dependência do projeto de terceiro — existia para resolver um problema que uma
leitura da documentação do `statusLine` teria dissolvido em cinco minutos.
