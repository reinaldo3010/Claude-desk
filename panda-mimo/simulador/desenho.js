/*
  O vocabulário de desenho das coleções de arte.

  Uma ilustração é uma lista de partes, em coordenadas próprias, centradas na origem. O tamanho vem
  de `largura` × `altura`, e quem desenha escala para o tamanho pedido em milímetros. As cores são
  sempre tokens da paleta (manual, seção 9.1); a parte marcada com a cor `primary` da ilustração é
  a que recebe a tinta escolhida pela pessoa.

  As partes que existem, todas com `fill`, `stroke`, `w` (espessura) e `evenOdd` opcionais:

    { circulo:   [cx, cy, r] }
    { elipse:    [cx, cy, rx, ry, giro?] }
    { retangulo: [x, y, largura, altura, raio?] }     // x,y é o canto de cima, à esquerda
    { linha:     [[x, y], [x, y], …], fechado? }
    { d: 'M x y L x y C x y x y x y Q x y x y Z' }    // caminho, só comandos absolutos

  Nada aqui carrega imagem: o mesmo desenho serve para a prévia na tela e para o arquivo de 300 dpi.
*/
import { cor } from './paleta.js';

/**
 * Parte um caminho em comandos e números. Só aceita comandos absolutos: o `l` minúsculo do SVG é
 * relativo e desenharia outra coisa calada, então é melhor quebrar alto na hora de escrever.
 */
