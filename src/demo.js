"use strict";
/**
 * Modo demonstração.
 *
 * Sobe o painel com dados vivos sintéticos, para você ver e tocar tudo antes
 * de instalar hook nenhum. Duas garantias que fazem este modo existir:
 *
 *   1. Ele NÃO toca no seu `~/.claude/settings.json`, e não precisa que os
 *      hooks estejam instalados. Nada do Claude Code é alterado.
 *   2. O injetor é forçado para `dry`: nenhuma tecla sai do processo. Você
 *      pode apertar qualquer botão, inclusive "Aprovar", sem risco — não há
 *      Claude Code nenhum atrás. É a única forma de testar o portão de
 *      permissão sem apostar numa aprovação de verdade.
 *
 * O que ele NÃO é: uma maquete. Os dados entram pelo mesmo caminho que o
 * Claude Code real usa — snapshots gravados em disco no formato da statusLine,
 * e eventos passando pelo `store.ingest`. Quem resolve o deck, calcula a taxa
 * de queima e decide o que acende é o código de produção. Se algo estiver
 * quebrado, quebra aqui também.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

const PROJETOS = [
  { id: "demo-orcamento", cwd: "projetos/orcamento-obra", branch: "feat/planilha", modelo: "claude-opus-5" },
  { id: "demo-site", cwd: "projetos/site-institucional", branch: "main", modelo: "claude-sonnet-5" },
  { id: "demo-api", cwd: "projetos/api-pagamentos", branch: "fix/webhook", modelo: "claude-haiku-4-5-20251001" },
];

/** Diretório isolado: o modo demo nunca lê nem escreve nos snapshots reais. */
function criarCasa() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-deck-demo-"));
  fs.mkdirSync(path.join(dir, "sessions"), { recursive: true });
  return dir;
}

/** Grava um snapshot no mesmo formato que `bin/deck-statusline.js` gravaria. */
function snapshot(dir, proj, { cinco, sete, contexto, custo, ferramentas = 0 }) {
  const agora = Math.floor(Date.now() / 1000);
  const payload = {
    session_id: proj.id,
    version: "2.1.90",
    model: { id: proj.modelo, display_name: proj.modelo.split("-")[1] },
    workspace: { current_dir: path.join(os.homedir(), proj.cwd), repo: proj.cwd.split("/").pop() },

    context_window: { used_percentage: contexto },
    cost: { total_cost_usd: custo, total_lines_added: 214 + ferramentas * 9, total_lines_removed: 37 },
    prompt_cache: { hit_ratio: 0.78 },
    rate_limits: {
      five_hour: { used_percentage: cinco, resets_at: agora + 3 * 3600 },
      seven_day: { used_percentage: sete, resets_at: agora + 41 * 3600 },
    },
  };
  const arquivo = path.join(dir, "sessions", `${proj.id}.json`);
  /* Mesmo envelope que `bin/deck-statusline.js` grava: `payload` é o que o
     Claude Code entregaria, `deck` é o que a nossa statusLine descobre. */
  fs.writeFileSync(arquivo, JSON.stringify({
    at: Date.now(), pid: process.pid, payload, deck: { branch: proj.branch },
  }));
}

/**
 * O roteiro. Cada cena diz quantos segundos depois do início ela acontece.
 * Passa por todos os estados do painel, incluindo os dois que ninguém
 * consegue provocar de propósito na vida real: a permissão pendente e o erro.
 */
