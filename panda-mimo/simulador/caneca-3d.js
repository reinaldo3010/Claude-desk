import * as THREE from '../vendor/three/three.module.js';
import { OrbitControls } from '../vendor/three/OrbitControls.js';

/**
 * Modelo paramétrico de referência, não uma medição de uma peça do fornecedor.
 * Uma unidade da cena representa 50 mm. A alça fica em +X, a frente (u=.25) em -Z.
 *
 * UV externo: u=0 e u=1 ficam na alça; u=.25 é a frente, u=.75 é o verso,
 * u=.5 fica no lado oposto à alça. v=0 é a base e v=1 é a borda superior.
 * CanvasTexture mantém flipY=true: a primeira linha do canvas aparece em cima.
 * O canvas representa PI*82 mm por 95 mm, independentemente da sua resolução.
 * A margem física e a área de 210 × 90 mm são compostas pelo editor, não pelo 3D.
 */
export const MUG_SPEC = Object.freeze({
  diameterMm: 82,
  heightMm: 95,
  printWidthMm: 210,
  printHeightMm: 90,
});

const HEIGHT = MUG_SPEC.heightMm / 50;
const TAU = Math.PI * 2;
const TARGET = new THREE.Vector3(0.23, 0.94, 0);
// Com o u invertido, a frente (u=.25) fica em -Z: a câmera da frente olha de -Z para a peça.
const VIEW_ANGLES = {
  front: { theta: Math.PI + 0.015, phi: 1.34 },
  back: { theta: 0.015, phi: 1.34 },
  handle: { theta: Math.PI / 2, phi: 1.30 },
  inside: { theta: Math.PI + 0.30, phi: 0.46 },
};

function point(r, y) { return new THREE.Vector2(r, y); }

function bezierProfile(target, from, c1, c2, to, segments) {
  const curve = new THREE.CubicBezierCurve(from, c1, c2, to);
  for (let i = 1; i <= segments; i += 1) target.push(curve.getPoint(i / segments));
}

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
  return revolve(profile, 192, interiorStart);
}

/**
 * A surface of revolution. Normals use the meridian derivative instead of a
 * duplicated UV-seam average; the glossy finish therefore has no vertical seam.
 */
function revolve(profile, segments, interiorStart = Infinity) {
  const positions = [], normals = [], uvs = [], indices = [];
  for (let row = 0; row < profile.length; row += 1) {
    const p = profile[row];
    const previous = profile[Math.max(0, row - 1)];
    const next = profile[Math.min(profile.length - 1, row + 1)];
    const dr = next.x - previous.x;
    const dy = next.y - previous.y;
    const length = Math.hypot(dr, dy) || 1;
    for (let col = 0; col <= segments; col += 1) {
      const u = col / segments;
      const angle = u * TAU;
      const x = Math.cos(angle), z = Math.sin(angle);
      positions.push(p.x * x, p.y, p.x * z);
      normals.push(dy * x / length, -dr / length, dy * z / length);
      // u cresce no sentido contrário ao ângulo: assim a arte lê da esquerda para a direita
      // para quem olha a face, em vez de sair espelhada. A costura (u=0 e u=1) segue na alça.
      uvs.push(1 - u, p.y / HEIGHT);
      if (row < profile.length - 1 && col < segments) {
        const a = row * (segments + 1) + col;
        const b = a + segments + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  const outsideCount = Math.min(interiorStart, profile.length - 1) * segments * 6;
  geometry.addGroup(0, outsideCount, 0);
  if (outsideCount < indices.length) geometry.addGroup(outsideCount, indices.length - outsideCount, 1);
  geometry.computeBoundingSphere();
  return geometry;
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

function studioEnvironment(renderer) {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color().setRGB(0.36, 0.36, 0.36);
  const panels = [
    { position: [-3.2, 2.7, -2.5], size: [2.1, 3.3], power: 4.8 },
    { position: [3.8, 2.1, -1.0], size: [0.85, 3.9], power: 3.0 },
    { position: [0.1, 4.5, 0.0], size: [3.8, 3.8], power: 3.6 },
    { position: [-1.2, 1.8, 4.0], size: [2.0, 2.6], power: 1.8 },
  ];
  for (const panel of panels) {
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(panel.power, panel.power, panel.power) });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...panel.size), material);
    mesh.position.set(...panel.position);
    mesh.lookAt(0, 1, 0);
    studio.add(mesh);
  }
  const generator = new THREE.PMREMGenerator(renderer);
  // 0.04 rad é o maior desfoque que cabe nas 20 amostras do PMREM sem aviso de corte.
  const target = generator.fromScene(studio, 0.04, 0.1, 20);
  generator.dispose();
  studio.traverse((object) => {
    object.geometry?.dispose();
    object.material?.dispose();
  });
  return target;
}

