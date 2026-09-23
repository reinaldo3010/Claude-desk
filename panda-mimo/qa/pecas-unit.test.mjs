import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PECAS, PECA_PADRAO, ESPECIFICACOES, ladosDaPeca, areaEmPalavras } from '../simulador/pecas.js';
import {
  FRENTE, VERSO, modelosDaCategoria, modeloPorId, TEMPLATES, CATEGORIAS, CORES_DE_ARTE, ENFEITES, ADESIVOS, FORMAS_DE_FOTO,
  caixaDaCamada, limiteDaImagem,
} from '../simulador/modelos.js';
import { printAreaOf, tamanhoRecomendado } from '../simulador/arte.js';
import { FONTES_DA_ARTE, ehFonteDaMarca } from '../simulador/fontes.js';
import { ehIlustracao } from '../simulador/colecoes.js';
import { MODELOS_DA_GARRAFA, CATEGORIAS_DA_GARRAFA } from '../simulador/garrafa-modelos.js';
import { MODELOS_DA_ECOBAG, CATEGORIAS_DA_ECOBAG } from '../simulador/ecobag-modelos.js';

/*
  As peças do estúdio (23/09/2026): a caneca de sempre e a garrafa, cada uma com a própria medida,
  cores, textos e modelos. O que este arquivo guarda:
  - a caneca não mudou um número ao virar "uma das peças" (frente, verso, área, 2480 × 1063 px);
  - toda peça cabe na própria volta e tem frente e verso dentro da arte;
  - peça nova não deixa texto da caneca para trás: cada lugar marcado na página tem o texto dela;
  - as bolinhas de cor de cada peça têm onde morar na página;
  - item novo nasce num tamanho de gente na peça (nem a foto miúda, nem o nome de 5 mm na garrafa).
*/

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pagina = fs.readFileSync(path.join(raiz, 'caneca-3d.html'), 'utf8');
const marcados = (atributo) => [...pagina.matchAll(new RegExp(`${atributo}="([^"]+)"`, 'g'))].map((m) => m[1]);

test('a caneca continua com as medidas de sempre, agora vindas das peças', () => {
  assert.equal(PECA_PADRAO, 'caneca');
  assert.deepEqual({ ...ESPECIFICACOES.caneca }, { diameterMm: 82, heightMm: 95, printWidthMm: 210, printHeightMm: 90 });
  // A mesma conta de antes, escrita à mão: a frente e o verso dos 199 modelos não andam.
  const volta = Math.PI * 82;
  assert.equal(FRENTE, (0.25 * volta - (volta - 210) / 2) / 210);
  assert.equal(VERSO, 1 - FRENTE);
  assert.deepEqual(PECAS.caneca.lados, { frente: FRENTE, verso: VERSO });
  const medida = tamanhoRecomendado(PECAS.caneca.spec);
  assert.equal(medida.larguraPx, 2480);
  assert.equal(medida.alturaPx, 1063);
  assert.equal(areaEmPalavras(PECAS.caneca.spec), 'área de 21 × 9 cm');
  assert.equal(modelosDaCategoria('todos').length, TEMPLATES.length);
  assert.equal(modelosDaCategoria('todos', 'caneca'), modelosDaCategoria('todos'));
});

test('toda peça cabe na própria volta, com frente e verso dentro da arte', () => {
  for (const peca of Object.values(PECAS)) {
    const { spec } = peca;
    // A peça plana (a ecobag) não dá a volta: a largura dela é a do painel.
    const volta = spec.plana ? spec.widthMm : Math.PI * spec.diameterMm;
    assert.ok(spec.printWidthMm <= volta, `${peca.id}: a arte é mais larga que a volta`);
    assert.ok(spec.printHeightMm <= spec.heightMm, `${peca.id}: a arte é mais alta que a faixa que a recebe`);
    const area = printAreaOf(spec);
    assert.ok(area.x >= 0 && area.y >= 0, `${peca.id}: a área sai da peça`);
    const lados = ladosDaPeca(spec);
    assert.deepEqual(peca.lados, lados);
    if (spec.plana) assert.deepEqual(lados, { frente: 0.5, verso: 0.5 }, `${peca.id}: a peça plana tem a frente no meio`);
    else assert.ok(lados.frente > 0.05 && lados.frente < 0.5 && lados.verso > 0.5 && lados.verso < 0.95, `${peca.id}: frente ${lados.frente}, verso ${lados.verso}`);
  }
  assert.deepEqual({ ...ESPECIFICACOES.garrafa }, { diameterMm: 80, heightMm: 200, printWidthMm: 230, printHeightMm: 180 });
  assert.equal(areaEmPalavras(PECAS.garrafa.spec), 'área de 23 × 18 cm');
  const medida = tamanhoRecomendado(PECAS.garrafa.spec);
  assert.equal(medida.larguraPx, 2717);
  assert.equal(medida.alturaPx, 2126);
});

