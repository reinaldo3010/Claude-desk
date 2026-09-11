/* =========================================================
   Seu Mimo Studio — comportamento da página

   As peças são montadas a partir dos dados, não escritas no HTML: primeiro
   com a cópia que vem junto com o site (produtos.js), para a página já nascer
   completa, e depois com o que estiver no banco, se ele responder. Assim o
   catálogo pode ser administrado sem quebrar o site quando a internet falha.
   ========================================================= */

const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- contatos (a cópia local vale até o banco responder) ---------- */
const CONTATO = {
  /* NÚMERO DE RESERVA: nenhum clique chega a ninguém enquanto estiver assim.
     Troque pelo WhatsApp real da Seu Mimo Studio antes de ir ao ar — o guardião avisa. */
  whatsapp: "5500000000000",
};

const waLink = (msg) => `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(msg)}`;

const esc = (t) =>
  String(t == null ? "" : t).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const normaliza = (t) =>
  String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

function aplicaContatos(escopo = document) {
  escopo.querySelectorAll(".js-wa").forEach((a) => {
    a.href = waLink(a.dataset.msg || "Oi, Seu Mimo Studio!");
    a.target = "_blank";
    a.rel = "noopener";
  });
}

const anoEl = document.getElementById("ano");
if (anoEl) anoEl.textContent = new Date().getFullYear();

/* Identificação da loja no rodapé (Decreto 7.962/2013). Enquanto o dado real não
   existir, a linha continua mostrando os colchetes: é melhor a falta ficar à vista
   do que sumir. Quando o banco trouxer os dados, eles substituem os colchetes. */
function mostraDadosDaLoja(c) {
  const el = document.getElementById("loja-dados");
  if (!el || !c) return;
  const partes = [c.nome_empresarial, c.cnpj && `CNPJ ${c.cnpj}`, c.endereco, c.email].filter(Boolean);
  if (partes.length < 4) return; // dado pela metade não substitui o aviso do que falta
  el.textContent = partes.join(" · ");
}

/* =========================================================
   Medição própria: sem cookie, sem rastrear pessoas
   Cada visita ganha um número aleatório que morre com a aba.
   Quem pede "não rastrear" no navegador não entra na conta.
   ========================================================= */
