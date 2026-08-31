# Instalação

Do zero até o painel na parede. Reserve uns 20 minutos na primeira vez.

Pré-requisitos: **Node 18+**, Claude Code **v2.1 ou mais novo** (é a versão que
entrega `rate_limits` na statusLine) e um tablet na mesma rede Wi-Fi.

---

## 1. Baixar e instalar

```bash
git clone <este-repo> claude-deck
cd claude-deck
```

**Windows** (PowerShell, na pasta do projeto):

```powershell
.\install\instalar.ps1
```

**macOS / Linux**:

```bash
./install/instalar.sh
```

O instalador:

1. confere a versão do Node;
2. registra a statusLine e os hooks no `~/.claude/settings.json`, **fazendo
   backup datado antes** e preservando o que já estava lá;
3. lista as janelas abertas para você escolher o alvo;
4. grava um `deck.config.json` local (que não vai para o git);
5. no Windows, libera a porta no firewall apenas no perfil de rede *Privada*.

Nada disso é irreversível. `node bin/claude-deck.js uninstall` desfaz o passo 2
e deixa intactos os hooks de outras ferramentas.

> **Se você já tinha uma statusLine**, ela é substituída (a antiga fica no
> backup). É necessário: é a statusLine que produz os dados do painel. Se
> preferir manter a sua, veja "Manter a statusLine que eu já tinha", no fim.

## 2. Reiniciar o Claude Code

Feche **por completo** e abra de novo. Hooks e statusLine só entram em sessão
nova. Mande uma mensagem qualquer — é o que gera o primeiro snapshot.

## 3. Conferir

```bash
node bin/claude-deck.js doctor
```

Ele diz exatamente o que está de pé e o que falta, com o comando para corrigir
cada pendência. Saída esperada quando está tudo certo:

```
  ✓ Node 22.22.2
  ✓ statusLine é a do deck
  ✓ hooks do deck: 17 eventos
  ✓ 1 sessão(ões) com snapshot
  ✓ limites lidos (fonte: statusline)  5h 23.5%  7d 41.2%
```

**Se aparecer `snapshot sem rate_limits`:** o campo só existe para assinantes
Pro e Max, e só depois da primeira resposta da API na sessão. Com API avulsa
(pay-as-you-go) o painel mostra contexto, custo e estado, mas não a quota —
não há o que consertar, o dado não existe.

## 4. Subir

```bash
node bin/claude-deck.js start
```

```
  Claude Deck no ar
  ──────────────────────────────────────────
  local    http://localhost:8788/?t=xK3n…
  tablet   http://192.168.0.14:8788/?t=xK3n…
```

Abra a URL **local** no PC e teste os botões com o Claude Code aberto.

> **Teste o botão de aprovar com uma ação inofensiva.** Peça ao Claude para
> rodar um `ls` ou ler um arquivo, e aprove pelo deck. Nunca teste com algo
> que escreva em disco ou rode `git`. Um deck que aprova errado é pior do que
> não ter deck.

## 4b. App desktop ou terminal?

O deck controla uma das duas superfícies, e elas **não** compartilham
mecanismo. Escolha no `deck.config.json`:

```json
{ "surface": "desktop", "target": "ahk_exe Claude.exe" }
```

| | Terminal (CLI) | App desktop |
|---|---|---|
| Trocar modelo | `/model opus` digitado | `Ctrl+Shift+I` e depois um número |
| Trocar esforço | `/effort xhigh` digitado | `Ctrl+Shift+E` abre um controle deslizante |
| Modo de permissão | `Shift+Tab` cicla | `Ctrl+Shift+M` e depois um número |
| Quota (5h e semana) | ✅ pela statusLine | ❌ ver abaixo |
| Estado, modo e esforço | ✅ | ✅ pelos hooks |

Isso está documentado: os atalhos do modo interativo do terminal, incluindo
`Shift+Tab`, **não valem no app desktop**. Por isso o botão "Modo plano" nem
aparece quando `surface` é `desktop` — seria um clique que não faz nada.

### O que muda de verdade no desktop

**A quota some.** A `statusLine` é um elemento de terminal; o app desktop tem
a própria barra de status e não executa comando nenhum para montá-la. Sem ela
não há `rate_limits`, `context_window` nem `cost` — os medidores encolhem
sozinhos e o espaço vai para os botões.

