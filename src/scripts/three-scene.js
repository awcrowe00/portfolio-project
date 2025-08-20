import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SDFGeometryGenerator } from 'three/examples/jsm/geometries/SDFGeometryGenerator.js';

let renderer, meshFromSDF, scene, camera, clock, controls;
const settings = {
  res: 4,
  bounds: 1,
  autoRotate: true,
  wireframe: true,
  material: 'depth',
  vertexCount: '0'
};

// Example SDF from https://www.shadertoy.com/view/MdXSWn
const shader = /* glsl */`
  float dist(vec3 p) {
    p.xyz = p.xzy;
    p *= 1.2;
    vec3 z = p;
    vec3 dz=vec3(0.0);
    float power = 40.0;
    float r, theta, phi;
    float dr = 1.0;
    float t0 = 1.0;
    for(int i = 0; i < 7; ++i) {
      r = length(z);
      if(r > 2.0) continue;
      theta = atan(z.y / z.x);
      #ifdef phase_shift_on
      phi = asin(z.z / r) ;
      #else
      phi = asin(z.z / r);
      #endif
      dr = pow(r, power - 1.0) * dr * power + 1.0;
      r = pow(r, power);
      theta = theta * power;
      phi = phi * power;
      z = r * vec3(cos(theta)*cos(phi), sin(theta)*cos(phi), sin(phi)) + p;
      t0 = min(t0, r);
    }
    return 0.5 * log(r) * r / dr;
  }
`;

// Export the initialization function
export function initThreeScene(containerId = 'three-container') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(containerId));
  } else {
    init(containerId);
  }
}

function init(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with id "${containerId}" not found`);
    return;
  }

  const w = container.clientWidth || window.innerWidth;
  const h = container.clientHeight || window.innerHeight;
  
  camera = new THREE.OrthographicCamera(w / -5, w / 2, h / 4, h / -2, 0.01, 1600);
  camera.position.z = 1100;
  
  scene = new THREE.Scene();
  clock = new THREE.Clock();
  
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(w, h);
  
  // Append to container instead of document.body
  container.appendChild(renderer.domElement);
  
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = false;
  
  window.addEventListener('resize', () => onWindowResize(container));
  
  compile();
  animate();
}

function compile() {
  const generator = new SDFGeometryGenerator(renderer);
  const geometry = generator.generate(Math.pow(2, settings.res + 2), shader, settings.bounds);
  geometry.computeVertexNormals();
  
  if (meshFromSDF) { // updates mesh
    meshFromSDF.geometry.dispose();
    meshFromSDF.geometry = geometry;
  } else { // inits meshFromSDF : THREE.Mesh
    meshFromSDF = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
    scene.add(meshFromSDF);
    const scale = Math.min(window.innerWidth, window.innerHeight) / 2 * 10.66;
    meshFromSDF.scale.set(scale, scale, scale);
    meshFromSDF.material.color.setHex(0x0bb338);
    setMaterial();
  }
  settings.vertexCount = geometry.attributes.position.count;
}

function setMaterial() {
  meshFromSDF.material.dispose();
  if (settings.material == 'depth') {
    meshFromSDF.material = new THREE.MeshDepthMaterial();
  } else if (settings.material == 'normal') {
    meshFromSDF.material = new THREE.MeshNormalMaterial();
  }
  meshFromSDF.material.wireframe = settings.wireframe;
}

function onWindowResize(container) {
  const w = container.clientWidth || window.innerWidth;
  const h = container.clientHeight || window.innerHeight;
  
  renderer.setSize(w, h);
  camera.left = w / -2;
  camera.right = w / 2;
  camera.top = h / 2;
  camera.bottom = h / -2;
  camera.updateProjectionMatrix();
}

function render() {
  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  if (settings.autoRotate && meshFromSDF) {
    meshFromSDF.rotation.y += Math.PI * 0.05 * clock.getDelta();
  }
  render();
  // Remove stats.update() since stats is not defined
}