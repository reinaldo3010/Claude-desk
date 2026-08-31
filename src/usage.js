"use strict";
/**
 * Camada de uso: transforma snapshots de statusLine em um modelo coerente.
 *
 * Fontes, em ordem de confiança:
 *   1. snapshots por sessão escritos pelo nosso statusLine  (dado oficial,
 *      vem do próprio Claude Code em `rate_limits`)
 *   2. cache do endpoint OAuth de uso                        (plano B)
 *   3. caches de terceiros no formato antigo                 (compatibilidade)
 *
 * Regra de ouro deste arquivo: NUNCA lançar. Um JSON corrompido no meio de
 * uma escrita não pode derrubar o servidor — no pior caso o painel mostra "--".
 */

const fs = require("fs");
const path = require("path");
const { normalizePercent, toEpochMs, readJsonSafe, get, round1 } = require("./util");

const WINDOWS = ["five_hour", "seven_day", "spend_limit"];

/** Traduz uma janela do statusLine para o formato do deck. */
function windowOf(node) {
  if (!node || typeof node !== "object") return null;
  const pct = normalizePercent(node.used_percentage ?? node.usedPercentage ?? node.percent);
  const resetsAt = toEpochMs(node.resets_at ?? node.resetsAt ?? node.reset);
  if (pct == null && resetsAt == null) return null;
  return { pct, resetsAt };
}

/**
 * Varredura tolerante para formatos desconhecidos/antigos.
 * Mantém a ideia do esqueleto (procurar chaves por regex em vez de fixar
 * caminhos), mas com dois consertos importantes:
 *   - percorre o objeto em largura, então uma chave rasa vence uma profunda
 *     (antes, a primeira encontrada em profundidade ganhava por acaso);
 *   - só aceita percentuais plausíveis (0..100 depois de normalizar).
 */
function scanUnknown(root) {
  const out = {};
  if (!root || typeof root !== "object") return out;

  const queue = [{ node: root, trail: "" }];
  let guard = 0;

  while (queue.length && guard++ < 5000) {
    const { node, trail } = queue.shift();
    if (!node || typeof node !== "object") continue;

    for (const [k, v] of Object.entries(node)) {
      const trailNext = trail ? `${trail}.${k}` : k;
      const p = trailNext.toLowerCase();

      // "session" costuma nomear a janela de 5h, mas também aparece em
      // session_id, context_window e estatísticas de cache. Em vez de exigir
      // uma palavra extra (que descarta `session.utilization`, formato real de
      // dashboards de terceiros), a gente aceita e barra o que sabidamente
      // NÃO é limite de plano.
      const isNoise = /(context|cache|token|prompt|message|turn)/.test(p);
      const isFive = !isNoise && (/(5h|five.?hour|fivehour)/.test(p) || /session/.test(p));
      const isWeek = !isNoise && /(7d|seven.?day|sevenday|weekly|week)/.test(p);
      const isSpend = !isNoise && /spend/.test(p);

      if (typeof v === "number" || typeof v === "string") {
        if (/(used_?percent|utilization|percent|pct|usage_?percent)/.test(p)) {
          const pct = normalizePercent(v);
          if (pct != null && pct <= 1000) {
            if (isSpend) out.spend_pct ??= pct;
            else if (isWeek) out.seven_pct ??= pct;
            else if (isFive) out.five_pct ??= pct;
          }
        }
        if (/reset/.test(p)) {
          const at = toEpochMs(v);
          if (at != null) {
            if (isSpend) out.spend_reset ??= at;
            else if (isWeek) out.seven_reset ??= at;
            else if (isFive) out.five_reset ??= at;
          }
        }
      }
      if (v && typeof v === "object") queue.push({ node: v, trail: trailNext });
    }
  }
  return out;
}

/** Converte a varredura tolerante em janelas. */
function windowsFromScan(scan) {
  const mk = (pct, resetsAt) =>
    pct == null && resetsAt == null ? null : { pct: pct ?? null, resetsAt: resetsAt ?? null };
  return {
    five_hour: mk(scan.five_pct, scan.five_reset),
    seven_day: mk(scan.seven_pct, scan.seven_reset),
    spend_limit: mk(scan.spend_pct, scan.spend_reset),
  };
}

/**
 * Normaliza o JSON que o Claude Code entrega ao statusLine.
 * Todos os campos são opcionais por contrato — a documentação lista vários
 * como "podem estar ausentes" —, então tudo aqui é defensivo.
 */
