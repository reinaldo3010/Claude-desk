/* Páginas de apoio (sobre, trocas, termos, privacidade): ano, links do WhatsApp e dados da loja.
   Mesma cópia local de contatos do script.js, atualizada pelo banco quando ele responde. */
(function () {
  const CONTATO = { whatsapp: "5500000000000" };
  const ano = document.getElementById("ano");
  if (ano) ano.textContent = new Date().getFullYear();
  const aplica = () => document.querySelectorAll(".js-wa").forEach((a) => {
    a.href = `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(a.dataset.msg || "Oi, Panda Mimo! 🐼")}`;
    a.target = "_blank"; a.rel = "noopener";
  });
  aplica();
  const cfg = window.PANDA_CONFIG;
  if (!cfg || !cfg.URL || !cfg.CHAVE) return;
  fetch(`${cfg.URL}/rest/v1/pm_config?select=whatsapp,nome_empresarial,cnpj,endereco,email&limit=1`, { headers: { apikey: cfg.CHAVE, Authorization: `Bearer ${cfg.CHAVE}` } })
    .then((r) => (r.ok ? r.json() : []))
    .then(([c]) => {
      if (!c) return;
      if (c.whatsapp) { CONTATO.whatsapp = c.whatsapp; aplica(); }
      const el = document.getElementById("loja-dados");
      const partes = [c.nome_empresarial, c.cnpj && `CNPJ ${c.cnpj}`, c.endereco, c.email].filter(Boolean);
      if (el && partes.length) { el.textContent = partes.join(" · "); el.hidden = false; }
    })
    .catch(() => {});
})();
