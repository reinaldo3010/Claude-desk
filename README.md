# Claude Deck

Transforma um tablet Android ocioso num painel de parede para o Claude Code:
quanto resta das janelas de uso, alerta quando o Claude está te esperando, e
botões grandes para decidir permissões e disparar os prompts do dia a dia.

Zero dependências npm. Node 18+. Windows, macOS e Linux.

```
┌─ seu PC ──────────────────────────────────────────────┐
│                                                       │
│  Claude Code                                          │
│   ├── statusLine ──▶ bin/deck-statusline.js           │
│   │                   └─▶ ~/.claude/deck/sessions/*.json
│   └── hooks (HTTP) ─────────────┐                     │
│                                 ▼                     │
│              deck-server (porta 8788)                 │
│               ├── SSE ──────────────────┐             │
│               └── injeção de teclas ──▶ janela do     │
│                   (AHK / xdotool /       Claude Code  │
│                    AppleScript)                       │
└─────────────────────────────────┼─────────────────────┘
                                  │ Wi-Fi local
                          ┌───────▼────────┐
                          │ tablet Android │  quiosque, paisagem
                          └────────────────┘
```

## Comece por aqui

```bash
git clone <este-repo> claude-deck && cd claude-deck

# Windows
.\install\instalar.ps1

# macOS / Linux
./install/instalar.sh
```

Depois reinicie o Claude Code e rode:

```bash
node bin/claude-deck.js doctor   # diz exatamente o que ainda falta
node bin/claude-deck.js start    # imprime a URL que o tablet deve abrir
```

O passo a passo completo, incluindo a configuração do tablet, está em
[docs/INSTALL.md](docs/INSTALL.md).

## O que ele mostra

| | |
|---|---|
| **Janela de 5 horas e semana** | percentual, quanto falta para o reset, e um arco fantasma projetando onde o consumo chega no ritmo atual |
| **Estado da sessão** | ocioso, trabalhando (com a ferramenta em uso), esperando você, ou erro — direto dos hooks, não de adivinhação |
| **Permissões** | o comando que o Claude quer rodar, classificado por risco, com botões de decidir |
| **Curva de consumo** | histórico recente e taxa de queima em pontos percentuais por hora |
| **Sessões** | uma linha por sessão do Claude Code: modelo, branch, contexto, gasto |

## De onde vêm os números

Do próprio Claude Code. Desde a v2.1.x ele entrega `rate_limits.five_hour` e
`.seven_day` no stdin do `statusLine`, junto com `context_window`, `cost`,
`prompt_cache`, modelo, branch e PR. O deck instala a própria statusLine, que
grava esses dados e ainda imprime uma barra de status decente no terminal.

Isso importa porque significa **não depender de nenhum projeto de terceiro**
nem adivinhar o formato do cache de ninguém. Quando existe uma fonte oficial,
usar qualquer outra é escolher trabalhar com dado de segunda mão.

Se a statusLine estiver fria (Claude Code fechado há horas), o deck tenta o
mesmo endpoint que alimenta o `/usage`, usando o token OAuth que já está no
disco. Esse endpoint não é documentado, então a falha dele é silenciosa por
projeto.

## Comandos

```
node bin/claude-deck.js start              sobe o servidor
node bin/claude-deck.js install [--gate]   registra statusLine e hooks
node bin/claude-deck.js uninstall          desfaz o registro
node bin/claude-deck.js doctor             diagnóstico da máquina
node bin/claude-deck.js dump               imprime o que o deck está lendo
node bin/claude-deck.js event waiting "oi" dispara um evento de teste
npm test                                   124 testes, sem dependências
```

## Comparação com o Codex Micro

Em julho de 2026 a OpenAI lançou o **Codex Micro**, um teclado físico de 13
teclas para controlar agentes, feito com a Work Louder, a US$ 230 e em edição
limitada. A ideia é a mesma deste projeto; o mapa honesto está abaixo.