**O resto continua.** Os hooks funcionam nas duas superfícies (a documentação
diz que `settings.json` é compartilhado), e **todo payload de hook carrega
`permission_mode` e `effort.level`**. É daí que o painel sabe o estado, o modo
e o nível para acender o botão certo, sem statusLine nenhuma.

> **Duas coisas que eu não pude verificar daqui** e que você confirma em um
> minuto na sua máquina:
>
> 1. **A numeração dos menus.** Ela está numa tabela única no topo de
>    `src/actions.js` (`DESKTOP`), e foi lida de fotos da sua tela — não de
>    documentação. A posição de um item muda se a lista mudar: "Ignorar
>    permissões" só aparece depois de habilitada nas configurações, e sem ela
>    os itens seguintes sobem uma casa. Abra o menu uma vez, confira, ajuste
>    ali.
> 2. **O esforço.** `Ctrl+Shift+E` abre um controle deslizante, não uma lista
>    numerada. Não dá para mapear número em posição a partir de uma foto, então
>    existe só um botão que abre o menu. Se `1`–`9` funcionar lá, me diga qual
>    número dá qual nível e viram cinco botões.

## 5. Descobrir a janela alvo

O deck precisa saber onde digitar. O `doctor` lista as janelas abertas.

| Terminal | `DECK_TARGET` |
|---|---|
| **App desktop do Claude** | `ahk_exe Claude.exe` |
| Windows Terminal | `ahk_exe WindowsTerminal.exe` |
| PowerShell clássico | `ahk_exe powershell.exe` |
| VS Code (terminal integrado) | `ahk_exe Code.exe` |
| WezTerm / Alacritty | `ahk_exe wezterm-gui.exe` / `ahk_exe alacritty.exe` |
| macOS | nome do app: `Terminal`, `iTerm2`, `Ghostty` |
| Linux (X11) | parte do título da janela |

Grave no `deck.config.json`:

```json
{ "port": 8788, "target": "ahk_exe WindowsTerminal.exe" }
```

**Com várias abas no Windows Terminal**, o alvo acerta a janela mas não escolhe
a aba. Deixe o Claude Code na aba ativa, ou use uma janela dedicada.

**No Linux com Wayland**, o `xdotool` não injeta teclas. Ou use uma sessão X11,
ou deixe `"injector": "none"` e use apenas o portão de permissão (passo 7),
que não depende de digitar.

**No macOS**, dê permissão de Acessibilidade ao terminal em
*Ajustes do Sistema › Privacidade e Segurança › Acessibilidade*.

## 6. O tablet

Instale o **Fully Kiosk Browser** (ou o **WallPanel**, open source):

| Opção | Valor |
|---|---|
| Start URL | a URL "tablet" que o servidor imprimiu, **com o `?t=`** |
| Keep Screen On | ligado |
| Screen Orientation | Landscape |
| Fullscreen / Immersive | ligado |
| Auto Reload on Idle | **0** — o painel se atualiza sozinho por SSE |
| Screensaver do Fully | desligado — o painel tem o próprio, que escurece e deriva para não queimar a tela |

Se o painel estiver engasgando, ele detecta sozinho e liga o modo leve. Para
forçar, acrescente `&lite=1` na URL. Para forçar o contrário, `&lite=0`.

### Fixe o IP do tablet

No roteador, reserve um IP para o tablet. Serve para o passo seguinte.

## 7. Fechar a porta

Por padrão qualquer um na sua rede que tenha o token consegue acionar os
botões. Restrinja à origem do tablet:

```bash
# deck.config.json
{ "allowFrom": "192.168.0.42" }
```

Aceita CIDR (`192.168.0.0/24`), lista separada por vírgula e `loopback`.
Isso é a defesa que muda o resultado de um ataque real — as outras camadas
são o que sobra quando esta falha.

## 8. Portão de permissão (opcional, experimental)

Por padrão os botões "Aprovar" e "Recusar" **digitam teclas** na janela do
terminal — o mesmo mecanismo do esqueleto original, com a mesma fragilidade:
a numeração do prompt de permissão pode mudar entre versões.

O portão resolve isso de verdade. O hook `PermissionRequest` faz um POST no
deck e **espera a resposta**; o seu toque no tablet vira o corpo dessa
resposta, uma decisão explícita, sem digitar número nenhum. E o painel mostra o
comando exato antes de você decidir.

```bash
node bin/claude-deck.js install --gate
```

```json
{ "gateHoldMs": 90000 }
```

**Está marcado como experimental porque:**

