"use strict";
/**
 * Injeção de teclas na janela do Claude Code.
 *
 * É o caminho de MENOR confiança do projeto e por isso está isolado aqui.
 * Digitar às cegas numa janela é impreciso: se o alvo estiver errado, o texto
 * vai parar em outro lugar. Por isso:
 *   - o alvo é obrigatório (sem alvo, recusa em vez de digitar no que estiver em foco);
 *   - todo comando roda por execFile, sem shell — não existe injeção de shell;
 *   - o texto é limitado em tamanho e sanitizado de caracteres de controle.
 *
 * Aprovar/recusar permissões NÃO deveria passar por aqui: para isso existe o
 * portão de permissão (src/gate.js), que devolve uma decisão explícita ao
 * Claude Code. Teclas ficam para o que não tem hook: prompts, Esc, /compact.
 */

const { execFile } = require("child_process");
const fs = require("fs");

const MAX_TEXT = 2000;

/** Remove controles que nenhum terminal deveria receber de um botão. */
function sanitizeText(text) {
  return String(text ?? "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .slice(0, MAX_TEXT);
}

/** Teclas cruas aceitas: {Enter}, {Esc}, +{Tab}, ^c, dígitos, letras. */
const KEYS_RE = /^[A-Za-z0-9 +^!#{}\-_.,;:/\\]*$/;
function validateKeys(keys) {
  const s = String(keys ?? "");
  if (!s) return "sequência de teclas vazia";
  if (s.length > 120) return "sequência de teclas longa demais";
  if (!KEYS_RE.test(s)) return "sequência de teclas com caracteres não permitidos";
  return null;
}

/**
 * Gramática das teclas, no dialeto do AutoHotkey:
 *   modificador opcional (+ shift, ^ ctrl, ! alt, # win)
 *   seguido de {NomeDaTecla} ou de um único caractere.
 * O modificador vem ANTES do grupo entre chaves — foi por não tratar isso
 * que "+{Tab}" já foi lido como shift+"{" mais as letras T, a, b.
 */
const KEY_TOKEN_RE = /(\+|\^|!|#)?(?:\{([^}]+)\}|(.))/g;

const NAMED_KEYS_X11 = {
  enter: "Return", return: "Return", esc: "Escape", escape: "Escape", tab: "Tab",
  space: "space", backspace: "BackSpace", bs: "BackSpace", del: "Delete", delete: "Delete",
  up: "Up", down: "Down", left: "Left", right: "Right",
  home: "Home", end: "End", pgup: "Prior", pgdn: "Next",
};

/** Converte a notação do AutoHotkey para o vocabulário do xdotool. */
function keysToXdotool(keys) {
  const out = [];
  const mods = { "+": "shift+", "^": "ctrl+", "!": "alt+", "#": "super+" };
  KEY_TOKEN_RE.lastIndex = 0;
  let m;
  while ((m = KEY_TOKEN_RE.exec(keys)) !== null) {
    const prefix = mods[m[1]] || "";
    if (m[2] != null) {
      const name = m[2].toLowerCase();
      out.push(prefix + (NAMED_KEYS_X11[name] || m[2]));
    } else if (m[3] != null && m[3] !== "") {
      out.push(prefix + m[3]);
    }
  }
  return out;
}

const NAMED_KEYS_MAC = {
  enter: 36, return: 36, esc: 53, escape: 53, tab: 48, space: 49,
  backspace: 51, bs: 51, delete: 117, del: 117,
  up: 126, down: 125, left: 123, right: 124, home: 115, end: 119,
};

/** Converte a notação do AutoHotkey para System Events do macOS. */
function keysToAppleScript(keys) {
  const cmds = [];
  KEY_TOKEN_RE.lastIndex = 0;
  let m;
  while ((m = KEY_TOKEN_RE.exec(keys)) !== null) {
    const mods = [];
    if (m[1] === "+") mods.push("shift down");
    if (m[1] === "^") mods.push("control down");
    if (m[1] === "!") mods.push("option down");
    if (m[1] === "#") mods.push("command down");
    const using = mods.length ? ` using {${mods.join(", ")}}` : "";

    if (m[2] != null) {
      const code = NAMED_KEYS_MAC[m[2].toLowerCase()];
      if (code != null) cmds.push(`key code ${code}${using}`);
    } else if (m[3] != null && m[3] !== "") {
      const ch = m[3].replace(/["\\]/g, "\\$&");
      cmds.push(`keystroke "${ch}"${using}`);
    }
  }
  return cmds;
}

/** Monta o comando concreto para a plataforma escolhida. */
function buildCommand(cfg, mode, payload) {
  const target = String(cfg.target || "").trim();

  switch (cfg.injector) {
    case "ahk": {
      if (!fs.existsSync(cfg.ahkExe)) {
        return { error: `AutoHotkey não encontrado em ${cfg.ahkExe} — instale a v2 ou ajuste AHK_EXE` };
      }
      if (!fs.existsSync(cfg.ahkScript)) {
        return { error: `script AHK ausente: ${cfg.ahkScript}` };
      }
      if (!target) return { error: "DECK_TARGET vazio — rode `claude-deck doctor` para descobrir a janela" };
      return { cmd: cfg.ahkExe, args: [cfg.ahkScript, mode, target, payload] };
    }

    case "xdotool": {
      if (!target) return { error: "DECK_TARGET vazio — informe o nome ou classe da janela" };
      // search --name devolve os ids; windowactivate --sync garante o foco antes de digitar.
      const base = ["search", "--name", target, "windowactivate", "--sync"];
      const tail = mode === "keys"
        ? ["key", "--clearmodifiers", ...keysToXdotool(payload)]
        : ["type", "--clearmodifiers", "--delay", "12", payload];
      const post = mode === "text" ? ["key", "--clearmodifiers", "Return"] : [];
      return { cmd: "xdotool", args: [...base, ...tail, ...post] };
    }

    case "applescript": {
      if (!target) return { error: "DECK_TARGET vazio — informe o nome do app (ex.: iTerm2)" };
      const app = target.replace(/"/g, '\\"');
      const body = mode === "keys"
        ? keysToAppleScript(payload).join("\n    ")
        : `keystroke "${payload.replace(/["\\]/g, "\\$&")}"\n    key code 36`;
      const script = `tell application "${app}" to activate\ndelay 0.12\ntell application "System Events"\n    ${body}\nend tell`;
      return { cmd: "osascript", args: ["-e", script] };
    }

    case "dry":
      // Simulação: usada nos testes e no `doctor`. Não toca em nada.
      return { cmd: "(simulado)", args: [mode, target || "(sem alvo)", payload], dry: true };

    case "none":
      return { error: "injeção de teclas desligada (injector=none)" };

    default:
      return { error: `injector desconhecido: ${cfg.injector}` };
  }
}

/**
 * Executa a ação. Devolve Promise que resolve com {ok, detail} ou rejeita
 * com Error legível — a UI mostra a mensagem crua para você entender o que houve.
 */
function inject(cfg, action) {
  return new Promise((resolve, reject) => {
    let mode;
    let payload;

    if (action.kind === "text") {
      mode = "text";
      payload = sanitizeText(action.text);
      if (!payload) return reject(new Error("texto vazio depois da sanitização"));
    } else {
      mode = "keys";
      payload = String(action.keys ?? "");
      const bad = validateKeys(payload);
      if (bad) return reject(new Error(bad));
    }

    const built = buildCommand(cfg, mode, payload);
    if (built.error) return reject(new Error(built.error));

    if (built.dry || process.env.DECK_DRY_RUN) {
      return resolve({ ok: true, detail: `simulado: ${built.args.join(" ")}` });
    }

    execFile(built.cmd, built.args, { timeout: cfg.injectTimeoutMs, windowsHide: true }, (err, stdout, stderr) => {
      if (err) {
        if (err.code === "ENOENT") {
          return reject(new Error(`comando não encontrado: ${built.cmd}`));
        }
        if (err.killed) return reject(new Error("injeção estourou o tempo limite"));
        const detail = String(stderr || stdout || err.message).trim().slice(0, 300);
        return reject(new Error(detail || "falha na injeção"));
      }
      resolve({ ok: true, detail: String(stdout || "").trim().slice(0, 300) });
    });
  });
}

module.exports = { inject, buildCommand, sanitizeText, validateKeys, keysToXdotool, keysToAppleScript };
