"use strict";
/**
 * Catálogo de ações do deck — ponto ÚNICO de configuração.
 * A interface se monta sozinha a partir daqui; adicionar um botão é
 * adicionar uma linha (ou um objeto em `actions` no deck.config.json).
 *
 * Campos:
 *   id        identificador estável (usado pela API e pelo log de auditoria)
 *   label     texto do botão
 *   hint      legenda secundária, opcional
 *   group     agrupamento visual: permission | control | prompt
 *   tone      cor: go | stop | warn | neutral | accent
 *   icon      nome do ícone desenhado na UI
 *   kind      decision | keys | text
 *   decision  allow | allow_always | deny   (só para kind=decision)
 *   keys      teclas cruas do injetor      (kind=keys, ou fallback de decision)
 *   text      texto digitado + Enter        (kind=text)
 *   confirm   true exige toque duplo antes de disparar
 *   armed     "gate" só habilita quando há uma permissão pendente
 *
 * SOBRE O MAPEAMENTO DE TECLAS DE APROVAÇÃO
 * -----------------------------------------
 * O esqueleto original assumia que o prompt de permissão numera
 * 1=sim, 2=sim e não perguntar, 3=não. Isso NÃO é garantido: a ordem muda
 * entre versões e entre tipos de permissão. Por isso:
 *   1. o caminho principal de aprovação é o portão de permissão (hook
 *      PermissionRequest), que devolve uma decisão explícita e não depende
 *      de digitar número nenhum;
 *   2. o fallback por teclas fica em `approvalKeys` abaixo, isolado e
 *      configurável, para você corrigir num lugar só depois de conferir
 *      com `claude-deck doctor --keys`.
 */

const APPROVAL_KEYS = {
  allow: process.env.DECK_KEY_ALLOW || "1{Enter}",
  allow_always: process.env.DECK_KEY_ALWAYS || "2{Enter}",
  deny: process.env.DECK_KEY_DENY || "{Esc}",
};

const BASE_ACTIONS = [
  // --- decisões de permissão -------------------------------------------
  {
    id: "allow",
    label: "Aprovar",
    hint: "só desta vez",
    group: "permission",
    tone: "go",
    icon: "check",
    kind: "decision",
    decision: "allow",
    keys: APPROVAL_KEYS.allow,
    armed: "gate",
  },
  {
    id: "allow_always",
    label: "Sempre",
    hint: "não perguntar de novo",
    group: "permission",
    tone: "warn",
    icon: "infinity",
    kind: "decision",
    decision: "allow_always",
    keys: APPROVAL_KEYS.allow_always,
    confirm: true,
    armed: "gate",
  },
  {
    id: "deny",
    label: "Recusar",
    group: "permission",
    tone: "stop",
    icon: "cross",
    kind: "decision",
    decision: "deny",
    keys: APPROVAL_KEYS.deny,
    armed: "gate",
  },

  // --- controle da sessão ----------------------------------------------
  {
    id: "interrupt",
    label: "Interromper",
    hint: "Esc",
    group: "control",
    tone: "stop",
    icon: "stop",
    kind: "keys",
    keys: "{Esc}",
  },
  {
    id: "plan_mode",
    label: "Modo plano",
    hint: "Shift+Tab",
    group: "control",
    tone: "accent",
    icon: "map",
    kind: "keys",
    keys: "+{Tab}",
  },
  {
    id: "continue",
    label: "Continuar",
    group: "control",
    tone: "neutral",
    icon: "play",
    kind: "text",
    text: "continue",
  },
  {
    id: "compact",
    label: "Compactar",
    hint: "/compact",
    group: "control",
    tone: "neutral",
    icon: "compress",
    kind: "text",
    text: "/compact",
  },

  // --- prompts de uso frequente ----------------------------------------
  {
    id: "review",
    label: "Revisar diff",
    group: "prompt",
    tone: "neutral",
    icon: "search",
    kind: "text",
    text:
      "revise o diff atual: bugs, edge cases não tratados e o que você faria diferente",
  },
  {
    id: "tests",
    label: "Testar",
    group: "prompt",
    tone: "neutral",
    icon: "beaker",
    kind: "text",
    text: "rode os testes e conserte o que estiver quebrado",
  },
  {
    id: "explain",
    label: "Explicar",
    group: "prompt",
    tone: "neutral",
    icon: "book",
    kind: "text",
    text: "explique em poucas linhas o que você acabou de fazer e por quê",
  },
  {
    id: "commit",
    label: "Commitar",
    group: "prompt",
    tone: "neutral",
    icon: "git",
    kind: "text",
    text: "faça um commit com mensagem descritiva do que mudou",
    confirm: true,
  },
];

const VALID_KINDS = new Set(["decision", "keys", "text"]);
const VALID_TONES = new Set(["go", "stop", "warn", "neutral", "accent"]);
const VALID_GROUPS = new Set(["permission", "control", "prompt"]);
const VALID_DECISIONS = new Set(["allow", "allow_always", "deny"]);

/**
 * Valida uma ação. Devolve lista de problemas (vazia = ação boa).
 * Uma ação inválida vinda do deck.config.json é descartada com aviso,
 * nunca derruba o servidor.
 */
function validate(a) {
  const errs = [];
  if (!a || typeof a !== "object") return ["não é um objeto"];
  if (!a.id || !/^[a-z0-9_]{1,40}$/i.test(String(a.id)))
    errs.push("id ausente ou fora do padrão [a-z0-9_]");
  if (!a.label || typeof a.label !== "string") errs.push("label ausente");
  if (!VALID_KINDS.has(a.kind)) errs.push(`kind inválido: ${a.kind}`);
  if (a.tone && !VALID_TONES.has(a.tone)) errs.push(`tone inválido: ${a.tone}`);
  if (a.group && !VALID_GROUPS.has(a.group)) errs.push(`group inválido: ${a.group}`);
  if (a.kind === "decision" && !VALID_DECISIONS.has(a.decision))
    errs.push(`decision inválida: ${a.decision}`);
  if (a.kind === "keys" && !a.keys) errs.push("kind=keys exige campo keys");
  if (a.kind === "text" && typeof a.text !== "string") errs.push("kind=text exige campo text");
  if (typeof a.text === "string" && a.text.length > 2000) errs.push("text acima de 2000 chars");
  return errs;
}

/**
 * Monta a lista final de ações: as embutidas mais as do deck.config.json.
 * Uma ação do usuário com id já existente SUBSTITUI a embutida — é assim que
 * se troca o mapeamento de teclas sem editar o código.
 */
function build(extra = [], onWarn = () => {}) {
  const byId = new Map();
  for (const a of BASE_ACTIONS) byId.set(a.id, { ...a });

  for (const raw of extra) {
    const merged = byId.has(raw.id) ? { ...byId.get(raw.id), ...raw } : { ...raw };
    const errs = validate(merged);
    if (errs.length) {
      onWarn(`ação "${raw && raw.id}" ignorada: ${errs.join("; ")}`);
      continue;
    }
    byId.set(merged.id, merged);
  }
  return [...byId.values()];
}

/** Projeção segura para o cliente: nunca expõe `keys` nem `text`. */
function toPublic(actions) {
  return actions.map((a) => ({
    id: a.id,
    label: a.label,
    hint: a.hint || null,
    group: a.group || "control",
    tone: a.tone || "neutral",
    icon: a.icon || "dot",
    kind: a.kind,
    confirm: !!a.confirm,
    armed: a.armed || null,
  }));
}

module.exports = { BASE_ACTIONS, APPROVAL_KEYS, build, validate, toPublic };
