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

function quadroHTML(p) {
  const fotos = p.fotos || [];
  if (!fotos.length) {
    /* a fotografia real ainda não existe: o quadro mostra o desenho de linha da peça
       e diz, sem rodeio, que ali vai entrar uma foto */
    return `<div class="peca__quadro">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#${esc(p.icone || "ic-kit")}"/></svg>
        <span class="peca__espera">Foto da peça</span>
      </div>`;
  }
  const f = fotos[0];
  const srcset = f.url_2x ? ` srcset="${esc(f.url)} 1x, ${esc(f.url_2x)} 2x"` : "";
  return `<div class="peca__quadro"><img src="${esc(f.url)}"${srcset} alt="${esc(f.alt || p.nome)}" loading="lazy" decoding="async" width="${f.largura || 760}" height="${f.altura || 760}"></div>`;
}

function pecaHTML(p) {
  return `<article class="peca" data-slug="${esc(p.slug)}">
      ${quadroHTML(p)}
      <div class="peca__corpo">
        <h3 class="titulo">${esc(p.nome)}</h3>
        <span class="peca__material">${esc(p.material || "")}</span>
        <span class="peca__preco">${esc(p.preco_texto || "Valor sob consulta")}</span>
        <a class="peca__cta js-wa" href="#contato" data-msg="${esc(p.mensagem)}" data-rotulo="Quero essa · ${esc(p.nome)}">Quero essa <span aria-hidden="true">›</span></a>
      </div>
    </article>`;
}

/* assinatura do que está na tela: se o banco devolver o mesmo conteúdo, não vale
   remontar — remontar perderia a posição da rolagem sem trocar nada de fato */
function assinatura(pecas) {
  return JSON.stringify(pecas.map((p) => [
    p.nome, p.material || "", p.preco_texto || "", p.mensagem, p.icone || "",
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
      "@type": "Product", name: p.nome, description: p.material || p.nome,
      url: `${base}#pecas`,
      brand: { "@type": "Brand", name: "Seu Mimo Studio" },
    };
    const fotos = (p.fotos || []).map((f) => abs(f.url_2x || f.url)).slice(0, 4);
    if (fotos.length) item.image = fotos;
    if (preco) item.offers = {
      "@type": "AggregateOffer", priceCurrency: "BRL",
      lowPrice: `${preco[1]}.${preco[2] || "00"}`, offerCount: 1,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      url: `${base}#pecas`,
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
  publicaDadosEstruturados(pecas);
  const nova = assinatura(pecas);
  if (lista.dataset.assinatura === nova) return false;
  lista.dataset.assinatura = nova;
  lista.innerHTML = pecas.map(pecaHTML).join("\n");
  aplicaContatos(lista);
  return true;
}

montaPecas(window.SMS_PRODUTOS);
aplicaContatos();

async function carregaDoBanco() {
  const cfg = window.SMS_CONFIG;
  if (!cfg || !cfg.URL || !cfg.CHAVE) return;
  const cabecalho = { apikey: cfg.CHAVE, Authorization: `Bearer ${cfg.CHAVE}` };
  const parar = AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined;
  try {
    const [rp, rc] = await Promise.all([
      fetch(`${cfg.URL}/rest/v1/sms_produtos?select=slug,nome,material,preco_texto,mensagem,icone,sms_produto_fotos(url,url_2x,alt,ordem,largura,altura)&publicado=eq.true&order=ordem`, { headers: cabecalho, signal: parar }),
      fetch(`${cfg.URL}/rest/v1/sms_config?select=whatsapp,nome_empresarial,cnpj,endereco,email&limit=1`, { headers: cabecalho, signal: parar }),
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
    montaPecas(dados.map((p) => ({
      ...p,
      fotos: (p.sms_produto_fotos || []).slice().sort((a, b) => a.ordem - b.ordem),
    })));
  } catch (e) {
    /* sem banco, o site segue inteiro com a cópia local */
  }
}
/* quem espera o catálogo ficar pronto (inclusive o guardião) usa isto */
window.SMS_CATALOGO = carregaDoBanco().then(() => true);

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
  const bloqueiam = [document.getElementById("contato")].filter(Boolean);
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
  document.addEventListener("focusin", (e) => { if (e.target.matches("input, textarea")) { teclado = true; atualiza(); } });
  document.addEventListener("focusout", (e) => { if (e.target.matches("input, textarea")) { teclado = false; atualiza(); } });
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
