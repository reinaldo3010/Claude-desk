"use strict";
/**
 * Servidor do Claude Deck.
 *
 * Rotas:
 *   GET  /                 painel (arquivos estáticos de public/)
 *   GET  /api/state        estado completo em JSON (fallback de polling)
 *   GET  /api/stream       Server-Sent Events — é por aqui que o painel vive
 *   GET  /api/health       diagnóstico rápido, sem token
 *   POST /api/hook         hooks do Claude Code (só loopback)
 *   POST /api/event        evento manual do deck-event (só loopback)
 *   POST /api/action       botões do painel (token + faixa de IP + limite)
 *
 * Por que SSE e não polling: o esqueleto original perguntava o estado a cada
 * 2 segundos. Num tablet velho isso é rádio ligado o tempo todo, bateria indo
 * embora e até 2s de atraso justamente no evento que importa — o "estou te
 * esperando". Com SSE o servidor empurra na hora e o rádio dorme entre eventos.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const { DeckStore, STATUS } = require("./store");
const { PermissionGate } = require("./gate");
const { History, readSessions, aggregate } = require("./usage");
const { inject } = require("./inject");
const oauth = require("./oauth");
const actionsLib = require("./actions");
const engine = require("./deckengine");
const sec = require("./security");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

const MAX_BODY = 256 * 1024;

/** Lê o corpo da requisição com teto de tamanho. Nunca lança. */
function readBody(req) {
  return new Promise((resolve) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        req.destroy();
        return resolve({});
      }
      chunks.push(c);
    });
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw.trim() ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

function sendJson(res, code, body) {
  const payload = JSON.stringify(body);
  res.writeHead(code, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  res.end(payload);
}

function sendText(res, code, text, type = "text/plain; charset=utf-8") {
  res.writeHead(code, { "content-type": type, "cache-control": "no-store" });
  res.end(text);
}

/** Endereços IPv4 locais, para imprimir a URL que o tablet deve abrir. */
function localIps() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === "IPv4" && !i.internal)
    .map((i) => i.address);
}

class Deck {
  constructor(cfg) {
    this.cfg = cfg;
    this.token = cfg.token || sec.loadOrCreateToken(cfg.tokenFile);
    this.allowList = sec.compileAllowList(cfg.allowFrom);
    this.limiter = new sec.RateLimiter(cfg.rateLimitPerMin);
    this.audit = sec.makeAuditor(cfg.auditFile);
    this.history = new History(cfg.historyPoints);
    this.clients = new Set();
    this.warnings = [];

    this.actions = actionsLib.build(cfg.extraActions, (w) => {
      this.warnings.push(w);
      console.warn(`  aviso: ${w}`);
    });

    this.store = new DeckStore({
      eventLogSize: cfg.eventLogSize,
      waitingTtlMs: cfg.waitingTtlMs,
      onChange: () => this.broadcast(),
    });

    this.gate = new PermissionGate({
      holdMs: cfg.gateHoldMs,
      maxPending: cfg.gateMaxPending,
      onChange: () => this.broadcast(),
    });

    this.oauthCache = null;
    this.lastState = null;
  }

