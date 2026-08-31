#!/usr/bin/env node
"use strict";
/**
 * CLI do Claude Deck.
 *
 *   claude-deck start        sobe o servidor
 *   claude-deck install      registra statusLine e hooks no ~/.claude/settings.json
 *   claude-deck uninstall    desfaz o registro
 *   claude-deck doctor       diagnóstico completo da máquina
 *   claude-deck dump         mostra o que o deck está lendo agora
 *   claude-deck event <st>   dispara um evento manual (para testar o painel)
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const { load } = require("../src/config");
const { createServer, localIps } = require("../src/server");
const settings = require("../src/settings");
const sec = require("../src/security");
const { readSessions, aggregate } = require("../src/usage");
const { buildCommand } = require("../src/inject");

const B = (s) => `\x1b[1m${s}\x1b[0m`;
const D = (s) => `\x1b[2m${s}\x1b[0m`;
const G = (s) => `\x1b[32m${s}\x1b[0m`;
const Y = (s) => `\x1b[33m${s}\x1b[0m`;
const R = (s) => `\x1b[31m${s}\x1b[0m`;
const OK = G("✓");
const WARN = Y("!");
const BAD = R("✗");

function args() {
  const [, , cmd, ...rest] = process.argv;
  const flags = new Set(rest.filter((a) => a.startsWith("--")));
  const positional = rest.filter((a) => !a.startsWith("--"));
  return { cmd: cmd || "start", flags, positional };
}

// ------------------------------------------------------------------ start

function start(cfg) {
  const { server, deck } = createServer(cfg);

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(R(`\n  A porta ${cfg.port} já está ocupada.`));
      console.error(D(`  Outro deck rodando? Feche-o, ou use  DECK_PORT=8789 claude-deck start\n`));
    } else if (err.code === "EACCES") {
      console.error(R(`\n  Sem permissão para escutar em ${cfg.host}:${cfg.port}.\n`));
    } else {
      console.error(R(`\n  Falha ao subir: ${err.message}\n`));
    }
    process.exit(1);
  });

  server.listen(cfg.port, cfg.host, () => {
    const t = deck.token;
    console.log(`\n  ${B("Claude Deck")} ${D("no ar")}`);
    console.log(`  ${D("─".repeat(52))}`);
    console.log(`  local    http://localhost:${cfg.port}/?t=${t}`);
    for (const ip of localIps()) {
      console.log(`  ${B("tablet")}   http://${ip}:${cfg.port}/?t=${t}`);
    }
    console.log(`  ${D("─".repeat(52))}`);
    console.log(`  ${D("sessões ")} ${cfg.sessionsDir}`);
    console.log(`  ${D("injetor ")} ${cfg.injector}${cfg.target ? D(" → ") + cfg.target : R(" (sem alvo — botões de digitar não funcionam)")}`);
    console.log(`  ${D("portão  ")} ${cfg.gateHoldMs > 0 ? G(`ligado (${Math.round(cfg.gateHoldMs / 1000)}s)`) : D("desligado")}`);
    console.log(`  ${D("origens ")} ${cfg.allowFrom || D("qualquer uma com token")}`);
    const st = settings.inspect();
    if (!st.ours) {
      console.log(`\n  ${WARN} hooks não instalados — rode ${B("claude-deck install")} para o painel receber eventos`);
    }
    console.log("");
  });

  const bye = () => {
    console.log(D("\n  encerrando…"));
    deck.gate.drain();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1500).unref();
  };
  process.on("SIGINT", bye);
  process.on("SIGTERM", bye);

  // Um erro solto não pode derrubar um painel que fica meses ligado.
  process.on("uncaughtException", (err) => {
    console.error(R(`  erro não tratado: ${err.message}`));
    if (process.env.DECK_DEBUG) console.error(err.stack);
  });
  process.on("unhandledRejection", (err) => {
    console.error(R(`  promessa rejeitada: ${err && err.message}`));
  });
}

// ---------------------------------------------------------------- install

function doInstall(cfg, flags) {
  const gate = flags.has("--gate");
  const baseUrl = `http://127.0.0.1:${cfg.port}`;
  const statuslinePath = path.join(cfg.root, "bin", "deck-statusline.js");
  const config = settings.buildConfig({
    baseUrl,
    statuslinePath,
    gate,
    gateTimeout: Math.max(10, Math.round((cfg.gateHoldMs || 120_000) / 1000) + 10),
  });

  const dry = flags.has("--dry-run");
  const r = settings.install(config, { dryRun: dry });

  console.log(`\n  ${B(dry ? "Simulação de instalação" : "Instalado")}`);
  console.log(`  arquivo  ${r.path}`);
  if (r.backup) console.log(`  backup   ${r.backup}`);
  console.log(`  statusLine + ${Object.keys(config.hooks).length} eventos de hook`);
  if (r.replacedStatusLine) {
    console.log(`\n  ${WARN} você já tinha uma statusLine e ela foi substituída.`);
    console.log(D(`     A antiga está no backup. Use --keep-statusline para preservá-la`));
    console.log(D(`     (mas aí o deck fica sem dados de uso).`));
  }
  if (gate) {
    console.log(`\n  ${WARN} portão de permissão ${B("ligado")} — hook PermissionRequest instalado.`);
    console.log(D(`     Teste com uma ação inofensiva antes de confiar. Ver docs/INSTALL.md.`));
  }
  console.log(`\n  Reinicie o Claude Code para valer.\n`);
}

function doUninstall(flags) {
  const r = settings.uninstall({ dryRun: flags.has("--dry-run") });
  console.log(`\n  removido de ${r.path}: ${r.removed.length ? r.removed.join(", ") : "nada nosso encontrado"}`);
  if (r.backup) console.log(`  backup ${r.backup}`);
  console.log("");
}

// ----------------------------------------------------------------- doctor

/** Procura executável no PATH sem depender de shell. */
function which(bin) {
  const paths = (process.env.PATH || "").split(path.delimiter);
  const exts = process.platform === "win32" ? (process.env.PATHEXT || ".EXE;.CMD;.BAT").split(";") : [""];
  for (const dir of paths) {
    for (const ext of exts) {
      const f = path.join(dir, bin + ext.toLowerCase());
      try {
        fs.accessSync(f, fs.constants.X_OK);
        return f;
      } catch { /* próximo */ }
    }
  }
  return null;
}

