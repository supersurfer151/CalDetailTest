// 3D car for the car garage: a Porsche 911, de-badged and repainted (../assets/porsche/car.gltf, built by
// dev-tools/porsche-web/prep.js). Node names carry the service zone ("paint__…", "wheels__…", "glass__…",
// "lights__…"); this file gives each zone a camera shot, a marker and its own highlight.
// The model has no cabin, so the interior zone opens a photo of a real one.
// Model: "(FREE) Porsche 911 Carrera 4S" by Karol Miklas, CC BY-SA 4.0 (see ../assets/porsche/license.txt).
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const URL = "../assets/porsche/car.gltf";
const INTERIOR_PHOTO = "../assets/cd/cfg/porsche-interior-steering-wheel-dashboard-pembroke.jpg";

// Dark studio with long softboxes for clean strip reflections on the paint
function studio(renderer) {
  const env = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(40, 16, 40), new THREE.MeshBasicMaterial({ color: 0x07080a, side: THREE.BackSide }));
  room.position.y = 7;
  env.add(room);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color: 0x15171a }));
  floor.rotation.x = -Math.PI / 2;
  env.add(floor);
  const box = (w, h, pos, rot, k, tint = 0xffffff) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(tint).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.rotation.set(...rot); env.add(m);
  };
  box(2.2, 18, [0, 9, 0], [Math.PI / 2, 0, 0], 9);
  box(1.2, 18, [-3.2, 8.6, 0], [Math.PI / 2, 0.25, 0], 4);
  box(1.2, 18, [3.2, 8.6, 0], [Math.PI / 2, -0.25, 0], 4);
  box(10, 2.2, [-14, 3, 2], [0, Math.PI / 2, 0], 3.2);
  box(10, 2.2, [14, 3, -2], [0, -Math.PI / 2, 0], 2.4);
  box(14, 4, [0, 4, 16], [0, Math.PI, 0], 1.6, 0xdfe8ff);
  box(14, 4, [0, 4, -16], [0, 0, 0], 0.9);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(env, 0.035).texture;
  pmrem.dispose();
  return tex;
}

