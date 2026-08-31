# Claude Deck

Painel de parede para controlar o Claude Code de um tablet Android ocioso.
Node puro, sem build, sem framework. O usuário fala **português**.

## Regras deste projeto

Não são preferências, são restrições. Quebrar qualquer uma destas é retrabalho.

1. **Zero dependências npm.** Só módulos nativos do Node. Se algo exigir
   pacote, **proponha a alternativa antes de instalar** — não instale e avise
   depois.
2. **Comentários, logs e interface em português.** Código (identificadores,
   nomes de arquivo) em inglês.
3. **Nunca modifique nada dentro de `claude-codex-usage-dashboard/`**, se
   existir ao lado. O deck roda junto e precisa sobreviver a um `git pull`
   deles.
4. **Não versione** `.deck-token`, `usage-cache.json`, `settings.json`,
   `deck.config.json`.
5. **Ao testar o botão de aprovar, use ação inofensiva** — um `ls`, uma
   leitura de arquivo. **Nunca** algo que escreva em disco ou rode `git`. Um
   deck que aprova errado é pior do que não ter deck. Para testar sem risco
   nenhum, use `node bin/claude-deck.js demo` (ver abaixo).
6. **Diga quando o usuário estiver errado.** Se uma decisão for ruim, proponha
   a troca com o motivo — não implemente contornando em silêncio. Não entregue
   três alternativas equivalentes: escolha e defenda.
7. **Commits pequenos, um por fase.**

## Comandos

```bash
npm test                              # 131 testes, sem dependências
node bin/claude-deck.js demo          # preview com dados simulados (ver abaixo)
node bin/claude-deck.js doctor        # diagnóstico da máquina
node bin/claude-deck.js start         # sobe o servidor de verdade
node bin/claude-deck.js install       # registra statusLine e hooks
node bin/claude-deck.js uninstall     # desfaz
```

### O modo demo é o caminho para testar

`demo` sobe o painel com dados vivos sintéticos entrando pelo **mesmo caminho
de código** que o Claude Code real usa (snapshots no formato da statusLine,
eventos via `store.ingest`). Duas garantias que o tornam seguro:

- não toca no `~/.claude/settings.json` e não precisa de hook instalado;
- o injetor é forçado para `dry` — **nenhuma tecla sai do processo**.

Por isso o botão "Aprovar" é seguro ali: não há Claude Code atrás dele. É a
única forma de exercitar o portão de permissão sem apostar numa aprovação real.

## Verificado × suposto

Esta seção existe porque já custou caro. **Não trate suposição como fato, e
não apague estas marcas sem verificar.**

### Verificado na documentação oficial

- **Hooks disparam em todas as superfícies**, app desktop incluído. Citação:
  *"Claude Code fires the same hook events wherever it runs: sessions in the
  terminal, IDE extensions, the Desktop app, and Claude Code on the web."*
- **`~/.claude/settings.json` é compartilhado** entre CLI e app desktop, e
  hooks definidos nele valem para os dois.
- **`rate_limits`** existe só para assinantes Pro/Max (ou com gateway de
  spend limit) e **só depois da primeira resposta da API na sessão**.
- **Não existe campo de branch na statusLine.** `worktree.branch` só aparece
  em sessão de worktree; `workspace.git_worktree` é *nome de worktree* e está
  ausente na árvore principal. A nossa statusLine resolve o branch chamando
  `git branch --show-current`, como os próprios exemplos da doc fazem, e grava
  em `deck.branch` — separado do `payload`, que espelha só o que o Claude Code
  entregou.
- Apelidos de `/model`: `default|best|fable|opus|sonnet|haiku|sonnet[1m]|opus[1m]|opusplan`.
  Níveis de `/effort`: `low|medium|high|xhigh|max|ultracode|auto|status`.
  Ultracode é reportado como `xhigh`. Travado por teste.

### Não sabido (≠ sabido que não funciona)

