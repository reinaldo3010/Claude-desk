import * as THREE from '../vendor/three/three.module.js';
import { point, bezierProfile, revolve, criaVisualizador } from './peca-3d.js';
import { ESPECIFICACOES } from './pecas.js';

export { ACABAMENTOS_DA_CANECA as ACABAMENTOS } from './pecas.js';

/**
 * A caneca reta de 325 ml: modelo paramétrico de referência, não uma medição de uma peça do fornecedor.
 * Uma unidade da cena representa 50 mm. A alça fica em +X, a frente (u=.25) em -Z.
 *
 * UV externo: u=0 e u=1 ficam na alça; u=.25 é a frente, u=.75 é o verso,
 * u=.5 fica no lado oposto à alça. v=0 é a base e v=1 é a borda superior.
 * O canvas representa PI*82 mm por 95 mm, independentemente da sua resolução.
 * A margem física e a área de 210 × 90 mm são compostas pelo editor, não pelo 3D.
 * O visualizador (luz, cenas, câmera, gestos) mora em `peca-3d.js` e serve a todas as peças.
 */
export const MUG_SPEC = ESPECIFICACOES.caneca;

const HEIGHT = MUG_SPEC.heightMm / 50;
const TAU = Math.PI * 2;
// Com o u invertido, a frente (u=.25) fica em -Z: a câmera da frente olha de -Z para a peça.
const VIEW_ANGLES = {
  front: { theta: Math.PI + 0.015, phi: 1.34 },
  back: { theta: 0.015, phi: 1.34 },
  handle: { theta: Math.PI / 2, phi: 1.30 },
  inside: { theta: Math.PI + 0.30, phi: 0.46 },
  // Sem botão: o meio da arte, do lado oposto ao da alça. A arte da galeria abre por aqui, porque é
  // onde ela põe o Pandinha (a arte de volta inteira tem o centro longe da alça).
  meio: { theta: -Math.PI / 2, phi: 1.34 },
};

/** A continuous ceramic cross-section with a rounded lip and a real cavity. */
function bodyGeometry() {
  const profile = [point(0, 0.085), point(0.66, 0.085)];
  bezierProfile(profile, profile.at(-1), point(0.735, 0.085), point(0.798, 0.10), point(0.802, 0.185), 18);
  bezierProfile(profile, profile.at(-1), point(0.810, 0.53), point(0.819, 1.44), point(0.820, 1.858), 36);
  // Outer half of the rolled lip: radius 2.1 mm, wall thickness 4.2 mm.
  for (let i = 1; i <= 12; i += 1) {
    const a = (i / 12) * Math.PI / 2;
    profile.push(point(0.778 + 0.042 * Math.cos(a), 1.858 + 0.042 * Math.sin(a)));
  }
  const interiorStart = profile.length - 1;
  for (let i = 1; i <= 12; i += 1) {
    const a = Math.PI / 2 + (i / 12) * Math.PI / 2;
    profile.push(point(0.778 + 0.042 * Math.cos(a), 1.858 + 0.042 * Math.sin(a)));
  }
  bezierProfile(profile, profile.at(-1), point(0.735, 1.44), point(0.726, 0.48), point(0.724, 0.26), 34);
  bezierProfile(profile, profile.at(-1), point(0.724, 0.19), point(0.69, 0.16), point(0.62, 0.16), 16);
  profile.push(point(0, 0.16));
  return revolve(profile, 192, interiorStart, { alturaDaTextura: HEIGHT });
}

