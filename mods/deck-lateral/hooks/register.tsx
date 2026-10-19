/**
 * Mini Claude Deck — o deck de parede, encolhido para caber ao lado do chat.
 *
 * Mesma ideia do painel do tablet: a marca do Claude é o indicador de estado.
 * O jeito como ela se move É o estado — ocioso respira, trabalhando uma onda
 * percorre os raios, esperando você ela pulsa em vermelho, erro fica âmbar.
 *
 * Diferença importante do deck do tablet: aqui a quota vem direto do motor
 * (`$.session.usage()` e o evento `session.measure`), então não depende da
 * statusLine — que nunca soubemos se roda no app desktop.
 */
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Estado, Quota, Status } from '../types'

const PAINEL = 'deck-lateral'

const COR = {
  claude: '#D97757',
  claudeAceso: '#EC9271',
  verde: '#4FB286',
  ambar: '#E3A44F',
  alerta: '#FF3B30',
  apagado: '#6C665E',
} as const

const estadoInicial: Estado = {
  status: 'ocioso',
  manchete: 'Pronto',
  detalhe: null,
  ferramenta: null,
  desde: 0,
}
const quotaInicial: Quota = {
  cinco: null, cincoReseta: null, sete: null, seteReseta: null, contexto: null, custo: null,
}

const estado = atom({ plugin: 'deck-lateral', key: 'estado' } as const, estadoInicial)
const quota = atom({ plugin: 'deck-lateral', key: 'quota' } as const, quotaInicial)
const quadro = atom({ plugin: 'deck-lateral', key: 'quadro' } as const, 0)

/* ── a marca ───────────────────────────────────────────────────────────────
   Oito raios em volta de um núcleo, desenhados em células de texto: é o que
   um painel de terminal consegue sem imagem. Cada célula sabe a qual raio
   pertence, e a cor de cada raio sai do estado e do quadro da animação. */

type Celula = { c: string; raio: number | null }

const DESENHO: string[] = [
  '\\   |   /',
  ' \\  |  / ',
  '──  ✻  ──',
  ' /  |  \\ ',
  '/   |   \\',
]
/* Raio de cada célula, em sentido horário a partir do de cima. -1 é o núcleo. */
const RAIOS: (number | null)[][] = [
  [7, null, null, null, 0, null, null, null, 1],
  [null, 7, null, null, 0, null, null, 1, null],
  [6, 6, null, null, -1, null, null, 2, 2],
  [null, 5, null, null, 4, null, null, 3, null],
  [5, null, null, null, 4, null, null, null, 3],
]

function marca(): Celula[][] {
  return DESENHO.map((linha, y) =>
    [...linha].map((c, x) => ({ c, raio: RAIOS[y]?.[x] ?? null })),
  )
}

/** Cor de um raio neste quadro. Devolve [cor, apagado?]. */
function corDoRaio(status: Status, raio: number, f: number): [string, boolean] {
  if (raio === -1) {
    const cor = status === 'esperando' ? COR.alerta : status === 'erro' ? COR.ambar : COR.claude
    return [cor, false]
  }
  switch (status) {
    case 'trabalhando': {
      // A onda: o raio da vez acende forte, o anterior meio, o resto apagado.
      const d = (f - raio + 64) % 8
      if (d === 0) return [COR.claudeAceso, false]
      if (d === 1) return [COR.claude, false]
      return [COR.claude, true]
    }
    case 'esperando':
      // O conjunto inteiro pisca: aceso num quadro, meio no outro.
      return [COR.alerta, f % 2 === 1]
    case 'erro':
      return [COR.ambar, false]
    default:
      // Respiração: tudo aceso, com um quadro em quatro mais fraco.
      return [COR.claude, f % 4 === 3]
  }
}

/* ── formatação ───────────────────────────────────────────────────────── */

function barra(pct: number, largura: number): [string, string] {
  const cheio = Math.max(0, Math.min(largura, Math.round((pct / 100) * largura)))
  return ['█'.repeat(cheio), '░'.repeat(largura - cheio)]
}