test('peça nova não deixa texto da caneca para trás na página', () => {
  const textos = marcados('data-texto');
  const rotulos = marcados('data-rotulo');
  assert.ok(textos.length >= 14 && rotulos.length >= 5, `a página marcou poucos lugares (${textos.length} textos, ${rotulos.length} rótulos)`);
  for (const peca of Object.values(PECAS)) {
    if (peca.id === PECA_PADRAO) continue;
    for (const chave of [...textos, ...rotulos]) {
      const texto = peca.textos?.[chave];
      assert.ok(typeof texto === 'string' && texto.trim(), `${peca.id} não tem o texto "${chave}"`);
      assert.doesNotMatch(texto, /caneca|325 ml|interior/i, `${peca.id}.${chave} fala da caneca: "${texto}"`);
    }
    assert.match(peca.pedido({ corpo: 'creme' }, (c) => c).join(' '), new RegExp(peca.palavra, 'i'));
  }
});

test('as cores de cada peça têm lugar na página, e só a peça que as tem mostra', () => {
  for (const peca of Object.values(PECAS)) {
    for (const parte of peca.cores.partes) {
      const grupo = pagina.match(new RegExp(`<div class="studio-cores-peca__grupo"[^>]*data-peca="([^"]+)"[^>]*>(?:(?!</div>).)*id="${parte.alvo}"`, 's'));
      assert.ok(grupo, `${peca.id}: falta na página o lugar das bolinhas "${parte.alvo}"`);
      assert.ok(grupo[1].split(' ').includes(peca.id), `${peca.id}: as bolinhas "${parte.alvo}" não são marcadas como dela`);
      assert.ok(Object.keys(peca.cores.paleta).length >= 2, `${peca.id}: uma cor só não é escolha`);
      for (const cor of Object.keys(peca.cores.paleta)) assert.ok(peca.cores.nomes[cor], `${peca.id}: a cor ${cor} não tem nome para o pedido`);
    }
    for (const vista of ['front', 'back', 'handle', 'inside']) assert.ok(peca.vistas[vista], `${peca.id}: falta o nome da vista ${vista}`);
  }
  // As quatro cores das peças, do manual (7.4).
  assert.deepEqual(Object.keys(PECAS.garrafa.cores.paleta), ['creme', 'salvia', 'pessego', 'preta']);
});

test('item novo nasce num tamanho de gente em cada peça', () => {
  for (const peca of Object.values(PECAS)) {
    const area = printAreaOf(peca.spec);
    const foto = { largura: peca.novos.foto.largura * area.width, altura: peca.novos.foto.altura * area.height };
    assert.ok(foto.largura >= 40 && foto.largura <= 80 && foto.altura >= 40 && foto.altura <= 80, `${peca.id}: foto nova com ${foto.largura.toFixed(0)} × ${foto.altura.toFixed(0)} mm`);
    assert.ok(Math.abs(foto.largura / foto.altura - 1) < 0.2, `${peca.id}: foto nova esticada (${foto.largura.toFixed(0)} × ${foto.altura.toFixed(0)} mm)`);
    assert.ok(peca.novos.frase.tamanho >= 8 && peca.novos.frase.tamanho <= 24, `${peca.id}: frase nova com ${peca.novos.frase.tamanho} mm`);
    const pandinha = 0.18 * peca.novos.escala * area.height;
    assert.ok(pandinha >= 14 && pandinha <= 30, `${peca.id}: Pandinha novo com ${pandinha.toFixed(0)} mm`);
  }
});

