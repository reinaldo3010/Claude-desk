"use strict";
/**
 * Utilitários compartilhados. Sem dependências externas, por design.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

/** Limita um número a uma faixa. Devolve null se não for número finito. */
function clamp(n, lo, hi) {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  return Math.min(hi, Math.max(lo, n));
}

/** Arredonda para uma casa decimal, preservando null. */
function round1(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  return Math.round(n * 10) / 10;
}

/**
 * Normaliza um percentual vindo de fonte desconhecida.
 * O statusLine entrega 0..100, mas versões antigas de terceiros usavam 0..1.
 * A heurística só multiplica quando o valor está estritamente entre 0 e 1 —
 * assim um 1 legítimo ("1%") não vira 100.
 */
function normalizePercent(v) {
  if (typeof v === "string" && v.trim() !== "") v = Number(v.replace("%", ""));
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0) return null;
  if (v > 0 && v < 1) return round1(v * 100);
  return round1(v);
}

/**
 * Converte um instante de qualquer formato plausível para epoch em ms.
 * Aceita epoch em segundos, epoch em ms, ISO 8601 e Date.
 */
function toEpochMs(v) {
  if (v == null) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.getTime();
  if (typeof v === "number") {
    if (!Number.isFinite(v) || v <= 0) return null;
    // Menos de 1e12 é epoch em segundos (1e12 ms ≈ ano 2001).
    return v < 1e12 ? Math.round(v * 1000) : Math.round(v);
  }
  if (typeof v === "string") {
    const s = v.trim();
    if (s === "") return null;
    if (/^\d+$/.test(s)) return toEpochMs(Number(s));
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d.getTime();
  }
  return null;
}

/** Escrita atômica: grava num temporário e renomeia, para nunca deixar JSON pela metade. */
function writeJsonAtomic(file, data) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(file)}.${process.pid}.${Date.now()}.tmp`);
  fs.writeFileSync(tmp, JSON.stringify(data), "utf8");
  try {
    fs.renameSync(tmp, file);
  } catch (err) {
    // Windows pode recusar rename sobre arquivo aberto por outro processo.
    try {
      fs.copyFileSync(tmp, file);
      fs.unlinkSync(tmp);
    } catch {
      try { fs.unlinkSync(tmp); } catch { /* já foi */ }
      throw err;
    }
  }
}

/** Leitura de JSON que nunca lança: devolve fallback em qualquer erro. */
function readJsonSafe(file, fallback = null) {
  try {
    const raw = fs.readFileSync(file, "utf8");
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Acesso profundo tolerante: get(obj, "a.b.c"). Nunca lança. */
function get(obj, dotted) {
  let cur = obj;
  for (const key of dotted.split(".")) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[key];
  }
  return cur;
}

/** Primeiro valor não nulo entre os candidatos. */
function firstOf(...vals) {
  for (const v of vals) if (v != null) return v;
  return null;
}

/** Diretório de estado do deck (~/.claude/deck por padrão). */
function stateDir() {
  return (
    process.env.DECK_STATE_DIR ||
    path.join(os.homedir(), ".claude", "deck")
  );
}

/** Formata bytes/tokens grandes de forma legível: 1234567 -> "1.2M". */
function compactNumber(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "--";
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  return String(Math.round(n));
}

/** Duração humana curta em pt-BR: 5400000 -> "1h 30m". */
function humanDuration(ms) {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return "--";
  const totalMin = Math.floor(ms / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (totalMin > 0) return `${m}m`;
  return `${Math.max(0, Math.floor(ms / 1000))}s`;
}

module.exports = {
  clamp,
  round1,
  normalizePercent,
  toEpochMs,
  writeJsonAtomic,
  readJsonSafe,
  get,
  firstOf,
  stateDir,
  compactNumber,
  humanDuration,
};
