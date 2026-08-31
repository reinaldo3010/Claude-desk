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
    config: { gateEnabled: true, hasTarget: true, surface: "terminal" },
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

/* ═══════════════════ seletores de modelo e esforço ══════════════════════ */

/** Estado com uma sessão viva usando modelo e esforço dados. */
function comSessao(modelId, effort, fastMode = false) {
  return estado({
    sessions: [{ live: true, model: modelId, modelId, effort, fastMode, context: { used: 30 } }],
  });
}

test("o botão do modelo em uso acende", () => {
  const acts = actions.build();
  const aceso = (st) =>
    resolve(acts, st).filter((a) => a.page === "modelo" && a.active).map((a) => a.id);

  assert.deepEqual(aceso(comSessao("claude-opus-5", "high")), ["m_opus"]);
  assert.deepEqual(aceso(comSessao("claude-sonnet-5", "high")), ["m_sonnet"]);
  assert.deepEqual(aceso(comSessao("claude-haiku-4-5", "high")), ["m_haiku"]);
  assert.deepEqual(aceso(comSessao("claude-fable-5", "high")), ["m_fable"]);
});

test("família é reconhecida pelo nome de exibição também, não só pelo id", () => {
  const acts = actions.build();
  const st = estado({ sessions: [{ live: true, model: "Opus", modelId: null, effort: "high" }] });
  assert.ok(resolve(acts, st).find((a) => a.id === "m_opus").active);
});

test("HONESTIDADE: apelidos da mesma família não acendem sozinhos", () => {
  // O statusLine informa o modelo RESOLVIDO, não o apelido digitado. Com
  // "opus", "opus[1m]" e "opusplan" resolvendo para a mesma família, acender
  // os três seria mentira e acender o errado seria pior.
  const acts = actions.build();
  const acesos = resolve(acts, comSessao("claude-opus-5", "high"))
    .filter((a) => a.active)
    .map((a) => a.id);
  assert.ok(!acesos.includes("m_opus1m"));
  assert.ok(!acesos.includes("m_opusplan"));
  assert.ok(!acesos.includes("m_best"));
});

test("sem sessão viva, nenhum modelo acende", () => {
  const acts = actions.build();
  const st = estado({ sessions: [{ live: false, model: "Opus", modelId: "claude-opus-5" }] });
  assert.equal(resolve(acts, st).filter((a) => a.active).length, 0);
  assert.equal(resolve(acts, estado({ sessions: [] })).filter((a) => a.active).length, 0);
});

test("o nível de esforço em uso acende", () => {
  const acts = actions.build();
  const aceso = (nivel) =>
    resolve(acts, comSessao("claude-opus-5", nivel))
      .filter((a) => a.page === "esforco" && a.active)
      .map((a) => a.id);

  assert.deepEqual(aceso("low"), ["e_low"]);
  assert.deepEqual(aceso("medium"), ["e_medium"]);
  assert.deepEqual(aceso("high"), ["e_high"]);
  assert.deepEqual(aceso("max"), ["e_max"]);
});

test("HONESTIDADE: ultracode é reportado como xhigh e acende 'Extra'", () => {
  // Documentado: ultracode não é um nível distinto do modelo, ele reporta
  // xhigh. Não dá para distinguir daqui, e o rótulo do botão diz isso.
  const acts = actions.build();
  const acesos = resolve(acts, comSessao("claude-opus-5", "xhigh"))
    .filter((a) => a.page === "esforco" && a.active)
    .map((a) => a.id);
  assert.deepEqual(acesos, ["e_xhigh"]);
  assert.ok(!acesos.includes("e_ultracode"), "ultracode não é distinguível de xhigh");
});

test("modo turbo acende quando está ligado", () => {
  const acts = actions.build();
  const ligado = resolve(acts, comSessao("claude-opus-5", "high", true));
  assert.ok(ligado.find((a) => a.id === "e_fast").active);
  const desligado = resolve(acts, comSessao("claude-opus-5", "high", false));
  assert.ok(!desligado.find((a) => a.id === "e_fast").active);
});

test("trocar de modelo troca qual botão acende, e só um por vez", () => {
  const acts = actions.build();
  for (const id of ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5", "claude-fable-5"]) {
    const acesos = resolve(acts, comSessao(id, "high")).filter(
      (a) => a.page === "modelo" && a.active
    );
    assert.equal(acesos.length, 1, `${id} deveria acender exatamente um botão`);
  }
});

test("as abas de modelo e esforço existem e têm rótulo", () => {
  const acts = actions.build();
  const abas = pagesOf(acts, comSessao("claude-opus-5", "high"));
  const porId = Object.fromEntries(abas.map((p) => [p.id, p.label]));
  assert.equal(porId.modelo, "Modelo");
  assert.equal(porId.esforco, "Esforço");
});

