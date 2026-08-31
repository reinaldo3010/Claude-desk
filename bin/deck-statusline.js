#!/usr/bin/env node
"use strict";
/**
 * statusLine do Claude Code — produtor de dados do Claude Deck.
 *
 * Faz duas coisas de uma vez:
 *   1. grava o JSON completo que o Claude Code entrega em
 *      ~/.claude/deck/sessions/<session_id>.json  (é daqui que o deck lê);
 *   2. imprime uma barra de status decente no terminal, para você não perder
 *      nada por ter trocado a sua.
 *
 * Por que isso substitui o dashboard de terceiros: desde a v2.1.x o próprio
 * Claude Code entrega `rate_limits.five_hour` e `.seven_day` no stdin do
 * statusLine. Consumindo direto da fonte, o deck não depende de adivinhar o
 * formato do cache de ninguém — e não quebra quando aquele projeto muda.
 *
 * Regras de sobrevivência: sempre sai com 0 e nunca demora. Se o disco falhar
 * ou o JSON vier torto, imprime o que der e segue — uma statusLine quebrada
 * não pode atrapalhar quem está programando.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const { load } = require("../src/config");
const { writeJsonAtomic } = require("../src/util");

const RESET = "\x1b[0m";
const c = (code, s) => `\x1b[${code}m${s}${RESET}`;
const dim = (s) => c("2", s);
const bold = (s) => c("1", s);
const fg = (n, s) => `\x1b[38;5;${n}m${s}${RESET}`;

const GREEN = 78;
const YELLOW = 179;
const RED = 203;
const BLUE = 110;
const GREY = 244;

function colorFor(pct, warn, alert) {
  if (pct == null) return GREY;
  if (pct >= alert) return RED;
  if (pct >= warn) return YELLOW;
  return GREEN;
}

/** Barra em blocos parciais: dá resolução de 1/8 de célula. */
function bar(pct, width, color) {
  if (pct == null) return fg(GREY, "─".repeat(width));
  const clamped = Math.max(0, Math.min(100, pct));
  const units = (clamped / 100) * width;
  const full = Math.floor(units);
  const rest = units - full;
  const partials = ["", "▏", "▎", "▍", "▌", "▋", "▊", "▉"];
  const head = "█".repeat(full);
  const tail = full < width ? partials[Math.floor(rest * 8)] : "";
  const pad = "·".repeat(Math.max(0, width - full - (tail ? 1 : 0)));
  return fg(color, head + tail) + fg(GREY, pad);
}

function shortPath(p) {
  if (!p) return null;
  const home = require("os").homedir();
  let s = p.startsWith(home) ? "~" + p.slice(home.length) : p;
  s = s.replace(/\\/g, "/");
  const parts = s.split("/").filter(Boolean);
  if (parts.length <= 3) return s;
  return (s.startsWith("~") ? "~/…/" : "…/") + parts.slice(-2).join("/");
}

function fmtReset(epochSec) {
  if (typeof epochSec !== "number" || !Number.isFinite(epochSec)) return null;
  const ms = epochSec * 1000 - Date.now();
  if (ms <= 0) return "0m";
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d${h % 24}h`;
  if (h > 0) return `${h}h${String(m % 60).padStart(2, "0")}`;
  return `${m}m`;
}

function render(data, cfg) {
  const warn = cfg.warnPercent;
  const alert = cfg.alertPercent;
  const parts1 = [];

  const model = data?.model?.display_name || data?.model?.id;
  if (model) parts1.push(bold(fg(BLUE, model)));

  const fast = data?.fast_mode ? fg(YELLOW, "⚡") : "";
  const effort = data?.effort?.level;
  if (effort && effort !== "medium") parts1.push(dim(effort));
  if (fast) parts1.push(fast);

  const dir = shortPath(data?.workspace?.current_dir || data?.cwd);
  if (dir) parts1.push(fg(GREY, dir));

  /* Mesma ordem de preferência do painel: o branch de verdade primeiro, o
     nome do worktree só como último recurso — e marcado, para não passar por
     branch. Ver `branchDe()` no fim do arquivo. */
  const cwdAqui = data?.cwd || data?.workspace?.current_dir || null;
  const branch = data?.worktree?.branch || branchDe(cwdAqui);
  if (branch) parts1.push(fg(GREEN, ` ${branch}`));
  else if (data?.workspace?.git_worktree) {
    parts1.push(fg(GREEN, `⑂ ${data.workspace.git_worktree}`));
  }

  const pr = data?.pr;
  if (pr?.number) {
    const state = pr.review_state;
    const col = state === "approved" ? GREEN : state === "changes_requested" ? RED : YELLOW;
    parts1.push(fg(col, `#${pr.number}`));
  }

  const parts2 = [];

  const ctxPct = data?.context_window?.used_percentage;
  if (typeof ctxPct === "number") {
    const col = colorFor(ctxPct, 70, 90);
    parts2.push(`${dim("ctx")} ${bar(ctxPct, 8, col)} ${fg(col, Math.round(ctxPct) + "%")}`);
  }

  const rl = data?.rate_limits;
  for (const [key, label] of [["five_hour", "5h"], ["seven_day", "7d"], ["spend_limit", "$$"]]) {
    const w = rl?.[key];
    if (!w || typeof w.used_percentage !== "number") continue;
    const col = colorFor(w.used_percentage, warn, alert);
    const reset = fmtReset(w.resets_at);
    parts2.push(
      `${dim(label)} ${bar(w.used_percentage, 6, col)} ${fg(col, Math.round(w.used_percentage) + "%")}` +
        (reset ? dim(`↻${reset}`) : "")
    );
  }

  const usd = data?.cost?.total_cost_usd;
  if (typeof usd === "number" && usd > 0) parts2.push(dim(`$${usd.toFixed(2)}`));

  const cache = data?.prompt_cache;
  if (cache && typeof cache.hit_ratio === "number") {
    parts2.push(dim(`cache ${Math.round(cache.hit_ratio * 100)}%`));
  }

  const line1 = parts1.join(dim(" · "));
  const line2 = parts2.join(dim("  "));
  return [line1, line2].filter(Boolean).join("\n");
}

