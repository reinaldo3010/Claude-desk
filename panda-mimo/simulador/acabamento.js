/** Acabamento dos modelos existentes; não altera IDs nem o contrato de edição. */
export function acabamentoPapelaria(modelo) {
  return {
    ...modelo,
    enfeites: modelo.enfeites ? {
      ...modelo.enfeites,
      quantidade: Math.max(6, Math.round(modelo.enfeites.quantidade * 0.45)),
      cores: ['--sand', '--sage', '--peach'],
      tamanho: modelo.enfeites.tamanho.map((n) => Number((n * 0.7).toFixed(2))),
    } : modelo.enfeites,
    camadas: modelo.camadas.map((camada) => camada.tipo === 'frase' ? {
      ...camada,
      fonte: camada.fonte === 'Fredoka' ? 'Nunito' : camada.fonte,
      cor: camada.cor === '--ink' ? '--ink-soft' : camada.cor,
      rotacao: 0,
    } : camada),
  };
}
