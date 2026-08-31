"use strict";
/**
 * Motor do deck.
 *
 * O QUE ISSO RESOLVE
 * ------------------
 * Um deck com botões fixos é um controle remoto: você olha, procura, decide.
 * Um deck bom é um instrumento: ele já está mostrando o que importa agora.
 *
 * Três mecanismos fazem essa diferença, e todos vivem aqui:
 *
 *   1. VISIBILIDADE POR CONTEXTO — cada ação declara `when`, e o botão só
 *      ocupa espaço quando faz sentido. "Aprovar" não fica morto na tela
 *      esperando uma permissão que não veio; "Compactar" sobe sozinho quando
 *      o contexto passa do limite.
 *
 *   2. FACE VIVA — cada ação pode declarar `badge`, e o botão passa a exibir
 *      um número real na face (contexto, quota, tempo decorrido, gasto). É a
 *      diferença entre uma tecla e um mostrador.
 *
 *   3. URGÊNCIA — `urgent` promove o botão para o topo quando a condição
 *      dele dispara, então a ação certa está sempre na mesma altura da mão.
 *
 * Tudo é declarativo de propósito: dá para testar sem navegador e dá para
 * alterar pelo deck.config.json sem tocar em código.
 */

/** Fontes de dado que um botão pode mostrar na face. */
const BADGE_SOURCES = {
  context: (s) => firstLive(s, (x) => x.context && x.context.used),
  five: (s) => s.usage && s.usage.five && s.usage.five.pct,
  seven: (s) => s.usage && s.usage.seven && s.usage.seven.pct,
  cost: (s) => s.usage && s.usage.totals && s.usage.totals.costUsd,
  tools: (s) => s.counters && s.counters.tools,
  subagents: (s) => s.subagents,
  sessions: (s) => (s.sessions || []).filter((x) => x.live).length,
  pending: (s) => (s.gate && s.gate.pending ? s.gate.pending.length : 0),
  elapsed: (s) => (s.since ? Math.floor((s.now - s.since) / 1000) : null),
};

/**
 * Modelo e esforço da sessão viva, normalizados para comparação.
 * O statusLine entrega `model.display_name` ("Opus") e `model.id`
 * ("claude-opus-5"); qualquer um dos dois serve para reconhecer a família.
 */
function liveModel(state) {
  const id = firstLive(state, (s) => s.modelId) || "";
  const name = firstLive(state, (s) => s.model) || "";
  return `${id} ${name}`.toLowerCase();
}

const liveEffort = (state) => String(firstLive(state, (s) => s.effort) || "").toLowerCase();

/** Primeiro valor não nulo entre as sessões vivas. */
function firstLive(state, pick) {
  for (const s of state.sessions || []) {
    if (!s.live) continue;
    const v = pick(s);
    if (v != null) return v;
  }
  return null;
}

/**
 * Avalia uma condição `when` contra o estado.
 * Todas as chaves presentes precisam ser satisfeitas (E lógico). Chave
 * ausente significa "não me importo" — assim o caso comum fica curto.
 */
function matches(when, state) {
  if (!when || typeof when !== "object") return true;

  // `anyOf` é o único OU do vocabulário. Existe porque um caso real precisa
  // dele: os botões de decisão aparecem quando há permissão pendente OU
  // quando o portão está desligado (aí eles valem pelo fallback de teclas).
  if (Array.isArray(when.anyOf)) {
    if (!when.anyOf.some((cond) => matches(cond, state))) return false;
  }

  if (Array.isArray(when.status) && !when.status.includes(state.status)) return false;

  if (when.gate === true && !(state.gate && state.gate.pending.length)) return false;
  if (when.gate === false && state.gate && state.gate.pending.length) return false;

  if (when.gateEnabled === true && !(state.config && state.config.gateEnabled)) return false;
  if (when.gateEnabled === false && state.config && state.config.gateEnabled) return false;

  if (typeof when.contextAbove === "number") {
    const c = BADGE_SOURCES.context(state);
    if (c == null || c < when.contextAbove) return false;
  }
  if (typeof when.fiveAbove === "number") {
    const v = BADGE_SOURCES.five(state);
    if (v == null || v < when.fiveAbove) return false;
  }
  if (typeof when.sevenAbove === "number") {
    const v = BADGE_SOURCES.seven(state);
    if (v == null || v < when.sevenAbove) return false;
  }
  if (typeof when.sessionsAtLeast === "number") {
    if (BADGE_SOURCES.sessions(state) < when.sessionsAtLeast) return false;
  }
  if (typeof when.subagentsAtLeast === "number") {
    if ((state.subagents || 0) < when.subagentsAtLeast) return false;
  }
  if (when.hasTarget === true && !(state.config && state.config.hasTarget)) return false;

  // Reconhecimento por FAMÍLIA de modelo, de propósito. O statusLine informa o
  // modelo resolvido, não o apelido que foi digitado — então "opus", "opus[1m]"
  // e "opusplan" chegam aqui indistinguíveis. Acender os três seria mentira;
  // acender a família é verdade. Os apelidos específicos ficam sem indicador.
  if (Array.isArray(when.modelIs)) {
    const m = liveModel(state);
    if (!m.trim() || !when.modelIs.some((fam) => m.includes(String(fam).toLowerCase()))) return false;
  }

  // Mesma honestidade no esforço: `ultracode` é reportado como `xhigh`
  // (documentado), então os dois não são distinguíveis a partir daqui.
  if (Array.isArray(when.effortIs)) {
    const e = liveEffort(state);
    if (!e || !when.effortIs.includes(e)) return false;
  }

  if (typeof when.fastMode === "boolean") {
    const fast = firstLive(state, (s) => s.fastMode);
    if (Boolean(fast) !== when.fastMode) return false;
  }

  return true;
}

