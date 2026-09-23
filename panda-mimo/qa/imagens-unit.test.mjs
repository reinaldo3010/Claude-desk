/*
  O que este arquivo protege: as imagens do acervo que entram na arte do cliente — as poses do
  Pandinha, os elementos da marca e as aquarelas.

  O estúdio sabe o tamanho de cada imagem antes de ela chegar, por uma tabela gerada
  (`simulador/imagens-do-acervo.js`, feita por `marca/kit/prepara-imagens-do-estudio.py`). É com
  ela que a caixa da camada segue a proporção do desenho e que o limite de tamanho segura os
  300 dpi. Tabela velha é pior que tabela nenhuma: a caixa mentiria calada. Daí as regras:

  1. a tabela bate com os arquivos, e toda imagem que o estúdio usa está nela;
  2. no maior tamanho que o controle permite, a impressão não cai abaixo de 300 dpi, nem passa da
     margem de segurança — a seção 9.1 do manual só aceita imagem na arte com essa garantia;
  3. o Pandinha, no maior tamanho, ocupa no máximo um terço da área (manual 6.4);
  4. a caixa segue a proporção da imagem, e o desenho não depende da caixa — por isso trocar a
     caixa quadrada pela certa não mudou um pixel das 138 artes que já existiam.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { IMAGENS_DO_ACERVO } from '../simulador/imagens-do-acervo.js';
import {
  ADESIVOS, ELEMENTOS, TEMPLATES, caixaDaCamada, desenhaArte, limiteDaImagem, proporcaoDaImagem,
} from '../simulador/modelos.js';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const area = { x: 0, y: 0, width: 210, height: 90 };
const TETO = { adesivo: [0.06, 0.6], elemento: [0.06, 1.4] };  // os mesmos do estudio.js

/** Largura e altura de um WebP, lidas do cabeçalho (VP8X, VP8L ou VP8). */
function medidaDoWebp(arquivo) {
  const b = readFileSync(join(raiz, arquivo));
  assert.equal(b.toString('ascii', 0, 4), 'RIFF', `${arquivo} não é WebP`);
  const tipo = b.toString('ascii', 12, 16);
  if (tipo === 'VP8X') return { largura: 1 + b.readUIntLE(24, 3), altura: 1 + b.readUIntLE(27, 3) };
  if (tipo === 'VP8L') {
    const bits = b.readUInt32LE(21);
    return { largura: 1 + (bits & 0x3fff), altura: 1 + ((bits >> 14) & 0x3fff) };
  }
  if (tipo === 'VP8 ') return { largura: b.readUInt16LE(26) & 0x3fff, altura: b.readUInt16LE(28) & 0x3fff };
  throw new Error(`${arquivo}: WebP de tipo desconhecido (${tipo})`);
}

const usadas = () => {
  const arquivos = new Set([...ADESIVOS, ...ELEMENTOS].map((i) => i.arquivo));
  for (const modelo of TEMPLATES) for (const c of modelo.camadas) if (c.arquivo) arquivos.add(c.arquivo);
  return arquivos;
};

test('a tabela das imagens bate com os arquivos, e toda imagem usada está nela', () => {
  for (const [arquivo, info] of Object.entries(IMAGENS_DO_ACERVO)) {
    assert.ok(existsSync(join(raiz, arquivo)), `${arquivo} está na tabela e não existe`);
    assert.deepEqual(medidaDoWebp(arquivo), { largura: info.largura, altura: info.altura },
      `${arquivo}: a tabela diz ${info.largura} × ${info.altura}; rode marca/kit/prepara-imagens-do-estudio.py`);
    if (info.mini) {
      const mini = medidaDoWebp(info.mini);
      assert.ok(Math.max(mini.largura, mini.altura) <= 320, `${info.mini} passou de 320 px: a lista ficaria pesada`);
      const erro = Math.abs(mini.altura / mini.largura - info.altura / info.largura) / (info.altura / info.largura);
      assert.ok(erro < 0.02, `${info.mini} não tem a proporção da imagem inteira: a miniatura sairia torta`);
    }
  }
  const faltam = [...usadas()].filter((arquivo) => !IMAGENS_DO_ACERVO[arquivo]);
  assert.deepEqual(faltam, [], `imagens usadas pelo estúdio fora da tabela: ${faltam.join(', ')}`);
});