test("os comandos digitados são exatamente os documentados", () => {
  // Estes textos vão direto para o terminal. Um apelido inventado viraria um
  // comando inválido silencioso, então a lista fica travada por teste.
  const acts = actions.build();
  const cmd = (id) => acts.find((a) => a.id === id).text;

  assert.equal(cmd("m_opus"), "/model opus");
  assert.equal(cmd("m_sonnet"), "/model sonnet");
  assert.equal(cmd("m_haiku"), "/model haiku");
  assert.equal(cmd("m_fable"), "/model fable");
  assert.equal(cmd("m_best"), "/model best");
  assert.equal(cmd("m_opusplan"), "/model opusplan");
  assert.equal(cmd("m_opus1m"), "/model opus[1m]");
  assert.equal(cmd("m_default"), "/model default");

  assert.equal(cmd("e_low"), "/effort low");
  assert.equal(cmd("e_medium"), "/effort medium");
  assert.equal(cmd("e_high"), "/effort high");
  assert.equal(cmd("e_xhigh"), "/effort xhigh");
  assert.equal(cmd("e_max"), "/effort max");
  assert.equal(cmd("e_ultracode"), "/effort ultracode");
  assert.equal(cmd("e_auto"), "/effort auto");
  assert.equal(cmd("e_fast"), "/fast");
});

test("os colchetes de opus[1m] sobrevivem à sanitização", () => {
  const { sanitizeText } = require("../src/inject");
  assert.equal(sanitizeText("/model opus[1m]"), "/model opus[1m]");
});

/* ═══════════════════ superfície: desktop x terminal ═════════════════════ */

function noDesktop(over = {}) {
  const base = estado(over);
  base.config = { ...base.config, surface: "desktop" };
  return base;
}

test("cada superfície mostra só os botões que funcionam nela", () => {
  const acts = actions.build();
  const term = resolve(acts, estado()).map((a) => a.id);
  const desk = resolve(acts, noDesktop()).map((a) => a.id);

  // barra no terminal, acorde no desktop — nunca os dois juntos
  assert.ok(term.includes("m_opus") && !term.includes("d_opus"));
  assert.ok(desk.includes("d_opus") && !desk.includes("m_opus"));
});

test("Shift+Tab não aparece no desktop — lá ele não faz nada", () => {
  // Documentado: os atalhos do modo interativo do terminal não valem no app
  // desktop. Deixar o botão seria oferecer um clique que não faz nada.
  const acts = actions.build();
  assert.ok(resolve(acts, estado()).some((a) => a.id === "plan_mode"));
  assert.ok(!resolve(acts, noDesktop()).some((a) => a.id === "plan_mode"));
});

test("a aba Modo só existe no desktop", () => {
  const acts = actions.build();
  assert.ok(!pagesOf(acts, estado()).some((p) => p.id === "modo"));
  const abas = pagesOf(acts, noDesktop());
  const modo = abas.find((p) => p.id === "modo");
  assert.ok(modo, "a aba Modo precisa existir no desktop");
  assert.equal(modo.label, "Modo");
  assert.equal(modo.count, 5, "cinco modos, como no menu do app");
});

test("os botões do desktop abrem o menu e escolhem o item", () => {
  const acts = actions.build();
  const passos = (id) => acts.find((a) => a.id === id).steps.map((s) => s.keys ?? `wait${s.wait}`);

  assert.deepEqual(passos("d_opus"), ["^+i", "wait220", "2"], "Ctrl+Shift+I depois 2");
  assert.deepEqual(passos("d_modo_plano"), ["^+m", "wait220", "4"], "Ctrl+Shift+M depois 4");
  assert.deepEqual(passos("d_modo_ignorar"), ["^+m", "wait220", "5"]);
});

test("os acordes do desktop passam pela validação de teclas", () => {
  const { validateKeys } = require("../src/inject");
  const acts = actions.build();
  for (const a of acts) {
    if (a.kind === "keys") assert.equal(validateKeys(a.keys), null, `${a.id}: ${a.keys}`);
    if (a.kind === "chain") {
      for (const s of a.steps) {
        if (s.keys) assert.equal(validateKeys(s.keys), null, `${a.id} passo ${s.keys}`);
      }
    }
  }
});

test("o modo de permissão em uso acende, vindo dos hooks", () => {
  const acts = actions.build();
  const aceso = (modo) => {
    const st = noDesktop({ sessions: [{ live: true, permissionMode: modo }] });
    return resolve(acts, st).filter((a) => a.page === "modo" && a.active).map((a) => a.id);
  };
  assert.deepEqual(aceso("plan"), ["d_modo_plano"]);
  assert.deepEqual(aceso("acceptEdits"), ["d_modo_aceitar"]);
  assert.deepEqual(aceso("bypassPermissions"), ["d_modo_ignorar"]);
  assert.deepEqual(aceso("auto"), ["d_modo_auto"]);
});

