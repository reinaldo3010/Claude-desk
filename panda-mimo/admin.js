/* =========================================================
   Painel da Panda Mimo

   Fala direto com o banco (Supabase) pela API REST, sem
   biblioteca externa. Quem manda é a regra do banco: sem
   login de administrador, nada é gravado.
   ========================================================= */

const CFG = window.PANDA_CONFIG;
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

/* ---------------------------------------------------------
   Conversa com o servidor
--------------------------------------------------------- */
const sessao = {
  get token() { return localStorage.getItem("pm_token"); },
  get refresh() { return localStorage.getItem("pm_refresh"); },
  get email() { return localStorage.getItem("pm_email") || ""; },
  guarda(d, email) {
    localStorage.setItem("pm_token", d.access_token);
    localStorage.setItem("pm_refresh", d.refresh_token);
    if (email) localStorage.setItem("pm_email", email);
  },
  limpa() { ["pm_token", "pm_refresh", "pm_email"].forEach((k) => localStorage.removeItem(k)); },
};

async function entrar(email, senha) {
  const r = await fetch(`${CFG.URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: CFG.CHAVE, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: senha }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error_description || d.msg || d.message || "não deu para entrar");
  sessao.guarda(d, email);
  return d;
}

async function renovaSessao() {
  if (!sessao.refresh) return false;
  const r = await fetch(`${CFG.URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: CFG.CHAVE, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: sessao.refresh }),
  });
  if (!r.ok) return false;
  sessao.guarda(await r.json());
  return true;
}

async function api(caminho, opcoes = {}, tentouRenovar = false) {
  const r = await fetch(`${CFG.URL}${caminho}`, {
    ...opcoes,
    headers: {
      apikey: CFG.CHAVE,
      Authorization: `Bearer ${sessao.token || CFG.CHAVE}`,
      "Content-Type": "application/json",
      ...(opcoes.headers || {}),
    },
  });
  if ((r.status === 401 || r.status === 403) && !tentouRenovar && (await renovaSessao()))
    return api(caminho, opcoes, true);
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`${r.status}: ${t.slice(0, 180)}`);
  }
  return r.status === 204 ? null : r.json();
}

const rest = (q, o) => api(`/rest/v1/${q}`, o);

/* ---------------------------------------------------------
   Recados na tela
--------------------------------------------------------- */
function recado(el, texto, tipo = "") {
  const e = typeof el === "string" ? $(el) : el;
  e.textContent = texto || "";
  e.className = "aviso" + (tipo ? ` aviso--${tipo}` : "");
}

/* ---------------------------------------------------------
   Entrada
--------------------------------------------------------- */
$("#form-login").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  recado("#erro-login", "");
  try {
    await entrar($("#email").value.trim(), $("#senha").value);
    await abrePainel();
  } catch (e) {
    recado("#erro-login", `Não consegui entrar: ${e.message}`, "erro");
  }
});

$("#sair").addEventListener("click", () => {
  sessao.limpa();
  location.reload();
});

async function abrePainel() {
  $("#tela-login").hidden = true;
  $("#painel").hidden = false;
  $("#quem").textContent = sessao.email;
  await Promise.all([carregaProdutos(), carregaConfig()]);
}

/* ---------------------------------------------------------
   Abas
--------------------------------------------------------- */
function mostraAba(qual) {
  const prod = qual === "produtos";
  $("#aba-produtos").setAttribute("aria-selected", String(prod));
  $("#aba-config").setAttribute("aria-selected", String(!prod));
  $("#secao-produtos").hidden = !prod;
  $("#secao-config").hidden = prod;
  if (prod === false) fechaEditor();
}
$("#aba-produtos").addEventListener("click", () => mostraAba("produtos"));
$("#aba-config").addEventListener("click", () => mostraAba("config"));

/* ---------------------------------------------------------
   Produtos
--------------------------------------------------------- */
let produtos = [];
let editando = null;   // produto em edição (null = nenhum)
let fotosEditor = [];  // [{url, alt, largura, altura}]

const CAMPOS = "id,slug,nome,descricao,etiquetas,mensagem,rotulo_botao,ordem,publicado,em_breve,pm_produto_fotos(id,url,alt,ordem,largura,altura)";