function handleGeometry() {
  const path = new THREE.CurvePath();
  const v = (x, y) => new THREE.Vector3(x, y, 0);
  path.add(new THREE.CubicBezierCurve3(v(0.782, 1.56), v(1.05, 1.56), v(1.33, 1.66), v(1.43, 1.43)));
  path.add(new THREE.CubicBezierCurve3(v(1.43, 1.43), v(1.60, 1.07), v(1.40, 0.54), v(1.07, 0.40)));
  path.add(new THREE.CubicBezierCurve3(v(1.07, 0.40), v(0.97, 0.36), v(0.88, 0.37), v(0.782, 0.38)));
  const segments = 144, sides = 32;
  const positions = [], indices = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const p = path.getPointAt(t);
    const tangent = path.getTangentAt(t);
    const perpendicular = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
    // Slightly wider at the joints, like the molded and glazed real handle.
    const joint = Math.exp(-t * 24) + Math.exp(-(1 - t) * 24);
    const radius = 0.103 + joint * 0.030;
    const depth = 0.129 + joint * 0.011;
    for (let j = 0; j <= sides; j += 1) {
      const a = (j / sides) * TAU;
      positions.push(p.x + perpendicular.x * Math.cos(a) * radius,
        p.y + perpendicular.y * Math.cos(a) * radius,
        Math.sin(a) * depth);
      if (i < segments && j < sides) {
        const q = i * (sides + 1) + j, r = q + sides + 1;
        indices.push(q, q + 1, r, q + 1, r + 1, r);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  // Weld normals at the longitudinal seam without welding texture coordinates.
  const normal = geometry.attributes.normal;
  const average = new THREE.Vector3(), other = new THREE.Vector3();
  for (let i = 0; i <= segments; i += 1) {
    const a = i * (sides + 1), b = a + sides;
    average.fromBufferAttribute(normal, a);
    other.fromBufferAttribute(normal, b);
    average.add(other).normalize();
    normal.setXYZ(a, average.x, average.y, average.z);
    normal.setXYZ(b, average.x, average.y, average.z);
  }
  return geometry;
}

function ceramicMaterial(color = '#ffffff') {
  // Physical material values describe ceramic; these are not site UI colors.
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.235,
    metalness: 0,
    clearcoat: 0.72,
    clearcoatRoughness: 0.145,
    ior: 1.48,
    envMapIntensity: 0.70,
  });
}

/** Corpo, alça e pé da caneca, com as cores do interior e da alça e o vidrado. */
function montaCaneca() {
  const exterior = ceramicMaterial();
  const interior = ceramicMaterial();
  interior.roughness = 0.255;
  const handleMaterial = ceramicMaterial();
  const footMaterial = ceramicMaterial('#f8f7f5');
  footMaterial.roughness = 0.44;
  footMaterial.clearcoat = 0.15;
  const mug = new THREE.Group();
  const body = new THREE.Mesh(bodyGeometry(), [exterior, interior]);
  body.castShadow = body.receiveShadow = true;
  body.name = 'Corpo cerâmico e interior vazado';
  mug.add(body);
  const handle = new THREE.Mesh(handleGeometry(), handleMaterial);
  handle.castShadow = handle.receiveShadow = true;
  handle.name = 'Alça cerâmica';
  mug.add(handle);
  const footProfile = [point(0.60, 0.087), point(0.615, 0.014), point(0.635, 0.004), point(0.678, 0.004), point(0.69, 0.018), point(0.695, 0.087)];
  const foot = new THREE.Mesh(revolve(footProfile, 144, Infinity, { alturaDaTextura: HEIGHT }), footMaterial);
  foot.castShadow = foot.receiveShadow = true;
  mug.add(foot);
  return {
    grupo: mug,
    superficie: body,
    exterior,
    pinta({ inside, handle: color } = {}) {
      if (inside) interior.color.set(inside);
      if (color) handleMaterial.color.set(color);
    },
    /** Vidrado brilhante (padrão) ou fosco. Muda só o material, nunca a cor da peça. */
    acabamento(id) {
      const fosco = id === 'fosco';
      for (const material of [exterior, interior, handleMaterial]) {
        material.roughness = fosco ? 0.62 : 0.235;
        material.clearcoat = fosco ? 0.08 : 0.72;
        material.clearcoatRoughness = fosco ? 0.6 : 0.145;
        material.envMapIntensity = fosco ? 0.45 : 0.70;
        material.needsUpdate = true;
      }
      interior.roughness = fosco ? 0.66 : 0.255;
    },
  };
}

export const FORMA_DA_CANECA = Object.freeze({
  id: 'caneca',
  rotulo: 'Caneca em três dimensões. Use as setas para girar, e mais e menos para aproximar. Os botões de vista levam direto a cada lado.',
  alvo: [0.23, 0.94, 0],
  vistas: VIEW_ANGLES,
  // Espaço para a alça e a sombra, na tela deitada e na em pé.
  enquadramento: { altura: 2.32, largura: 2.98, minimo: 4.05 },
  folgas: { estudio: 1, madeira: 1.22, linho: 1.22, presente: 1.62 },
  caixa: { lado: 2.75, altura: 0.86 },
  sombra: { alvoY: 0.7, extensao: 2.8, contato: 2.7 },
  monta: montaCaneca,
});

export function createMugViewer(container, opcoes = {}) {
  return criaVisualizador(container, { ...opcoes, forma: FORMA_DA_CANECA });
}