- **A statusLine roda no app desktop?** A documentação não diz nem que sim nem
  que não: ela é descrita como barra no rodapé do terminal, mas **não aparece**
  na lista de "what's not available in Desktop". Consequência prática: a quota
  pode ou não aparecer no desktop. `doctor` responde na máquina em segundos.
  Se não vier, o plano B é o endpoint do `/usage` via token OAuth em disco —
  **não documentado**, pode quebrar sem aviso.

### Lido de fotos da tela, não de documentação

- **A numeração dos menus do app desktop** (`Modo` 1–5, `Modelos` 1–4) está
  isolada na tabela `DESKTOP` em `src/actions.js`, com aviso no código. Precisa
  de confirmação abrindo cada menu uma vez.
- `Ctrl+Shift+E` abre um **slider**, não lista numerada — por isso existe só
  um botão "abrir o menu de esforço", e não cinco. Se `1`–`9` funcionar no
  slider, aí dá para virar cinco botões.

### Não verificado em execução

- **O aperto de mão do portão de permissão com o Claude Code real.** Por isso
  ele é **desligado por padrão** (`gateHoldMs: 0`) e só entra com
  `install --gate`. Modo de falha escolhido: prazo esgotado devolve "sem
  decisão" e o terminal pergunta. **Silêncio nunca vira aprovação.**

## Arquitetura em uma tela

```
Claude Code
  ├── statusLine ──▶ bin/deck-statusline.js ──▶ ~/.claude/deck/sessions/*.json
  └── hooks HTTP ──▶ POST /api/hook ──▶ src/store.js  (estado)
                                    └─▶ src/gate.js   (portão)
                                            │
                     src/server.js ─── SSE ─┴─▶ tablet
                                  └── POST /api/action ──▶ src/inject.js ──▶ janela
```

| Arquivo | Papel |
|---|---|
| `src/actions.js` | **catálogo único** de botões; a interface se monta dele |
| `src/deckengine.js` | resolve o deck por estado: visibilidade, urgência, face |
| `src/store.js` | eventos de hook → estado do painel |
| `src/usage.js` | normaliza snapshots; histórico e taxa de queima. **Nunca lança** |
| `src/demo.js` | roteiro do modo demo |
| `public/deck.js` | painel: marca animada, medidores, fundo em shader |

Decisões e o porquê de cada uma: **`docs/ARCHITECTURE.md`**. Leia antes de
mexer — várias escolhas parecem arbitrárias até você saber o que evitam.

## Invariantes protegidas por teste

1. O parser nunca lança, com qualquer entrada.
2. Prazo esgotado não aprova. Nunca.
3. A API não expõe `keys` nem `text` — o cliente só conhece o `id`.
4. Instalar no `settings.json` é idempotente e preserva o que era de outros.
5. Hooks do deck são assíncronos, exceto `PermissionRequest`.
6. Sem alvo definido, a injeção recusa em vez de digitar na janela em foco.
7. Nenhuma dependência npm.
8. A laranja do Claude é o único acento; o alerta se separa dela pela saturação.
9. O `icon.svg` é a mesma geometria que `marcaClaude()` desenha.

## Interface: três regras no CSS

0. A identidade mora na paleta e na marca, **não** no fundo animado — o fundo é
   o primeiro a morrer no aparelho fraco.
1. Animar só `transform` e `opacity`.
2. Desfoque e sombra só onde carregam informação.
3. Tudo tem versão degradada: `[data-lite="1"]`.

## Pendências que dependem da máquina do usuário

1. Rodar `doctor` e descobrir se a quota aparece no app desktop.
2. Confirmar a numeração dos menus do desktop (abrir cada um uma vez).
3. Testar se `1`–`9` funciona no slider de `Ctrl+Shift+E`.
4. Testar o portão de permissão ponta a ponta — **com um `ls`**.
5. Push-to-talk continua não implementado (é o único item do Codex Micro que
   falta). Precisa de captura de áudio, transcrição e caminho de volta.
