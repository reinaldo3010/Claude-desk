"use strict";
/**
 * Segurança do deck.
 *
 * Modelo de ameaça honesto: quem estiver na sua rede Wi-Fi e souber o token
 * consegue digitar no seu terminal. Não dá para resolver isso com token só —
 * token vaza no histórico do navegador, na URL do quiosque, no print que você
 * manda no grupo. As defesas aqui são proporcionais e em camadas:
 *
 *   1. token com comparação em tempo constante (evita descobrir por timing);
 *   2. faixa de IPs autorizada (o tablet tem IP fixo — restrinja a ele);
 *   3. limite de ações por minuto (um script que acertou o token trava rápido);
 *   4. log de auditoria (você descobre depois que aconteceu).
 *
 * O que NÃO fazemos: sistema de login. Seria cerimônia demais para um painel
 * de parede, e a superfície real de ataque é a rede, não a senha.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

/** Compara segredos sem vazar o tamanho do prefixo correto pelo tempo gasto. */
function safeEqual(a, b) {
  const A = Buffer.from(String(a ?? ""), "utf8");
  const B = Buffer.from(String(b ?? ""), "utf8");
  // timingSafeEqual exige tamanhos iguais; o hash normaliza sem revelar nada.
  const ha = crypto.createHash("sha256").update(A).digest();
  const hb = crypto.createHash("sha256").update(B).digest();
  return crypto.timingSafeEqual(ha, hb) && A.length === B.length;
}

function loadOrCreateToken(file) {
  try {
    const t = fs.readFileSync(file, "utf8").trim();
    if (t) return t;
  } catch { /* ainda não existe */ }
  const t = crypto.randomBytes(16).toString("base64url");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, t, { mode: 0o600 });
  try { fs.chmodSync(file, 0o600); } catch { /* Windows ignora */ }
  return t;
}

/** Normaliza o endereço: ::ffff:192.168.0.5 vira 192.168.0.5. */
function normalizeIp(addr) {
  if (!addr) return "";
  return String(addr).replace(/^::ffff:/, "");
}

const LOOPBACK = new Set(["127.0.0.1", "::1", "localhost"]);
const isLoopback = (addr) => LOOPBACK.has(normalizeIp(addr));

/** Converte um IPv4 em inteiro sem sinal. Devolve null se não for IPv4. */
function ipToInt(ip) {
  const m = normalizeIp(ip).match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  let n = 0;
  for (let i = 1; i <= 4; i++) {
    const o = Number(m[i]);
    if (o > 255) return null;
    n = (n << 8) | o;
  }
  return n >>> 0;
}

/**
 * Compila a lista de origens autorizadas.
 * Aceita "192.168.0.0/24", "192.168.0.7", "loopback" e "*" (tudo),
 * separados por vírgula. Vazio significa "qualquer origem, desde que com token".
 */
function compileAllowList(spec) {
  const raw = String(spec || "").trim();
  if (!raw) return null;

  const rules = [];
  for (const part of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
    if (part === "*") return { any: true, test: () => true, spec: raw };
    if (part === "loopback" || part === "local") {
      rules.push((ip) => isLoopback(ip));
      continue;
    }
    const [addr, bitsRaw] = part.split("/");
    const base = ipToInt(addr);
    if (base == null) continue;
    const bits = bitsRaw == null ? 32 : Number(bitsRaw);
    if (!Number.isInteger(bits) || bits < 0 || bits > 32) continue;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    rules.push((ip) => {
      const n = ipToInt(ip);
      return n != null && (n & mask) >>> 0 === (base & mask) >>> 0;
    });
  }
  if (!rules.length) return null;
  return { any: false, test: (ip) => rules.some((r) => r(ip)), spec: raw };
}

/** Limitador simples de janela deslizante, por IP. */
class RateLimiter {
  constructor(perMinute = 60) {
    this.limit = Math.max(1, perMinute);
    this.hits = new Map();
  }

  /** true = pode passar. */
  take(key, now = Date.now()) {
    const cutoff = now - 60_000;
    let arr = this.hits.get(key);
    if (!arr) {
      arr = [];
      this.hits.set(key, arr);
    }
    while (arr.length && arr[0] < cutoff) arr.shift();
    if (arr.length >= this.limit) return false;
    arr.push(now);
    // Evita vazamento de memória num servidor que roda meses.
    if (this.hits.size > 512) {
      for (const [k, v] of this.hits) {
        if (!v.length || v[v.length - 1] < cutoff) this.hits.delete(k);
      }
    }
    return true;
  }

  remaining(key, now = Date.now()) {
    const arr = this.hits.get(key) || [];
    const cutoff = now - 60_000;
    return Math.max(0, this.limit - arr.filter((t) => t >= cutoff).length);
  }
}

/** Log de auditoria em JSON por linha. Nunca lança. */
function makeAuditor(file) {
  let stream = null;
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    stream = fs.createWriteStream(file, { flags: "a" });
    stream.on("error", () => { stream = null; });
  } catch { /* segue sem auditoria */ }

  return function audit(entry) {
    if (!stream) return;
    try {
      stream.write(JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n");
    } catch { /* não pode derrubar uma requisição */ }
  };
}

/** Esconde o token em logs: mostra só as pontas. */
function maskToken(t) {
  const s = String(t || "");
  if (s.length <= 8) return "•".repeat(s.length);
  return `${s.slice(0, 4)}…${s.slice(-3)}`;
}

module.exports = {
  safeEqual,
  loadOrCreateToken,
  normalizeIp,
  isLoopback,
  ipToInt,
  compileAllowList,
  RateLimiter,
  makeAuditor,
  maskToken,
};
