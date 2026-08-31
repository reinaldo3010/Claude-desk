"use strict";
/* =============================================================================
   Claude Deck — painel
   -----------------------------------------------------------------------------
   Um arquivo, sem framework, sem build. Não é birra: é que este código roda no
   navegador de um tablet de sete anos, e cada quilobyte de framework é memória
   que falta para o canvas do fundo.

   Estrutura:
     · Conexão   SSE com reconexão e degradação para polling
     · Render    medidores, odômetro, curva, botões, sessões
     · Portão    cartão de permissão com contagem regressiva
     · Ambiente  aurora, som, vibração, protetor de tela
     · Guarda    monitor de quadros que liga o modo leve sozinho
   ========================================================================== */

const $ = (id) => document.getElementById(id);
const body = document.body;

const TOKEN =
  new URLSearchParams(location.search).get("t") ||
  sessionStorage.getItem("deck-token") ||
  "";
if (TOKEN) sessionStorage.setItem("deck-token", TOKEN);

const ARC_LEN = 395.84;   // 270° de um círculo de raio 84
const ARC_GAP = 527.79;   // circunferência completa

let state = null;
let lastContact = 0;
let sinceTs = 0;
let lastInteraction = Date.now();
let saverOn = false;

/* ══════════════════════════════════ utilidades ══════════════════════════ */

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function fmtLeft(epochMs) {
  if (!epochMs) return "--";
  const ms = epochMs - Date.now();
  if (ms <= 0) return "agora";
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d) return `${d}d ${h % 24}h`;
  if (h) return `${h}h ${String(m % 60).padStart(2, "0")}m`;
  return `${m}m`;
}