function parseStatusline(raw, meta = {}) {
  if (!raw || typeof raw !== "object") return null;

  const limits = raw.rate_limits && typeof raw.rate_limits === "object" ? raw.rate_limits : null;
  let windows = {};
  let source = "statusline";

  if (limits) {
    for (const w of WINDOWS) windows[w] = windowOf(limits[w]);
  }
  // Nenhuma janela reconhecida: cai para a varredura tolerante.
  if (!WINDOWS.some((w) => windows[w])) {
    const scanned = windowsFromScan(scanUnknown(raw));
    if (WINDOWS.some((w) => scanned[w])) {
      windows = scanned;
      source = "scan";
    }
  }

  const ctx = raw.context_window || {};
  const cost = raw.cost || {};

  return {
    sessionId: raw.session_id || meta.sessionId || null,
    sessionName: raw.session_name || null,
    promptId: raw.prompt_id || null,
    cwd: raw.cwd || get(raw, "workspace.current_dir") || null,
    projectDir: get(raw, "workspace.project_dir") || null,
    branch: get(raw, "workspace.git_worktree") || null,
    repo: get(raw, "workspace.repo.name") || null,
    repoOwner: get(raw, "workspace.repo.owner") || null,
    model: get(raw, "model.display_name") || get(raw, "model.id") || null,
    modelId: get(raw, "model.id") || null,
    version: raw.version || null,
    outputStyle: get(raw, "output_style.name") || null,
    effort: get(raw, "effort.level") || null,
    thinking: get(raw, "thinking.enabled") ?? null,
    fastMode: raw.fast_mode ?? null,
    vim: get(raw, "vim.mode") || null,
    agent: get(raw, "agent.name") || null,
    pr: raw.pr ? { number: raw.pr.number ?? null, url: raw.pr.url ?? null, state: raw.pr.review_state ?? null } : null,
    worktree: get(raw, "worktree.name") || null,

    context: {
      used: normalizePercent(ctx.used_percentage),
      size: typeof ctx.context_window_size === "number" ? ctx.context_window_size : null,
      inputTokens: typeof ctx.total_input_tokens === "number" ? ctx.total_input_tokens : null,
      outputTokens: typeof ctx.total_output_tokens === "number" ? ctx.total_output_tokens : null,
      exceeds200k: raw.exceeds_200k_tokens ?? null,
    },
    cache: raw.prompt_cache
      ? {
          warm: raw.prompt_cache.warm ?? null,
          hitRatio: typeof raw.prompt_cache.hit_ratio === "number" ? raw.prompt_cache.hit_ratio : null,
          ttl: raw.prompt_cache.ttl || null,
          expiresAt: toEpochMs(raw.prompt_cache.expires_at),
        }
      : null,
    cost: {
      usd: typeof cost.total_cost_usd === "number" ? cost.total_cost_usd : null,
      durationMs: typeof cost.total_duration_ms === "number" ? cost.total_duration_ms : null,
      apiMs: typeof cost.total_api_duration_ms === "number" ? cost.total_api_duration_ms : null,
      linesAdded: typeof cost.total_lines_added === "number" ? cost.total_lines_added : null,
      linesRemoved: typeof cost.total_lines_removed === "number" ? cost.total_lines_removed : null,
    },

    limits: windows,
    limitsSource: WINDOWS.some((w) => windows[w]) ? source : null,
    at: toEpochMs(meta.at) || Date.now(),
  };
}

/** Lê todos os snapshots de sessão vivos do diretório. */
function readSessions(dir, ttlMs = 30 * 60_000, now = Date.now()) {
  let names = [];
  try {
    names = fs.readdirSync(dir).filter((n) => n.endsWith(".json") && !n.startsWith("."));
  } catch {
    return [];
  }

  const out = [];
  for (const name of names) {
    const file = path.join(dir, name);
    let mtime = 0;
    try {
      mtime = fs.statSync(file).mtimeMs;
    } catch {
      continue;
    }
    // Sessão sem sinal há muito tempo é considerada morta e some do painel.
    if (now - mtime > ttlMs) continue;

    const raw = readJsonSafe(file, null);
    if (!raw) continue;
    const snap = parseStatusline(raw.payload || raw, {
      at: raw.at || mtime,
      sessionId: path.basename(name, ".json"),
    });
    if (snap) {
      snap.staleMs = now - (snap.at || mtime);
      out.push(snap);
    }
  }
  out.sort((a, b) => (b.at || 0) - (a.at || 0));
  return out;
}

