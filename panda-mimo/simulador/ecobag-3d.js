import * as THREE from '../vendor/three/three.module.js';
import { ESPECIFICACOES, CORES_DA_ECOBAG } from './pecas.js';

/**
 * A ecobag de algodão cru: modelo paramétrico de referência (pecas.js), não a medição de uma peça do
 * fornecedor. Painel da frente e de trás de 35 × 40 cm, fole de 9 cm dos lados e no fundo, bainha no
 * alto e duas alças de fita em arco, como nas fotos do catálogo (`prod-ecobag-*.webp`).
 *
 * É a primeira peça plana: a arte não dá a volta. O painel da frente recebe a textura inteira (a largura
 * e a altura dele são a `widthMm` e a `heightMm` da peça), com a área de 25 × 30 cm no meio. A frente
 * olha para -Z, como nas outras peças; u cresce da esquerda para a direita de quem olha, v de baixo
 * para cima. A trama do tecido entra como relevo em todos os painéis, por cima da arte também: a
 * estampa parece impressa no pano, e não colada.
 * Uma unidade da cena são 50 mm.
 */
const SPEC = ESPECIFICACOES.ecobag;
const mm = (valor) => valor / 50;
const LARGURA = mm(SPEC.widthMm);
const ALTURA = mm(SPEC.heightMm);
const FOLE = mm(90);
const BARRIGA = mm(12);     // quanto o painel estufa no meio, como pano cheio de ar
const DOBRA_DO_FOLE = mm(26); // quanto o fole entra para dentro no alto, onde a boca se fecha
const CRU = CORES_DA_ECOBAG.cru;

/** A trama do algodão cru: fios claros e escuros cruzados, repetidos, só como relevo. */
function tramaDoTecido() {
  const lado = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = lado;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, lado, lado);
  const fio = lado / 16;
  for (let i = 0; i < 16; i += 1) {
    for (let j = 0; j < 16; j += 1) {
      // Por cima e por baixo, alternando: é o que dá ao pano o desenho de cesto miúdo.
      const porCima = (i + j) % 2 === 0;
      ctx.fillStyle = porCima ? '#a8a8a8' : '#5c5c5c';
      ctx.fillRect(i * fio + 0.5, j * fio + 0.5, fio - 1, fio - 1);
    }
  }
  const textura = new THREE.CanvasTexture(canvas);
  textura.wrapS = textura.wrapT = THREE.RepeatWrapping;
  return textura;
}

/**
 * Um painel de pano: plano subdividido que estufa no meio e fica reto nas bordas costuradas. `dobra`
 * puxa o alto do meio para dentro, em V, como o fole de ecobag quando a boca se fecha.
 */
function painel(largura, altura, barriga, { colunas = 40, linhas = 48, dobra = 0 } = {}) {
  const geometria = new THREE.PlaneGeometry(largura, altura, colunas, linhas);
  const posicao = geometria.attributes.position;
  for (let i = 0; i < posicao.count; i += 1) {
    const s = posicao.getX(i) / largura + 0.5;
    const t = posicao.getY(i) / altura + 0.5;
    // A boca da sacola fica mais solta: o pano estufa menos no alto e mais embaixo, onde pesa.
    const estufa = Math.sin(Math.PI * s) * Math.sin(Math.PI * Math.min(1, t * 1.08)) * (1 - 0.35 * t);
    const vinco = dobra * Math.max(0, (t - 0.62) / 0.38) ** 1.4 * (1 - Math.abs(2 * s - 1));
    posicao.setZ(i, barriga * estufa - vinco);
  }
  geometria.computeVertexNormals();
  return geometria;
}

