/*
  A galeria de artes prontas (23/09/2026, pedido do dono): artes de volta inteira que ele sobe pelo
  painel (aba Artes prontas). Moram no banco (pm_arte_categorias e pm_artes) e no bucket panda-mimo,
  fora do repositório, porque a galeria vai crescer para milhares de artes e cada lote não pode
  depender de publicação. O estúdio lê só as publicadas e as mostra no cardápio de ocasiões, depois
  dos modelos da casa. Sem banco, ou sem resposta dele, a galeria só não aparece: os modelos da casa
  não dependem dela.
*/
export const PREFIXO_DA_GALERIA = 'galeria:';

const VAZIA = Object.freeze({ categorias: [], artes: [] });
let pedido = null;

const config = () => (typeof window !== 'undefined' ? window.PANDA_CONFIG : null);
const urlPublica = (cfg, caminho) => `${cfg.URL}/storage/v1/object/public/${cfg.BUCKET}/${caminho}`;

/** As categorias ativas e as artes publicadas, pedidas uma vez por página. */
export function carregaGaleria() {
  if (pedido) return pedido;
  const cfg = config();
  if (!cfg?.URL || !cfg?.CHAVE || !cfg?.BUCKET || typeof fetch !== 'function') return (pedido = Promise.resolve(VAZIA));
  const cabecalho = { apikey: cfg.CHAVE, Authorization: `Bearer ${cfg.CHAVE}` };
  const pega = (consulta) => fetch(`${cfg.URL}/rest/v1/${consulta}`, { headers: cabecalho })
    .then((resposta) => (resposta.ok ? resposta.json() : []))
    .then((dados) => (Array.isArray(dados) ? dados : []));
  pedido = Promise.all([
    pega('pm_arte_categorias?select=id,nome,grupo,descricao,ordem&ativo=eq.true&order=ordem'),
    pega('pm_artes?select=id,categoria_id,tambem_em,nome,descricao,peca,arquivo,miniatura,largura,altura,ordem&publicado=eq.true&order=ordem'),
  ]).then(([categorias, artes]) => ({
    // Só entra o que tem a forma certa: uma resposta estranha não pode virar ocasião no cardápio.
    categorias: categorias.filter((c) => c && ['id', 'nome', 'grupo'].every((campo) => typeof c[campo] === 'string' && c[campo])),
    artes: artes.filter((a) => a && ['id', 'categoria_id', 'nome', 'peca', 'arquivo', 'miniatura'].every((campo) => typeof a[campo] === 'string' && a[campo])).map((arte) => ({
      ...arte,
      tambem_em: Array.isArray(arte.tambem_em) ? arte.tambem_em : [],
      arquivoUrl: urlPublica(cfg, arte.arquivo),
      miniaturaUrl: urlPublica(cfg, arte.miniatura),
    })),
  })).catch(() => VAZIA);
  return pedido;
}

/** A arte inteira, como arquivo, pelo mesmo caminho de quem traz a arte pronta. */
export async function arquivoDaGaleria(arte) {
  const resposta = await fetch(arte.arquivoUrl);
  if (!resposta.ok) throw new Error('Não consegui abrir essa arte agora. Tente de novo em instantes.');
  const blob = await resposta.blob();
  return new File([blob], `${arte.nome}.webp`, { type: blob.type || 'image/webp' });
}
