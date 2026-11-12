// Shared 3D "garage" camera rig used by the car and the boat. A model module (car3d.js / boat3d.js) loads
// its glTF and describes its parts ("zones"): where to point the camera for each one, where its marker
// sits, and how to highlight it. The rig handles the renderer, the cinematic camera moves between parts,
// drag-to-rotate, hover/click picking and projecting markers into screen space.
import * as THREE from "three";

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export function createRig(container, { reducedMotion, onHover, onPick, onFrame }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.05, 200);

  let model = null;          // set by setModel()
  let focusId = null, hoverId = null;
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const insetsNow = { top: 0, right: 0, bottom: 0, left: 0 };

  // Camera: "cur" is what we render; a tween moves it from "from" to "to" when the focus changes.
  const cur = { look: new THREE.Vector3(), az: 0, el: 0.2, R: 3, fov: 28 };
  const from = { look: new THREE.Vector3(), az: 0, el: 0, R: 0, fov: 0 };
  let to = null, tweenT = 1, tweenDur = 1.15;
  const user = { az: 0, el: 0 };     // drag offset on top of the current view
  let clock = 0, idleAmp = 0, spinAcc = 0;

  // ---------- sizing ----------
  let W = 1, H = 1;
  function resize() {
    const r = container.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
  }
  new ResizeObserver(resize).observe(container);
  resize();

  // Distance so a sphere of radius R fills `fill` of the free area (screen minus the panel / sheet)
  function distanceFor(R, fov, fill = 0.92) {
    const availW = Math.max(80, W - insetsNow.left - insetsNow.right);
    const availH = Math.max(80, H - insetsNow.top - insetsNow.bottom);
    // a bounding sphere is a loose fit for a long vehicle; on tall (phone) screens let it fill more of the width
    if (availW < availH && model?.portraitR) R *= model.portraitR;
    const t = Math.tan(THREE.MathUtils.degToRad(fov) / 2);
    const vfov = 2 * Math.atan(t * (availH / H));
    const hfov = 2 * Math.atan(t * camera.aspect * (availW / W));
    return R / Math.sin(Math.min(vfov, hfov) * fill / 2);
  }

  // ---------- views ----------
  function viewFor(id) {
    if (!model) return null;
    const z = id && model.zones[id];
    const v = z ? z.view : model.overview;
    const out = { look: v.look.clone(), az: v.az, el: v.el, R: v.R, fov: v.fov ?? model.fov ?? 28, spin: !!v.spin };
    // Symmetric models: if we're looking from the other side, mirror the shot instead of swinging around
    if (z && v.mirror && camera.position.x * Math.sin(v.az) < 0) { out.look.x *= -1; out.az = -out.az; out.mirrored = true; }
    return out;
  }
  function startTween(target, dur = 1.15) {
    from.look.copy(cur.look); from.az = cur.az + user.az; from.el = cur.el + user.el; from.R = cur.R; from.fov = cur.fov;
    // shortest way around
    target.az = from.az + wrap(target.az - from.az);
    user.az = 0; user.el = 0;
    cur.az = from.az; cur.el = from.el;
    to = target; tweenT = reducedMotion ? 1 : 0; tweenDur = dur;
    if (reducedMotion) applyTween(1);
  }
  function applyTween(t) {
    const e = easeInOut(t);
    cur.look.lerpVectors(from.look, to.look, e);
    cur.az = from.az + (to.az - from.az) * e;
    cur.el = from.el + (to.el - from.el) * e;
    // pull back a touch mid-move, then dive in: reads as a camera move, not a zoom
    const bump = Math.sin(Math.PI * e) * 0.18 * Math.max(from.R, to.R);
    cur.R = from.R + (to.R - from.R) * e + bump;
    cur.fov = from.fov + (to.fov - from.fov) * e;
  }

  // ---------- pointer ----------
  const el = renderer.domElement;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let drag = null, moved = false, pendingHover = null;
  el.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY, az: user.az, el: user.el, id: e.pointerId };
    moved = false;
  });
  window.addEventListener("pointermove", (e) => {
    if (drag && e.pointerId === drag.id) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!moved && Math.hypot(dx, dy) > 6) { moved = true; el.setPointerCapture?.(drag.id); container.classList.add("is-dragging"); }
      if (moved) {
        const lim = focusId && model?.zones[focusId]?.view.orbit !== undefined ? model.zones[focusId].view.orbit : focusId ? 0.6 : Infinity;
        user.az = THREE.MathUtils.clamp(drag.az - dx * 0.0065, -lim, lim);
        user.el = THREE.MathUtils.clamp(drag.el + dy * 0.003, -0.25, 0.35);
      }
      return;
    }
    if (e.target === el && e.pointerType === "mouse") pendingHover = e;
  });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    container.classList.remove("is-dragging");
    if (!moved && e.type === "pointerup") { const id = pick(e); if (id) onPick?.(id); }
    drag = null;
  };
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);
  el.addEventListener("pointerleave", () => { pendingHover = null; setHoverInternal(null); });

  function pick(e) {
    if (!model) return null;
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(model.pickables, false);
    for (const h of hits) {
      if (!h.object.visible) continue;
      const id = model.zoneOf(h);
      if (id !== undefined) return id;
    }
    return null;
  }
  function setHoverInternal(id) {
    if (id === hoverId) return;
    hoverId = id;
    container.classList.toggle("is-pointing", !!id);
    onHover?.(id);
  }

  // ---------- frame ----------
  const tmp = new THREE.Vector3(), camDir = new THREE.Vector3();
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  const out = { anchors: {}, rect: null };
  let running = false, last = 0;

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000 || 0.016);
    last = now; clock += dt;
    if (!model) return;

    if (pendingHover && !drag) { const id = pick(pendingHover); pendingHover = null; setHoverInternal(id); }

    // panel insets ease in with the panel's slide
    const ki = reducedMotion ? 1 : 1 - Math.exp(-dt * 7);
    for (const k in insets) insetsNow[k] += (insets[k] - insetsNow[k]) * ki;

    if (to && tweenT < 1) { tweenT = Math.min(1, tweenT + dt / tweenDur); applyTween(tweenT); }
    // let go after a drag in a close-up: drift back toward the framed shot
    if (!drag && focusId && !reducedMotion) { user.az *= 1 - Math.min(1, dt * 0.8); user.el *= 1 - Math.min(1, dt * 0.8); }

    // slow idle sway in the overview (eases in/out so focusing never jumps)
    idleAmp += ((focusId || drag || reducedMotion ? 0 : 1) - idleAmp) * (1 - Math.exp(-dt * 1.2));
    const idle = Math.sin(clock * 0.18) * 0.14 * idleAmp;
    // "full vehicle" shots turn slowly like a turntable
    if (to?.spin && tweenT >= 1 && !drag && !reducedMotion) spinAcc += dt * 0.16;
    const az = cur.az + user.az + idle + spinAcc;
    const elv = THREE.MathUtils.clamp(cur.el + user.el, -0.2, 1.45);
    camera.fov = cur.fov;
    const d = distanceFor(cur.R, cur.fov);
    camera.position.set(
      cur.look.x + d * Math.cos(elv) * Math.sin(az),
      cur.look.y + d * Math.sin(elv),
      cur.look.z + d * Math.cos(elv) * Math.cos(az),
    );
    camera.lookAt(cur.look);
    camera.near = Math.max(0.02, d * 0.05);
    camera.far = d * 20 + 50;
    // Shift the picture so the subject centres in the free area beside the panel / above the sheet
    camera.setViewOffset(W, H, (insetsNow.right - insetsNow.left) / 2, (insetsNow.bottom - insetsNow.top) / 2, W, H);
    camera.updateProjectionMatrix();

    model.update?.(dt, { hover: hoverId, focus: focusId, camera, clock });
    renderer.render(scene, camera);

    // markers: pick each zone's anchor that faces the camera most, then project
    camDir.copy(camera.position);
    for (const id in model.zones) {
      const z = model.zones[id];
      if (!z.anchors?.length) continue;
      let best = z.anchors[0], bestDot = -Infinity;
      for (const a of z.anchors) {
        const dot = a.normal ? tmp.copy(camDir).sub(a.pos).normalize().dot(a.normal) : 0;
        if (dot > bestDot) { bestDot = dot; best = a; }
      }
      tmp.copy(best.pos).project(camera);
      out.anchors[id] = { x: (tmp.x * 0.5 + 0.5) * W, y: (-tmp.y * 0.5 + 0.5) * H, facing: best.normal ? bestDot : 1 };
    }
    // screen rectangle of the focused part (for the targeting brackets)
    out.rect = null;
    const fz = focusId && model.zones[focusId];
    out.photo = fz?.photo && tweenT > 0.6 ? fz.photo : null;   // zones without 3D detail can open a photo instead
    if (fz?.box && tweenT > 0.6) {
      const b = fz.rectBox || fz.box;
      let i = 0;
      for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const zz of [b.min.z, b.max.z]) corners[i++].set(x, y, zz);
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const c of corners) {
        if (to?.mirrored) c.x = -c.x;
        c.project(camera);
        const sx = (c.x * 0.5 + 0.5) * W, sy = (-c.y * 0.5 + 0.5) * H;
        x0 = Math.min(x0, sx); y0 = Math.min(y0, sy); x1 = Math.max(x1, sx); y1 = Math.max(y1, sy);
      }
      out.rect = { x0, y0, x1, y1 };
    }
    onFrame?.(out);
  }

  return {
    renderer, scene, camera,
    setModel(m) {
      model = m;
      const v = viewFor(null);
      cur.look.copy(v.look); cur.az = v.az; cur.el = v.el; cur.R = v.R; cur.fov = v.fov;
      // entrance: start low and wide, sweep up into the hero shot
      if (!reducedMotion && m.intro) {
        cur.az = v.az + m.intro.az; cur.el = m.intro.el; cur.R = v.R * m.intro.R;
        startTween(viewFor(null), 2.2);
      } else to = v;
    },
    focus(id) {
      if (id === focusId || !model) return;
      focusId = id;
      cur.az += spinAcc; spinAcc = 0; // keep the turntable angle we're at
      startTween(viewFor(id), id ? 1.25 : 1.1);
    },
    setHover(id) { setHoverInternal(id); },
    setInsets(v) { Object.assign(insets, v); },
    start() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } },
    stop() { running = false; },
    get focusId() { return focusId; },
  };
}
