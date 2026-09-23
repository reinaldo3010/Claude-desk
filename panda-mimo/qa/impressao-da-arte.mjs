/*
  Impressão digital de uma arte: a lista de tudo que o desenho pede ao canvas — cada traço, cada
  posição, cada cor, cada imagem —, resumida num hash. Não depende de placa de vídeo nem de fonte
  instalada: o canvas é de mentira e anota os pedidos, e a letra é medida por uma régua fixa.

  Serve para uma pergunta só: a arte mudou? É o que `qa/artes-aprovadas-unit.test.mjs` pergunta
  sobre os modelos que o dono já aprovou.
*/
import { createHash } from 'node:crypto';

const normaliza = (valor) => {
  if (typeof valor === 'number') return Number(valor.toFixed(4));
  if (valor && typeof valor === 'object' && 'arquivo' in valor) return `imagem:${valor.arquivo}`;
  if (valor && typeof valor === 'object') return '[objeto]';
  return valor;
};

/** Um contexto de canvas que anota tudo o que pedem a ele. */
export function contextoQueAnota() {
  const pedidos = [];
  const estado = {};
  const ctx = new Proxy(estado, {
    get(alvo, nome) {
      if (nome === 'measureText') return (texto) => ({ width: String(texto).length * 3 });
      if (nome in alvo) return alvo[nome];
      return (...args) => { pedidos.push([nome, ...args.map(normaliza)]); };
    },
    set(alvo, nome, valor) {
      pedidos.push(['=', nome, normaliza(valor)]);
      alvo[nome] = valor;
      return true;
    },
  });
  return { ctx, pedidos };
}

/**
 * O hash dos pedidos de desenho de uma lista de modelos, com as imagens de mentira no tamanho real.
 * `motor` é o módulo `simulador/modelos.js` (o de hoje, ou uma cópia antiga, para comparar).
 */
export function impressaoDasArtes(motor, modelos, tamanhos) {
  const area = { x: 0, y: 0, width: 210, height: 90 };
  const imagens = Object.fromEntries(Object.entries(tamanhos)
    .map(([arquivo, { largura, altura }]) => [arquivo, { arquivo, naturalWidth: largura, naturalHeight: altura }]));
  const hash = createHash('sha256');
  for (const modelo of modelos) {
    const { ctx, pedidos } = contextoQueAnota();
    motor.desenhaArte(ctx, motor.novaArte(modelo), area, { imagens });
    hash.update(`${modelo.id}\n${JSON.stringify(pedidos)}\n`);
  }
  return hash.digest('hex').slice(0, 24);
}
