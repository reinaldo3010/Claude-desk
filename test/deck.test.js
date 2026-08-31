"use strict";
/**
 * Testes do portão de permissão, da máquina de estados e do servidor HTTP.
 *
 * O que estes testes protegem, em uma frase: o deck nunca pode aprovar nada
 * por omissão, e nunca pode travar o Claude Code.
 */

const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { PermissionGate, describe: describeReq, assessRisk } = require("../src/gate");
const { DeckStore, STATUS } = require("../src/store");
const settings = require("../src/settings");
const { createServer } = require("../src/server");
const { load } = require("../src/config");

/* ═══════════════════════════════ portão ═════════════════════════════════ */

test("portão desligado devolve na hora — o terminal decide como sempre", async () => {
  const g = new PermissionGate({ holdMs: 0 });
  const t0 = Date.now();
  const r = await g.open({ tool_name: "Bash", tool_input: { command: "ls" } }).promise;
  assert.equal(r, null, "sem decisão remota");
  assert.ok(Date.now() - t0 < 100, "não segura ninguém");
});

test("portão ligado devolve a decisão tomada no painel", async () => {
  const g = new PermissionGate({ holdMs: 5000 });
  const { promise } = g.open({ tool_name: "Bash", tool_input: { command: "npm test" } });
  assert.equal(g.snapshot().pending.length, 1);
  g.decide("allow", "tablet");
  const r = await promise;
  assert.equal(r.decision, "allow");
  assert.equal(r.hookSpecificOutput.permissionDecision, "allow");
  assert.equal(r.hookSpecificOutput.hookEventName, "PermissionRequest");
  assert.equal(g.snapshot().pending.length, 0);
});

test("tempo esgotado NUNCA aprova — devolve ao terminal", async () => {
  const g = new PermissionGate({ holdMs: 120 });
  const r = await g.open({ tool_name: "Write", tool_input: { file_path: "/etc/passwd" } }).promise;
  assert.equal(r, null, "silêncio significa perguntar, não permitir");
});

test("fila cheia devolve na hora em vez de empilhar o Claude Code", async () => {
  const g = new PermissionGate({ holdMs: 9000, maxPending: 2 });
  g.open({ tool_name: "Read", tool_input: {} });
  g.open({ tool_name: "Read", tool_input: {} });
  const t0 = Date.now();
  const r = await g.open({ tool_name: "Read", tool_input: {} }).promise;
  assert.equal(r, null);
  assert.ok(Date.now() - t0 < 100, "o terceiro não espera");
  g.drain();
});

test("decidir duas vezes o mesmo pedido não vale", () => {
  const g = new PermissionGate({ holdMs: 5000 });
  g.open({ tool_name: "Bash", tool_input: { command: "ls" } });
  assert.equal(g.decide("allow").ok, true);
  assert.equal(g.decide("deny").ok, false, "já foi decidido");
});

test("decisão inválida é recusada", () => {
  const g = new PermissionGate({ holdMs: 5000 });
  g.open({ tool_name: "Bash", tool_input: {} });
  assert.equal(g.decide("talvez").ok, false);
  g.drain();
});

test("encerrar o servidor libera todos os pendentes sem aprovar", async () => {
  const g = new PermissionGate({ holdMs: 60000 });
  const p1 = g.open({ tool_name: "Bash", tool_input: {} }).promise;
  const p2 = g.open({ tool_name: "Write", tool_input: {} }).promise;
  g.drain();
  assert.deepEqual(await Promise.all([p1, p2]), [null, null]);
});

test("resumo do pedido extrai o que importa de cada tipo de ferramenta", () => {
  assert.equal(describeReq({ tool_name: "Bash", tool_input: { command: "rm -rf /" } }).detail, "rm -rf /");
  assert.equal(describeReq({ tool_name: "Read", tool_input: { file_path: "/a/b" } }).detail, "/a/b");
  assert.equal(describeReq({ tool_name: "WebFetch", tool_input: { url: "https://x" } }).detail, "https://x");
  assert.equal(describeReq({ tool_name: "X", tool_input: {} }).detail, null);
  assert.equal(describeReq(null).tool, "ferramenta");
});

test("heurística de risco marca o que merece um segundo olhar", () => {
  const risk = (tool, input) => assessRisk(describeReq({ tool_name: tool, tool_input: input })).level;
  assert.equal(risk("Bash", { command: "rm -rf build" }), "high");
  assert.equal(risk("Bash", { command: "git push --force" }), "high");
  assert.equal(risk("Bash", { command: "sudo apt install" }), "high");
  assert.equal(risk("Read", { file_path: "/app/.env" }), "high", "segredo é risco alto mesmo em leitura");
  assert.equal(risk("Bash", { command: "ls -la" }), "medium");
  assert.equal(risk("Write", { file_path: "/tmp/a" }), "medium");
  assert.equal(risk("Read", { file_path: "/etc/hosts" }), "low");
});

