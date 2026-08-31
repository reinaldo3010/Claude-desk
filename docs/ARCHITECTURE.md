# Arquitetura

As decisões e o porquê de cada uma. Se você for mexer no código, leia isto
antes — várias escolhas parecem arbitrárias até você saber o que elas evitam.

---

## Fluxo

```
Claude Code
   │
   ├── statusLine ──▶ bin/deck-statusline.js
   │                    ├─ grava ~/.claude/deck/sessions/<id>.json  (escrita atômica)
   │                    └─ imprime a barra de status no terminal
   │
   └── hooks HTTP ──▶ POST /api/hook
                         │
                         ├─ src/store.js   máquina de estados
                         └─ src/gate.js    segura o PermissionRequest
                                              │
                    ┌─────────────────────────┘
                    ▼
              src/server.js
                    ├── GET /api/stream   SSE ──▶ tablet
                    ├── GET /api/state    JSON (fallback)
                    └── POST /api/action  ──▶ src/inject.js ──▶ janela do terminal
```

## Módulos

| Arquivo | Responsabilidade |
|---|---|
| `bin/deck-statusline.js` | produz snapshots e imprime a barra de status |
| `bin/claude-deck.js` | CLI: start, install, uninstall, doctor, dump, event |
| `src/config.js` | precedência ambiente → `deck.config.json` → padrão |
| `src/actions.js` | **catálogo único** de botões; a UI se monta a partir dele |
| `src/deckengine.js` | resolve o deck para o estado: visibilidade, urgência, face |
| `src/usage.js` | normaliza e agrega snapshots; histórico e taxa de queima |
| `src/store.js` | eventos de hook → estado do painel |
| `src/gate.js` | portão de permissão remota |
| `src/inject.js` | injeção de teclas por plataforma |
| `src/security.js` | token, faixa de IP, limite por minuto, auditoria |
| `src/settings.js` | escrita segura no `~/.claude/settings.json` |
| `src/oauth.js` | plano B de uso pelo endpoint do `/usage` |
| `src/server.js` | HTTP e SSE |
| `public/` | painel: um HTML, um CSS, um JS |

---

## Decisões

### Produzir o dado em vez de consumir de terceiro

**Escolha:** o deck instala a própria `statusLine`.

O Claude Code entrega `rate_limits`, `context_window`, `cost`, `prompt_cache`,
modelo, branch e PR no stdin do `statusLine`. Consumir o cache de outro projeto
significaria depender do formato dele e quebrar quando ele mudasse.

**Custo aceito:** o usuário perde a statusLine que tinha (com backup, e o
`doctor` avisa). É um custo real, e ele compra a independência.

**Consequência:** a "fase de descoberta do formato do cache" deixa de existir.

### Hooks HTTP assíncronos

**Escolha:** `{"type": "http", "url": "…/api/hook", "async": true, "timeout": 5}`.

Alternativa descartada: script `.cmd` chamando `curl` (era o caminho do
esqueleto). Ela precisa de um arquivo por plataforma, perde o payload
estruturado, e exige provar que o `curl` não trava o Claude Code quando o deck
está desligado. O `deck-event.cmd` original não estava entre os arquivos
recebidos — a comparação é com o mecanismo descrito, não com aquele código.

Com `async: true` o hook não espera resposta e não entra na conta do timeout.
Deck desligado é um POST que falha na hora, invisível.

**Exceção:** `PermissionRequest` é síncrono por natureza — a resposta dele
carrega a decisão. Por isso ele só é instalado com `--gate`.

### Portão de permissão em vez de teclas

**Escolha:** aprovar e recusar passam pelo hook, não pelo teclado.

Digitar `1{Enter}` num prompt cujo estado você não observa é uma aposta: a
numeração muda entre versões e a janela alvo pode estar errada.

**Modo de falha, escolhido de propósito:** prazo esgotado devolve "sem decisão"
e o terminal pergunta. Silêncio **nunca** vira aprovação.

**Estado:** desligado por padrão. O aperto de mão com o Claude Code real não
pôde ser verificado no ambiente onde isto foi escrito, e um recurso de
aprovação não estreia ligado sem verificação.

**Teclas continuam existindo** para o que não tem hook: prompts, `Esc`,
`/compact`, modo plano, e o botão "Sempre".

### SSE em vez de polling

**Escolha:** o servidor empurra; o painel não pergunta.

O esqueleto perguntava a cada 2 segundos. Num tablet isso é rádio ligado o
tempo todo, e até 2 segundos de atraso justamente no evento que importa.

Com SSE o alerta aparece no instante do hook e o rádio dorme entre eventos.
Há batimento a cada 25s (contra proxies e o Wi-Fi adormecendo) e queda
automática para polling se o SSE não subir depois de duas tentativas.

### O deck é resolvido a cada estado, não montado uma vez

**Escolha:** `src/deckengine.js` decide, a cada atualização, quais botões
existem, quais sobem para o topo e que número cada face mostra.

Um deck de botões fixos é um controle remoto: você olha, procura, decide. O
que separa disso um instrumento são três mecanismos, todos declarativos:

| Mecanismo | Campo | Efeito |
|---|---|---|
| Visibilidade por contexto | `when` | "Aprovar" não fica morto esperando uma permissão que não veio |
| Face viva | `badge` | "Compactar" mostra o uso de contexto e fica âmbar aos 70% |
| Urgência | `urgent` | o botão que importa agora sobe para a mesma altura da mão |