/**
 * Agrega tudo num único modelo.
 * Os limites de taxa são da CONTA, não da sessão: qualquer sessão vê o mesmo
 * número. Então vale o snapshot mais recente que tiver aquela janela.
 */
function aggregate({ sessions = [], oauth = null, now = Date.now() } = {}) {
  const limits = { five_hour: null, seven_day: null, spend_limit: null };
  let source = null;
  let limitsAt = null;

  for (const s of sessions) {
    for (const w of WINDOWS) {
      if (!limits[w] && s.limits && s.limits[w]) {
        limits[w] = s.limits[w];
        source ??= s.limitsSource || "statusline";
        limitsAt ??= s.at;
      }
    }
  }

  // Plano B: cache do endpoint OAuth, usado só para janelas que faltarem.
  if (oauth && oauth.limits) {
    for (const w of WINDOWS) {
      if (!limits[w] && oauth.limits[w]) {
        limits[w] = oauth.limits[w];
        source ??= "oauth";
        limitsAt ??= oauth.at || null;
      }
    }
  }

  // Uma janela cujo reset já passou está obsoleta: o Claude Code a descarta,
  // e nós também — melhor mostrar "--" do que um número mentiroso.
  for (const w of WINDOWS) {
    const v = limits[w];
    if (v && v.resetsAt && v.resetsAt < now - 60_000) limits[w] = null;
  }

  const live = sessions.filter((s) => (s.staleMs ?? Infinity) < 90_000);
  const totals = sessions.reduce(
    (acc, s) => {
      if (typeof s.cost?.usd === "number") acc.costUsd += s.cost.usd;
      if (typeof s.cost?.linesAdded === "number") acc.linesAdded += s.cost.linesAdded;
      if (typeof s.cost?.linesRemoved === "number") acc.linesRemoved += s.cost.linesRemoved;
      return acc;
    },
    { costUsd: 0, linesAdded: 0, linesRemoved: 0 }
  );
  totals.costUsd = round1(totals.costUsd * 100) / 100;

  return {
    ok: WINDOWS.some((w) => limits[w]),
    limits,
    source,
    limitsAt,
    sessions,
    liveCount: live.length,
    totals,
  };
}

/**
 * Histórico circular de percentuais, para a curva e a taxa de queima.
 * Guarda pouca coisa de propósito: isso roda para sempre num PC doméstico.
 */
class History {
  constructor(max = 120) {
    this.max = Math.max(8, max);
    this.points = [];
  }

  push(t, five, seven) {
    if (five == null && seven == null) return;
    const last = this.points[this.points.length - 1];
    // Amostra no máximo 1x por minuto, e só se algo mudou.
    if (last && t - last.t < 60_000 && last.five === five && last.seven === seven) return;
    this.points.push({ t, five, seven });
    if (this.points.length > this.max) this.points.shift();
  }

  /**
   * Taxa de queima em pontos percentuais por hora, medida na janela recente.
   * Devolve também a projeção de quando bate 100%.
   */
  burn(key = "five", windowMs = 45 * 60_000, now = Date.now()) {
    const pts = this.points.filter((p) => p[key] != null && now - p.t <= windowMs);
    if (pts.length < 2) return { rate: null, exhaustAt: null };

    const first = pts[0];
    const last = pts[pts.length - 1];
    const hours = (last.t - first.t) / 3_600_000;
    if (hours <= 0.02) return { rate: null, exhaustAt: null };

    const delta = last[key] - first[key];
    // Queda de percentual = a janela resetou. Não dá para projetar daí.
    if (delta < 0) return { rate: null, exhaustAt: null };

    const rate = round1(delta / hours);
    if (!rate || rate <= 0) return { rate: rate ?? 0, exhaustAt: null };

    const remaining = 100 - last[key];
    if (remaining <= 0) return { rate, exhaustAt: now };
    return { rate, exhaustAt: now + (remaining / rate) * 3_600_000 };
  }

  serialize() {
    return this.points;
  }
}

module.exports = {
  WINDOWS,
  parseStatusline,
  scanUnknown,
  windowsFromScan,
  readSessions,
  aggregate,
  History,
};
