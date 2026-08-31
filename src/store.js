"use strict";
/**
 * Estado do deck: traduz eventos de hook do Claude Code em algo que faça
 * sentido numa parede, a três metros de distância.
 *
 * O esqueleto original escutava 4 eventos e derivava 3 estados. O Claude Code
 * expõe cerca de 30 eventos de ciclo de vida — dá para saber QUAL ferramenta
 * está rodando, quantos subagentes estão vivos, se compactou o contexto e por
 * que a última volta falhou. É isso que transforma "algo acontecendo" em
 * "rodando os testes há 40 segundos".
 */

const STATUS = {
  OFFLINE: "offline",
  IDLE: "idle",
  WORKING: "working",
  WAITING: "waiting",
  ERROR: "error",
};

/** Rótulos de erro do evento StopFailure, em português. */
const ERROR_LABELS = {
  rate_limit: "Limite de uso atingido",
  overloaded: "Serviço sobrecarregado",
  authentication_failed: "Falha de autenticação",
  oauth_org_not_allowed: "Organização sem permissão",
  billing_error: "Problema de cobrança",
  invalid_request: "Requisição inválida",
  model_not_found: "Modelo não encontrado",
  server_error: "Erro no servidor",
  max_output_tokens: "Resposta atingiu o limite de tokens",
  unknown: "Falha desconhecida",
};

/** Tipos de notificação que significam "o Claude parou e quer você". */
const WAITING_NOTIFICATIONS = new Set([
  "permission_prompt",
  "idle_prompt",
  "agent_needs_input",
  "elicitation_dialog",
  "elicitation_url_dialog",
]);

/** Ícone e texto por ferramenta, para a linha de estado ficar específica. */
const TOOL_LABELS = {
  Bash: "rodando comando",
  Read: "lendo arquivo",
  Write: "escrevendo arquivo",
  Edit: "editando arquivo",
  Glob: "procurando arquivos",
  Grep: "buscando no código",
  WebFetch: "buscando na web",
  WebSearch: "pesquisando na web",
  Task: "delegando para subagente",
  Agent: "delegando para subagente",
  NotebookEdit: "editando notebook",
};

class DeckStore {
  constructor({ eventLogSize = 60, waitingTtlMs = 30 * 60_000, onChange = () => {} } = {}) {
    this.eventLogSize = Math.max(5, eventLogSize);
    this.waitingTtlMs = waitingTtlMs;
    this.onChange = onChange;

    this.status = STATUS.OFFLINE;
    this.headline = "Aguardando o Claude Code";
    this.detail = null;
    this.since = Date.now();
    this.log = [];
    this.sessions = new Map();
    this.counters = { prompts: 0, tools: 0, subagents: 0, compactions: 0, errors: 0, denials: 0 };
    this.activeTool = null;
    this.subagents = new Set();
  }

  /** Estado da sessão, criado sob demanda. */
  _session(id) {
    if (!id) return null;
    if (!this.sessions.has(id)) {
      this.sessions.set(id, {
        id,
        status: STATUS.IDLE,
        at: Date.now(),
        turn: 0,
        cwd: null,
        permissionMode: null,
        effort: null,
        model: null,
      });
    }
    return this.sessions.get(id);
  }

  _set(status, headline, detail = null) {
    const changed = this.status !== status || this.headline !== headline;
    this.status = status;
    this.headline = headline;
    this.detail = detail;
    if (changed) this.since = Date.now();
  }

  _push(kind, text, meta = {}) {
    this.log.push({ at: Date.now(), kind, text, ...meta });
    if (this.log.length > this.eventLogSize) this.log.shift();
  }

