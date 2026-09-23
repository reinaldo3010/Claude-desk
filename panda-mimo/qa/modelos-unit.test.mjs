import test from 'node:test';
import assert from 'node:assert/strict';
import {
  gruposDeCategorias, ORDEM_DOS_GRUPOS,
  TEMPLATES, CATEGORIAS, CORES_DE_ARTE, ENFEITES, ADESIVOS, ELEMENTOS, FORMAS_DE_FOTO,
  modeloPorId, modelosDaCategoria, novaArte, desenhaArte, caixaDaCamada, camadaEm, alcasDaCamada,
  medidorDeTexto, FRENTE, VERSO,
} from '../simulador/modelos.js';
import { computeArtePlacement, printAreaOf, tamanhoRecomendado } from '../simulador/arte.js';
import { FONTES_DA_ARTE, pesoDaFonte, ehFonteDaMarca } from '../simulador/fontes.js';
import { ehIlustracao } from '../simulador/colecoes.js';

const spec = { diameterMm: 82, heightMm: 95, printWidthMm: 210, printHeightMm: 90 };
const area = printAreaOf(spec);
const dentro = (caixa, folga = 0.01) => caixa.x >= area.x - folga && caixa.y >= area.y - folga
  && caixa.x + caixa.width <= area.x + area.width + folga && caixa.y + caixa.height <= area.y + area.height + folga;
/** Só conta como sobreposição o que invade mais de meio milímetro: encostar é permitido. */
const cruza = (a, b, folga = 0.5) => a.x + folga < b.x + b.width && a.x + a.width > b.x + folga
  && a.y + folga < b.y + b.height && a.y + a.height > b.y + folga;

/**
 * Contexto de mentira: guarda o que foi desenhado, sem precisar de canvas de verdade.
 * Ele acompanha o translate para que as posições registradas sejam as da área de impressão.
 */
function contextoFalso() {
  const registro = { imagens: [], textos: [], preenchimentos: 0 };
  const pilha = [];
  let tx = 0, ty = 0;
  const nada = () => {};
  return {
    registro,
    save() { pilha.push([tx, ty]); },
    restore() { [tx, ty] = pilha.pop() || [0, 0]; },
    translate(x, y) { tx += x; ty += y; },
    beginPath: nada, closePath: nada, moveTo: nada, lineTo: nada,
    bezierCurveTo: nada, quadraticCurveTo: nada, arc: nada, ellipse: nada, rect: nada, roundRect: nada,
    clip: nada, rotate: nada, setTransform: nada, setLineDash: nada, stroke: nada,
    fill() { registro.preenchimentos += 1; },
    fillRect: nada, clearRect: nada,
    drawImage(imagem, x, y, w, h) { registro.imagens.push([imagem, x + tx, y + ty, w, h]); },
    measureText(texto) { return { width: texto.length * 3 }; },
    fillText(texto, x, y) { registro.textos.push({ texto, x: x + tx, y: y + ty }); },
  };
}
const medidor = medidorDeTexto(contextoFalso());