function contactShadow() {
  const size = 128;
  const rgba = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const distance = Math.hypot((x + 0.5) / size * 2 - 1, (y + 0.5) / size * 2 - 1);
      const density = Math.exp(-distance * distance * 5.5) * Math.max(0, 1 - distance);
      const offset = (y * size + x) * 4;
      rgba[offset] = rgba[offset + 1] = rgba[offset + 2] = 0;
      rgba[offset + 3] = Math.round(density * 125);
    }
  }
  const texture = new THREE.DataTexture(rgba, size, size);
  texture.needsUpdate = true;
  texture.magFilter = THREE.LinearFilter;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 2.7), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.003;
  mesh.renderOrder = 1;
  return mesh;
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

export async function createMugViewer(container, { onError, onReady, onChange, onPointer } = {}) {
  if (!(container instanceof HTMLElement)) throw new TypeError('A área da prévia não foi encontrada.');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (cause) {
    const error = new Error('A prévia 3D não está disponível neste navegador.', { cause });
    onError?.(error);
    throw error;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.13;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.className = 'mug-3d-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Prévia 3D da caneca. Arraste para girar; use os controles de posição para escolher outro ângulo.');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  // Preserve vertical document scrolling on phones; rotation works horizontally.
  canvas.style.touchAction = 'pan-y';
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.08, 40);
  const environment = studioEnvironment(renderer);
  scene.environment = environment.texture;

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
  const foot = new THREE.Mesh(revolve(footProfile, 144), footMaterial);
  foot.castShadow = foot.receiveShadow = true;
  mug.add(foot);
  scene.add(mug);

  const key = new THREE.DirectionalLight(0xffffff, 2.45);
  // Luzes no lado -Z, o mesmo da frente da caneca, para a arte ficar iluminada de frente.
  key.position.set(-3.4, 6, -4.6);
  key.target.position.set(0, 0.7, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -2.8, right: 2.8, top: 2.8, bottom: -2.8, near: 0.5, far: 14 });
  key.shadow.bias = -0.00008;
  key.shadow.normalBias = 0.012;
  key.shadow.radius = 3;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xffffff, 0.6);
  fill.position.set(3, 2.2, 3);
  scene.add(fill);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc7c5c1, 0.65));

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: 0x24211e, opacity: 0.115, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.009;
  floor.receiveShadow = true;
  scene.add(floor, contactShadow());

  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(TARGET);
  controls.enableDamping = true;
  controls.dampingFactor = 0.11;
  controls.enablePan = false;
  controls.rotateSpeed = 0.64;
  controls.zoomSpeed = 0.65;
  controls.minPolarAngle = 0.19;
  controls.maxPolarAngle = Math.PI * 0.54;
  controls.minDistance = 2.9;
  controls.maxDistance = 8.5;
  controls.touches.ONE = THREE.TOUCH.ROTATE;
  controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
  // OrbitControls sets touch-action:none during construction.
  canvas.style.touchAction = 'pan-y';

  let disposed = false, visible = true, contextLost = false;

  /**
   * Onde o dedo tocou a cerâmica, em coordenadas da arte: u dá a volta (u=.25 é a frente)
   * e v sobe da base para a borda. Só a parede de fora conta; o interior é ignorado.
   */
  const raycaster = new THREE.Raycaster();
  const ponteiro = new THREE.Vector2();
  function pontoDaCaneca(event) {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return null;
    ponteiro.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
    raycaster.setFromCamera(ponteiro, camera);
    for (const hit of raycaster.intersectObject(body, false)) {
      if (hit.uv && hit.face?.materialIndex === 0) return { u: hit.uv.x, v: hit.uv.y };
    }
    return null;
  }

  // Os ouvintes ficam no contêiner, em captura: assim eles decidem antes do OrbitControls
  // se o gesto é "arrastar a arte" ou "girar a caneca".
  let arrastando = false;
  function aoApertar(event) {
    if (!onPointer || event.button > 0 || disposed) return;
    if (onPointer({ tipo: 'apertou', ponto: pontoDaCaneca(event), event })) {
      arrastando = true;
      controls.enabled = false;
      try { canvas.setPointerCapture(event.pointerId); } catch { /* navegador sem captura de ponteiro */ }
      event.stopPropagation();
      event.preventDefault();
    }
  }
  function aoMover(event) {
    if (!onPointer || disposed) return;
    if (arrastando) {
      onPointer({ tipo: 'moveu', ponto: pontoDaCaneca(event), event });
      event.stopPropagation();
      return;
    }
    canvas.style.cursor = onPointer({ tipo: 'passou', ponto: pontoDaCaneca(event), event }) ? 'grab' : '';
  }
  function aoSoltar(event) {
    if (!arrastando) return;
    arrastando = false;
    controls.enabled = true;
    try { canvas.releasePointerCapture(event.pointerId); } catch { /* idem */ }
    onPointer?.({ tipo: 'soltou', ponto: pontoDaCaneca(event), event });
  }
  function aoBaterDuasVezes(event) {
    if (!onPointer || disposed) return;
    onPointer({ tipo: 'dobrou', ponto: pontoDaCaneca(event), event });
  }
  container.addEventListener('pointerdown', aoApertar, true);
  container.addEventListener('pointermove', aoMover, true);
  container.addEventListener('pointerup', aoSoltar, true);
  container.addEventListener('pointercancel', aoSoltar, true);
  container.addEventListener('dblclick', aoBaterDuasVezes, true);

  let frame = 0, transition = null, texture = null;
  let fitDistance = 4.8, zoom = 1;
  let width = 0, height = 0;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  function requestRender() {
    if (!disposed && !contextLost && visible && !document.hidden && !frame) frame = requestAnimationFrame(render);
  }
  function render(now) {
    frame = 0;
    if (disposed || contextLost || !visible || document.hidden) return;
    if (transition) {
      const t = Math.min(1, (now - transition.start) / 520);
      const eased = 1 - Math.pow(1 - t, 3);
      const spherical = new THREE.Spherical(
        THREE.MathUtils.lerp(transition.from.radius, transition.to.radius, eased),
        THREE.MathUtils.lerp(transition.from.phi, transition.to.phi, eased),
        THREE.MathUtils.lerp(transition.from.theta, transition.to.theta, eased),
      );
      camera.position.setFromSpherical(spherical).add(controls.target);
      if (t === 1) transition = null;
    }
    controls.update();
    renderer.render(scene, camera);
    if (transition) requestRender();
  }
  function cameraChanged() { requestRender(); }
  function interactionStarted() { transition = null; requestRender(); }
  function interactionEnded() { onChange?.({ type: 'view' }); }
  controls.addEventListener('change', cameraChanged);
  controls.addEventListener('start', interactionStarted);
  controls.addEventListener('end', interactionEnded);

  function orient(view, animate = true) {
    const angles = VIEW_ANGLES[view] || VIEW_ANGLES.front;
    const from = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    let theta = angles.theta;
    while (theta - from.theta > Math.PI) theta -= TAU;
    while (theta - from.theta < -Math.PI) theta += TAU;
    const to = new THREE.Spherical(fitDistance / zoom, angles.phi, theta);
    if (animate && !reducedMotion) transition = { from, to, start: performance.now() };
    else {
      transition = null;
      camera.position.setFromSpherical(to).add(controls.target);
      controls.update();
    }
    requestRender();
  }

  function resize() {
    if (disposed) return;
    const bounds = container.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.floor(bounds.width));
    const nextHeight = Math.max(1, Math.floor(bounds.height));
    if (nextWidth === width && nextHeight === height) return;
    const priorFit = fitDistance;
    width = nextWidth;
    height = nextHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    // Space for the handle and shadow in portrait as well as landscape layouts.
    fitDistance = Math.max(2.32 / (2 * Math.tan(halfFov)), 2.98 / (2 * Math.tan(halfFov) * camera.aspect));
    fitDistance = Math.max(4.05, fitDistance);
    controls.minDistance = fitDistance / 1.55;
    controls.maxDistance = fitDistance / 0.64;
    const offset = camera.position.clone().sub(controls.target);
    if (offset.length() > 0.1) camera.position.copy(offset.multiplyScalar(fitDistance / priorFit)).add(controls.target);
    transition = null;
    renderer.setSize(width, height, false);
    requestRender();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const intersectionObserver = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) requestRender();
      else if (frame) { cancelAnimationFrame(frame); frame = 0; }
    }, { rootMargin: '100px' }) : null;
  intersectionObserver?.observe(container);
  const visibilityChanged = () => { if (!document.hidden) requestRender(); };
  document.addEventListener('visibilitychange', visibilityChanged);
  function lost(event) {
    event.preventDefault();
    contextLost = true;
    if (frame) { cancelAnimationFrame(frame); frame = 0; }
    onError?.(new Error('A prévia 3D foi interrompida. Atualize a página para tentar novamente.'));
  }
  function restored() { contextLost = false; requestRender(); }
  canvas.addEventListener('webglcontextlost', lost, false);
  canvas.addEventListener('webglcontextrestored', restored, false);

  resize();
  orient('front', false);
  renderer.render(scene, camera);

  const api = {
    setTexture(source) {
      if (disposed) return;
      if (!source) {
        texture?.dispose();
        texture = null;
        exterior.map = null;
        exterior.needsUpdate = true;
      } else if (texture?.image === source) texture.needsUpdate = true;
      else {
        texture?.dispose();
        texture = new THREE.CanvasTexture(source);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        exterior.map = texture;
        exterior.needsUpdate = true;
      }
      requestRender();
    },
    setColors({ inside, handle: color } = {}) {
      if (disposed) return;
      if (inside) interior.color.set(inside);
      if (color) handleMaterial.color.set(color);
      requestRender();
    },
    setView(view) { if (!disposed) { orient(view); onChange?.({ type: 'view', view }); } },
    /** Onde um evento do mouse/dedo caiu na cerâmica, ou null se passou fora da peça. */
    pontoEm(event) { return disposed ? null : pontoDaCaneca(event); },
    /** O u (0..1) do pedaço da caneca virado para quem está olhando: onde algo novo deve nascer. */
    frenteVisivel() {
      const direcao = camera.position.clone().sub(controls.target);
      const angulo = Math.atan2(direcao.z, direcao.x);
      return ((1 - angulo / TAU) % 1 + 1) % 1;
    },
    setZoom(value) {
      if (disposed || !Number.isFinite(Number(value))) return;
      zoom = THREE.MathUtils.clamp(Number(value), 0.75, 1.4);
      transition = null;
      const direction = camera.position.clone().sub(controls.target).normalize();
      camera.position.copy(direction.multiplyScalar(fitDistance / zoom)).add(controls.target);
      controls.update();
      requestRender();
    },
    capture() {
      return new Promise((resolve, reject) => {
        if (disposed || contextLost) { reject(new Error('A prévia 3D está indisponível.')); return; }
        // Read immediately after drawing; no permanent preserveDrawingBuffer cost.
        renderer.render(scene, camera);
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Não foi possível salvar a prévia.')), 'image/png');
      });
    },
    resize,
    dispose() {
      if (disposed) return;
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver?.disconnect();
      document.removeEventListener('visibilitychange', visibilityChanged);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
      container.removeEventListener('pointerdown', aoApertar, true);
      container.removeEventListener('pointermove', aoMover, true);
      container.removeEventListener('pointerup', aoSoltar, true);
      container.removeEventListener('pointercancel', aoSoltar, true);
      container.removeEventListener('dblclick', aoBaterDuasVezes, true);
      controls.dispose();
      texture?.dispose();
      const geometries = new Set(), materials = new Set(), maps = new Set();
      scene.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => materials.add(material));
        if (object.isLight) object.shadow?.dispose();
      });
      materials.forEach((material) => { if (material.map && material.map !== texture) maps.add(material.map); material.dispose(); });
      maps.forEach((map) => map.dispose());
      geometries.forEach((geometry) => geometry.dispose());
      environment.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
  onReady?.(api);
  return api;
}
