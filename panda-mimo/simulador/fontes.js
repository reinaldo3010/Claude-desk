/**
 * Biblioteca de letras da arte da caneca.
 *
 * As três fontes da marca (manual, seção 8) já vêm com o site e valem para a interface.
 * As demais existem só para a arte que a pessoa monta: são todas de licença OFL, servidas do
 * nosso próprio endereço (nada de Google Fonts em página pública) e carregadas só quando alguém
 * abre a biblioteca ou usa uma arte que pede uma delas.
 *
 * Cada arquivo é o subconjunto latino, que cobre os acentos do português.
 */

export const FONTES_DA_ARTE = Object.freeze([
  { valor: 'Fredoka', nome: 'Redondinha', peso: 600, daMarca: true },
  { valor: 'Caveat', nome: 'Manuscrita', peso: 600, daMarca: true },
  { valor: 'Nunito', nome: 'Simples', peso: 600, daMarca: true },
  { valor: 'Lobster', nome: 'Letreiro', peso: 400, arquivo: 'assets/fontes/arte/lobster.woff2' },
  { valor: 'Pacifico', nome: 'Retrô', peso: 400, arquivo: 'assets/fontes/arte/pacifico.woff2' },
  { valor: 'Dancing Script', nome: 'Cursiva', peso: 700, arquivo: 'assets/fontes/arte/dancing-script.woff2' },
  { valor: 'Great Vibes', nome: 'Caligrafia', peso: 400, arquivo: 'assets/fontes/arte/great-vibes.woff2' },
  { valor: 'Playfair Display', nome: 'Elegante', peso: 700, arquivo: 'assets/fontes/arte/playfair-display.woff2' },
  { valor: 'Cinzel', nome: 'Clássica', peso: 600, arquivo: 'assets/fontes/arte/cinzel.woff2' },
  { valor: 'Bebas Neue', nome: 'Caixa alta', peso: 400, arquivo: 'assets/fontes/arte/bebas-neue.woff2' },
  { valor: 'Amatic SC', nome: 'Fininha', peso: 700, arquivo: 'assets/fontes/arte/amatic-sc.woff2' },
  { valor: 'Patrick Hand', nome: 'Bilhetinho', peso: 400, arquivo: 'assets/fontes/arte/patrick-hand.woff2' },
  { valor: 'Indie Flower', nome: 'Rabisco', peso: 400, arquivo: 'assets/fontes/arte/indie-flower.woff2' },
  { valor: 'Baloo 2', nome: 'Gordinha', peso: 700, arquivo: 'assets/fontes/arte/baloo-2.woff2' },
  { valor: 'Poppins', nome: 'Moderninha', peso: 600, arquivo: 'assets/fontes/arte/poppins.woff2' },
]);

const PESOS = new Map(FONTES_DA_ARTE.map((f) => [f.valor, f.peso]));
const ARQUIVOS = new Map(FONTES_DA_ARTE.filter((f) => f.arquivo).map((f) => [f.valor, f]));
const carregadas = new Map();

/** O peso com que cada família foi feita: usar outro força negrito falso e estraga o traço. */
export const pesoDaFonte = (familia) => PESOS.get(familia) || 600;

export const fontePorValor = (familia) => FONTES_DA_ARTE.find((f) => f.valor === familia) || null;

/** Só o que a marca usa; o resto é da arte de quem monta. */
export const ehFonteDaMarca = (familia) => Boolean(fontePorValor(familia)?.daMarca);

/**
 * Carrega as famílias pedidas (ou a biblioteca inteira) do nosso próprio endereço.
 * Quem chama espera a promessa antes de desenhar, senão o navegador mede a letra errada.
 */
export function carregaFontes(familias) {
  const alvo = (familias ? [...new Set(familias)] : [...ARQUIVOS.keys()]).filter((nome) => ARQUIVOS.has(nome));
  return Promise.all(alvo.map((nome) => {
    if (carregadas.has(nome)) return carregadas.get(nome);
    const item = ARQUIVOS.get(nome);
    const promessa = (async () => {
      if (typeof FontFace !== 'function' || !document?.fonts) return false;
      const face = new FontFace(nome, `url(${item.arquivo}) format('woff2')`, { weight: String(item.peso), style: 'normal', display: 'swap' });
      await face.load();
      document.fonts.add(face);
      return true;
    })().catch((erro) => {
      // Sem a letra escolhida, o navegador usa a de reserva: a arte continua, o aviso fica no console.
      console.warn(`A letra ${nome} não carregou: ${erro.message}`);
      return false;
    });
    carregadas.set(nome, promessa);
    return promessa;
  }));
}
