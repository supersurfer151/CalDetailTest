// 3D sports car for the "Configure Your Detail" section (configurator.js loads this lazily).
// Studio-lit real-time model with two emphasis effects: a light sweep across the paint (EXTERIOR)
// and a cabin light + brighter dash display (INTERIOR). Model: assets/car/car.gltf (see license.txt there).
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";

const LIBS = "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/";
const MODEL_URL = "assets/car/car.gltf";

// Camera presets. az = angle around the car (0 = straight at the nose, + = toward the driver's side),
// el = height angle, dist = multiplier on the fitted distance, look = where the camera aims (fractions of car size),
// shift = how far the car slides left (fraction of the stage width) to make room for the panel.
const VIEWS = {
  overview: { az: 0.76, el: 0.17, dist: 1.0, look: [0, 0.36, 0.02], shift: 0 },
  exterior: { az: 0.5, el: 0.15, dist: 1.12, look: [0, 0.36, 0.0], shift: 1 },
  interior: { az: 0.62, el: 0.42, dist: 0.86, look: [0.02, 0.52, -0.06], shift: 1 },
};

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Dark studio with long softboxes: gives the paint the clean strip reflections of a car configurator.
function studioEnvironment(renderer) {
  const env = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(40, 16, 40), new THREE.MeshBasicMaterial({ color: 0x07080a, side: THREE.BackSide }));
  room.position.y = 7;
  env.add(room);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color: 0x15171a }));
  floor.rotation.x = -Math.PI / 2;
  env.add(floor);
  const box = (w, h, pos, rot, k, tint = 0xffffff) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(tint).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.rotation.set(...rot);
    env.add(m);
  };
  box(2.2, 18, [0, 9, 0], [Math.PI / 2, 0, 0], 9);            // long overhead strip down the car's spine
  box(1.2, 18, [-3.2, 8.6, 0], [Math.PI / 2, 0.25, 0], 4);    // side overhead strips
  box(1.2, 18, [3.2, 8.6, 0], [Math.PI / 2, -0.25, 0], 4);
  box(10, 2.2, [-14, 3, 2], [0, Math.PI / 2, 0], 3.2);         // wall softboxes for the side reflections
  box(10, 2.2, [14, 3, -2], [0, -Math.PI / 2, 0], 2.4);
  box(14, 4, [0, 4, 16], [0, Math.PI, 0], 1.6, 0xdfe8ff);       // cool front fill
  box(14, 4, [0, 4, -16], [0, 0, 0], 0.9);                    // rear rim
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(env, 0.035).texture;
  pmrem.dispose();
  return tex;
}

// Soft contact shadow so the car sits on the floor instead of floating.
function shadowBlob() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(128, 128, 8, 128, 128, 128);
  grad.addColorStop(0, "rgba(0,0,0,0.85)");
  grad.addColorStop(0.45, "rgba(0,0,0,0.5)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
}

