import * as THREE from '../vendor/three/three.module.js';
import { point, bezierProfile, revolve } from './peca-3d.js';
import { ESPECIFICACOES } from './pecas.js';

/**
 * A garrafa térmica de 1 L: modelo paramétrico de referência (pecas.js), não a medição de uma peça do
 * fornecedor. Corpo de inox pintado, anel de aço no pescoço, tampa rosqueável com a parte de cima
 * escura e a alça de fita presa ao lado da tampa, como na foto do catálogo (`prod-garrafa.webp`).
 *
 * Mesma convenção da caneca: uma unidade da cena são 50 mm, a alça fica em +X (a emenda da arte, u=0,
 * fica atrás dela) e a frente (u=.25) em -Z. A arte cobre a parede reta: v=0 a 10 mm da base e v=1 a
 * 210 mm (a faixa de 200 mm de `heightMm`), com a área de 230 × 180 mm no meio dela. Fora da faixa, a
 * textura repete a própria borda, que é a cor da garrafa: base e ombro saem pintados como o corpo.
 */
const SPEC = ESPECIFICACOES.garrafa;
const mm = (valor) => valor / 50;
const TAU = Math.PI * 2;
const RAIO = mm(SPEC.diameterMm / 2);
const BASE_DA_ARTE = mm(10);
const ALTURA_DA_ARTE = mm(SPEC.heightMm);

/** O corpo inteiro, da base ao pescoço: fundo arredondado, parede reta e um ombro curto e macio. */
function corpoGeometry() {
  const perfil = [point(0, mm(0.6)), point(mm(33), mm(0.6))];
  // Quina de 7 mm entre o fundo e a parede.
  for (let i = 1; i <= 10; i += 1) {
    const a = -Math.PI / 2 + (i / 10) * Math.PI / 2;
    perfil.push(point(mm(33) + mm(7) * Math.cos(a), mm(7) + mm(7) * Math.sin(a)));
  }
  for (let y = 17; y <= 212; y += 15) perfil.push(point(RAIO, mm(Math.min(y, 212))));
  if (perfil.at(-1).y < mm(212)) perfil.push(point(RAIO, mm(212)));
  bezierProfile(perfil, perfil.at(-1), point(RAIO, mm(225)), point(mm(35), mm(232)), point(mm(31), mm(236.5)), 20);
  perfil.push(point(mm(24), mm(236.5)), point(0, mm(236.5)));
  return revolve(perfil, 192, Infinity, { alturaDaTextura: ALTURA_DA_ARTE, baseDaTextura: BASE_DA_ARTE });
}

/** O anel de aço entre o ombro e a tampa. */
function anelGeometry() {
  const perfil = [point(mm(29), mm(235.5)), point(mm(30.9), mm(235.8))];
  for (let y = 237; y <= 246; y += 3) perfil.push(point(mm(30.9), mm(y)));
  perfil.push(point(mm(29), mm(246.4)));
  return revolve(perfil, 144);
}

/** A tampa: a gola na cor da garrafa, com a quina arredondada em cima. */
function golaGeometry() {
  const perfil = [point(mm(29.5), mm(246)), point(mm(32.4), mm(246.4))];
  bezierProfile(perfil, perfil.at(-1), point(mm(32.9), mm(246.6)), point(mm(33), mm(247.4)), point(mm(33), mm(248.4)), 6);
  perfil.push(point(mm(33), mm(262)), point(mm(33), mm(273.5)));
  bezierProfile(perfil, perfil.at(-1), point(mm(33), mm(275.6)), point(mm(32.2), mm(276.4)), point(mm(30.4), mm(276.5)), 8);
  perfil.push(point(mm(28.6), mm(276.5)));
  return revolve(perfil, 160);
}

/** A parte de cima da tampa, escura, um pouco mais estreita que a gola. */
function topoGeometry() {
  const perfil = [point(mm(28.4), mm(276.2)), point(mm(29.6), mm(276.6))];
  perfil.push(point(mm(29.8), mm(279)), point(mm(29.8), mm(281.4)));
  bezierProfile(perfil, perfil.at(-1), point(mm(29.8), mm(283.6)), point(mm(28.6), mm(284.4)), point(mm(26.4), mm(284.5)), 8);
  perfil.push(point(mm(12), mm(284.6)), point(0, mm(284.6)));
  return revolve(perfil, 160);
}

/**
 * A alça: uma argola de fita de silicone pendurada ao lado da tampa, presa em cima por um rebite, como
 * na foto do catálogo. Varre um retângulo de cantos redondos ao longo da volta fechada.
 */
