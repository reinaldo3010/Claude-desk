/* =========================================================
   Panda Mimo — comportamento da página
   ========================================================= */

/* ---------- CONFIGURAÇÃO: edite aqui ----------
   WHATSAPP: só números, com DDI e DDD. Ex.: "5511999998888"
   INSTAGRAM: só o @, sem o arroba.                          */
const CONFIG = {
  WHATSAPP: "5500000000000",
  INSTAGRAM: "pandamimo",
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

document.getElementById("ano").textContent = new Date().getFullYear();

/* ---------- Monte seu mimo ---------- */
const form = document.getElementById("builder");
const preview = document.querySelector(".preview");
const nome = document.getElementById("b-nome");
const count = document.getElementById("b-count");
const garrafa = document.getElementById("pv-garrafa");
const caneca = document.getElementById("pv-caneca");

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
  garrafa: "garrafa térmica", caneca: "caneca",
  creme: "creme", salvia: "sálvia", pessego: "pêssego", preta: "preta",
  redonda: "letra redondinha", manuscrita: "letra manuscrita",
};

function estado() {
  const d = new FormData(form);
  return {
    nome: (d.get("nome") || "").trim(),
    item: d.get("item"),
    cor: d.get("cor"),
    letra: d.get("letra"),
    panda: d.get("panda") === "on",
  };
}

function render() {
  const s = estado();
  const texto = s.nome || "Seu nome";
  const cor = CORES[s.cor];
  const letra = LETRAS[s.letra];

  // tamanho da fonte encolhe conforme o texto cresce
  const len = texto.length;
  const size = len <= 6 ? letra.base : Math.max(15, letra.base - (len - 6) * 1.7);

  preview.style.setProperty("--pv", cor.fill);
  preview.style.setProperty("--pv-ink", cor.ink);
  preview.style.setProperty("--pv-font", letra.font);
  preview.style.setProperty("--pv-size", `${size}px`);
  preview.dataset.cor = s.cor;
  preview.dataset.panda = s.panda ? "on" : "off";

  garrafa.hidden = s.item !== "garrafa";
  caneca.hidden = s.item !== "caneca";
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
    `Pode me passar valor e prazo?`;
  window.open(waLink(msg), "_blank", "noopener");
});