/**
 * Resolve o branch de git da sessão.
 *
 * A statusLine não entrega branch: existe `worktree.branch`, mas só em sessão
 * de worktree, e `workspace.git_worktree` é nome de worktree, não branch. Os
 * próprios exemplos da documentação resolvem isso chamando o git. Como nós
 * somos a statusLine e rodamos no diretório da sessão, resolvemos aqui.
 *
 * Nunca lança e nunca demora: falha, timeout ou repositório nenhum devolvem
 * null. Um branch ausente é um campo vazio no painel; uma statusLine que
 * trava é o terminal do usuário travando.
 */
function branchDe(cwd) {
  if (!cwd) return null;
  try {
    const saida = execFileSync("git", ["branch", "--show-current"], {
      cwd,
      timeout: 700,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    });
    const nome = String(saida).trim();
    return nome && nome.length <= 200 ? nome : null;
  } catch {
    return null;   // sem git, fora de repositório, HEAD solto, timeout
  }
}

/** Grava o snapshot. Falhar aqui é aceitável: o terminal continua funcionando. */
function persist(data, cfg) {
  const id = String(data?.session_id || "sem-sessao").replace(/[^A-Za-z0-9_.-]/g, "_").slice(0, 80);
  const file = path.join(cfg.sessionsDir, `${id}.json`);
  const cwd = data?.cwd || data?.workspace?.current_dir || null;

  /* `payload` guarda exatamente o que o Claude Code entregou, sem invenção
     nossa no meio. O que nós descobrimos por conta própria vai em `deck`, para
     a procedência do dado continuar legível daqui a seis meses. */
  writeJsonAtomic(file, {
    at: Date.now(),
    pid: process.pid,
    payload: data,
    deck: { branch: branchDe(cwd) },
  });

  // Faxina barata: remove snapshots velhos para o diretório não crescer sem fim.
  try {
    const now = Date.now();
    for (const name of fs.readdirSync(cfg.sessionsDir)) {
      if (!name.endsWith(".json")) continue;
      const f = path.join(cfg.sessionsDir, name);
      if (now - fs.statSync(f).mtimeMs > 24 * 3600_000) fs.unlinkSync(f);
    }
  } catch { /* faxina é best-effort */ }
}

function main() {
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => (input += chunk));
  process.stdin.on("end", () => {
    let data = null;
    try {
      data = JSON.parse(input);
    } catch {
      process.stdout.write(dim("claude-deck: stdin não é JSON"));
      process.exit(0);
    }

    let cfg = null;
    try {
      cfg = load();
      persist(data, cfg);
    } catch (err) {
      // Sem persistência o deck fica cego, mas a statusLine ainda serve.
      if (process.env.DECK_DEBUG) process.stderr.write(String(err && err.stack) + "\n");
    }

    try {
      process.stdout.write(render(data, cfg || { warnPercent: 60, alertPercent: 85 }));
    } catch (err) {
      process.stdout.write(dim("claude-deck: falha ao renderizar"));
      if (process.env.DECK_DEBUG) process.stderr.write(String(err && err.stack) + "\n");
    }
    process.exit(0);
  });
}

if (require.main === module) main();
module.exports = { render, bar, shortPath, fmtReset };