/* ════════════════════════ máquina de estados ════════════════════════════ */

test("ciclo de vida completo de uma volta", () => {
  const s = new DeckStore();
  assert.equal(s.status, STATUS.OFFLINE);

  s.ingest("SessionStart", { session_id: "a", start_reason: "startup" });
  assert.equal(s.status, STATUS.IDLE);

  s.ingest("UserPromptSubmit", { session_id: "a", prompt: "conserta o build", turn_number: 1 });
  assert.equal(s.status, STATUS.WORKING);

  s.ingest("PreToolUse", { session_id: "a", tool_name: "Bash" });
  assert.equal(s.activeTool.tool, "Bash");
  assert.equal(s.detail, "rodando comando");

  s.ingest("PostToolUse", { session_id: "a", tool_name: "Bash" });
  assert.equal(s.activeTool, null);

  s.ingest("Stop", { session_id: "a", last_assistant_message: "Pronto." });
  assert.equal(s.status, STATUS.IDLE);
  assert.equal(s.detail, "Pronto.");

  s.ingest("SessionEnd", { session_id: "a", end_reason: "clear" });
  assert.equal(s.status, STATUS.OFFLINE);
});

test("notificação de permissão vira estado de espera; as outras não", () => {
  const s = new DeckStore();
  s.ingest("Notification", { session_id: "a", notification_type: "auth_success", message: "logado" });
  assert.notEqual(s.status, STATUS.WAITING, "aviso de login não é pedido de atenção");

  s.ingest("Notification", { session_id: "a", notification_type: "permission_prompt", message: "quer rodar npm" });
  assert.equal(s.status, STATUS.WAITING);
  assert.equal(s.detail, "quer rodar npm");
});

test("StopFailure traduz o tipo de erro", () => {
  const s = new DeckStore();
  s.ingest("StopFailure", { session_id: "a", error_type: "rate_limit" });
  assert.equal(s.status, STATUS.ERROR);
  assert.equal(s.headline, "Limite de uso atingido");
  assert.equal(s.counters.errors, 1);
});

test("evento desconhecido de uma versão futura não quebra nada", () => {
  const s = new DeckStore();
  assert.doesNotThrow(() => s.ingest("EventoQueAindaNaoExiste", { session_id: "a" }));
  assert.doesNotThrow(() => s.ingest("Stop", null));
  assert.doesNotThrow(() => s.ingest("", {}));
});

test("subagentes são contados e descontados", () => {
  const s = new DeckStore();
  s.ingest("SubagentStart", { session_id: "a", agent_id: "g1", agent_type: "Explore" });
  s.ingest("SubagentStart", { session_id: "a", agent_id: "g2", agent_type: "Plan" });
  assert.equal(s.subagents.size, 2);
  s.ingest("SubagentStop", { session_id: "a", agent_id: "g1" });
  assert.equal(s.subagents.size, 1);
});

test("alerta de espera expira sozinho — não grita a noite inteira", () => {
  const s = new DeckStore({ waitingTtlMs: 1000 });
  s.ingest("Notification", { session_id: "a", notification_type: "permission_prompt", message: "oi" });
  assert.equal(s.status, STATUS.WAITING);
  assert.equal(s.tick(Date.now() + 2000), true);
  assert.equal(s.status, STATUS.IDLE);
});

test("registro de eventos tem teto", () => {
  const s = new DeckStore({ eventLogSize: 5 });
  for (let i = 0; i < 50; i++) s.ingest("TaskCreated", { session_id: "a", task_summary: `t${i}` });
  assert.equal(s.log.length, 5);
});

/* ════════════════════════════ settings.json ═════════════════════════════ */

test("instalação mescla, é idempotente e reversível", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "deck-set-"));
  const file = path.join(dir, "settings.json");
  const prev = process.env.CLAUDE_SETTINGS;
  process.env.CLAUDE_SETTINGS = file;

  fs.writeFileSync(file, JSON.stringify({
    model: "opus",
    hooks: { PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "meu-linter.sh" }] }] },
  }));

  const cfg = settings.buildConfig({ baseUrl: "http://127.0.0.1:8788", statuslinePath: "/x/s.js" });
  settings.install(cfg);
  settings.install(cfg);
  settings.install(cfg);

  const after = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.equal(after.model, "opus", "configuração alheia é preservada");
  assert.equal(after.hooks.PreToolUse.length, 2, "três instalações não duplicam");
  assert.equal(after.hooks.PreToolUse[0].hooks[0].command, "meu-linter.sh", "hook de terceiro sobrevive");
  assert.equal(after.hooks.PreToolUse[1].hooks[0].async, true, "nossos hooks são assíncronos");

  settings.uninstall();
  const clean = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.equal(clean.hooks.PreToolUse.length, 1, "só o hook de terceiro fica");
  assert.equal(clean.statusLine, undefined);
  assert.equal(clean.model, "opus");

  process.env.CLAUDE_SETTINGS = prev;
  fs.rmSync(dir, { recursive: true, force: true });
});

