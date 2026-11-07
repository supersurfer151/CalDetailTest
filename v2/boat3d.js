// 3D boat for the boat garage. Every vertex of ../assets/boat/boat.gltf carries a baked "_zone" number
// (1 hull, 2 topside & deck, 3 console & interior, 4 metal & T-top), so clicks and highlights line up
// exactly with the parts. "Shrink wrap" covers the whole boat.
// Model: "2004 17' Scout - Center Console" by BoatUS Foundation, CC BY 4.0 (see ../assets/boat/license.txt).
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const URL = "../assets/boat/boat.gltf";
const IDS = [null, "hull", "topside", "console", "metal"];   // _zone number → zone id
const BOW = 1;  // +1 if the bow points toward +z, -1 if toward -z

function canvasTex(size, draw) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d"), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function loadBoat(rig, { onProgress, reducedMotion } = {}) {
  const { renderer, scene } = rig;
  renderer.toneMappingExposure = 1.05;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(4, 8, 5);
  scene.add(sun, new THREE.HemisphereLight(0xdfe8ff, 0x445566, 0.55));

  const manager = new THREE.LoadingManager();
  manager.onProgress = (_u, loaded, total) => onProgress?.(loaded / total);
  return new Promise((resolve, reject) => {
    new GLTFLoader(manager).load(URL, (gltf) => {
      try { resolve(build(gltf)); } catch (e) { reject(e); }
    }, undefined, reject);
  });

  function build(gltf) {
    const root = gltf.scene;
    root.updateMatrixWorld(true);
    const b0 = new THREE.Box3().setFromObject(root);
    const c0 = b0.getCenter(new THREE.Vector3());
    root.position.set(-c0.x, -b0.min.y, -c0.z);
    scene.add(root);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const L = Math.max(size.x, size.z), H = size.y;

    // Per-zone highlight uniforms (index = _zone number)
    const U = { uHi: { value: [0, 0, 0, 0, 0] }, uDim: { value: [0, 0, 0, 0, 0] }, uWrap: { value: 0 }, uHiColor: { value: new THREE.Color(0x3d8bff) } };
    const pickables = [];
    const patched = new Set();
    const zoneBoxes = [null, new THREE.Box3(), new THREE.Box3(), new THREE.Box3(), new THREE.Box3()];
    const v = new THREE.Vector3();
    const bowRail = new THREE.Vector3(0, 0, -BOW * 1e9);

    root.traverse((o) => {
      if (!o.isMesh) return;
      pickables.push(o);
      const zone = o.geometry.attributes._zone;
      const pos = o.geometry.attributes.position;
      if (zone) for (let i = 0; i < pos.count; i += 3) {
        const z = Math.round(zone.getX(i));
        if (z > 0 && z < 5) {
          zoneBoxes[z].expandByPoint(v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld));
          if (z === 4 && v.z * BOW > bowRail.z * BOW) bowRail.copy(v); // furthest-forward metal = bow rail
        }
      }
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
        if (patched.has(m)) return;
        patched.add(m);
        m.onBeforeCompile = (sh) => {
          Object.assign(sh.uniforms, U);
          sh.vertexShader = sh.vertexShader
            .replace("#include <common>", "#include <common>\nattribute float _zone;\nflat varying int vZone;")
            .replace("#include <begin_vertex>", "#include <begin_vertex>\nvZone = int(_zone + 0.5);");
          sh.fragmentShader = sh.fragmentShader
            .replace("#include <common>", "#include <common>\nflat varying int vZone;\nuniform float uHi[5];\nuniform float uDim[5];\nuniform float uWrap;\nuniform vec3 uHiColor;")
            // the source model marks gel coat ~60% metallic, which renders white plastic grey; keep metal for real metal
            .replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\nif (vZone != 4) metalnessFactor *= 0.1;")
            .replace("#include <opaque_fragment>", `#include <opaque_fragment>
              int zi = clamp(vZone, 0, 4);
              float fres = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 2.5);
              gl_FragColor.rgb += uHiColor * uHi[zi] * (0.05 + 0.9 * fres);
              gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.9, 0.94, 1.0) * (0.5 + 0.55 * fres), 0.72 * uWrap);`)
            // dim after tone mapping so bright gel coat darkens visibly
            .replace("#include <tonemapping_fragment>", "#include <tonemapping_fragment>\ngl_FragColor.rgb *= 1.0 - 0.55 * uDim[clamp(vZone, 0, 4)];");
        };
        m.customProgramCacheKey = () => "cd-boat";
        m.needsUpdate = true;
      });
    });

    // Floor: turntable disc + contact shadow
    const disc = new THREE.Mesh(new THREE.PlaneGeometry(L * 1.4, L * 1.4), new THREE.MeshBasicMaterial({
      transparent: true, depthWrite: false,
      map: canvasTex(1024, (g, s) => {
        const c = s / 2;
        const glow = g.createRadialGradient(c, c, 0, c, c, c);
        glow.addColorStop(0, "rgba(140,160,190,0.10)"); glow.addColorStop(0.75, "rgba(140,160,190,0.05)"); glow.addColorStop(1, "rgba(140,160,190,0)");
        g.fillStyle = glow; g.fillRect(0, 0, s, s);
        g.strokeStyle = "rgba(255,255,255,0.16)"; g.lineWidth = 3; g.beginPath(); g.arc(c, c, c * 0.86, 0, Math.PI * 2); g.stroke();
        g.strokeStyle = "rgba(61,139,255,0.35)"; g.lineWidth = 2; g.setLineDash([s * 0.02, s * 0.03]); g.beginPath(); g.arc(c, c, c * 0.9, 0, Math.PI * 2); g.stroke();
      }),
    }));
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.001;
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(size.x * 1.5, size.z * 1.2), new THREE.MeshBasicMaterial({
      transparent: true, depthWrite: false,
      map: canvasTex(128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(0,0,0,0.55)"); r.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }),
    }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.002;
    scene.add(disc, shadow);

    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const N = (x, y, z) => new THREE.Vector3(x, y, z).normalize();
    const ctr = (b) => b.getCenter(new THREE.Vector3());
    const rad = (b) => b.getSize(new THREE.Vector3()).length() / 2;
    const az = (a) => (BOW > 0 ? a : a + Math.PI);   // angles below are measured from the bow
    const [, hullB, topB, conB, metB] = zoneBoxes;
    const hullC = ctr(hullB), topC = ctr(topB), conC = ctr(conB), metC = ctr(metB);

    const zones = {
      hull: {
        view: { look: V3(0, hullC.y * 0.9, hullC.z), az: az(1.42), el: -0.02, R: L * 0.44, fov: 26, mirror: true },
        anchors: [{ pos: V3(hullB.max.x * 0.98, hullB.min.y + (hullB.max.y - hullB.min.y) * 0.45, hullC.z + BOW * L * 0.1), normal: N(1, 0, 0) },
                  { pos: V3(hullB.min.x * 0.98, hullB.min.y + (hullB.max.y - hullB.min.y) * 0.45, hullC.z + BOW * L * 0.1), normal: N(-1, 0, 0) }],
        box: hullB,
      },
      topside: {
        view: { look: topC.clone(), az: az(0.7), el: 0.66, R: rad(topB) * 0.95, fov: 26 },
        anchors: [{ pos: V3(topC.x, topB.max.y * 0.92, topC.z + BOW * L * 0.22), normal: null }],
        box: topB,
      },
      console: {
        view: { look: conC.clone(), az: az(0.95), el: 0.42, R: Math.max(rad(conB) * 1.15, L * 0.16), fov: 26 },
        anchors: [{ pos: V3(conC.x, conB.max.y * 0.9, conC.z), normal: null }],
        box: conB,
      },
      metal: {
        view: { look: metC.clone(), az: az(0.75), el: 0.3, R: rad(metB) * 0.9, fov: 26 },
        anchors: [{ pos: bowRail.z * BOW > -1e8 ? bowRail.clone().add(V3(0, 0, -BOW * L * 0.06)) : V3(metC.x, metB.max.y, metC.z), normal: null }],
        box: metB,
      },
      whole: {
        view: { look: V3(0, H * 0.42, 0), az: az(0.9), el: 0.3, R: L * 0.6, fov: 28, spin: true },
        anchors: [],
        box: null,
      },
    };

    const amt = { hi: [0, 0, 0, 0, 0], dim: [0, 0, 0, 0, 0], wrap: 0 };
    return {
      fov: 28,
      overview: { look: V3(0, H * 0.4, 0), az: az(0.62), el: 0.2, R: L * 0.48, fov: 28 },
      intro: { az: -0.9, el: 0.02, R: 1.5 },
      portraitR: 0.78,
      zones, pickables,
      zoneOf(hit) {
        const z = hit.object.geometry.attributes._zone;
        // WebGL flat varyings come from the triangle's last vertex, so read that one to match the highlight
        const n = z ? Math.round(z.getX(hit.face.c)) : 0;
        return IDS[n] || undefined;
      },
      update(dt, { hover, focus }) {
        const k = 1 - Math.exp(-dt * 5);
        for (let i = 1; i < 5; i++) {
          const id = IDS[i];
          const hiT = Math.min(1, (hover === id && focus !== id ? 0.8 : 0) + (focus === id ? 0.3 : 0) + (hover === "whole" && focus !== "whole" ? 0.4 : 0));
          const dimT = focus && focus !== "whole" && focus !== id ? 1 : 0;
          amt.hi[i] += (hiT - amt.hi[i]) * k;
          amt.dim[i] += (dimT - amt.dim[i]) * k;
          U.uHi.value[i] = amt.hi[i];
          U.uDim.value[i] = amt.dim[i];
        }
        amt.wrap += ((focus === "whole" ? 1 : 0) - amt.wrap) * (1 - Math.exp(-dt * 2.5));
        U.uWrap.value = amt.wrap;
      },
    };
  }
}
