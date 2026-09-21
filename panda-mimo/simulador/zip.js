/**
 * Empacotador ZIP mínimo, sem compressão (método "armazenar").
 *
 * Serve para entregar num arquivo só as artes de um pedido com vários nomes. PNG já vem
 * comprimido, então guardar sem comprimir de novo não custa tamanho e evita trazer uma
 * biblioteca inteira para dentro do site.
 */

const codificador = new TextEncoder();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Data e hora no formato do ZIP (dois campos de 16 bits, resolução de dois segundos). */
function momento(data) {
  const hora = ((data.getHours() & 31) << 11) | ((data.getMinutes() & 63) << 5) | ((data.getSeconds() / 2) & 31);
  const dia = (((data.getFullYear() - 1980) & 127) << 9) | (((data.getMonth() + 1) & 15) << 5) | (data.getDate() & 31);
  return { hora, dia };
}

/**
 * @param {Array<{nome: string, dados: Uint8Array}>} arquivos
 * @returns {Blob} o pacote pronto para baixar
 */
export function fazZip(arquivos, quando = new Date()) {
  const { hora, dia } = momento(quando);
  const partes = [];
  const central = [];
  let posicao = 0;
  for (const arquivo of arquivos) {
    const nome = codificador.encode(arquivo.nome);
    const dados = arquivo.dados;
    const soma = crc32(dados);
    const cabecalho = new DataView(new ArrayBuffer(30));
    cabecalho.setUint32(0, 0x04034b50, true);
    cabecalho.setUint16(4, 20, true);
    cabecalho.setUint16(6, 0x0800, true); // nomes em UTF-8
    cabecalho.setUint16(8, 0, true); // sem compressão
    cabecalho.setUint16(10, hora, true);
    cabecalho.setUint16(12, dia, true);
    cabecalho.setUint32(14, soma, true);
    cabecalho.setUint32(18, dados.length, true);
    cabecalho.setUint32(22, dados.length, true);
    cabecalho.setUint16(26, nome.length, true);
    cabecalho.setUint16(28, 0, true);
    partes.push(new Uint8Array(cabecalho.buffer), nome, dados);

    const entrada = new DataView(new ArrayBuffer(46));
    entrada.setUint32(0, 0x02014b50, true);
    entrada.setUint16(4, 20, true);
    entrada.setUint16(6, 20, true);
    entrada.setUint16(8, 0x0800, true);
    entrada.setUint16(10, 0, true);
    entrada.setUint16(12, hora, true);
    entrada.setUint16(14, dia, true);
    entrada.setUint32(16, soma, true);
    entrada.setUint32(20, dados.length, true);
    entrada.setUint32(24, dados.length, true);
    entrada.setUint16(28, nome.length, true);
    entrada.setUint32(42, posicao, true);
    central.push(new Uint8Array(entrada.buffer), nome);
    posicao += 30 + nome.length + dados.length;
  }
  const tamanhoCentral = central.reduce((soma, parte) => soma + parte.length, 0);
  const fim = new DataView(new ArrayBuffer(22));
  fim.setUint32(0, 0x06054b50, true);
  fim.setUint16(8, arquivos.length, true);
  fim.setUint16(10, arquivos.length, true);
  fim.setUint32(12, tamanhoCentral, true);
  fim.setUint32(16, posicao, true);
  return new Blob([...partes, ...central, new Uint8Array(fim.buffer)], { type: 'application/zip' });
}
