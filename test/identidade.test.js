"use strict";
/**
 * Testes da identidade visual.
 *
 * A promessa que estes testes protegem: a laranja do Claude é o único acento
 * da interface, e o ícone do atalho no tablet é a mesma forma que o painel
 * desenha. Nenhum dos dois é verificável rodando o navegador aqui — mas os
 * dois são verificáveis lendo os arquivos, e é isso que basta para pegar a
 * regressão que interessa: alguém mexe num lado e esquece o outro.
 */

const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const raiz = path.join(__dirname, "..");
const ler = (p) => fs.readFileSync(path.join(raiz, p), "utf8");

const css = ler("public/deck.css");
const js = ler("public/deck.js");
const icone = ler("public/icon.svg");

/* ── paleta ─────────────────────────────────────────────────────────────── */

test("a paleta antiga, azul e fria, não voltou", () => {
  // Os valores exatos que o painel usava antes da identidade do Claude. Eles
  // estavam espalhados por dezenas de regras; um `sed` incompleto os traz de
  // volta em silêncio, e o painel volta a parecer dashboard genérico.
  const proibidos = [
    "#05070C", "#0A0F18", "#EAF0F7", "#7E8CA0", "#4A5568",
    "#34D8A0", "#F2B544", "#FF5C48", "#6AA6FF", "#0C1524", "#0A111D",
    "106,166,255", "52,216,160", "242,181,68", "255,92,72",
  ];
  for (const cor of proibidos) {
    assert.ok(!css.includes(cor), `cor da paleta antiga em deck.css: ${cor}`);
    assert.ok(!js.includes(cor), `cor da paleta antiga em deck.js: ${cor}`);
  }
});

test("a laranja do Claude é o acento, e o alerta se separa dela pela saturação", () => {
  assert.match(css, /--claude:\s*#D97757/i);
  assert.match(css, /--accent:\s*var\(--claude\)/);

  // Matiz vizinho a três metros vira matiz igual: a laranja da marca (~16°) e
  // o alerta (~3°) são quase o mesmo tom. O que os separa é a saturação, e a
  // comparação certa é relativa — vale enquanto os dois se afastarem, não
  // enquanto um bater num número absoluto.
  const sat = (hex) => {
    const [r, g, b] = hex.match(/#(..)(..)(..)/).slice(1).map((x) => parseInt(x, 16));
    const max = Math.max(r, g, b);
    return max === 0 ? 0 : (max - Math.min(r, g, b)) / max;
  };
  const token = (nome) => {
    const m = css.match(new RegExp(`--${nome}:\\s*(#[0-9A-F]{6})`, "i"));
    assert.ok(m, `--${nome} precisa ser um hex literal`);
    return m[1];
  };
  const gap = sat(token("stop")) - sat(token("claude"));
  assert.ok(gap >= 0.18,
    `o alerta precisa se separar da marca pela saturação (diferença ${gap.toFixed(2)})`);
});

/* ── marca ──────────────────────────────────────────────────────────────── */

/**
 * Refaz a geometria da marca a partir das constantes que estão em
 * `marcaClaude()`. Se elas mudarem, os `d` esperados mudam junto e o teste
 * cobra a regeração do ícone.
 */
function geometriaDaMarca() {
  const num = (nome) => {
    const m = js.match(new RegExp(`${nome}\\s*=\\s*([\\d.]+)`));
    assert.ok(m, `constante ${nome} não encontrada em marcaClaude()`);
    return Number(m[1]);
  };
  const laminas = num("MARCA_LAMINAS");
  const dentro = num("const dentro");
  const larguraDentro = num("const larguraDentro");
  const larguraFora = num("const larguraFora");

  const mFora = js.match(/const fora = ([\d.]+) - \(i % (\d+)\) \* ([\d.]+);/);
  assert.ok(mFora, "cálculo de `fora` não encontrado em marcaClaude()");
  const [, base, modulo, passo] = mFora.map(Number);

  const ds = [];
  for (let i = 0; i < laminas; i++) {
    const fora = base - (i % modulo) * passo;
    const r = larguraFora;
    ds.push(
      `M ${-larguraDentro} ${-dentro} ` +
      `L ${-larguraFora} ${-(fora - r)} ` +
      `A ${r} ${r} 0 0 1 ${larguraFora} ${-(fora - r)} ` +
      `L ${larguraDentro} ${-dentro} Z`
    );
  }
  return { laminas, dentro, ds };
}

test("o ícone do tablet é a mesma forma que o painel desenha", () => {
  const { laminas, dentro, ds } = geometriaDaMarca();
  const doIcone = [...icone.matchAll(/<path d="([^"]+)"/g)].map((m) => m[1].trim());

  assert.equal(doIcone.length, laminas,
    "o ícone precisa ter uma lâmina por lâmina da marca");
  assert.deepEqual(doIcone, ds,
    "geometria divergiu — regere o ícone a partir das constantes de marcaClaude()");

  const nucleo = icone.match(/<circle r="([\d.]+)"/);
  assert.ok(nucleo, "o ícone precisa do núcleo");
  assert.equal(Number(nucleo[1]), dentro - 1.2);
});

test("o ícone usa o fundo e a laranja da paleta", () => {
  assert.match(icone, /fill="#100F0D"/i);
  assert.match(icone, /fill="#D97757"/i);
});

/* ── degradação ─────────────────────────────────────────────────────────── */

test("a marca para de animar no modo leve e com movimento reduzido", () => {
  // A identidade tem de sobreviver ao aparelho fraco; a animação, não.
  assert.match(css, /\[data-lite="1"\][^{]*\.marca-svg[\s\S]{0,120}animation:\s*none/);
  assert.match(css, /prefers-reduced-motion[\s\S]{0,220}animation:\s*none/);
});

test("o fundo tem plano B sem WebGL e não vira tela preta", () => {
  // O shader é escrito à mão: quando a placa recusa, alguém precisa desenhar.
  assert.match(js, /function auroraWebGL/);
  assert.match(js, /function auroraCanvas2D/);
  assert.match(js, /if \(auroraWebGL\(cv\)\) return;\s*\n\s*auroraCanvas2D\(cv\);/);

  // WebGL emulado em software seria mais lento que o canvas 2D: melhor recusar.
  assert.match(js, /failIfMajorPerformanceCaveat:\s*true/);

  // Android recolhe o contexto quando quer; perder o fundo não pode derrubar
  // o painel.
  assert.match(js, /webglcontextlost/);
});
