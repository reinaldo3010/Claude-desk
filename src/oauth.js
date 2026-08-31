"use strict";
/**
 * Plano B para os limites de uso.
 *
 * O caminho principal é o statusLine, que recebe `rate_limits` de graça. Mas
 * ele só atualiza quando você mexe no Claude Code. Se o terminal está fechado
 * há duas horas, o painel mostraria um número velho — e a diferença entre
 * "23% e parado" e "23% há duas horas" importa quando a decisão é abrir ou não
 * mais uma sessão.
 *
 * Este módulo consulta o mesmo endpoint que o Claude Code usa para montar o
 * /usage, reaproveitando o token OAuth que já está no disco. É um endpoint
 * NÃO DOCUMENTADO: pode mudar sem aviso. Por isso toda falha aqui é silenciosa
 * e o deck simplesmente continua com o dado do statusLine.
 */

const fs = require("fs");
const { readJsonSafe, writeJsonAtomic, normalizePercent, toEpochMs } = require("./util");

const ENDPOINT = "https://api.anthropic.com/api/oauth/usage";
const BETA_HEADER = "oauth-2025-04-20";

/** Lê o access token do arquivo de credenciais do Claude Code. */
function readAccessToken(file) {
  const creds = readJsonSafe(file, null);
  if (!creds) return null;
  return (
    creds?.claudeAiOauth?.accessToken ||
    creds?.claudeAiOauth?.access_token ||
    creds?.accessToken ||
    null
  );
}

/** Normaliza a resposta do endpoint para o mesmo formato das outras fontes. */
function normalize(body) {
  if (!body || typeof body !== "object") return null;
  const pick = (...candidates) => {
    for (const node of candidates) {
      if (node && typeof node === "object") {
        const pct = normalizePercent(node.utilization ?? node.used_percentage ?? node.percent);
        const resetsAt = toEpochMs(node.resets_at ?? node.reset_at ?? node.resetsAt);
        if (pct != null || resetsAt != null) return { pct, resetsAt };
      }
    }
    return null;
  };

  const limits = {
    five_hour: pick(body.five_hour, body.session, body.fiveHour),
    seven_day: pick(body.seven_day, body.weekly, body.sevenDay, body.week),
    spend_limit: pick(body.spend_limit, body.spendLimit),
  };
  return Object.values(limits).some(Boolean) ? limits : null;
}

/**
 * Busca e atualiza o cache. Nunca lança; devolve o cache atual em caso de erro.
 * @returns {Promise<{limits:object,at:number,source:string}|null>}
 */
async function refresh(cfg, { force = false, fetchImpl = globalThis.fetch } = {}) {
  const cached = readJsonSafe(cfg.oauthCacheFile, null);
  const fresh = cached && Date.now() - (cached.at || 0) < cfg.oauthRefreshMs;
  if (!cfg.oauthEnabled) return null;
  if (fresh && !force) return cached;
  if (typeof fetchImpl !== "function") return cached;

  const token = readAccessToken(cfg.credentialsFile);
  if (!token) return cached;

  try {
    const ctrl = new AbortController();
    const kill = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetchImpl(ENDPOINT, {
      headers: {
        authorization: `Bearer ${token}`,
        "anthropic-beta": BETA_HEADER,
        accept: "application/json",
      },
      signal: ctrl.signal,
    });
    clearTimeout(kill);
    if (!res.ok) return cached;

    const body = await res.json();
    const limits = normalize(body);
    if (!limits) return cached;

    const entry = { limits, at: Date.now(), source: "oauth" };
    try {
      writeJsonAtomic(cfg.oauthCacheFile, entry);
      try { fs.chmodSync(cfg.oauthCacheFile, 0o600); } catch { /* Windows ignora */ }
    } catch { /* cache é conveniência, não requisito */ }
    return entry;
  } catch {
    return cached;
  }
}

module.exports = { refresh, normalize, readAccessToken, ENDPOINT };