async function carregaProdutos() {
  try {
    const d = await rest(`pm_produtos?select=${CAMPOS}&order=ordem`);
    produtos = d.map((p) => ({ ...p, fotos: (p.pm_produto_fotos || []).slice().sort((a, b) => a.ordem - b.ordem) }));
    desenhaLista();
    recado("#recado-produtos", "");
  } catch (e) {
    recado("#recado-produtos", `Não consegui carregar os produtos: ${e.message}`, "erro");
  }
}

function desenhaLista() {
  const alvo = $("#lista");
  alvo.innerHTML = "";
  produtos.forEach((p, i) => {
    const el = document.createElement("div");
    el.className = "adm-item";
    const capa = p.fotos[0];
    el.innerHTML = `
      <div class="adm-item__foto">${capa ? `<img src="${capa.url}" alt="">` : ""}</div>
      <div>
        <div class="adm-item__nome"></div>
        <div class="adm-item__meta">
          <span class="selo ${p.publicado ? "selo--no-ar" : "selo--rascunho"}">${p.publicado ? "no ar" : "rascunho"}</span>
          ${p.fotos.length} foto(s)${p.em_breve ? " · aviso de novidades" : ""}
        </div>
      </div>
      <div class="adm-item__acoes">
        <button class="mini" data-acao="sobe" ${i === 0 ? "disabled" : ""} aria-label="Subir ${p.nome}">↑</button>
        <button class="mini" data-acao="desce" ${i === produtos.length - 1 ? "disabled" : ""} aria-label="Descer ${p.nome}">↓</button>
        <button class="mini" data-acao="publica">${p.publicado ? "Tirar do ar" : "Publicar"}</button>
        <button class="mini" data-acao="edita">Editar</button>
      </div>`;
    el.querySelector(".adm-item__nome").textContent = p.nome;
    el.querySelector('[data-acao="edita"]').addEventListener("click", () => abreEditor(p));
    el.querySelector('[data-acao="publica"]').addEventListener("click", () => alternaPublicado(p));
    el.querySelector('[data-acao="sobe"]').addEventListener("click", () => troca(i, i - 1));
    el.querySelector('[data-acao="desce"]').addEventListener("click", () => troca(i, i + 1));
    alvo.appendChild(el);
  });
}

async function troca(a, b) {
  if (b < 0 || b >= produtos.length) return;
  const pa = produtos[a], pb = produtos[b];
  try {
    await Promise.all([
      rest(`pm_produtos?id=eq.${pa.id}`, { method: "PATCH", body: JSON.stringify({ ordem: b }) }),
      rest(`pm_produtos?id=eq.${pb.id}`, { method: "PATCH", body: JSON.stringify({ ordem: a }) }),
    ]);
    await carregaProdutos();
  } catch (e) {
    recado("#recado-produtos", `Não consegui reordenar: ${e.message}`, "erro");
  }
}