test('cada modelo tem identidade própria, categoria conhecida e camadas válidas', () => {
  const ids = new Set();
  const categorias = new Set(CATEGORIAS.map((c) => c.id));
  const fontes = new Set(FONTES_DA_ARTE.map((f) => f.valor));
  const cores = new Set(CORES_DE_ARTE.map((c) => c.token));
  const formasDeFoto = new Set(FORMAS_DE_FOTO.map((f) => f.valor));
  const enfeites = new Set(ENFEITES.map((e) => e.forma));
  const poses = new Set(ADESIVOS.map((a) => a.arquivo));
  const elementos = new Set(ELEMENTOS.map((e) => e.arquivo));
  for (const modelo of TEMPLATES) {
    assert.ok(!ids.has(modelo.id), `id repetido: ${modelo.id}`);
    ids.add(modelo.id);
    assert.ok(categorias.has(modelo.categoria), `${modelo.id} usa categoria fora da lista: ${modelo.categoria}`);
    assert.ok(modelo.nome && modelo.descricao, `${modelo.id} sem nome ou descrição`);
    assert.ok(modelo.camadas.length >= 2, `${modelo.id} tem arte vazia demais`);
    const idsDeCamada = new Set(modelo.camadas.map((c) => c.id));
    assert.equal(idsDeCamada.size, modelo.camadas.length, `${modelo.id} tem camadas com o mesmo id`);
    for (const camada of modelo.camadas) {
      assert.ok(['foto', 'frase', 'enfeite', 'adesivo', 'elemento'].includes(camada.tipo), `${modelo.id}: tipo desconhecido ${camada.tipo}`);
      if (camada.tipo === 'frase') {
        assert.ok(fontes.has(camada.fonte), `${modelo.id} usa letra fora da biblioteca: ${camada.fonte}`);
        assert.ok(ehFonteDaMarca(camada.fonte), `${modelo.id}: modelo pronto da casa usa letra fora da marca (${camada.fonte})`);
        assert.ok(cores.has(camada.cor), `${modelo.id} usa cor fora da paleta: ${camada.cor}`);
        assert.ok(String(camada.texto).length <= 40, `${modelo.id}: frase de exemplo maior que o campo`);
      }
      if (camada.tipo === 'foto') assert.ok(formasDeFoto.has(camada.forma), `${modelo.id}: formato de foto desconhecido ${camada.forma}`);
      if (camada.tipo === 'enfeite') assert.ok(enfeites.has(camada.forma) || ehIlustracao(camada.forma),
        `${modelo.id}: enfeite desconhecido ${camada.forma}`);
      if (camada.tipo === 'adesivo') assert.ok(poses.has(camada.arquivo), `${modelo.id}: pose do Pandinha fora do acervo (${camada.arquivo})`);
      if (camada.tipo === 'elemento') assert.ok(elementos.has(camada.arquivo), `${modelo.id}: elemento fora do acervo (${camada.arquivo})`);
    }
    // Quantos Pandinhas vão numa caneca deixou de ter limite em 23/09/2026 (manual 6.2, decisão do dono).
  }
  assert.ok(TEMPLATES.some((m) => m.camadas.filter((c) => c.tipo === 'foto').length >= 3), 'nenhum modelo aceita três ou mais fotos');
  // As ocasiões só da garrafa (`pecas`) têm a conta delas em pecas-unit.test.mjs.
  for (const categoria of CATEGORIAS.filter((c) => c.id !== 'livre' && (!c.pecas || c.pecas.includes('caneca')))) {
    assert.ok(modelosDaCategoria(categoria.id).length > 0, `a categoria ${categoria.id} ficou sem modelo`);
  }
});

test('nenhuma camada sai da área de impressão nem cobre outra', () => {
  for (const modelo of TEMPLATES) {
    const caixas = modelo.camadas.map((camada) => ({ camada, caixa: caixaDaCamada(camada, area, medidor) }));
    for (const { camada, caixa } of caixas) {
      assert.ok(dentro(caixa), `${modelo.id}: ${camada.rotulo || camada.tipo} sai da área de impressão`);
    }
    for (let i = 0; i < caixas.length; i += 1) {
      for (let j = i + 1; j < caixas.length; j += 1) {
        const a = caixas[i], b = caixas[j];
        // Enfeites soltos podem encostar de propósito; foto, frase e Pandinha, não.
        if (a.camada.tipo === 'enfeite' || b.camada.tipo === 'enfeite') continue;
        assert.ok(!cruza(a.caixa, b.caixa),
          `${modelo.id}: "${a.camada.rotulo || a.camada.texto}" e "${b.camada.rotulo || b.camada.texto}" se sobrepõem`);
      }
    }
  }
});

test('a frente e o verso da caneca caem onde o 3D os coloca', () => {
  const volta = Math.PI * spec.diameterMm;
  assert.ok(Math.abs(FRENTE - (0.25 * volta - area.x) / area.width) < 1e-9);
  assert.ok(Math.abs(VERSO - (0.75 * volta - area.x) / area.width) < 1e-9);
  const modelo = modeloPorId('namorados-coracoes');
  const caixa = caixaDaCamada(modelo.camadas[0], area, medidor);
  assert.ok(Math.abs(caixa.centroX - 0.25 * volta) < 0.01, 'a foto da frente não está no meio da frente da caneca');
});

test('editar uma arte não muda o modelo de onde ela saiu', () => {
  const modelo = modeloPorId('maes-flores');
  const arte = novaArte(modelo);
  arte.camadas[0].x = 0.9;
  arte.camadas.push({ id: 'novo', tipo: 'enfeite', forma: 'coracao', cor: '--peach', x: 0.5, y: 0.5, tamanho: 0.1, rotacao: 0 });
  arte.fundo = '--sand';
  const outra = novaArte(modelo);
  assert.equal(outra.camadas[0].x, modelo.camadas[0].x);
  assert.equal(outra.camadas.length, modelo.camadas.length);
  assert.equal(outra.fundo, modelo.fundo);
});

