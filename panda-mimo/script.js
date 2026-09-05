/* =========================================================
   Panda Mimo — comportamento da página
   ========================================================= */

/* ---------- CONFIGURAÇÃO: edite aqui ----------
   WHATSAPP: só números, com DDI e DDD. Ex.: "5511999998888"
   INSTAGRAM / TIKTOK: só o @, sem o arroba.                */
const CONFIG = {
  WHATSAPP: "5500000000000",
  INSTAGRAM: "pandamimo",
  TIKTOK: "pandamimo",
};

/* ---------- links de contato ---------- */
const waLink = (msg) =>
  `https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent(msg)}`;

document.querySelectorAll(".js-wa").forEach((a) => {
  a.href = waLink(a.dataset.msg || "Oi, Panda Mimo! 🐼");
  a.target = "_blank";
  a.rel = "noopener";
});
document.querySelectorAll(".js-ig").forEach((a) => {
  a.href = `https://instagram.com/${CONFIG.INSTAGRAM}`;
});
document.querySelectorAll(".js-tt").forEach((a) => {
  a.href = `https://tiktok.com/@${CONFIG.TIKTOK}`;
});

document.getElementById("ano").textContent = new Date().getFullYear();

/* ---------- Monte seu mimo ---------- */
const form = document.getElementById("builder");
const preview = document.querySelector(".preview");
const count = document.getElementById("b-count");
const bases = {
  garrafa: document.getElementById("pv-garrafa"),
  caneca: document.getElementById("pv-caneca"),
  copo: document.getElementById("pv-copo"),
};

const CORES = {
  creme:   { fill: "#F3EEE4", ink: "#171512" },
  salvia:  { fill: "#A8C5A2", ink: "#171512" },
  pessego: { fill: "#FFB59C", ink: "#171512" },
  preta:   { fill: "#1F1D1A", ink: "#FBF6EF" },
};
const LETRAS = {
  redonda:    { font: '"Fredoka", "Nunito", sans-serif', base: 30 },
  manuscrita: { font: '"Caveat", cursive', base: 40 },
};
const ROTULOS = {
  garrafa: "garrafa térmica", caneca: "caneca", copo: "copo térmico",
  creme: "creme", salvia: "sálvia", pessego: "pêssego", preta: "preta",
  redonda: "letra redondinha", manuscrita: "letra manuscrita",
};

function estado() {
  const d = new FormData(form);
  const qtd = Math.min(500, Math.max(1, parseInt(d.get("qtd"), 10) || 1));
  return {
    nome: (d.get("nome") || "").trim(),
    item: d.get("item"),
    cor: d.get("cor"),
    letra: d.get("letra"),
    panda: d.get("panda") === "on",
    qtd,
  };
}

function render() {
  const s = estado();
  const texto = s.nome || "Seu nome";
  const cor = CORES[s.cor];
  const letra = LETRAS[s.letra];

  // a fonte encolhe conforme o texto cresce, para caber na peça
  const len = texto.length;
  const size = len <= 6 ? letra.base : Math.max(15, letra.base - (len - 6) * 1.7);

  preview.style.setProperty("--pv", cor.fill);
  preview.style.setProperty("--pv-ink", cor.ink);
  preview.style.setProperty("--pv-font", letra.font);
  preview.style.setProperty("--pv-size", `${size}px`);
  preview.dataset.cor = s.cor;
  preview.dataset.panda = s.panda ? "on" : "off";

  Object.entries(bases).forEach(([k, g]) => (g.hidden = k !== s.item));
  preview.querySelectorAll(".pv-text").forEach((t) => {
    t.textContent = texto;
    t.style.fontSize = "";
  });
  // se o texto ainda não cabe na largura da peça, encolhe a fonte até caber
  const larguraPeca = { garrafa: 84, caneca: 120, copo: 92 }[s.item];
  const el = bases[s.item].querySelector(".pv-text");
  if (el && el.getComputedTextLength) {
    el.removeAttribute("textLength"); el.removeAttribute("lengthAdjust");
    const medida = el.getComputedTextLength();
    if (medida > larguraPeca) {
      // reduz a fonte na proporção exata (com piso de 10px); se ainda assim não couber, comprime o texto
      const fs = Math.max(10, size * (larguraPeca / medida) * 0.98);
      el.style.fontSize = `${fs}px`;
      if (el.getComputedTextLength() > larguraPeca) {
        el.setAttribute("textLength", larguraPeca);
        el.setAttribute("lengthAdjust", "spacingAndGlyphs");
      }
    }
  }
  count.textContent = s.nome.length;
}

