"use strict";
/**
 * Testes do parser de uso.
 *
 * A regra que estes testes protegem: o parser NUNCA pode derrubar o servidor.
 * O painel fica meses ligado; um JSON pego no meio de uma escrita, um campo
 * que sumiu numa atualização ou um percentual em outra escala não podem virar
 * exceção. No pior caso o medidor mostra "--".
 */

const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { parseStatusline, readSessions, aggregate, History, scanUnknown } = require("../src/usage");
const { normalizePercent, toEpochMs } = require("../src/util");

const epoch = (offsetSec) => Math.floor(Date.now() / 1000) + offsetSec;

test("formato oficial do statusLine é lido corretamente", () => {
  const s = parseStatusline({
    session_id: "abc",
    model: { id: "claude-opus-5", display_name: "Opus" },
    version: "2.1.90",
    rate_limits: {
      five_hour: { used_percentage: 23.5, resets_at: epoch(3600) },
      seven_day: { used_percentage: 41.2, resets_at: epoch(86400) },
      spend_limit: { used_percentage: 62.8, resets_at: epoch(200000) },
    },
    context_window: { used_percentage: 8, context_window_size: 200000 },
    cost: { total_cost_usd: 0.0123, total_lines_added: 156 },
  });
  assert.equal(s.limits.five_hour.pct, 23.5);
  assert.equal(s.limits.seven_day.pct, 41.2);
  assert.equal(s.limits.spend_limit.pct, 62.8);
  assert.equal(s.limitsSource, "statusline");
  assert.equal(s.model, "Opus");
  assert.equal(s.context.used, 8);
  assert.equal(s.cost.usd, 0.0123);
});

test("campos ausentes não quebram nada — a documentação marca quase tudo como opcional", () => {
  const s = parseStatusline({ session_id: "x" });
  assert.equal(s.limits.five_hour, undefined);
  assert.equal(s.limitsSource, null);
  assert.equal(s.model, null);
  assert.equal(s.context.used, null);
});

test("percentual em escala 0..1 vira 0..100, mas 1 continua sendo 1%", () => {
  assert.equal(normalizePercent(0.47), 47);
  assert.equal(normalizePercent(0.999), 99.9);
  assert.equal(normalizePercent(1), 1, "1 é um por cento, não cem");
  assert.equal(normalizePercent(47), 47);
  assert.equal(normalizePercent("47%"), 47);
  assert.equal(normalizePercent(null), null);
  assert.equal(normalizePercent(-3), null);
  assert.equal(normalizePercent(NaN), null);
});

test("reset aceita epoch em segundos, em ms e ISO", () => {
  const target = Date.UTC(2026, 8, 1, 10, 0, 0);
  assert.equal(toEpochMs(target / 1000), target);
  assert.equal(toEpochMs(target), target);
  assert.equal(toEpochMs("2026-09-01T10:00:00.000Z"), target);
  assert.equal(toEpochMs("nem data"), null);
  assert.equal(toEpochMs(null), null);
  assert.equal(toEpochMs(0), null);
});

test("valores nulos no meio do objeto não lançam", () => {
  assert.doesNotThrow(() => {
    parseStatusline({
      rate_limits: { five_hour: null, seven_day: { used_percentage: null, resets_at: null } },
      context_window: null,
      cost: null,
      model: null,
    });
  });
});

test("entrada que não é objeto devolve null em vez de explodir", () => {
  for (const bad of [null, undefined, "texto", 42, true, []]) {
    assert.doesNotThrow(() => parseStatusline(bad));
  }
  assert.equal(parseStatusline("texto"), null);
  assert.equal(parseStatusline(42), null);
});

test("formato antigo de terceiros ainda é reconhecido pela varredura", () => {
  const s = parseStatusline({
    claude: {
      session: { utilization: 0.47, resets_at: "2026-09-01T10:00:00Z" },
      weekly: { utilization: 88 },
    },
  });
  assert.equal(s.limits.five_hour.pct, 47);
  assert.equal(s.limits.seven_day.pct, 88);
  assert.equal(s.limitsSource, "scan");
});

test("context_window nunca é confundido com quota do plano", () => {
  const s = parseStatusline({ context_window: { used_percentage: 73 }, session_id: "x" });
  assert.equal(s.limits.five_hour, undefined, "uso de contexto não é limite de plano");
  assert.equal(s.limitsSource, null);
  assert.equal(s.context.used, 73);
});

test("o formato oficial tem prioridade sobre a varredura tolerante", () => {
  const s = parseStatusline({
    rate_limits: { five_hour: { used_percentage: 12, resets_at: epoch(600) } },
    session: { utilization: 99 },
  });
  assert.equal(s.limits.five_hour.pct, 12);
  assert.equal(s.limitsSource, "statusline");
});

