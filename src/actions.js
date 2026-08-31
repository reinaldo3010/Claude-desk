"use strict";
/**
 * Catálogo de ações do deck — ponto ÚNICO de configuração.
 * A interface se monta sozinha a partir daqui; adicionar um botão é
 * adicionar um objeto (aqui ou em `actions` no deck.config.json).
 *
 * CAMPOS
 * ------
 *   id        identificador estável (usado pela API e pelo log de auditoria)
 *   label     texto do botão
 *   hint      legenda secundária
 *   page      aba: main | prompts | sessao | modelo | esforco  (padrão main)
 *   group     agrupamento dentro da aba: permission | control | prompt
 *   tone      cor: go | stop | warn | neutral | accent
 *   icon      nome do ícone desenhado na UI
 *
 *   kind      decision | keys | text | chain | page
 *   decision  allow | allow_always | deny        (kind=decision)
 *   keys      teclas cruas do injetor            (kind=keys, ou fallback)
 *   text      texto digitado + Enter             (kind=text)
 *   steps     sequência de passos                (kind=chain)
 *   target    aba de destino                     (kind=page)
 *
 *   when      condição de visibilidade — ver src/deckengine.js
 *   urgent    condição que promove o botão para o topo
 *   badge     dado ao vivo mostrado na face do botão
 *   hold      id da ação disparada por toque longo
 *   confirm   exige toque duplo
 *   keepVisible  fica na tela desabilitado em vez de sumir
 *   secondary  não vira botão próprio: só existe como destino de hold/chain
 *   active     condição que ACENDE o botão — usada para transformar uma
 *              fileira de opções num seletor (modelo e esforço em uso)
 *
 * SOBRE O MAPEAMENTO DE TECLAS DE APROVAÇÃO
 * -----------------------------------------
 * O esqueleto original assumia que o prompt de permissão numera
 * 1=sim, 2=sim e não perguntar, 3=não. Isso NÃO é garantido: a ordem muda
 * entre versões e entre tipos de permissão. Por isso:
 *   1. o caminho principal de aprovação é o portão de permissão (hook
 *      PermissionRequest), que devolve uma decisão explícita e não depende
 *      de digitar número nenhum;
 *   2. o fallback por teclas fica em `APPROVAL_KEYS` abaixo, isolado e
 *      configurável, para você corrigir num lugar só depois de conferir.
 */

const APPROVAL_KEYS = {
  allow: process.env.DECK_KEY_ALLOW || "1{Enter}",
  allow_always: process.env.DECK_KEY_ALWAYS || "2{Enter}",
  deny: process.env.DECK_KEY_DENY || "{Esc}",
};

