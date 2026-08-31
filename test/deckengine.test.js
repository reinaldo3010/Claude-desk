"use strict";
/**
 * Testes do motor do deck.
 *
 * A promessa que estes testes protegem: o botão certo aparece na hora certa,
 * a face mostra um número que quer dizer alguma coisa, e nada disso pode
 * vazar o que a ação realmente digita.
 */

const test = require("node:test");
const assert = require("node:assert");

const { resolve, matches, readBadge, pagesOf } = require("../src/deckengine");
const actions = require("../src/actions");

/** Estado base plausível, sobrescrito por teste. */
function estado(over = {}) {
  const now = Date.now();
  return {
    now,
    status: "idle",
    since: now - 120_000,
    subagents: 0,
    counters: { tools: 7 },
    usage: { five: { pct: 30 }, seven: { pct: 55 }, totals: { costUsd: 1.5 } },
    gate: { pending: [] },
    config: { gateEnabled: true, hasTarget: true },
    sessions: [{ live: true, context: { used: 40 } }],
    ...over,
  };
}

/* ═══════════════════════════ condições ══════════════════════════════════ */

test("condição ausente significa sempre visível", () => {
  assert.equal(matches(undefined, estado()), true);
  assert.equal(matches({}, estado()), true);
  assert.equal(matches(null, estado()), true);
});

test("status é um conjunto: qualquer um dos listados serve", () => {
  assert.equal(matches({ status: ["idle", "working"] }, estado({ status: "idle" })), true);
  assert.equal(matches({ status: ["working"] }, estado({ status: "idle" })), false);
});

test("condições se combinam com E lógico", () => {
  const s = estado({ status: "working", sessions: [{ live: true, context: { used: 80 } }] });
  assert.equal(matches({ status: ["working"], contextAbove: 70 }, s), true);
  assert.equal(matches({ status: ["working"], contextAbove: 90 }, s), false);
  assert.equal(matches({ status: ["idle"], contextAbove: 70 }, s), false);
});

test("anyOf é o único OU do vocabulário", () => {
  const cond = { anyOf: [{ gate: true }, { gateEnabled: false }] };
  // portão ligado, nada pendente → não aparece
  assert.equal(matches(cond, estado()), false);
  // portão ligado com pendência → aparece
  assert.equal(matches(cond, estado({ gate: { pending: [{ id: "a" }] } })), true);
  // portão desligado → aparece sempre (vale o fallback de teclas)
  assert.equal(matches(cond, estado({ config: { gateEnabled: false } })), true);
});

test("limiares de quota e contexto", () => {
  assert.equal(matches({ fiveAbove: 90 }, estado()), false);
  assert.equal(matches({ fiveAbove: 90 }, estado({ usage: { five: { pct: 95 } } })), true);
  // sem leitura de quota, um limiar nunca dispara — melhor que disparar à toa
  assert.equal(matches({ fiveAbove: 50 }, estado({ usage: {} })), false);
});

test("contexto vem da primeira sessão VIVA, não de qualquer uma", () => {
  const s = estado({
    sessions: [
      { live: false, context: { used: 99 } },
      { live: true, context: { used: 20 } },
    ],
  });
  assert.equal(matches({ contextAbove: 50 }, s), false, "a sessão morta não conta");
});

test("estado incompleto não lança", () => {
  for (const ruim of [{}, { sessions: null }, { usage: null }, { gate: null }, { config: null }]) {
    assert.doesNotThrow(() => matches({ contextAbove: 10, gate: true, fiveAbove: 5 }, { ...ruim }));
  }
});

/* ═══════════════════════════ face viva ══════════════════════════════════ */

test("níveis do mostrador seguem os limiares declarados", () => {
  const b = { source: "context", format: "pct", warnAbove: 70, critAbove: 85 };
  const em = (v) => readBadge(b, estado({ sessions: [{ live: true, context: { used: v } }] })).level;
  assert.equal(em(40), "ok");
  assert.equal(em(75), "warn");
  assert.equal(em(90), "crit");
});

test("mostrador percentual traz a barra; os outros formatos não", () => {
  const pct = readBadge({ source: "five", format: "pct" }, estado());
  assert.equal(pct.bar, 30);
  const usd = readBadge({ source: "cost", format: "usd" }, estado());
  assert.equal(usd.bar, null);
  assert.equal(usd.value, 1.5);
});

test("mostrador sem dado devolve null em vez de zero", () => {
  assert.equal(readBadge({ source: "context" }, estado({ sessions: [] })), null);
  assert.equal(readBadge({ source: "five" }, estado({ usage: {} })), null);
  assert.equal(readBadge({ source: "inexistente" }, estado()), null);
  assert.equal(readBadge(null, estado()), null);
});

test("mostrador com condição só acende quando ela vale", () => {
  const b = { source: "elapsed", format: "duration", when: { status: ["working"] } };
  assert.equal(readBadge(b, estado({ status: "idle" })), null, "cronômetro parado não conta");
  assert.ok(readBadge(b, estado({ status: "working" })).value >= 119);
});

/* ═══════════════════════════ resolução ══════════════════════════════════ */

test("o deck muda de forma conforme o estado", () => {
  const acts = actions.build();
  const main = (st) => resolve(acts, st).filter((a) => a.page === "main").map((a) => a.id);

  const ocioso = main(estado({ status: "idle" }));
  const trabalhando = main(estado({ status: "working" }));
  const pedindo = main(estado({ status: "waiting", gate: { pending: [{ id: "p" }] } }));

  assert.ok(!ocioso.includes("allow"), "sem permissão pendente, não há o que aprovar");
  assert.ok(pedindo.includes("allow"), "com permissão pendente, o botão existe");
  assert.notDeepEqual(ocioso, trabalhando, "estados diferentes produzem decks diferentes");
});