test("settings.json corrompido faz a instalação recusar, não sobrescrever", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "deck-set-"));
  const file = path.join(dir, "settings.json");
  const prev = process.env.CLAUDE_SETTINGS;
  process.env.CLAUDE_SETTINGS = file;
  fs.writeFileSync(file, '{"model": "opus", quebrado');

  const cfg = settings.buildConfig({ baseUrl: "http://x", statuslinePath: "/x/s.js" });
  assert.throws(() => settings.install(cfg), /não é JSON válido/);
  assert.equal(fs.readFileSync(file, "utf8"), '{"model": "opus", quebrado', "arquivo intacto");

  process.env.CLAUDE_SETTINGS = prev;
  fs.rmSync(dir, { recursive: true, force: true });
});

test("hooks do deck são assíncronos: o deck desligado não atrasa o Claude Code", () => {
  const cfg = settings.buildConfig({ baseUrl: "http://127.0.0.1:8788", statuslinePath: "/x/s.js" });
  for (const [nome, grupos] of Object.entries(cfg.hooks)) {
    const h = grupos[0].hooks[0];
    assert.equal(h.async, true, `${nome} precisa ser assíncrono`);
    assert.ok(h.timeout <= 5, `${nome} precisa de timeout curto`);
  }
});

test("com o portão ligado, só o PermissionRequest é síncrono", () => {
  const cfg = settings.buildConfig({ baseUrl: "http://x", statuslinePath: "/s.js", gate: true, gateTimeout: 90 });
  const pr = cfg.hooks.PermissionRequest[0].hooks[0];
  assert.equal(pr.async, undefined, "a resposta dele carrega a decisão");
  assert.equal(pr.timeout, 90);
  assert.equal(cfg.hooks.Stop[0].hooks[0].async, true, "os demais seguem assíncronos");
});

/* ═════════════════════════════ servidor HTTP ════════════════════════════ */

