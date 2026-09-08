// Critérios objetivos de legibilidade; as capturas ainda precisam de revisão humana.
export function inspectSvgSource(source, name) {
  const errors = [];
  if (!/<svg\b[^>]*\bviewBox=/i.test(source)) errors.push(`${name}: SVG sem viewBox`);
  if (/<(?:\w+:)?(?:image|foreignObject|script)\b/i.test(source)) errors.push(`${name}: SVG com bitmap, conteúdo externo ou script incorporado`);
  if (/(?:href\s*=\s*["'](?:https?:|data:)|url\(\s*["']?https?:)/i.test(source)) errors.push(`${name}: recurso externo incorporado`);
  if (/shape-rendering\s*[:=]\s*["']?(?:crispEdges|optimizeSpeed)/i.test(source)) errors.push(`${name}: suavização das curvas desativada`);
  return errors;
}

// Executada no navegador real e também com defeitos inseridos de propósito.
export function inspectVisualPage() {
  const errors = [];
  const visible = e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
  const key = e => e.textContent.trim().slice(0, 70) || e.getAttribute('src') || e.className;
  const luminance = c => {
    const rgb = c.match(/[\d.]+/g)?.slice(0, 3).map(Number);
    if (!rgb) return null;
    return rgb.map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((s,v,i) => s + v * [.2126,.7152,.0722][i], 0);
  };
  const textTargets = '.trust__badge h3, .trust__item > p, .promise h3, .promise p, .ribbon, .tag--text, .speech--text';
  for (const e of document.querySelectorAll(textTargets)) {
    if (!visible(e)) continue;
    const s = getComputedStyle(e), b = e.getBoundingClientRect();
    if (!e.textContent.trim() || e.tagName === 'IMG') errors.push(`frase dentro de imagem: ${key(e)}`);
    const min = e.matches('.trust__item > p, .promise p') ? 14 : e.matches('.ribbon, .trust__badge h3, .promise h3') ? 18 : 16;
    if (parseFloat(s.fontSize) < min) errors.push(`texto pequeno (${s.fontSize}, mínimo ${min}px): ${key(e)}`);
    if (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1) errors.push(`texto cortado: ${key(e)}`);
    if (b.left < -1 || b.right > document.documentElement.clientWidth + 1) errors.push(`texto fora da tela: ${key(e)}`);
    for (let p = e; p && p !== document.body; p = p.parentElement) {
      const ps = getComputedStyle(p);
      if (ps.filter !== 'none' || /matrix\((?!1, 0, 0, 1,)/.test(ps.transform)) errors.push(`texto filtrado ou reescalado: ${key(e)}`);
    }
    let bg = e;
    while (bg.parentElement && /^(transparent|rgba\([^)]*, 0\))$/.test(getComputedStyle(bg).backgroundColor)) bg = bg.parentElement;
    const a = luminance(s.color), z = luminance(getComputedStyle(bg).backgroundColor);
    if (a !== null && z !== null && (Math.max(a,z)+.05)/(Math.min(a,z)+.05) < 4.5) errors.push(`contraste abaixo de 4.5:1: ${key(e)}`);
  }
  // Os antigos selos com textos em curvas não podem voltar por acidente.
  for (const i of document.querySelectorAll('.trust img')) {
    if (!/-simbolo\.svg(?:[?#]|$)/.test(i.getAttribute('src') || '')) errors.push(`selo deve separar símbolo e frase: ${i.getAttribute('src')}`);
  }
  for (const i of document.querySelectorAll('.brand img, .trust__badge img, .promise__icon, .step__sticker--icon')) {
    const src = i.currentSrc || i.src, s = getComputedStyle(i);
    if (!/\.svg(?:[?#]|$)/.test(src)) errors.push(`símbolo precisa de vetor real: ${src}`);
    if (s.filter !== 'none' || /pixelated|crisp-edges/.test(s.imageRendering)) errors.push(`efeito sobre vetor de interface: ${src}`);
  }
  const images = [];
  for (const i of document.images) {
    if (!visible(i)) continue;
    const b = i.getBoundingClientRect(), s = getComputedStyle(i), src = i.currentSrc || i.src;
    if (!i.complete || !i.naturalWidth) { errors.push(`imagem não carregou: ${src}`); continue; }
    const vector = /\.svg(?:[?#]|$)/.test(src);
    let density = 1;
    for (const candidate of (i.srcset || '').split(',')) {
      const [url, d] = candidate.trim().split(/\s+/);
      if (url && new URL(url, location.href).href === src && /x$/.test(d || '')) density = parseFloat(d);
    }
    let width = b.width;
    if (s.objectFit === 'contain') width = i.naturalWidth * Math.min(b.width / i.naturalWidth, b.height / i.naturalHeight);
    if (s.objectFit === 'cover') width = i.naturalWidth * Math.max(b.width / i.naturalWidth, b.height / i.naturalHeight);
    const required = width * devicePixelRatio, pixels = i.naturalWidth * density;
    images.push({src, vector, displayedWidth:width, requiredPixels:required, sourcePixels:vector ? null : pixels});
    if (!vector && required > pixels * 1.1) errors.push(`raster ampliado além de 10%: ${src} (${Math.ceil(required)}/${pixels}px)`);
  }
  return {errors:[...new Set(errors)], images, dpr:devicePixelRatio, width:innerWidth};
}
