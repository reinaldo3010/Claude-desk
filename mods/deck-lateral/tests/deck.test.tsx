import { expect, test } from 'claude-code/testing'

const PAINEL = {
  plugin: 'deck-lateral',
  component: 'Pane',
  requestId: 'deck-lateral',
  props: {
    title: 'Claude Deck',
    isFocused: false,
    bodyColumns: 48,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 20 },
    view: {},
  },
} as const

const SUPERFICIES = ['terminal', 'desktop'] as const

/** O motor, nos pontos que o deck toca. Nada fica abaixo do plugin num teste. */
function motor(on: any, decisao: 'allow' | 'ask') {
  on('clock.now', () => ({ value: 1_000_000 }))
  on('clock.every', () => ({ value: { cancel() {} } }))
  on('command.register', () => ({ value: { command: 'deck' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('session.usage', () => ({
    value: {
      startedAt: 0,
      context: { window: 200000, percent: 42 },
      rateLimits: [
        { kind: 'five_hour', percentUsed: 72.6 },
        { kind: 'seven_day', percentUsed: 41.2 },
      ],
      cost: { usd: 3.91 },
    },
  }))
  on('tool.check', () => ({ decision }))
  on('tool.call', () => ({ result: {} }))
  const decision = decisao
}

test('a quota chega pelo motor, sem statusLine', async ($, on) => {
  motor(on, 'allow')
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const surface of SUPERFICIES) {
    const ui = await $.ui.mount({ ...PAINEL, surface })
    expect(await ui.find({ type: 'Text', text: /73%/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /41%/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /US\$ 3\.91/ })).toBeDefined()
    await ui.unmount()
  }
})

test('pedido de permissão vira "esperando você", e o deck não decide nada', async ($, on) => {
  motor(on, 'ask')
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const veredito = await $.tool.check({ tool: 'Bash', input: { command: 'ls' } } as any)
  // O deck só observa: o veredito do motor passa intacto.
  expect(veredito.decision).toBe('ask')

  for (const surface of SUPERFICIES) {
    const ui = await $.ui.mount({ ...PAINEL, surface })
    expect(await ui.find({ type: 'Text', text: /te esperando/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /quer usar Bash/ })).toBeDefined()
    await ui.unmount()
  }
})

test('ferramenta em uso aparece enquanto roda e some depois', async ($, on) => {
  motor(on, 'allow')
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.tool.call({ tool: 'Bash', command: 'ls' } as any)

  for (const surface of SUPERFICIES) {
    const ui = await $.ui.mount({ ...PAINEL, surface })
    expect(await ui.find({ type: 'Text', text: /Claude trabalhando/ })).toBeDefined()
    // Terminou: o nome da ferramenta sai da tela.
    expect(await ui.find({ type: 'Text', text: /▸ Bash/ })).toBeUndefined()
    await ui.unmount()
  }
})