const BASE_ACTIONS = [
  // ══════════════════════════ decisões de permissão ═══════════════════════
  // Só existem quando há o que decidir. Com nada pendente elas somem e
  // devolvem a faixa mais visível do painel para os botões que funcionam.
  {
    id: "allow",
    label: "Aprovar",
    hint: "só desta vez",
    page: "main",
    group: "permission",
    tone: "go",
    icon: "check",
    kind: "decision",
    decision: "allow",
    keys: APPROVAL_KEYS.allow,
    when: { anyOf: [{ gate: true }, { gateEnabled: false }] },
    // Sobe com uma permissão formal pendente OU quando o Claude avisou que
    // está esperando: com o portão desligado, o aviso é o único sinal que
    // chega, e é justo aí que a mão procura estes três botões.
    urgent: { anyOf: [{ gate: true }, { status: ["waiting"] }] },
  },
  {
    id: "allow_always",
    label: "Sempre",
    hint: "não perguntar de novo",
    page: "main",
    group: "permission",
    tone: "warn",
    icon: "infinity",
    kind: "decision",
    decision: "allow_always",
    keys: APPROVAL_KEYS.allow_always,
    confirm: true,
    when: { anyOf: [{ gate: true }, { gateEnabled: false }] },
    // Sobe com uma permissão formal pendente OU quando o Claude avisou que
    // está esperando: com o portão desligado, o aviso é o único sinal que
    // chega, e é justo aí que a mão procura estes três botões.
    urgent: { anyOf: [{ gate: true }, { status: ["waiting"] }] },
  },
  {
    id: "deny",
    label: "Recusar",
    page: "main",
    group: "permission",
    tone: "stop",
    icon: "cross",
    kind: "decision",
    decision: "deny",
    keys: APPROVAL_KEYS.deny,
    when: { anyOf: [{ gate: true }, { gateEnabled: false }] },
    // Sobe com uma permissão formal pendente OU quando o Claude avisou que
    // está esperando: com o portão desligado, o aviso é o único sinal que
    // chega, e é justo aí que a mão procura estes três botões.
    urgent: { anyOf: [{ gate: true }, { status: ["waiting"] }] },
  },

  // ══════════════════════════ controle da sessão ══════════════════════════
  {
    id: "interrupt",
    label: "Interromper",
    hint: "Esc · segure para parar tudo",
    page: "main",
    group: "control",
    tone: "stop",
    icon: "stop",
    kind: "keys",
    keys: "{Esc}",
    // A face vira cronômetro enquanto o Claude trabalha: dá para ver de
    // longe que já são três minutos no mesmo comando.
    badge: { source: "elapsed", format: "duration", when: { status: ["working"] } },
    urgent: { status: ["working"] },
    hold: "panic",
  },
  {
    id: "panic",
    label: "Parar tudo",
    hint: "Esc duplo",
    page: "main",
    group: "control",
    tone: "stop",
    icon: "power",
    kind: "chain",
    // Um Esc interrompe a volta; o segundo limpa o que ficou digitado.
    steps: [{ action: "interrupt" }, { wait: 260 }, { action: "interrupt" }],
    confirm: true,
    secondary: true,
  },
  {
    id: "plan_mode",
    label: "Modo plano",
    hint: "Shift+Tab",
    page: "main",
    group: "control",
    tone: "accent",
    icon: "map",
    kind: "keys",
    keys: "+{Tab}",
  },
  {
    id: "continue",
    label: "Continuar",
    hint: "segure para insistir",
    page: "main",
    group: "control",
    tone: "neutral",
    icon: "play",
    kind: "text",
    text: "continue",
    hold: "continue_hard",
    urgent: { status: ["idle"] },
  },
  {
    id: "continue_hard",
    label: "Não pare",
    page: "main",
    group: "control",
    tone: "accent",
    icon: "play",
    kind: "text",
    text:
      "continue até terminar de verdade: rode o que precisar ser rodado e só pare quando estiver funcionando",
    confirm: true,
    secondary: true,
  },
  {
    id: "compact",
    label: "Compactar",
    hint: "/compact",
    page: "main",
    group: "control",
    tone: "neutral",
    icon: "compress",
    kind: "text",
    text: "/compact",
    // O número na face é o uso de contexto. Amarelo aos 70, vermelho aos 85 —
    // o botão avisa que é hora antes de você perceber.
    badge: { source: "context", format: "pct", warnAbove: 70, critAbove: 85 },
    urgent: { contextAbove: 75 },
    hold: "clear",
  },
  {
    id: "clear",
    label: "Limpar",
    hint: "/clear — perde o contexto",
    page: "main",
    group: "control",
    tone: "stop",
    icon: "trash",
    kind: "text",
    text: "/clear",
    confirm: true,
    secondary: true,
  },

  // ══════════════════════════ prompts frequentes ══════════════════════════
  {
    id: "review",
    label: "Revisar diff",
    page: "prompts",
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
    page: "prompts",
    group: "prompt",
    tone: "neutral",
    icon: "beaker",
    kind: "text",
    text: "rode os testes e conserte o que estiver quebrado",
  },
  {
    id: "explain",
    label: "Explicar",
    page: "prompts",
    group: "prompt",
    tone: "neutral",
    icon: "book",
    kind: "text",
    text: "explique em poucas linhas o que você acabou de fazer e por quê",
  },
  {
    id: "fix",
    label: "Consertar",
    page: "prompts",
    group: "prompt",
    tone: "neutral",
    icon: "wrench",
    kind: "text",
    text: "está quebrado. investigue a causa raiz antes de propor conserto",
  },
  {
    id: "simplify",
    label: "Simplificar",
    page: "prompts",
    group: "prompt",
    tone: "neutral",
    icon: "compress",
    kind: "text",
    text: "simplifique o que você acabou de escrever sem perder comportamento",
  },
  {
    id: "commit",
    label: "Commitar",
    page: "prompts",
    group: "prompt",
    tone: "warn",
    icon: "git",
    kind: "text",
    text: "faça um commit com mensagem descritiva do que mudou",
    confirm: true,
  },

  // ══════════════════════════ estado da sessão ════════════════════════════
  {
    id: "cost",
    label: "Custo",
    hint: "/cost",
    page: "sessao",
    group: "control",
    tone: "neutral",
    icon: "coin",
    kind: "text",
    text: "/cost",
    badge: { source: "cost", format: "usd" },
  },
  {
    id: "model",
    label: "Modelo",
    hint: "/model",
    page: "sessao",
    group: "control",
    tone: "accent",
    icon: "chip",
    kind: "text",
    text: "/model",
  },
  {
    id: "effort",
    label: "Esforço",
    hint: "/effort",
    page: "sessao",
    group: "control",
    tone: "accent",
    icon: "gauge",
    kind: "text",
    text: "/effort",
  },
  {
    id: "status",
    label: "Status",
    hint: "/status",
    page: "sessao",
    group: "control",
    tone: "neutral",
    icon: "info",
    kind: "text",
    text: "/status",
    badge: { source: "sessions", format: "number" },
  },
  {
    id: "usage",
    label: "Uso",
    hint: "/usage",
    page: "sessao",
    group: "control",
    tone: "neutral",
    icon: "chart",
    kind: "text",
    text: "/usage",
    badge: { source: "five", format: "pct", warnAbove: 60, critAbove: 85 },
  },
  {
    id: "resume_hint",
    label: "Retomar",
    hint: "quando o limite zerar",
    page: "sessao",
    group: "control",
    tone: "warn",
    icon: "clock",
    kind: "text",
    text: "continue de onde paramos",
    // Só aparece quando faz sentido: limite estourado ou quase.
    when: { fiveAbove: 90 },
    urgent: { status: ["error"] },
  },
  // ══════════════════════════ seleção de modelo ═══════════════════════════
  // `/model <apelido>` aceita argumento em linha e vale para a sessão atual.
  // Apelidos conferidos na documentação do Claude Code, não de memória.
  //
  // O botão da FAMÍLIA em uso acende. Apelidos que resolvem para a mesma
  // família — opus, opus[1m], opusplan — não são distinguíveis pelo statusLine,
  // que informa o modelo resolvido e não o apelido digitado. Por isso só a
  // família acende: acender os três seria mentira bonita.
  {
    id: "m_opus",
    label: "Opus",
    hint: "raciocínio complexo",
    page: "modelo",
    group: "control",
    tone: "accent",
    icon: "chip",
    kind: "text",
    text: "/model opus",
    active: { modelIs: ["opus"] },
  },
  {
    id: "m_sonnet",
    label: "Sonnet",
    hint: "dia a dia",
    page: "modelo",
    group: "control",
    tone: "neutral",
    icon: "chip",
    kind: "text",
    text: "/model sonnet",
    active: { modelIs: ["sonnet"] },
  },
  {
    id: "m_haiku",
    label: "Haiku",
    hint: "rápido e barato",
    page: "modelo",
    group: "control",
    tone: "neutral",
    icon: "chip",
    kind: "text",
    text: "/model haiku",
    active: { modelIs: ["haiku"] },
  },
  {
    id: "m_fable",
    label: "Fable",
    hint: "mais capaz · mais caro",
    page: "modelo",
    group: "control",
    tone: "warn",
    icon: "chip",
    kind: "text",
    text: "/model fable",
    // O salto de preço é real: dois toques antes de trocar.
    confirm: true,
    active: { modelIs: ["fable"] },
  },
  {
    id: "m_best",
    label: "Melhor",
    hint: "/model best",
    page: "modelo",
    group: "control",
    tone: "accent",
    icon: "chip",
    kind: "text",
    text: "/model best",
    confirm: true,
  },
  {
    id: "m_opusplan",
    label: "Opus + plano",
    hint: "planeja em Opus, executa em Sonnet",
    page: "modelo",
    group: "control",
    tone: "accent",
    icon: "map",
    kind: "text",
    text: "/model opusplan",
  },
  {
    id: "m_opus1m",
    label: "Opus 1M",
    hint: "sessões longas",
    page: "modelo",
    group: "control",
    tone: "accent",
    icon: "chip",
    kind: "text",
    text: "/model opus[1m]",
  },
  {
    id: "m_default",
    label: "Padrão",
    hint: "volta ao da conta",
    page: "modelo",
    group: "control",
    tone: "neutral",
    icon: "info",
    kind: "text",
    text: "/model default",
  },

  // ══════════════════════════ nível de esforço ════════════════════════════
  // `/effort <nível>` também aceita argumento em linha.
  // low, medium, high e xhigh ficam salvos por modelo; max e ultracode valem
  // só para a sessão. `auto` limpa o nível salvo do modelo ativo.
  {
    id: "e_low",
    label: "Baixo",
    hint: "tarefas curtas",
    page: "esforco",
    group: "control",
    tone: "neutral",
    icon: "gauge",
    kind: "text",
    text: "/effort low",
    active: { effortIs: ["low"] },
  },
  {
    id: "e_medium",
    label: "Médio",
    hint: "economiza tokens",
    page: "esforco",
    group: "control",
    tone: "neutral",
    icon: "gauge",
    kind: "text",
    text: "/effort medium",
    active: { effortIs: ["medium"] },
  },
  {
    id: "e_high",
    label: "Alto",
    hint: "padrão",
    page: "esforco",
    group: "control",
    tone: "accent",
    icon: "gauge",
    kind: "text",
    text: "/effort high",
    active: { effortIs: ["high"] },
  },
  {
    id: "e_xhigh",
    label: "Extra",
    hint: "xhigh · código e agentes",
    page: "esforco",
    group: "control",
    tone: "accent",
    icon: "gauge",
    kind: "text",
    text: "/effort xhigh",
    // Ultracode é reportado como xhigh, então este botão acende nos dois
    // casos. Está dito no rótulo do Ultracode para não confundir.
    active: { effortIs: ["xhigh"] },
  },
  {
    id: "e_max",
    label: "Máximo",
    hint: "só a sessão · pode divagar",
    page: "esforco",
    group: "control",
    tone: "warn",
    icon: "gauge",
    kind: "text",
    text: "/effort max",
    active: { effortIs: ["max"] },
  },
  {
    id: "e_ultracode",
    label: "Ultracode",
    hint: "xhigh + orquestração",
    page: "esforco",
    group: "control",
    tone: "warn",
    icon: "power",
    kind: "text",
    text: "/effort ultracode",
  },
  {
    id: "e_auto",
    label: "Auto",
    hint: "limpa o nível salvo",
    page: "esforco",
    group: "control",
    tone: "neutral",
    icon: "infinity",
    kind: "text",
    text: "/effort auto",
  },
  {
    id: "e_fast",
    label: "Turbo",
    hint: "/fast · Opus 5 e 4.8",
    page: "esforco",
    group: "control",
    tone: "warn",
    icon: "bolt",
    kind: "text",
    text: "/fast",
    active: { fastMode: true },
  },
];