const medir = (() => {
  const cfg = window.SMS_CONFIG;
  if (!cfg || !cfg.URL || !cfg.CHAVE || navigator.doNotTrack === "1") return () => {};
  let sessao = "";
  try {
    sessao = sessionStorage.getItem("sms_s") || Math.random().toString(36).slice(2, 12);
    sessionStorage.setItem("sms_s", sessao);
  } catch (e) { sessao = Math.random().toString(36).slice(2, 12); }
  const origem = (() => { try { return document.referrer ? new URL(document.referrer).hostname : ""; } catch (e) { return ""; } })();
  return (evento, rotulo = "") => {
    const corpo = JSON.stringify({
      evento,
      rotulo: String(rotulo).replace(/\s+/g, " ").trim().slice(0, 200),
      pagina: (location.pathname + location.hash).slice(0, 200),
      origem: origem.slice(0, 120),
      largura: window.innerWidth,
      sessao,
    });
    fetch(`${cfg.URL}/rest/v1/sms_eventos`, {
      method: "POST", keepalive: true,
      headers: { apikey: cfg.CHAVE, Authorization: `Bearer ${cfg.CHAVE}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: corpo,
    }).catch(() => {});
  };
})();
medir("pageview");
document.addEventListener("click", (e) => {
  const zap = e.target.closest(".js-wa");
  if (zap) medir("clique_whatsapp", zap.dataset.rotulo || zap.textContent.trim() || zap.getAttribute("aria-label") || "whatsapp");
});

/* =========================================================
   As peças
   ========================================================= */
const lista = document.getElementById("lista-pecas");
let pecasNaTela = [];

/* temas do catálogo: viram os chips de filtro, na ordem em que aparecem aqui */
const TEMAS = { bebidas: "Bebidas", "dia-a-dia": "Dia a dia", lembrancinha: "Lembrancinha", presente: "Presentear" };

function quadroInterno(p, classeEspera) {
  const fotos = p.fotos || [];
  if (!fotos.length) {
    /* a fotografia real ainda não existe: o quadro mostra o desenho de linha da peça
       e diz, sem rodeio, que ali vai entrar uma foto */
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#${esc(p.icone || "ic-kit")}"/></svg>
      <span class="${classeEspera}">Foto da peça</span>`;
  }
  const f = fotos[0];
  const srcset = f.url_2x ? ` srcset="${esc(f.url)} 1x, ${esc(f.url_2x)} 2x"` : "";
  return `<img src="${esc(f.url)}"${srcset} alt="${esc(f.alt || p.nome)}" loading="lazy" decoding="async" width="${f.largura || 760}" height="${f.altura || 760}">`;
}

function pecaHTML(p) {
  const busca = normaliza([p.nome, p.material, p.detalhes, ...(p.etiquetas || []), TEMAS[p.tema] || "", p.tema || ""].join(" "));
  return `<article class="peca" data-slug="${esc(p.slug)}" data-tema="${esc(p.tema || "")}" data-busca="${esc(busca)}">
      <div class="peca__quadro">${quadroInterno(p, "peca__espera")}</div>
      <div class="peca__corpo">
        <h3 class="titulo">${esc(p.nome)}</h3>
        <span class="peca__material">${esc(p.material || "")}</span>
        <span class="peca__preco">${esc(p.preco_texto || "Valor sob consulta")}</span>
        <button type="button" class="peca__ver">Ver detalhes</button>
        <a class="peca__cta js-wa" href="#contato" data-msg="${esc(p.mensagem)}" data-rotulo="Quero essa · ${esc(p.nome)}">Quero essa <span aria-hidden="true">›</span></a>
      </div>
    </article>`;
}

/* assinatura do que está na tela: se o banco devolver o mesmo conteúdo, não vale
   remontar — remontar perderia a posição da rolagem sem trocar nada de fato */
function assinatura(pecas) {
  return JSON.stringify(pecas.map((p) => [
    p.nome, p.material || "", p.preco_texto || "", p.mensagem, p.icone || "", p.tema || "",
    p.detalhes || "", p.etiquetas || [],
    (p.fotos || []).map((f) => [f.url, f.url_2x || "", f.alt]),
  ]));
}

/* Dados estruturados (schema.org): um Product com Offer por peça publicada,
   gerado do mesmo dado que monta os cartões. */
function publicaDadosEstruturados(pecas) {
  const base = document.querySelector('link[rel="canonical"]')?.href || location.href.split("#")[0];
  const abs = (u) => new URL(u, base).href;
  const itens = pecas.map((p, i) => {
    const preco = (p.preco_texto || "").replace(/\./g, "").match(/(\d+)(?:,(\d{2}))?/);
    const item = {
      "@type": "Product", name: p.nome, description: p.detalhes || p.material || p.nome,
      url: `${base}#peca/${p.slug}`,
      brand: { "@type": "Brand", name: "Seu Mimo Studio" },
    };
    const fotos = (p.fotos || []).map((f) => abs(f.url_2x || f.url)).slice(0, 4);
    if (fotos.length) item.image = fotos;
    if (preco) item.offers = {
      "@type": "AggregateOffer", priceCurrency: "BRL",
      lowPrice: `${preco[1]}.${preco[2] || "00"}`, offerCount: 1,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      url: `${base}#peca/${p.slug}`,
    };
    return { "@type": "ListItem", position: i + 1, item };
  });
  let tag = document.getElementById("ld-catalogo");
  if (!tag) { tag = document.createElement("script"); tag.type = "application/ld+json"; tag.id = "ld-catalogo"; document.head.appendChild(tag); }
  tag.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "ItemList", name: "Peças personalizadas Seu Mimo Studio", itemListElement: itens });
}

function montaPecas(pecas) {
  /* as páginas de apoio compartilham este script mas não têm catálogo: nada a montar
     e, principalmente, nenhum dado estruturado de produto para publicar nelas */
  if (!lista || !Array.isArray(pecas) || !pecas.length) return false;
  pecasNaTela = pecas;
  publicaDadosEstruturados(pecas);
  const nova = assinatura(pecas);
  if (lista.dataset.assinatura === nova) return false;
  lista.dataset.assinatura = nova;
  lista.innerHTML = pecas.map(pecaHTML).join("\n");
  aplicaContatos(lista);
  montaFiltros(pecas);
  aplicaFiltro();
  return true;
}

/* ---------- busca e filtros ---------- */
const buscaInput = document.getElementById("busca-pecas");
const filtrosEl = document.getElementById("filtros-pecas");
const resultadoEl = document.getElementById("catalogo-resultado");
const vazioEl = document.getElementById("catalogo-vazio");
let filtroAtual = "tudo";

function montaFiltros(pecas) {
  if (!filtrosEl) return;
  const ordem = Object.keys(TEMAS);
  const temas = [...new Set(pecas.map((p) => p.tema).filter((t) => t && TEMAS[t]))]
    .sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b));
  const todos = [["tudo", "Tudo"], ...temas.map((t) => [`tema:${t}`, TEMAS[t]])];
  if (!todos.some(([v]) => v === filtroAtual)) filtroAtual = "tudo";
  filtrosEl.innerHTML = todos
    .map(([v, r]) => `<button type="button" class="filtro" data-filtro="${esc(v)}" aria-pressed="${v === filtroAtual}">${esc(r)}</button>`)
    .join("");
}