  /** Monta o estado completo enviado ao painel. */
  state(now = Date.now()) {
    const sessions = readSessions(this.cfg.sessionsDir, this.cfg.sessionTtlMs, now);
    const usage = aggregate({ sessions, oauth: this.oauthCache, now });

    const five = usage.limits.five_hour?.pct ?? null;
    const seven = usage.limits.seven_day?.pct ?? null;
    this.history.push(now, five, seven);

    const snapshot = {
      now,
      status: this.store.status,
      headline: this.store.headline,
      detail: this.store.detail,
      since: this.store.since,
      activeTool: this.store.activeTool,
      subagents: this.store.subagents.size,
      counters: this.store.counters,
      log: this.store.log,
      usage: {
        ok: usage.ok,
        source: usage.source,
        at: usage.limitsAt,
        staleMs: usage.limitsAt ? now - usage.limitsAt : null,
        five: usage.limits.five_hour,
        seven: usage.limits.seven_day,
        spend: usage.limits.spend_limit,
        totals: usage.totals,
      },
      burn: {
        five: this.history.burn("five", 45 * 60_000, now),
        seven: this.history.burn("seven", 6 * 3_600_000, now),
      },
      history: this.history.serialize(),
      sessions: sessions.map((s) => ({
        id: s.sessionId,
        name: s.sessionName,
        model: s.model,
        modelId: s.modelId,
        cwd: s.cwd,
        branch: s.branch,
        repo: s.repo,
        pr: s.pr,
        effort: s.effort,
        fastMode: s.fastMode,
        context: s.context,
        cache: s.cache,
        cost: s.cost,
        version: s.version,
        agent: s.agent,
        staleMs: s.staleMs,
        live: this.isLive(s, now),
        // Os hooks sabem coisas que o snapshot pode não saber.
        ...this.fromHooks(s.sessionId),
      })),
      gate: this.gate.snapshot(),
      config: {
        warnAt: this.cfg.warnPercent,
        alertAt: this.cfg.alertPercent,
        screensaverMin: this.cfg.screensaverMin,
        injector: this.cfg.injector,
        surface: this.cfg.surface,
        hasTarget: !!String(this.cfg.target || "").trim(),
        gateEnabled: this.gate.enabled,
      },
      warnings: this.warnings.slice(-5),
    };

    // União, não enriquecimento. Uma sessão conhecida SÓ pelos hooks precisa
    // existir na lista — senão o painel fica cego onde a statusLine não roda,
    // que é justamente o caso do app desktop: lá a barra de status é da
    // aplicação e não executa comando nenhum, então não há snapshot em disco
    // e `sessions` ficaria permanentemente vazio.
    const comSnapshot = new Set(sessions.map((s) => s.sessionId));
    for (const [id, seen] of this.store.sessions) {
      if (comSnapshot.has(id)) continue;
      if (now - seen.at > this.cfg.sessionTtlMs) continue;
      snapshot.sessions.push({
        id,
        name: null,
        model: null,
        cwd: seen.cwd || null,
        context: {},
        cost: {},
        staleMs: now - seen.at,
        live: now - seen.at < 10 * 60_000,
        source: "hooks",
        ...this.fromHooks(id),
      });
    }

    // O deck é resolvido DEPOIS do resto: quais botões aparecem, quais sobem
    // para o topo e que número cada face mostra são funções do estado que
    // acabamos de montar.
    snapshot.actions = engine.resolve(this.actions, snapshot);
    snapshot.pages = engine.pagesOf(this.actions, snapshot);
    return snapshot;
  }

  /**
   * O que os hooks sabem sobre uma sessão e o snapshot pode não saber.
   * Vale para qualquer superfície, mas é o que sustenta o app desktop:
   * lá a barra de status é da aplicação e não executa a nossa statusLine.
   */
  fromHooks(sessionId) {
    const seen = sessionId && this.store.sessions.get(sessionId);
    if (!seen) return {};
    const out = {};
    if (seen.permissionMode) out.permissionMode = seen.permissionMode;
    if (seen.effort) out.effort = seen.effort;
    if (seen.model) out.modelId = seen.model;
    // Estado POR SESSÃO. É o que permite uma tecla por agente mostrar em que
    // pé aquela conversa está — sem isso o painel só sabe um estado global.
    out.state = seen.status || null;
    out.tool = seen.tool || null;
    out.detail = seen.detail || null;
    out.seenAt = seen.at;
    return out;
  }

  /**
   * Uma sessão está viva?
   *
   * Não dá para responder só pela idade do snapshot. O Claude Code roda a
   * statusLine em gatilhos — prompt enviado, resposta pronta, troca de modelo —
   * e não em intervalo fixo. Meia hora lendo código não gera nenhuma
   * atualização, e um limite curto marcaria como morta uma sessão aberta na
   * sua frente. Então cruzamos duas fontes: a idade do snapshot e o último
   * evento de hook daquela sessão, que chega a cada ferramenta usada.
   */
  isLive(session, now = Date.now()) {
    const FRESH = 10 * 60_000;
    if ((session.staleMs ?? Infinity) < FRESH) return true;
    const seen = session.sessionId && this.store.sessions.get(session.sessionId);
    return !!(seen && now - seen.at < FRESH);
  }

  /** Empurra o estado para todos os painéis conectados. */
  broadcast() {
    if (!this.clients.size) return;
    let payload;
    try {
      payload = JSON.stringify(this.state());
    } catch {
      return;
    }
    const frame = `event: state\ndata: ${payload}\n\n`;
    for (const res of [...this.clients]) {
      try {
        res.write(frame);
      } catch {
        this.clients.delete(res);
      }
    }
  }