test('o clique encontra a camada de cima e não inventa uma onde não há nada', () => {
  const arte = novaArte(modeloPorId('namorados-coracoes'));
  const foto = arte.camadas[0];
  const centro = { x: area.x + foto.x * area.width, y: area.y + foto.y * area.height };
  assert.equal(camadaEm(arte, centro, area, medidor)?.id, foto.id);
  // Uma camada nova por cima, no mesmo lugar, passa a ser a escolhida.
  arte.camadas.push({ id: 'topo', tipo: 'enfeite', forma: 'coracao', cor: '--peach', x: foto.x, y: foto.y, tamanho: 0.2, rotacao: 0 });
  assert.equal(camadaEm(arte, centro, area, medidor)?.id, 'topo');
  const canto = { x: area.x + 0.5, y: area.y + 0.5 };
  assert.equal(camadaEm(arte, canto, area, medidor), null);
});

test('dpi de cada foto sai do tamanho do espaço; espaço vazio vira aviso', () => {
  const arte = novaArte(modeloPorId('namorados-coracoes'));
  const placement = computeArtePlacement(arte, {}, spec, { a: { image: {}, width: 1200, height: 1200 } }, medidor);
  const [frente, verso] = placement.slots;
  assert.equal(frente.preenchido, true);
  assert.equal(verso.preenchido, false);
  assert.deepEqual(placement.vazios, ['Foto do verso']);
  const escala = Math.max(frente.caixa.width / 1200, frente.caixa.height / 1200);
  assert.ok(Math.abs(frente.effectiveDpi - 25.4 / escala) < 1e-9);
  arte.camadas[0].ajuste.scale = 2;
  const ampliada = computeArtePlacement(arte, {}, spec, { a: { image: {}, width: 1200, height: 1200 } }, medidor);
  assert.ok(Math.abs(ampliada.slots[0].effectiveDpi - frente.effectiveDpi / 2) < 1e-9);
});

test('o mesmo modelo desenha sempre igual, e o Pandinha não cobre foto nem frase', () => {
  const imagemDoPanda = { width: 100, height: 100 };
  for (const modelo of TEMPLATES) {
    const imagens = Object.fromEntries(modelo.camadas.filter((c) => c.tipo === 'adesivo').map((c) => [c.arquivo, imagemDoPanda]));
    const primeiro = contextoFalso();
    const segundo = contextoFalso();
    desenhaArte(primeiro, novaArte(modelo), area, { imagens });
    desenhaArte(segundo, novaArte(modelo), area, { imagens });
    assert.deepEqual(primeiro.registro.textos, segundo.registro.textos, `${modelo.id}: as frases mudaram entre dois desenhos`);
    assert.equal(primeiro.registro.preenchimentos, segundo.registro.preenchimentos, `${modelo.id}: os enfeites mudaram entre dois desenhos`);
    for (const [, x, y, w, h] of primeiro.registro.imagens) {
      assert.ok(dentro({ x, y, width: w, height: h }), `${modelo.id}: o Pandinha sai da área de impressão`);
    }
  }
});

test('o Pandinha some da arte quando a pessoa desmarca, e as frases vazias não são desenhadas', () => {
  const modelo = modeloPorId('natal-flocos');
  const imagens = { 'assets/panda-coracao.webp': { width: 100, height: 100 } };
  const com = contextoFalso();
  desenhaArte(com, novaArte(modelo), area, { imagens });
  assert.equal(com.registro.imagens.length, 1);
  const sem = contextoFalso();
  desenhaArte(sem, novaArte(modelo), area, { imagens, semPandinha: true });
  assert.equal(sem.registro.imagens.length, 0);

  const arte = novaArte(modelo);
  for (const camada of arte.camadas) if (camada.tipo === 'frase') camada.texto = '   ';
  const vazio = contextoFalso();
  desenhaArte(vazio, arte, area, { imagens });
  assert.deepEqual(vazio.registro.textos, []);
});

test('o tamanho indicado para montar a arte fora do site é o da área de impressão em 300 dpi', () => {
  const medida = tamanhoRecomendado(spec);
  assert.equal(medida.larguraPx, 2480);
  assert.equal(medida.alturaPx, 1063);
  assert.equal(medida.dpi, 300);
  assert.equal(Math.round(medida.larguraCm), 21);
  assert.equal(Math.round(medida.alturaCm), 9);
});