const qtdInput = document.getElementById("b-qtd");
qtdInput.addEventListener("change", () => { qtdInput.value = estado().qtd; render(); });
qtdInput.addEventListener("blur", () => { qtdInput.value = estado().qtd; });

form.addEventListener("input", render);
render();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(render); // reajusta quando as fontes chegam

document.getElementById("b-send").addEventListener("click", () => {
  const s = estado();
  const msg =
    `Oi, Panda Mimo! Montei uma ideia no site 🐼\n` +
    `• Base: ${ROTULOS[s.item]}\n` +
    `• Cor: ${ROTULOS[s.cor]}\n` +
    `• Escrito: "${s.nome || "(ainda vou decidir)"}"\n` +
    `• ${ROTULOS[s.letra]}${s.panda ? ", com o pandinha" : ", sem o pandinha"}\n` +
    `• Quantidade: ${s.qtd}\n` +
    `Pode me passar valor e prazo?`;
  window.open(waLink(msg), "_blank", "noopener");
});

/* ---------- FAQ: um aberto por vez, com aria-expanded ---------- */
const faqs = document.querySelectorAll(".faq__item");
const syncFaq = () => faqs.forEach((d) => d.querySelector("summary").setAttribute("aria-expanded", String(d.open)));
faqs.forEach((d) =>
  d.addEventListener("toggle", () => {
    if (d.open) faqs.forEach((o) => o !== d && (o.open = false));
    syncFaq();
  })
);
syncFaq();

/* ---------- menu do celular ---------- */
const topbar = document.querySelector(".topbar");
const toggle = document.querySelector(".menu-toggle");
const nav = document.getElementById("nav-principal");
const setMenu = (open) => {
  topbar.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
};
toggle.addEventListener("click", () => setMenu(!topbar.classList.contains("is-open")));
nav.addEventListener("click", (e) => e.target.closest("a") && setMenu(false));
document.addEventListener("keydown", (e) => e.key === "Escape" && topbar.classList.contains("is-open") && (setMenu(false), toggle.focus()));
document.addEventListener("click", (e) => topbar.classList.contains("is-open") && !topbar.contains(e.target) && setMenu(false));

/* ---------- botão flutuante: sai do caminho quando cobriria um CTA ou o teclado está aberto ---------- */
const fab = document.querySelector(".fab");
const blockers = [document.getElementById("contato"), document.querySelector(".builder__form"), document.querySelector(".follow__links")].filter(Boolean);
const visiveis = new Set();
let teclado = false;
const updateFab = () => fab.classList.toggle("is-hidden", teclado || visiveis.size > 0);
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => (en.isIntersecting ? visiveis.add(en.target) : visiveis.delete(en.target)));
    updateFab();
  }, { threshold: 0.15 });
  blockers.forEach((b) => io.observe(b));
}
document.addEventListener("focusin", (e) => { if (e.target.matches("input, textarea")) { teclado = true; updateFab(); } });
document.addEventListener("focusout", (e) => { if (e.target.matches("input, textarea")) { teclado = false; updateFab(); } });


/* ---------- carrossel de fotos do produto ---------- */
const semAnimacao = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
document.querySelectorAll("[data-carousel]").forEach((car) => {
  const track = car.querySelector(".carousel__track");
  const slides = [...track.children];
  const dots = [...car.querySelectorAll(".carousel__dot")];
  const status = car.querySelector(".carousel__status");
  const atual = () => Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
  const irPara = (i) => track.scrollTo({ left: track.clientWidth * i, behavior: semAnimacao ? "auto" : "smooth" });
  const sincroniza = () => {
    const i = atual();
    dots.forEach((d, k) => (k === i ? d.setAttribute("aria-current", "true") : d.removeAttribute("aria-current")));
    status.textContent = `Foto ${i + 1} de ${slides.length}`;
  };
  dots.forEach((d, i) => d.addEventListener("click", () => irPara(i)));
  car.querySelector(".carousel__nav--prev").addEventListener("click", () => irPara(Math.max(0, atual() - 1)));
  car.querySelector(".carousel__nav--next").addEventListener("click", () => irPara(Math.min(slides.length - 1, atual() + 1)));
  let t;
  track.addEventListener("scroll", () => { clearTimeout(t); t = setTimeout(sincroniza, 70); });
  // setas do teclado quando o trilho está em foco
  track.tabIndex = 0;
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); irPara(Math.min(slides.length - 1, atual() + 1)); }
    if (e.key === "ArrowLeft") { e.preventDefault(); irPara(Math.max(0, atual() - 1)); }
  });
});