function canvasTex(size, draw) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d"), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// Turntable disc + soft contact shadow
function plinth(radius) {
  const tex = canvasTex(1024, (g, s) => {
    const c = s / 2;
    const glow = g.createRadialGradient(c, c, 0, c, c, c);
    glow.addColorStop(0, "rgba(140,160,190,0.10)");
    glow.addColorStop(0.75, "rgba(140,160,190,0.05)");
    glow.addColorStop(1, "rgba(140,160,190,0)");
    g.fillStyle = glow; g.fillRect(0, 0, s, s);
    g.strokeStyle = "rgba(255,255,255,0.16)"; g.lineWidth = 3;
    g.beginPath(); g.arc(c, c, c * 0.86, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = "rgba(61,139,255,0.35)"; g.lineWidth = 2;
    g.setLineDash([s * 0.02, s * 0.03]);
    g.beginPath(); g.arc(c, c, c * 0.9, 0, Math.PI * 2); g.stroke();
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.001;
  return m;
}
function shadowBlob() {
  const tex = canvasTex(256, (g) => {
    const grad = g.createRadialGradient(128, 128, 8, 128, 128, 128);
    grad.addColorStop(0, "rgba(0,0,0,0.85)"); grad.addColorStop(0.45, "rgba(0,0,0,0.5)"); grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.002;
  return m;
}

// World-space box of some meshes, optionally only the vertices that pass `keep(v)`
function boxOf(meshes, keep) {
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  for (const m of meshes) {
    const pos = m.geometry.attributes.position;
    m.updateWorldMatrix(true, false);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
      if (!keep || keep(v)) box.expandByPoint(v);
    }
  }
  return box;
}

export function loadCar(rig, { onProgress, reducedMotion } = {}) {
  const { renderer, scene } = rig;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMappingExposure = 1.0;
  scene.environment = studio(renderer);

  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0004;
  scene.add(key, key.target);

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  return new Promise((resolve, reject) => {
    loader.load(URL, (gltf) => {
      build(gltf).then(resolve, reject);
    }, (e) => { if (e.total) onProgress?.(e.loaded / e.total); }, reject);
  });

  async function build(gltf) {
    const root = gltf.scene;
    scene.add(root);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const L = size.z, H = size.y, W = size.x;

    // ---- parts: clone materials per part so each part can glow / dim on its own ----
    const ZONES = ["paint", "wheels", "glass", "lights", "interior"];
    const U = Object.fromEntries(ZONES.map((z) => [z, { uHi: { value: 0 }, uDim: { value: 0 } }]));
    const hiColor = { value: new THREE.Color(0x3d8bff) };
    const sweep = { uSweepZ: { value: 99 }, uSweepAmt: { value: 0 } };
    const meshesBy = Object.fromEntries(ZONES.map((z) => [z, []]));
    const pickables = [];
    const clones = new Map();

    root.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      const z = (o.name.split("__")[0] || "paint").replace(/_\d+$/, "");
      const zone = ZONES.includes(z) ? z : "paint";
      o.userData.zone = zone;
      meshesBy[zone].push(o);
      pickables.push(o);
      const swap = (m) => {
        const k = zone + ":" + m.uuid;
        if (!clones.has(k)) {
          const c = m.clone();
          patch(c, U[zone], m.name === "paint");
          clones.set(k, c);
        }
        return clones.get(k);
      };
      o.material = Array.isArray(o.material) ? o.material.map(swap) : swap(o.material);
    });

    function patch(mat, u, isPaint) {
      mat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, u, { uHiColor: hiColor }, isPaint ? sweep : {});
        if (isPaint) {
          sh.vertexShader = sh.vertexShader
            .replace("#include <common>", "#include <common>\nvarying vec3 vWorldPos;")
            .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
        }
        sh.fragmentShader = sh.fragmentShader
          .replace("#include <common>", `#include <common>
            uniform float uHi; uniform float uDim; uniform vec3 uHiColor;
            ${isPaint ? "varying vec3 vWorldPos; uniform float uSweepZ; uniform float uSweepAmt;" : ""}`)
          .replace("#include <opaque_fragment>", `#include <opaque_fragment>
            float fres = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 2.5);
            ${isPaint ? `float sd = vWorldPos.z - uSweepZ + vWorldPos.y * 0.35;
            gl_FragColor.rgb += vec3(1.0, 0.97, 0.94) * exp(-sd * sd * 7.0) * uSweepAmt * (0.05 + 0.25 * fres);` : ""}
            gl_FragColor.rgb += uHiColor * uHi * (0.04 + 0.9 * fres);`)
          // dim after tone mapping so glossy reflections darken too
          .replace("#include <tonemapping_fragment>", "#include <tonemapping_fragment>\ngl_FragColor.rgb *= 1.0 - 0.6 * uDim;");
      };
      mat.customProgramCacheKey = () => (isPaint ? "cd-paint" : "cd-part");
      mat.needsUpdate = true;
    }

    // ---- floor, shadow, light ----
    scene.add(plinth(L * 0.68));
    const blob = shadowBlob();
    blob.scale.set(W * 1.55, L * 1.2, 1);
    scene.add(blob);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.42 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    key.position.set(W * 1.2, H * 6, L * 0.8);
    const s = L * 0.9;
    Object.assign(key.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 0.5, far: H * 14 });
    key.shadow.camera.updateProjectionMatrix();

    // ---- reference points ----
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const N = (x, y, z) => new THREE.Vector3(x, y, z).normalize();
    const fw = boxOf(meshesBy.wheels, (v) => v.x > 0 && v.z > 0);              // front wheel on the camera side
    const fwC = fw.getCenter(V3()), fwR = fw.getSize(V3()).y / 2;
    const ws = root.getObjectByName("glass__window__windshield") || meshesBy.glass[0];
    const wsBox = boxOf([ws]);
    const wsC = wsBox.getCenter(V3());
    const lensMeshes = meshesBy.lights.filter((m) => /^lights__lights/.test(m.name));
    const hl = boxOf(lensMeshes.length ? lensMeshes : meshesBy.lights, (v) => v.x > 0 && v.z > L * 0.3);
    const hlC = hl.getCenter(V3());
    const tl = boxOf(meshesBy.lights, (v) => v.x > 0 && v.z < -L * 0.3);
    const tlC = tl.isEmpty() ? V3(W * 0.35, H * 0.5, -L * 0.48) : tl.getCenter(V3());
    const glassBox = boxOf(meshesBy.glass);
    const sideWin = boxOf(meshesBy.glass, (v) => v.x > W * 0.3);
    const sideC = sideWin.getCenter(V3());

    const zones = {
      paint: {
        view: { look: V3(W * 0.2, H * 0.42, L * 0.1), az: 0.66, el: 0.22, R: L * 0.4, fov: 26, mirror: true },
        anchors: [{ pos: V3(W * 0.49, H * 0.5, -L * 0.26), normal: N(1, 0.2, 0) }, { pos: V3(-W * 0.49, H * 0.5, -L * 0.26), normal: N(-1, 0.2, 0) }],
        box: null,
      },
      wheels: {
        view: { look: fwC.clone(), az: 1.15, el: 0.06, R: fwR * 1.6, fov: 24, mirror: true },
        anchors: [{ pos: V3(fw.max.x, fwC.y, fwC.z), normal: N(1, 0, 0.15) }, { pos: V3(-fw.max.x, fwC.y, fwC.z), normal: N(-1, 0, 0.15) }],
        box: fw,
      },
      glass: {
        view: { look: wsC.clone(), az: 0.42, el: 0.42, R: wsBox.getSize(V3()).length() * 0.6, fov: 26 },
        anchors: [{ pos: V3(wsC.x - W * 0.08, wsBox.max.y - (wsBox.max.y - wsBox.min.y) * 0.6, wsBox.min.z + (wsBox.max.z - wsBox.min.z) * 0.62), normal: N(0, 0.7, 0.7) },
                  { pos: V3(0, glassBox.max.y * 0.96, glassBox.min.z + (glassBox.max.z - glassBox.min.z) * 0.15), normal: N(0, 0.7, -0.7) }],
        box: wsBox,
      },
      lights: {
        view: { look: hlC.clone(), az: 0.42, el: 0.12, R: Math.max(hl.getSize(V3()).length() * 0.8, W * 0.16), fov: 24, mirror: true },
        anchors: [
          { pos: V3(hlC.x, hlC.y, hl.max.z), normal: N(0.45, 0, 1) }, { pos: V3(-hlC.x, hlC.y, hl.max.z), normal: N(-0.45, 0, 1) },
          { pos: tlC.clone(), normal: N(0.45, 0, -1) }, { pos: V3(-tlC.x, tlC.y, tlC.z), normal: N(-0.45, 0, -1) },
        ],
        box: hl,
      },
      interior: {
        // no cabin in this model: frame the driver's window, then the garage opens a photo of a real interior
        view: { look: sideC.clone(), az: 1.42, el: 0.12, R: sideWin.getSize(V3()).length() * 0.62, fov: 26, mirror: true },
        anchors: [{ pos: V3(sideWin.max.x * 0.92, sideWin.min.y + (sideWin.max.y - sideWin.min.y) * 0.4, sideWin.min.z + (sideWin.max.z - sideWin.min.z) * 0.32), normal: N(1, 0.25, 0) },
                  { pos: V3(-sideWin.max.x * 0.92, sideWin.min.y + (sideWin.max.y - sideWin.min.y) * 0.4, sideWin.min.z + (sideWin.max.z - sideWin.min.z) * 0.32), normal: N(-1, 0.25, 0) }],
        box: sideWin,
        photo: INTERIOR_PHOTO,
      },
      full: {
        view: { look: V3(0, H * 0.4, 0), az: 0.9, el: 0.26, R: L * 0.6, fov: 28, spin: true },
        anchors: [],
        box: null,
      },
    };

    // ---- per-frame effects ----
    const fx = { sweepT: 1, lastFocus: null, lastHover: null };
    const amt = Object.fromEntries(ZONES.map((z) => [z, { hi: 0, dim: 0 }]));
    function startSweep() { if (!reducedMotion && fx.sweepT > 0.6) fx.sweepT = 0; }

    const model = {
      fov: 28,
      overview: { look: V3(0, H * 0.36, L * 0.02), az: 0.78, el: 0.16, R: L * 0.5, fov: 28 },
      intro: { az: -0.9, el: 0.02, R: 1.5 },
      portraitR: 0.74,
      zones, pickables,
      zoneOf(hit) { return hit.object.userData.zone || undefined; },
      shine() { startSweep(); },   // a light sweep across the paint (choosing the Ultimate Detail's buff wax)
      update(dt, { hover, focus }) {
        if (focus !== fx.lastFocus) { if (focus === "paint" || focus === "full") startSweep(); fx.lastFocus = focus; }
        if (hover !== fx.lastHover) { if (hover === "paint" && focus !== "paint") startSweep(); fx.lastHover = hover; }
        const k = 1 - Math.exp(-dt * 5);
        for (const z of ZONES) {
          const a = amt[z];
          const focusedHere = focus === z && ["wheels", "glass", "lights"].includes(z) ? 0.35 : 0;
          const hiT = Math.min(1, (hover === z && focus !== z ? 0.85 : 0) + focusedHere);
          // looking "inside": keep the glass bright, dim the rest
          const dimT = focus && focus !== "full" && focus !== z && !(focus === "interior" && z === "glass") ? 1 : 0;
          a.hi += (hiT - a.hi) * k;
          a.dim += (dimT - a.dim) * k;
          U[z].uHi.value = a.hi;
          U[z].uDim.value = a.dim;
        }
        if (fx.sweepT < 1) {
          fx.sweepT = Math.min(1, fx.sweepT + dt / 1.3);
          const p = fx.sweepT < 0.5 ? 4 * fx.sweepT ** 3 : 1 - Math.pow(-2 * fx.sweepT + 2, 3) / 2;
          sweep.uSweepZ.value = THREE.MathUtils.lerp(-L * 0.75, L * 0.75, p);
          sweep.uSweepAmt.value = Math.sin(Math.PI * fx.sweepT);
        } else sweep.uSweepAmt.value = 0;
      },
    };
    renderer.compile(scene, rig.camera);
    return model;
  }
}