  /** Executa uma ação do painel. */
  async runAction(id, { by = "deck", depth = 0 } = {}) {
    const action = this.actions.find((a) => a.id === id);
    if (!action) return { ok: false, code: 404, error: "ação desconhecida" };

    // Sequências: passos executados em ordem, com as pausas declaradas.
    // A profundidade é limitada a 1 (uma chain não chama outra chain), o que
    // torna ciclo impossível por construção em vez de por detecção.
    if (action.kind === "chain") {
      if (depth > 0) return { ok: false, code: 409, error: "sequência aninhada não é permitida" };
      const done = [];
      for (const step of action.steps) {
        if (step.wait) {
          await new Promise((r) => setTimeout(r, Math.min(5000, step.wait)));
          continue;
        }
        // Um passo pode ser uma ação nomeada ou teclas cruas. Teclas em linha
        // existem por causa dos menus do app desktop: abrir com Ctrl+Shift+I
        // e escolher com "2" são dois toques que não têm nome próprio e não
        // fazem sentido como botões separados.
        let r;
        if (step.keys) {
          try {
            await inject(this.cfg, { kind: "keys", keys: step.keys });
            r = { ok: true };
          } catch (err) {
            r = { ok: false, error: err.message, code: 500 };
          }
          done.push(step.keys);
        } else {
          r = await this.runAction(step.action, { by, depth: depth + 1 });
          done.push(step.action);
        }
        // Um passo que falha aborta o resto: metade de uma sequência no
        // terminal é pior do que nenhuma.
        if (!r.ok) {
          const qual = step.action || step.keys;
          this.audit({ action: id, by, via: "chain", abortedAt: qual, error: r.error });
          return { ok: false, code: r.code || 500, error: `passo "${qual}": ${r.error}`, done };
        }
      }
      this.audit({ action: id, by, via: "chain", steps: done });
      return { ok: true, via: "chain", steps: done };
    }

    // Decisões tentam o portão primeiro: é o caminho preciso.
    if (action.kind === "decision") {
      const wanted = action.decision === "deny" ? "deny" : "allow";
      // "sempre" não existe como decisão de hook — só o terminal sabe fazer isso.
      if (action.decision !== "allow_always" && this.gate.enabled) {
        const r = this.gate.decide(wanted, by);
        if (r.ok) {
          this.audit({ action: id, by, via: "gate", decision: wanted });
          return { ok: true, via: "gate", decision: wanted };
        }
      }
      if (!action.keys) {
        return { ok: false, code: 409, error: "nenhuma permissão pendente e sem fallback de teclas" };
      }
    }

    try {
      const r = await inject(this.cfg, action);
      this.audit({ action: id, by, via: "keys", detail: r.detail || null });
      return { ok: true, via: "keys", detail: r.detail || null };
    } catch (err) {
      this.audit({ action: id, by, via: "keys", error: err.message });
      return { ok: false, code: 500, error: err.message };
    }
  }

  /** Atualiza o cache OAuth em segundo plano. Falha em silêncio, por design. */
  async pollOauth() {
    try {
      const r = await oauth.refresh(this.cfg);
      if (r) {
        this.oauthCache = r;
        this.broadcast();
      }
    } catch { /* endpoint não documentado: nunca é motivo de erro visível */ }
  }
}

