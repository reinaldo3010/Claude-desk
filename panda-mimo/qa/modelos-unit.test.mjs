import test from 'node:test';
import assert from 'node:assert/strict';
import { TEMPLATES, CATEGORIAS, modeloPorId, modelosDaCategoria, geometriaDoModelo, desenhaModelo, FRENTE, VERSO } from '../simulador/modelos.js';
import { computeTemplatePlacement, printAreaOf, tamanhoRecomendado } from '../simulador/arte.js';

const spec = { diameterMm: 82, heightMm: 95, printWidthMm: 210, printHeightMm: 90 };
const area = printAreaOf(spec);
const dentro = (caixa, folga = 0) => caixa.x >= area.x - folga && caixa.y >= area.y - folga
  && caixa.x + caixa.width <= area.x + area.width + folga && caixa.y + caixa.height <= area.y + area.height + folga;
const cruza = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

/** Contexto de mentira: guarda o que foi desenhado, sem precisar de canvas de verdade. */
function contextoFalso() {
  const registro = { imagens: [], textos: [], preenchimentos: 0 };
  const nada = () => {};
  return {
    registro,
    canvas: { width: 2480, height: 1063 },
    save: nada, restore: nada, beginPath: nada, closePath: nada, moveTo: nada, lineTo: nada,
    bezierCurveTo: nada, quadraticCurveTo: nada, arc: nada, ellipse: nada, rect: nada, roundRect: nada,
    clip: nada, translate: nada, rotate: nada, setTransform: nada, setLineDash: nada, stroke: nada,
    fill() { registro.preenchimentos += 1; },
    fillRect: nada, clearRect: nada, drawImage(...args) { registro.imagens.push(args); },
    measureText(texto) { return { width: texto.length * 3 }; },
    fillText(texto, x, y) { registro.textos.push({ texto, x, y }); },
  };
}

test('cada modelo tem identidade própria, categoria conhecida e ao menos um espaço de foto', () => {
  const ids = new Set();
  const categorias = new Set(CATEGORIAS.map((c) => c.id));
  for (const modelo of TEMPLATES) {
    assert.ok(!ids.has(modelo.id), `id repetido: ${modelo.id}`);
    ids.add(modelo.id);
    assert.ok(categorias.has(modelo.categoria), `${modelo.id} usa categoria fora da lista: ${modelo.categoria}`);
    assert.ok(modelo.nome && modelo.descricao, `${modelo.id} sem nome ou descrição`);
    assert.ok(modelo.fotos.length >= 1, `${modelo.id} não tem espaço de foto`);
    const idsDeFoto = new Set(modelo.fotos.map((f) => f.id));
    assert.equal(idsDeFoto.size, modelo.fotos.length, `${modelo.id} tem espaços de foto com o mesmo id`);
    for (const texto of modelo.textos) {
      assert.ok(texto.max >= String(texto.valor).length, `${modelo.id}: a frase de exemplo "${texto.valor}" não cabe no limite do campo`);
      assert.ok(['Fredoka', 'Caveat', 'Nunito'].includes(texto.fonte), `${modelo.id} usa fonte fora da marca: ${texto.fonte}`);
    }
  }
  assert.ok(TEMPLATES.some((m) => m.fotos.length >= 3), 'nenhum modelo aceita três ou mais fotos');
  for (const categoria of CATEGORIAS.filter((c) => c.id !== 'livre')) {
    assert.ok(modelosDaCategoria(categoria.id).length > 0, `a categoria ${categoria.id} ficou sem modelo`);
  }
});

test('fotos e frases cabem na área de impressão e nada se sobrepõe', () => {
  for (const modelo of TEMPLATES) {
    const geometria = geometriaDoModelo(modelo, area);
    for (const foto of geometria.fotos) {
      assert.ok(dentro(foto.caixa), `${modelo.id}: ${foto.rotulo} sai da área de impressão`);
    }
    for (let i = 0; i < geometria.fotos.length; i += 1) {
      for (let j = i + 1; j < geometria.fotos.length; j += 1) {
        assert.ok(!cruza(geometria.fotos[i].caixa, geometria.fotos[j].caixa),
          `${modelo.id}: ${geometria.fotos[i].rotulo} e ${geometria.fotos[j].rotulo} se sobrepõem`);
      }
    }
    for (const texto of geometria.textos) {
      for (const posicao of texto.posicoes) {
        const caixa = { x: posicao.x - posicao.largura / 2, y: posicao.y - texto.tamanho * 0.8, width: posicao.largura, height: texto.tamanho * 1.6 };
        assert.ok(dentro(caixa, 0.01), `${modelo.id}: a frase "${texto.rotulo}" sai da área de impressão`);
        for (const foto of geometria.fotos) {
          assert.ok(!cruza(caixa, foto.caixa), `${modelo.id}: a frase "${texto.rotulo}" cai em cima de ${foto.rotulo}`);
        }
      }
    }
  }
});

