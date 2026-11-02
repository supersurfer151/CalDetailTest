// Interactive 3D boat: drag to rotate, click a part of the boat to see the services for that zone.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export const ZONES = { NONE: 0, HULL: 1, TOPSIDE: 2, CONSOLE: 3, METAL: 4, WHOLE: 5 };

// Each vertex carries a baked "_zone" attribute (see assets/boat/boat.gltf), so clicks and highlights agree exactly
const GLSL_ZONE = /* glsl */ `
  uniform int uHover;
  uniform int uSelected;
  uniform vec3 uTint;
  flat varying int vZone;
`;

const DEBUG_COLORS = ["vec3(0.5)", "vec3(0.1,0.4,1.0)", "vec3(0.1,0.8,0.3)", "vec3(1.0,0.6,0.1)", "vec3(0.9,0.1,0.6)"];

function patchMaterial(mat, uniforms, debug) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float _zone;\nflat varying int vZone;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvZone = int(_zone + 0.5);");
    const tint = debug
      ? `vec3 dbg[5] = vec3[5](${DEBUG_COLORS.join(",")}); gl_FragColor.rgb = mix(gl_FragColor.rgb, dbg[zone], 0.6);`
      : `if (zone != 0) {
           if (uSelected == 5) gl_FragColor.rgb = mix(gl_FragColor.rgb, uTint, 0.32);
           else if (zone == uSelected) gl_FragColor.rgb = mix(gl_FragColor.rgb, uTint, 0.42);
           else if (zone == uHover) gl_FragColor.rgb = mix(gl_FragColor.rgb, uTint, 0.2);
         }`;
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\n" + GLSL_ZONE)
      // the source model marks gel coat ~60% metallic, which renders white plastic as grey; keep metal for real metal parts
      .replace("#include <metalnessmap_fragment>", "#include <metalnessmap_fragment>\nif (vZone != 4) metalnessFactor *= 0.1;")
      .replace("#include <opaque_fragment>", `#include <opaque_fragment>
        int zone = vZone;
        ${tint}`);
  };
  mat.needsUpdate = true;
}

export function createBoatViewer(container, { onZoneClick, onHover, onProgress, onReady }) {
  const params = new URLSearchParams(location.search);
  const debug = params.has("zones");
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(4, 8, 5);
  scene.add(sun, new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.6));

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(-6.5, 3.2, 6.5);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 4.5;
  controls.maxDistance = 14;
  controls.maxPolarAngle = Math.PI * 0.82; // allow looking up at the hull bottom
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;
  controls.target.set(0, 0.6, 0);
  controls.addEventListener("start", () => (controls.autoRotate = false));
  // Plain mouse-wheel scrolls the page; zoom needs a trackpad pinch (sent as ctrl+wheel) or Ctrl/Cmd + scroll
  container.addEventListener("wheel", (e) => { if (!e.ctrlKey && !e.metaKey) e.stopPropagation(); }, { capture: true });
  // On touch screens, vertical swipes scroll the page and sideways swipes spin the boat (OrbitControls sets "none")
  renderer.domElement.style.touchAction = "pan-y";
  if (debug || params.has("boatcam")) { controls.autoRotate = false; window.__boat = { camera, controls }; }

  // Soft contact shadow under the boat
  const shadowTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d"); const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(0,0,0,0.35)"); grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3, 7.5), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.36;
  scene.add(shadow);

  const uniforms = { uHover: { value: 0 }, uSelected: { value: 0 }, uTint: { value: new THREE.Color(0x2b8cff) } };
  const pickables = [];

  const manager = new THREE.LoadingManager();
  manager.onProgress = (_url, loaded, total) => onProgress && onProgress(loaded / total);
  new GLTFLoader(manager).load("assets/boat/boat.gltf", (gltf) => {
    const model = gltf.scene;
    model.traverse((o) => {
      if (!o.isMesh) return;
      pickables.push(o);
      patchMaterial(o.material, uniforms, debug);
    });
    // Centre the boat on the origin with the hull resting on the shadow
    const box = new THREE.Box3().setFromObject(model);
    const c = box.getCenter(new THREE.Vector3());
    model.position.set(-c.x, -box.min.y - 0.35, -c.z);
    scene.add(model);
    onReady && onReady();
  });

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pick(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    if (!hit) return ZONES.NONE;
    const z = hit.object.geometry.attributes._zone;
    // WebGL's flat varyings take the triangle's last vertex, so read that one to match the highlight
    return z ? Math.round(z.getX(hit.face.c)) : ZONES.NONE;
  }

  // Distinguish a click from a drag so rotating the boat doesn't change the selection
  let down = null;
  renderer.domElement.addEventListener("pointerdown", (e) => (down = { x: e.clientX, y: e.clientY }));
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    const z = pick(e);
    if (z) onZoneClick(z);
  });
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || e.buttons) return;
    const z = pick(e);
    uniforms.uHover.value = z;
    renderer.domElement.style.cursor = z ? "pointer" : "grab";
    onHover && onHover(z, e);
  });
  renderer.domElement.addEventListener("pointerleave", () => { uniforms.uHover.value = 0; onHover && onHover(0); });

  function resize() {
    const { clientWidth: w, clientHeight: h } = container;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  // Only render while the viewer is on screen
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(container);
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    controls.update();
    shadow.visible = camera.position.y > shadow.position.y + 0.2; // don't block the view of the hull bottom
    renderer.render(scene, camera);
  });

  return {
    select(zone) { uniforms.uSelected.value = zone; },
  };
}