/** Lista janelas candidatas para o usuário escolher o DECK_TARGET. */
function listWindows() {
  try {
    if (process.platform === "linux" && which("xdotool")) {
      const out = execFileSync("xdotool", ["search", "--name", "."], { encoding: "utf8", timeout: 4000 });
      const ids = out.trim().split("\n").slice(0, 40);
      const names = [];
      for (const id of ids) {
        try {
          const n = execFileSync("xdotool", ["getwindowname", id], { encoding: "utf8", timeout: 1000 }).trim();
          if (n) names.push(n);
        } catch { /* janela sumiu */ }
      }
      return [...new Set(names)].slice(0, 15);
    }
    if (process.platform === "win32") {
      const ps = `Get-Process | Where-Object {$_.MainWindowTitle -ne ''} | ForEach-Object { "ahk_exe $($_.ProcessName).exe  —  $($_.MainWindowTitle)" }`;
      const out = execFileSync("powershell.exe", ["-NoProfile", "-Command", ps], { encoding: "utf8", timeout: 6000 });
      return out.trim().split(/\r?\n/).filter(Boolean).slice(0, 15);
    }
    if (process.platform === "darwin") {
      const as = 'tell application "System Events" to get name of every process whose background only is false';
      const out = execFileSync("osascript", ["-e", as], { encoding: "utf8", timeout: 4000 });
      return out.trim().split(", ").slice(0, 20);
    }
  } catch { /* diagnóstico é best-effort */ }
  return [];
}

