/*
  O que este arquivo protege: o vocabulário de desenho das coleções (`simulador/desenho.js`) e a
  coleção de pets, a primeira escrita à mão nesse vocabulário.

  As regras vêm da seção 9.1 do manual: desenho por curvas, cor só por token, uma tinta principal,
  e caixa que acompanha o desenho de verdade — senão a alça de redimensionar mente na mão da pessoa.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { desenhaIlustracao, limitesDaIlustracao, ilustracao } from '../simulador/desenho.js';
import { ILUSTRACOES_PETS, MODELOS_PETS, CATEGORIAS_PETS } from '../simulador/pets.js';
import { ILUSTRACOES, proporcaoDaForma, ehIlustracao, TAMANHO_DA_ILUSTRACAO } from '../simulador/colecoes.js';
import { PALETA } from '../simulador/paleta.js';
import { TEMPLATES, caixaDaCamada, novaArte, camadaEm } from '../simulador/modelos.js';

const area = { x: 0, y: 0, width: 210, height: 90 };

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
  assert.deepEqual(tipos.filter((t) => t === 'lineTo').length, 3);
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

test('o arquivo da coleção de pets não guarda cor solta em lugar nenhum', async () => {
  const fonte = await readFile(new URL('../simulador/pets.js', import.meta.url), 'utf8');
  const soltas = [...new Set(fonte.match(/#[0-9A-Fa-f]{3,8}\b/g) || [])];
  assert.deepEqual(soltas, [], `cor solta em pets.js: ${soltas.join(', ')}`);
});

test('a coleção de pets tem quatro assuntos com quatro artes cada, todas no catálogo', () => {
  assert.equal(CATEGORIAS_PETS.length, 4);
  assert.equal(MODELOS_PETS.length, 16);
  const ids = new Set(TEMPLATES.map((m) => m.id));
  for (const categoria of CATEGORIAS_PETS) {
    assert.equal(categoria.grupo, 'Pets e bichinhos');
    assert.equal(MODELOS_PETS.filter((m) => m.categoria === categoria.id).length, 4, `${categoria.id} não tem quatro artes`);
  }
  for (const modelo of MODELOS_PETS) {
    assert.ok(ids.has(modelo.id), `${modelo.id} não chegou ao catálogo`);
    assert.ok(modelo.camadas.some((c) => c.tipo === 'foto'), `${modelo.id} sem espaço de foto`);
    assert.ok(modelo.camadas.some((c) => c.tipo === 'frase'), `${modelo.id} sem frase`);
    assert.ok(modelo.camadas.filter((c) => c.tipo === 'enfeite').length >= 2, `${modelo.id} com menos de duas ilustrações`);
  }
});

test('as artes da coleção não repetem a mesma planta: mudam foto, formato e lugar do texto', () => {
  // Foi a crítica que originou a coleção: variar a frase e chamar de modelo novo não é variedade.
  const plantas = new Set();
  for (const modelo of MODELOS_PETS) {
    const fotos = modelo.camadas.filter((c) => c.tipo === 'foto');
    const frases = modelo.camadas.filter((c) => c.tipo === 'frase');
    plantas.add([fotos.length, fotos.map((f) => `${f.forma}@${f.x}`).join('+'), frases.map((f) => f.x).join('+')].join('|'));
  }
  assert.equal(plantas.size, MODELOS_PETS.length, 'duas artes da coleção têm exatamente a mesma planta');
  const formas = new Set(MODELOS_PETS.flatMap((m) => m.camadas.filter((c) => c.tipo === 'foto').map((c) => c.forma)));
  assert.ok(formas.size >= 3, `a coleção só usa ${formas.size} formato(s) de foto`);
  const quantidades = new Set(MODELOS_PETS.map((m) => m.camadas.filter((c) => c.tipo === 'foto').length));
  assert.ok(quantidades.size >= 3, 'todas as artes têm a mesma quantidade de fotos');
});

test('cada ilustração da coleção pode ser escolhida no clique e cresce mais que um enfeite', () => {
  for (const modelo of MODELOS_PETS) {
    const arte = novaArte(modelo);
    for (const camada of arte.camadas.filter((c) => c.tipo === 'enfeite')) {
      const caixa = caixaDaCamada(camada, area);
      const soEla = { ...arte, camadas: [camada] };
      assert.equal(camadaEm(soEla, { x: caixa.centroX, y: caixa.centroY }, area)?.id, camada.id,
        `${modelo.id}: o clique no meio de "${camada.rotulo}" não acha a camada`);
      assert.ok(camada.tamanho <= TAMANHO_DA_ILUSTRACAO[1] && camada.tamanho >= TAMANHO_DA_ILUSTRACAO[0],
        `${modelo.id}: "${camada.rotulo}" nasce fora do limite de tamanho`);
    }
  }
});

test('nenhuma ilustração da coleção carrega imagem: tudo é curva, na resolução que for', () => {
  for (const [nome, desenho] of Object.entries(ILUSTRACOES)) {
    for (const tamanho of [8, 40, 300]) {
      const ctx = contexto();
      desenhaIlustracao(ctx, desenho, tamanho, '--sage');
      assert.ok(ctx.chamadas.some((c) => c[0] === 'fill' || c[0] === 'stroke'), `${nome} não pintou nada em ${tamanho} mm`);
    }
  }
});