function corDaQuota(pct: number): string {
  return pct >= 85 ? COR.alerta : pct >= 60 ? COR.ambar : COR.verde
}

function quantoFalta(iso: string | null, agora: number): string | null {
  if (!iso) return null
  const alvo = Date.parse(iso)
  if (Number.isNaN(alvo)) return null
  const min = Math.max(0, Math.round((alvo - agora) / 60_000))
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h${String(min % 60).padStart(2, '0')}`
  return `${Math.floor(h / 24)}d ${h % 24}h`
}

function duracao(ms: number): string {
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}min ${s % 60}s`
}

/* ── estado ───────────────────────────────────────────────────────────── */

async function mudar($: EngineInterface, novo: Partial<Estado>) {
  const agora = await $.clock.now()
  await update($, estado, (atual: Estado) => {
    const status = novo.status ?? atual.status
    return { ...atual, ...novo, desde: status !== atual.status ? agora : atual.desde }
  })
}

function lerQuota(rateLimits: { kind: string; percentUsed: number; resetsAt?: string }[]) {
  const cinco = rateLimits.find(r => r.kind === 'five_hour')
  const sete = rateLimits.find(r => r.kind === 'seven_day')
  return {
    cinco: cinco ? cinco.percentUsed : null,
    cincoReseta: cinco?.resetsAt ?? null,
    sete: sete ? sete.percentUsed : null,
    seteReseta: sete?.resetsAt ?? null,
  }
}

/* Os hooks abaixo só observam. Se o desenho falhar, o `.catch` deixa o motor
   seguir como se o painel não existisse: um painel quebrado nunca pode
   impedir uma ferramenta de rodar, nem mudar a decisão de permissão. */
