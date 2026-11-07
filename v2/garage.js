// Garage page controller (car.html, boat.html, motorcycle.html). Builds the part rail, the markers and
// the service panel from data.js, loads the right viewer, and runs the "click a part → zoom → pick
// services" flow. Viewers share one interface: focus(id), setHover(id), setInsets({...}), start().
import { VEHICLES, SERVICES } from "./data.js";
import { build, toast, openSheet, isSheetOpen, wipeTo, wipeOut } from "./ui.js";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const narrow = () => matchMedia("(max-width: 860px)").matches;
const pad = (n) => String(n).padStart(2, "0");

const veh = document.body.dataset.vehicle;
const V = VEHICLES[veh];
const zones = V.zones;
const zoneById = Object.fromEntries(zones.map((z) => [z.id, z]));
const keyOf = (id) => `${veh}:${id}`;

const stage = $(".stage");
const markersEl = $(".markers");
const rail = $(".rail-row");
const panel = $(".panel");
const pBody = $(".p-body");
const list = $(".p-list");
const brk = $(".brk");
const crumbZone = $(".crumb-zone");
const crumbSep = $(".crumb-zone-sep");
const status = $(".g-status");

let viewer = null;
let focus = null;

// ---------------- Loading screen ----------------
const loader = $(".wipe");
if (loader) {
  const tip = loader.querySelector(".wipe-tip");
  if (tip && V.tips) tip.innerHTML = `<b>Tip</b>${V.tips[Math.floor(Math.random() * V.tips.length)]}`;
}
const setProgress = (p) => loader?.style.setProperty("--p", Math.max(0.04, Math.min(1, p)).toFixed(3));
let revealed = false;
function reveal() {
  if (revealed) return;
  revealed = true;
  document.body.classList.remove("is-loading");
  setProgress(1);
  setTimeout(() => wipeOut(loader), reduced ? 0 : 250);
}
setTimeout(reveal, 12000); // never trap anyone behind the loader

// ---------------- Rail + markers ----------------
rail.innerHTML = zones.map((z, i) => `
  <button class="rail-btn" type="button" data-zone="${z.id}" aria-current="false">
    <small>${pad(i + 1)}</small>${z.name}<span class="rail-n" hidden></span>
  </button>`).join("");
const railBtns = $$(".rail-btn", rail);

markersEl.innerHTML = zones.filter((z) => z.id !== "full").map((z) => `
  <button class="mk is-away" type="button" data-zone="${z.id}" aria-label="${z.name}: ${z.services.length} service${z.services.length > 1 ? "s" : ""}">
    <span class="mk-dot" aria-hidden="true"></span>
    <span class="mk-label" aria-hidden="true"><small>${pad(zones.indexOf(z) + 1)}</small><span class="mk-name">${z.name}</span><em>${z.services.length}</em></span>
  </button>`).join("");
const marks = Object.fromEntries($$(".mk", markersEl).map((m) => [m.dataset.zone, m]));

function hot(id) {
  railBtns.forEach((b) => b.classList.toggle("is-hot", b.dataset.zone === id));
  Object.entries(marks).forEach(([k, m]) => m.classList.toggle("is-hot", k === id));
}
function hoverZone(id) { hot(id); viewer?.setHover(id); }

[...railBtns, ...Object.values(marks)].forEach((b) => {
  b.addEventListener("click", () => setFocus(b.dataset.zone));
  b.addEventListener("pointerenter", () => hoverZone(b.dataset.zone));
  b.addEventListener("pointerleave", () => hoverZone(null));
  b.addEventListener("focus", () => hoverZone(b.dataset.zone));
  b.addEventListener("blur", () => hoverZone(null));
});

function syncRailCounts() {
  railBtns.forEach((b) => {
    const n = zoneById[b.dataset.zone].services.filter((id) => build.has(keyOf(id))).length;
    const badge = $(".rail-n", b);
    badge.hidden = !n;
    badge.textContent = n;
  });
}