/** Uma alça: fita chata que sai do alto do painel e faz um arco por cima da boca da sacola. */
function alcaGeometry() {
  const v = (x, y) => new THREE.Vector3(mm(x), mm(y), 0);
  const topo = SPEC.heightMm;
  const curva = new THREE.CatmullRomCurve3([
    v(-80, topo - 55), v(-80, topo), v(-72, topo + 110), v(-40, topo + 215), v(0, topo + 250),
    v(40, topo + 215), v(72, topo + 110), v(80, topo), v(80, topo - 55),
  ], false, 'centripetal');
  const passos = 140, lados = 16;
  const meiaLargura = mm(15), meiaEspessura = mm(1.6);
  const positions = [], indices = [];
  const binormal = new THREE.Vector3(0, 0, 1);
  const normal = new THREE.Vector3();
  for (let i = 0; i <= passos; i += 1) {
    const t = i / passos;
    const p = curva.getPointAt(t);
    const tangente = curva.getTangentAt(t);
    normal.crossVectors(binormal, tangente).normalize();
    for (let j = 0; j <= lados; j += 1) {
      const a = (j / lados) * Math.PI * 2;
      const c = Math.cos(a), s = Math.sin(a);
      // A fita é larga e fina e fica deitada no painel: a face larga olha para quem vê a frente.
      const x = Math.sign(c) * Math.abs(c) ** 0.35 * meiaLargura;
      const z = Math.sign(s) * Math.abs(s) ** 0.35 * meiaEspessura;
      positions.push(p.x + normal.x * x, p.y + normal.y * x, z);
      if (i < passos && j < lados) {
        const q = i * (lados + 1) + j, r = q + lados + 1;
        indices.push(q, r, q + 1, q + 1, r, r + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function algodao(cor, trama, extra = {}) {
  // Algodão cru: fosco, sem brilho nenhum, com o relevo da trama.
  return new THREE.MeshStandardMaterial({ color: cor, roughness: 0.94, metalness: 0, bumpMap: trama, bumpScale: 0.6, envMapIntensity: 1, ...extra });
}

function montaEcobag() {
  const trama = tramaDoTecido();
  // A trama repete a cada 1,5 cm: 16 fios nesse espaço, como a lona de algodão.
  const tramaDoPainel = trama.clone();
  tramaDoPainel.repeat.set(SPEC.widthMm / 15, SPEC.heightMm / 15);
  tramaDoPainel.needsUpdate = true;
  const tramaDoFole = trama.clone();
  tramaDoFole.repeat.set(90 / 15, SPEC.heightMm / 15);
  tramaDoFole.needsUpdate = true;
  // A arte já vem desenhada sobre o cru (a textura traz a cor do pano); o material do painel fica branco.
  const frenteMaterial = algodao('#ffffff', tramaDoPainel);
  const pano = algodao(CRU, tramaDoPainel, { side: THREE.DoubleSide });
  const fole = algodao(CRU, tramaDoFole, { side: THREE.DoubleSide });
  const avesso = algodao(CRU, tramaDoPainel);
  avesso.color.offsetHSL(0, 0, -0.06);
  const fita = algodao(CRU, trama.clone());
  fita.bumpMap.repeat.set(12, 1);
  fita.bumpMap.needsUpdate = true;
  const costura = new THREE.MeshStandardMaterial({ color: CRU, roughness: 0.96, metalness: 0 });
  costura.color.offsetHSL(0, 0.02, -0.12);

  const ecobag = new THREE.Group();
  const junta = (nome, geometria, material, posicao, giro = 0) => {
    const malha = new THREE.Mesh(geometria, material);
    malha.name = nome;
    malha.position.set(...posicao);
    malha.rotation.y = giro;
    malha.castShadow = malha.receiveShadow = true;
    ecobag.add(malha);
    return malha;
  };
  // A frente olha para -Z. O plano nasce olhando +Z; girado meia volta, o u dele cresce da esquerda
  // para a direita de quem olha de frente, que é como a arte tem de ler.
  const frente = junta('Frente da ecobag, com a arte', painel(LARGURA, ALTURA, BARRIGA), frenteMaterial, [0, ALTURA / 2, -FOLE / 2], Math.PI);
  // O avesso da frente, por dentro: sem ele, quem olha pela boca veria a arte espelhada.
  junta('Avesso da frente', painel(LARGURA, ALTURA, BARRIGA * 0.9), avesso, [0, ALTURA / 2, -FOLE / 2 + mm(0.8)], 0);
  junta('Costas da ecobag', painel(LARGURA, ALTURA, BARRIGA), pano, [0, ALTURA / 2, FOLE / 2], 0);
  junta('Fole esquerdo', painel(FOLE, ALTURA, mm(2), { colunas: 10, dobra: DOBRA_DO_FOLE }), fole, [LARGURA / 2, ALTURA / 2, 0], Math.PI / 2);
  junta('Fole direito', painel(FOLE, ALTURA, mm(2), { colunas: 10, dobra: DOBRA_DO_FOLE }), fole, [-LARGURA / 2, ALTURA / 2, 0], -Math.PI / 2);
  const fundo = junta('Fundo', new THREE.PlaneGeometry(LARGURA, FOLE), pano, [0, mm(0.6), 0]);
  fundo.rotation.x = Math.PI / 2;
  // A bainha: uma costura de ponta a ponta a 2,5 cm da boca, na frente e nas costas.
  for (const [lado, z] of [['da frente', -FOLE / 2 - BARRIGA * 0.12 - mm(0.4)], ['das costas', FOLE / 2 + BARRIGA * 0.12 + mm(0.4)]]) {
    junta(`Bainha ${lado}`, new THREE.BoxGeometry(LARGURA * 0.995, mm(1.4), mm(0.6)), costura, [0, ALTURA - mm(25), z]);
  }
  // As alças, uma presa na frente e uma nas costas, rentes ao pano.
  junta('Alça da frente', alcaGeometry(), fita, [0, 0, -FOLE / 2 - mm(2.2)]);
  junta('Alça das costas', alcaGeometry(), fita, [0, 0, FOLE / 2 + mm(2.2)]);

  return {
    grupo: ecobag,
    superficie: frente,
    exterior: frenteMaterial,
    // A arte da ecobag vai só na frente: onde quer que a pessoa olhe, o item novo nasce no meio dela.
    uVisivel: () => 0.5,
  };
}

// A frente olha para -Z, como nas outras peças.
const VISTAS = Object.freeze({
  front: { theta: Math.PI + 0.015, phi: 1.42 },
  back: { theta: 0.015, phi: 1.42 },
  handle: { theta: Math.PI / 2 + 0.55, phi: 1.34 },
  inside: { theta: Math.PI + 0.12, phi: 0.62 },
});

export const FORMA_DA_ECOBAG = Object.freeze({
  id: 'ecobag',
  rotulo: 'Ecobag em três dimensões. Use as setas para girar, e mais e menos para aproximar. Os botões de vista levam direto a cada lado.',
  alvo: [0, mm(335), 0],
  vistas: VISTAS,
  // A sacola inteira em pé, com as alças em arco e a sombra.
  enquadramento: { altura: mm(800), largura: mm(460), minimo: 20 },
  folgas: { estudio: 1, madeira: 1.06, linho: 1.06, presente: 1.2 },
  caixa: { lado: 8.2, altura: 0.7 },
  sombra: { alvoY: 5, extensao: 9.5, contato: [9.4, 3.6] },
  monta: montaEcobag,
});
