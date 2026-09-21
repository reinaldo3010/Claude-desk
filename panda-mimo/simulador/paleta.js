/*
  A paleta da marca em um lugar só.

  Todo desenho da arte — frase, enfeite, ilustração do acervo, coleção esportiva — pede a cor por
  token (`--peach`), nunca por valor solto. Na página o valor vem do `styles.css`; fora dela (nos
  testes e nas provas em Node) vem da cópia de reserva abaixo, que precisa acompanhar o manual.
*/
export const PALETA = Object.freeze({
  '--ink': '#171512', '--ink-soft': '#4A443D', '--paper': '#FBF6EF', '--cream': '#F6F4EF',
  '--sand': '#E7D8C3', '--sand-soft': '#F1E7D8', '--kraft': '#C9A57E', '--peach': '#FFB59C',
  '--peach-deep': '#E8916F', '--peach-ink': '#A25030', '--hand-ink': '#CB6B44',
  '--sage': '#A8C5A2', '--sage-deep': '#6E8C67', '--white': '#FFFDF8',
});

/** Um token da paleta vira cor; na página vem do styles.css, fora dela do valor de reserva. */
export function cor(token) {
  if (typeof token !== 'string' || !token.startsWith('--')) return token || PALETA['--ink'];
  if (typeof getComputedStyle === 'function' && typeof document !== 'undefined') {
    const lido = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    if (lido) return lido;
  }
  return PALETA[token] || PALETA['--ink'];
}
