/*
  O que este arquivo protege: o vocabulário de desenho das coleções (`simulador/desenho.js`) e as
  coleções escritas à mão nesse vocabulário.

  As regras vêm da seção 9.1 do manual: desenho por curvas, cor só por token, uma tinta principal,
  caixa que acompanha o desenho de verdade — senão a alça de redimensionar mente na mão da pessoa —
  e composição que muda de arte para arte, porque variar a frase não é variar a arte.

  Coleção nova entra na lista `COLECOES` aqui embaixo e passa a valer para todas as regras.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { desenhaIlustracao, limitesDaIlustracao, ilustracao } from '../simulador/desenho.js';
import { MODELOS_PETS, CATEGORIAS_PETS } from '../simulador/pets.js';
import { MODELOS_DATAS } from '../simulador/datas.js';
import { ILUSTRACOES, proporcaoDaForma, ehIlustracao, TAMANHO_DA_ILUSTRACAO } from '../simulador/colecoes.js';
import { PALETA } from '../simulador/paleta.js';
import { TEMPLATES, CATEGORIAS, modelosDaCategoria, caixaDaCamada, novaArte, camadaEm } from '../simulador/modelos.js';

const area = { x: 0, y: 0, width: 210, height: 90 };

/* As coleções escritas à mão. Coleção nova entra aqui. */
const COLECOES = [
  { nome: 'Pets e bichinhos', modelos: MODELOS_PETS, arquivo: 'pets.js' },
  { nome: 'Datas comemorativas', modelos: MODELOS_DATAS, arquivo: 'datas.js' },
];

/** Um contexto de mentira que anota o que foi pedido, sem desenhar nada de verdade. */
function contexto() {
  const chamadas = [];
  const anota = (nome) => (...args) => chamadas.push([nome, ...args]);
  return {
    chamadas,
    save: anota('save'), restore: anota('restore'), translate: anota('translate'),
    beginPath: anota('beginPath'), closePath: anota('closePath'), moveTo: anota('moveTo'),
    lineTo: anota('lineTo'), bezierCurveTo: anota('bezierCurveTo'), quadraticCurveTo: anota('quadraticCurveTo'),
    arc: anota('arc'), ellipse: anota('ellipse'), rect: anota('rect'), roundRect: anota('roundRect'),
    fill: anota('fill'), stroke: anota('stroke'),
    drawImage: () => assert.fail('ilustração de coleção não pode carregar imagem'),
  };
}

test('o vocabulário de desenho lê os caminhos e recusa o que não sabe ler', () => {
  const ctx = contexto();
  const quadrado = ilustracao({ primary: '--ink', partes: [{ d: 'M -10 -10 L 10 -10 L 10 10 L -10 10 Z', fill: '--ink' }] });
  assert.equal(quadrado.largura, 20);
  assert.equal(quadrado.altura, 20);
  desenhaIlustracao(ctx, quadrado, 40, '--peach');
  const tipos = ctx.chamadas.map((c) => c[0]);
  assert.equal(tipos.filter((t) => t === 'lineTo').length, 3);
  assert.ok(tipos.includes('closePath'));

  // comando relativo do SVG desenharia outra coisa calada: melhor quebrar alto
  assert.throws(() => ilustracao({ primary: '--ink', partes: [{ d: 'M 0 0 l 5 5' }] }), /relativo/);
  assert.throws(() => desenhaIlustracao(contexto(), { largura: 1, altura: 1, primary: '--ink', partes: [{ fill: '--ink' }] }, 1, '--ink'), /sem forma/);
  assert.throws(() => ilustracao({ primary: '--ink', partes: [] }), /sem desenho/);
});

test('a curva entra na medida: a caixa não para nos pontos de controle', () => {
  // A curva não alcança os pontos de controle. Medir por eles daria uma caixa maior que o desenho.
  const barriga = ilustracao({ primary: '--ink', partes: [{ d: 'M -10 0 C -10 -40 10 -40 10 0', stroke: '--ink', w: 0 }] });
  assert.ok(barriga.altura < 32, `a curva mediu ${barriga.altura}, como se fosse até o ponto de controle`);
  assert.ok(barriga.altura > 25, `a curva mediu ${barriga.altura}, raso demais para a barriga que ela tem`);
});