async function alternaPublicado(p) {
  try {
    await rest(`pm_produtos?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ publicado: !p.publicado }) });
    await carregaProdutos();
  } catch (e) {
    recado("#recado-produtos", `Não consegui mudar a publicação: ${e.message}`, "erro");
  }
}

/* ---------------------------------------------------------
   Editor
--------------------------------------------------------- */
$("#novo").addEventListener("click", () => abreEditor(null));
$("#cancelar").addEventListener("click", fechaEditor);

function abreEditor(p) {
  editando = p;
  fotosEditor = p ? p.fotos.map((f) => ({ ...f })) : [];
  $("#titulo-editor").textContent = p ? `Editando: ${p.nome}` : "Novo produto";
  $("#p-nome").value = p ? p.nome : "";
  $("#p-descricao").value = p ? p.descricao : "";
  $("#p-etiquetas").value = p ? (p.etiquetas || []).join("\n") : "";
  $("#p-mensagem").value = p ? p.mensagem : "Oi, Panda Mimo! Quero ";
  $("#p-botao").value = p ? p.rotulo_botao : "Quero essa";
  $("#p-publicado").checked = p ? p.publicado : true;
  $("#p-embreve").checked = p ? p.em_breve : false;
  $("#excluir").hidden = !p;
  recado("#recado-editor", "");
  desenhaFotos();
  $("#secao-editor").hidden = false;
  $("#secao-produtos").hidden = true;
  window.scrollTo({ top: 0, behavior: "instant" });
}

function fechaEditor() {
  editando = null;
  $("#secao-editor").hidden = true;
  if ($("#aba-produtos").getAttribute("aria-selected") === "true") $("#secao-produtos").hidden = false;
}

function desenhaFotos() {
  const alvo = $("#fotos");
  alvo.innerHTML = "";
  fotosEditor.forEach((f, i) => {
    const el = document.createElement("div");
    el.className = "adm-foto";
    el.innerHTML = `
      <div class="adm-foto__img"><img src="${f.url}" alt=""></div>
      <input type="text" value="" placeholder="Descreva a foto" aria-label="Texto alternativo da foto ${i + 1}">
      <div class="adm-foto__acoes">
        <button class="mini" data-a="esq" ${i === 0 ? "disabled" : ""} aria-label="Mover para a esquerda">←</button>
        <button class="mini" data-a="dir" ${i === fotosEditor.length - 1 ? "disabled" : ""} aria-label="Mover para a direita">→</button>
        <button class="mini mini--perigo" data-a="tira" aria-label="Remover foto">×</button>
      </div>`;
    const campo = el.querySelector("input");
    campo.value = f.alt || "";
    campo.addEventListener("input", () => (f.alt = campo.value));
    el.querySelector('[data-a="esq"]').addEventListener("click", () => { [fotosEditor[i - 1], fotosEditor[i]] = [fotosEditor[i], fotosEditor[i - 1]]; desenhaFotos(); });
    el.querySelector('[data-a="dir"]').addEventListener("click", () => { [fotosEditor[i + 1], fotosEditor[i]] = [fotosEditor[i], fotosEditor[i + 1]]; desenhaFotos(); });
    el.querySelector('[data-a="tira"]').addEventListener("click", () => { fotosEditor.splice(i, 1); desenhaFotos(); });
    alvo.appendChild(el);
  });
}

function apelido(nome) {
  return nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || `produto-${Date.now()}`;
}

$("#salvar").addEventListener("click", async () => {
  const nome = $("#p-nome").value.trim();
  if (!nome) return recado("#recado-editor", "Falta o nome do produto.", "erro");
  if (!fotosEditor.length) return recado("#recado-editor", "Coloque pelo menos uma foto.", "erro");
  if (fotosEditor.some((f) => !f.alt || !f.alt.trim()))
    return recado("#recado-editor", "Descreva cada foto: é o texto que quem não enxerga vai ouvir.", "erro");

  const corpo = {
    nome,
    descricao: $("#p-descricao").value.trim(),
    etiquetas: $("#p-etiquetas").value.split("\n").map((s) => s.trim()).filter(Boolean),
    mensagem: $("#p-mensagem").value.trim(),
    rotulo_botao: $("#p-botao").value.trim() || "Quero essa",
    publicado: $("#p-publicado").checked,
    em_breve: $("#p-embreve").checked,
  };
  recado("#recado-editor", "Salvando...");
  try {
    let id;
    if (editando) {
      await rest(`pm_produtos?id=eq.${editando.id}`, { method: "PATCH", body: JSON.stringify(corpo) });
      id = editando.id;
    } else {
      corpo.slug = apelido(nome);
      corpo.ordem = produtos.length;
      const [novo] = await rest("pm_produtos", {
        method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(corpo),
      });
      id = novo.id;
    }
    // as fotos são regravadas por inteiro, o que já resolve ordem e remoções
    await rest(`pm_produto_fotos?produto_id=eq.${id}`, { method: "DELETE" });
    if (fotosEditor.length)
      await rest("pm_produto_fotos", {
        method: "POST",
        body: JSON.stringify(fotosEditor.map((f, i) => ({
          produto_id: id, url: f.url, alt: f.alt.trim(), ordem: i,
          largura: f.largura || 760, altura: f.altura || 760,
        }))),
      });
    fechaEditor();
    await carregaProdutos();
    recado("#recado-produtos", `"${nome}" salvo. O site já mostra a versão nova.`, "ok");
  } catch (e) {
    recado("#recado-editor", `Não consegui salvar: ${e.message}`, "erro");
  }
});

$("#excluir").addEventListener("click", async () => {
  if (!editando) return;
  if (!confirm(`Excluir "${editando.nome}" do site? Isso não tem volta.`)) return;
  try {
    await rest(`pm_produtos?id=eq.${editando.id}`, { method: "DELETE" });
    fechaEditor();
    await carregaProdutos();
    recado("#recado-produtos", "Produto excluído.", "ok");
  } catch (e) {
    recado("#recado-editor", `Não consegui excluir: ${e.message}`, "erro");
  }
});

/* ---------------------------------------------------------
   Fotos: preparo no navegador
   Toda foto vira um quadro quadrado de 760px com fundo
   transparente e a peça inteira, com folga nas bordas.
--------------------------------------------------------- */
const LADO = 760, FOLGA = 0.07, LIMITE_ALFA = 12;

function temTransparencia(img) {
  const d = img.data;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return true;
  return false;
}

function removeFundo(img, tolerancia) {
  const { data, width: w, height: h } = img;
  let r = 0, g = 0, b = 0, n = 0;
  const soma = (x, y) => { const i = (y * w + x) * 4; r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; };
  for (let x = 0; x < w; x++) { soma(x, 0); soma(x, h - 1); }
  for (let y = 0; y < h; y++) { soma(0, y); soma(w - 1, y); }
  r /= n; g /= n; b /= n;
  const limite = tolerancia * tolerancia * 3;
  const parecido = (p) => {
    const i = p * 4, dr = data[i] - r, dg = data[i + 1] - g, db = data[i + 2] - b;
    return dr * dr + dg * dg + db * db <= limite;
  };
  const visto = new Uint8Array(w * h);
  const fila = [];
  const semeia = (p) => { if (!visto[p] && parecido(p)) { visto[p] = 1; fila.push(p); } };
  for (let x = 0; x < w; x++) { semeia(x); semeia((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { semeia(y * w); semeia(y * w + w - 1); }
  while (fila.length) {
    const p = fila.pop();
    data[p * 4 + 3] = 0;
    const x = p % w, y = (p - x) / w;
    if (x > 0) semeia(p - 1);
    if (x < w - 1) semeia(p + 1);
    if (y > 0) semeia(p - w);
    if (y < h - 1) semeia(p + w);
  }
  suavizaBorda(img);
}

/* tira o serrilhado deixando meio-tom nos pixels da beirada */
function suavizaBorda(img) {
  const { data, width: w, height: h } = img;
  const alfa = new Uint8ClampedArray(w * h);
  for (let p = 0; p < w * h; p++) alfa[p] = data[p * 4 + 3];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      let s = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += alfa[p + dy * w + dx];
      data[p * 4 + 3] = Math.round(s / 9);
    }
  }
}

function caixaDoConteudo(img) {
  const { data, width: w, height: h } = img;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (data[(y * w + x) * 4 + 3] > LIMITE_ALFA) {
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

/* uma peça recortada tem bordas irregulares; uma foto inteira preenche
   as quatro bordas da sua caixa. Nos produtos reais nenhuma borda passa
   de 22% de preenchimento, então 80% em todas é retângulo com certeza. */
function pareceRetangulo(dados, lado) {
  const al = (x, y) => dados[(y * lado + x) * 4 + 3];
  let x0 = lado, y0 = lado, x1 = -1, y1 = -1;
  for (let y = 0; y < lado; y++) for (let x = 0; x < lado; x++) {
    if (al(x, y) > LIMITE_ALFA) {
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return false;
  const conta = (pontos) => pontos.filter(([x, y]) => al(x, y) > LIMITE_ALFA).length / pontos.length;
  const colunas = [], linhas = [];
  for (let x = x0; x <= x1; x++) colunas.push(x);
  for (let y = y0; y <= y1; y++) linhas.push(y);
  const bordas = [
    conta(colunas.map((x) => [x, y0])), conta(colunas.map((x) => [x, y1])),
    conta(linhas.map((y) => [x0, y])), conta(linhas.map((y) => [x1, y])),
  ];
  return Math.min(...bordas) > 0.8;
}

async function preparaFoto(arquivo, { remover, tolerancia }) {
  const bmp = await createImageBitmap(arquivo);
  const MAX = 1400;
  const e = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * e), h = Math.round(bmp.height * e);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h);
  const jaTransparente = temTransparencia(img);
  if (remover && !jaTransparente) removeFundo(img, tolerancia);
  ctx.putImageData(img, 0, 0);

  const cx = caixaDoConteudo(img);
  if (!cx) return { erro: "A foto ficou vazia depois do recorte. Diminua a força do recorte." };
  const cw = cx.x1 - cx.x0 + 1, ch = cx.y1 - cx.y0 + 1;
  const proporcaoUtil = (cw * ch) / (w * h);

  const livre = LADO * (1 - 2 * FOLGA);
  const escala = Math.min(livre / cw, livre / ch);
  const dw = Math.round(cw * escala), dh = Math.round(ch * escala);
  const quadro = document.createElement("canvas");
  quadro.width = quadro.height = LADO;
  const qtx = quadro.getContext("2d");
  qtx.imageSmoothingQuality = "high";
  qtx.drawImage(c, cx.x0, cx.y0, cw, ch, Math.round((LADO - dw) / 2), Math.round((LADO - dh) / 2), dw, dh);

  // as mesmas regras que o guardião cobra do site
  const q = qtx.getImageData(0, 0, LADO, LADO).data;
  const alfa = (x, y) => q[(y * LADO + x) * 4 + 3];
  const cantoOpaco = [[2, 2], [LADO - 3, 2], [2, LADO - 3], [LADO - 3, LADO - 3]].some(([x, y]) => alfa(x, y) > LIMITE_ALFA);
  if (cantoOpaco)
    return { erro: jaTransparente
      ? "Esta imagem tem fundo sólido. Envie um PNG com fundo transparente."
      : "O fundo não saiu. Aumente a força do recorte ou envie um PNG já sem fundo." };
  if (proporcaoUtil < 0.04)
    return { erro: "O recorte pegou só um pedacinho da imagem. Diminua a força do recorte." };
  // uma peça de verdade nunca preenche as quatro bordas da própria caixa;
  // uma foto retangular colada no quadro preenche todas.
  if (pareceRetangulo(q, LADO))
    return { erro: "Isto continua sendo uma foto retangular com fundo. Aumente a força do recorte ou envie um PNG sem fundo." };

  const blob = await new Promise((r) => quadro.toBlob(r, "image/webp", 0.9));
  return { blob, url: quadro.toDataURL("image/webp", 0.85), largura: LADO, altura: LADO };
}

/* ---------- diálogo de preparo ---------- */
const dialogo = $("#dialogo-foto");
let filaArquivos = [];
let preparada = null;

$("#solta").addEventListener("click", () => $("#arquivo").click());
$("#solta").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("#arquivo").click(); } });
$("#arquivo").addEventListener("change", (e) => enfileira([...e.target.files]));
["dragenter", "dragover"].forEach((ev) => $("#solta").addEventListener(ev, (e) => { e.preventDefault(); $("#solta").classList.add("ativa"); }));
["dragleave", "drop"].forEach((ev) => $("#solta").addEventListener(ev, (e) => { e.preventDefault(); $("#solta").classList.remove("ativa"); }));
$("#solta").addEventListener("drop", (e) => enfileira([...e.dataTransfer.files].filter((f) => f.type.startsWith("image/"))));

function enfileira(arquivos) {
  filaArquivos = filaArquivos.concat(arquivos);
  $("#arquivo").value = "";
  if (!dialogo.open) proximaFoto();
}

async function proximaFoto() {
  if (!filaArquivos.length) return;
  dialogo.showModal();
  await refazPrevia();
}

async function refazPrevia() {
  const arquivo = filaArquivos[0];
  if (!arquivo) return;
  recado("#recado-foto", "Preparando...");
  $("#bloco-tolerancia").hidden = !$("#remover-fundo").checked;
  const r = await preparaFoto(arquivo, {
    remover: $("#remover-fundo").checked,
    tolerancia: Number($("#tolerancia").value),
  });
  if (r.erro) {
    preparada = null;
    $("#previa").removeAttribute("src");
    $("#previa-site").removeAttribute("src");
    recado("#recado-foto", r.erro, "erro");
    $("#usar-foto").disabled = true;
    return;
  }
  preparada = r;
  $("#previa").src = r.url;
  $("#previa-site").src = r.url;
  recado("#recado-foto", `Pronta: quadro de ${LADO}×${LADO}, fundo transparente. Faltam ${filaArquivos.length - 1} foto(s) na fila.`, "ok");
  $("#usar-foto").disabled = false;
}

let debounce;
$("#tolerancia").addEventListener("input", () => { clearTimeout(debounce); debounce = setTimeout(refazPrevia, 220); });
$("#remover-fundo").addEventListener("change", refazPrevia);

$("#descartar-foto").addEventListener("click", () => {
  filaArquivos.shift();
  dialogo.close();
  if (filaArquivos.length) proximaFoto();
});

$("#usar-foto").addEventListener("click", async () => {
  if (!preparada) return;
  recado("#recado-foto", "Enviando...");
  try {
    const nome = apelido($("#p-nome").value || "produto");
    const caminho = `produtos/${nome}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
    const r = await fetch(`${CFG.URL}/storage/v1/object/${CFG.BUCKET}/${caminho}`, {
      method: "POST",
      headers: { apikey: CFG.CHAVE, Authorization: `Bearer ${sessao.token}`, "Content-Type": "image/webp", "x-upsert": "true" },
      body: preparada.blob,
    });
    if (!r.ok) throw new Error((await r.text()).slice(0, 160));
    fotosEditor.push({
      url: `${CFG.URL}/storage/v1/object/public/${CFG.BUCKET}/${caminho}`,
      alt: "", largura: preparada.largura, altura: preparada.altura,
    });
    desenhaFotos();
    filaArquivos.shift();
    dialogo.close();
    recado("#recado-editor", "Foto adicionada. Não esqueça de descrevê-la e de salvar o produto.", "ok");
    if (filaArquivos.length) proximaFoto();
  } catch (e) {
    recado("#recado-foto", `Não consegui enviar: ${e.message}`, "erro");
  }
});

