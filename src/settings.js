"use strict";
/**
 * Escrita segura no ~/.claude/settings.json.
 *
 * Regras que não se negociam:
 *   - sempre faz backup datado antes de tocar no arquivo;
 *   - MESCLA em vez de sobrescrever: hooks de outras ferramentas continuam lá;
 *   - é idempotente: rodar duas vezes não duplica nada;
 *   - se o JSON atual estiver corrompido, recusa e explica em vez de zerar.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

const MARK = "claude-deck";

function settingsPath() {
  return process.env.CLAUDE_SETTINGS || path.join(os.homedir(), ".claude", "settings.json");
}

/** Eventos que o deck escuta e o que cada um entrega ao painel. */
const HOOK_EVENTS = [
  "SessionStart",
  "SessionEnd",
  "UserPromptSubmit",
  "PreToolUse",
  "PostToolUse",
  "PostToolUseFailure",
  "PermissionDenied",
  "Notification",
  "Stop",
  "StopFailure",
  "SubagentStart",
  "SubagentStop",
  "PreCompact",
  "PostCompact",
  "TaskCreated",
  "TaskCompleted",
  "PostModelSwitch",
];

/**
 * Monta a entrada de hook para um evento.
 *
 * `async: true` é o detalhe que impede o deck de atrapalhar o Claude Code:
 * hooks assíncronos não esperam resposta e não entram na conta do timeout.
 * Com o deck desligado, o POST falha na hora e ninguém percebe.
 *
 * A exceção é PermissionRequest: ali a resposta É a decisão, então precisa ser
 * síncrono — e por isso só entra quando o portão está ligado.
 */
function hookEntry(url, { async: isAsync = true, timeout = 5 } = {}) {
  return {
    hooks: [
      {
        type: "http",
        url,
        timeout,
        ...(isAsync ? { async: true } : {}),
        [MARK]: true,
      },
    ],
  };
}

/** Remove entradas anteriores do deck para a instalação ser idempotente. */
function stripOurs(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((group) => {
      if (!group || !Array.isArray(group.hooks)) return group;
      const kept = group.hooks.filter((h) => !(h && h[MARK]));
      return kept.length ? { ...group, hooks: kept } : null;
    })
    .filter(Boolean);
}

/**
 * Constrói o objeto de configuração do deck.
 * @param {object} opts
 * @param {string} opts.baseUrl     ex.: http://127.0.0.1:8788
 * @param {string} opts.statuslinePath  caminho do bin/deck-statusline.js
 * @param {boolean} opts.gate       instalar o hook PermissionRequest
 * @param {number} opts.gateTimeout segundos que o hook do portão pode esperar
 */
function buildConfig({ baseUrl, statuslinePath, gate = false, gateTimeout = 120 }) {
  const hooks = {};
  for (const ev of HOOK_EVENTS) {
    hooks[ev] = [hookEntry(`${baseUrl}/api/hook`)];
  }
  if (gate) {
    // Síncrono de propósito: a resposta carrega a decisão de permissão.
    hooks.PermissionRequest = [hookEntry(`${baseUrl}/api/hook`, { async: false, timeout: gateTimeout })];
  }

  return {
    statusLine: {
      type: "command",
      command: `node "${statuslinePath}"`,
      padding: 0,
      [MARK]: true,
    },
    hooks,
  };
}

/**
 * Aplica a configuração no settings.json.
 * @returns {{path:string, backup:string|null, added:string[], replacedStatusLine:boolean}}
 */
function install(config, { dryRun = false, keepStatusLine = false } = {}) {
  const file = settingsPath();
  let current = {};
  let existed = false;

  if (fs.existsSync(file)) {
    existed = true;
    const raw = fs.readFileSync(file, "utf8");
    if (raw.trim()) {
      try {
        current = JSON.parse(raw);
      } catch (err) {
        throw new Error(
          `${file} não é JSON válido (${err.message}). Conserte ou renomeie o arquivo antes de instalar — não vou sobrescrever suas configurações.`
        );
      }
    }
  }

  const backup = existed && !dryRun ? `${file}.bak-${new Date().toISOString().replace(/[:.]/g, "-")}` : null;
  if (backup) fs.copyFileSync(file, backup);

  const next = { ...current };
  const added = [];

  // statusLine: só troca se for nossa ou se não existir nenhuma.
  const cur = current.statusLine;
  const ours = cur && cur[MARK];
  const replacedStatusLine = !!(cur && !ours);
  if (!cur || ours || !keepStatusLine) {
    next.statusLine = config.statusLine;
    added.push("statusLine");
  }

  next.hooks = { ...(current.hooks || {}) };
  for (const [ev, groups] of Object.entries(config.hooks)) {
    const kept = stripOurs(next.hooks[ev]);
    next.hooks[ev] = [...kept, ...groups];
    added.push(`hooks.${ev}`);
  }

  if (!dryRun) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(next, null, 2) + "\n", "utf8");
  }

  return { path: file, backup, added, replacedStatusLine, result: next };
}

/** Desfaz a instalação, deixando o resto do settings.json intacto. */
function uninstall({ dryRun = false } = {}) {
  const file = settingsPath();
  if (!fs.existsSync(file)) return { path: file, removed: [], backup: null };

  let current;
  try {
    current = JSON.parse(fs.readFileSync(file, "utf8") || "{}");
  } catch (err) {
    throw new Error(`${file} não é JSON válido (${err.message}).`);
  }

  const backup = dryRun ? null : `${file}.bak-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  if (backup) fs.copyFileSync(file, backup);

  const removed = [];
  const next = { ...current };
  if (next.statusLine && next.statusLine[MARK]) {
    delete next.statusLine;
    removed.push("statusLine");
  }
  if (next.hooks) {
    for (const ev of Object.keys(next.hooks)) {
      const before = JSON.stringify(next.hooks[ev]);
      const kept = stripOurs(next.hooks[ev]);
      if (JSON.stringify(kept) !== before) removed.push(`hooks.${ev}`);
      if (kept.length) next.hooks[ev] = kept;
      else delete next.hooks[ev];
    }
    if (!Object.keys(next.hooks).length) delete next.hooks;
  }

  if (!dryRun) fs.writeFileSync(file, JSON.stringify(next, null, 2) + "\n", "utf8");
  return { path: file, removed, backup };
}

/** Diz o que já está instalado, sem alterar nada. */
function inspect() {
  const file = settingsPath();
  if (!fs.existsSync(file)) return { path: file, exists: false, statusLine: null, hooks: [], ours: false };
  let cur;
  try {
    cur = JSON.parse(fs.readFileSync(file, "utf8") || "{}");
  } catch (err) {
    return { path: file, exists: true, broken: err.message, statusLine: null, hooks: [], ours: false };
  }
  const hooks = [];
  for (const [ev, groups] of Object.entries(cur.hooks || {})) {
    for (const g of groups || []) {
      for (const h of (g && g.hooks) || []) {
        if (h && h[MARK]) hooks.push(ev);
      }
    }
  }
  return {
    path: file,
    exists: true,
    statusLine: cur.statusLine ? { command: cur.statusLine.command, ours: !!cur.statusLine[MARK] } : null,
    hooks: [...new Set(hooks)],
    ours: hooks.length > 0,
  };
}

module.exports = { settingsPath, buildConfig, install, uninstall, inspect, HOOK_EVENTS, MARK };
