/* =========================================================
   Panda Mimo — comportamento da página

   Os produtos são montados a partir dos dados, não escritos no HTML:
   primeiro com a cópia que vem junto com o site (produtos.js), para a
   página já nascer completa, e depois com o que estiver no banco, se
   ele responder. Assim o painel manda no catálogo sem quebrar o site
   quando a internet falha.
   ========================================================= */

/* ---------- contatos (a cópia local vale até o banco responder) ---------- */
const CONTATO = {
  whatsapp: "5500000000000",
  instagram: "pandamimo",
  tiktok: "pandamimo",
};

const waLink = (msg) =>
  `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(msg)}`;

const esc = (t) =>
  String(t == null ? "" : t).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

function aplicaContatos(escopo = document) {
  escopo.querySelectorAll(".js-wa").forEach((a) => {
    a.href = waLink(a.dataset.msg || "Oi, Panda Mimo! 🐼");
    a.target = "_blank";
    a.rel = "noopener";
  });
  escopo.querySelectorAll(".js-ig").forEach((a) => (a.href = `https://instagram.com/${CONTATO.instagram}`));
  escopo.querySelectorAll(".js-tt").forEach((a) => (a.href = `https://tiktok.com/@${CONTATO.tiktok}`));
}

document.getElementById("ano").textContent = new Date().getFullYear();

/* =========================================================
   Catálogo
   ========================================================= */
const lista = document.getElementById("lista-produtos");

function fotoHTML(f) {
  return `<img src="${esc(f.url)}" alt="${esc(f.alt)}" loading="lazy" decoding="async" width="${f.largura || 760}" height="${f.altura || 760}">`;
}

function vitrineHTML(p) {
  const fotos = p.fotos || [];
  if (!fotos.length) return '<div class="product__photo carousel carousel--unica"></div>';
  if (p.em_breve) return `<div class="product__photo product__photo--sticker">${fotoHTML(fotos[0])}</div>`;
  if (fotos.length === 1)
    return `<div class="product__photo carousel carousel--unica"><ul class="carousel__track"><li class="carousel__slide">${fotoHTML(fotos[0])}</li></ul></div>`;

  const slides = fotos.map((f) => `<li class="carousel__slide">${fotoHTML(f)}</li>`).join("");
  const bolinhas = fotos
    .map((_, i) => `<button type="button" class="carousel__dot" aria-label="Ver a foto ${i + 1} de ${fotos.length}"${i === 0 ? ' aria-current="true"' : ""}></button>`)
    .join("");
  return `<div class="product__photo carousel" data-carousel role="group" aria-label="Fotos: ${esc(p.nome)}">
      <ul class="carousel__track">${slides}</ul>
      <button type="button" class="carousel__nav carousel__nav--prev" aria-label="Foto anterior">‹</button>
      <button type="button" class="carousel__nav carousel__nav--next" aria-label="Próxima foto">›</button>
      <div class="carousel__dots">${bolinhas}</div>
      <p class="carousel__status" aria-live="polite">Foto 1 de ${fotos.length}</p>
    </div>`;
}

function produtoHTML(p) {
  const etiquetas = (p.etiquetas || []).map((e) => `<li>${esc(e)}</li>`).join("");
  return `<article class="product${p.em_breve ? " product--soon" : ""}">
      ${vitrineHTML(p)}
      <div class="product__body">
        <h3>${esc(p.nome)}</h3>
        <p>${esc(p.descricao)}</p>
        <ul class="chips">${etiquetas}</ul>
      </div>
      <a class="product__cta js-wa" href="#contato" data-msg="${esc(p.mensagem)}">${esc(p.rotulo_botao || "Quero essa")} <span aria-hidden="true">›</span></a>
    </article>`;
}

function montaProdutos(produtos) {
  if (!lista || !Array.isArray(produtos) || !produtos.length) return;
  lista.innerHTML = produtos.map(produtoHTML).join("\n");
  aplicaContatos(lista);
  iniciaCarrosseis(lista);
}

/* ---------- carrossel de fotos do produto ---------- */
const semAnimacao = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function iniciaCarrosseis(escopo = document) {
  escopo.querySelectorAll("[data-carousel]").forEach((car) => {
    if (car.dataset.pronto) return;
    car.dataset.pronto = "1";
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
    track.tabIndex = 0;
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); irPara(Math.min(slides.length - 1, atual() + 1)); }
      if (e.key === "ArrowLeft") { e.preventDefault(); irPara(Math.max(0, atual() - 1)); }
    });
  });
}

/* ---------- primeiro a cópia local, depois o banco ---------- */
montaProdutos(window.PANDA_PRODUTOS);
aplicaContatos();

async function carregaDoBanco() {
  const cfg = window.PANDA_CONFIG;
  if (!cfg || !cfg.URL || !cfg.CHAVE) return;
  const cabecalho = { apikey: cfg.CHAVE, Authorization: `Bearer ${cfg.CHAVE}` };
  const parar = AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined;
  try {
    const [rp, rc] = await Promise.all([
      fetch(`${cfg.URL}/rest/v1/pm_produtos?select=slug,nome,descricao,etiquetas,mensagem,rotulo_botao,em_breve,pm_produto_fotos(url,alt,ordem,largura,altura)&publicado=eq.true&order=ordem`, { headers: cabecalho, signal: parar }),
      fetch(`${cfg.URL}/rest/v1/pm_config?select=whatsapp,instagram,tiktok,aviso_topo&limit=1`, { headers: cabecalho, signal: parar }),
    ]);
    if (rc.ok) {
      const [c] = await rc.json();
      if (c) {
        if (c.whatsapp) CONTATO.whatsapp = c.whatsapp;
        if (c.instagram) CONTATO.instagram = c.instagram;
        if (c.tiktok) CONTATO.tiktok = c.tiktok;
        const aviso = document.querySelector(".announce__in p");
        if (aviso && c.aviso_topo) aviso.textContent = c.aviso_topo;
        aplicaContatos();
      }
    }
    if (!rp.ok) return;
    const dados = await rp.json();
    if (!Array.isArray(dados) || !dados.length) return;
    montaProdutos(
      dados.map((p) => ({
        ...p,
        fotos: (p.pm_produto_fotos || []).slice().sort((a, b) => a.ordem - b.ordem),
      }))
    );
  } catch (e) {
    /* sem banco, o site segue com a cópia local */
  }
}
carregaDoBanco();

/* =========================================================
   Monte seu mimo
   ========================================================= */
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
if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);

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

/* ---------- dúvidas: uma aberta por vez, com aria-expanded ---------- */
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
