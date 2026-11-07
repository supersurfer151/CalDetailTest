// Motorcycle garage stage: a real shop photo instead of a 3D model, with the same interface as the 3D rig.
// Each part is a point on the photo; focusing a part zooms the photo into that spot.
// Coordinates are fractions of the photo (0–1). `zoom` is how far to push in.
const PHOTO = "img/moto-stage.jpg";
const PARTS = {
  paint:  { at: [0.47, 0.37], box: [0.35, 0.31, 0.57, 0.45], zoom: 2.3 },
  chrome: { at: [0.27, 0.6], box: [0.14, 0.53, 0.5, 0.66], zoom: 2.0, anchor: [0.24, 0.585] },
  engine: { at: [0.42, 0.51], box: [0.34, 0.44, 0.53, 0.61], zoom: 2.5 },
  seat:   { at: [0.26, 0.42], box: [0.17, 0.38, 0.36, 0.47], zoom: 2.6, anchor: [0.27, 0.405] },
  wheels: { at: [0.75, 0.66], box: [0.59, 0.52, 0.91, 0.81], zoom: 1.85, anchor: [0.8, 0.6] },
  full:   { at: [0.5, 0.5], box: [0.08, 0.06, 0.92, 0.82], zoom: 1 },
};

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function createPhotoStage(container, { onHover, onPick, onFrame, onProgress, reducedMotion }) {
  container.classList.add("photo-stage");
  container.style.touchAction = "pan-y";
  container.innerHTML = `<div class="photo-backdrop" style="background-image:url(${PHOTO})"></div><div class="photo-frame"><img alt="Blue Harley-Davidson cruiser in the Callahan Detail shop" /></div>`;
  const frame = container.querySelector(".photo-frame");
  const img = frame.querySelector("img");

  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const now = { top: 0, right: 0, bottom: 0, left: 0 };
  // camera = which photo point sits at the centre of the free area, and how far we're zoomed in
  const cam = { x: 0.5, y: 0.47, z: 1 };
  let from = { ...cam }, to = { ...cam }, t = 1, dur = 1.1;
  let focusId = null, hoverId = null, running = false, last = 0;
  let base = 1, W = 1, H = 1;

  function layout() {
    const r = container.getBoundingClientRect();
    W = r.width; H = r.height;
  }
  new ResizeObserver(layout).observe(container);
  layout();

  function setTarget(id) {
    const p = PARTS[id] || null;
    from = { ...cam };
    to = p ? { x: p.at[0], y: p.at[1], z: p.zoom } : { x: 0.5, y: 0.47, z: 1 };
    t = reducedMotion ? 1 : 0;
    if (reducedMotion) Object.assign(cam, to);
  }

  // hover/click: which part is under the pointer (nearest part centre within its box)
  function partAt(e) {
    const r = img.getBoundingClientRect();
    const u = (e.clientX - r.left) / r.width, v = (e.clientY - r.top) / r.height;
    let best = null, bestD = Infinity;
    for (const [id, p] of Object.entries(PARTS)) {
      if (id === "full") continue;
      const [x0, y0, x1, y1] = p.box;
      if (u < x0 || u > x1 || v < y0 || v > y1) continue;
      const d = Math.hypot(u - p.at[0], v - p.at[1]);
      if (d < bestD) { bestD = d; best = id; }
    }
    return best;
  }
  container.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const id = partAt(e);
    if (id !== hoverId) { hoverId = id; container.classList.toggle("is-pointing", !!id); onHover?.(id); }
  });
  container.addEventListener("pointerleave", () => { if (hoverId) { hoverId = null; onHover?.(null); } });
  let down = null;
  container.addEventListener("pointerdown", (e) => (down = { x: e.clientX, y: e.clientY }));
  container.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
    const id = partAt(e);
    if (id) onPick?.(id);
  });

  function frameLoop(ts) {
    if (!running) return;
    requestAnimationFrame(frameLoop);
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
    last = ts;
    const ki = reducedMotion ? 1 : 1 - Math.exp(-dt * 7);
    for (const k in insets) now[k] += (insets[k] - now[k]) * ki;
    if (t < 1) {
      t = Math.min(1, t + dt / dur);
      const e = ease(t);
      cam.x = from.x + (to.x - from.x) * e;
      cam.y = from.y + (to.y - from.y) * e;
      // dip out slightly mid-move, like a camera re-framing
      cam.z = from.z + (to.z - from.z) * e - Math.sin(Math.PI * e) * 0.12 * Math.max(from.z, to.z);
    }
    // free area beside the panel / above the sheet
    const aw = W - now.left - now.right, ah = H - now.top - now.bottom;
    const cx = now.left + aw / 2, cy = now.top + ah / 2;
    // base size: the whole photo fits the free area with a little breathing room
    base = Math.min(aw, ah) * 0.94;
    const size = base * cam.z;
    let x = cx - cam.x * size, y = cy - cam.y * size;
    // when zoomed in, never leave an empty gap inside the free area
    if (size >= aw) x = Math.min(now.left, Math.max(x, now.left + aw - size));
    if (size >= ah) y = Math.min(now.top, Math.max(y, now.top + ah - size));
    frame.style.width = frame.style.height = base + "px";
    frame.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${cam.z.toFixed(4)})`;

    const anchors = {};
    for (const [id, p] of Object.entries(PARTS)) {
      const [u, v] = p.anchor || p.at;
      anchors[id] = { x: x + u * size, y: y + v * size, facing: 1 };
    }
    let rect = null;
    if (focusId && focusId !== "full" && t > 0.6) {
      const [x0, y0, x1, y1] = PARTS[focusId].box;
      rect = { x0: x + x0 * size, y0: y + y0 * size, x1: x + x1 * size, y1: y + y1 * size };
    }
    onFrame?.({ anchors, rect });
  }

  const api = {
    focus(id) { if (id === focusId) return; focusId = id; setTarget(id); },
    setHover(id) { hoverId = id; },
    setInsets(v) { Object.assign(insets, v); },
    start() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frameLoop); } },
    stop() { running = false; },
  };

  return new Promise((resolve, reject) => {
    img.addEventListener("load", () => resolve(api), { once: true });
    img.addEventListener("error", reject, { once: true });
    // progress for the loading screen (fetch so we can count bytes)
    fetch(PHOTO).then(async (res) => {
      const total = +res.headers.get("content-length") || 0;
      if (!res.body || !total) { img.src = PHOTO; return; }
      const reader = res.body.getReader();
      const chunks = []; let got = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value); got += value.length;
        onProgress?.(got / total);
      }
      img.src = URL.createObjectURL(new Blob(chunks, { type: "image/jpeg" }));
    }).catch(() => (img.src = PHOTO));
  });
}