test('cada ilustração se mede e se centra sozinha, e a caixa de seleção acompanha', () => {
  for (const [nome, desenho] of Object.entries(ILUSTRACOES)) {
    const limites = limitesDaIlustracao(desenho);
    assert.ok(desenho.largura > 0 && desenho.altura > 0, `${nome} sem tamanho`);
    assert.ok(Math.abs(limites.largura - desenho.largura) < 0.02, `${nome}: largura declarada não bate com o desenho`);
    assert.ok(Math.abs(limites.altura - desenho.altura) < 0.02, `${nome}: altura declarada não bate com o desenho`);
    // depois do deslocamento, o desenho fica em volta da origem
    assert.ok(Math.abs(limites.centroX + desenho.deslocaX) < 0.02, `${nome} não ficou centrado na horizontal`);
    assert.ok(Math.abs(limites.centroY + desenho.deslocaY) < 0.02, `${nome} não ficou centrado na vertical`);
    // e a caixa da camada usa essa mesma proporção
    const camada = { tipo: 'enfeite', forma: nome, x: 0.5, y: 0.5, tamanho: 0.4, rotacao: 0 };
    const caixa = caixaDaCamada(camada, area);
    assert.ok(Math.abs(caixa.height / caixa.width - desenho.altura / desenho.largura) < 1e-9, `${nome}: a caixa não acompanha a proporção`);
    assert.equal(proporcaoDaForma(nome), desenho.altura / desenho.largura);
    assert.equal(ehIlustracao(nome), true);
  }
  assert.equal(ehIlustracao('coracao'), false, 'enfeite simples não é ilustração de coleção');
  assert.equal(proporcaoDaForma('nao-existe'), null);
});

test('as ilustrações pintam só com token da paleta, e a tinta escolhida entra no lugar da principal', () => {
  const tokens = new Set(Object.keys(PALETA));
  for (const [nome, desenho] of Object.entries(ILUSTRACOES)) {
    assert.ok(tokens.has(desenho.primary), `${nome}: cor principal "${desenho.primary}" não é token`);
    let usaAPrincipal = false;
    for (const parte of desenho.partes) {
      for (const valor of [parte.fill, parte.stroke]) {
        if (!valor) continue;
        assert.ok(tokens.has(valor), `${nome}: cor solta "${valor}" — use um token da paleta`);
        if (valor === desenho.primary) usaAPrincipal = true;
      }
    }
    assert.ok(usaAPrincipal, `${nome}: nenhuma parte usa a cor principal, então trocar a cor não faria nada`);
  }
});

