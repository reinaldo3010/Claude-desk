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
  preview.querySelectorAll(".pv-text").forEach((t) => (t.textContent = texto));
  count.textContent = s.nome.length;
}

form.addEventListener("input", render);
render();

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

/* ---------- FAQ: um aberto por vez ---------- */
const faqs = document.querySelectorAll(".faq__item");
faqs.forEach((d) =>
  d.addEventListener("toggle", () => {
    if (d.open) faqs.forEach((o) => o !== d && (o.open = false));
  })
);
