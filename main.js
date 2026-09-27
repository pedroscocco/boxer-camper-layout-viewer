import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// A deliberately simple, shareable layout study based on the owner's van
// measurements and selected surface size. Construction details are omitted.
const mm = value => value / 1000;
const viewport = document.getElementById('viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#172832');
const camera = new THREE.PerspectiveCamera(42, 1, 0.02, 50);
camera.up.set(0, 0, 1);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
viewport.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1.2;
controls.maxDistance = 10;
controls.target.set(mm(1300), 0, mm(370));

scene.add(new THREE.HemisphereLight(0xe4f7f3, 0x5a6772, 2.5));
const sun = new THREE.DirectionalLight(0xffffff, 2.3);
sun.position.set(-1.5, -2, 4);
scene.add(sun);

const material = (color, opts = {}) => new THREE.MeshStandardMaterial({
  color, roughness: 0.85, metalness: 0.02, ...opts
});
const mats = {
  floor: material('#91b4aa', { side: THREE.DoubleSide }),
  arch: material('#a75c50', { transparent: true, opacity: 0.86 }),
  frame: material('#b18c60'),
  seat: material('#c6816b', { side: THREE.DoubleSide }),
  back: material('#85aeca', { side: THREE.DoubleSide }),
  rear: material('#a2b79b', { side: THREE.DoubleSide })
};

function box(parent, bounds, mat) {
  const [x0, x1, y0, y1, z0, z1] = bounds.map(mm);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat);
  mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  parent.add(mesh);
  return mesh;
}
function polyline(parent, points, color, opacity = 1) {
  const vertices = points.flatMap(p => p.map(mm));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
  parent.add(line);
  return line;
}

const floorPoints = [[0,-925],[2405,-925],[2520,-810],[2520,810],[2405,925],[0,925]];
const shape = new THREE.Shape();
shape.moveTo(mm(floorPoints[0][0]), mm(floorPoints[0][1]));
for (const [x,y] of floorPoints.slice(1)) shape.lineTo(mm(x), mm(y));
shape.closePath();
const floor = new THREE.Mesh(new THREE.ShapeGeometry(shape), mats.floor);
floor.position.z = mm(-5);
scene.add(floor);

const archGroup = new THREE.Group();
scene.add(archGroup);
box(archGroup, [1600,2300,-925,-705,0,360], mats.arch);
box(archGroup, [1600,2300,705,925,0,360], mats.arch);

const outlines = new THREE.Group();
scene.add(outlines);
const lower = floorPoints.map(([x,y]) => [x,y,2]);
const upper = floorPoints.map(([x,y]) => [x,y,1620]);
polyline(outlines, [...lower, lower[0]], '#8cc4d5', 0.8);
polyline(outlines, [...upper, upper[0]], '#8cc4d5', 0.72);
for (const [x,y] of floorPoints) polyline(outlines, [[x,y,2],[x,y,1620]], '#8cc4d5', 0.6);
// Rear door line and approximate side-door zone are visual guides.
polyline(outlines, [[2520,0,2],[2520,0,1620]], '#e2bf86', 0.8);
for (const y of [-925,925]) polyline(outlines, [[1120,y,2],[1120,y,1620]], '#e2bf86', 0.34);

const fixed = new THREE.Group();
scene.add(fixed);
// Generic support volumes show spatial footprint only. They are not a cut list.
for (const y of [-598,598]) {
  box(fixed, [1487,2387,y-19,y+19,339,402], mats.frame);
  for (const x of [1506,2368]) box(fixed, [x-19,x+19,y-19,y+19,0,339], mats.frame);
}

function makePose(front, sofa) {
  const group = new THREE.Group();
  scene.add(group);
  const moving = new THREE.Group();
  group.add(moving);
  for (const y of [-656,656]) {
    box(moving, [front,front+939,y-19,y+19,339,402], mats.frame);
    box(moving, [front+36,front+74,y-19,y+19,0,339], mats.frame);
  }
  function panel(depth, rearX, rearZ, angle, mat) {
    const pivot = new THREE.Group();
    pivot.position.set(mm(rearX), 0, mm(rearZ));
    pivot.rotation.y = angle;
    group.add(pivot);
    box(pivot, [-depth,0,-825,825,0,18], mat);
  }
  if (sofa) {
    panel(633,1975,402,0,mats.seat);
    panel(633,2233.75,997.98,-THREE.MathUtils.degToRad(67.51166),mats.back);
    panel(634,2450,402,THREE.MathUtils.degToRad(70.05688),mats.rear);
  } else {
    panel(633,1183,402,0,mats.seat);
    panel(633,1816,402,0,mats.back);
    panel(634,2450,402,0,mats.rear);
  }
  return group;
}
const bed = makePose(550, false);
const sofa = makePose(1342, true);
sofa.visible = false;

function setMode(mode) {
  const isBed = mode === 'bed';
  bed.visible = isBed;
  sofa.visible = !isBed;
  document.getElementById('bedButton').classList.toggle('active', isBed);
  document.getElementById('sofaButton').classList.toggle('active', !isBed);
  document.getElementById('bedButton').setAttribute('aria-pressed', isBed);
  document.getElementById('sofaButton').setAttribute('aria-pressed', !isBed);
  document.getElementById('modeFact').textContent = isBed ? 'Open bed' : 'Sofa';
}
document.getElementById('bedButton').addEventListener('click', () => setMode('bed'));
document.getElementById('sofaButton').addEventListener('click', () => setMode('sofa'));
document.getElementById('outlineToggle').addEventListener('change', event => { outlines.visible = event.target.checked; });
if (new URLSearchParams(location.search).get('mode') === 'sofa') setMode('sofa');

const views = {
  iso: { position: [-2.65,-3.15,2.18], target: [1.26,0,.37] },
  top: { position: [1.26,0,4.6], target: [1.26,0,.25] },
  side: { position: [1.26,-4.5,.95], target: [1.26,0,.58] }
};
function setView(name) {
  const view = views[name];
  camera.position.set(...view.position);
  controls.target.set(...view.target);
  controls.update();
}
for (const button of document.querySelectorAll('[data-view]')) {
  button.addEventListener('click', () => setView(button.dataset.view));
}
setView('iso');

function resize() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
new ResizeObserver(resize).observe(viewport);
resize();
renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });

window.addEventListener('keydown', event => {
  if (event.key === '1') setMode('bed');
  if (event.key === '2') setMode('sofa');
});
