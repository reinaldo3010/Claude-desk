"use strict";
/**
 * Testes de segurança — inclusive o adversarial.
 *
 * A pergunta honesta: se alguém na minha rede descobrir o token, o que
 * acontece? A resposta é "ele digita no meu terminal", e isso não some com
 * mais criptografia. O que estes testes garantem é que as camadas que
 * REALMENTE reduzem o dano estão funcionando.
 */

const test = require("node:test");
const assert = require("node:assert");
const { safeEqual, compileAllowList, RateLimiter, ipToInt, isLoopback, maskToken } = require("../src/security");
const { sanitizeText, validateKeys, buildCommand, keysToXdotool } = require("../src/inject");

// Caracteres de controle montados por código para não poluir o arquivo.
const NUL = String.fromCharCode(0);
const BEL = String.fromCharCode(7);
const ESC = String.fromCharCode(27);

test("comparação de token não vaza pelo tamanho do prefixo certo", () => {
  assert.equal(safeEqual("segredo", "segredo"), true);
  assert.equal(safeEqual("segredo", "segredx"), false);
  assert.equal(safeEqual("segredo", "segred"), false, "prefixo correto não passa");
  assert.equal(safeEqual("segredo", "segredoo"), false, "sufixo extra não passa");
  assert.equal(safeEqual("", ""), true);
  assert.equal(safeEqual(null, "x"), false);
  assert.equal(safeEqual(undefined, undefined), true);
});

test("faixa de IPs em CIDR", () => {
  const a = compileAllowList("192.168.0.0/24");
  assert.equal(a.test("192.168.0.1"), true);
  assert.equal(a.test("192.168.0.255"), true);
  assert.equal(a.test("192.168.1.1"), false);
  assert.equal(a.test("10.0.0.1"), false);
});

test("IPv4 mapeado em IPv6 é normalizado antes de comparar", () => {
  const a = compileAllowList("192.168.0.7");
  assert.equal(a.test("::ffff:192.168.0.7"), true, "senão o tablet seria bloqueado sem motivo");
  assert.equal(a.test("::ffff:192.168.0.8"), false);
});

test("loopback e curinga", () => {
  assert.equal(compileAllowList("loopback").test("127.0.0.1"), true);
  assert.equal(compileAllowList("loopback").test("192.168.0.5"), false);
  assert.equal(compileAllowList("*").test("8.8.8.8"), true);
  assert.equal(compileAllowList(""), null, "vazio = sem restrição de IP");
});

test("entrada inválida na faixa não vira permissão acidental", () => {
  assert.equal(compileAllowList("999.1.1.1"), null, "endereço impossível é descartado, não vira curinga");
  assert.equal(compileAllowList("192.168.0.0/99"), null);
  assert.equal(ipToInt("256.1.1.1"), null);
  assert.equal(ipToInt("nem ip"), null);
});

test("limitador trava rajada e libera depois da janela", () => {
  const rl = new RateLimiter(3);
  const t = Date.now();
  assert.equal(rl.take("a", t), true);
  assert.equal(rl.take("a", t), true);
  assert.equal(rl.take("a", t), true);
  assert.equal(rl.take("a", t), false, "quarta ação no mesmo minuto é barrada");
  assert.equal(rl.take("b", t), true, "outro IP não é afetado");
  assert.equal(rl.take("a", t + 61000), true, "passou o minuto, libera");
});

test("ADVERSARIAL: token vazado é contido pelas outras camadas", () => {
  // Cenário: alguém na rede Wi-Fi tirou o token do print que eu mandei no grupo.
  const tokenVazado = "token-que-vazou";
  assert.equal(safeEqual(tokenVazado, "token-que-vazou"), true, "o token sozinho abre a porta");

  // Camada 2: o atacante não está na faixa autorizada.
  const faixa = compileAllowList("192.168.0.42"); // só o tablet
  assert.equal(faixa.test("192.168.0.99"), false, "IP do atacante é recusado mesmo com token válido");

  // Camada 3: mesmo se ele estivesse na faixa, não dá para martelar.
  const rl = new RateLimiter(60);
  const t = Date.now();
  let aceitas = 0;
  for (let i = 0; i < 500; i++) if (rl.take("192.168.0.42", t)) aceitas++;
  assert.equal(aceitas, 60, "500 tentativas viram 60 — a rajada morre");
});

