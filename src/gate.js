"use strict";
/**
 * Portão de permissão remota.
 *
 * A IDEIA
 * -------
 * O esqueleto original aprovava permissões digitando "1" na janela do
 * terminal. Isso é roleta: a numeração do prompt muda entre versões e entre
 * tipos de permissão, e se a janela alvo estiver errada o "1" vai parar em
 * qualquer lugar. Um deck que aprova a coisa errada é pior que não ter deck.
 *
 * O hook `PermissionRequest` resolve isso de verdade. Ele é do tipo `http`:
 * o Claude Code faz um POST para o deck e ESPERA a resposta. Enquanto isso o
 * painel mostra exatamente o que está sendo pedido — o comando, o arquivo — e
 * o seu toque vira o corpo da resposta HTTP: uma decisão explícita, sem
 * digitar número nenhum.
 *
 * ESTADO: EXPERIMENTAL, DESLIGADO POR PADRÃO
 * ------------------------------------------
 * `gateHoldMs` vem 0 de fábrica, o que faz o hook responder na hora e o
 * terminal decidir como sempre. Ligue só depois de testar com uma ação
 * inofensiva (ver docs/INSTALL.md). Motivo da cautela: segurar a resposta do
 * hook atrasa o prompt do terminal pelo tempo da espera, e o formato exato da
 * decisão aceita pode variar entre versões do Claude Code.
 *
 * MODO DE FALHA ESCOLHIDO
 * -----------------------
 * Se ninguém responder até o prazo, o portão devolve "sem decisão" — e o
 * Claude Code cai no fluxo normal de permissão do terminal. Nunca aprovamos
 * por omissão. Tempo esgotado significa perguntar a você, não deixar passar.
 */

const crypto = require("crypto");

/** Resumo legível do que está sendo pedido, para caber num botão de parede. */
function describe(payload) {
  const tool = payload?.tool_name || "ferramenta";
  const input = payload?.tool_input || {};

  let detail = null;
  if (typeof input.command === "string") detail = input.command;
  else if (typeof input.file_path === "string") detail = input.file_path;
  else if (typeof input.path === "string") detail = input.path;
  else if (typeof input.url === "string") detail = input.url;
  else if (typeof input.pattern === "string") detail = input.pattern;
  else {
    const keys = Object.keys(input);
    if (keys.length) {
      const v = input[keys[0]];
      detail = typeof v === "string" ? v : `${keys.length} parâmetro(s)`;
    }
  }

  return {
    tool,
    detail: detail == null ? null : String(detail).slice(0, 400),
    permissions: Array.isArray(payload?.requested_permissions)
      ? payload.requested_permissions.slice(0, 8).map(String)
      : [],
  };
}

/**
 * Heurística de risco, só para colorir o cartão no painel.
 * Não bloqueia nada — mas dá para bater o olho de longe e ver que o pedido
 * mexe em disco ou na rede antes de encostar em "Aprovar".
 */
const RISKY = [
  { re: /\brm\s+-rf?\b|\bdel\s+\/|Remove-Item.*-Recurse/i, why: "apaga arquivos recursivamente" },
  { re: /\bgit\s+(push|reset\s+--hard|clean\s+-[a-z]*f|rebase)/i, why: "reescreve ou publica histórico do git" },
  { re: /\b(sudo|runas)\b/i, why: "eleva privilégios" },
  { re: /\bcurl\b.*\|\s*(ba)?sh|\bwget\b.*\|\s*(ba)?sh/i, why: "baixa e executa script" },
  { re: /\b(npm|pnpm|yarn)\s+publish\b/i, why: "publica pacote" },
  { re: /\bdrop\s+(table|database)\b|\btruncate\b/i, why: "destrói dados" },
  { re: /\.env\b|credentials|secret|\.pem\b|id_rsa/i, why: "toca em segredo" },
];

function assessRisk(summary) {
  const hay = `${summary.tool} ${summary.detail || ""}`;
  for (const r of RISKY) if (r.re.test(hay)) return { level: "high", why: r.why };
  if (/^(Write|Edit|NotebookEdit|MultiEdit)$/.test(summary.tool))
    return { level: "medium", why: "escreve em arquivo" };
  if (summary.tool === "Bash") return { level: "medium", why: "executa comando" };
  return { level: "low", why: null };
}

class PermissionGate {
  /**
   * @param {object} opts
   * @param {number} opts.holdMs   quanto tempo segurar o hook (0 = desligado)
   * @param {number} opts.maxPending  teto de pedidos simultâneos
   * @param {(g:object)=>void} opts.onChange  chamado quando a fila muda
   */
  constructor({ holdMs = 0, maxPending = 8, onChange = () => {} } = {}) {
    this.holdMs = holdMs;
    this.maxPending = Math.max(1, maxPending);
    this.onChange = onChange;
    this.pending = new Map();
  }