/*
  Os modelos da garrafa e da ecobag (primeira leva, 23/09/2026): as mesmas regras dos da caneca, medidas
  na área de cada peça. A margem de segurança de 5 mm vale para foto, frase e Pandinha; o desenho solto
  pode ir até a borda, como na caneca.
*/
const LEVAS = [
  ['garrafa', MODELOS_DA_GARRAFA, CATEGORIAS_DA_GARRAFA],
  ['ecobag', MODELOS_DA_ECOBAG, CATEGORIAS_DA_ECOBAG],
];
// Mede o texto como o teste dos modelos da caneca: largura proporcional ao número de letras e ao corpo.
const medidor = (camada) => String(camada.texto || '').length * camada.tamanho * 0.52;
const MARGEM = 5;
const dentroDaMargem = (area, c, folga) => c.x >= area.x + folga - 0.01 && c.y >= area.y + folga - 0.01
  && c.x + c.width <= area.x + area.width - folga + 0.01 && c.y + c.height <= area.y + area.height - folga + 0.01;
const cruza = (a, b, folga = 0.5) => a.x + folga < b.x + b.width && a.x + a.width > b.x + folga
  && a.y + folga < b.y + b.height && a.y + a.height > b.y + folga;

test('a garrafa e a ecobag têm os próprios modelos, e cada ocasião delas tem quatro', () => {
  for (const [peca, modelos, categorias] of LEVAS) {
    const daPeca = modelosDaCategoria('todos', peca);
    assert.equal(daPeca.length, modelos.length);
    assert.ok(daPeca.length >= 8, `${peca}: a primeira leva tem ${daPeca.length} modelos`);
    for (const modelo of daPeca) {
      assert.ok(modelo.id.startsWith(`${peca}-`) && modelo.peca === peca, `${modelo.id} não se diz da ${peca}`);
      assert.equal(modeloPorId(modelo.id), modelo);
      assert.ok(!TEMPLATES.includes(modelo), `${modelo.id} entrou no catálogo da caneca`);
    }
    const ocasioes = CATEGORIAS.filter((c) => c.pecas?.includes(peca));
    assert.deepEqual(ocasioes.map((c) => c.id), categorias.map((c) => c.id));
    for (const ocasiao of ocasioes) {
      assert.ok(modelosDaCategoria(ocasiao.id, peca).length >= 4, `a ocasião ${ocasiao.id} da ${peca} tem menos de quatro artes`);
      assert.equal(modelosDaCategoria(ocasiao.id, 'caneca').length, 0, `a ocasião ${ocasiao.id} aparece na caneca`);
    }
  }
  // O catálogo da caneca é o de antes: nenhum modelo de outra peça entrou nele.
  for (const modelo of TEMPLATES) assert.ok(!/^(garrafa|ecobag)-/.test(modelo.id), `${modelo.id} na caneca`);
});