| Codex Micro | Claude Deck |
|---|---|
| 6 **Agent Keys** com RGB por conversa (ocioso, pensando, esperando, pronto, erro) | ✅ **aba Agentes** — uma tecla por sessão viva, LED pelo estado daquela conversa, nomeada pelo projeto e mostrando a ferramenta em uso |
| Apertar a tecla abre aquele chat | ⚠️ **parcial** — o toque foca o painel naquela sessão; não existe atalho documentado para saltar para a sessão N no app |
| Aceitar / Recusar | ✅ e o painel mostra **o comando real** com classificação de risco antes de você decidir |
| Novo chat, enviar prompt | ✅ |
| **Joystick** → workflows (revisar PR, depurar, refatorar) | ✅ aba Prompts, com quantos você quiser |
| **Dial de raciocínio** | ✅ aba Esforço |
| **Push-to-talk** (usa o microfone do PC) | ❌ **não temos** |
| Sensor capacitivo | ❌ |
| 13 teclas fixas, US$ 230, edição limitada | ✅ ilimitadas, grátis, em qualquer tablet |
| — | ✅ **quota de 5h e semanal**, taxa de queima e projeção de esgotamento |
| — | ✅ **portão de permissão** com o comando e o risco na tela |
| — | ✅ vários painéis ao mesmo tempo, cada um focado numa sessão |

O que falta mesmo é **push-to-talk**. Não é um botão: precisa de captura de
áudio, transcrição e um caminho de volta para o app. Num painel de parede a
três metros o microfone do tablet também não é o do PC, então não é só portar
— é outro projeto. Está anotado, não escondido.