- segurar a resposta do hook atrasa o prompt do terminal pelo tempo da espera;
- a grafia exata da decisão aceita pode variar entre versões do Claude Code
  (o deck envia as duas formas documentadas para maximizar a chance);
- não conseguimos verificar isso ponta a ponta sem uma sessão real do Claude
  Code na sua máquina. **Esse teste é seu, e vale fazer com um `ls`.**

O modo de falha é seguro por construção: se ninguém responder até o prazo, o
portão devolve "sem decisão" e o Claude Code cai no prompt normal do terminal.
Silêncio nunca vira aprovação.

O botão **Sempre** não passa pelo portão — não existe decisão de hook para
"não perguntar mais". Ele continua usando teclas.

## 9. Iniciar junto com o sistema

**Windows** — o instalador cria o atalho se você passar `-Inicializar`, ou
manualmente: `Win+R` → `shell:startup` → atalho para

```
powershell -WindowStyle Hidden -NoProfile -Command "cd C:\claude-deck; node bin\claude-deck.js start"
```

**macOS** — `~/Library/LaunchAgents/com.claudedeck.plist` com `RunAtLoad`.

**Linux** — serviço de usuário do systemd:

```ini
# ~/.config/systemd/user/claude-deck.service
[Unit]
Description=Claude Deck
[Service]
ExecStart=/usr/bin/node %h/claude-deck/bin/claude-deck.js start
Restart=on-failure
[Install]
WantedBy=default.target
```

```bash
systemctl --user enable --now claude-deck
```

---

## Quando algo dá errado

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Medidores em `--` | statusLine não instalada, ou nenhuma mensagem enviada ainda | `doctor`; reinicie o Claude Code e mande uma mensagem |
| `snapshot sem rate_limits` | plano sem quota (API avulsa) ou primeira resposta ainda não aconteceu | nada a fazer se for API avulsa |
| Painel diz "Sem contato com o deck" | servidor caiu, PC dormiu, ou IP mudou | reveja o IP; considere reserva de DHCP |
| Botões respondem "comando não encontrado" | AutoHotkey/xdotool ausente | instale, ou use só o portão |
| Botões respondem "janela não encontrada" | `DECK_TARGET` errado | `doctor` lista as janelas abertas |
| `401 token inválido` | URL do quiosque sem `?t=` | reabra pela URL que o servidor imprimiu |
| `403 origem fora da faixa` | `allowFrom` não bate com o IP do tablet | confira o IP atual do tablet |
| `429 muitas ações` | limite por minuto | é proposital; espere um minuto |
| Porta ocupada | outro deck rodando | `DECK_PORT=8789 node bin/claude-deck.js start` |
| Animações travando | tablet fraco | ele liga o modo leve sozinho; force com `&lite=1` |

Para ver o que o deck está lendo neste instante:

```bash
node bin/claude-deck.js dump
```

## Manter a statusLine que eu já tinha

Sem a statusLine do deck não há dados de uso. Se a sua for indispensável, a
saída é encadear: faça a sua chamar a nossa e usar a saída dela. A nossa lê o
stdin, grava o snapshot e imprime a linha — então basta repassar o mesmo stdin.

## Variáveis de ambiente

Toda opção do `deck.config.json` tem um equivalente em variável, e a variável
vence. Úteis no dia a dia:

| Variável | Padrão | Para quê |
|---|---|---|
| `DECK_PORT` | `8788` | porta |
| `DECK_HOST` | `0.0.0.0` | `127.0.0.1` tranca em local |
| `DECK_TARGET` | por plataforma | janela alvo |
| `DECK_ALLOW_FROM` | vazio | faixa de IPs autorizada |
| `DECK_TOKEN` | gerado | fixar um token seu |
| `DECK_INJECTOR` | por plataforma | `ahk`, `xdotool`, `applescript`, `none`, `dry` |
| `DECK_GATE_HOLD` | `0` | ms que o portão espera (0 desliga) |
| `ALERT_PERCENT` | `85` | quando o medidor fica vermelho |
| `WARN_PERCENT` | `60` | quando fica amarelo |
| `DECK_SCREENSAVER` | `12` | minutos até o protetor de tela (0 desliga) |
| `DECK_RATE_LIMIT` | `60` | ações por minuto por IP |
| `DECK_STATE_DIR` | `~/.claude/deck` | onde ficam snapshots e auditoria |
| `DECK_DEBUG` | vazio | imprime pilha de erro na statusLine |