function fmtElapsed(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min`;
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
}

function levelOf(pct, warnAt, alertAt) {
  if (pct == null) return "idle";
  if (pct >= alertAt) return "crit";
  if (pct >= warnAt) return "warn";
  return "ok";
}

const ARC_COLORS = {
  ok:   { a: "#4FB286", b: "#6FD3A8", glow: "rgba(79,178,134,.40)" },
  warn: { a: "#E3A44F", b: "#F3C98A", glow: "rgba(227,164,79,.40)" },
  crit: { a: "#FF3B30", b: "#FF8A72", glow: "rgba(255,59,48,.45)" },
  idle: { a: "#6C665E", b: "#6C665E", glow: "rgba(0,0,0,0)" },
};

/* ══════════════════════════════════ odômetro ════════════════════════════ */

/**
 * Cada dígito vira uma coluna 0–9 que desliza para a posição certa.
 * A alternativa óbvia — trocar o textContent — dá um "pisca" seco que faz o
 * painel parecer um relógio digital barato. Rolar o dígito custa um transform.
 */
function renderOdometer(el, value) {
  if (value == null) {
    if (el.dataset.v !== "null") {
      el.dataset.v = "null";
      el.innerHTML = '<span class="odo-static">--</span>';
    }
    return;
  }
  const text = String(Math.round(value));
  el.setAttribute("aria-label", `${text} por cento`);

  // Mudou a quantidade de dígitos: reconstrói as colunas.
  if (el.dataset.len !== String(text.length)) {
    el.dataset.len = String(text.length);
    el.innerHTML = "";
    for (let i = 0; i < text.length; i++) {
      const digit = document.createElement("span");
      digit.className = "odo-digit";
      const col = document.createElement("span");
      col.className = "odo-col";
      for (let n = 0; n <= 9; n++) {
        const s = document.createElement("span");
        s.textContent = String(n);
        col.appendChild(s);
      }
      digit.appendChild(col);
      el.appendChild(digit);
    }
  }

  const cols = el.querySelectorAll(".odo-col");
  for (let i = 0; i < text.length; i++) {
    const n = Number(text[i]);
    if (cols[i]) cols[i].style.transform = `translateY(${-n}em)`;
  }
  el.dataset.v = text;
}

/* ══════════════════════════════════ medidores ═══════════════════════════ */

function paintGauge(prefix, data, burn, cfg) {
  const card = $(prefix === "5" ? "gauge5" : "gauge7");
  const arc = card.querySelector(".dial-arc");
  const ghost = card.querySelector(".dial-ghost");
  const pct = data && data.pct != null ? data.pct : null;
  const level = levelOf(pct, cfg.warnAt, cfg.alertAt);

  card.dataset.level = level;
  const c = ARC_COLORS[level];
  card.style.setProperty("--arc-a", c.a);
  card.style.setProperty("--arc-b", c.b);
  card.style.setProperty("--glow", c.glow);

  const shown = pct == null ? 0 : clamp(pct, 0, 100);
  arc.style.strokeDasharray = `${(shown / 100) * ARC_LEN} ${ARC_GAP}`;

  // Arco fantasma: projeção de onde o consumo chega até o reset, no ritmo atual.
  let ghostPct = 0;
  if (pct != null && burn && burn.rate > 0 && data.resetsAt) {
    const hoursLeft = (data.resetsAt - Date.now()) / 3_600_000;
    if (hoursLeft > 0) ghostPct = clamp(pct + burn.rate * hoursLeft, 0, 100);
  }
  ghost.style.strokeDasharray = `${(ghostPct / 100) * ARC_LEN} ${ARC_GAP}`;

  renderOdometer($(prefix === "5" ? "odo5" : "odo7"), pct);
  $(prefix === "5" ? "reset5" : "reset7").textContent = fmtLeft(data && data.resetsAt);

  // Texto da taxa de queima: só aparece quando diz alguma coisa.
  const burnEl = $(prefix === "5" ? "burn5" : "burn7");
  if (burn && burn.rate > 0.4) {
    const hot = burn.exhaustAt && data.resetsAt && burn.exhaustAt < data.resetsAt;
    burnEl.dataset.hot = hot ? "1" : "0";
    burnEl.textContent = hot
      ? `acaba em ${fmtLeft(burn.exhaustAt)}`
      : `${burn.rate.toFixed(1)} %/h`;
  } else {
    burnEl.dataset.hot = "0";
    burnEl.textContent = "";
  }
}

/* ══════════════════════════════════ curva ═══════════════════════════════ */

function paintSpark(history) {
  const line = $("sparkLine");
  const area = $("sparkArea");
  const head = $("sparkHead");
  const empty = $("sparkEmpty");
  const pts = (history || []).filter((p) => p.five != null);

  if (pts.length < 2) {
    empty.hidden = false;
    line.setAttribute("d", "");
    area.setAttribute("d", "");
    // Esconder de verdade: o SVG tem overflow visível, então uma coordenada
    // negativa não some — ela vira um pontinho solto fora do gráfico.
    head.setAttribute("visibility", "hidden");
    $("sparkRange").textContent = "";
    return;
  }
  empty.hidden = true;
  head.setAttribute("visibility", "visible");

  const W = 300;
  const H = 90;
  const t0 = pts[0].t;
  const span = Math.max(1, pts[pts.length - 1].t - t0);
  const maxY = Math.max(20, ...pts.map((p) => p.five));

  const xy = pts.map((p) => [((p.t - t0) / span) * W, H - (p.five / maxY) * (H - 8) - 4]);

  // Curva suavizada: pontos de controle no meio de cada segmento.
  let d = `M${xy[0][0].toFixed(1)},${xy[0][1].toFixed(1)}`;
  for (let i = 1; i < xy.length; i++) {
    const [x0, y0] = xy[i - 1];
    const [x1, y1] = xy[i];
    const cx = (x0 + x1) / 2;
    d += ` C${cx.toFixed(1)},${y0.toFixed(1)} ${cx.toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  line.setAttribute("d", d);
  area.setAttribute("d", `${d} L${W},${H} L0,${H} Z`);

  const last = xy[xy.length - 1];
  head.setAttribute("cx", last[0].toFixed(1));
  head.setAttribute("cy", last[1].toFixed(1));

  const minutes = Math.round(span / 60000);
  $("sparkRange").textContent =
    minutes >= 120 ? `· ${Math.round(minutes / 60)}h` : `· ${minutes}min`;
}

/* ══════════════════════════════════ estatísticas ════════════════════════ */

function paintStats(s) {
  const live = s.sessions.filter((x) => x.live);
  const ctx = live.length ? live[0].context : null;
  const cells = [
    ["Sessões", live.length ? String(live.length) : "0", live.length === 1 ? "ativa" : "ativas"],
    ["Contexto", ctx && ctx.used != null ? String(Math.round(ctx.used)) : "--", "%"],
    ["Gasto", s.usage.totals.costUsd ? `$${s.usage.totals.costUsd.toFixed(2)}` : "$0", ""],
    ["Ferramentas", String(s.counters.tools || 0), ""],
  ];
  if (s.subagents > 0) cells[3] = ["Subagentes", String(s.subagents), "ativos"];

  const html = cells
    .map(
      ([k, v, u]) =>
        `<dl class="stat"><dt>${k}</dt><dd>${v}${u ? `<small>${u}</small>` : ""}</dd></dl>`
    )
    .join("");
  const el = $("stats");
  if (el.dataset.h !== html) {
    el.dataset.h = html;
    el.innerHTML = html;
  }
}

/* ══════════════════════════════════ botões ══════════════════════════════ */

/* ══════════════════════════════ deck ════════════════════════════════════ */

let currentPage = sessionStorage.getItem("deck-page") || "main";
// Qual sessão o painel está descrevendo. É estado DESTE tablet, não do
// servidor: dois painéis na casa podem estar olhando conversas diferentes.
let focusedSession = sessionStorage.getItem("deck-focus") || null;
let deckSig = "";
let pagesSig = "";
const confirmTimers = new Map();
const HOLD_MS = 620;

/** Formata o número que aparece na face do botão. */
function fmtBadge(b) {
  if (!b || b.value == null) return "";
  switch (b.format) {
    case "pct":
      return `${Math.round(b.value)}<small>%</small>`;
    case "usd":
      return `<small>$</small>${b.value.toFixed(2)}`;
    case "text":
      return `<small>${escapeHtml(String(b.value))}</small>`;
    case "duration": {
      const s = Math.max(0, Math.round(b.value));
      // Abaixo de cinco segundos o número muda rápido demais para ser lido e
      // só polui a face. O cronômetro aparece quando começa a significar algo.
      if (s < 5) return "";
      if (s < 60) return `${s}<small>s</small>`;
      const m = Math.floor(s / 60);
      if (m < 60) return `${m}<small>m</small>${String(s % 60).padStart(2, "0")}`;
      return `${Math.floor(m / 60)}<small>h</small>${String(m % 60).padStart(2, "0")}`;
    }
    default:
      return String(Math.round(b.value));
  }
}

/* ── abas ──────────────────────────────────────────────────────────── */

function buildPages(pages) {
  const sig = pages.map((p) => `${p.id}:${p.count}:${p.urgent ? 1 : 0}`).join("|");
  const nav = $("pages");

  if (pagesSig !== sig) {
    pagesSig = sig;
    // Preserva o marcador deslizante ao reconstruir os botões.
    for (const el of [...nav.querySelectorAll("button")]) el.remove();
    for (const p of pages) {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.page = p.id;
      b.setAttribute("role", "tab");
      b.innerHTML =
        `<span>${escapeHtml(p.label)}</span>` +
        `<span class="tab-count">${p.count}</span>` +
        (p.urgent ? `<span class="tab-alert" data-level="${p.level || "highlight"}"></span>` : "");
      b.addEventListener("click", () => goToPage(p.id));
      nav.appendChild(b);
    }
  }

  // A aba escolhida pode ter sumido (o contexto mudou): cai para a primeira.
  if (!pages.some((p) => p.id === currentPage)) {
    currentPage = pages.length ? pages[0].id : "main";
  }

  for (const b of nav.querySelectorAll("button")) {
    b.setAttribute("aria-selected", b.dataset.page === currentPage ? "true" : "false");
  }
  moveMarker();
}

/** Desliza o marcador até a aba ativa. */
function moveMarker() {
  const nav = $("pages");
  const active = nav.querySelector('button[aria-selected="true"]');
  const marker = $("pagesMarker");
  if (!active) {
    marker.style.width = "0px";
    return;
  }
  marker.style.width = `${active.offsetWidth}px`;
  marker.style.transform = `translateX(${active.offsetLeft - 3}px)`;
}

function goToPage(id) {
  if (id === currentPage) return;
  const order = [...$("pages").querySelectorAll("button")].map((b) => b.dataset.page);
  const dir = order.indexOf(id) > order.indexOf(currentPage) ? "left" : "right";
  currentPage = id;
  sessionStorage.setItem("deck-page", id);
  lastInteraction = Date.now();
  beep(700, 0.04);
  deckSig = ""; // força o redesenho da grade
  $("deck").dataset.sliding = dir;
  if (state) renderDeck(state);
  setTimeout(() => delete $("deck").dataset.sliding, 320);
}

/* ── grade de botões ───────────────────────────────────────────────── */

/**
 * O conjunto de botões muda com o estado, então não dá para montar uma vez
 * e esquecer. Mas redesenhar a cada quadro mataria as animações e cortaria
 * um toque no meio. A saída é uma assinatura: só o que muda a ESTRUTURA
 * (quais botões, em que ordem, habilitados) força remontagem; os números da
 * face são atualizados no lugar, a cada atualização.
 */
function renderDeck(s) {
  buildPages(s.pages || []);

  const mine = (s.actions || []).filter((a) => (a.page || "main") === currentPage);
  // O foco é local, então entra na assinatura pelo valor do cliente.
  const sig = mine
    .map((a) => {
      const aceso = a.kind === "focus" ? a.sessionId === focusedSession : a.active;
      return `${a.id}:${a.enabled ? 1 : 0}:${a.urgent ? 1 : 0}:${aceso ? 1 : 0}:${a.state || ""}`;
    })
    .join("|");

  if (sig !== deckSig) {
    deckSig = sig;
    const deck = $("deck");
    deck.innerHTML = "";
    let n = 0;
    for (const g of ["permission", "control", "prompt"]) {
      const items = mine.filter((a) => (a.group || "control") === g);
      if (!items.length) continue;
      const row = document.createElement("div");
      row.className = "deck-row";
      row.dataset.group = g;
      row.style.gridTemplateColumns = `repeat(${colunas(items.length)}, 1fr)`;
      for (const a of items) {
        const b = makeButton(a);
        b.style.animationDelay = `${Math.min(n++ * 22, 200)}ms`;
        row.appendChild(b);
      }
      deck.appendChild(row);
    }
  }

  paintBadges(mine);
}

/**
 * Quantas colunas para N botões.
 * Até cinco, uma fileira só. Acima disso, duas fileiras equilibradas — deixar
 * o resto sozinho na segunda linha, ocupando um quinto da largura, faz o
 * último botão parecer um erro de layout em vez de uma opção.
 */
function colunas(n) {
  return n <= 5 ? n : Math.ceil(n / 2);
}

/** Atualiza só os números da face — sem remontar nada. */
function paintBadges(actions) {
  for (const a of actions) {
    const btn = document.querySelector(`.btn[data-id="${a.id}"]`);
    if (!btn) continue;

    const el = btn.querySelector(".badge");
    const bar = btn.querySelector(".badge-bar");
    if (!a.badge) {
      if (el) el.remove();
      if (bar) bar.remove();
      continue;
    }
    let target = el;
    if (!target) {
      target = document.createElement("span");
      target.className = "badge";
      btn.appendChild(target);
    }
    target.dataset.level = a.badge.level;
    const html = fmtBadge(a.badge);
    if (target.innerHTML !== html) target.innerHTML = html;

    if (a.badge.bar != null) {
      let barEl = bar;
      if (!barEl) {
        barEl = document.createElement("span");
        barEl.className = "badge-bar";
        barEl.innerHTML = "<i></i>";
        btn.appendChild(barEl);
      }
      barEl.dataset.level = a.badge.level;
      barEl.firstChild.style.width = `${a.badge.bar}%`;
    } else if (bar) {
      bar.remove();
    }
  }
}

function makeButton(a) {
  const b = document.createElement("button");
  b.className = "btn";
  b.type = "button";
  b.dataset.tone = a.tone || "neutral";
  b.dataset.id = a.id;
  b.dataset.urgent = a.urgent ? "1" : "0";
  const aceso = a.kind === "focus" ? a.sessionId === focusedSession : a.active;
  b.dataset.active = aceso ? "1" : "0";
  if (a.state) b.dataset.state = a.state;
  b.disabled = a.enabled === false;
  if (a.confirm) b.dataset.needsConfirm = "1";
  if (a.hold) b.dataset.hasHold = "1";

  b.innerHTML =
    '<span class="hold-fill"></span>' +
    (aceso ? '<span class="active-dot"></span>' : "") +
    (a.kind === "focus" ? '<span class="agent-led"></span>' : "") +
    `<svg><use href="#i-${a.icon || "dot"}"></use></svg>` +
    `<span class="btn-label">${escapeHtml(a.label)}</span>` +
    (a.hint ? `<span class="btn-hint">${escapeHtml(a.hint)}</span>` : "") +
    (a.hold ? `<span class="hold-label">${escapeHtml(a.hold.label)}</span>` : "");

  wireButton(b, a);
  return b;
}

/* ── toque, toque longo e confirmação ──────────────────────────────── */

/**
 * Um botão de parede precisa de três gestos distintos e sem ambiguidade:
 *   toque curto  → ação principal
 *   toque longo  → ação secundária (só onde `hold` existe)
 *   toque duplo  → confirmação, nas ações que mudam o mundo
 *
 * Tudo por eventos de ponteiro. O `click` foi abandonado de propósito: com
 * ele, um toque longo dispararia AS DUAS ações ao soltar o dedo.
 */
function wireButton(btn, a) {
  let holdTimer = null;
  let fired = false;

  const startHold = (e) => {
    if (btn.disabled) return;
    lastInteraction = Date.now();
    fired = false;
    ripple(btn, e);
    if (!a.hold) return;
    btn.style.setProperty("--hold-ms", `${HOLD_MS}ms`);
    btn.dataset.holding = "1";
    holdTimer = setTimeout(() => {
      fired = true;
      delete btn.dataset.holding;
      if (navigator.vibrate) navigator.vibrate([25, 40, 25]);
      beep(420, 0.12);
      fire(a.hold.id, btn);
    }, HOLD_MS);
  };

  const endHold = () => {
    clearTimeout(holdTimer);
    holdTimer = null;
    delete btn.dataset.holding;
  };

  btn.addEventListener("pointerdown", startHold);
  btn.addEventListener("pointerup", () => {
    endHold();
    if (!fired) press(a, btn);
  });
  // Dedo escorregou para fora ou o navegador tomou o gesto: cancela tudo.
  btn.addEventListener("pointerleave", () => {
    endHold();
    fired = true;
  });
  btn.addEventListener("pointercancel", () => {
    endHold();
    fired = true;
  });
  // Teclado nunca faz toque longo: Enter e Espaço são sempre a ação principal.
  btn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      press(a, btn);
    }
  });
}