test('os modelos da garrafa e da ecobag usam só letra da marca, cor da paleta e acervo da casa', () => {
  const fontes = new Set(FONTES_DA_ARTE.map((f) => f.valor));
  const cores = new Set([...CORES_DE_ARTE.map((c) => c.token), '--tinta-da-peca', '--acento-da-peca']);
  const formas = new Set(ENFEITES.map((e) => e.forma));
  const poses = new Set(ADESIVOS.map((a) => a.arquivo));
  const fotos = new Set(FORMAS_DE_FOTO.map((f) => f.valor));
  for (const [, modelos] of LEVAS) {
    for (const modelo of modelos) {
      assert.ok(modelo.nome && modelo.descricao, `${modelo.id} sem nome ou descrição`);
      assert.equal(modelo.fundo, null, `${modelo.id} pinta um fundo: a arte vai sobre a cor da peça`);
      assert.equal(new Set(modelo.camadas.map((c) => c.id)).size, modelo.camadas.length, `${modelo.id} tem camadas com o mesmo id`);
      for (const camada of modelo.camadas) {
        assert.ok(!camada.rotacao, `${modelo.id}: "${camada.rotulo}" girado; os modelos da casa não giram frase nem desenho`);
        if (camada.tipo === 'frase') {
          assert.ok(fontes.has(camada.fonte) && ehFonteDaMarca(camada.fonte), `${modelo.id}: letra fora da marca (${camada.fonte})`);
          assert.ok(cores.has(camada.cor), `${modelo.id}: cor fora da paleta (${camada.cor})`);
          assert.ok(String(camada.texto).length <= 40, `${modelo.id}: frase de exemplo maior que o campo`);
        }
        if (camada.tipo === 'enfeite') assert.ok(formas.has(camada.forma) || ehIlustracao(camada.forma), `${modelo.id}: enfeite desconhecido ${camada.forma}`);
        if (camada.tipo === 'adesivo') assert.ok(poses.has(camada.arquivo), `${modelo.id}: pose fora do acervo (${camada.arquivo})`);
        if (camada.tipo === 'foto') assert.ok(fotos.has(camada.forma), `${modelo.id}: formato de foto desconhecido`);
        assert.ok(/^[A-ZÁÂÃÉÊÍÓÔÕÚÇ]/.test(camada.rotulo || ''), `${modelo.id}: a camada "${camada.rotulo}" não tem nome de gente`);
      }
    }
  }
});

test('nos modelos da garrafa e da ecobag nada sai da margem e foto, frase e Pandinha não se cobrem', () => {
  for (const [peca, modelos] of LEVAS) {
    const area = printAreaOf(PECAS[peca].spec);
    for (const modelo of modelos) {
      const caixas = modelo.camadas.map((camada) => ({ camada, caixa: caixaDaCamada(camada, area, medidor) }));
      for (const { camada, caixa } of caixas) {
        const folga = camada.tipo === 'enfeite' ? 0 : MARGEM;
        assert.ok(dentroDaMargem(area, caixa, folga), `${modelo.id}: "${camada.rotulo}" sai da ${folga ? 'margem de segurança' : 'área'}`);
        if (camada.tipo === 'foto' && camada.forma === 'circulo') {
          assert.ok(Math.abs(caixa.width - caixa.height) < 0.5, `${modelo.id}: a foto redonda saiu oval (${caixa.width.toFixed(1)} × ${caixa.height.toFixed(1)} mm)`);
        }
        if (camada.tipo === 'adesivo') {
          const [, teto] = limiteDaImagem(camada.arquivo, [0.06, 0.6], area.height);
          assert.ok(camada.tamanho <= teto + 1e-9, `${modelo.id}: o Pandinha passa do limite de 300 dpi (${camada.tamanho.toFixed(3)} > ${teto})`);
        }
      }
      for (let i = 0; i < caixas.length; i += 1) {
        for (let j = i + 1; j < caixas.length; j += 1) {
          const a = caixas[i], b = caixas[j];
          if (a.camada.tipo === 'enfeite' || b.camada.tipo === 'enfeite') continue;
          assert.ok(!cruza(a.caixa, b.caixa), `${modelo.id}: "${a.camada.rotulo}" e "${b.camada.rotulo}" se sobrepõem`);
        }
      }
      // Cada arte tem o que olhar de frente: alguma coisa perto da frente da peça, que é o que se vê.
      assert.ok(modelo.camadas.some((c) => Math.abs(c.x - PECAS[peca].lados.frente) < 0.03), `${modelo.id}: nada na frente da ${peca}`);
    }
  }
});

test('as artes de uma ocasião da garrafa ou da ecobag não repetem a planta', () => {
  for (const [peca, , categorias] of LEVAS) {
    for (const ocasiao of categorias) {
      const plantas = new Map();
      for (const modelo of modelosDaCategoria(ocasiao.id, peca)) {
        const planta = modelo.camadas.map((c) => `${c.tipo}${c.forma ? `:${c.forma}` : ''}@${c.x.toFixed(2)},${c.y.toFixed(2)}`).join('|');
        assert.ok(!plantas.has(planta), `${ocasiao.id}: "${modelo.id}" repete a planta de "${plantas.get(planta)}"`);
        plantas.set(planta, modelo.id);
      }
    }
  }
});
