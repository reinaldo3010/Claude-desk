"use strict";
/**
 * Configuração do Claude Deck.
 *
 * Precedência: variável de ambiente > deck.config.json > padrão.
 * O arquivo deck.config.json fica fora do git (é local da máquina).
 */

const os = require("os");
const path = require("path");
const { readJsonSafe, stateDir } = require("./util");

const ROOT = path.resolve(__dirname, "..");

/** Detecta o injetor de teclas adequado ao sistema operacional. */
function defaultInjector() {
  if (process.platform === "win32") return "ahk";
  if (process.platform === "darwin") return "applescript";
  return "xdotool";
}

function defaultAhkPath() {
  return "C:\\Program Files\\AutoHotkey\\v2\\AutoHotkey.exe";
}

/**
 * Alvo padrão da janela por plataforma. É só um chute razoável —
 * `claude-deck doctor` descobre o valor real da máquina.
 */
function defaultTarget() {
  if (process.platform === "win32") return "ahk_exe WindowsTerminal.exe";
  if (process.platform === "darwin") return "Terminal";
  return "";
}

const num = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const bool = (v, fallback) => {
  if (v == null || v === "") return fallback;
  return /^(1|true|yes|on|sim)$/i.test(String(v));
};

function load() {
  const file = process.env.DECK_CONFIG || path.join(ROOT, "deck.config.json");
  const f = readJsonSafe(file, {}) || {};
  const env = process.env;

  return {
    configFile: file,
    root: ROOT,

    // --- rede ---
    port: num(env.DECK_PORT ?? f.port, 8788),
    host: env.DECK_HOST || f.host || "0.0.0.0",

    // --- segurança ---
    tokenFile: env.DECK_TOKEN_FILE || f.tokenFile || path.join(ROOT, ".deck-token"),
    token: env.DECK_TOKEN || f.token || null,
    // Sub-redes autorizadas a acionar /api/action. Vazio = qualquer origem com token.
    allowFrom: (env.DECK_ALLOW_FROM || f.allowFrom || "").trim(),
    // Ações por minuto por IP. Trava um script que descobriu o token.
    rateLimitPerMin: num(env.DECK_RATE_LIMIT ?? f.rateLimitPerMin, 60),
    auditFile: env.DECK_AUDIT || f.auditFile || path.join(stateDir(), "audit.log"),

    // --- fontes de dados ---
    stateDir: stateDir(),
    // Snapshots por sessão, escritos pelo nosso próprio statusLine.
    sessionsDir: env.DECK_SESSIONS_DIR || f.sessionsDir || path.join(stateDir(), "sessions"),
    // Considera uma sessão morta depois disso sem nenhum sinal.
    sessionTtlMs: num(env.DECK_SESSION_TTL ?? f.sessionTtlMs, 30 * 60_000),
    // Cache do endpoint OAuth de uso (plano B quando não há statusLine).
    oauthCacheFile:
      env.DECK_OAUTH_CACHE || f.oauthCacheFile || path.join(stateDir(), "usage-oauth.json"),
    oauthEnabled: bool(env.DECK_OAUTH ?? f.oauthEnabled, true),
    oauthRefreshMs: num(env.DECK_OAUTH_REFRESH ?? f.oauthRefreshMs, 5 * 60_000),
    credentialsFile:
      env.CLAUDE_CREDENTIALS ||
      f.credentialsFile ||
      path.join(os.homedir(), ".claude", ".credentials.json"),

    // --- injeção de teclas ---
    injector: env.DECK_INJECTOR || f.injector || defaultInjector(),
    ahkExe: env.AHK_EXE || f.ahkExe || defaultAhkPath(),
    ahkScript: env.DECK_AHK || f.ahkScript || path.join(ROOT, "install", "claude-deck.ahk"),
    target: env.DECK_TARGET ?? f.target ?? defaultTarget(),
    injectTimeoutMs: num(env.DECK_INJECT_TIMEOUT ?? f.injectTimeoutMs, 8000),

    // --- portão de permissão remota ---
    // Segundos que o hook PermissionRequest espera o tablet responder.
    // 0 desliga o portão: o hook devolve na hora e o terminal decide.
    gateHoldMs: num(env.DECK_GATE_HOLD ?? f.gateHoldMs, 0),
    gateMaxPending: num(env.DECK_GATE_MAX ?? f.gateMaxPending, 8),

    // --- comportamento da UI ---
    alertPercent: num(env.ALERT_PERCENT ?? f.alertPercent, 85),
    warnPercent: num(env.WARN_PERCENT ?? f.warnPercent, 60),
    // Minutos parado até a tela virar protetor de tela (0 desliga).
    screensaverMin: num(env.DECK_SCREENSAVER ?? f.screensaverMin, 12),
    // Estado "waiting" expira sozinho depois disso.
    waitingTtlMs: num(env.DECK_WAITING_TTL ?? f.waitingTtlMs, 30 * 60_000),
    historyPoints: num(env.DECK_HISTORY ?? f.historyPoints, 120),
    eventLogSize: num(env.DECK_EVENT_LOG ?? f.eventLogSize, 60),

    // Ações extras definidas pelo usuário no deck.config.json.
    extraActions: Array.isArray(f.actions) ? f.actions : [],
  };
}

module.exports = { load, ROOT, defaultInjector, defaultTarget, defaultAhkPath };
