export type Status = 'ocioso' | 'trabalhando' | 'esperando' | 'erro'

export type Estado = {
  status: Status
  manchete: string
  detalhe: string | null
  ferramenta: string | null
  desde: number
}

export type Quota = {
  cinco: number | null
  cincoReseta: string | null
  sete: number | null
  seteReseta: string | null
  contexto: number | null
  custo: number | null
}

declare module 'claude-code' {
  interface PluginState {
    'deck-lateral': { estado: Estado; quota: Quota; quadro: number }
  }
}
