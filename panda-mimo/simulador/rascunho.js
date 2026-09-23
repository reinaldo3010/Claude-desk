/**
 * Rascunho do estúdio: o que a pessoa está montando fica guardado no próprio aparelho,
 * para ela não perder o trabalho se fechar a aba sem querer.
 *
 * Fica no IndexedDB do navegador, que aguenta as fotos (o localStorage não aguentaria).
 * Nada sai daqui: é o mesmo lugar onde o navegador guarda os dados de qualquer site, e a
 * pessoa pode apagar quando quiser, pelo botão "Começar do zero" ou limpando os dados.
 */
const BANCO = 'panda-mimo-caneca';
const CAIXA = 'rascunho';
// Um rascunho por peça. O da caneca continua na chave de sempre, para quem já tinha um não perder.
const CHAVE = 'atual';
const CHAVES = Object.freeze({ caneca: CHAVE, garrafa: 'garrafa', ecobag: 'ecobag' });
const chaveDa = (peca) => CHAVES[peca] || CHAVE;
const DIAS_DE_VALIDADE = 30;

function abre() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB !== 'object' || !indexedDB) { reject(new Error('sem IndexedDB')); return; }
    const pedido = indexedDB.open(BANCO, 1);
    pedido.onupgradeneeded = () => {
      const banco = pedido.result;
      if (!banco.objectStoreNames.contains(CAIXA)) banco.createObjectStore(CAIXA);
    };
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error || new Error('não abriu'));
  });
}

function transacao(banco, modo, acao) {
  return new Promise((resolve, reject) => {
    const tx = banco.transaction(CAIXA, modo);
    const caixa = tx.objectStore(CAIXA);
    const pedido = acao(caixa);
    tx.oncomplete = () => resolve(pedido?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function salvaRascunho(dados, peca = 'caneca') {
  try {
    const banco = await abre();
    await transacao(banco, 'readwrite', (caixa) => caixa.put({ ...dados, salvoEm: Date.now() }, chaveDa(peca)));
    banco.close();
    return true;
  } catch {
    return false;
  }
}

const valeAinda = (guardado) => guardado?.salvoEm && (Date.now() - guardado.salvoEm) / 86400000 <= DIAS_DE_VALIDADE;

/**
 * Devolve o rascunho mais recente entre as peças, ou null se não houver, se for velho demais ou se
 * der errado. O da caneca de antes das outras peças não diz a peça: `peca` sai como caneca.
 */
export async function leRascunho() {
  try {
    const banco = await abre();
    const guardados = [];
    for (const [peca, chave] of Object.entries(CHAVES)) {
      // eslint-disable-next-line no-await-in-loop
      const guardado = await transacao(banco, 'readonly', (caixa) => caixa.get(chave));
      if (valeAinda(guardado)) guardados.push({ peca, ...guardado });
    }
    banco.close();
    return guardados.sort((a, b) => b.salvoEm - a.salvoEm)[0] || null;
  } catch {
    return null;
  }
}

export async function apagaRascunho(peca = 'caneca') {
  try {
    const banco = await abre();
    await transacao(banco, 'readwrite', (caixa) => caixa.delete(chaveDa(peca)));
    banco.close();
    return true;
  } catch {
    return false;
  }
}

/** "hoje às 14h32", "ontem às 9h05" ou a data curta, para o aviso ficar em português de gente. */
export function quandoFoi(momento) {
  const data = new Date(momento);
  const hora = `${String(data.getHours()).padStart(2, '0')}h${String(data.getMinutes()).padStart(2, '0')}`;
  const hoje = new Date();
  const mesmoDia = (a, b) => a.toDateString() === b.toDateString();
  if (mesmoDia(data, hoje)) return `hoje às ${hora}`;
  const ontem = new Date(hoje.getTime() - 86400000);
  if (mesmoDia(data, ontem)) return `ontem às ${hora}`;
  return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')} às ${hora}`;
}