function aplicaFiltro() {
  if (!lista) return;
  const bruto = buscaInput ? buscaInput.value.trim() : "";
  const termos = normaliza(bruto).split(" ").filter(Boolean);
  const tema = filtroAtual.startsWith("tema:") ? filtroAtual.slice(5) : "";
  let visiveis = 0, total = 0;
  lista.querySelectorAll(".peca").forEach((el) => {
    total++;
    let ok = true;
    if (tema) ok = el.dataset.tema === tema;
    if (ok && termos.length) ok = termos.every((t) => (el.dataset.busca || "").includes(t));
    el.hidden = !ok;
    if (ok) visiveis++;
  });
  if (vazioEl) {
    vazioEl.hidden = visiveis > 0;
    const zap = vazioEl.querySelector(".js-wa");
    if (zap) {
      zap.dataset.msg = bruto
        ? `Oi, Seu Mimo Studio! Procurei "${bruto}" no site e não achei. Dá para fazer?`
        : "Oi, Seu Mimo Studio! Tenho uma ideia de peça que não está no site.";
      aplicaContatos(vazioEl);
    }
  }
  if (resultadoEl) {
    const chip = filtrosEl && filtrosEl.querySelector(`[data-filtro="${filtroAtual}"]`);
    const onde = filtroAtual === "tudo" || !chip ? "" : ` em ${chip.textContent}`;
    const com = bruto ? ` com "${bruto}"` : "";
    resultadoEl.textContent = !bruto && filtroAtual === "tudo"
      ? `${total} peças no catálogo`
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
  montaFiltros(pecasNaTela);
  aplicaFiltro();
  if (buscaInput) buscaInput.focus();
});

/* =========================================================
   Detalhe da peça
   Abre pelo botão, pela foto, ou pelo endereço #peca/slug.
   ========================================================= */
const detalhe = document.getElementById("detalhe");
let voltarFocoPara = null;

