/** Exporta as mesmas curvas usadas pelo editor; não incorpora imagens raster. */
import { mkdir, writeFile } from 'node:fs/promises';
import { ILUSTRACOES_ATELIE, MODELOS_ATELIE } from '../../../../simulador/atelie.js';
import { PALETA } from '../../../../simulador/paleta.js';

const destino = new URL('../../svg/atelie/', import.meta.url);
await mkdir(destino, { recursive: true });
for (const [id, spec] of Object.entries(ILUSTRACOES_ATELIE)) {
  const partes = spec.partes.map(p => {
    const estilo = `fill="${PALETA[p.fill] || 'none'}" stroke="${PALETA[p.stroke] || 'none'}" stroke-width="${p.w || 1}" stroke-linecap="round" stroke-linejoin="round"`;
    if (p.d) return `<path d="${p.d}" ${estilo}/>`;
    if (p.circulo) {
      const [cx,cy,r] = p.circulo;
      return `<circle cx="${cx}" cy="${cy}" r="${r}" ${estilo}/>`;
    }
    if (p.retangulo) {
      const [x,y,width,height,rx] = p.retangulo;
      return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx || 0}" ${estilo}/>`;
    }
    throw new Error(`Parte sem exportador: ${id}`);
  });
  const w = spec.largura + 4, h = spec.altura + 4;
  await writeFile(new URL(`${id}.svg`,destino), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-w/2-spec.deslocaX} ${-h/2-spec.deslocaY} ${w} ${h}">\n${partes.join('\n')}\n</svg>\n`);
}
await writeFile(new URL('modelos.json',destino), JSON.stringify(MODELOS_ATELIE,null,2));
console.log(`${Object.keys(ILUSTRACOES_ATELIE).length} SVGs e ${MODELOS_ATELIE.length} modelos exportados.`);