function alcaGeometry() {
  const v = (x, y) => new THREE.Vector3(mm(x), mm(y), 0);
  const curva = new THREE.CatmullRomCurve3([
    v(35.4, 279.6), v(43.5, 277.4), v(48.4, 266), v(48, 250), v(44, 240.6), v(38.6, 239.6), v(35.6, 246), v(35, 262), v(35, 273.4),
  ], true, 'centripetal');
  const passos = 128, lados = 20;
  const meiaLargura = mm(8), meiaEspessura = mm(2.2);
  const positions = [], indices = [];
  const binormal = new THREE.Vector3(0, 0, 1);
  const normal = new THREE.Vector3();
  for (let i = 0; i <= passos; i += 1) {
    const t = i / passos;
    const p = curva.getPointAt(t);
    const tangente = curva.getTangentAt(t);
    normal.crossVectors(binormal, tangente).normalize();
    for (let j = 0; j <= lados; j += 1) {
      // Superelipse: lados quase retos e cantos arredondados, como fita de silicone.
      const a = (j / lados) * TAU;
      const c = Math.cos(a), s = Math.sin(a);
      const x = Math.sign(c) * Math.abs(c) ** 0.45 * meiaEspessura;
      const z = Math.sign(s) * Math.abs(s) ** 0.45 * meiaLargura;
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

function inoxPintado(cor) {
  // Pintura eletrostática sobre inox: acetinada, sem o espelho da cerâmica vidrada.
  return new THREE.MeshPhysicalMaterial({
    color: cor, roughness: 0.46, metalness: 0, clearcoat: 0.32, clearcoatRoughness: 0.42, envMapIntensity: 0.62,
  });
}

function montaGarrafa() {
  // A cor do corpo vem na textura (a arte já é desenhada sobre ela); o material fica branco.
  const corpoMaterial = inoxPintado('#ffffff');
  const gola = inoxPintado('#F3EEE4');
  gola.roughness = 0.58;
  gola.clearcoat = 0.12;
  const silicone = new THREE.MeshPhysicalMaterial({ color: '#F3EEE4', roughness: 0.72, metalness: 0, clearcoat: 0.05, envMapIntensity: 0.5 });
  const escuro = new THREE.MeshPhysicalMaterial({ color: '#2a2622', roughness: 0.55, metalness: 0, clearcoat: 0.2, clearcoatRoughness: 0.4, envMapIntensity: 0.55 });
  const aco = new THREE.MeshPhysicalMaterial({ color: '#d4d6d8', roughness: 0.26, metalness: 1, envMapIntensity: 1 });

  const garrafa = new THREE.Group();
  const partes = [
    ['Corpo de inox pintado', corpoGeometry(), corpoMaterial],
    ['Anel de aço', anelGeometry(), aco],
    ['Gola da tampa', golaGeometry(), gola],
    ['Topo da tampa', topoGeometry(), escuro],
    ['Alça de silicone', alcaGeometry(), silicone],
  ];
  const malhas = partes.map(([nome, geometria, material]) => {
    const malha = new THREE.Mesh(geometria, material);
    malha.name = nome;
    malha.castShadow = malha.receiveShadow = true;
    garrafa.add(malha);
    return malha;
  });
  // O rebite que prende a argola no alto da tampa, atravessando a fita.
  const rebite = new THREE.Mesh(new THREE.CylinderGeometry(mm(3.3), mm(3.3), mm(18.2), 40), aco);
  rebite.rotation.x = Math.PI / 2;
  rebite.position.set(mm(37.2), mm(275.6), 0);
  rebite.castShadow = true;
  rebite.name = 'Rebite da alça';
  garrafa.add(rebite);

  return {
    grupo: garrafa,
    superficie: malhas[0],
    exterior: corpoMaterial,
    // Tampa e alça acompanham a cor da garrafa; o corpo recebe a cor pela textura da arte.
    pinta({ corpo } = {}) {
      if (!corpo) return;
      gola.color.set(corpo);
      silicone.color.set(corpo);
    },
  };
}

// Com o u invertido, a frente (u=.25) fica em -Z, como na caneca.
const VISTAS = Object.freeze({
  front: { theta: Math.PI + 0.015, phi: 1.44 },
  back: { theta: 0.015, phi: 1.44 },
  handle: { theta: Math.PI / 2 - 0.35, phi: 1.36 },
  inside: { theta: Math.PI + 0.3, phi: 0.5 },
});

export const FORMA_DA_GARRAFA = Object.freeze({
  id: 'garrafa',
  rotulo: 'Garrafa em três dimensões. Use as setas para girar, e mais e menos para aproximar. Os botões de vista levam direto a cada lado.',
  alvo: [0.12, mm(142), 0],
  vistas: VISTAS,
  // A garrafa inteira em pé, com folga em cima e embaixo, a alça e a sombra.
  enquadramento: { altura: mm(336), largura: mm(124), minimo: 7.4 },
  folgas: { estudio: 1, madeira: 1.08, linho: 1.08, presente: 1.38 },
  caixa: { lado: 2.75, altura: 0.64 },
  sombra: { alvoY: 2.4, extensao: 4.4, contato: 2.3 },
  monta: montaGarrafa,
});