export function createCarViewer(container, { onProgress, onReady, onError, onHoverPart, onClickPart, reducedMotion }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: /[?&]poster\b/.test(location.search) });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer);

  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0004;
  scene.add(key, key.target);

  const cabinLight = new THREE.PointLight(0xd6e4ff, 0, 2.6, 1.6);
  scene.add(cabinLight);

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  const car = new THREE.Group();
  scene.add(car);

  // Emphasis state (eased every frame)
  const fx = {
    hover: null, state: "overview",
    sweep: { pos: 2, amt: 0, t: 1, dur: 1.25 },
    paintLift: 0, paintLiftTarget: 0,
    cabin: 0, cabinTarget: 0,
  };
  const sweepUniforms = { uSweepZ: { value: 99 }, uSweepAmt: { value: 0 }, uLift: { value: 0 } };
  let dashMat = null;

  // Camera state: current values ease toward the active preset; drag adds a user offset.
  const cam = { az: VIEWS.overview.az, el: VIEWS.overview.el, dist: 1, shift: 0, look: new THREE.Vector3() };
  const user = { az: 0, el: 0 };
  let view = VIEWS.overview;
  let size = { L: 4.5, H: 1.3, W: 2, R: 2.6 };
  let anchors = { exterior: new THREE.Vector3(), interior: new THREE.Vector3() };
  let shiftAmount = 0.17;
  let ready = false;
  let pickables = [];

  function partCategory(obj) {
    for (let o = obj; o; o = o.parent) {
      const n = o.name || "";
      if (/^Interior/.test(n) || /Windshield$|Window$|Rearwindow|WindowsRear/.test(n)) return "interior";
      if (/^(Body|Wheel)/.test(n)) return "exterior";
    }
    return "exterior";
  }

  function patchPaint(mat) {
    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, sweepUniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWorldPos;")
        .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWorldPos;\nuniform float uSweepZ;\nuniform float uSweepAmt;\nuniform float uLift;")
        .replace("#include <opaque_fragment>", `#include <opaque_fragment>
          float d = vWorldPos.z - uSweepZ + vWorldPos.y * 0.35;
          float band = exp(-d * d * 7.0);
          float facing = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 2.0);
          gl_FragColor.rgb += vec3(1.0, 0.97, 0.94) * band * uSweepAmt * (0.035 + 0.16 * facing);
          gl_FragColor.rgb *= 1.0 + uLift * 0.14;`);
    };
    mat.needsUpdate = true;
  }

  // ---------- Load ----------
  const draco = new DRACOLoader().setDecoderPath(LIBS + "draco/gltf/");
  const ktx2 = new KTX2Loader().setTranscoderPath(LIBS + "basis/").detectSupport(renderer);
  const loader = new GLTFLoader().setDRACOLoader(draco).setKTX2Loader(ktx2);
  loader.load(MODEL_URL, (gltf) => {
    const model = gltf.scene;
    const plate = model.getObjectByName("License Plate");
    if (plate) plate.visible = false;

    const paintMats = new Set();
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      pickables.push(o);
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        if (/^Paint/.test(m.name)) paintMats.add(m);
        if (m.name === "Dashboard") dashMat = m;
      });
    });
    paintMats.forEach(patchPaint);

    // Center the car on the floor at the origin
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const c = box.getCenter(new THREE.Vector3());
    model.position.set(-c.x, -box.min.y, -c.z);
    car.add(model);
    car.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(car);
    const dims = b.getSize(new THREE.Vector3());
    size = { L: dims.z, H: dims.y, W: dims.x, R: b.getBoundingSphere(new THREE.Sphere()).radius };

    // Anchor points the connector lines attach to: the front of the hood, and the steering wheel (driver's seat)
    const hood = model.getObjectByName("BodyHood");
    const hb = hood ? new THREE.Box3().setFromObject(hood) : b;
    anchors.exterior = new THREE.Vector3(size.W * 0.12, hb.max.y - (hb.max.y - hb.min.y) * 0.18, hb.max.z - (hb.max.z - hb.min.z) * 0.32);
    const seat = model.getObjectByName("InteriorSteeringWheel01") || model.getObjectByName("InteriorSeatsColor1");
    anchors.interior = seat ? new THREE.Box3().setFromObject(seat).getCenter(new THREE.Vector3()) : new THREE.Vector3(size.W * 0.2, size.H * 0.6, 0);
    cabinLight.position.set(anchors.interior.x * 0.4, size.H * 0.62, anchors.interior.z - size.L * 0.08);

    const blob = shadowBlob();
    blob.rotation.x = -Math.PI / 2;
    blob.scale.set(size.W * 1.55, size.L * 1.25, 1);
    blob.position.y = 0.002;
    scene.add(blob);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.42 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    key.position.set(size.W * 1.2, size.H * 6, size.L * 0.8);
    const s = size.L * 0.9;
    Object.assign(key.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 0.5, far: size.H * 14 });
    key.shadow.camera.updateProjectionMatrix();

    cam.look.set(VIEWS.overview.look[0] * size.W, VIEWS.overview.look[1] * size.H, VIEWS.overview.look[2] * size.L);
    ready = true;
    resize();
    renderer.compile(scene, camera);
    onReady && onReady();
    draco.dispose();
  }, (e) => {
    if (e.total) onProgress && onProgress(e.loaded / e.total);
  }, (err) => onError && onError(err));

  // ---------- Sizing ----------
  let width = 1, height = 1;
  function resize() {
    const r = container.getBoundingClientRect();
    width = Math.max(1, r.width);
    height = Math.max(1, r.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // On narrow stages the panel sits below the car, so there's no need to slide it over
    shiftAmount = width > 860 ? 0.165 : 0;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  function fittedDistance() {
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    // Two limits, whichever is stricter wins: car length vs. stage width (a 3/4 view shows ~65% of the length),
    // and car height vs. stage height. Wide screens hit the height limit, tablets and phones the width limit.
    const fill = width > 860 ? 0.55 : 0.92;
    const dW = (size.L * 0.5) / Math.tan((hfov * fill) / 2);
    const share = width > 860 ? 0.3 : 0.42;
    const dH = (size.H * 0.5) / Math.tan((vfov * share) / 2);
    return Math.max(dW, dH) * 1.08;
  }

  // ---------- Pointer: drag to rotate, hover/click parts ----------
  const el = renderer.domElement;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let drag = null, moved = false, hoverPart = null, pendingPick = null;
  el.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY, az: user.az, el: user.el, id: e.pointerId };
    moved = false;
  });
  window.addEventListener("pointermove", (e) => {
    if (drag && e.pointerId === drag.id) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!moved && Math.hypot(dx, dy) > 6) {
        moved = true;
        el.setPointerCapture?.(drag.id);
        container.classList.add("is-dragging");
      }
      if (moved) {
        user.az = drag.az - dx * 0.0065;
        user.el = THREE.MathUtils.clamp(drag.el + dy * 0.003, -0.12, 0.35);
      }
      return;
    }
    if (e.target === el && e.pointerType === "mouse") pendingPick = e;
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    container.classList.remove("is-dragging");
    if (!moved && e.type === "pointerup") {
      const cat = pick(e);
      if (cat) onClickPart && onClickPart(cat);
    }
    drag = null;
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
  el.addEventListener("pointerleave", () => {
    pendingPick = null;
    if (hoverPart) { hoverPart = null; onHoverPart && onHoverPart(null); }
  });

  function pick(e) {
    if (!ready) return null;
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, false).find((h) => h.object.visible);
    return hit ? partCategory(hit.object) : null;
  }

  // ---------- Public controls ----------
  function setState(state) {
    if (!VIEWS[state]) return;
    const prev = fx.state;
    fx.state = state;
    view = VIEWS[state];
    user.az = 0; user.el = 0;
    if (state === "exterior" && prev !== "exterior") startSweep();
    fx.paintLiftTarget = state === "exterior" || fx.hover === "exterior" ? 1 : 0;
    fx.cabinTarget = state === "interior" || fx.hover === "interior" ? 1 : 0;
  }
  function setHover(cat) {
    if (fx.hover === cat) return;
    fx.hover = cat;
    if (cat === "exterior" && fx.state !== "exterior") startSweep();
    fx.paintLiftTarget = cat === "exterior" || fx.state === "exterior" ? 1 : 0;
    fx.cabinTarget = cat === "interior" || fx.state === "interior" ? 1 : 0;
  }
  function startSweep() {
    if (reducedMotion) return;
    if (fx.sweep.t < 0.6) return; // let a running sweep finish
    fx.sweep.t = 0;
  }

  // ---------- Frame loop ----------
  const frameCallbacks = new Set();
  const projected = { exterior: { x: 0, y: 0 }, interior: { x: 0, y: 0 } };
  const tmp = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  let running = false, last = 0, clock = 0;

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    clock += dt;
    if (!ready) return;

    if (pendingPick && !drag) {
      const cat = pick(pendingPick);
      pendingPick = null;
      if (cat !== hoverPart) { hoverPart = cat; onHoverPart && onHoverPart(cat); }
    }

    // Ease camera toward the preset (+ the user's drag offset, + a slow idle drift in the overview)
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 2.6);
    const idle = !reducedMotion && fx.state === "overview" && !drag ? Math.sin(clock * 0.22) * 0.07 : 0;
    cam.az += (view.az + user.az + idle - cam.az) * k;
    cam.el += (view.el + user.el - cam.el) * k;
    cam.dist += ((width > 860 ? view.dist : Math.max(view.dist, 1)) - cam.dist) * k; // no close-ups on phones
    cam.shift += (view.shift * shiftAmount - cam.shift) * k;
    lookTarget.set(view.look[0] * size.W, view.look[1] * size.H, view.look[2] * size.L);
    cam.look.lerp(lookTarget, k);

    const d = fittedDistance() * cam.dist;
    camera.position.set(
      cam.look.x + d * Math.cos(cam.el) * Math.sin(cam.az),
      cam.look.y + d * Math.sin(cam.el),
      cam.look.z + d * Math.cos(cam.el) * Math.cos(cam.az),
    );
    camera.lookAt(cam.look);
    // Slide the image (not the camera) so perspective stays identical while the car makes room for the panel
    camera.filmOffset = cam.shift * 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect * camera.getFilmWidth();
    camera.updateProjectionMatrix();

    // Emphasis effects
    const ke = 1 - Math.exp(-dt * 4);
    fx.paintLift += (fx.paintLiftTarget - fx.paintLift) * ke;
    fx.cabin += (fx.cabinTarget - fx.cabin) * ke;
    if (fx.sweep.t < 1) {
      fx.sweep.t = Math.min(1, fx.sweep.t + dt / fx.sweep.dur);
      const p = easeInOut(fx.sweep.t);
      sweepUniforms.uSweepZ.value = THREE.MathUtils.lerp(-size.L * 0.75, size.L * 0.75, p);
      sweepUniforms.uSweepAmt.value = Math.sin(Math.PI * fx.sweep.t);
    } else {
      sweepUniforms.uSweepAmt.value = 0;
    }
    sweepUniforms.uLift.value = fx.paintLift;
    cabinLight.intensity = fx.cabin * 2.2;
    if (dashMat) dashMat.emissiveIntensity = 1 + fx.cabin * 2.5;

    renderer.render(scene, camera);

    for (const name of ["exterior", "interior"]) {
      tmp.copy(anchors[name]).project(camera);
      projected[name].x = (tmp.x * 0.5 + 0.5) * width;
      projected[name].y = (-tmp.y * 0.5 + 0.5) * height;
    }
    frameCallbacks.forEach((cb) => cb(projected));
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  return {
    setState, setHover, start, stop,
    onFrame: (cb) => frameCallbacks.add(cb),
    snapshot: () => renderer.domElement.toDataURL("image/png"),
  };
}