function ripple(btn, e) {
  const r = btn.getBoundingClientRect();
  const el = document.createElement("span");
  el.className = "ripple";
  const size = Math.max(r.width, r.height) * 2.2;
  el.style.width = el.style.height = `${size}px`;
  el.style.left = `${(e.clientX ?? r.left + r.width / 2) - r.left}px`;
  el.style.top = `${(e.clientY ?? r.top + r.height / 2) - r.top}px`;
  btn.appendChild(el);
  setTimeout(() => el.remove(), 600);
}

/**
 * Ações marcadas com `confirm` exigem dois toques.
 * "Sempre aprovar", "limpar contexto" e "commitar" mudam o mundo — um
 * esbarrão no tablet não pode disparar isso. A janela é curta o bastante
 * para não virar burocracia.
 */
/** Rótulo curto do estado de uma sessão. */
const ESTADO_SESSAO = {
  working: "trabalhando",
  waiting: "esperando você",
  error: "com erro",
  idle: "ocioso",
  offline: "fechada",
};

/** Último trecho do caminho: o nome do projeto, que é como você chama a sessão. */
function nomeCurtoUI(cwd) {
  if (!cwd) return null;
  const p = String(cwd).replace(/\\/g, "/").split("/").filter(Boolean);
  return p[p.length - 1] || null;
}