test('as alças ficam nos cantos da camada e giram junto com ela', () => {
  const arte = novaArte(modeloPorId('fotos-quatro'));
  const camada = arte.camadas[0];
  const caixa = caixaDaCamada(camada, area, medidor);
  const reto = alcasDaCamada(camada, area, medidor);
  assert.equal(reto.cantos.length, 4);
  const noReto = reto.cantos.find((c) => c.id === 'no');
  assert.ok(Math.abs(noReto.x - (caixa.centroX - caixa.width / 2)) < 1e-9);
  assert.ok(Math.abs(noReto.y - (caixa.centroY - caixa.height / 2)) < 1e-9);
  // Girar não muda o tamanho: cada canto continua à mesma distância do centro.
  camada.rotacao = 90;
  const girada = alcasDaCamada(camada, area, medidor);
  const raio = (ponto) => Math.hypot(ponto.x - caixa.centroX, ponto.y - caixa.centroY);
  for (const canto of girada.cantos) {
    const antes = reto.cantos.find((c) => c.id === canto.id);
    assert.ok(Math.abs(raio(antes) - raio(canto)) < 1e-9, 'girar mudou o tamanho da camada');
  }
  assert.ok(Math.hypot(girada.cantos[0].x - noReto.x, girada.cantos[0].y - noReto.y) > 1, 'os cantos não acompanharam o giro');
  assert.ok(Math.abs(raio(reto.giro) - raio(girada.giro)) < 1e-9);
});

test('sem espaço em cima, o botão de girar passa para baixo da camada', () => {
  const noTopo = { id: 'x', tipo: 'enfeite', forma: 'coracao', cor: '--peach', x: 0.5, y: 0.02, tamanho: 0.05, rotacao: 0 };
  const alcasDoTopo = alcasDaCamada(noTopo, area, medidor);
  assert.equal(alcasDoTopo.giro.acima, false, 'o botão continuou em cima sem caber');
  assert.ok(alcasDoTopo.giro.y > caixaDaCamada(noTopo, area, medidor).centroY, 'o botão de girar não desceu');
  const noMeio = { ...noTopo, y: 0.5 };
  assert.equal(alcasDaCamada(noMeio, area, medidor).giro.acima, true);
  assert.ok(alcasDaCamada(noMeio, area, medidor).giro.y < caixaDaCamada(noMeio, area, medidor).centroY);
});

test('a biblioteca de letras tem variedade, peso próprio e arquivo nosso', () => {
  assert.ok(FONTES_DA_ARTE.length >= 12, 'a biblioteca ficou pequena demais');
  const valores = new Set();
  for (const fonte of FONTES_DA_ARTE) {
    assert.ok(!valores.has(fonte.valor), `letra repetida: ${fonte.valor}`);
    valores.add(fonte.valor);
    assert.ok(fonte.nome && fonte.valor, 'letra sem nome');
    assert.ok([400, 500, 600, 700, 800].includes(fonte.peso), `${fonte.valor} com peso estranho (${fonte.peso})`);
    assert.equal(pesoDaFonte(fonte.valor), fonte.peso);
    if (fonte.daMarca) assert.ok(!fonte.arquivo, `${fonte.valor} é da marca e já vem no site`);
    else assert.match(fonte.arquivo, /^assets\/fontes\/arte\/[a-z0-9-]+\.woff2$/, `${fonte.valor} não é servida do nosso endereço`);
  }
  // as três da marca continuam disponíveis para a arte
  for (const daMarca of ['Fredoka', 'Caveat', 'Nunito']) assert.ok(ehFonteDaMarca(daMarca));
  assert.equal(pesoDaFonte('Inexistente'), 600, 'letra desconhecida devia cair no peso padrão');
});

test('o seletor mostra os grupos na ordem decidida, e nenhum grupo entra sem lugar na fila', () => {
  const grupos = gruposDeCategorias().map(([nome]) => nome);
  // Todo grupo que existe precisa estar na ordem escrita à mão: grupo novo sem lugar cai no fim,
  // e é justamente isso que este teste não deixa passar despercebido.
  for (const nome of grupos) assert.ok(ORDEM_DOS_GRUPOS.includes(nome), `grupo "${nome}" fora de ORDEM_DOS_GRUPOS`);
  const esperado = ORDEM_DOS_GRUPOS.filter((nome) => grupos.includes(nome));
  assert.deepEqual(grupos, esperado, 'os grupos saíram fora da ordem combinada');
  // "Sem modelo" não é uma ocasião: ele é o cartão solto da lista, não uma linha do seletor.
  assert.ok(!gruposDeCategorias().some(([, itens]) => itens.some((c) => c.id === 'livre')));
  for (const [nome, itens] of gruposDeCategorias()) {
    assert.ok(itens.length, `grupo "${nome}" ficou vazio`);
    // Cada ocasião conta os modelos das peças dela (a caneca, quando não diz; as da garrafa, `pecas`).
    for (const categoria of itens) {
      assert.ok((categoria.pecas || ['caneca']).every((peca) => modelosDaCategoria(categoria.id, peca).length),
        `categoria "${categoria.id}" sem nenhum modelo`);
    }
  }
});