  get enabled() {
    return this.holdMs > 0;
  }

  /**
   * Registra um pedido e devolve uma Promise com a resposta do hook.
   * Resolve com `null` quando não há decisão remota (fluxo normal do terminal).
   */
  open(payload) {
    const summary = describe(payload);
    const entry = {
      id: crypto.randomBytes(8).toString("hex"),
      requestId: payload?.permission_request_id || null,
      sessionId: payload?.session_id || null,
      cwd: payload?.cwd || null,
      toolUseId: payload?.tool_use_id || null,
      ...summary,
      risk: assessRisk(summary),
      at: Date.now(),
      expiresAt: this.enabled ? Date.now() + this.holdMs : null,
      decided: null,
    };

    if (!this.enabled) {
      // Portão desligado: registra para o painel ver, mas não segura ninguém.
      this._remember(entry, "pass-through");
      return { entry, promise: Promise.resolve(null) };
    }

    // Fila cheia: melhor devolver na hora do que empilhar o Claude Code.
    if (this.pending.size >= this.maxPending) {
      this._remember(entry, "fila-cheia");
      return { entry, promise: Promise.resolve(null) };
    }

    let settle;
    const promise = new Promise((resolve) => (settle = resolve));

    entry.settle = (decision, by) => {
      if (entry.decided) return false;
      entry.decided = { decision, by, at: Date.now() };
      clearTimeout(entry.timer);
      this.pending.delete(entry.id);
      this.onChange(this.snapshot());
      settle(decision ? this._response(decision) : null);
      return true;
    };

    entry.timer = setTimeout(() => {
      // Prazo esgotado sem resposta: NÃO aprova. Devolve ao terminal.
      entry.settle(null, "tempo-esgotado");
    }, this.holdMs);
    if (entry.timer.unref) entry.timer.unref();

    this.pending.set(entry.id, entry);
    this.onChange(this.snapshot());
    return { entry, promise };
  }

  /**
   * Corpo da resposta HTTP devolvido ao Claude Code.
   * Emitimos as duas grafias documentadas (`decision` na raiz e
   * `permissionDecision` dentro de hookSpecificOutput) porque a versão que
   * será honrada depende do build. Campo desconhecido é ignorado, e se a
   * validação recusar tudo o efeito é "sem decisão" — o terminal pergunta.
   */
  _response(decision) {
    const reason = "decidido no Claude Deck";
    return {
      decision,
      reason,
      hookSpecificOutput: {
        hookEventName: "PermissionRequest",
        permissionDecision: decision,
        permissionDecisionReason: reason,
      },
    };
  }

  /** Guarda o último pedido visto mesmo quando não seguramos a resposta. */
  _remember(entry, note) {
    this.last = { ...entry, note };
    this.onChange(this.snapshot());
  }

  /** Resolve o pedido mais antigo (é o que o painel mostra em destaque). */
  decide(decision, by = "deck", id = null) {
    if (!["allow", "deny", "block"].includes(decision)) {
      return { ok: false, error: "decisão inválida" };
    }
    const entry = id
      ? this.pending.get(id)
      : [...this.pending.values()].sort((a, b) => a.at - b.at)[0];
    if (!entry) return { ok: false, error: "nenhuma permissão pendente" };
    const done = entry.settle(decision, by);
    return done ? { ok: true, id: entry.id, decision } : { ok: false, error: "pedido já decidido" };
  }

  snapshot() {
    const now = Date.now();
    return {
      enabled: this.enabled,
      holdMs: this.holdMs,
      pending: [...this.pending.values()]
        .sort((a, b) => a.at - b.at)
        .map((e) => ({
          id: e.id,
          tool: e.tool,
          detail: e.detail,
          permissions: e.permissions,
          risk: e.risk,
          sessionId: e.sessionId,
          cwd: e.cwd,
          at: e.at,
          msLeft: e.expiresAt ? Math.max(0, e.expiresAt - now) : null,
        })),
      last: this.last
        ? { tool: this.last.tool, detail: this.last.detail, risk: this.last.risk, at: this.last.at, note: this.last.note }
        : null,
    };
  }

  /** Libera todos os pendentes — usado ao desligar o servidor. */
  drain() {
    for (const e of [...this.pending.values()]) e.settle(null, "servidor-encerrando");
  }
}

module.exports = { PermissionGate, describe, assessRisk };