test('no maior tamanho que o controle permite, a imagem imprime a 300 dpi ou mais e cabe na margem', () => {
  const itens = [...ADESIVOS.map((a) => ['adesivo', a]), ...ELEMENTOS.map((e) => ['elemento', e])];
  for (const [tipo, { arquivo, nome }] of itens) {
    const [, maximo] = limiteDaImagem(arquivo, TETO[tipo]);
    const larguraMm = maximo * 90;
    const dpi = IMAGENS_DO_ACERVO[arquivo].largura / (larguraMm / 25.4);
    // 294 = 300 com a tolerância de 2% do modelos.js (a sublimação não distingue as duas).
    assert.ok(dpi >= 293.9, `${nome}: no tamanho máximo sai com ${dpi.toFixed(0)} dpi`);
    assert.ok(larguraMm * proporcaoDaImagem(arquivo) <= 80.01, `${nome}: no tamanho máximo passa da margem de 5 mm`);
  }
  // Um defeito de prova embutido: uma imagem pequena demais tem de sair com teto apertado.
  const [, apertado] = limiteDaImagem('assets/pata-rosa.webp', TETO.elemento);
  assert.ok(apertado < 0.25, `a patinha rosa (212 px) devia ter teto baixo, e ficou com ${apertado}`);
});

test('o Pandinha no maior tamanho ocupa no máximo um terço da área (manual 6.4)', () => {
  for (const { arquivo, nome } of ADESIVOS) {
    const [, maximo] = limiteDaImagem(arquivo, TETO.adesivo);
    const largura = maximo * 90, altura = largura * proporcaoDaImagem(arquivo);
    assert.ok(largura * altura <= (210 * 90) / 3, `${nome}: ${Math.round(largura * altura)} mm² passa de um terço da área`);
  }
});

test('a caixa segue a proporção da imagem, e o desenho não depende da caixa', () => {
  for (const arquivo of usadas()) {
    const camada = { id: 'x', tipo: arquivo.includes('/panda-') ? 'adesivo' : 'elemento', arquivo, x: 0.5, y: 0.5, tamanho: 0.4, rotacao: 0 };
    const caixa = caixaDaCamada(camada, area);
    assert.ok(Math.abs(caixa.height / caixa.width - proporcaoDaImagem(arquivo)) < 1e-9, `${arquivo}: a caixa não segue a imagem`);
    // O desenho: largura da camada e centro no ponto dela, altura pela proporção da própria imagem.
    const { largura, altura } = IMAGENS_DO_ACERVO[arquivo];
    const desenhos = [];
    const ctx = {
      save() {}, restore() {}, translate(x, y) { this.t = [x, y]; }, rotate() {}, fillRect() {}, beginPath() {}, arc() {}, fill() {},
      set fillStyle(v) {}, drawImage(img, x, y, w, h) { desenhos.push([this.t[0] + x + w / 2, this.t[1] + y + h / 2, w, h]); },
    };
    const imagem = { naturalWidth: largura, naturalHeight: altura };
    desenhaArte(ctx, { fundo: '--white', semente: 1, enfeites: null, camadas: [camada] }, area, { imagens: { [arquivo]: imagem } });
    assert.equal(desenhos.length, 1, `${arquivo}: a imagem não foi desenhada`);
    const [cx, cy, w, h] = desenhos[0];
    assert.ok(Math.abs(cx - 105) < 1e-9 && Math.abs(cy - 45) < 1e-9, `${arquivo}: saiu do centro da camada`);
    assert.ok(Math.abs(w - 36) < 1e-9 && Math.abs(h - 36 * altura / largura) < 1e-9, `${arquivo}: desenhada fora da largura da camada`);
  }
});