function doctor(cfg) {
  console.log(`\n  ${B("Diagnóstico do Claude Deck")}`);
  console.log(`  ${D("═".repeat(58))}\n`);
  const problems = [];

  // 1. Node
  const major = Number(process.versions.node.split(".")[0]);
  console.log(`  ${major >= 18 ? OK : BAD} Node ${process.versions.node} ${D(major >= 18 ? "" : "(precisa de 18 ou mais)")}`);
  if (major < 18) problems.push("Atualize o Node para 18+.");

  // 2. settings.json
  const st = settings.inspect();
  if (!st.exists) {
    console.log(`  ${BAD} ${st.path} não existe`);
    problems.push("Abra o Claude Code uma vez para criar o settings.json, depois rode `claude-deck install`.");
  } else if (st.broken) {
    console.log(`  ${BAD} settings.json corrompido: ${st.broken}`);
    problems.push("Conserte o JSON do settings.json antes de instalar.");
  } else {
    console.log(`  ${st.statusLine?.ours ? OK : WARN} statusLine ${st.statusLine ? (st.statusLine.ours ? "é a do deck" : D(`é de outro: ${st.statusLine.command}`)) : D("não configurada")}`);
    console.log(`  ${st.hooks.length ? OK : WARN} hooks do deck: ${st.hooks.length ? `${st.hooks.length} eventos` : D("nenhum")}`);
    if (!st.statusLine?.ours) problems.push("Rode `claude-deck install` para o deck receber os dados de uso.");
    if (!st.hooks.length) problems.push("Rode `claude-deck install` para o painel receber eventos.");
  }

  // 3. Dados de uso
  const sessions = readSessions(cfg.sessionsDir, cfg.sessionTtlMs);
  const usage = aggregate({ sessions });
  if (!sessions.length) {
    console.log(`  ${WARN} nenhum snapshot em ${D(cfg.sessionsDir)}`);
    problems.push("Depois de instalar, reinicie o Claude Code e mande uma mensagem — é o que gera o primeiro snapshot.");
  } else {
    console.log(`  ${OK} ${sessions.length} sessão(ões) com snapshot`);
    if (usage.ok) {
      const f = usage.limits.five_hour?.pct;
      const s = usage.limits.seven_day?.pct;
      console.log(`  ${OK} limites lidos ${D(`(fonte: ${usage.source})`)}  5h ${f ?? "--"}%  7d ${s ?? "--"}%`);
    } else {
      console.log(`  ${WARN} snapshot sem \`rate_limits\``);
      problems.push(
        "O campo rate_limits só aparece para assinantes Pro/Max e após a primeira resposta da API. Se você usa API avulsa, o painel mostra contexto e custo, mas não a quota."
      );
    }
  }

  // 4. Injeção de teclas
  console.log(`\n  ${D("Injeção de teclas")}`);
  console.log(`  ${D("injetor:")} ${cfg.injector}`);
  const probe = buildCommand(cfg, "keys", "{Esc}");
  if (probe.error) {
    console.log(`  ${BAD} ${probe.error}`);
    problems.push(probe.error);
  } else {
    const bin = probe.cmd;
    const found = path.isAbsolute(bin) ? fs.existsSync(bin) : !!which(bin);
    console.log(`  ${found ? OK : BAD} ${bin} ${found ? "" : D("não encontrado")}`);
    if (!found) problems.push(`Instale ${path.basename(bin)} ou ajuste a configuração.`);
    console.log(`  ${OK} alvo: ${cfg.target}`);
  }

  const wins = listWindows();
  if (wins.length) {
    console.log(`\n  ${D("Janelas abertas agora (escolha o DECK_TARGET):")}`);
    for (const w of wins) console.log(`     ${D("·")} ${w}`);
  }

  // 5. Rede e segurança
  console.log(`\n  ${D("Rede")}`);
  const token = cfg.token || sec.loadOrCreateToken(cfg.tokenFile);
  console.log(`  ${OK} token ${sec.maskToken(token)} ${D(`(${cfg.tokenFile})`)}`);
  console.log(`  ${cfg.allowFrom ? OK : WARN} origens: ${cfg.allowFrom || D("qualquer IP com token")}`);
  if (!cfg.allowFrom && cfg.host !== "127.0.0.1") {
    problems.push(
      "Sem DECK_ALLOW_FROM, qualquer um na sua rede que tenha o token digita no seu terminal. Fixe o IP do tablet e restrinja — leva um minuto."
    );
  }
  for (const ip of localIps()) console.log(`     ${D("·")} http://${ip}:${cfg.port}/?t=${sec.maskToken(token)}`);

  // 6. Veredito
  console.log(`\n  ${D("═".repeat(58))}`);
  if (!problems.length) {
    console.log(`  ${G("Tudo pronto.")} Suba com ${B("claude-deck start")}.\n`);
  } else {
    console.log(`  ${B("Pendências:")}\n`);
    problems.forEach((p, i) => console.log(`   ${i + 1}. ${p}`));
    console.log("");
  }
  return problems.length;
}

// ------------------------------------------------------------------- dump

function dump(cfg) {
  const sessions = readSessions(cfg.sessionsDir, cfg.sessionTtlMs);
  const usage = aggregate({ sessions });
  console.log(JSON.stringify({ configFile: cfg.configFile, sessionsDir: cfg.sessionsDir, usage, sessions }, null, 2));
}

// ------------------------------------------------------------------ event

async function sendEvent(cfg, positional) {
  const [status = "waiting", ...rest] = positional;
  const message = rest.join(" ") || "teste do deck";
  try {
    const res = await fetch(`http://127.0.0.1:${cfg.port}/api/event`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, message }),
    });
    console.log(res.ok ? `  ${OK} evento "${status}" enviado` : `  ${BAD} servidor respondeu ${res.status}`);
  } catch (err) {
    console.log(`  ${BAD} deck não está no ar em 127.0.0.1:${cfg.port} (${err.message})`);
    process.exitCode = 1;
  }
}

function help() {
  console.log(`
  ${B("claude-deck")} — painel de parede para o Claude Code

    start                  sobe o servidor  ${D("(padrão)")}
    install [--gate]       registra statusLine e hooks no settings.json
                           ${D("--gate liga o portão de permissão remota (experimental)")}
                           ${D("--dry-run mostra o que faria, sem escrever")}
    uninstall              remove o que o deck instalou
    doctor                 diagnóstico completo da máquina
    dump                   imprime o que o deck está lendo agora
    event <estado> [msg]   dispara um evento manual para testar o painel

  ${D("Variáveis principais: DECK_PORT, DECK_HOST, DECK_TARGET, DECK_ALLOW_FROM,")}
  ${D("DECK_INJECTOR, DECK_GATE_HOLD, DECK_TOKEN. Ver docs/INSTALL.md.")}
`);
}

function main() {
  const { cmd, flags, positional } = args();
  const cfg = load();

  switch (cmd) {
    case "start": return start(cfg);
    case "install": return doInstall(cfg, flags);
    case "uninstall": return doUninstall(flags);
    case "doctor": return process.exit(doctor(cfg) ? 1 : 0);
    case "dump": return dump(cfg);
    case "event": return sendEvent(cfg, positional);
    case "help": case "--help": case "-h": return help();
    default:
      console.error(`  comando desconhecido: ${cmd}`);
      help();
      process.exit(1);
  }
}

if (require.main === module) main();
module.exports = { doctor, which, listWindows };