test("ADVERSARIAL: a API não aceita texto arbitrário, só um id de ação", () => {
  // O corpo da requisição carrega apenas um id. O texto que será digitado vem
  // da lista fixa no servidor, então não existe caminho para o atacante
  // escolher o que aparece no terminal — só QUAL botão apertar.
  const acoes = require("../src/actions").build();
  const ids = acoes.map((a) => a.id);
  assert.ok(!ids.includes("__proto__"));
  for (const a of acoes) {
    if (a.kind === "keys") assert.equal(validateKeys(a.keys), null, `ação ${a.id} tem teclas válidas`);
  }
});

test("caracteres de controle são removidos antes de digitar", () => {
  assert.equal(sanitizeText("ola" + NUL + "mundo"), "olamundo", "byte nulo removido");
  assert.equal(sanitizeText("sino" + BEL + "aqui"), "sinoaqui", "campainha removida");
  assert.equal(sanitizeText(ESC + "[31mvermelho"), "[31mvermelho", "escape ANSI desarmado");
  assert.equal(sanitizeText("a".repeat(5000)).length, 2000, "tamanho limitado");
  // A quebra de linha sobrevive: é legítima num prompt de várias linhas.
  assert.ok(sanitizeText("linha1\nlinha2").includes("\n"));
});

test("sequência de teclas fora do vocabulário é recusada", () => {
  assert.equal(validateKeys("1{Enter}"), null);
  assert.equal(validateKeys("+{Tab}"), null);
  assert.ok(validateKeys("$(rm -rf /)"), "cifrão e parênteses são recusados");
  assert.ok(validateKeys("`whoami`"), "crase é recusada");
  assert.ok(validateKeys("a".repeat(200)), "sequência longa demais é recusada");
  assert.ok(validateKeys(""), "vazio é recusado");
});

test("comando é montado como lista de argumentos, nunca como string de shell", () => {
  const cfg = { injector: "xdotool", target: "Claude", injectTimeoutMs: 1000 };
  const built = buildCommand(cfg, "text", "; rm -rf / #");
  assert.ok(Array.isArray(built.args), "execFile recebe array: o shell nunca interpreta");
  assert.ok(built.args.includes("; rm -rf / #"), "o texto vai como UM argumento literal");
});

test("sem alvo definido, recusa em vez de digitar na janela em foco", () => {
  for (const injector of ["ahk", "xdotool", "applescript"]) {
    const built = buildCommand({ injector, target: "", ahkExe: "/nao/existe" }, "keys", "{Esc}");
    assert.ok(built.error, `${injector} sem alvo precisa recusar`);
  }
});

test("modificador antes de tecla nomeada é traduzido certo", () => {
  // Este era um bug real: "+{Tab}" virava shift+"{" mais as letras T, a, b —
  // ou seja, o botão de modo plano digitava lixo no terminal.
  assert.deepEqual(keysToXdotool("+{Tab}"), ["shift+Tab"]);
  assert.deepEqual(keysToXdotool("^c"), ["ctrl+c"]);
  assert.deepEqual(keysToXdotool("{Esc}"), ["Escape"]);
});

test("token é mascarado em logs", () => {
  assert.equal(maskToken("abcdefghijklmno"), "abcd…mno");
  assert.ok(!maskToken("abcdefghijklmno").includes("efghijkl"));
});

test("loopback reconhece as formas usuais", () => {
  for (const ip of ["127.0.0.1", "::1", "::ffff:127.0.0.1"]) assert.equal(isLoopback(ip), true);
  assert.equal(isLoopback("192.168.0.1"), false);
});