const VALID_KINDS = new Set(["decision", "keys", "text", "chain", "page"]);
const VALID_TONES = new Set(["go", "stop", "warn", "neutral", "accent"]);
const VALID_GROUPS = new Set(["permission", "control", "prompt"]);
const VALID_DECISIONS = new Set(["allow", "allow_always", "deny"]);
const VALID_PAGES = new Set(["main", "prompts", "sessao", "modelo", "esforco", "git", "quota"]);
const VALID_BADGE_FORMATS = new Set(["number", "pct", "usd", "duration"]);

/**
 * Valida uma ação. Devolve lista de problemas (vazia = ação boa).
 * Uma ação inválida vinda do deck.config.json é descartada com aviso,
 * nunca derruba o servidor.
 */
function validate(a, all = []) {
  const errs = [];
  if (!a || typeof a !== "object") return ["não é um objeto"];
  if (!a.id || !/^[a-z0-9_]{1,40}$/i.test(String(a.id)))
    errs.push("id ausente ou fora do padrão [a-z0-9_]");
  if (!a.label || typeof a.label !== "string") errs.push("label ausente");
  if (!VALID_KINDS.has(a.kind)) errs.push(`kind inválido: ${a.kind}`);
  if (a.tone && !VALID_TONES.has(a.tone)) errs.push(`tone inválido: ${a.tone}`);
  if (a.group && !VALID_GROUPS.has(a.group)) errs.push(`group inválido: ${a.group}`);
  if (a.page && !VALID_PAGES.has(a.page)) errs.push(`page inválida: ${a.page}`);

  if (a.kind === "decision" && !VALID_DECISIONS.has(a.decision))
    errs.push(`decision inválida: ${a.decision}`);
  if (a.kind === "keys" && !a.keys) errs.push("kind=keys exige campo keys");
  if (a.kind === "text" && typeof a.text !== "string") errs.push("kind=text exige campo text");
  if (typeof a.text === "string" && a.text.length > 2000) errs.push("text acima de 2000 chars");

  if (a.kind === "chain") {
    if (!Array.isArray(a.steps) || !a.steps.length) errs.push("kind=chain exige steps");
    else if (a.steps.length > 12) errs.push("chain com mais de 12 passos");
    else {
      for (const [i, step] of a.steps.entries()) {
        if (!step || typeof step !== "object") errs.push(`passo ${i} não é objeto`);
        else if (step.action == null && step.wait == null)
          errs.push(`passo ${i} precisa de action ou wait`);
        else if (step.wait != null && (typeof step.wait !== "number" || step.wait < 0 || step.wait > 5000))
          errs.push(`passo ${i}: wait fora de 0..5000ms`);
      }
    }
  }

  if (a.kind === "page" && !a.target) errs.push("kind=page exige target");

  if (a.badge) {
    if (typeof a.badge !== "object") errs.push("badge não é objeto");
    else if (!a.badge.source) errs.push("badge exige source");
    else if (a.badge.format && !VALID_BADGE_FORMATS.has(a.badge.format))
      errs.push(`badge.format inválido: ${a.badge.format}`);
  }

  if (a.hold && all.length && !all.some((x) => x.id === a.hold))
    errs.push(`hold aponta para ação inexistente: ${a.hold}`);

  return errs;
}