A página oficial do produto respondeu 403 daqui; a comparação foi montada a
partir da cobertura de [New Atlas](https://newatlas.com/computers/openai-codex-micro-keyboard/),
[Tom's Hardware](https://www.tomshardware.com/peripherals/keyboards/openais-first-hardware-device-is-an-rgb-macropod-codex-micro-features-13-low-profile-keys-and-a-joystick-for-controlling-ai-coding-agents)
e [Axios](https://www.axios.com/2026/07/15/openai-keyboard-codex-agents).

## App desktop ou terminal

O deck controla uma das duas superfícies, escolhida no `deck.config.json`:

```json
{ "surface": "desktop", "target": "ahk_exe Claude.exe" }
```

No **desktop** os menus abrem por acorde (`Ctrl+Shift+M` modo, `Ctrl+Shift+I`
modelo, `Ctrl+Shift+E` esforço) e cada botão manda duas teclas: abre e escolhe.
No **terminal** valem os comandos de barra. Um botão feito para uma superfície
não aparece na outra — `Shift+Tab`, por exemplo, não cicla modo de permissão
no desktop, então aquele botão some de lá.

**A quota só existe no terminal.** A `statusLine` é um elemento de terminal e o
app desktop não a executa. O estado, o modo de permissão e o nível de esforço
continuam funcionando nos dois, porque vêm dos hooks — que carregam
`permission_mode` e `effort.level` em todo evento. Sem quota, os medidores
encolhem sozinhos e o espaço vai para os botões.

## O deck

Não é um controle remoto de botões fixos. O conjunto muda conforme o que está
acontecendo:

- **Aparece quando serve.** "Aprovar" só existe quando há permissão pendente.
  "Retomar" só aparece quando a quota passou de 90%.
- **A face mostra o dado.** "Compactar" traz o uso de contexto e fica âmbar aos
  70%, vermelho aos 85. "Interromper" vira cronômetro enquanto o Claude
  trabalha. "Custo" mostra o gasto da sessão.
- **O urgente sobe.** O botão que importa agora vai para o topo, na mesma
  altura da mão.
- **Toque longo é a segunda função.** Segure "Interromper" para "Parar tudo"
  (dois `Esc`); segure "Compactar" para `/clear`.
- **Abas por superfície**: no terminal Controle, Prompts, Sessão, Modelo e Esforço; no desktop Controle, Prompts, Modo, Modelo e Esforço. A aba avisa com
  um ponto quando tem algo lá dentro — azul para destaque, vermelho pulsante
  para decisão.
- **A opção em uso acende.** Nas abas Modelo e Esforço os botões formam um
  seletor: o modelo e o nível ativos ficam iluminados, com um ponto no canto.

### Modelo e esforço em um toque

| Aba | Botões |
|---|---|
| **Modelo** | Opus · Sonnet · Haiku · Fable · Melhor · Opus + plano · Opus 1M · Padrão |
| **Esforço** | Baixo · Médio · Alto · Extra (xhigh) · Máximo · Ultracode · Auto · Turbo (`/fast`) |

Os comandos são `/model <apelido>` e `/effort <nível>`, que aceitam argumento
em linha. Os apelidos e níveis vêm da documentação do Claude Code e estão
travados por teste — um apelido inventado viraria um comando inválido
silencioso no seu terminal.

**Duas limitações honestas**, ambas por causa do que a statusLine informa:

- Ela entrega o modelo **resolvido**, não o apelido digitado. Então `opus`,
  `opus[1m]` e `opusplan` chegam indistinguíveis, e só a **família** acende.
  Os três botões funcionam; apenas "Opus" mostra o indicador.
- `ultracode` é reportado como `xhigh` (documentado). O botão que acende é
  "Extra", e o rótulo do Ultracode diz `xhigh + orquestração` para deixar
  claro por quê.

### Personalizar

Tudo está em [`src/actions.js`](src/actions.js), num array só. Para mudar sem
editar código, use o `deck.config.json` (fora do git). Um `id` que já existe
**substitui** o embutido:

```json
{
  "actions": [
    { "id": "adr", "label": "Gerar ADR", "page": "prompts", "group": "prompt",
      "icon": "book", "kind": "text",
      "text": "escreva um ADR para a decisão que acabamos de tomar" },

    { "id": "deploy", "label": "Publicar", "page": "sessao", "tone": "warn",
      "icon": "power", "kind": "text", "text": "faça o deploy", "confirm": true,
      "when":   { "status": ["idle"] },
      "urgent": { "status": ["idle"] },
      "badge":  { "source": "cost", "format": "usd" } },

    { "id": "allow", "keys": "2{Enter}" }
  ]
}
```

| Campo | Para quê |
|---|---|
| `when` | quando o botão existe — `status`, `gate`, `contextAbove`, `fiveAbove`, `sessionsAtLeast`, `anyOf` |
| `urgent` | quando ele sobe para o topo (mesmo vocabulário) |
| `badge` | número na face — `source` (`context`, `five`, `cost`, `elapsed`, `sessions`…), `format`, `warnAbove`, `critAbove` |
| `hold` | id da ação disparada por toque longo |
| `kind: "chain"` | `steps: [{ "action": "id" }, { "wait": 300 }]` |
| `confirm` | exige toque duplo |
| `secondary` | não vira botão próprio: só existe como destino de `hold` |

Referência quebrada não derruba o painel: um `hold` para o nada é desarmado
com aviso, e uma sequência inválida é descartada.

## Segurança, sem enrolação

Quem estiver na sua rede e souber o token digita no seu terminal. Isso não
some com mais criptografia. O que reduz o dano de verdade:

```bash
DECK_ALLOW_FROM="192.168.0.42"   # só o IP do tablet
```

Leva um minuto, e é a única medida aqui que muda o resultado de um ataque
real. As outras camadas — token comparado em tempo constante, limite de ações
por minuto, log de auditoria — são o que sobra quando essa falha.
Detalhes e o raciocínio completo em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Documentação

- [docs/INSTALL.md](docs/INSTALL.md) — instalação passo a passo, tablet incluído
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — decisões de projeto e por quê
- [docs/LESSONS.md](docs/LESSONS.md) — o que estava errado no esqueleto e o que quebra numa atualização

## Licença

MIT.