/* ---------------------------------------------------------
   Configurações
--------------------------------------------------------- */
async function carregaConfig() {
  try {
    const [c] = await rest("pm_config?select=*&limit=1");
    if (!c) return;
    $("#c-whatsapp").value = c.whatsapp || "";
    $("#c-instagram").value = c.instagram || "";
    $("#c-tiktok").value = c.tiktok || "";
    $("#c-aviso").value = c.aviso_topo || "";
  } catch (e) {
    recado("#recado-config", `Não consegui carregar as configurações: ${e.message}`, "erro");
  }
}

$("#salvar-config").addEventListener("click", async () => {
  const zap = $("#c-whatsapp").value.replace(/\D/g, "");
  if (zap && zap.length < 12)
    return recado("#recado-config", "O WhatsApp precisa do 55, do DDD e do número. Exemplo: 5511999998888.", "erro");
  try {
    await rest("pm_config?id=eq.true", {
      method: "PATCH",
      body: JSON.stringify({
        whatsapp: zap,
        instagram: $("#c-instagram").value.trim().replace(/^@/, ""),
        tiktok: $("#c-tiktok").value.trim().replace(/^@/, ""),
        aviso_topo: $("#c-aviso").value.trim(),
      }),
    });
    recado("#recado-config", "Configurações salvas. O site já usa os contatos novos.", "ok");
  } catch (e) {
    recado("#recado-config", `Não consegui salvar: ${e.message}`, "erro");
  }
});

$("#baixar-copia").addEventListener("click", () => {
  const copia = produtos.filter((p) => p.publicado).map((p) => ({
    slug: p.slug, nome: p.nome, descricao: p.descricao, etiquetas: p.etiquetas,
    mensagem: p.mensagem, rotulo_botao: p.rotulo_botao, em_breve: p.em_breve,
    fotos: p.fotos.map((f) => ({ url: f.url, alt: f.alt, largura: f.largura, altura: f.altura })),
    ordem: p.ordem,
  }));
  const texto = `/* Cópia do catálogo que vem junto com o site.
   Serve de reserva quando o banco não responde e como estado inicial da página.
   Gerada pelo painel em ${new Date().toLocaleString("pt-BR")}. */
window.PANDA_PRODUTOS = ${JSON.stringify(copia, null, 2)};
`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([texto], { type: "text/javascript" }));
  a.download = "produtos.js";
  a.click();
  URL.revokeObjectURL(a.href);
});

/* ---------------------------------------------------------
   Começo
--------------------------------------------------------- */
if (sessao.token) {
  abrePainel().catch(() => {
    sessao.limpa();
    $("#tela-login").hidden = false;
    $("#painel").hidden = true;
  });
}