function createServer(cfg) {
  const deck = new Deck(cfg);
  const publicDir = path.join(cfg.root, "public");

  /** Serve arquivos estáticos, barrando qualquer tentativa de sair da pasta. */
  function serveStatic(req, res, pathname) {
    const rel = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const target = path.resolve(publicDir, rel);
    if (!target.startsWith(publicDir + path.sep) && target !== path.join(publicDir, "index.html")) {
      return sendText(res, 403, "fora do diretório público");
    }
    fs.readFile(target, (err, buf) => {
      if (err) return sendJson(res, 404, { error: "não encontrado" });
      const ext = path.extname(target).toLowerCase();
      res.writeHead(200, {
        "content-type": MIME[ext] || "application/octet-stream",
        // O painel muda a cada deploy; o navegador do quiosque não pode cachear.
        "cache-control": ext === ".html" ? "no-store" : "public, max-age=60",
        "x-content-type-options": "nosniff",
      });
      res.end(buf);
    });
  }

  const server = http.createServer(async (req, res) => {
    let url;
    try {
      url = new URL(req.url, "http://deck.local");
    } catch {
      return sendJson(res, 400, { error: "url inválida" });
    }
    const p = url.pathname;
    const ip = sec.normalizeIp(req.socket.remoteAddress);

    // ---- diagnóstico, sem token de propósito ----------------------------
    if (p === "/api/health") {
      const s = deck.state();
      return sendJson(res, 200, {
        ok: true,
        status: s.status,
        usageOk: s.usage.ok,
        usageSource: s.usage.source,
        sessions: s.sessions.length,
        injector: cfg.injector,
        hasTarget: s.config.hasTarget,
        gateEnabled: s.config.gateEnabled,
        uptimeSec: Math.round(process.uptime()),
        warnings: s.warnings,
      });
    }

    // ---- hooks do Claude Code: só da própria máquina --------------------
    if (p === "/api/hook" && req.method === "POST") {
      if (!sec.isLoopback(ip)) return sendJson(res, 403, { error: "apenas local" });
      const payload = await readBody(req);
      const name = String(payload.hook_event_name || url.searchParams.get("event") || "").slice(0, 64);
      if (!name) return sendJson(res, 400, { error: "hook_event_name ausente" });

      deck.store.ingest(name, payload);

      // PermissionRequest é o único hook cuja RESPOSTA importa: ela carrega
      // a decisão. Os outros só alimentam o painel e voltam vazios na hora.
      if (name === "PermissionRequest") {
        const { promise } = deck.gate.open(payload);
        const decision = await promise;
        return sendJson(res, 200, decision || {});
      }
      return sendJson(res, 200, {});
    }

    // ---- evento manual (deck-event) ------------------------------------
    if (p === "/api/event" && req.method === "POST") {
      if (!sec.isLoopback(ip)) return sendJson(res, 403, { error: "apenas local" });
      const b = await readBody(req);
      const status = String(b.status || url.searchParams.get("status") || "idle").slice(0, 24);
      const message = String(b.message || url.searchParams.get("message") || "").slice(0, 200);
      deck.store.manual(status, message);
      return sendJson(res, 200, { ok: true });
    }

    // ---- estado (fallback de polling) ----------------------------------
    if (p === "/api/state") {
      deck.store.tick();
      return sendJson(res, 200, deck.state());
    }

    // ---- fluxo de eventos --------------------------------------------
    if (p === "/api/stream") {
      res.writeHead(200, {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-store",
        connection: "keep-alive",
        "x-accel-buffering": "no",
      });
      res.write(`retry: 3000\n\n`);
      res.write(`event: state\ndata: ${JSON.stringify(deck.state())}\n\n`);
      deck.clients.add(res);

      // Batimento: mantém proxies e o Wi-Fi do tablet de dormirem na conexão.
      const beat = setInterval(() => {
        try {
          res.write(`: ping ${Date.now()}\n\n`);
        } catch {
          clearInterval(beat);
          deck.clients.delete(res);
        }
      }, 25_000);
      if (beat.unref) beat.unref();

      req.on("close", () => {
        clearInterval(beat);
        deck.clients.delete(res);
      });
      return undefined;
    }

    // ---- ações do painel ------------------------------------------------
    if (p === "/api/action" && req.method === "POST") {
      const provided = url.searchParams.get("t") || req.headers["x-deck-token"];
      if (!sec.safeEqual(provided, deck.token)) {
        deck.audit({ event: "token-invalido", ip });
        return sendJson(res, 401, { error: "token inválido" });
      }
      if (deck.allowList && !deck.allowList.test(ip)) {
        deck.audit({ event: "ip-bloqueado", ip });
        return sendJson(res, 403, { error: `origem ${ip} fora da faixa autorizada` });
      }
      if (!deck.limiter.take(ip)) {
        deck.audit({ event: "limite-excedido", ip });
        return sendJson(res, 429, { error: "muitas ações em pouco tempo" });
      }

      const b = await readBody(req);
      const result = await deck.runAction(String(b.action || ""), { by: ip });
      return sendJson(res, result.ok ? 200 : result.code || 500, result);
    }

    // ---- painel ---------------------------------------------------------
    if (req.method === "GET" || req.method === "HEAD") return serveStatic(req, res, p);
    return sendJson(res, 404, { error: "não encontrado" });
  });

  // Uma conexão SSE parada não pode ser derrubada pelo timeout padrão.
  server.headersTimeout = 0;
  server.requestTimeout = 0;
  server.keepAliveTimeout = 76_000;

  const timers = [];
  server.on("listening", () => {
    const tick = setInterval(() => deck.store.tick(), 20_000);
    const poll = setInterval(() => deck.pollOauth(), Math.max(60_000, cfg.oauthRefreshMs));
    const push = setInterval(() => deck.broadcast(), 10_000);
    for (const t of [tick, poll, push]) {
      if (t.unref) t.unref();
      timers.push(t);
    }
    deck.pollOauth();
  });

  server.on("close", () => {
    for (const t of timers) clearInterval(t);
    deck.gate.drain();
  });

  return { server, deck };
}

module.exports = { createServer, Deck, localIps, STATUS };