  /**
   * Consome um payload de hook. `name` é o hook_event_name.
   * Aceita qualquer evento: os que não interessam viram só linha de log.
   */
  ingest(name, rawPayload = {}) {
    // Um valor `null` explícito passa pelo padrão do parâmetro (que só cobre
    // `undefined`) e derrubaria todo acesso a campo abaixo. Normaliza aqui,
    // uma vez, em vez de encher cada `case` de verificação.
    const payload = rawPayload && typeof rawPayload === "object" ? rawPayload : {};
    const sid = payload.session_id || null;
    const sess = this._session(sid);
    if (sess) {
      sess.at = Date.now();
      if (payload.cwd) sess.cwd = payload.cwd;

      // Decisão de projeto, não detalhe de implementação: `permission_mode` e
      // `effort.level` vêm em TODO payload de hook, não só em alguns. É isso
      // que mantém os seletores do painel corretos onde a statusLine não roda
      // — o app desktop, por exemplo, cuja barra de status é da própria
      // aplicação e não executa comando nenhum.
      if (payload.permission_mode) sess.permissionMode = payload.permission_mode;
      if (payload.effort && payload.effort.level) sess.effort = payload.effort.level;
      // O modelo só aparece em alguns eventos; guarda sempre que passar.
      const modelo = payload.model || payload.to_model;
      if (typeof modelo === "string") sess.model = modelo;
      else if (modelo && typeof modelo.id === "string") sess.model = modelo.id;
    }

    switch (name) {
      case "SessionStart": {
        if (sess) sess.status = STATUS.IDLE;
        this._set(STATUS.IDLE, "Sessão aberta", payload.start_reason || null);
        this._push("session", `sessão iniciada (${payload.start_reason || "startup"})`, { sessionId: sid });
        break;
      }

      case "SessionEnd": {
        if (sid) this.sessions.delete(sid);
        const remaining = this.sessions.size;
        this._set(remaining ? this.status : STATUS.OFFLINE, remaining ? this.headline : "Claude Code fechado");
        this._push("session", `sessão encerrada (${payload.end_reason || "other"})`, { sessionId: sid });
        break;
      }

      case "UserPromptSubmit": {
        this.counters.prompts++;
        this.activeTool = null;
        if (sess) {
          sess.status = STATUS.WORKING;
          sess.turn = payload.turn_number || sess.turn + 1;
        }
        const p = String(payload.prompt || "").replace(/\s+/g, " ").trim();
        this._set(STATUS.WORKING, "Claude trabalhando", p ? p.slice(0, 120) : null);
        this._push("prompt", p ? p.slice(0, 160) : "(prompt enviado)", { sessionId: sid });
        break;
      }

      case "PreToolUse": {
        this.counters.tools++;
        const tool = payload.tool_name || "ferramenta";
        const label = TOOL_LABELS[tool] || `usando ${tool}`;
        this.activeTool = { tool, at: Date.now(), label };
        if (sess) sess.status = STATUS.WORKING;
        this._set(STATUS.WORKING, "Claude trabalhando", label);
        break;
      }

      case "PostToolUse":
        this.activeTool = null;
        break;

      case "PostToolUseFailure": {
        this.activeTool = null;
        const tool = payload.tool_name || "ferramenta";
        this._push("warn", `${tool} falhou`, { sessionId: sid });
        break;
      }

      case "PermissionRequest": {
        if (sess) sess.status = STATUS.WAITING;
        const tool = payload.tool_name || "ferramenta";
        this._set(STATUS.WAITING, "Permissão pedida", tool);
        this._push("permission", `permissão para ${tool}`, { sessionId: sid });
        break;
      }

      case "PermissionDenied": {
        this.counters.denials++;
        this._push("warn", `negado: ${payload.denied_reason || "sem motivo"}`, { sessionId: sid });
        break;
      }

      case "Notification": {
        const type = payload.notification_type || "";
        const msg = String(payload.message || payload.title || "").slice(0, 160);
        if (WAITING_NOTIFICATIONS.has(type)) {
          if (sess) sess.status = STATUS.WAITING;
          this._set(STATUS.WAITING, "Claude está esperando você", msg || null);
          this._push("attention", msg || type, { sessionId: sid });
        } else {
          this._push("info", msg || type, { sessionId: sid });
        }
        break;
      }

      case "Stop": {
        this.activeTool = null;
        if (sess) sess.status = STATUS.IDLE;
        const last = String(payload.last_assistant_message || "").replace(/\s+/g, " ").trim();
        this._set(STATUS.IDLE, "Resposta pronta", last ? last.slice(0, 140) : null);
        this._push("done", last ? last.slice(0, 160) : "(resposta concluída)", { sessionId: sid });
        break;
      }

      case "StopFailure": {
        this.counters.errors++;
        const label = ERROR_LABELS[payload.error_type] || ERROR_LABELS.unknown;
        if (sess) sess.status = STATUS.ERROR;
        this._set(STATUS.ERROR, label, payload.error_type || null);
        this._push("error", label, { sessionId: sid });
        break;
      }

      case "SubagentStart": {
        this.counters.subagents++;
        if (payload.agent_id) this.subagents.add(payload.agent_id);
        this._set(STATUS.WORKING, "Claude trabalhando", `subagente ${payload.agent_type || ""}`.trim());
        break;
      }

      case "SubagentStop":
        if (payload.agent_id) this.subagents.delete(payload.agent_id);
        break;

      case "PreCompact":
        this.counters.compactions++;
        this._set(STATUS.WORKING, "Compactando contexto", payload.compaction_reason || null);
        this._push("info", `compactando (${payload.compaction_reason || "auto"})`, { sessionId: sid });
        break;

      case "PostCompact":
        this._push("info", "contexto compactado", { sessionId: sid });
        break;

      case "TaskCreated":
        this._push("task", `tarefa: ${String(payload.task_summary || "").slice(0, 120)}`, { sessionId: sid });
        break;

      case "TaskCompleted":
        this._push("done", `tarefa concluída: ${String(payload.task_summary || "").slice(0, 120)}`, { sessionId: sid });
        break;

      case "PostModelSwitch":
        this._push("info", `modelo: ${payload.to_model || "?"}`, { sessionId: sid });
        break;

      default:
        // Evento desconhecido (ou novo numa versão futura) não pode quebrar nada.
        this._push("info", name, { sessionId: sid });
        break;
    }

    this.onChange();
    return this.snapshot();
  }

  /** Evento manual, vindo do `deck-event` ou de um teste. */
  manual(status, message) {
    const ok = Object.values(STATUS).includes(status);
    this._set(ok ? status : STATUS.IDLE, message || "", null);
    this._push("manual", `${status}: ${message || ""}`.trim());
    this.onChange();
    return this.snapshot();
  }

  /** Expira o alerta de "esperando" para o painel não gritar a noite inteira. */
  tick(now = Date.now()) {
    if (this.status === STATUS.WAITING && now - this.since > this.waitingTtlMs) {
      this._set(STATUS.IDLE, "Ocioso");
      this.onChange();
      return true;
    }
    // Sessão sem sinal há muito tempo desaparece do painel.
    let dropped = false;
    for (const [id, s] of this.sessions) {
      if (now - s.at > this.waitingTtlMs) {
        this.sessions.delete(id);
        dropped = true;
      }
    }
    if (dropped) this.onChange();
    return dropped;
  }

  snapshot() {
    return {
      status: this.status,
      headline: this.headline,
      detail: this.detail,
      since: this.since,
      activeTool: this.activeTool,
      subagents: this.subagents.size,
      counters: { ...this.counters },
      sessions: [...this.sessions.values()],
      log: this.log.slice(-this.eventLogSize),
    };
  }
}

module.exports = { DeckStore, STATUS, TOOL_LABELS, ERROR_LABELS };
