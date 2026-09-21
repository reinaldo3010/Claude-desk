/*
  A coleção esportiva desenhada por curvas.

  Cada ilustração é uma lista de caminhos em coordenadas próprias, centrados na origem. O editor
  trata a ilustração como um enfeite comum: a pessoa move, gira, redimensiona e troca a cor. A cor
  escolhida substitui a tinta principal do desenho; as demais seguem os tokens da paleta, para a
  ilustração acompanhar o `styles.css` como o resto do site.
*/
import { VETORES_ESPORTES } from './esportes-dados.js';
import { cor } from './paleta.js';

export const vetorEsportivo = (forma) => VETORES_ESPORTES[forma] || null;

/** Desenha a ilustração no tamanho pedido; a tinta escolhida entra no lugar da cor principal. */
export function desenhaVetorEsportivo(ctx, forma, tamanho, tinta) {
  const vetor = vetorEsportivo(forma);
  if (!vetor) return false;
  const escala = tamanho / vetor.width;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const p of vetor.paths) {
    ctx.beginPath();
    for (const [cmd, ...values] of p.commands) {
      const v = values.map((n) => n * escala);
      if (cmd === 'M') ctx.moveTo(...v);
      else if (cmd === 'L') ctx.lineTo(...v);
      else if (cmd === 'C') ctx.bezierCurveTo(...v);
      else if (cmd === 'Z') ctx.closePath();
    }
    if (p.fill) {
      ctx.fillStyle = p.fill === vetor.primary ? cor(tinta) : cor(p.fill);
      ctx.fill(p.evenOdd ? 'evenodd' : 'nonzero');
    }
    if (p.stroke) {
      ctx.strokeStyle = p.stroke === vetor.primary ? cor(tinta) : cor(p.stroke);
      ctx.lineWidth = p.width * escala;
      ctx.stroke();
    }
  }
  ctx.restore();
  return true;
}