/** Sobe o servidor numa porta livre e devolve helpers. */
async function withServer(overrides, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "deck-srv-"));
  const prevEnv = { ...process.env };
  Object.assign(process.env, {
    DECK_STATE_DIR: dir,
    DECK_TOKEN: "token-de-teste",
    DECK_INJECTOR: "dry",
    DECK_TARGET: "janela-de-teste",
    DECK_PORT: "0",
    ...overrides,
  });
  const cfg = load();
  const { server, deck } = createServer(cfg);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    await fn({ base, deck, cfg });
  } finally {
    await new Promise((r) => server.close(r));
    process.env = prevEnv;
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const post = (base, p, body) =>
  fetch(base + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

test("servidor: /api/action exige token", async () => {
  await withServer({}, async ({ base }) => {
    assert.equal((await post(base, "/api/action", { action: "interrupt" })).status, 401);
    assert.equal((await post(base, "/api/action?t=errado", { action: "interrupt" })).status, 401);
    const ok = await post(base, "/api/action?t=token-de-teste", { action: "interrupt" });
    assert.equal(ok.status, 200);
    assert.equal((await ok.json()).ok, true);
  });
});

test("servidor: ação inexistente devolve 404, não 500", async () => {
  await withServer({}, async ({ base }) => {
    const r = await post(base, "/api/action?t=token-de-teste", { action: "apagar-tudo" });
    assert.equal(r.status, 404);
  });
});

test("servidor: faixa de IP bloqueia mesmo com token certo", async () => {
  await withServer({ DECK_ALLOW_FROM: "10.99.0.0/24" }, async ({ base }) => {
    const r = await post(base, "/api/action?t=token-de-teste", { action: "interrupt" });
    assert.equal(r.status, 403, "127.0.0.1 está fora da faixa configurada");
  });
});

test("servidor: limite por minuto responde 429", async () => {
  await withServer({ DECK_RATE_LIMIT: "3" }, async ({ base }) => {
    const codes = [];
    for (let i = 0; i < 5; i++) {
      codes.push((await post(base, "/api/action?t=token-de-teste", { action: "interrupt" })).status);
    }
    assert.deepEqual(codes, [200, 200, 200, 429, 429]);
  });
});

test("servidor: hooks só aceitam conexão local e alimentam o estado", async () => {
  await withServer({}, async ({ base, deck }) => {
    await post(base, "/api/hook", { hook_event_name: "UserPromptSubmit", session_id: "a", prompt: "oi" });
    assert.equal(deck.store.status, "working");
    const r = await fetch(base + "/api/state");
    const s = await r.json();
    assert.equal(s.status, "working");
    assert.ok(Array.isArray(s.actions));
    assert.ok(s.actions.every((a) => !("keys" in a) && !("text" in a)), "a API nunca expõe as teclas");
  });
});

test("servidor: corpo inválido não derruba a rota", async () => {
  await withServer({}, async ({ base }) => {
    const r = await fetch(base + "/api/hook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{ isso não é json",
    });
    assert.equal(r.status, 400, "sem hook_event_name devolve 400, não explode");
  });
});

test("servidor: não serve arquivo fora da pasta pública", async () => {
  await withServer({}, async ({ base }) => {
    for (const p of ["/../src/server.js", "/..%2fpackage.json", "/../../etc/passwd"]) {
      const r = await fetch(base + p);
      assert.ok(r.status === 404 || r.status === 403, `${p} precisa ser recusado (veio ${r.status})`);
    }
  });
});

test("servidor: /api/health responde sem token", async () => {
  await withServer({}, async ({ base }) => {
    const r = await fetch(base + "/api/health");
    assert.equal(r.status, 200);
    const h = await r.json();
    assert.equal(h.ok, true);
    assert.equal(h.injector, "dry");
  });
});

test("servidor: SSE entrega o estado inicial e depois as mudanças", async () => {
  await withServer({}, async ({ base }) => {
    const ctrl = new AbortController();
    const res = await fetch(base + "/api/stream", { signal: ctrl.signal });
    assert.ok(res.headers.get("content-type").includes("text/event-stream"));

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";

    // Primeiro quadro: estado atual.
    while (!buf.includes("event: state")) buf += dec.decode((await reader.read()).value);
    assert.ok(buf.includes("event: state"));

    // Um hook precisa gerar um quadro novo.
    buf = "";
    await post(base, "/api/hook", { hook_event_name: "Stop", session_id: "a", last_assistant_message: "feito" });
    const started = Date.now();
    while (!buf.includes("feito") && Date.now() - started < 4000) {
      buf += dec.decode((await reader.read()).value);
    }
    assert.ok(buf.includes("feito"), "a mudança foi empurrada sem polling");
    ctrl.abort();
  });
});

/* ═══════════════════════════ sequências no servidor ═════════════════════ */

test("servidor: sequência executa os passos em ordem", async () => {
  await withServer({}, async ({ base, deck }) => {
    const r = await post(base, "/api/action?t=token-de-teste", { action: "panic" });
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.ok, true);
    assert.equal(body.via, "chain");
    assert.deepEqual(body.steps, ["interrupt", "interrupt"]);
  });
});

test("servidor: passo que falha aborta o resto da sequência", async () => {
  // Injetor real sem alvo: a injeção recusa em vez de digitar na janela em
  // foco. O injetor simulado não serviria aqui, porque ele não checa alvo.
  await withServer({ DECK_INJECTOR: "xdotool", DECK_TARGET: "" }, async ({ base }) => {
    const r = await post(base, "/api/action?t=token-de-teste", { action: "panic" });
    assert.equal(r.status, 500);
    const body = await r.json();
    assert.equal(body.ok, false);
    assert.match(body.error, /passo "interrupt"/);
  });
});

test("servidor: o estado carrega deck resolvido e abas", async () => {
  await withServer({}, async ({ base }) => {
    const s = await (await fetch(base + "/api/state")).json();
    assert.ok(Array.isArray(s.actions), "actions presente");
    assert.ok(Array.isArray(s.pages), "pages presente");
    assert.ok(s.pages.length >= 2, "mais de uma aba");
    for (const a of s.actions) {
      assert.ok(!("keys" in a) && !("text" in a), `${a.id} vazou conteúdo`);
      assert.ok(typeof a.enabled === "boolean");
    }
  });
});

test("servidor: o deck responde ao estado sem reiniciar nada", async () => {
  await withServer({}, async ({ base }) => {
    // A assinatura estrutural é o que o painel usa para decidir se remonta a
    // grade: quais botões, habilitados e urgentes. Comparar só os ids não
    // serviria — um botão pode virar urgente sem trocar de posição.
    const assinatura = (s) =>
      s.actions.map((a) => `${a.id}:${a.enabled ? 1 : 0}:${a.urgent ? 1 : 0}`).join("|");

    const antes = assinatura(await (await fetch(base + "/api/state")).json());
    await post(base, "/api/hook", {
      hook_event_name: "Notification",
      session_id: "a",
      notification_type: "permission_prompt",
      message: "quer rodar npm",
    });
    const depois = assinatura(await (await fetch(base + "/api/state")).json());
    assert.notEqual(antes, depois, "mudar de estado precisa mudar o deck");
    assert.match(depois, /allow:1:1/, "os botões de decisão sobem quando o Claude espera");
  });
});