/** Calcula o valor exibido na face do botão. */
function readBadge(badge, state) {
  if (!badge || !badge.source) return null;
  // Um mostrador só deve mostrar número quando o número quer dizer algo. O
  // cronômetro de "Interromper" fora do estado "trabalhando" contaria o tempo
  // desde a última mudança de estado, que não é o que a face promete.
  if (badge.when && !matches(badge.when, state)) return null;
  const fn = BADGE_SOURCES[badge.source];
  if (!fn) return null;

  let value;
  try {
    value = fn(state);
  } catch {
    return null;
  }
  if (value == null || (typeof value === "number" && !Number.isFinite(value))) return null;

  const warn = typeof badge.warnAbove === "number" && value >= badge.warnAbove;
  const crit = typeof badge.critAbove === "number" && value >= badge.critAbove;

  return {
    value,
    format: badge.format || "number",
    level: crit ? "crit" : warn ? "warn" : "ok",
    // A barrinha na base do botão só aparece quando o valor é percentual.
    bar: badge.format === "pct" ? Math.max(0, Math.min(100, value)) : null,
  };
}

/**
 * Resolve o deck inteiro para o estado atual.
 * Devolve a lista de botões prontos para desenhar, já sem os campos sensíveis
 * (`keys`, `text`, `steps`) — o cliente só precisa saber o `id`.
 */
function resolve(actions, state) {
  const out = [];

  for (const a of actions) {
    // Ações `secondary` existem só como destino de toque longo ou de chain.
    // Renderizá-las também no grid duplicaria o comando e gastaria espaço.
    if (a.secondary) continue;
    const visible = matches(a.when, state);
    // `keepVisible` mantém o botão na tela porém desabilitado, em vez de
    // sumir. Serve para ações que o usuário procura pelo lugar de sempre.
    if (!visible && !a.keepVisible) continue;

    const urgent = !!(a.urgent && matches(a.urgent, state));
    // `active` acende o botão que corresponde ao estado atual — é o que faz
    // uma fileira de opções virar um seletor em vez de seis atalhos soltos.
    const active = !!(a.active && matches(a.active, state));

    out.push({
      id: a.id,
      label: a.label,
      hint: a.hint || null,
      page: a.page || "main",
      group: a.group || "control",
      tone: a.tone || "neutral",
      icon: a.icon || "dot",
      kind: a.kind,
      confirm: !!a.confirm,
      enabled: visible,
      urgent,
      active,
      badge: readBadge(a.badge, state),
      hold: a.hold ? { id: a.hold, label: labelOf(actions, a.hold) } : null,
      target: a.kind === "page" ? a.target : undefined,
      steps: a.kind === "chain" ? a.steps.length : undefined,
    });
  }

  // Urgentes primeiro, depois a ordem declarada. A posição do botão vira
  // informação: o que subiu, subiu porque agora importa.
  return out.sort((x, y) => (y.urgent ? 1 : 0) - (x.urgent ? 1 : 0));
}

function labelOf(actions, id) {
  const a = actions.find((x) => x.id === id);
  return a ? a.label : id;
}

/** Páginas existentes, na ordem em que aparecem no catálogo. */
function pagesOf(actions, state) {
  // "alarme" é reservado para o que exige decisão sua agora. Qualquer outra
  // urgência é só destaque. Misturar os dois gastaria o alarme.
  const alarme =
    (state.gate && state.gate.pending && state.gate.pending.length > 0) ||
    state.status === "waiting" ||
    state.status === "error";

  const seen = new Map();
  for (const a of actions) {
    if (a.secondary) continue;
    const p = a.page || "main";
    if (!seen.has(p)) seen.set(p, { id: p, label: PAGE_LABELS[p] || p, count: 0, urgent: false, level: null });
    const entry = seen.get(p);
    if (matches(a.when, state)) {
      entry.count++;
      if (a.urgent && matches(a.urgent, state)) {
        entry.urgent = true;
        entry.level = alarme ? "alarm" : "highlight";
      }
    }
  }
  // Página sem nenhum botão visível não vira aba.
  return [...seen.values()].filter((p) => p.count > 0);
}

const PAGE_LABELS = {
  main: "Controle",
  prompts: "Prompts",
  sessao: "Sessão",
  modelo: "Modelo",
  esforco: "Esforço",
  git: "Git",
  quota: "Uso",
};

module.exports = { resolve, matches, readBadge, pagesOf, BADGE_SOURCES, PAGE_LABELS };
