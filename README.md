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
npm test                                   63 testes, sem dependências
```

## Personalizar os botões

Tudo está em [`src/actions.js`](src/actions.js), num array só. A interface se
monta a partir dele: adicionar um botão é adicionar um objeto.

Para mudar sem editar o código, coloque no `deck.config.json` (que fica fora do
git). Um `id` que já existe **substitui** o embutido:

```json
{
  "actions": [
    { "id": "adr", "label": "Gerar ADR", "group": "prompt", "tone": "neutral",
      "icon": "book", "kind": "text",
      "text": "escreva um ADR para a decisão que acabamos de tomar" },

    { "id": "allow", "keys": "2{Enter}" }
  ]
}
```

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