test("varredura ignora objeto muito profundo sem travar", () => {
  let deep = { v: 1 };
  for (let i = 0; i < 2000; i++) deep = { nested: deep };
  const started = Date.now();
  assert.doesNotThrow(() => scanUnknown(deep));
  assert.ok(Date.now() - started < 2000, "varredura precisa ter guarda de profundidade");
});

test("JSON corrompido no disco é ignorado, não derruba a leitura", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "deck-test-"));
  fs.writeFileSync(path.join(dir, "bom.json"), JSON.stringify({
    at: Date.now(),
    payload: { session_id: "bom", rate_limits: { five_hour: { used_percentage: 30, resets_at: epoch(900) } } },
  }));
  // Escrita interrompida no meio: exatamente o que acontece se o PC desliga.
  fs.writeFileSync(path.join(dir, "torto.json"), '{"at":123,"payload":{"session_id":"tort');
  fs.writeFileSync(path.join(dir, "vazio.json"), "");
  fs.writeFileSync(path.join(dir, "ignorado.txt"), "não é json");

  const sessions = readSessions(dir, 60_000);
  assert.equal(sessions.length, 1, "só o snapshot íntegro entra");
  assert.equal(sessions[0].sessionId, "bom");

  const agg = aggregate({ sessions });
  assert.equal(agg.ok, true);
  assert.equal(agg.limits.five_hour.pct, 30);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("diretório inexistente devolve lista vazia", () => {
  assert.deepEqual(readSessions("/nao/existe/mesmo", 60_000), []);
});

test("sessão velha demais some do painel", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "deck-test-"));
  const f = path.join(dir, "velha.json");
  fs.writeFileSync(f, JSON.stringify({ at: 1, payload: { session_id: "velha" } }));
  const old = Date.now() - 3600_000;
  fs.utimesSync(f, old / 1000, old / 1000);
  assert.equal(readSessions(dir, 60_000).length, 0);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("janela cujo reset já passou é descartada em vez de mentir", () => {
  const sessions = [{
    at: Date.now(),
    limits: { five_hour: { pct: 90, resetsAt: Date.now() - 10 * 60_000 }, seven_day: null, spend_limit: null },
    limitsSource: "statusline",
    cost: {},
  }];
  const agg = aggregate({ sessions });
  assert.equal(agg.limits.five_hour, null, "número de uma janela expirada não pode ser exibido");
});

test("limites vêm do snapshot mais recente entre várias sessões", () => {
  const now = Date.now();
  const sessions = [
    { at: now, limits: { five_hour: { pct: 10, resetsAt: now + 3600_000 } }, limitsSource: "statusline", cost: { usd: 1 } },
    { at: now - 60_000, limits: { five_hour: { pct: 90, resetsAt: now + 3600_000 } }, limitsSource: "statusline", cost: { usd: 2 } },
  ];
  const agg = aggregate({ sessions, now });
  assert.equal(agg.limits.five_hour.pct, 10, "limite é da conta: vale o mais novo");
  assert.equal(agg.totals.costUsd, 3, "custo é por sessão: soma");
});

test("cache OAuth só preenche janela que faltou", () => {
  const now = Date.now();
  const sessions = [{ at: now, limits: { five_hour: { pct: 10, resetsAt: now + 3600_000 } }, limitsSource: "statusline", cost: {} }];
  const oauth = { at: now, limits: { five_hour: { pct: 77, resetsAt: now + 3600_000 }, seven_day: { pct: 55, resetsAt: now + 86400_000 } } };
  const agg = aggregate({ sessions, oauth, now });
  assert.equal(agg.limits.five_hour.pct, 10, "statusLine é mais confiável que o endpoint");
  assert.equal(agg.limits.seven_day.pct, 55, "mas o endpoint cobre o buraco");
});

test("taxa de queima e projeção de esgotamento", () => {
  const h = new History(50);
  const t0 = Date.now() - 3600_000;
  h.push(t0, 10, 5);
  h.push(t0 + 1800_000, 25, 6);
  h.push(Date.now(), 40, 7);
  const b = h.burn("five", 3.6e6);
  assert.equal(b.rate, 30, "30 pontos percentuais por hora");
  assert.ok(b.exhaustAt > Date.now(), "projeta o esgotamento no futuro");
});

test("queda de percentual significa reset da janela, não taxa negativa", () => {
  const h = new History(50);
  const t0 = Date.now() - 3600_000;
  h.push(t0, 90, 50);
  h.push(Date.now(), 5, 51);
  assert.equal(h.burn("five", 3.6e6).rate, null, "sem projeção depois de um reset");
});

test("histórico tem teto e amostra no máximo uma vez por minuto", () => {
  const h = new History(10);
  const base = Date.now();
  for (let i = 0; i < 100; i++) h.push(base + i * 61_000, i, i);
  assert.equal(h.points.length, 10);
  const h2 = new History(10);
  h2.push(base, 5, 5);
  h2.push(base + 1000, 5, 5);
  assert.equal(h2.points.length, 1, "valor igual em menos de um minuto não vira ponto novo");
});