export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'deck',
      description: 'Abre o deck lateral ao lado do chat',
    })
    void $.ui.open({ id: PAINEL, title: 'Claude Deck' })

    try {
      const u = await $.session.usage()
      await update($, quota, q => ({
        ...q,
        ...lerQuota(u.rateLimits),
        contexto: u.context.percent ?? null,
        custo: u.cost?.usd ?? null,
      }))
    } catch { /* sem leitura ainda: os medidores mostram -- */ }

    /* A animação é um contador que só anda. O desenho lê o contador e o estado
       e decide sozinho o que acende — por isso um timer só serve a todos. */
    $.clock.every(180, () => {
      void (async () => {
        const s = (await read($, estado)).status
        if (s === 'trabalhando' || s === 'esperando') {
          await update($, quadro, f => (f + 1) % 4096)
        } else {
          // Ocioso e erro andam mais devagar: respiração, não alarme.
          const f = await read($, quadro)
          if ((await $.clock.now()) % 900 < 180) await update($, quadro, () => (f + 1) % 4096)
        }
      })()
    })

    return next(e)
  })

  on('command.run', { command: 'deck' }, async $ => {
    await $.ui.open({ id: PAINEL, title: 'Claude Deck' })
    return { text: 'Deck lateral aberto.' }
  })

  on('prompt.submit', async ($, e, next) => {
    await mudar($, { status: 'trabalhando', manchete: 'Claude trabalhando', detalhe: 'pensando', ferramenta: null })
    return next(e)
  }).catch(($, e, next) => next(e))

  /* "Esperando você" é o momento em que o motor decide te perguntar. O
     veredito sai de `tool.check`; só observamos, nunca decidimos. */
  on('tool.check', async ($, e, next) => {
    const veredito = await next(e)
    if (veredito.decision === 'ask' && !e.agentId) {
      await mudar($, {
        status: 'esperando',
        manchete: 'Claude está te esperando',
        detalhe: `quer usar ${e.tool}`,
        ferramenta: e.tool,
      })
    }
    return veredito
  }).catch(($, e, next) => next(e))

  on('tool.call', async ($, e, next) => {
    if (!e.agentId) {
      await mudar($, { status: 'trabalhando', manchete: 'Claude trabalhando', detalhe: 'usando ferramenta', ferramenta: e.tool })
    }
    const res = await next(e)
    if (!e.agentId) {
      await mudar($, { status: 'trabalhando', manchete: 'Claude trabalhando', detalhe: 'pensando', ferramenta: null })
    }
    return res
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    if (!e.agentId) {
      if (e.reason === 'error') {
        await mudar($, { status: 'erro', manchete: 'Algo deu errado', detalhe: 'o turno terminou com erro', ferramenta: null })
      } else if (e.reason === 'aborted') {
        await mudar($, { status: 'ocioso', manchete: 'Interrompido', detalhe: null, ferramenta: null })
      } else {
        await mudar($, { status: 'ocioso', manchete: 'Resposta pronta', detalhe: `em ${duracao(e.durationMs)}`, ferramenta: null })
      }
    }
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    let custo: number | null = null
    try { custo = (await $.session.usage()).cost?.usd ?? null } catch { /* fica o anterior */ }
    await update($, quota, q => ({
      ...q,
      ...lerQuota(e.rateLimits),
      contexto: e.context.percent ?? q.contexto,
      custo: custo ?? q.custo,
    }))
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PAINEL }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const est = await read($, estado)
    const q = await read($, quota)
    const f = await read($, quadro)
    const agora = await $.clock.now()

    const corManchete =
      est.status === 'esperando' ? COR.alerta : est.status === 'erro' ? COR.ambar : COR.claude

    const medidor = (rotulo: string, pct: number | null, reseta: string | null) => {
      if (pct == null) {
        return (
          <Box flexDirection="row">
            <Text dimColor>{rotulo.padEnd(8)}</Text>
            <Text dimColor>--</Text>
          </Box>
        )
      }
      const [cheio, vazio] = barra(pct, 14)
      const falta = quantoFalta(reseta, agora)
      return (
        <Box flexDirection="row">
          <Text dimColor>{rotulo.padEnd(8)}</Text>
          <Text color={corDaQuota(pct)}>{cheio}</Text>
          <Text dimColor>{vazio}</Text>
          <Text color={corDaQuota(pct)} bold>{` ${Math.round(pct)}%`}</Text>
          {falta && <Text dimColor>{` ↻${falta}`}</Text>}
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        <Box flexDirection="row">
          <Box flexDirection="column">
            {marca().map(linha => (
              <Box flexDirection="row">
                {linha.map(cel => {
                  if (cel.raio == null) return <Text>{cel.c}</Text>
                  const [cor, apagado] = corDoRaio(est.status, cel.raio, f)
                  return <Text color={cor} dimColor={apagado} bold={!apagado}>{cel.c}</Text>
                })}
              </Box>
            ))}
          </Box>
          <Box flexDirection="column" marginLeft={2}>
            <Text color={corManchete} bold>{est.manchete}</Text>
            {est.detalhe && <Text dimColor>{est.detalhe}</Text>}
            {est.ferramenta && <Text color={COR.claudeAceso}>{`▸ ${est.ferramenta}`}</Text>}
            {est.desde > 0 && est.status !== 'ocioso' && (
              <Text dimColor>{`há ${duracao(agora - est.desde)}`}</Text>
            )}
          </Box>
        </Box>
        <Box flexDirection="column" marginTop={1}>
          {medidor('5 horas', q.cinco, q.cincoReseta)}
          {medidor('semana', q.sete, q.seteReseta)}
          {medidor('contexto', q.contexto, null)}
          {q.custo != null && (
            <Box flexDirection="row">
              <Text dimColor>{'gasto'.padEnd(8)}</Text>
              <Text>{`US$ ${q.custo.toFixed(2)}`}</Text>
            </Box>
          )}
          {q.cinco == null && q.sete == null && (
            <Text dimColor>quota aparece após a primeira resposta (Pro/Max)</Text>
          )}
        </Box>
      </Box>
    )
  })
}
