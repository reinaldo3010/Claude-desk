/* =========================================================
   Panda Mimo — comportamento da página

   Os produtos são montados a partir dos dados, não escritos no HTML:
   primeiro com a cópia que vem junto com o site (produtos.js), para a
   página já nascer completa, e depois com o que estiver no banco, se
   ele responder. Assim o painel manda no catálogo sem quebrar o site
   quando a internet falha.
   ========================================================= */

const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
   Medição própria: sem cookie, sem rastrear pessoas
   Cada visita ganha um número aleatório que morre com a aba.
   Quem pede "não rastrear" no navegador não entra na conta.
   ========================================================= */
const medir = (() => {
  const cfg = window.PANDA_CONFIG;
  if (!cfg || !cfg.URL || !cfg.CHAVE || navigator.doNotTrack === "1") return () => {};
  let sessao = "";
  try {
    sessao = sessionStorage.getItem("pm_s") || Math.random().toString(36).slice(2, 12);
    sessionStorage.setItem("pm_s", sessao);
  } catch (e) { sessao = Math.random().toString(36).slice(2, 12); }
  const origem = (() => { try { return document.referrer ? new URL(document.referrer).hostname : ""; } catch (e) { return ""; } })();
  return (evento, rotulo = "") => {
    const corpo = JSON.stringify({
      evento, rotulo: String(rotulo).replace(/\s+/g, " ").trim().slice(0, 200),
      pagina: (location.pathname + location.hash).slice(0, 200),
      origem: origem.slice(0, 120), largura: window.innerWidth, sessao,
    });
    fetch(`${cfg.URL}/rest/v1/pm_eventos`, {
      method: "POST", keepalive: true,
      headers: { apikey: cfg.CHAVE, Authorization: `Bearer ${cfg.CHAVE}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: corpo,
    }).catch(() => {});
  };
})();
medir("pageview");
document.addEventListener("click", (e) => {
  const zap = e.target.closest(".js-wa");
  if (zap) medir("clique_whatsapp", zap.dataset.rotulo || zap.textContent || zap.getAttribute("aria-label") || "whatsapp");
  const nav = e.target.closest(".carousel__nav, .carousel__dot");
  if (nav) medir("carrossel", nav.closest("[data-carousel]")?.getAttribute("aria-label") || "");
});

/* =========================================================
   Catálogo
   ========================================================= */
const lista = document.getElementById("lista-produtos");
let produtosNaTela = [];

/* temas do catálogo: viram os chips de filtro; o nome de cada um é regra do manual (4.5) */
const TEMAS = { bebidas: "Bebidas", escola: "Escola e rotina", casa: "Casa e cozinha", festa: "Festa e padrinhos", bebe: "Bebê", pet: "Pet", presente: "Presentear" };
const normaliza = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

function fotoHTML(f) {
  /* telas de alta densidade recebem a versão 2x (1520 px) quando ela existe */
  const srcset = f.url_2x ? ` srcset="${esc(f.url)} 1x, ${esc(f.url_2x)} 2x"` : "";
  return `<img src="${esc(f.url)}"${srcset} alt="${esc(f.alt)}" loading="lazy" decoding="async" width="${f.largura || 760}" height="${f.altura || 760}">`;
}

function vitrineHTML(p) {
  const fotos = p.fotos || [];
  /* lançamento em teste: o selo "Em breve" fica sobre o quadro, lido antes da ilustração */
  const selo = p.lancamento ? '<span class="product__selo">Em breve</span>' : "";
  if (!fotos.length) return `<div class="product__photo carousel carousel--unica">${selo}</div>`;
  if (p.em_breve) return `<div class="product__photo product__photo--sticker">${fotoHTML(fotos[0])}</div>`;
  if (fotos.length === 1)
    return `<div class="product__photo carousel carousel--unica">${selo}<ul class="carousel__track"><li class="carousel__slide">${fotoHTML(fotos[0])}</li></ul></div>`;

  const slides = fotos.map((f) => `<li class="carousel__slide">${fotoHTML(f)}</li>`).join("");
  const bolinhas = fotos
    .map((_, i) => `<button type="button" class="carousel__dot" aria-label="Ver a foto ${i + 1} de ${fotos.length}"${i === 0 ? ' aria-current="true"' : ""}></button>`)
    .join("");
  return `<div class="product__photo carousel" data-carousel role="group" aria-label="Fotos: ${esc(p.nome)}">${selo}
      <ul class="carousel__track">${slides}</ul>
      <button type="button" class="carousel__nav carousel__nav--prev" aria-label="Foto anterior">‹</button>
      <button type="button" class="carousel__nav carousel__nav--next" aria-label="Próxima foto">›</button>
      <div class="carousel__dots">${bolinhas}</div>
      <p class="carousel__status" aria-live="polite">Foto 1 de ${fotos.length}</p>
    </div>`;
}

function produtoHTML(p) {
  const etiquetas = (p.etiquetas || []).map((e) => `<li>${esc(e)}</li>`).join("");
  const rotulo = p.rotulo_botao || (p.lancamento ? "Me avise" : "Quero essa");
  const classes = ["product", p.em_breve ? "product--soon" : "", p.lancamento ? "product--lancamento" : ""].filter(Boolean).join(" ");
  const semDetalhe = p.em_breve || p.lancamento; // aviso e lançamento não têm tela de detalhe
  const tipo = p.em_breve ? "aviso" : p.lancamento ? "lancamento" : "peca";
  const busca = normaliza([p.nome, p.descricao, ...(p.etiquetas || []), TEMAS[p.tema] || "", p.tema || ""].join(" "));
  return `<article class="${classes}" data-slug="${esc(p.slug)}" data-tipo="${tipo}" data-tema="${esc(p.tema || "")}" data-busca="${esc(busca)}">
      ${vitrineHTML(p)}
      <div class="product__body">
        <h3>${esc(p.nome)}</h3>
        ${p.preco_texto && !p.lancamento ? `<p class="product__preco">${esc(p.preco_texto)}</p>` : ""}
        <p>${esc(p.descricao)}</p>
        <ul class="chips">${etiquetas}</ul>
        ${semDetalhe ? "" : '<button class="product__ver" type="button">Ver detalhes</button>'}
      </div>
      <a class="product__cta js-wa" href="#contato" data-msg="${esc(p.mensagem)}" data-rotulo="${esc(rotulo)} · ${esc(p.nome)}">${esc(rotulo)} <span aria-hidden="true">›</span></a>
    </article>`;
}

/* assinatura do que está na tela: se o banco devolver o mesmo conteúdo,
   não vale remontar — remontar apagaria a foto que a pessoa está vendo
   no carrossel e perderia a posição da rolagem. */
function assinatura(produtos) {
  return JSON.stringify(produtos.map((p) => [
    p.nome, p.descricao, p.detalhes || "", p.preco_texto || "", p.rotulo_botao, p.mensagem, p.em_breve, !!p.lancamento, p.tema || "",
    p.etiquetas || [], (p.fotos || []).map((f) => [f.url, f.url_2x || "", f.alt]),
  ]));
}

function montaProdutos(produtos) {
  if (!lista || !Array.isArray(produtos) || !produtos.length) return false;
  produtosNaTela = produtos;
  const nova = assinatura(produtos);
  if (lista.dataset.assinatura === nova) return false;
  lista.dataset.assinatura = nova;
  /* os lançamentos em teste ganham um título de grupo, que explica a mecânica do "Me avise" */
  const divisorHTML = `<div class="products__divisor">
      <p class="eyebrow"><span class="eyebrow__dot"></span> Em teste <span class="eyebrow__dot"></span></p>
      <h3>Você escolhe <span class="hand">o que sai primeiro.</span></h3>
      <p>Estas peças ainda estão no forno. Clique em "Me avise" na que você quer: a que tiver mais pedidos sai antes, e você fica sabendo primeiro.</p>
    </div>`;
  const partes = [];
  let divisorPosto = false;
  for (const p of produtos) {
    if (p.lancamento && !divisorPosto) { partes.push(divisorHTML); divisorPosto = true; }
    partes.push(produtoHTML(p));
  }
  lista.innerHTML = partes.join("\n");
  aplicaContatos(lista);
  iniciaCarrosseis(lista);
  montaFiltros(produtos);
  aplicaFiltro();
  return true;
}

/* ---------- carrossel de fotos do produto ---------- */
function iniciaCarrosseis(escopo = document) {
  escopo.querySelectorAll("[data-carousel]").forEach((car) => {
    if (car.dataset.pronto) return;
    car.dataset.pronto = "1";
    const track = car.querySelector(".carousel__track");
    const slides = [...track.children];
    const dots = [...car.querySelectorAll(".carousel__dot")];
    const status = car.querySelector(".carousel__status");
    const atual = () => Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
    const irPara = (i) => track.scrollTo({ left: track.clientWidth * i, behavior: reduzMovimento ? "auto" : "smooth" });
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

/* =========================================================
   Detalhe do produto
   Abre pelo botão do cartão, pela foto, ou pelo endereço #produto/slug.
   ========================================================= */
const detalhe = document.getElementById("detalhe");
let voltarFocoPara = null;

const baseDoProduto = (p) => {
  const t = `${p.slug} ${p.nome}`.toLowerCase();
  if (t.includes("garrafa")) return "garrafa";
  if (t.includes("caneca")) return "caneca";
  if (t.includes("copo")) return "copo";
  return null;
};

function abreDetalhe(slug, gatilho) {
  const p = produtosNaTela.find((x) => x.slug === slug);
  if (!p || p.em_breve || p.lancamento) return;
  voltarFocoPara = gatilho && gatilho.focus ? gatilho : null;

  document.getElementById("detalhe-titulo").textContent = p.nome;
  document.getElementById("detalhe-preco").textContent = p.preco_texto || "Valor sob consulta";
  document.getElementById("detalhe-texto").textContent = p.detalhes || p.descricao;
  document.getElementById("detalhe-chips").innerHTML = (p.etiquetas || []).map((e) => `<li>${esc(e)}</li>`).join("");

  const fotos = p.fotos || [];
  const grande = document.getElementById("detalhe-foto");
  const minis = document.getElementById("detalhe-miniaturas");
  const mostra = (i) => {
    const f = fotos[i]; if (!f) return;
    grande.srcset = f.url_2x ? `${f.url} 1x, ${f.url_2x} 2x` : "";
    grande.src = f.url; grande.alt = f.alt || p.nome;
    grande.width = f.largura || 760; grande.height = f.altura || 760;
    [...minis.children].forEach((b, k) => (k === i ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current")));
  };
  minis.innerHTML = fotos.map((f, i) =>
    `<button type="button" class="detalhe__mini" aria-label="Ver foto ${i + 1} de ${fotos.length}"><img src="${esc(f.url)}" alt="" width="${f.largura || 760}" height="${f.altura || 760}" decoding="async"></button>`
  ).join("");
  [...minis.children].forEach((b, i) => b.addEventListener("click", () => mostra(i)));
  mostra(0);

  const zap = document.getElementById("detalhe-zap");
  zap.dataset.msg = p.mensagem || `Oi, Panda Mimo! Quero ${p.nome} 🐼`;
  zap.textContent = p.rotulo_botao || "Quero essa";
  zap.dataset.rotulo = `${p.rotulo_botao || "Quero essa"} · ${p.nome} · detalhe`;
  aplicaContatos(detalhe);

  const pers = document.getElementById("detalhe-personalizar");
  const base = baseDoProduto(p);
  pers.hidden = !base;
  pers.dataset.base = base || "";

  if (!detalhe.open) detalhe.showModal();
  history.replaceState(null, "", `#produto/${slug}`);
  medir("detalhe", p.nome);
}

function fechaDetalhe() { if (detalhe.open) detalhe.close(); }

detalhe.addEventListener("close", () => {
  if (/^#produto\//.test(location.hash)) history.replaceState(null, "", "#produtos");
  if (voltarFocoPara) voltarFocoPara.focus();
});
detalhe.addEventListener("click", (e) => { if (e.target === detalhe) fechaDetalhe(); });
document.querySelector(".detalhe__fechar").addEventListener("click", fechaDetalhe);

document.getElementById("detalhe-personalizar").addEventListener("click", (e) => {
  e.preventDefault();
  const base = e.currentTarget.dataset.base;
  fechaDetalhe();
  if (base) {
    const r = document.getElementById(`i-${base}`); if (r) r.checked = true;
    const foto = document.getElementById("m-foto"); if (foto) { foto.checked = true; }
  }
  render();
  document.getElementById("monte").scrollIntoView({ behavior: reduzMovimento ? "auto" : "smooth", block: "start" });
  history.replaceState(null, "", "#monte");
  document.getElementById("b-nome").focus({ preventScroll: true });
});

lista.addEventListener("click", (e) => {
  const art = e.target.closest(".product");
  if (!art || art.classList.contains("product--soon") || art.classList.contains("product--lancamento")) return;
  const botao = e.target.closest(".product__ver");
  const foto = e.target.closest(".carousel__slide img");
  if (botao || foto) abreDetalhe(art.dataset.slug, botao || foto);
});

function abrePeloEndereco() {
  const m = location.hash.match(/^#produto\/([a-z0-9-]+)/);
  if (m) abreDetalhe(m[1]);
}
window.addEventListener("hashchange", abrePeloEndereco);


/* =========================================================
   Busca e filtros do catálogo
   Chips fixos (Tudo, Pra pedir agora, Em teste) + um chip por tema
   presente nas peças. A busca ignora acento e maiúscula.
   ========================================================= */
const buscaInput = document.getElementById("busca-pecas");
const filtrosEl = document.getElementById("filtros-pecas");
const resultadoEl = document.getElementById("catalogo-resultado");
const vazioEl = document.getElementById("catalogo-vazio");
const FILTROS_FIXOS = [["tudo", "Tudo"], ["peca", "Pra pedir agora"], ["lancamento", "Em teste"]];
let filtroAtual = "tudo";

function montaFiltros(produtos) {
  if (!filtrosEl) return;
  const ordem = Object.keys(TEMAS);
  const temas = [...new Set(produtos.map((p) => p.tema).filter((t) => t && TEMAS[t]))].sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b));
  const todos = [...FILTROS_FIXOS, ...temas.map((t) => [`tema:${t}`, TEMAS[t]])];
  if (!todos.some(([v]) => v === filtroAtual)) filtroAtual = "tudo";
  filtrosEl.innerHTML = todos.map(([v, r]) => `<button type="button" class="filtro" data-filtro="${esc(v)}" aria-pressed="${v === filtroAtual}">${esc(r)}</button>`).join("");
}

function aplicaFiltro() {
  if (!lista) return;
  const bruto = buscaInput ? buscaInput.value.trim() : "";
  const termos = normaliza(bruto).split(" ").filter(Boolean);
  const tema = filtroAtual.startsWith("tema:") ? filtroAtual.slice(5) : "";
  let visiveis = 0, lancVisiveis = 0, total = 0;
  lista.querySelectorAll(".product").forEach((el) => {
    const tipo = el.dataset.tipo || "peca";
    let ok = true;
    if (tipo === "aviso") {
      ok = !termos.length && (filtroAtual === "tudo" || filtroAtual === "lancamento");
    } else {
      total++;
      if (filtroAtual === "peca") ok = tipo === "peca";
      else if (filtroAtual === "lancamento") ok = tipo === "lancamento";
      else if (tema) ok = el.dataset.tema === tema;
      if (ok && termos.length) ok = termos.every((t) => (el.dataset.busca || "").includes(t));
      if (ok) { visiveis++; if (tipo === "lancamento") lancVisiveis++; }
    }
    el.hidden = !ok;
  });
  const divisor = lista.querySelector(".products__divisor");
  if (divisor) divisor.hidden = lancVisiveis === 0;
  if (vazioEl) {
    vazioEl.hidden = visiveis > 0;
    const zap = vazioEl.querySelector(".js-wa");
    if (zap) {
      zap.dataset.msg = bruto ? `Oi, Panda Mimo! Procurei "${bruto}" no site e não achei. Dá pra fazer? 🐼` : "Oi, Panda Mimo! Tenho uma ideia de peça que não está no site 🐼";
      aplicaContatos(vazioEl);
    }
  }
  if (resultadoEl) {
    const chip = filtrosEl && filtrosEl.querySelector(`[data-filtro="${filtroAtual}"]`);
    const onde = filtroAtual === "tudo" || !chip ? "" : ` em ${chip.textContent}`;
    const com = bruto ? ` com "${bruto}"` : "";
    resultadoEl.textContent = !bruto && filtroAtual === "tudo" ? `${total} peças no catálogo`
      : visiveis === 0 ? `Nenhuma peça${onde}${com}`
      : `${visiveis} ${visiveis === 1 ? "peça" : "peças"}${onde}${com}`;
  }
}

if (filtrosEl) filtrosEl.addEventListener("click", (e) => {
  const b = e.target.closest(".filtro"); if (!b) return;
  filtroAtual = b.dataset.filtro;
  filtrosEl.querySelectorAll(".filtro").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  aplicaFiltro();
  medir("filtro", b.textContent.trim());
});
let esperaBusca;
if (buscaInput) buscaInput.addEventListener("input", () => {
  aplicaFiltro();
  clearTimeout(esperaBusca);
  const v = buscaInput.value.trim();
  if (v.length >= 2) esperaBusca = setTimeout(() => medir("busca", v), 900);
});
const limparBusca = document.getElementById("limpar-busca");
if (limparBusca) limparBusca.addEventListener("click", () => {
  if (buscaInput) buscaInput.value = "";
  filtroAtual = "tudo";
  montaFiltros(produtosNaTela);
  aplicaFiltro();
  if (buscaInput) buscaInput.focus();
});

/* ---------- primeiro a cópia local, depois o banco ---------- */
montaProdutos(window.PANDA_PRODUTOS);
aplicaContatos();
abrePeloEndereco();

async function carregaDoBanco() {
  const cfg = window.PANDA_CONFIG;
  if (!cfg || !cfg.URL || !cfg.CHAVE) return;
  const cabecalho = { apikey: cfg.CHAVE, Authorization: `Bearer ${cfg.CHAVE}` };
  const parar = AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined;
  try {
    const [rp, rc] = await Promise.all([
      fetch(`${cfg.URL}/rest/v1/pm_produtos?select=slug,nome,descricao,detalhes,preco_texto,etiquetas,mensagem,rotulo_botao,em_breve,lancamento,tema,pm_produto_fotos(url,url_2x,alt,ordem,largura,altura)&publicado=eq.true&order=ordem`, { headers: cabecalho, signal: parar }),
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
    const trocou = montaProdutos(
      dados.map((p) => ({
        ...p,
        fotos: (p.pm_produto_fotos || []).slice().sort((a, b) => a.ordem - b.ordem),
      }))
    );
    if (trocou) abrePeloEndereco();
  } catch (e) {
    /* sem banco, o site segue com a cópia local */
  }
}
/* quem espera o catálogo ficar pronto (inclusive o guardião) usa isto */
window.PANDA_CATALOGO = carregaDoBanco().then(() => true);

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

/* foto real de cada base e onde fica a plaquinha do nome
   (porcentagens da largura/altura da foto: esquerda, topo, largura, altura) */
const FOTO_REAL = {
  garrafa: { src: "assets/prod-garrafa.webp", placa: [37.5, 61.6, 19.7, 5.8], cor: "#F4DFD1" },
  caneca:  { src: "assets/prod-caneca.webp",  placa: [46.7, 71.7, 35.5, 12.5], cor: "#DAC9BE" },
  copo:    { src: "assets/prod-copo.webp",    placa: [60.5, 50.5, 21.0, 5.3], cor: "#F2D6C1" },
};
const fotoReal = document.getElementById("foto-real");
const fotoRealImg = document.getElementById("foto-real-img");
const fotoRealPlaca = document.getElementById("foto-real-placa");
const fotoRealNome = document.getElementById("foto-real-nome");
const dicaFoto = document.getElementById("dica-foto");
const modoFoto = () => !!document.getElementById("m-foto")?.checked;

const medidor = document.createElement("canvas").getContext("2d");
function ajustaNomeNaPlaca(texto, fonte) {
  const r = fotoRealPlaca.getBoundingClientRect();
  if (!r.width) return;
  const maxW = r.width * 0.84, maxH = r.height * 0.74;
  let fs = maxH;
  medidor.font = `600 ${fs}px ${fonte}`;
  const largura = medidor.measureText(texto).width || 1;
  if (largura > maxW) fs = Math.max(7, fs * (maxW / largura));
  fotoRealNome.style.fontFamily = fonte;
  fotoRealNome.style.fontSize = `${fs}px`;
}

function estado() {
  const d = new FormData(form);
  const qtd = Math.min(500, Math.max(1, parseInt(d.get("qtd"), 10) || 1));
  return {
    nome: (d.get("nome") || "").trim(),
    item: d.get("item"),
    cor: d.get("cor") || "creme",
    letra: d.get("letra"),
    panda: d.get("panda") === "on",
    qtd,
    foto: modoFoto(),
  };
}

function render() {
  const s = estado();
  const texto = s.nome || "Seu nome";
  const cor = CORES[s.cor];
  const letra = LETRAS[s.letra];

  // na foto real a cor da peça e o pandinha não se aplicam
  form.querySelectorAll('input[name="cor"]').forEach((r) => (r.disabled = s.foto));
  document.getElementById("b-panda").disabled = s.foto;
  dicaFoto.hidden = !s.foto;
  fotoReal.hidden = !s.foto;
  preview.toggleAttribute("hidden", s.foto); // svg não tem a propriedade .hidden

  if (s.foto) {
    const f = FOTO_REAL[s.item] || FOTO_REAL.caneca;
    const srcset2 = `${f.src} 1x, ${f.src.replace(/\.webp$/, "@2x.webp")} 2x`;
    if (fotoRealImg.getAttribute("srcset") !== srcset2) fotoRealImg.srcset = srcset2;
    if (fotoRealImg.getAttribute("src") !== f.src) fotoRealImg.src = f.src;
    const [x, y, w, h] = f.placa;
    fotoRealPlaca.style.setProperty("--px", `${x}%`);
    fotoRealPlaca.style.setProperty("--py", `${y}%`);
    fotoRealPlaca.style.setProperty("--pw", `${w}%`);
    fotoRealPlaca.style.setProperty("--ph", `${h}%`);
    fotoRealPlaca.style.setProperty("--placa", f.cor);
    fotoRealNome.textContent = texto;
    ajustaNomeNaPlaca(texto, letra.font);
  }

  // a fonte encolhe conforme o texto cresce, para caber na peça
  const len = texto.length;
  const size = len <= 6 ? letra.base : Math.max(15, letra.base - (len - 6) * 1.7);

  preview.style.setProperty("--pv", cor.fill);
  preview.style.setProperty("--pv-ink", cor.ink);
  preview.style.setProperty("--pv-font", letra.font);
  preview.style.setProperty("--pv-size", `${size}px`);
  preview.dataset.cor = s.cor;
  preview.dataset.panda = s.panda ? "on" : "off";

  Object.entries(bases).forEach(([k, g]) => g.toggleAttribute("hidden", k !== s.item)); // <g> do svg não tem .hidden
  preview.querySelectorAll(".pv-text").forEach((t) => {
    t.textContent = texto;
    t.style.fontSize = "";
  });
  // se o texto ainda não cabe na largura da peça, encolhe a fonte até caber
  const larguraPeca = { garrafa: 84, caneca: 120, copo: 92 }[s.item];
  const el = bases[s.item].querySelector(".pv-text");
  if (el && el.getComputedTextLength && !s.foto) {
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
document.querySelectorAll('input[name="modo"]').forEach((r) => r.addEventListener("change", render));
fotoRealImg.addEventListener("load", () => { if (modoFoto()) render(); });
let esperaRedimensionar;
window.addEventListener("resize", () => { clearTimeout(esperaRedimensionar); esperaRedimensionar = setTimeout(() => modoFoto() && render(), 120); });
render();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);

document.getElementById("b-send").addEventListener("click", () => {
  const s = estado();
  const msg =
    `Oi, Panda Mimo! Montei uma ideia no site 🐼\n` +
    `• Base: ${ROTULOS[s.item]}\n` +
    `• Cor: ${s.foto ? "a combinar" : ROTULOS[s.cor]}\n` +
    `• Escrito: "${s.nome || "(ainda vou decidir)"}"\n` +
    `• ${ROTULOS[s.letra]}${s.foto ? "" : s.panda ? ", com o pandinha" : ", sem o pandinha"}\n` +
    `• Quantidade: ${s.qtd}\n` +
    `Pode me passar valor e prazo?`;
  medir("simulador", ROTULOS[s.item]);
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

/* =========================================================
   Movimento, com moderação
   - as seções abaixo da primeira tela aparecem subindo 12px em 250ms,
     uma vez só; o que já está na tela nasce visível
   - o botão do WhatsApp acena duas vezes, aos 8s e aos 30s, e para
   - tudo desligado para quem pede menos movimento
   ========================================================= */
(function movimento() {
  const alvos = [...new Set(document.querySelectorAll("main > section, main > .trust, footer"))];
  window.PANDA_REVELA_TUDO = () => alvos.forEach((el) => { el.classList.remove("reveal--pronto"); el.classList.add("reveal--visto"); });
  if (reduzMovimento || !("IntersectionObserver" in window)) return;

  const io = new IntersectionObserver((entradas) => {
    entradas.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("reveal--visto");
      io.unobserve(en.target);
    });
  }, { threshold: 0.06 });
  alvos.forEach((el) => {
    if (el.getBoundingClientRect().top > window.innerHeight) {
      el.classList.add("reveal--pronto");
      io.observe(el);
    }
  });

  [8000, 30000].forEach((ms) => setTimeout(() => {
    if (fab.classList.contains("is-hidden") || document.hidden) return;
    fab.classList.add("fab--acena");
    setTimeout(() => fab.classList.remove("fab--acena"), 700);
  }, ms));
})();