function press(action, btn) {
  lastInteraction = Date.now();

  // Tecla de agente não dispara nada no computador: ela escolhe sobre qual
  // conversa o painel fala. Nada de ida ao servidor — é decisão local e
  // instantânea, e continua funcionando mesmo com a injeção de teclas quebrada.
  if (action.kind === "focus") {
    focusedSession = focusedSession === action.sessionId ? null : action.sessionId;
    if (focusedSession) sessionStorage.setItem("deck-focus", focusedSession);
    else sessionStorage.removeItem("deck-focus");
    beep(720, 0.05);
    if (navigator.vibrate) navigator.vibrate(10);
    deckSig = "";
    if (state) render(state);
    return;
  }

  if (btn.dataset.needsConfirm === "1" && btn.dataset.confirm !== "pending") {
    btn.dataset.confirm = "pending";
    beep(520, 0.05);
    const t = setTimeout(() => {
      btn.dataset.confirm = "";
      confirmTimers.delete(btn);
    }, 3000);
    confirmTimers.set(btn, t);
    return;
  }
  clearTimeout(confirmTimers.get(btn));
  confirmTimers.delete(btn);
  btn.dataset.confirm = "";
  fire(action.id, btn);
}

async function fire(id, btn) {
  if (navigator.vibrate) navigator.vibrate(14);
  beep(660, 0.06);
  try {
    const res = await fetch(`/api/action?t=${encodeURIComponent(TOKEN)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: id }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      flash(btn, "ok");
      beep(880, 0.07);
      if (data.via === "chain") toast(`sequência: ${data.steps.join(" → ")}`, "ok");
    } else {
      flash(btn, "fail");
      beep(200, 0.16);
      toast(data.error || `erro ${res.status}`, "error");
      if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
    }
  } catch {
    flash(btn, "fail");
    toast("deck fora de alcance", "error");
  }
}

function flash(btn, cls) {
  btn.classList.remove("ok", "fail");
  void btn.offsetWidth; // reinicia a animação
  btn.classList.add(cls);
  setTimeout(() => btn.classList.remove(cls), 760);
}



let gateShownId = null;

function paintGate(s) {
  const layer = $("gateLayer");
  const pending = s.gate && s.gate.pending[0];

  if (!pending) {
    if (!layer.hidden) {
      layer.hidden = true;
      gateShownId = null;
    }
    return;
  }

  if (gateShownId !== pending.id) {
    gateShownId = pending.id;
    beep(440, 0.1);
    setTimeout(() => beep(560, 0.12), 130);
    if (navigator.vibrate) navigator.vibrate([60, 50, 60]);
  }

  layer.hidden = false;
  const card = $("gateCard");
  card.dataset.risk = pending.risk ? pending.risk.level : "low";
  $("gateRisk").textContent =
    { high: "risco alto", medium: "atenção", low: "rotina" }[pending.risk?.level] || "rotina";
  $("gateTool").textContent = pending.tool;
  $("gateDetail").textContent = pending.detail || "(sem detalhes)";

  const why = $("gateWhy");
  if (pending.risk && pending.risk.why) {
    why.hidden = false;
    why.textContent = `Este pedido ${pending.risk.why}.`;
  } else {
    why.hidden = true;
  }

  // Botões do cartão: reaproveitam as mesmas ações do deck, com a mesma
  // mecânica de confirmação. Remonta só quando o conjunto muda.
  const holder = $("gateActions");
  const decisions = s.actions.filter((x) => x.group === "permission");
  const sig = decisions.map((a) => a.id).join("|");
  if (holder.dataset.sig !== sig) {
    holder.dataset.sig = sig;
    holder.innerHTML = "";
    for (const a of decisions) holder.appendChild(makeButton(a));
  }
}

function tickGateTimer() {
  const pending = state && state.gate && state.gate.pending[0];
  const el = $("gateTimer");
  if (!pending || pending.msLeft == null) {
    el.textContent = "";
    return;
  }
  const left = Math.max(0, pending.msLeft - (Date.now() - lastContact));
  el.textContent = `${Math.ceil(left / 1000)}s`;
  el.style.color = left < 15000 ? "var(--stop)" : "";
}

/* ══════════════════════════════════ gaveta ══════════════════════════════ */

function paintDrawer(s) {
  if ($("drawer").hidden) return;

  const sess = $("sessions");
  sess.innerHTML = s.sessions.length
    ? s.sessions
        .map((x) => {
          const ctx = x.context && x.context.used != null ? Math.round(x.context.used) : null;
          return `<article class="session">
            <div class="session-top">
              <span class="led" data-live="${x.live ? 1 : 0}"></span>
              <span class="session-model">${x.model || "?"}</span>
              ${x.branch ? `<span class="session-ver">${x.branch}</span>` : ""}
              <span class="session-ver">${x.version || ""}</span>
            </div>
            <div class="session-path">${x.cwd || ""}</div>
            <div class="session-bars">
              <span>ctx <b>${ctx == null ? "--" : ctx + "%"}</b></span>
              ${x.cost && x.cost.usd ? `<span>gasto <b>$${x.cost.usd.toFixed(2)}</b></span>` : ""}
              ${x.effort ? `<span>esforço <b>${x.effort}</b></span>` : ""}
            </div>
            <div class="mini-bar"><i style="width:${ctx || 0}%"></i></div>
          </article>`;
        })
        .join("")
    : `<p style="color:var(--faint);font-size:13px">Nenhuma sessão ativa.</p>`;

  const tl = $("timeline");
  tl.innerHTML = [...s.log]
    .reverse()
    .slice(0, 30)
    .map((e, i) => {
      const t = new Date(e.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      return `<li data-kind="${e.kind}" style="animation-delay:${Math.min(i * 12, 260)}ms">
        <span class="kind"></span><time>${t}</time>
        <span class="txt">${escapeHtml(e.text)}</span></li>`;
    })
    .join("");

  const u = s.usage;
  $("drawerFoot").innerHTML = [
    `fonte dos limites: <b>${u.source || "nenhuma"}</b>`,
    u.staleMs != null ? `lido há ${fmtElapsed(u.staleMs)}` : "sem leitura",
    `injetor: ${s.config.injector}${s.config.hasTarget ? "" : " (sem alvo)"}`,
    `portão: ${s.config.gateEnabled ? "ligado" : "desligado"}`,
    ...(s.warnings || []).map((w) => `<span style="color:var(--warn)">${escapeHtml(w)}</span>`),
  ].join("<br>");
}

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch])
  );
}

/* ══════════════════════════════════ render ══════════════════════════════ */

function render(s) {
  state = s;
  lastContact = Date.now();
  // Com uma sessão em foco, a faixa fala DELA — inclusive a cor. Sem foco,
  // fala do painel todo. Uma tecla de agente que só mudasse a cor do botão
  // não responderia a pergunta que ela existe para responder.
  const foco = focusedSession && (s.sessions || []).find((x) => x.id === focusedSession);
  body.dataset.state = foco ? foco.state || "idle" : s.status;
  sinceTs = foco ? foco.seenAt || s.since : s.since;

  if (foco) {
    const nome = nomeCurtoUI(foco.cwd) || foco.name || "sessão";
    $("headline").textContent = `${nome} · ${ESTADO_SESSAO[foco.state] || foco.state || "ocioso"}`;
    $("detail").textContent = foco.detail || foco.tool || "";
  } else {
    $("headline").textContent = s.headline || "";
    $("detail").textContent = s.detail || "";
  }

  const chip = $("toolChip");
  if (s.activeTool) {
    chip.hidden = false;
    chip.textContent = s.activeTool.tool;
  } else {
    chip.hidden = true;
  }

  const cfg = s.config;
  paintGauge("5", s.usage.five, s.burn && s.burn.five, cfg);
  paintGauge("7", s.usage.seven, s.burn && s.burn.seven, cfg);
  paintSpark(s.history);
  paintStats(s);
  renderDeck(s);
  paintGate(s);
  paintDrawer(s);

  // Sem leitura de quota (o app desktop não executa a nossa statusLine), os
  // dois medidores mostrariam "--" ocupando a maior parte do painel. Nesse
  // caso eles encolhem e o espaço vai para os botões, que continuam servindo.
  if (focusedSession && !(s.sessions || []).some((x) => x.id === focusedSession)) {
    focusedSession = null;
    sessionStorage.removeItem("deck-focus");
    deckSig = "";
  }

  document.body.dataset.noUsage = s.usage.ok ? "0" : "1";
  if (!s.usage.ok) {
    $("detail").textContent =
      s.config.surface === "desktop"
        ? "Sem quota: nenhuma statusLine chegou — rode o doctor para saber por quê"
        : "Sem leitura de quota — mande uma mensagem no Claude Code";
  }

  // Alerta de espera acorda a tela.
  if (s.status === "waiting" && saverOn) hideSaver();
}

function tickClock() {
  if (sinceTs) $("elapsed").textContent = fmtElapsed(Date.now() - sinceTs);
  tickGateTimer();

  if (state) {
    $("reset5").textContent = fmtLeft(state.usage.five && state.usage.five.resetsAt);
    $("reset7").textContent = fmtLeft(state.usage.seven && state.usage.seven.resetsAt);
  }

  // Sem notícias do servidor há 40s: avisa em vez de mostrar dado velho calado.
  if (lastContact && Date.now() - lastContact > 40000 && body.dataset.state !== "offline") {
    $("headline").textContent = "Sem contato com o deck";
    $("detail").textContent = "tentando reconectar…";
    body.dataset.state = "offline";
  }

  maybeSaver();
}

/* ══════════════════════════════════ conexão ═════════════════════════════ */

let es = null;
let retry = 0;
let pollTimer = null;

function connect() {
  if (es) es.close();
  try {
    es = new EventSource("/api/stream");
  } catch {
    return startPolling();
  }

  es.addEventListener("state", (ev) => {
    retry = 0;
    stopPolling();
    try {
      render(JSON.parse(ev.data));
    } catch { /* quadro torto: espera o próximo */ }
  });

  es.onopen = () => {
    retry = 0;
    stopPolling();
  };

  es.onerror = () => {
    es.close();
    retry++;
    // Recuo exponencial com teto: o tablet não pode martelar um PC desligado.
    const wait = Math.min(15000, 800 * Math.pow(1.7, Math.min(retry, 6)));
    if (retry >= 2) startPolling();
    setTimeout(connect, wait);
  };
}

/** Rede sem SSE (proxy velho, quiosque estranho) ainda mostra dados. */
function startPolling() {
  if (pollTimer) return;
  const beat = async () => {
    try {
      const r = await fetch("/api/state", { cache: "no-store" });
      if (r.ok) render(await r.json());
    } catch { /* offline; tickClock avisa */ }
  };
  beat();
  pollTimer = setInterval(beat, 4000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

/* ══════════════════════════════════ som ═════════════════════════════════ */

let audio = null;
let soundOn = localStorage.getItem("deck-sound") !== "0";

/**
 * Bipes sintetizados. Zero arquivos de áudio — um oscilador e um envelope.
 * O navegador só libera áudio depois de um toque, então o contexto nasce
 * na primeira interação.
 */
function beep(freq, dur = 0.07) {
  if (!soundOn || !audio) return;
  try {
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.055, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  } catch { /* áudio é enfeite */ }
}

/* ══════════════════════════════════ marca ═══════════════════════════════ */

/**
 * A marca do Claude, desenhada por geometria — 12 lâminas radiais que saem de
 * um núcleo e afinam em direção a ele. Nada de arquivo de imagem: assim ela
 * herda a cor do tema, escala sem borrar e cada lâmina vira um elemento que a
 * folha de estilo consegue animar sozinha.
 *
 * A animação é toda `opacity` nas lâminas mais um `transform` no conjunto —
 * as duas coisas que a GPU resolve sem recalcular layout. Nenhum quadro é
 * desenhado por JavaScript aqui.
 *
 * O símbolo e o nome Claude são marcas da Anthropic; este é um painel pessoal,
 * não um produto oficial.
 */
const MARCA_LAMINAS = 12;

function marcaClaude(classe = "") {
  const dentro = 7;      // onde as lâminas nascem, perto do núcleo
  const larguraDentro = 2.05;
  const larguraFora = 3.9;

  let laminas = "";
  for (let i = 0; i < MARCA_LAMINAS; i++) {
    // Comprimentos ligeiramente diferentes tiram o ar de engrenagem: o
    // asterisco do Claude é orgânico, não um pictograma de relógio.
    const fora = 47 - (i % 3) * 1.7;
    const r = larguraFora;
    const d =
      `M ${-larguraDentro} ${-dentro} ` +
      `L ${-larguraFora} ${-(fora - r)} ` +
      `A ${r} ${r} 0 0 1 ${larguraFora} ${-(fora - r)} ` +
      `L ${larguraDentro} ${-dentro} Z`;
    laminas +=
      `<g transform="rotate(${i * (360 / MARCA_LAMINAS)})">` +
      `<path class="lamina" style="--i:${i}" d="${d}"/></g>`;
  }

  return (
    `<span class="marca ${classe}" aria-hidden="true">` +
    `<span class="marca-halo"></span>` +
    `<svg viewBox="0 0 100 100" class="marca-svg">` +
    `<g transform="translate(50 50)" class="marca-raios">${laminas}` +
    `<circle class="marca-nucleo" r="${dentro - 1.2}"/></g></svg></span>`
  );
}

/* ══════════════════════════════════ aurora ══════════════════════════════ */

/**
 * Fundo vivo: um campo de luz que escorre devagar e muda de cor com o estado.
 *
 * Por que WebGL cru e não three.js: o three.js é um grafo de cena — existe
 * para administrar centenas de objetos, câmeras e luzes. Aqui há um retângulo
 * só. Seriam ~600 KB de download, parse e memória num tablet de sete anos para
 * desenhar o que cabe em um shader de trinta linhas. O caminho de GPU abaixo
 * faz o mesmo efeito, mais bonito, e ainda sai mais barato que o desenho 2D
 * que existia antes — lá era a CPU pintando três gradientes gigantes a cada
 * quadro; aqui é a placa calculando pixel por pixel.
 *
 * Nada disso é obrigatório: sem WebGL cai para o canvas 2D, e no modo leve
 * cai para o gradiente estático da folha de estilo.
 */

/* Alvo de cor por estado: [luz, sombra, energia]. A cor persegue o alvo
   devagar, então a troca de estado chega como maré, não como corte. */
const AURORA_ALVOS = {
  idle:    [[0.66, 0.36, 0.26], [0.13, 0.10, 0.09], 0.45],
  working: [[0.85, 0.47, 0.33], [0.18, 0.12, 0.09], 1.00],
  waiting: [[0.92, 0.21, 0.17], [0.18, 0.06, 0.05], 0.86],
  error:   [[0.89, 0.64, 0.31], [0.17, 0.12, 0.07], 0.80],
  offline: [[0.28, 0.27, 0.25], [0.09, 0.09, 0.08], 0.18],
  boot:    [[0.55, 0.32, 0.24], [0.11, 0.10, 0.09], 0.32],
};

const AURORA_VS = `
attribute vec2 pos;
void main() { gl_Position = vec4(pos, 0.0, 1.0); }
`;

const AURORA_FS = `
precision mediump float;
uniform vec2  u_res;
uniform float u_t;
uniform vec3  u_luz;
uniform vec3  u_sombra;
uniform float u_energia;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float ruido(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i),               hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
/* Três oitavas bastam: o efeito é névoa, não relevo. Cada oitava a mais
   custa quatro senos por pixel num aparelho que não tem esse troco. */
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int k = 0; k < 3; k++) { v += a * ruido(p); p *= 2.03; a *= 0.5; }
  return v;
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p  = vec2(uv.x * (u_res.x / u_res.y), uv.y) * 1.55;
  float t = u_t * (0.028 + 0.032 * u_energia);

  /* Dois campos arrastando em direções diferentes, o segundo deformado pelo
     primeiro. É o que transforma manchas paradas em fluxo. */
  float f1 = fbm(p + vec2(t, -t * 0.62));
  float f2 = fbm(p * 1.75 + vec2(-t * 0.8, t * 0.55) + f1 * 1.3);
  float m  = smoothstep(0.22, 0.92, f1 * 0.62 + f2 * 0.52);

  vec3 cor = mix(u_sombra, u_luz, m);
  cor *= 0.22 + 0.78 * m;
  cor *= 0.42 + 0.58 * u_energia;

  /* Vinheta no shader: concentra a luz no centro e apaga as bordas, onde
     ficam os botões. Sai de graça aqui e economiza uma camada no DOM. */
  float d = distance(uv, vec2(0.5, 0.46));
  cor *= 1.0 - 0.88 * smoothstep(0.32, 1.0, d);

  cor += vec3(0.063, 0.059, 0.051);   /* piso: o mesmo --bg-0 da folha */
  gl_FragColor = vec4(cor, 1.0);
}
`;

function startAurora() {
  const cv = $("aurora");
  if (!cv) return;
  if (auroraWebGL(cv)) return;
  auroraCanvas2D(cv);
}

/** Caminho preferido. Devolve false se a placa ou o navegador não colaborarem. */
function auroraWebGL(cv) {
  let gl;
  try {
    const opts = { alpha: false, antialias: false, depth: false, stencil: false,
                   powerPreference: "low-power", failIfMajorPerformanceCaveat: true };
    gl = cv.getContext("webgl", opts) || cv.getContext("experimental-webgl", opts);
  } catch { return false; }
  if (!gl) return false;

  function compilar(tipo, fonte) {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, fonte);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn("shader recusado:", gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const vs = compilar(gl.VERTEX_SHADER, AURORA_VS);
  const fs = compilar(gl.FRAGMENT_SHADER, AURORA_FS);
  if (!vs || !fs) return false;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn("programa não linkou:", gl.getProgramInfoLog(prog));
    return false;
  }
  gl.useProgram(prog);

  /* Um triângulo maior que a tela cobre tudo com três vértices em vez de
     seis, e sem a costura diagonal que dois triângulos deixam. */
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(prog, "pos");
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, "u_res");
  const uT = gl.getUniformLocation(prog, "u_t");
  const uLuz = gl.getUniformLocation(prog, "u_luz");
  const uSombra = gl.getUniformLocation(prog, "u_sombra");
  const uEnergia = gl.getUniformLocation(prog, "u_energia");

  /* Meia resolução: o efeito é névoa, e o navegador estica sem que ninguém
     perceba. É a diferença entre rodar e engasgar num aparelho antigo. */
  const ESCALA = 0.45;
  function resize() {
    cv.width = Math.max(1, Math.floor(innerWidth * ESCALA));
    cv.height = Math.max(1, Math.floor(innerHeight * ESCALA));
    gl.viewport(0, 0, cv.width, cv.height);
    gl.uniform2f(uRes, cv.width, cv.height);
  }
  resize();
  addEventListener("resize", resize, { passive: true });

  const luz = [0.66, 0.36, 0.26];
  const sombra = [0.13, 0.10, 0.09];
  let energia = 0.32;
  let relogio = 0;
  let ultimo = 0;

  function quadro(agora) {
    requestAnimationFrame(quadro);
    if (body.dataset.lite === "1" || document.hidden || saverOn) return;
    if (gl.isContextLost && gl.isContextLost()) return;
    if (agora - ultimo < 32) return;           // teto de ~30 fps
    const dt = Math.min(120, agora - ultimo || 16);
    ultimo = agora;
    relogio += dt / 1000;

    const alvo = AURORA_ALVOS[body.dataset.state] || AURORA_ALVOS.idle;
    for (let i = 0; i < 3; i++) {
      luz[i] += (alvo[0][i] - luz[i]) * 0.03;
      sombra[i] += (alvo[1][i] - sombra[i]) * 0.03;
    }
    energia += (alvo[2] - energia) * 0.03;

    gl.uniform1f(uT, relogio);
    gl.uniform3f(uLuz, luz[0], luz[1], luz[2]);
    gl.uniform3f(uSombra, sombra[0], sombra[1], sombra[2]);
    gl.uniform1f(uEnergia, energia);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  requestAnimationFrame(quadro);

  /* Android recolhe o contexto quando quer. Perder o fundo não pode derrubar
     o painel: entra o modo leve, que já tem gradiente estático. */
  cv.addEventListener("webglcontextlost", (ev) => {
    ev.preventDefault();
    body.dataset.lite = "1";
  });
  return true;
}

/** Plano B, o desenho 2D de antes: manchas de luz derivando em ~24 fps. */
function auroraCanvas2D(cv) {
  const ctx = cv.getContext("2d", { alpha: false });
  if (!ctx) return;

  let w = 0;
  let h = 0;
  const ESCALA = 0.34;

  const manchas = [
    { x: 0.22, y: 0.28, r: 0.55, vx: 0.000021, vy: 0.000013 },
    { x: 0.78, y: 0.36, r: 0.48, vx: -0.000017, vy: 0.000022 },
    { x: 0.52, y: 0.82, r: 0.62, vx: 0.000012, vy: -0.000019 },
  ];

  /* Mesmos alvos do shader, em 0–255 e com uma terceira mancha de apoio. */
  const cor = (a) => a.map((c) => Math.round(c * 255));
  const PALETAS = {};
  for (const [nome, alvo] of Object.entries(AURORA_ALVOS)) {
    const luz = cor(alvo[0]);
    const meio = cor(alvo[0].map((c, i) => (c + alvo[1][i]) / 2));
    PALETAS[nome] = [luz, meio, cor(alvo[1].map((c) => c * 2.2))];
  }
  const atual = PALETAS.idle.map((c) => [...c]);

  function resize() {
    w = cv.width = Math.max(1, Math.floor(innerWidth * ESCALA));
    h = cv.height = Math.max(1, Math.floor(innerHeight * ESCALA));
  }
  resize();
  addEventListener("resize", resize, { passive: true });

  let ultimo = 0;
  function quadro(agora) {
    requestAnimationFrame(quadro);
    if (body.dataset.lite === "1" || document.hidden || saverOn) return;
    if (agora - ultimo < 42) return;   // ~24 fps já basta para algo tão lento
    const dt = Math.min(120, agora - ultimo);
    ultimo = agora;

    const alvo = PALETAS[body.dataset.state] || PALETAS.idle;
    for (let i = 0; i < 3; i++) {
      for (let k = 0; k < 3; k++) atual[i][k] += (alvo[i][k] - atual[i][k]) * 0.02;
    }

    ctx.fillStyle = "#100F0D";
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";

    manchas.forEach((b, i) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x < 0.1 || b.x > 0.9) b.vx *= -1;
      if (b.y < 0.1 || b.y > 0.9) b.vy *= -1;

      const [r, g, bl] = atual[i].map(Math.round);
      const raio = b.r * Math.max(w, h);
      const grad = ctx.createRadialGradient(b.x * w, b.y * h, 0, b.x * w, b.y * h, raio);
      grad.addColorStop(0, `rgba(${r},${g},${bl},.5)`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    });

    ctx.globalCompositeOperation = "source-over";
  }
  requestAnimationFrame(quadro);
}

/* ══════════════════════════════ modo leve ═══════════════════════════════ */

/**
 * O painel mede a si mesmo. Se os quadros não fecham, ele desliga desfoque,
 * sombra e fundo animado sozinho — melhor um painel simples e fluido do que
 * um bonito que engasga. A escolha fica salva no aparelho.
 */
function watchPerformance() {
  const forced = new URLSearchParams(location.search).get("lite");
  const saved = localStorage.getItem("deck-lite");
  if (forced === "1" || saved === "1") return setLite(true, false);
  if (forced === "0") return setLite(false, false);

  let frames = 0;
  let start = performance.now();
  let bad = 0;

  function sample(now) {
    frames++;
    const span = now - start;
    if (span >= 2000) {
      const fps = (frames * 1000) / span;
      frames = 0;
      start = now;
      // Três janelas ruins seguidas antes de decidir: evita punir o carregamento.
      if (fps < 26) {
        if (++bad >= 3) return setLite(true, true);
      } else {
        bad = 0;
      }
    }
    if (body.dataset.lite !== "1") requestAnimationFrame(sample);
  }
  requestAnimationFrame(sample);
}

function setLite(on, announce) {
  body.dataset.lite = on ? "1" : "0";
  localStorage.setItem("deck-lite", on ? "1" : "0");
  if (on && announce) toast("Modo leve ligado — animações reduzidas para não travar", "ok");
}

/* ══════════════════════════ protetor de tela ════════════════════════════ */

function maybeSaver() {
  const min = state && state.config ? state.config.screensaverMin : 0;
  if (!min) return;
  const idleFor = Date.now() - lastInteraction;
  const busy = state && (state.status === "waiting" || (state.gate && state.gate.pending.length));
  if (!saverOn && idleFor > min * 60000 && !busy) showSaver();
  if (saverOn) updateSaver();
}

function showSaver() {
  saverOn = true;
  $("saver").hidden = false;
  updateSaver();
}

function hideSaver() {
  saverOn = false;
  $("saver").hidden = true;
  lastInteraction = Date.now();
}

function updateSaver() {
  const now = new Date();
  $("saverClock").textContent = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (!state) return;
  const f = state.usage.five && state.usage.five.pct;
  const s = state.usage.seven && state.usage.seven.pct;
  $("saverBar5").style.width = `${clamp(f || 0, 0, 100)}%`;
  $("saverBar7").style.width = `${clamp(s || 0, 0, 100)}%`;
  $("saverNote").textContent =
    f == null ? "" : `5h ${Math.round(f)}%   ·   7d ${s == null ? "--" : Math.round(s)}%`;
}

/* ══════════════════════════════ avisos ══════════════════════════════════ */

let toastTimer = null;
function toast(msg, kind = "") {
  const el = $("toast");
  el.textContent = msg;
  el.dataset.kind = kind;
  el.dataset.show = "1";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.dataset.show = "0"), 4200);
}

/* ══════════════════════════════ inicialização ═══════════════════════════ */

function boot() {
  if (!TOKEN) {
    toast("Sem token na URL — os botões não vão funcionar. Abra o endereço que o servidor imprimiu.", "error");
  }

  $("tabToggle").addEventListener("click", () => {
    const d = $("drawer");
    d.hidden = !d.hidden;
    if (!d.hidden && state) paintDrawer(state);
    lastInteraction = Date.now();
  });
  $("drawerClose").addEventListener("click", () => ($("drawer").hidden = true));
  $("saver").addEventListener("pointerdown", hideSaver);

  for (const ev of ["pointerdown", "keydown"]) {
    addEventListener(ev, () => {
      lastInteraction = Date.now();
      if (saverOn) hideSaver();
    }, { passive: true });
  }

  // Tela cheia, tela sempre acesa e áudio — tudo depende do primeiro toque.
  addEventListener("pointerdown", async function first() {
    removeEventListener("pointerdown", first);
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
    } catch { /* sem áudio, tudo bem */ }
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch { /* quiosque já cuida disso */ }
    try {
      if (navigator.wakeLock) {
        let lock = await navigator.wakeLock.request("screen");
        // O bloqueio cai quando a aba perde o foco: pega de volta ao voltar.
        document.addEventListener("visibilitychange", async () => {
          if (!document.hidden && navigator.wakeLock) {
            try { lock = await navigator.wakeLock.request("screen"); } catch { /* nada */ }
          }
        });
      }
    } catch { /* Fully Kiosk tem a própria opção */ }
  }, { once: false });

  $("markSlot").innerHTML = marcaClaude("marca-fita");
  $("saverMark").innerHTML = marcaClaude("marca-protetor");

  startAurora();
  watchPerformance();
  connect();
  setInterval(tickClock, 1000);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => { /* opcional */ });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