function pedacosDoCaminho(d) {
  if (/[mlcqzhvsat]/.test(String(d))) {
    throw new Error('caminho com comando relativo ou não suportado: use M, L, C, Q e Z maiúsculos');
  }
  return String(d).match(/[MLCQZ]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
}

/** Lê um caminho no estilo do SVG, só com comandos absolutos. Erra alto: caminho torto é bug. */
function percorreCaminho(ctx, d, k) {
  const partes = pedacosDoCaminho(d);
  let i = 0;
  let comando = '';
  const proximo = () => {
    const valor = Number(partes[i]);
    if (!Number.isFinite(valor)) throw new Error(`caminho com número inválido perto de "${partes[i]}"`);
    i += 1;
    return valor * k;
  };
  while (i < partes.length) {
    if (/^[MLCQZ]$/.test(partes[i])) { comando = partes[i]; i += 1; }
    if (comando === 'Z') { ctx.closePath(); comando = ''; continue; }
    if (!comando) throw new Error('caminho começa sem comando');
    if (comando === 'M') { ctx.moveTo(proximo(), proximo()); comando = 'L'; }
    else if (comando === 'L') ctx.lineTo(proximo(), proximo());
    else if (comando === 'C') ctx.bezierCurveTo(proximo(), proximo(), proximo(), proximo(), proximo(), proximo());
    else if (comando === 'Q') ctx.quadraticCurveTo(proximo(), proximo(), proximo(), proximo());
  }
}

function tracaParte(ctx, parte, k) {
  ctx.beginPath();
  if (parte.circulo) {
    const [cx, cy, r] = parte.circulo;
    ctx.arc(cx * k, cy * k, r * k, 0, Math.PI * 2);
  } else if (parte.elipse) {
    const [cx, cy, rx, ry, giro = 0] = parte.elipse;
    ctx.ellipse(cx * k, cy * k, rx * k, ry * k, giro * Math.PI / 180, 0, Math.PI * 2);
  } else if (parte.retangulo) {
    const [x, y, largura, altura, raio = 0] = parte.retangulo;
    if (raio && ctx.roundRect) ctx.roundRect(x * k, y * k, largura * k, altura * k, raio * k);
    else ctx.rect(x * k, y * k, largura * k, altura * k);
  } else if (parte.linha) {
    parte.linha.forEach(([x, y], n) => (n ? ctx.lineTo(x * k, y * k) : ctx.moveTo(x * k, y * k)));
    if (parte.fechado) ctx.closePath();
  } else if (parte.d) {
    percorreCaminho(ctx, parte.d, k);
  } else {
    throw new Error(`parte sem forma: ${JSON.stringify(parte)}`);
  }
}

/**
 * Desenha a ilustração já centrada na origem, no tamanho pedido (em milímetros de largura).
 * `tinta` é o token escolhido pela pessoa e entra no lugar da cor principal do desenho.
 */
export function desenhaIlustracao(ctx, ilustracao, tamanho, tinta) {
  const k = tamanho / ilustracao.largura;
  const pinta = (token) => cor(token === ilustracao.primary ? tinta : token);
  ctx.save();
  // `ilustracao()` mediu o desenho e guardou o quanto ele precisa andar para ficar centrado.
  ctx.translate((ilustracao.deslocaX || 0) * k, (ilustracao.deslocaY || 0) * k);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const parte of ilustracao.partes) {
    tracaParte(ctx, parte, k);
    if (parte.fill) {
      ctx.fillStyle = pinta(parte.fill);
      ctx.fill(parte.evenOdd ? 'evenodd' : 'nonzero');
    }
    if (parte.stroke) {
      ctx.strokeStyle = pinta(parte.stroke);
      ctx.lineWidth = Math.max(0.12, (parte.w || 1) * k);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* ---------- medida ---------- */
function amostraBezier(pontos, saida) {
  const [p0, p1, p2, p3] = pontos;
  for (let i = 0; i <= 16; i += 1) {
    const t = i / 16, u = 1 - t;
    saida.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
}

/** Os pontos por onde o caminho passa de verdade, curvas incluídas (amostradas). */
function pontosDoCaminho(d) {
  const partes = pedacosDoCaminho(d);
  const pontos = [];
  let i = 0, comando = '', atual = [0, 0], inicio = [0, 0];
  const n = () => Number(partes[i++]);
  while (i < partes.length) {
    if (/^[MLCQZ]$/.test(partes[i])) { comando = partes[i]; i += 1; }
    if (comando === 'Z') { atual = inicio; comando = ''; continue; }
    if (comando === 'M') { atual = [n(), n()]; inicio = atual; pontos.push(atual); comando = 'L'; }
    else if (comando === 'L') { atual = [n(), n()]; pontos.push(atual); }
    else if (comando === 'C') {
      const c1 = [n(), n()], c2 = [n(), n()], fim = [n(), n()];
      amostraBezier([atual, c1, c2, fim], pontos);
      atual = fim;
    } else if (comando === 'Q') {
      const c = [n(), n()], fim = [n(), n()];
      amostraBezier([atual, [atual[0] + (2 / 3) * (c[0] - atual[0]), atual[1] + (2 / 3) * (c[1] - atual[1])],
        [fim[0] + (2 / 3) * (c[0] - fim[0]), fim[1] + (2 / 3) * (c[1] - fim[1])], fim], pontos);
      atual = fim;
    } else break;
  }
  return pontos;
}

/**
 * Onde a tinta da ilustração começa e termina, nas coordenadas dela.
 * Serve para conferir se `largura` e `altura` declarados acompanham o desenho: a caixa de seleção
 * sai daí, e caixa que não acompanha o desenho faz a alça mentir na mão da pessoa.
 */
export function limitesDaIlustracao(ilustracao) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const marca = (x, y, folga) => {
    x0 = Math.min(x0, x - folga); y0 = Math.min(y0, y - folga);
    x1 = Math.max(x1, x + folga); y1 = Math.max(y1, y + folga);
  };
  for (const parte of ilustracao.partes) {
    const folga = parte.stroke ? (parte.w || 1) / 2 : 0;
    if (parte.circulo) {
      const [cx, cy, r] = parte.circulo;
      marca(cx, cy, r + folga);
    } else if (parte.elipse) {
      const [cx, cy, rx, ry, giro = 0] = parte.elipse;
      const a = giro * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      const meiaL = Math.hypot(rx * c, ry * s), meiaA = Math.hypot(rx * s, ry * c);
      marca(cx - meiaL, cy - meiaA, folga); marca(cx + meiaL, cy + meiaA, folga);
    } else if (parte.retangulo) {
      const [x, y, largura, altura] = parte.retangulo;
      marca(x, y, folga); marca(x + largura, y + altura, folga);
    } else if (parte.linha) {
      for (const [x, y] of parte.linha) marca(x, y, folga);
    } else if (parte.d) {
      for (const [x, y] of pontosDoCaminho(parte.d)) marca(x, y, folga);
    }
  }
  return { x0, y0, x1, y1, largura: x1 - x0, altura: y1 - y0, centroX: (x0 + x1) / 2, centroY: (y0 + y1) / 2 };
}

/**
 * Fecha uma ilustração: mede o desenho, guarda o tamanho real e o quanto ele anda para ficar
 * centrado. Quem desenha não precisa contar coordenada na mão — e a caixa de seleção nunca mente.
 */
export function ilustracao(spec) {
  const m = limitesDaIlustracao(spec);
  if (!Number.isFinite(m.largura) || m.largura <= 0 || m.altura <= 0) {
    throw new Error('ilustração sem desenho nenhum');
  }
  const arredonda = (n) => Math.round(n * 100) / 100;
  return Object.freeze({
    ...spec,
    partes: Object.freeze(spec.partes),
    largura: arredonda(m.largura),
    altura: arredonda(m.altura),
    deslocaX: arredonda(-m.centroX),
    deslocaY: arredonda(-m.centroY),
  });
}