test("sem sinal de modo, nenhum botão de modo acende", () => {
  const acts = actions.build();
  const st = noDesktop({ sessions: [{ live: true }] });
  assert.equal(resolve(acts, st).filter((a) => a.page === "modo" && a.active).length, 0);
});

test("a face de texto mostra o nível de esforço por extenso", () => {
  const b = readBadge({ source: "effortLabel", format: "text" },
    noDesktop({ sessions: [{ live: true, effort: "xhigh" }] }));
  assert.equal(b.value, "xhigh");
  assert.equal(b.format, "text");
  assert.equal(b.bar, null);
});

test("'Ignorar permissões' exige dois toques", () => {
  // Desliga a rede de proteção inteira; um esbarrão no tablet não pode fazer isso.
  const acts = actions.build();
  assert.equal(acts.find((a) => a.id === "d_modo_ignorar").confirm, true);
});

/* ═══════════════════════ teclas de agente ═══════════════════════════════ */

function comSessoes(lista) {
  return noDesktop({ sessions: lista });
}

test("uma tecla por sessão viva, nomeada pelo projeto", () => {
  const acts = actions.build();
  const st = comSessoes([
    { id: "s1", live: true, cwd: "/home/r/orcamento-obra", state: "working", tool: "Bash" },
    { id: "s2", live: true, cwd: "/home/r/site", state: "waiting" },
    { id: "s3", live: false, cwd: "/home/r/morta", state: "idle" },
  ]);
  const teclas = resolve(acts, st).filter((a) => a.page === "agentes");
  assert.equal(teclas.length, 2, "a sessão morta não vira tecla");
  assert.deepEqual(teclas.map((t) => t.label).sort(), ["orcamento-obra", "site"]);
});

test("a cor da tecla é o estado DAQUELA conversa", () => {
  const acts = actions.build();
  const tom = (state) =>
    resolve(acts, comSessoes([{ id: "s", live: true, cwd: "/a/b", state }]))
      .find((t) => t.page === "agentes").tone;
  assert.equal(tom("working"), "go");
  assert.equal(tom("waiting"), "stop");
  assert.equal(tom("error"), "warn");
  assert.equal(tom("idle"), "neutral");
});

test("a conversa que está esperando sobe para o topo", () => {
  const acts = actions.build();
  const st = comSessoes([
    { id: "s1", live: true, cwd: "/a/tranquila", state: "idle" },
    { id: "s2", live: true, cwd: "/a/urgente", state: "waiting" },
  ]);
  const teclas = resolve(acts, st).filter((a) => a.page === "agentes");
  assert.equal(teclas[0].label, "urgente");
  assert.equal(teclas[0].urgent, true);
});

test("a aba Agentes conta sessões, não a ação-modelo", () => {
  const acts = actions.build();
  const st = comSessoes([
    { id: "s1", live: true, cwd: "/a/um", state: "idle" },
    { id: "s2", live: true, cwd: "/a/dois", state: "waiting" },
    { id: "s3", live: true, cwd: "/a/tres", state: "working" },
  ]);
  const aba = pagesOf(acts, st).find((p) => p.id === "agentes");
  assert.equal(aba.count, 3, "uma aba dizendo 1 com três conversas mentiria");
  assert.equal(aba.level, "alarm", "há uma esperando");
});

test("sem sessão viva a aba Agentes não aparece", () => {
  const acts = actions.build();
  assert.ok(!pagesOf(acts, comSessoes([])).some((p) => p.id === "agentes"));
});

test("o teto de teclas de agente é respeitado", () => {
  const acts = actions.build();
  const muitas = Array.from({ length: 12 }, (_, i) => ({
    id: `s${i}`, live: true, cwd: `/a/p${i}`, state: "idle",
  }));
  assert.equal(resolve(acts, comSessoes(muitas)).filter((a) => a.page === "agentes").length, 6);
});

test("a tecla de agente não digita nada — ela só foca", () => {
  const acts = actions.build();
  const t = resolve(acts, comSessoes([{ id: "s", live: true, cwd: "/a/b", state: "idle" }]))
    .find((x) => x.page === "agentes");
  assert.equal(t.kind, "focus", "kind=focus é tratado no cliente, sem ir ao servidor");
  assert.equal(t.sessionId, "s");
  assert.ok(!("keys" in t) && !("text" in t));
});

test("nome do projeto tolera caminho do Windows e caminho vazio", () => {
  const { nomeCurto } = require("../src/deckengine");
  assert.equal(nomeCurto("C:\\Users\\r\\projetos\\obra", "x"), "obra");
  assert.equal(nomeCurto("/home/r/app/", "x"), "app");
  assert.equal(nomeCurto(null, "fallback"), "fallback");
  assert.equal(nomeCurto("", "fallback"), "fallback");
});
