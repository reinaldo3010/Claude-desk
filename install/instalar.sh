#!/usr/bin/env bash
# =============================================================================
# Claude Deck — instalação em macOS e Linux
#
# Mesmo roteiro do instalar.ps1: confere o Node, registra statusLine e hooks,
# descobre a janela alvo e grava a configuração local. Nada é irreversível —
# `node bin/claude-deck.js uninstall` desfaz o registro.
# =============================================================================
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORTA="${1:-8788}"

azul()  { printf '\033[36m%s\033[0m\n' "$*"; }
ok()    { printf '  \033[32m[ok]\033[0m %s\n' "$*"; }
aviso() { printf '  \033[33m[!]\033[0m  %s\n' "$*"; }
erro()  { printf '  \033[31m[x]\033[0m  %s\n' "$*"; }

azul ""
azul "  Claude Deck — instalação"
printf '  \033[90m%s\033[0m\n' "──────────────────────────────────────────────────────"

# --- 1. Node -----------------------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  erro "Node não encontrado. Instale a versão 18 ou superior."
  exit 1
fi
MAIOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$MAIOR" -lt 18 ]; then
  erro "Node $(node --version) encontrado; o deck precisa da 18 ou superior."
  exit 1
fi
ok "Node $(node --version)"

# --- 2. injetor de teclas ----------------------------------------------------
case "$(uname -s)" in
  Darwin)
    INJETOR="applescript"
    aviso "No macOS, o terminal precisa de permissão em Ajustes > Privacidade e Segurança > Acessibilidade."
    ;;
  Linux)
    INJETOR="xdotool"
    if command -v xdotool >/dev/null 2>&1; then
      ok "xdotool encontrado"
    else
      aviso "xdotool ausente — os botões de digitar não vão funcionar (o resto do painel funciona)."
      aviso "  Debian/Ubuntu: sudo apt install xdotool    Fedora: sudo dnf install xdotool"
    fi
    if [ "${XDG_SESSION_TYPE:-}" = "wayland" ]; then
      aviso "Sessão Wayland detectada: o xdotool não injeta teclas nela. Use uma sessão X11, ou deixe o injetor desligado e use só o portão de permissão."
    fi
    ;;
  *) INJETOR="none" ;;
esac

# --- 3. settings.json --------------------------------------------------------
ARGS=(install)
if [ "${DECK_GATE:-}" = "1" ]; then ARGS+=(--gate); fi
DECK_PORT="$PORTA" node "$RAIZ/bin/claude-deck.js" "${ARGS[@]}"

# --- 4. janela alvo ----------------------------------------------------------
azul ""
azul "  Janela do Claude Code"
if [ "$INJETOR" = "xdotool" ] && command -v xdotool >/dev/null 2>&1; then
  xdotool search --name . 2>/dev/null | head -30 | while read -r id; do
    nome="$(xdotool getwindowname "$id" 2>/dev/null || true)"
    [ -n "$nome" ] && printf '    · %s\n' "$nome"
  done | sort -u | head -12
elif [ "$INJETOR" = "applescript" ]; then
  osascript -e 'tell application "System Events" to get name of every process whose background only is false' 2>/dev/null | tr ',' '\n' | sed 's/^ */    · /' | head -15
fi

printf '  Nome (ou parte do nome) da janela do Claude Code: '
read -r ALVO || ALVO=""

# --- 5. configuração local ---------------------------------------------------
cat > "$RAIZ/deck.config.json" <<JSON
{
  "port": $PORTA,
  "injector": "$INJETOR",
  "target": "$ALVO"
}
JSON
ok "deck.config.json gravado (fora do git, é só desta máquina)"

azul ""
azul "  Pronto"
echo "  1. Reinicie o Claude Code (os hooks só valem em sessão nova)."
echo "  2. node bin/claude-deck.js doctor    confere se ficou tudo de pé"
echo "  3. node bin/claude-deck.js start     sobe o painel"
echo ""