function abreDetalhe(slug, gatilho) {
  if (!detalhe) return;
  const p = pecasNaTela.find((x) => x.slug === slug);
  if (!p) return;
  voltarFocoPara = gatilho && gatilho.focus ? gatilho : null;

  document.getElementById("detalhe-titulo").textContent = p.nome;
  document.getElementById("detalhe-material").textContent = p.material || "";
  document.getElementById("detalhe-preco").textContent = p.preco_texto || "Valor sob consulta";
  document.getElementById("detalhe-texto").textContent = p.detalhes || p.material || "";
  document.getElementById("detalhe-marcas").innerHTML = (p.etiquetas || []).map((e) => `<li>${esc(e)}</li>`).join("");
  document.getElementById("detalhe-quadro").innerHTML = quadroInterno(p, "detalhe__espera");

  const zap = document.getElementById("detalhe-zap");
  zap.dataset.msg = p.mensagem || `Oi, Seu Mimo Studio! Quero ${p.nome}.`;
  zap.dataset.rotulo = `Quero essa · ${p.nome} · detalhe`;
  aplicaContatos(detalhe);

  /* "ver com meu nome" só faz sentido para as peças que o simulador desenha */
  const base = baseDoSimulador(p);
  const verComNome = document.getElementById("detalhe-monte");
  verComNome.hidden = !base;
  verComNome.dataset.base = base || "";

  if (!detalhe.open) detalhe.showModal();
  history.replaceState(null, "", `#peca/${slug}`);
  medir("detalhe", p.nome);
}

const baseDoSimulador = (p) => {
  const t = `${p.slug} ${p.nome}`.toLowerCase();
  if (t.includes("garrafa")) return "garrafa";
  if (t.includes("caneca")) return "caneca";
  if (t.includes("copo")) return "copo";
  if (t.includes("ecobag")) return "ecobag";
  return null;
};

function fechaDetalhe() { if (detalhe && detalhe.open) detalhe.close(); }

