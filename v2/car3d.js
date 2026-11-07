// 3D sports car for the car garage. Splits the model into parts (paint, wheels, glass, lights, interior),
// gives each part a camera shot, a marker position and its own highlight. Model: ../assets/car/car.gltf
// (Khronos "Car Concept", CC BY 4.0, see ../assets/car/license.txt).
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";

const LIBS = "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/";
const URL = "../assets/car/car.gltf";

// First rule that matches a node's name (checking the mesh, then its parents) decides its part.
const RULES = [
  ["glass", /Windshield|Window|Rearwindow|Wipers/],
  ["lights", /Headlights|Taillights|Turnsignals/],
  ["wheels", /^Wheel|^Axles/],
  ["interior", /^Interior/],
  ["paint", /^Body|^Engine/],
];
function zoneOfNode(o) {
  for (let n = o; n; n = n.parent) {
    const name = n.name || "";
    for (const [z, re] of RULES) if (re.test(name)) return z;
  }
  return null;
}

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
  const cabinLight = new THREE.PointLight(0xd6e4ff, 0, 2.6, 1.6);
  scene.add(cabinLight);

  const draco = new DRACOLoader().setDecoderPath(LIBS + "draco/gltf/");
  const ktx2 = new KTX2Loader().setTranscoderPath(LIBS + "basis/").detectSupport(renderer);
  const loader = new GLTFLoader().setDRACOLoader(draco).setKTX2Loader(ktx2);

  return new Promise((resolve, reject) => {
    loader.load(URL, (gltf) => {
      try { resolve(build(gltf)); } catch (err) { reject(err); }
      draco.dispose();
    }, (e) => { if (e.total) onProgress?.(e.loaded / e.total); }, reject);
  });

  function build(gltf) {
    const root = gltf.scene;
    const plate = root.getObjectByName("License Plate");
    if (plate) plate.visible = false;

    // Centre on the floor
    root.updateMatrixWorld(true);
    const b0 = new THREE.Box3().setFromObject(root);
    const c0 = b0.getCenter(new THREE.Vector3());
    root.position.set(-c0.x, -b0.min.y, -c0.z);
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
    let dashMat = null, roof = null;

    root.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      const z = zoneOfNode(o);
      o.userData.zone = z;
      if (z) meshesBy[z].push(o);
      pickables.push(o);
      if (!z) return;
      const swap = (m) => {
        const isRoof = o.name === "BodyRoofPanel";
        const k = (isRoof ? "roof:" : z + ":") + m.uuid;
        if (!clones.has(k)) {
          const c = m.clone();
          patch(c, U[z], /^Paint/.test(m.name) && z === "paint");
          if (isRoof) { c.transparent = true; roof = { mat: c, mesh: o, o: 1 }; }
          if (m.name === "Dashboard") dashMat = c;
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
            gl_FragColor.rgb += vec3(1.0, 0.97, 0.94) * exp(-sd * sd * 7.0) * uSweepAmt * (0.04 + 0.2 * fres);` : ""}
            gl_FragColor.rgb += uHiColor * uHi * (0.04 + 0.9 * fres);`)
          // dim after tone mapping so glossy reflections darken too
          .replace("#include <tonemapping_fragment>", "#include <tonemapping_fragment>\ngl_FragColor.rgb *= 1.0 - 0.6 * uDim;");
      };
      mat.customProgramCacheKey = () => (isPaint ? "cd-paint" : "cd-part");
      mat.needsUpdate = true;
    }

    // ---- floor, shadow, light ----
    const disc = plinth(L * 0.68);
    scene.add(disc);
    const blob = shadowBlob();
    blob.scale.set(W * 1.55, L * 1.22, 1);
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
    const wheelNodes = ["WheelFrontL", "WheelFrontR", "WheelRearL", "WheelRearR"].map((n) => root.getObjectByName(n)).filter(Boolean);
    const wheelBoxes = wheelNodes.map((n) => new THREE.Box3().setFromObject(n));
    const front = wheelBoxes.filter((b) => b.getCenter(new THREE.Vector3()).z > 0);
    const fw = front.find((b) => b.getCenter(new THREE.Vector3()).x > 0) || wheelBoxes[0];
    const fwC = fw.getCenter(new THREE.Vector3());
    const fwR = fw.getSize(new THREE.Vector3()).y / 2;

    const ws = root.getObjectByName("BodyWindshield");
    const wsBox = ws ? new THREE.Box3().setFromObject(ws) : new THREE.Box3(new THREE.Vector3(-W / 3, H * 0.6, 0), new THREE.Vector3(W / 3, H * 0.9, L * 0.2));
    const wsC = wsBox.getCenter(new THREE.Vector3());

    const hl = root.getObjectByName("BodyHeadlights");
    const hlBox = hl ? boxOf([hl], (v) => v.x > 0) : new THREE.Box3(new THREE.Vector3(W * 0.25, H * 0.4, L * 0.42), new THREE.Vector3(W * 0.45, H * 0.5, L * 0.5));
    const hlC = hlBox.getCenter(new THREE.Vector3());
    const tl = root.getObjectByName("BodyTaillights");
    const tlC = tl ? boxOf([tl], (v) => v.x > 0).getCenter(new THREE.Vector3()) : new THREE.Vector3(W * 0.35, H * 0.5, -L * 0.48);

    let cabinBox = boxOf(meshesBy.interior.filter((m) => /Seats|Steering|Dash/.test(m.name)));
    if (cabinBox.isEmpty()) cabinBox = boxOf(meshesBy.interior);
    const cabinC = cabinBox.getCenter(new THREE.Vector3());
    const wheel = root.getObjectByName("InteriorSteeringWheel01");
    const steerC = wheel ? new THREE.Box3().setFromObject(wheel).getCenter(new THREE.Vector3()) : cabinC.clone();
    cabinLight.position.set(cabinC.x * 0.4, H * 0.62, cabinC.z);

    const hood = root.getObjectByName("BodyHood");
    const hoodBox = hood ? new THREE.Box3().setFromObject(hood) : box;
    const sideY = H * 0.5;
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const N = (x, y, z) => new THREE.Vector3(x, y, z).normalize();

    const zones = {
      paint: {
        view: { look: V3(W * 0.22, H * 0.42, L * 0.16), az: 0.66, el: 0.24, R: L * 0.4, fov: 26, mirror: true },
        anchors: [{ pos: V3(W * 0.49, sideY * 1.02, -L * 0.24), normal: N(1, 0.2, 0) }, { pos: V3(-W * 0.49, sideY * 1.02, -L * 0.24), normal: N(-1, 0.2, 0) }],
        box: hoodBox,
      },
      wheels: {
        view: { look: fwC.clone(), az: 1.18, el: 0.06, R: fwR * 1.55, fov: 24, mirror: true },
        anchors: [{ pos: V3(fw.max.x, fwC.y, fwC.z), normal: N(1, 0, 0.15) }, { pos: V3(-fw.max.x, fwC.y, fwC.z), normal: N(-1, 0, 0.15) }],
        box: fw,
      },
      glass: {
        view: { look: wsC.clone(), az: 0.4, el: 0.4, R: wsBox.getSize(new THREE.Vector3()).length() * 0.55, fov: 26 },
        anchors: [{ pos: V3(wsC.x, wsBox.max.y - (wsBox.max.y - wsBox.min.y) * 0.2, wsBox.min.z + (wsBox.max.z - wsBox.min.z) * 0.2), normal: N(0, 0.7, 0.7) }, { pos: V3(0, H * 0.78, -L * 0.18), normal: N(0, 0.7, -0.7) }],
        box: wsBox,
      },
      lights: {
        view: { look: hlC.clone(), az: 0.42, el: 0.1, R: Math.max(hlBox.getSize(new THREE.Vector3()).length() * 0.75, W * 0.16), fov: 24, mirror: true },
        anchors: [
          { pos: V3(hlC.x, hlC.y, hlBox.max.z), normal: N(0.45, 0, 1) }, { pos: V3(-hlC.x, hlC.y, hlBox.max.z), normal: N(-0.45, 0, 1) },
          { pos: tlC.clone(), normal: N(0.45, 0, -1) }, { pos: V3(-tlC.x, tlC.y, tlC.z), normal: N(-0.45, 0, -1) },
        ],
        box: hlBox,
      },
      interior: {
        view: { look: cabinC.clone(), az: 0.8, el: 1.02, R: Math.max(cabinBox.getSize(new THREE.Vector3()).length() * 0.5, L * 0.22), fov: 26, orbit: 0.9 },
        anchors: [{ pos: V3(cabinC.x * 0.5, cabinBox.max.y, cabinBox.min.z + (cabinBox.max.z - cabinBox.min.z) * 0.3), normal: null }],
        box: cabinBox,
      },
      full: {
        view: { look: V3(0, H * 0.4, 0), az: 0.9, el: 0.26, R: L * 0.6, fov: 28, spin: true },
        anchors: [],
        box: null,
      },
    };

    // ---- per-frame effects ----
    const fx = { sweepT: 1, lastFocus: null, lastHover: null, cabin: 0, roofO: 1 };
    const amt = Object.fromEntries(ZONES.map((z) => [z, { hi: 0, dim: 0 }]));
    function startSweep() { if (!reducedMotion && fx.sweepT > 0.6) fx.sweepT = 0; }

    const model = {
      fov: 28,
      overview: { look: V3(0, H * 0.36, L * 0.02), az: 0.78, el: 0.16, R: L * 0.5, fov: 28 },
      intro: { az: -0.9, el: 0.02, R: 1.5 },
      portraitR: 0.74,
      zones, pickables,
      zoneOf(hit) {
        const z = hit.object.userData.zone;
        if (z === "paint" && roof && hit.object === roof.mesh && roof.o < 0.5) return undefined; // see through the cut-away roof
        return z || undefined;
      },
      update(dt, { hover, focus }) {
        if (focus !== fx.lastFocus) { if (focus === "paint" || focus === "full") startSweep(); fx.lastFocus = focus; }
        if (hover !== fx.lastHover) { if (hover === "paint" && focus !== "paint") startSweep(); fx.lastHover = hover; }
        const k = 1 - Math.exp(-dt * 5);
        for (const z of ZONES) {
          const a = amt[z];
          const focusedHere = focus === z && !["paint", "interior"].includes(z) ? 0.35 : 0;
          const hiT = Math.min(1, (hover === z && focus !== z ? 0.85 : 0) + focusedHere);
          const dimT = focus && focus !== "full" && focus !== z ? 1 : 0;
          a.hi += (hiT - a.hi) * k;
          a.dim += (dimT - a.dim) * k;
          U[z].uHi.value = a.hi;
          U[z].uDim.value = a.dim;
        }
        // paint sweep
        if (fx.sweepT < 1) {
          fx.sweepT = Math.min(1, fx.sweepT + dt / 1.3);
          const p = fx.sweepT < 0.5 ? 4 * fx.sweepT ** 3 : 1 - Math.pow(-2 * fx.sweepT + 2, 3) / 2;
          sweep.uSweepZ.value = THREE.MathUtils.lerp(-L * 0.75, L * 0.75, p);
          sweep.uSweepAmt.value = Math.sin(Math.PI * fx.sweepT);
        } else sweep.uSweepAmt.value = 0;
        // interior: cut the roof away and light the cabin
        const inside = focus === "interior";
        fx.roofO += ((inside ? 0 : 1) - fx.roofO) * (1 - Math.exp(-dt * 4));
        if (roof) {
          roof.o = fx.roofO;
          roof.mat.opacity = fx.roofO;
          roof.mat.depthWrite = fx.roofO > 0.98;
          roof.mesh.visible = fx.roofO > 0.02;
          roof.mesh.castShadow = fx.roofO > 0.5;
        }
        fx.cabin += ((inside || hover === "interior" ? 1 : 0) - fx.cabin) * (1 - Math.exp(-dt * 4));
        cabinLight.intensity = fx.cabin * 2.4;
        if (dashMat) dashMat.emissiveIntensity = 1 + fx.cabin * 2.5;
      },
    };
    renderer.compile(scene, rig.camera);
    return model;
  }
}