test('a frente e o verso da caneca caem onde o 3D os coloca', () => {
  const volta = Math.PI * spec.diameterMm;
  assert.ok(Math.abs(FRENTE - (0.25 * volta - area.x) / area.width) < 1e-9);
  assert.ok(Math.abs(VERSO - (0.75 * volta - area.x) / area.width) < 1e-9);
  const modelo = modeloPorId('namorados-coracoes');
  const geometria = geometriaDoModelo(modelo, area);
  const centro = geometria.fotos[0].caixa.x + geometria.fotos[0].caixa.width / 2;
  assert.ok(Math.abs(centro - 0.25 * volta) < 0.01, 'a foto da frente não está no meio da frente da caneca');
});

test('dpi de cada foto sai do tamanho do espaço; espaço vazio vira aviso', () => {
  const modelo = modeloPorId('namorados-coracoes');
  const placement = computeTemplatePlacement(modelo, {}, spec, {
    a: { image: {}, width: 1200, height: 1200, scale: 1 },
  });
  const [frente, verso] = placement.slots;
  assert.equal(frente.preenchido, true);
  assert.equal(verso.preenchido, false);
  assert.deepEqual(placement.vazios, ['Foto do verso']);
  // A foto cobre o espaço: manda o lado que precisa de mais ampliação (a altura, aqui).
  const escala = Math.max(frente.caixa.width / 1200, frente.caixa.height / 1200);
  assert.ok(Math.abs(frente.effectiveDpi - 25.4 / escala) < 1e-9);
  const ampliada = computeTemplatePlacement(modelo, {}, spec, { a: { image: {}, width: 1200, height: 1200, scale: 2 } });
  assert.ok(Math.abs(ampliada.slots[0].effectiveDpi - frente.effectiveDpi / 2) < 1e-9);
});

test('o mesmo modelo desenha sempre igual, e o Pandinha nunca cobre foto ou frase', () => {
  const panda = { width: 100, height: 100 };
  for (const modelo of TEMPLATES) {
    const primeiro = contextoFalso();
    const segundo = contextoFalso();
    const dados = { pandaImage: panda, placeholder: true };
    desenhaModelo(primeiro, modelo, area, dados);
    desenhaModelo(segundo, modelo, area, dados);
    assert.deepEqual(primeiro.registro.textos, segundo.registro.textos, `${modelo.id}: as frases mudaram entre dois desenhos`);
    assert.equal(primeiro.registro.preenchimentos, segundo.registro.preenchimentos, `${modelo.id}: os enfeites mudaram entre dois desenhos`);

    const geometria = geometriaDoModelo(modelo, area);
    const reservados = [
      ...geometria.fotos.map((f) => f.caixa),
      ...geometria.textos.flatMap((t) => t.posicoes.map((p) => ({ x: p.x - p.largura / 2, y: p.y - t.tamanho * 0.8, width: p.largura, height: t.tamanho * 1.7 }))),
    ];
    for (const [, x, y, w, h] of primeiro.registro.imagens) {
      const caixa = { x, y, width: w, height: h };
      assert.ok(dentro(caixa, 0.01), `${modelo.id}: o Pandinha sai da área de impressão`);
      for (const r of reservados) {
        assert.ok(!cruza(caixa, r), `${modelo.id}: o Pandinha cobre uma foto ou uma frase`);
      }
    }
  }
});

test('as frases entram no desenho e o campo vazio some da arte', () => {
  const modelo = modeloPorId('aniversario-confete');
  const escrito = contextoFalso();
  desenhaModelo(escrito, modelo, area, { textos: { principal: 'Parabéns, Zé!', idade: '' } });
  const frases = escrito.registro.textos.map((t) => t.texto);
  assert.deepEqual(frases, ['Parabéns, Zé!']);
  const padrao = contextoFalso();
  desenhaModelo(padrao, modelo, area, {});
  assert.deepEqual(padrao.registro.textos.map((t) => t.texto), ['Parabéns, Malu!', '25 anos']);
});

test('o tamanho indicado para montar a arte fora do site é o da área de impressão em 300 dpi', () => {
  const medida = tamanhoRecomendado(spec);
  assert.equal(medida.larguraPx, 2480);
  assert.equal(medida.alturaPx, 1063);
  assert.equal(medida.dpi, 300);
  assert.equal(Math.round(medida.larguraCm), 21);
  assert.equal(Math.round(medida.alturaCm), 9);
});