test('nenhum arquivo de coleção guarda cor solta', async () => {
  for (const { arquivo } of COLECOES) {
    const fonte = await readFile(new URL(`../simulador/${arquivo}`, import.meta.url), 'utf8');
    const soltas = [...new Set(fonte.match(/#[0-9A-Fa-f]{3,8}\b/g) || [])];
    assert.deepEqual(soltas, [], `cor solta em ${arquivo}: ${soltas.join(', ')}`);
  }
});

test('cada assunto do seletor tem pelo menos quatro artes, para a pessoa ter de onde escolher', () => {
  const ids = new Set(TEMPLATES.map((m) => m.id));
  for (const { modelos } of COLECOES) {
    for (const modelo of modelos) assert.ok(ids.has(modelo.id), `${modelo.id} não chegou ao catálogo`);
  }
  assert.equal(CATEGORIAS_PETS.length, 4);
  // Um assunto com uma arte só era o que deixava o grupo das datas fraco. Quatro virou o mínimo.
  // "Sem modelo", "Só fotos" e "Várias fotos do pet" são atalhos, não assunto: ficam de fora.
  // Os que ainda não chegaram lá ficam nesta lista, à vista. A lista é uma catraca: encheu um
  // assunto, tira daqui; assunto novo magro entra reprovando, que é o que a gente quer.
  const AINDA_MAGROS = ['aniversario', 'casamento', 'bebe', 'amizade'];
  const magros = CATEGORIAS
    .filter((c) => !['livre', 'fotos', 'pet'].includes(c.id))
    .filter((c) => modelosDaCategoria(c.id).length < 4)
    .map((c) => c.id);
  const novosMagros = magros.filter((id) => !AINDA_MAGROS.includes(id));
  assert.deepEqual(novosMagros, [], `assunto novo com menos de quatro artes: ${novosMagros.join(', ')}`);
  const jaCheios = AINDA_MAGROS.filter((id) => !magros.includes(id));
  assert.deepEqual(jaCheios, [], `estes assuntos já têm quatro artes; tire da lista AINDA_MAGROS: ${jaCheios.join(', ')}`);
});

test('as artes de uma coleção não repetem a mesma planta: mudam foto, formato e lugar do texto', () => {
  // Foi a crítica que originou as coleções: variar a frase e chamar de modelo novo não é variedade.
  for (const { nome, modelos } of COLECOES) {
    const plantas = new Map();
    for (const modelo of modelos) {
      const fotos = modelo.camadas.filter((c) => c.tipo === 'foto');
      const frases = modelo.camadas.filter((c) => c.tipo === 'frase');
      const planta = [fotos.length, fotos.map((f) => `${f.forma}@${f.x}`).join('+'), frases.map((f) => f.x).join('+')].join('|');
      const gemeo = plantas.get(planta);
      assert.ok(!gemeo, `${nome}: "${modelo.id}" tem a mesma planta de "${gemeo}"`);
      plantas.set(planta, modelo.id);
    }
    const formas = new Set(modelos.flatMap((m) => m.camadas.filter((c) => c.tipo === 'foto').map((c) => c.forma)));
    assert.ok(formas.size >= 3, `${nome}: a coleção só usa ${formas.size} formato(s) de foto`);
    const quantidades = new Set(modelos.map((m) => m.camadas.filter((c) => c.tipo === 'foto').length));
    assert.ok(quantidades.size >= 2, `${nome}: todas as artes têm a mesma quantidade de fotos`);
  }
});

test('toda arte de coleção tem foto, frase e pelo menos duas ilustrações', () => {
  for (const { nome, modelos } of COLECOES) {
    for (const modelo of modelos) {
      assert.ok(modelo.camadas.some((c) => c.tipo === 'foto'), `${nome}/${modelo.id} sem espaço de foto`);
      assert.ok(modelo.camadas.some((c) => c.tipo === 'frase'), `${nome}/${modelo.id} sem frase`);
      assert.ok(modelo.camadas.filter((c) => c.tipo === 'enfeite').length >= 2, `${nome}/${modelo.id} com menos de duas ilustrações`);
    }
  }
});

test('cada ilustração de coleção pode ser escolhida no clique e cresce mais que um enfeite', () => {
  for (const { nome, modelos } of COLECOES) {
    for (const modelo of modelos) {
      const arte = novaArte(modelo);
      for (const camada of arte.camadas.filter((c) => c.tipo === 'enfeite')) {
        const caixa = caixaDaCamada(camada, area);
        const soEla = { ...arte, camadas: [camada] };
        assert.equal(camadaEm(soEla, { x: caixa.centroX, y: caixa.centroY }, area)?.id, camada.id,
          `${nome}/${modelo.id}: o clique no meio de "${camada.rotulo}" não acha a camada`);
        assert.ok(camada.tamanho <= TAMANHO_DA_ILUSTRACAO[1] && camada.tamanho >= TAMANHO_DA_ILUSTRACAO[0],
          `${nome}/${modelo.id}: "${camada.rotulo}" nasce fora do limite de tamanho`);
      }
    }
  }
});

test('nenhuma ilustração de coleção carrega imagem: tudo é curva, na resolução que for', () => {
  for (const [nome, desenho] of Object.entries(ILUSTRACOES)) {
    for (const tamanho of [8, 40, 300]) {
      const ctx = contexto();
      desenhaIlustracao(ctx, desenho, tamanho, '--sage');
      assert.ok(ctx.chamadas.some((c) => c[0] === 'fill' || c[0] === 'stroke'), `${nome} não pintou nada em ${tamanho} mm`);
    }
  }
});