if (detalhe) {
  detalhe.addEventListener("close", () => {
    if (/^#peca\//.test(location.hash)) history.replaceState(null, "", "#pecas");
    if (voltarFocoPara) voltarFocoPara.focus();
  });
  detalhe.addEventListener("click", (e) => { if (e.target === detalhe) fechaDetalhe(); });
  detalhe.querySelector(".detalhe__fechar").addEventListener("click", fechaDetalhe);
  document.getElementById("detalhe-monte").addEventListener("click", (e) => {
    e.preventDefault();
    const base = e.currentTarget.dataset.base;
    fechaDetalhe();
    const r = base && document.getElementById(`p-${base}`);
    if (r) { r.checked = true; desenhaPrevia(); }
    const monte = document.getElementById("monte");
    if (monte) monte.scrollIntoView({ behavior: reduzMovimento ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", "#monte");
    const nome = document.getElementById("m-nome");
    if (nome) nome.focus({ preventScroll: true });
  });
}

if (lista) lista.addEventListener("click", (e) => {
  const art = e.target.closest(".peca"); if (!art) return;
  const botao = e.target.closest(".peca__ver");
  const quadro = e.target.closest(".peca__quadro");
  if (botao || quadro) abreDetalhe(art.dataset.slug, botao || quadro);
});

function abrePeloEndereco() {
  const m = location.hash.match(/^#peca\/([a-z0-9-]+)/);
  if (m) abreDetalhe(m[1]);
}
window.addEventListener("hashchange", abrePeloEndereco);

/* ---------- primeiro a cópia local, depois o banco ---------- */
montaPecas(window.SMS_PRODUTOS);
aplicaContatos();
abrePeloEndereco();

async function carregaDoBanco() {
  const cfg = window.SMS_CONFIG;
  if (!cfg || !cfg.URL || !cfg.CHAVE) return;
  const cabecalho = { apikey: cfg.CHAVE, Authorization: `Bearer ${cfg.CHAVE}` };
  const parar = AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined;
  try {
    const [rp, rc] = await Promise.all([
      fetch(`${cfg.URL}/rest/v1/sms_produtos?select=slug,nome,material,preco_texto,mensagem,icone,tema,etiquetas,detalhes,sms_produto_fotos(url,url_2x,alt,ordem,largura,altura)&publicado=eq.true&order=ordem`, { headers: cabecalho, signal: parar }),
      fetch(`${cfg.URL}/rest/v1/sms_config?select=whatsapp,nome_empresarial,cnpj,endereco,email`, { headers: cabecalho, signal: parar }),
    ]);
    if (rc.ok) {
      const [c] = await rc.json();
      if (c) {
        if (c.whatsapp) CONTATO.whatsapp = c.whatsapp;
        mostraDadosDaLoja(c);
        aplicaContatos();
      }
    }
    if (!rp.ok) return;
    const dados = await rp.json();
    if (!Array.isArray(dados) || !dados.length) return;
    const trocou = montaPecas(dados.map((p) => ({
      ...p,
      fotos: (p.sms_produto_fotos || []).slice().sort((a, b) => a.ordem - b.ordem),
    })));
    if (trocou) abrePeloEndereco();
  } catch (e) {
    /* sem banco, o site segue inteiro com a cópia local */
  }
}
/* quem espera o catálogo ficar pronto (inclusive o guardião) usa isto */
window.SMS_CATALOGO = carregaDoBanco().then(() => true);

/* =========================================================
   Veja como fica
   Um desenho de linha da peça, na cor escolhida, com o nome escrito.
   Não é a arte final e o texto ao lado diz isso.
   ========================================================= */
const monteForm = document.getElementById("monte-form");
const previaPeca = document.getElementById("previa-peca");
const previaNome = document.getElementById("previa-nome");
const previaSvg = document.querySelector(".previa");

/* onde o nome cai em cada peça, e quanto ele pode ocupar, em unidades da tela da prévia */
const PECAS_PREVIA = {
  garrafa: { icone: "ic-garrafa", x: 130, y: 145, max: 64, rotulo: "garrafa térmica" },
  caneca:  { icone: "ic-caneca",  x: 110, y: 138, max: 78, rotulo: "caneca" },
  copo:    { icone: "ic-copo",    x: 130, y: 140, max: 56, rotulo: "copo térmico" },
  ecobag:  { icone: "ic-ecobag",  x: 130, y: 152, max: 96, rotulo: "ecobag" },
};
/* cor da peça: bege e off white não têm contraste sobre o fundo claro, então o
   palco vira oliva quando uma delas é escolhida. Medido, não achado. */
const CORES_PREVIA = {
  oliva:    { traco: "var(--oliva)",    palco: "var(--fundo)", rotulo: "oliva" },
  cafe:     { traco: "var(--cafe)",     palco: "var(--fundo)", rotulo: "café" },
  bege:     { traco: "var(--bege)",     palco: "var(--oliva)", rotulo: "bege" },
  offwhite: { traco: "var(--offwhite)", palco: "var(--oliva)", rotulo: "off white" },
};
const LETRAS_PREVIA = {
  serifa: { fonte: "var(--f-titulo)", tam: 26, rotulo: "letra com serifa" },
  bastao: { fonte: "var(--f-texto)",  tam: 22, rotulo: "letra bastão" },
  mao:    { fonte: "var(--f-mao)",    tam: 32, rotulo: "letra manuscrita" },
};

function estadoDaPrevia() {
  const d = new FormData(monteForm);
  const qtd = Math.min(500, Math.max(1, parseInt(d.get("qtd"), 10) || 1));
  return {
    nome: (d.get("nome") || "").trim(),
    peca: d.get("peca") || "garrafa",
    cor: d.get("cor") || "oliva",
    letra: d.get("letra") || "serifa",
    qtd,
  };
}

function desenhaPrevia() {
  if (!monteForm || !previaPeca) return;
  const s = estadoDaPrevia();
  const peca = PECAS_PREVIA[s.peca] || PECAS_PREVIA.garrafa;
  const cor = CORES_PREVIA[s.cor] || CORES_PREVIA.oliva;
  const letra = LETRAS_PREVIA[s.letra] || LETRAS_PREVIA.serifa;
  const texto = s.nome || "Seu nome";

  previaPeca.innerHTML = `<use href="#${peca.icone}" x="30" y="25" width="200" height="200"/>`;
  previaSvg.style.setProperty("--pv-traco", cor.traco);
  previaSvg.style.setProperty("--pv-palco", cor.palco);
  previaSvg.style.background = cor.palco;
  previaSvg.style.setProperty("--pv-fonte", letra.fonte);
  previaSvg.style.setProperty("--pv-tam", `${letra.tam}px`);

  previaNome.setAttribute("x", peca.x);
  previaNome.setAttribute("y", peca.y);
  previaNome.textContent = texto;
  previaNome.removeAttribute("textLength");
  previaNome.removeAttribute("lengthAdjust");
  previaNome.style.fontSize = "";

  /* o nome tem de caber na peça: encolhe até caber, e só então aperta o espacejamento */
  if (previaNome.getComputedTextLength) {
    const medida = previaNome.getComputedTextLength();
    if (medida > peca.max) {
      const tam = Math.max(9, letra.tam * (peca.max / medida) * 0.98);
      previaNome.style.fontSize = `${tam}px`;
      if (previaNome.getComputedTextLength() > peca.max) {
        previaNome.setAttribute("textLength", peca.max);
        previaNome.setAttribute("lengthAdjust", "spacingAndGlyphs");
      }
    }
  }
  const conta = document.getElementById("m-conta");
  if (conta) conta.textContent = s.nome.length;
}

if (monteForm) {
  monteForm.addEventListener("input", desenhaPrevia);
  const qtd = document.getElementById("m-qtd");
  qtd.addEventListener("change", () => { qtd.value = estadoDaPrevia().qtd; desenhaPrevia(); });
  qtd.addEventListener("blur", () => { qtd.value = estadoDaPrevia().qtd; });
  desenhaPrevia();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(desenhaPrevia);

  document.getElementById("m-enviar").addEventListener("click", () => {
    const s = estadoDaPrevia();
    const msg =
      "Oi, Seu Mimo Studio! Montei uma ideia no site.\n" +
      `• Peça: ${PECAS_PREVIA[s.peca].rotulo}\n` +
      `• Cor: ${CORES_PREVIA[s.cor].rotulo}\n` +
      `• Escrito: "${s.nome || "(ainda vou decidir)"}"\n` +
      `• Letra: ${LETRAS_PREVIA[s.letra].rotulo}\n` +
      `• Quantidade: ${s.qtd}\n` +
      "Pode me passar valor e prazo?";
    medir("simulador", PECAS_PREVIA[s.peca].rotulo);
    window.open(waLink(msg), "_blank", "noopener");
  });
}

/* =========================================================
   Depoimentos
   Cópia local primeiro, banco depois; só os aprovados. Os cartões de
   exemplo levam a marca "exemplo" à vista — nunca fingem ser cliente.
   ========================================================= */
const depoLista = document.getElementById("lista-depoimentos");
const depoNota = document.getElementById("depoimentos-nota");

function depoHTML(d) {
  const nota = Math.min(5, Math.max(1, Number(d.nota) || 5));
  const onde = [d.cidade, d.peca].filter(Boolean).map(esc).join(" · ");
  return `<figure class="depo${d.exemplo ? " depo--exemplo" : ""}">
      <blockquote><p>${esc(d.texto)}</p></blockquote>
      <figcaption>
        <span class="depo__estrelas" aria-label="${nota} de 5">${"★".repeat(nota)}${"☆".repeat(5 - nota)}</span>
        <strong>${esc(d.nome)}</strong>
        ${onde ? `<span>${onde}</span>` : ""}
      </figcaption>
    </figure>`;
}

function montaDepoimentos(itens) {
  if (!depoLista) return;
  const bons = (Array.isArray(itens) ? itens : []).filter((d) => d && d.nome && d.texto).slice(0, 6);
  depoLista.innerHTML = bons.map(depoHTML).join("");
  depoLista.hidden = bons.length === 0;
  if (depoNota) depoNota.hidden = !bons.some((d) => d.exemplo);
}
montaDepoimentos(window.SMS_DEPOIMENTOS);
window.SMS_MONTA_DEPOIMENTOS = montaDepoimentos;

(async function depoimentosDoBanco() {
  const cfg = window.SMS_CONFIG;
  if (!cfg || !cfg.URL || !cfg.CHAVE || !depoLista) return;
  try {
    const r = await fetch(`${cfg.URL}/rest/v1/sms_depoimentos?select=nome,cidade,peca,nota,texto,exemplo,criado_em&aprovado=eq.true&order=criado_em.desc&limit=6`,
      { headers: { apikey: cfg.CHAVE, Authorization: `Bearer ${cfg.CHAVE}` }, signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined });
    if (!r.ok) return;
    const dados = await r.json();
    if (Array.isArray(dados)) montaDepoimentos(dados); // vazio esconde os cartões: o banco manda
  } catch (e) { /* sem banco, fica a cópia local */ }
})();

const formDepo = document.getElementById("form-depoimento");
if (formDepo) {
  const texto = formDepo.querySelector("#d-texto");
  const contador = document.getElementById("d-conta");
  const status = document.getElementById("depo-status");
  const diz = (msg, tipo) => { status.textContent = msg; status.className = `depo-form__status${tipo ? " is-" + tipo : ""}`; };
  texto.addEventListener("input", () => { if (contador) contador.textContent = String(texto.value.length); });
  formDepo.addEventListener("submit", async (e) => {
    e.preventDefault();
    const dados = {
      nome: formDepo.nome.value.trim(), cidade: formDepo.cidade.value.trim(), peca: formDepo.peca.value.trim(),
      nota: Number(formDepo.nota.value) || 5, texto: texto.value.trim(),
    };
    if (dados.nome.length < 2) return diz("Conte o seu nome, do jeito que quer aparecer.", "erro");
    if (dados.texto.length < 10) return diz("Escreva um pouco mais: como foi receber a peça?", "erro");
    if (!formDepo.consent.checked) return diz("Precisamos da sua autorização para publicar.", "erro");
    const cfg = window.SMS_CONFIG;
    const botao = document.getElementById("d-enviar");
    botao.disabled = true; diz("Enviando...", "");
    try {
      if (!cfg || !cfg.URL) throw new Error("sem banco");
      const r = await fetch(`${cfg.URL}/rest/v1/sms_depoimentos`, {
        method: "POST",
        headers: { apikey: cfg.CHAVE, Authorization: `Bearer ${cfg.CHAVE}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(dados),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      diz("Recebido. A gente lê com calma e publica em até dois dias. Obrigado por contar.", "ok");
      formDepo.reset(); if (contador) contador.textContent = "0";
      medir("depoimento", dados.peca || "sem peça");
    } catch (err) {
      botao.disabled = false;
      diz("Não deu certo agora. Se preferir, mande o depoimento pelo WhatsApp, no botão aqui embaixo.", "erro");
    }
  });
}

/* ---------- dúvidas: uma aberta por vez, com aria-expanded ---------- */
const duvidas = document.querySelectorAll(".duvida");
const sincronizaDuvidas = () => duvidas.forEach((d) => d.querySelector("summary").setAttribute("aria-expanded", String(d.open)));
duvidas.forEach((d) =>
  d.addEventListener("toggle", () => {
    if (d.open) duvidas.forEach((o) => o !== d && (o.open = false));
    sincronizaDuvidas();
  })
);
sincronizaDuvidas();

/* ---------- menu do celular ---------- */
const topo = document.querySelector(".topo");
const menuBtn = document.querySelector(".menu-btn");
const menu = document.getElementById("menu-principal");
if (topo && menuBtn && menu) {
  const setMenu = (aberto) => {
    topo.classList.toggle("is-aberto", aberto);
    menuBtn.setAttribute("aria-expanded", String(aberto));
    menuBtn.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
  };
  menuBtn.addEventListener("click", () => setMenu(!topo.classList.contains("is-aberto")));
  menu.addEventListener("click", (e) => e.target.closest("a") && setMenu(false));
  document.addEventListener("keydown", (e) => e.key === "Escape" && topo.classList.contains("is-aberto") && (setMenu(false), menuBtn.focus()));
  document.addEventListener("click", (e) => topo.classList.contains("is-aberto") && !topo.contains(e.target) && setMenu(false));
}

/* ---------- botão flutuante: sai do caminho quando cobriria o próprio convite ---------- */
const fab = document.querySelector(".fab");
if (fab) {
  const bloqueiam = [document.getElementById("contato"), document.querySelector(".monte__form")].filter(Boolean);
  const visiveis = new Set();
  let teclado = false;
  const atualiza = () => fab.classList.toggle("is-oculto", teclado || visiveis.size > 0);
  if ("IntersectionObserver" in window && bloqueiam.length) {
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => (en.isIntersecting ? visiveis.add(en.target) : visiveis.delete(en.target)));
      atualiza();
    }, { threshold: 0.15 });
    bloqueiam.forEach((b) => io.observe(b));
  }
  document.addEventListener("focusin", (e) => { if (e.target.matches("input, textarea, select")) { teclado = true; atualiza(); } });
  document.addEventListener("focusout", (e) => { if (e.target.matches("input, textarea, select")) { teclado = false; atualiza(); } });
}

/* =========================================================
   Movimento, com moderação
   As seções abaixo da primeira tela aparecem subindo 12px, uma vez só.
   Regra de ouro: a animação é enfeite, o conteúdo é obrigatório. Se a tela
   ainda não tem altura confiável (webview do Instagram ou do WhatsApp
   carregando antes do layout, aba em segundo plano), nada se esconde.
   ========================================================= */
(function movimento() {
  const alvos = [...new Set(document.querySelectorAll("main > section, footer"))];
  const revelaTudo = () => alvos.forEach((el) => { el.classList.remove("reveal--pronto"); el.classList.add("reveal--visto"); });
  window.SMS_REVELA_TUDO = revelaTudo;
  if (reduzMovimento || !("IntersectionObserver" in window)) return;
  if (window.innerHeight < 320 || document.visibilityState !== "visible") return;

  const io = new IntersectionObserver((entradas) => {
    entradas.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("reveal--visto");
      io.unobserve(en.target);
    });
  }, { threshold: 0.06 });
  /* só o que está bem abaixo da primeira tela; abertura e garantias nunca entram */
  alvos.forEach((el, i) => {
    if (i >= 2 && el.getBoundingClientRect().top > window.innerHeight * 1.05) {
      el.classList.add("reveal--pronto");
      io.observe(el);
    }
  });

  /* rede de segurança, caso o observer cale: ao rolar, girar ou voltar à aba, o que
     já entrou na tela aparece; e 4 s depois do carregamento tudo aparece */
  const pendentes = () => alvos.forEach((el) => {
    if (el.classList.contains("reveal--pronto") && el.getBoundingClientRect().top < window.innerHeight + 80) {
      el.classList.add("reveal--visto"); io.unobserve(el);
    }
  });
  ["scroll", "resize", "orientationchange", "pageshow", "visibilitychange", "touchstart"].forEach((ev) =>
    window.addEventListener(ev, pendentes, { passive: true }));
  setTimeout(revelaTudo, 4000);
})();
