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
  ok:   { a: "#34D8A0", b: "#5BE6C8", glow: "rgba(52,216,160,.40)" },
  warn: { a: "#F2B544", b: "#FFD98A", glow: "rgba(242,181,68,.40)" },
  crit: { a: "#FF5C48", b: "#FF9478", glow: "rgba(255,92,72,.45)" },
  idle: { a: "#4A5568", b: "#4A5568", glow: "rgba(0,0,0,0)" },
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

let deckBuilt = "";
const confirmTimers = new Map();

function buildDeck(actions) {
  const key = actions.map((a) => a.id).join("|");
  if (deckBuilt === key) return;
  deckBuilt = key;

  const deck = $("deck");
  deck.innerHTML = "";
  const groups = ["permission", "control", "prompt"];

  for (const g of groups) {
    const items = actions.filter((a) => (a.group || "control") === g);
    if (!items.length) continue;
    const row = document.createElement("div");
    row.className = "deck-row";
    row.dataset.group = g;
    row.style.gridTemplateColumns = `repeat(${items.length}, 1fr)`;
    for (const a of items) row.appendChild(makeButton(a));
    deck.appendChild(row);
  }
}

function makeButton(a) {
  const b = document.createElement("button");
  b.className = "btn";
  b.dataset.tone = a.tone || "neutral";
  b.dataset.id = a.id;
  if (a.confirm) b.dataset.needsConfirm = "1";
  b.innerHTML =
    `<svg><use href="#i-${a.icon || "dot"}"></use></svg>` +
    `<span class="btn-label">${a.label}</span>` +
    (a.hint ? `<span class="btn-hint">${a.hint}</span>` : "");
  b.addEventListener("pointerdown", (e) => ripple(b, e));
  b.addEventListener("click", () => press(a, b));
  return b;
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
 * "Sempre aprovar" e "commitar" mudam o mundo — um esbarrão no tablet não pode
 * disparar isso. A janela é curta o bastante para não virar burocracia.
 */
function press(action, btn) {
  lastInteraction = Date.now();

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
    } else {
      flash(btn, "fail");
      beep(200, 0.16);
      toast(data.error || `erro ${res.status}`, "error");
      if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
    }
  } catch (err) {
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

/** Habilita as decisões só quando existe permissão pendente de verdade. */
function armButtons(s) {
  const pending = s.gate && s.gate.pending.length > 0;
  const gateOn = s.config.gateEnabled;

  for (const btn of document.querySelectorAll(".btn[data-id]")) {
    const a = s.actions.find((x) => x.id === btn.dataset.id);
    if (!a || a.armed !== "gate") continue;
    // Com o portão desligado, as teclas seguem valendo: não desabilita.
    const armed = pending || !gateOn;
    btn.dataset.armed = pending ? "1" : "0";
    btn.disabled = !armed;
  }

  // A linha de decisões só ocupa espaço quando pode ser usada.
  const row = document.querySelector('.deck-row[data-group="permission"]');
  if (row) row.dataset.idle = gateOn && !pending ? "1" : "0";
}

/* ══════════════════════════════════ portão ══════════════════════════════ */

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

  // Botões do cartão: reaproveitam as mesmas ações do deck.
  const holder = $("gateActions");
  if (holder.dataset.built !== "1") {
    holder.dataset.built = "1";
    holder.innerHTML = "";
    for (const a of s.actions.filter((x) => x.group === "permission")) {
      holder.appendChild(makeButton(a));
    }
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
  body.dataset.state = s.status;
  sinceTs = s.since;

  $("headline").textContent = s.headline || "";
  $("detail").textContent = s.detail || "";

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
  buildDeck(s.actions);
  armButtons(s);
  paintGate(s);
  paintDrawer(s);

  if (!s.usage.ok) {
    $("detail").textContent = "Sem leitura de quota — mande uma mensagem no Claude Code";
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

/* ══════════════════════════════════ aurora ══════════════════════════════ */

/**
 * Fundo vivo: manchas de luz que derivam devagar e mudam de cor com o estado.
 * Desenhado em resolução reduzida e limitado a ~24 quadros por segundo — num
 * tablet velho, o custo real está em pintar pixels, não em calcular posições.
 */
function startAurora() {
  const cv = $("aurora");
  const ctx = cv.getContext("2d", { alpha: false });
  if (!ctx) return;

  let w = 0;
  let h = 0;
  const SCALE = 0.34;

  const blobs = [
    { x: 0.22, y: 0.28, r: 0.55, vx: 0.000021, vy: 0.000013 },
    { x: 0.78, y: 0.36, r: 0.48, vx: -0.000017, vy: 0.000022 },
    { x: 0.52, y: 0.82, r: 0.62, vx: 0.000012, vy: -0.000019 },
  ];

  const PALETTES = {
    idle:    [[26, 58, 92], [18, 74, 78], [30, 40, 84]],
    working: [[24, 92, 110], [22, 110, 88], [30, 60, 120]],
    waiting: [[132, 34, 26], [110, 44, 30], [90, 24, 40]],
    error:   [[110, 74, 22], [90, 60, 24], [70, 44, 30]],
    offline: [[20, 26, 38], [18, 24, 34], [22, 28, 40]],
    boot:    [[20, 34, 56], [18, 40, 54], [24, 30, 58]],
  };
  let cur = PALETTES.idle.map((c) => [...c]);

  function resize() {
    w = cv.width = Math.max(1, Math.floor(innerWidth * SCALE));
    h = cv.height = Math.max(1, Math.floor(innerHeight * SCALE));
  }
  resize();
  addEventListener("resize", resize, { passive: true });

  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (body.dataset.lite === "1" || document.hidden || saverOn) return;
    if (now - last < 42) return; // ~24 fps é suficiente para algo tão lento
    const dt = Math.min(120, now - last);
    last = now;

    // A paleta persegue o alvo devagar: a troca de estado vira uma maré.
    const target = PALETTES[body.dataset.state] || PALETTES.idle;
    for (let i = 0; i < 3; i++) {
      for (let k = 0; k < 3; k++) cur[i][k] += (target[i][k] - cur[i][k]) * 0.02;
    }

    ctx.fillStyle = "#05070C";
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";

    blobs.forEach((b, i) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x < 0.1 || b.x > 0.9) b.vx *= -1;
      if (b.y < 0.1 || b.y > 0.9) b.vy *= -1;

      const [r, g, bl] = cur[i].map(Math.round);
      const rad = b.r * Math.max(w, h);
      const grad = ctx.createRadialGradient(b.x * w, b.y * h, 0, b.x * w, b.y * h, rad);
      grad.addColorStop(0, `rgba(${r},${g},${bl},.55)`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    });

    ctx.globalCompositeOperation = "source-over";
  }
  requestAnimationFrame(frame);
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