/**
 * Monta a lista final: as embutidas mais as do deck.config.json.
 * Uma ação do usuário com id já existente SUBSTITUI a embutida — é assim que
 * se troca o mapeamento de teclas sem editar código.
 */
function build(extra = [], onWarn = () => {}) {
  const byId = new Map();
  for (const a of BASE_ACTIONS) byId.set(a.id, { ...a });

  for (const raw of extra) {
    if (!raw || typeof raw !== "object") {
      onWarn("ação ignorada: não é um objeto");
      continue;
    }
    const merged = byId.has(raw.id) ? { ...byId.get(raw.id), ...raw } : { ...raw };
    const errs = validate(merged);
    if (errs.length) {
      onWarn(`ação "${raw.id}" ignorada: ${errs.join("; ")}`);
      continue;
    }
    byId.set(merged.id, merged);
  }

  const list = [...byId.values()];

  // Segunda passada: `hold` e os passos de `chain` só podem ser conferidos
  // com a lista inteira montada. Referência quebrada é desarmada em vez de
  // derrubar o deck — um botão a menos é melhor que um painel que não sobe.
  for (const a of list) {
    if (a.hold && !byId.has(a.hold)) {
      onWarn(`ação "${a.id}": hold aponta para "${a.hold}", que não existe — toque longo desativado`);
      delete a.hold;
    }
    if (a.kind === "chain") {
      const quebrado = a.steps.find((s) => s.action && !byId.has(s.action));
      if (quebrado) {
        onWarn(`ação "${a.id}": passo aponta para "${quebrado.action}", que não existe — ação removida`);
        byId.delete(a.id);
        continue;
      }
      // Sequência de sequências viraria recursão. O servidor já barra em
      // tempo de execução, mas recusar aqui dá o aviso antes de você tocar.
      const aninhada = a.steps.find((s) => s.action && byId.get(s.action).kind === "chain");
      if (aninhada) {
        onWarn(`ação "${a.id}": passo "${aninhada.action}" também é uma sequência — ação removida`);
        byId.delete(a.id);
      }
    }
  }

  return [...byId.values()];
}

/**
 * Projeção segura para o cliente: nunca expõe `keys`, `text` nem os passos
 * de uma chain. O cliente só conhece o `id` — é por isso que uma requisição
 * forjada não escolhe o que vai ser digitado, só qual botão apertar.
 */
function toPublic(actions) {
  return actions.map((a) => ({
    id: a.id,
    label: a.label,
    hint: a.hint || null,
    page: a.page || "main",
    group: a.group || "control",
    tone: a.tone || "neutral",
    icon: a.icon || "dot",
    kind: a.kind,
    confirm: !!a.confirm,
    hold: a.hold || null,
  }));
}

module.exports = { BASE_ACTIONS, APPROVAL_KEYS, build, validate, toPublic };