// ---------------- Panel ----------------
function serviceHTML(id, i) {
  const s = SERVICES[id];
  const on = build.has(keyOf(id));
  return `
  <li class="svc${on ? " is-picked" : ""}" style="--i:${i}" data-id="${id}">
    <div class="svc-row">
      <button class="svc-main" type="button" aria-expanded="false" aria-controls="svc-${id}">
        <span class="svc-num">${pad(i + 1)}</span>
        <span class="svc-text"><span class="svc-name">${s.name}</span><span class="svc-short">${s.short}</span></span>
        <span class="svc-more-ic" aria-hidden="true"></span>
      </button>
      <button class="svc-add" type="button" aria-pressed="${on}" aria-label="Add ${s.name} to build sheet">${on ? "✓" : "+"}</button>
    </div>
    <div class="svc-more" id="svc-${id}" inert>
      <div class="svc-more-in"><div class="svc-more-pad">
        ${s.img ? `<figure class="svc-img"><img data-src="${s.img}" alt="" width="720" height="405" /></figure>` : ""}
        <p class="svc-desc">${s.desc}</p>
        ${s.facts ? `<dl class="svc-facts">${s.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>` : ""}
        ${s.incl ? `<p class="svc-incl-t">What’s included</p><ul class="svc-incl">${s.incl.map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}
        <button class="svc-pick" type="button">${on ? "✓ On your build sheet" : "+ Add to build sheet"}</button>
      </div></div>
    </div>
  </li>`;
}

function renderPanel(id) {
  const z = zoneById[id];
  const i = zones.indexOf(z);
  $(".p-n").textContent = pad(i + 1);
  $(".p-total").textContent = pad(zones.length);
  $(".p-title").textContent = z.name;
  $(".p-blurb").textContent = z.blurb;
  list.innerHTML = z.services.map(serviceHTML).join("");
  pBody.scrollTop = 0;
  if (z.services.length === 1) toggleItem($(".svc", list), true);
  syncFoot();
}
function syncFoot() {
  const n = build.size;
  $(".p-foot-note").textContent = n ? `${n} service${n > 1 ? "s" : ""} on your build sheet` : "Tap + to add a service to your build sheet";
}

function toggleItem(li, open) {
  const btn = $(".svc-main", li);
  const more = $(".svc-more", li);
  const willOpen = open ?? btn.getAttribute("aria-expanded") !== "true";
  if (willOpen) $$(".svc.is-open", list).forEach((o) => o !== li && toggleItem(o, false));
  btn.setAttribute("aria-expanded", String(willOpen));
  li.classList.toggle("is-open", willOpen);
  more.inert = !willOpen;
  if (willOpen) {
    const img = $("img[data-src]", li);
    if (img) { img.onload = () => img.classList.add("is-loaded"); img.src = img.dataset.src; img.removeAttribute("data-src"); }
    setTimeout(() => {
      const top = li.offsetTop - 8;
      if (top < pBody.scrollTop || li.offsetTop + li.offsetHeight > pBody.scrollTop + pBody.clientHeight) {
        pBody.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
      }
    }, 320);
  }
}

function togglePick(li) {
  const id = li.dataset.id;
  const on = build.toggle(keyOf(id));
  toast(on ? `Added ${SERVICES[id].name}` : `Removed ${SERVICES[id].name}`);
}
function syncPicked() {
  $$(".svc", list).forEach((li) => {
    const on = build.has(keyOf(li.dataset.id));
    li.classList.toggle("is-picked", on);
    const add = $(".svc-add", li);
    add.setAttribute("aria-pressed", String(on));
    add.textContent = on ? "✓" : "+";
    $(".svc-pick", li).textContent = on ? "✓ On your build sheet" : "+ Add to build sheet";
  });
  syncRailCounts();
  syncFoot();
}
build.on(syncPicked);

list.addEventListener("click", (e) => {
  const li = e.target.closest(".svc");
  if (!li) return;
  if (e.target.closest(".svc-main")) toggleItem(li);
  else if (e.target.closest(".svc-add, .svc-pick")) togglePick(li);
});

const step = (d) => {
  const i = focus ? zones.findIndex((z) => z.id === focus) : -1;
  setFocus(zones[(i + d + zones.length) % zones.length].id);
};
$(".p-prev").addEventListener("click", () => step(-1));
$(".p-next").addEventListener("click", () => step(1));

// ---------------- Focus (zoom to a part) ----------------
function setFocus(id, { fromHash = false } = {}) {
  if (id && !zoneById[id]) id = null;
  if (id === focus) return;
  const prev = focus;
  focus = id;
  document.body.classList.toggle("is-focus", !!id);
  railBtns.forEach((b) => b.setAttribute("aria-current", String(b.dataset.zone === id)));
  crumbZone.textContent = id ? zoneById[id].name : "";
  crumbSep.hidden = crumbZone.hidden = !id;
  panel.inert = !id;
  if (id) {
    if (prev && !reduced) {
      pBody.classList.add("is-switching");
      setTimeout(() => { renderPanel(id); pBody.classList.remove("is-switching"); }, 180);
    } else renderPanel(id);
    brk.classList.remove("is-on");
    $(".brk-tag").textContent = zoneById[id].name;
  } else {
    brk.classList.remove("is-on");
  }
  hot(null);
  updateInsets();
  viewer?.focus(id);
  // Browser back = leave the close-up. Only step back through history if we added the entry ourselves.
  if (fromHash) pushed = !!id;
  else if (id && prev) history.replaceState(null, "", "#" + id);
  else if (id) { history.pushState(null, "", "#" + id); pushed = true; }
  else if (pushed) { pushed = false; history.back(); }
  else history.replaceState(null, "", location.pathname + location.search);
}
let pushed = false;
window.addEventListener("popstate", () => setFocus(location.hash.slice(1) || null, { fromHash: true }));

function goBack() {
  if (focus) setFocus(null);
  else wipeTo("index.html#services", "Menu");
}
$(".g-back").addEventListener("click", (e) => { e.preventDefault(); goBack(); });

// Free area for the camera: below the bar, above the rail, left of the panel (or above the sheet on phones)
function updateInsets() {
  if (!viewer) return;
  const barH = $(".bar").getBoundingClientRect().height;
  const railH = window.innerHeight - $(".rail-row").getBoundingClientRect().top + 8;
  const intro = $(".g-intro").getBoundingClientRect();
  if (narrow()) {
    const sheetH = panel.getBoundingClientRect().height;
    viewer.setInsets({ top: focus ? barH : Math.max(barH, intro.bottom + 8), right: 0, left: 0, bottom: focus ? sheetH : railH });
  } else {
    const pw = panel.getBoundingClientRect().width;
    // on mid-size screens keep the car clear of the intro text
    const left = !focus && (veh === "moto" || window.innerWidth < 1250) ? intro.right + 12 : 0;
    viewer.setInsets({ top: barH, right: focus ? pw : 0, left, bottom: focus ? Math.min(railH, 90) : railH });
  }
}
window.addEventListener("resize", () => { updateInsets(); Object.values(marks).forEach((m) => (m._w = 0)); });

// ---------------- Per-frame: markers + brackets ----------------
function onFrame({ anchors, rect }) {
  const vw = window.innerWidth;
  for (const id in marks) {
    const a = anchors[id];
    const m = marks[id];
    if (!a) continue;
    const flip = a.x + (m._w ||= m.offsetWidth) > vw - 12;
    m.style.transform = `translate3d(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px, 0)${flip ? " translateX(-100%)" : ""}`;
    m.classList.toggle("is-away", a.facing < -0.05);
    m.classList.toggle("is-flip", flip);
  }
  if (focus && rect) {
    const w = rect.x1 - rect.x0, h = rect.y1 - rect.y0;
    const p = 8;
    brk.style.transform = `translate3d(${(rect.x0 - p).toFixed(1)}px, ${(rect.y0 - p).toFixed(1)}px, 0)`;
    brk.style.width = w + p * 2 + "px";
    brk.style.height = h + p * 2 + "px";
    brk.classList.add("is-on");
  } else brk.classList.remove("is-on");
}

// ---------------- Keyboard ----------------
document.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || isSheetOpen()) return;
  if (e.target.closest("input, textarea")) return;
  const n = parseInt(e.key, 10);
  if (e.key === "Escape") { e.preventDefault(); goBack(); }
  else if (n >= 1 && n <= zones.length) setFocus(zones[n - 1].id);
  else if (focus && (e.key === "ArrowRight" || e.key === "ArrowLeft") && !e.target.closest(".p-body")) { e.preventDefault(); step(e.key === "ArrowRight" ? 1 : -1); }
  else if (!focus && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
    const i = railBtns.indexOf(document.activeElement);
    const next = railBtns[(i + (e.key === "ArrowRight" ? 1 : -1) + railBtns.length) % railBtns.length] || railBtns[0];
    next.focus(); e.preventDefault();
  }
});

// ---------------- Boot ----------------
syncRailCounts();
syncFoot();
panel.inert = true;

function canWebGL() { try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; } }

async function boot() {
  const callbacks = {
    reducedMotion: reduced,
    onHover: (id) => hot(id),
    onPick: (id) => setFocus(id),
    onFrame,
  };
  if (veh === "moto") {
    const { createPhotoStage } = await import("./moto.js");
    viewer = await createPhotoStage(stage, { ...callbacks, onProgress: setProgress });
  } else {
    if (!canWebGL()) throw new Error("no-webgl");
    const [{ createRig }, mod] = await Promise.all([import("./rig.js"), veh === "car" ? import("./car3d.js") : import("./boat3d.js")]);
    viewer = createRig(stage, callbacks);
    const load = veh === "car" ? mod.loadCar : mod.loadBoat;
    const model = await load(viewer, { onProgress: (p) => setProgress(0.1 + p * 0.85), reducedMotion: reduced });
    viewer.setModel(model);
  }
  updateInsets();
  viewer.start();
  stage.classList.add("is-ready");
  const initial = location.hash.slice(1);
  if (zoneById[initial]) { focus = null; setFocus(initial, { fromHash: true }); }
  requestAnimationFrame(() => requestAnimationFrame(reveal));
}

try { sessionStorage.removeItem("cd-wipe"); } catch {}
document.body.classList.add("is-loading");
setProgress(0.06);
if (location.hash && zoneById[location.hash.slice(1)]) { /* opened from a deep link; handled after load */ }
boot().catch((err) => {
  console.error(err);
  status.hidden = false;
  status.textContent = err?.message === "no-webgl" ? "3D view isn’t supported on this device. Pick a part below." : "The 3D view couldn’t load. Pick a part below.";
  viewer = null;
  reveal();
  const initial = location.hash.slice(1);
  if (zoneById[initial]) setFocus(initial, { fromHash: true });
});