Mais dois gestos, para dobrar a superfície sem dobrar os botões: **toque
longo** (`hold`) aponta para uma segunda ação, e **sequências** (`kind:
"chain"`) executam passos com pausas — é assim que "Parar tudo" manda dois
`Esc`, um para interromper e outro para limpar o que ficou digitado.

**Custo aceito:** o conjunto de botões muda sozinho, então o painel precisa
saber quando remontar a grade sem cortar um toque no meio. A saída é uma
assinatura estrutural (`id:habilitado:urgente`): só ela força remontagem; os
números da face são atualizados no lugar.

**Vocabulário deliberadamente pequeno:** as condições combinam com E lógico e
existe um único OU (`anyOf`). Ele entrou porque um caso real precisava — os
botões de decisão aparecem com permissão pendente **ou** com o portão
desligado (aí eles valem pelo fallback de teclas). Um DSL maior seria mais
poderoso e menos testável.

**Sequência de sequência é impossível por construção**, não por detecção: a
montagem recusa, e o servidor limita a profundidade a um. Ciclo não precisa
ser procurado.

### Um único catálogo de ações

`src/actions.js` é a fonte da verdade. A API expõe uma projeção que **nunca**
inclui `keys` nem `text` — o cliente só conhece o `id`. É por isso que uma
requisição forjada não escolhe o que vai ser digitado: ela só escolhe qual
botão apertar, dentro de uma lista fixa no servidor.

`deck.config.json` pode adicionar ações e sobrescrever as embutidas pelo `id`.
Ação inválida é descartada com aviso, nunca derruba o servidor.

### O parser nunca lança

`src/usage.js` roda contra arquivos escritos por outro processo. Um snapshot
pego no meio da escrita é normal, não excepcional. Toda leitura tem fallback,
todo campo é opcional, e a varredura tolerante tem guarda de profundidade.

No pior caso o medidor mostra `--`. O servidor não cai.

A escrita é atômica (temporário + `rename`), com cópia como plano B porque o
Windows recusa `rename` sobre arquivo aberto por outro processo.

### Segurança proporcional

O modelo de ameaça é honesto: **quem está na sua rede e tem o token digita no
seu terminal.**

| Camada | Impede |
|---|---|
| `allowFrom` (faixa de IP) | qualquer origem que não seja o tablet |
| Token em tempo constante | descobrir o segredo por medição de tempo |
| Limite por minuto | rajada automatizada |
| API aceita só um `id` | escolher o texto que vai para o terminal |
| `execFile` sem shell | injeção de shell |
| Sanitização de controles | sequências de escape indo para o terminal |
| Auditoria | descobrir depois que aconteceu |

**Recomendação única:** configure `allowFrom` com o IP do tablet. É a medida
que muda o resultado de um ataque real.

**Não existe** sistema de login: cerimônia demais para um painel de parede, e a
superfície real é a rede.

`/api/hook` e `/api/event` só aceitam loopback e dispensam token — quem já
executa código na sua máquina não precisa do deck para nada.

### Interface sem framework

Um HTML, um CSS, um JS. O alvo é um tablet velho, e cada quilobyte de
biblioteca é memória que falta para o canvas.

Três regras no CSS:

1. **animar só `transform` e `opacity`** — as duas que a GPU resolve sozinha;
2. **desfoque e sombra só onde carregam informação** (proximidade do limite,
   estado de alerta);
3. **tudo tem versão degradada** — `[data-lite="1"]` desliga desfoque, sombra e
   fundo animado.

O painel mede os próprios quadros. Três janelas seguidas abaixo de 26 fps e ele
liga o modo leve sozinho, salvando a escolha no aparelho. Melhor um painel
simples e fluido do que um bonito que engasga.

O protetor de tela deriva devagar pela tela: OLED de tablet velho queima imagem
parada.

### Liveness cruzada

Uma sessão está viva se o snapshot é recente **ou** se chegou evento de hook
dela há pouco. Só a idade do snapshot não serve: a statusLine roda em gatilhos,
não em intervalo, e meia hora lendo código não gera atualização nenhuma.

---

## Invariantes

Coisas que os testes protegem e que não devem ser quebradas sem pensar:

1. **O parser nunca lança.** Qualquer entrada, qualquer arquivo.
2. **Prazo esgotado não aprova.** Nunca.
3. **A API não expõe `keys` nem `text`.**
4. **Instalar no `settings.json` é idempotente e preserva configuração alheia.**
5. **Hooks do deck são assíncronos**, exceto o `PermissionRequest`.
6. **Sem alvo definido, a injeção recusa** em vez de digitar na janela em foco.
7. **Nenhuma dependência npm.**

## Testes

```bash
npm test    # 124 testes
```

| Arquivo | Cobre |
|---|---|
| `test/usage.test.js` | formatos oficial, antigo e corrompido; escalas; taxa de queima |
| `test/security.test.js` | token, CIDR, limite, sanitização, cenários adversariais |
| `test/deck.test.js` | portão, máquina de estados, `settings.json`, rotas HTTP e SSE |

Os testes de servidor sobem um servidor real em porta efêmera e falam HTTP de
verdade — sem simulação, porque o que costuma quebrar é a integração.