test("urgentes vêm primeiro", () => {
  const acts = actions.build();
  const r = resolve(acts, estado({ status: "waiting", gate: { pending: [{ id: "p" }] } }));
  const primeiros = r.slice(0, 3).map((a) => a.id);
  for (const id of ["allow", "allow_always", "deny"]) {
    assert.ok(primeiros.includes(id), `${id} deveria estar no topo com permissão pendente`);
  }
});

test("ações secundárias não viram botão próprio", () => {
  const acts = actions.build();
  const ids = resolve(acts, estado({ status: "working" })).map((a) => a.id);
  for (const id of ["panic", "clear", "continue_hard"]) {
    assert.ok(!ids.includes(id), `${id} só existe como destino de toque longo`);
  }
});

test("toque longo aponta para uma ação que existe, com rótulo", () => {
  const acts = actions.build();
  const r = resolve(acts, estado({ status: "working" }));
  const interromper = r.find((a) => a.id === "interrupt");
  assert.equal(interromper.hold.id, "panic");
  assert.equal(interromper.hold.label, "Parar tudo");
});

test("a resolução NUNCA expõe teclas, texto ou passos", () => {
  const acts = actions.build();
  for (const st of ["idle", "working", "waiting", "error"]) {
    for (const b of resolve(acts, estado({ status: st, gate: { pending: [{ id: "p" }] } }))) {
      assert.ok(!("keys" in b), `${b.id} vazou keys`);
      assert.ok(!("text" in b), `${b.id} vazou text`);
      assert.ok(
        b.steps === undefined || typeof b.steps === "number",
        `${b.id} vazou o conteúdo dos passos`
      );
      assert.ok(!("decision" in b), `${b.id} vazou decision`);
    }
  }
});

test("keepVisible mantém o botão na tela, porém desabilitado", () => {
  const acts = [
    { id: "a", label: "A", kind: "text", text: "x", when: { status: ["working"] }, keepVisible: true },
    { id: "b", label: "B", kind: "text", text: "y", when: { status: ["working"] } },
  ];
  const r = resolve(acts, estado({ status: "idle" }));
  assert.equal(r.length, 1);
  assert.equal(r[0].id, "a");
  assert.equal(r[0].enabled, false);
});

/* ═══════════════════════════ abas ═══════════════════════════════════════ */

test("aba sem botão visível não aparece", () => {
  const acts = [
    { id: "a", label: "A", page: "main", kind: "text", text: "x" },
    { id: "b", label: "B", page: "prompts", kind: "text", text: "y", when: { status: ["working"] } },
  ];
  const abas = pagesOf(acts, estado({ status: "idle" })).map((p) => p.id);
  assert.deepEqual(abas, ["main"]);
  assert.deepEqual(pagesOf(acts, estado({ status: "working" })).map((p) => p.id), ["main", "prompts"]);
});

test("aba avisa quando tem algo urgente dentro", () => {
  const acts = actions.build();
  const abas = pagesOf(acts, estado({ status: "waiting", gate: { pending: [{ id: "p" }] } }));
  const main = abas.find((p) => p.id === "main");
  assert.equal(main.urgent, true);
  assert.equal(main.label, "Controle");
});

test("todas as páginas do catálogo têm rótulo em português", () => {
  const acts = actions.build();
  const abas = pagesOf(acts, estado({ status: "idle" }));
  for (const p of abas) {
    assert.notEqual(p.label, p.id, `a página "${p.id}" está sem rótulo`);
  }
});

/* ═══════════════════════════ sequências ═════════════════════════════════ */

test("sequência que aponta para ação inexistente é removida com aviso", () => {
  const avisos = [];
  const list = actions.build(
    [{ id: "x", label: "X", kind: "chain", steps: [{ action: "nao_existe" }] }],
    (w) => avisos.push(w)
  );
  assert.ok(!list.some((a) => a.id === "x"));
  assert.match(avisos.join(" "), /nao_existe/);
});

test("sequência de sequência é recusada na montagem", () => {
  const avisos = [];
  const list = actions.build(
    [{ id: "x", label: "X", kind: "chain", steps: [{ action: "panic" }] }],
    (w) => avisos.push(w)
  );
  assert.ok(!list.some((a) => a.id === "x"));
  assert.match(avisos.join(" "), /também é uma sequência/);
});

test("toque longo apontando para o nada é desarmado, não derruba o deck", () => {
  const avisos = [];
  const list = actions.build(
    [{ id: "x", label: "X", kind: "text", text: "oi", hold: "fantasma" }],
    (w) => avisos.push(w)
  );
  const x = list.find((a) => a.id === "x");
  assert.ok(x, "a ação continua existindo");
  assert.equal(x.hold, undefined, "só o toque longo foi desligado");
  assert.match(avisos.join(" "), /fantasma/);
});

test("sequência com pausa fora da faixa é recusada", () => {
  const errs = actions.validate({
    id: "x",
    label: "X",
    kind: "chain",
    steps: [{ wait: 99999 }],
  });
  assert.match(errs.join(" "), /wait fora de/);
});

test("o catálogo embutido é válido de ponta a ponta", () => {
  const avisos = [];
  const list = actions.build([], (w) => avisos.push(w));
  assert.deepEqual(avisos, [], "nenhuma ação embutida pode falhar na validação");
  for (const a of list) {
    assert.deepEqual(actions.validate(a, list), [], `ação "${a.id}" inválida`);
  }
});