function roteiro(deck, dir, aviso) {
  const s = (n) => n * 1000;
  const [obra, site, api] = PROJETOS;
  const evento = (nome, extra = {}) => deck.store.ingest(nome, { cwd: path.join(os.homedir(), obra.cwd), ...extra });

  let quota = { cinco: 23.5, sete: 41.2, contexto: 18, custo: 0.42 };
  const atualizar = (proj, over = {}) => {
    quota = { ...quota, ...over };
    snapshot(dir, proj, quota);
  };

  return [
    { em: s(0), diz: "ocioso · uma sessão · quota tranquila", faz: () => {
      evento("SessionStart", { session_id: obra.id, permission_mode: "acceptEdits",
        effort: { level: "high" }, model: { id: obra.modelo } });
      atualizar(obra);
    }},
    { em: s(5), diz: "você manda um prompt · o Claude começa", faz: () => {
      evento("UserPromptSubmit", { session_id: obra.id, prompt: "refaz a planilha de custos com os índices novos" });
    }},
    { em: s(7), diz: "ferramenta em uso · a marca entra em onda", faz: () => {
      evento("PreToolUse", { session_id: obra.id, tool_name: "Bash", tool_input: { command: "npm test" } });
      atualizar(obra, { cinco: 31.8, contexto: 34, custo: 1.15 });
    }},
    { em: s(12), diz: "segunda sessão trabalhando · tecla de agente acende", faz: () => {
      deck.store.ingest("SessionStart", { session_id: site.id, cwd: path.join(os.homedir(), site.cwd),
        permission_mode: "default", model: { id: site.modelo } });
      deck.store.ingest("PreToolUse", { session_id: site.id, cwd: path.join(os.homedir(), site.cwd),
        tool_name: "Edit", tool_input: { file_path: "src/hero.tsx" } });
      snapshot(dir, site, { cinco: 31.8, sete: 41.2, contexto: 52, custo: 0.88 });
    }},
    { em: s(17), diz: "terceira sessão · ociosa", faz: () => {
      deck.store.ingest("SessionStart", { session_id: api.id, cwd: path.join(os.homedir(), api.cwd),
        permission_mode: "plan", model: { id: api.modelo } });
      snapshot(dir, api, { cinco: 31.8, sete: 41.2, contexto: 11, custo: 0.21 });
    }},
    { em: s(22), diz: "PERMISSÃO PENDENTE · toque em Aprovar ou Recusar, é seguro", faz: () => {
      const { promise } = deck.gate.open({
        session_id: obra.id,
        cwd: path.join(os.homedir(), obra.cwd),
        tool_name: "Bash",
        tool_input: { command: "rm -rf build/ && npm run build" },
      });
      promise.then((d) => {
        const rotulo = d && (d.decision || (d.hookSpecificOutput || {}).permissionDecision);
        aviso(rotulo ? `você respondeu: ${rotulo}` : "prazo esgotou — nenhuma decisão (o terminal perguntaria)");
      });
    }},
    { em: s(34), diz: "de volta ao trabalho · quota subindo", faz: () => {
      deck.gate.decide("allow", "demo");
      evento("PostToolUse", { session_id: obra.id, tool_name: "Bash" });
      evento("PreToolUse", { session_id: obra.id, tool_name: "Edit", tool_input: { file_path: "custos.xlsx" } });
      atualizar(obra, { cinco: 58.4, sete: 49.9, contexto: 61, custo: 2.74 });
    }},
    { em: s(40), diz: "quota em 72% · arcos em âmbar, Compactar avisa", faz: () => {
      atualizar(obra, { cinco: 72.6, sete: 63.1, contexto: 78, custo: 3.91 });
    }},
    { em: s(46), diz: "resposta pronta", faz: () => {
      evento("Stop", { session_id: obra.id });
      deck.store.ingest("Stop", { session_id: site.id, cwd: path.join(os.homedir(), site.cwd) });
    }},
    { em: s(51), diz: "O CLAUDE ESTÁ TE ESPERANDO · marca vermelha, painel em alerta", faz: () => {
      evento("Notification", { session_id: obra.id,
        message: "O Claude precisa da sua resposta para continuar" });
    }},
    { em: s(59), diz: "erro numa ferramenta", faz: () => {
      evento("PostToolUseFailure", { session_id: obra.id, tool_name: "Bash",
        error: "npm test falhou: 2 testes vermelhos" });
    }},
    { em: s(65), diz: "quota em 91% · arco vermelho e projeção de esgotamento", faz: () => {
      atualizar(obra, { cinco: 91.3, sete: 88.7, contexto: 84, custo: 5.62 });
    }},
    { em: s(72), diz: "tudo calmo · o roteiro reinicia", faz: () => {
      evento("Stop", { session_id: obra.id });
      atualizar(obra, { cinco: 23.5, sete: 41.2, contexto: 18, custo: 0.42 });
    }},
  ];
}

const DURACAO_MS = 78_000;

/**
 * Roda o roteiro em laço. Devolve uma função de encerramento que apaga o
 * diretório temporário.
 */
function iniciar(deck, dir, aviso) {
  const cenas = roteiro(deck, dir, aviso);
  const timers = [];

  const volta = () => {
    for (const cena of cenas) {
      timers.push(setTimeout(() => {
        aviso(cena.diz);
        try { cena.faz(); } catch (err) { aviso(`cena falhou: ${err.message}`); }
      }, cena.em));
    }
    timers.push(setTimeout(volta, DURACAO_MS));
  };
  volta();

  return function parar() {
    for (const t of timers) clearTimeout(t);
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* temporário, o SO limpa */ }
  };
}

module.exports = { criarCasa, iniciar, PROJETOS, DURACAO_MS };
