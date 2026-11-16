// Garage page controller (car.html, boat.html, motorcycle.html). Builds the part rail, the markers and
// the service panel from data.js, loads the right viewer, and runs the "click a part → zoom → pick
// services" flow. Viewers share one interface: focus(id), setHover(id), setInsets({...}), start().
// The car also has packages (../packages.js): its panel stays open beside the car as a packages window,
// and clicking a part shows what each package does there plus that part's add-ons.
import { VEHICLES, SERVICES, PACKAGES, ITEMS } from "./data.js";
import { ADDONS, ADDON_GROUPS, MORE, PRICING_NOTE, packagesFor } from "../packages.js";
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

// Packages (car only)
const PK = !!V.packages;
if (PK) document.body.classList.add("has-pk");
const pkKey = (id) => keyOf("pkg-" + id);
const pkById = Object.fromEntries(PACKAGES.map((p) => [p.id, p]));
const chosenPkg = () => (PK && PACKAGES.find((p) => build.has(pkKey(p.id)))?.id) || null;
const isPkView = (id) => PK && (!id || id === "full");
let carModel = null;

const stage = $(".stage");
const markersEl = $(".markers");
const rail = $(".rail-row");
const panel = $(".panel");
const pBody = $(".p-body");
const content = $(".p-content");
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
    let n = zoneById[b.dataset.zone].services.filter((id) => build.has(keyOf(id))).length;
    if (PK && b.dataset.zone === "full" && chosenPkg()) n++;
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
  <li class="svc${on ? " is-picked" : ""}" style="--i:${i}" data-id="${id}"${s.zone ? ` data-zone="${s.zone}"` : ""}>
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
const listHTML = (ids) => `<ol class="p-list">${ids.map(serviceHTML).join("")}</ol>`;

// ----- packages window (car) -----
const pkItems = (p) => [...p.exterior, ...p.interior];
const onlyIn = (k) => PACKAGES.filter((p) => pkItems(p).includes(k)).length === 1;
const isExt = (k) => ["paint", "wheels"].includes(ITEMS[k].zone);
function pkItemHTML(p, k, off) {
  const it = ITEMS[k];
  const star = it.star && !off;
  return `<li class="pk-i${star ? " is-star" : ""}${off ? " is-off" : ""}" data-zone="${it.zone}">
    <span>${it.t}${star && onlyIn(k) ? `<em>Only in ${p.name}</em>` : ""}${off ? `<span class="sr"> (not included)</span>` : ""}</span>${star && it.note ? `<small>${it.note}</small>` : ""}</li>`;
}
function pkHTML(p, i, openId) {
  const on = chosenPkg() === p.id, open = p.id === openId;
  const lacks = p.lacks || [];
  const col = (title, keys) => `<div><p class="pk-col-t">${title}</p><ul>${keys.map((k) => pkItemHTML(p, k, false)).join("")}${lacks.filter((k) => isExt(k) === (title === "Exterior")).map((k) => pkItemHTML(p, k, true)).join("")}</ul></div>`;
  const up = p.upsell && pkById[p.upsell.to];
  return `
  <article class="pk${p.badge ? " is-rec" : ""}${on ? " is-on" : ""}${open ? " is-open" : ""}" data-pk="${p.id}" style="--i:${i}">
    ${p.badge ? `<span class="pk-badge">${p.badge}</span>` : ""}
    <button class="pk-head" type="button" aria-expanded="${open}" aria-controls="pk-${p.id}">
      <span class="pk-n">${pkItems(p).length} services</span>
      <span class="pk-title">${p.name} <span>Detail</span></span>
      <span class="pk-line">${p.line}</span>
      <span class="pk-dot" aria-hidden="true"></span>
      <span class="sr pk-state">${on ? ", selected" : ""}</span>
    </button>
    <div class="pk-body" id="pk-${p.id}"${open ? "" : " inert"}><div class="pk-in"><div class="pk-pad">
      <div class="pk-cols">${col("Exterior", p.exterior)}${col("Interior", p.interior)}</div>
      <button class="pk-pick" type="button" aria-pressed="${on}">${on ? `✓ ${p.full} selected` : `Choose ${p.name}`}</button>
      ${up ? `<button class="pk-up" type="button" data-to="${up.id}"><span>${p.upsell.text}</span><b>Upgrade to ${up.name} →</b></button>` : ""}
    </div></div></div>
  </article>`;
}
function packagesHTML() {
  const openId = chosenPkg() || PACKAGES[0].id;
  return `
  <div class="pk-list" role="group" aria-label="Detail packages">${PACKAGES.map((p, i) => pkHTML(p, i, openId)).join("")}</div>
  <p class="pk-trust"><span class="stars" aria-hidden="true">★★★★★</span> 4.8 average Google rating · Certified XPEL installer</p>
  <section class="pk-sec" aria-label="Add-ons">
    <h3 class="pk-sec-t">Add-ons</h3>
    <p class="pk-sec-sub">Add them to any package, or book them on their own.</p>
    ${Object.entries(ADDON_GROUPS).map(([g, label]) => `<p class="pk-grp">${label}</p>${listHTML(ADDONS.filter((a) => a.group === g).map((a) => a.id))}`).join("")}
  </section>
  <details class="pk-more">
    <summary>More services <span class="pk-more-n">${MORE.length}</span></summary>
    ${listHTML(MORE.map((m) => m.id))}
  </details>`;
}
function zoneHTML(z) {
  const rows = packagesFor(z.id);
  const addons = z.services.filter((id) => SERVICES[id].kind === "addon");
  const more = z.services.filter((id) => SERVICES[id].kind !== "addon");
  const chosen = chosenPkg();
  return `
  ${rows.length ? `<p class="pz-t">In our packages</p>
  <div class="pz">${rows.map(({ pkg, items }) => `
    <button class="pz-row${pkg.id === chosen ? " is-on" : ""}${pkg.badge ? " is-rec" : ""}" type="button" data-pk="${pkg.id}" aria-pressed="${pkg.id === chosen}" aria-label="${pkg.full}: ${items.map((it) => it.t).join(", ")}">
      <span class="pz-name">${pkg.name}${pkg.badge ? `<em>${pkg.badge}</em>` : ""}</span>
      <span class="pz-items">${items.map((it) => (it.star ? `<b>${it.t}</b>` : it.t)).join(" · ")}</span>
      <span class="pk-dot" aria-hidden="true"></span>
    </button>`).join("")}</div>` : ""}
  ${addons.length ? `<p class="pz-t">Add-ons for this part</p>${listHTML(addons)}` : ""}
  ${more.length ? `<p class="pz-t">${rows.length || addons.length ? "Also available" : "Services"}</p>${listHTML(more)}` : ""}`;
}

function setHead({ count, kick, up, title, blurb }) {
  $(".p-count").hidden = !count;
  $(".p-steps").hidden = !count;
  if (count) { $(".p-n").textContent = pad(count[0]); $(".p-total").textContent = pad(count[1]); }
  $(".p-kick").hidden = !kick;
  $(".p-kick").textContent = kick || "";
  $(".p-up").hidden = !up;
  $(".p-title").textContent = title;
  $(".p-blurb").innerHTML = blurb;
}

function renderPanel(id, { headOnly = false } = {}) {
  const i = id ? zones.findIndex((z) => z.id === id) : -1;
  const pkView = isPkView(id);
  panel.classList.toggle("is-pk", pkView);
  if (pkView) {
    setHead({ count: i >= 0 && [i + 1, zones.length], kick: i < 0 && "Car detailing", title: "Choose your detail", blurb: `${PRICING_NOTE}. Pick a package and any extras, then request a quote.<span class="p-blurb-x"> Tap any part of the car to see what we do there.</span>` });
    if (headOnly) return;
    content.innerHTML = packagesHTML();
  } else {
    const z = zoneById[id];
    setHead({ count: [i + 1, zones.length], up: PK, title: z.name, blurb: z.blurb });
    content.innerHTML = PK ? zoneHTML(z) : listHTML(z.services);
    // a part with a single service opens it straight away (unless the package rows come first)
    const all = $$(".svc", content);
    if (all.length === 1 && !$(".pz", content)) toggleItem(all[0], true);
  }
  pBody.scrollTop = 0;
  syncFoot();
}
function syncFoot() {
  const n = build.size;
  const note = $(".p-foot-note");
  if (PK) {
    const chosen = chosenPkg();
    const extras = build.list().filter((k) => k.startsWith("car:") && !k.startsWith("car:pkg-")).length;
    const ex = extras ? `${extras} add-on${extras > 1 ? "s" : ""}` : "";
    note.innerHTML = chosen ? `<b>${pkById[chosen].full}</b>${ex ? ` + ${ex}` : ""}` : ex ? `${ex} · no package yet` : "No package chosen yet";
    syncPkBar(chosen, ex);
  } else note.textContent = n ? `${n} service${n > 1 ? "s" : ""} on your build sheet` : "Tap + to add a service to your build sheet";
}

function toggleItem(li, open) {
  const btn = $(".svc-main", li);
  const more = $(".svc-more", li);
  const willOpen = open ?? btn.getAttribute("aria-expanded") !== "true";
  if (willOpen) $$(".svc.is-open", content).forEach((o) => o !== li && toggleItem(o, false));
  btn.setAttribute("aria-expanded", String(willOpen));
  li.classList.toggle("is-open", willOpen);
  more.inert = !willOpen;
  if (willOpen) {
    const img = $("img[data-src]", li);
    if (img) { img.onload = () => img.classList.add("is-loaded"); img.src = img.dataset.src; img.removeAttribute("data-src"); }
    scrollIntoPanel(li, 320);
  }
}
function scrollIntoPanel(el, delay) {
  setTimeout(() => {
    const top = el.getBoundingClientRect().top - pBody.getBoundingClientRect().top + pBody.scrollTop - 8;
    if (top < pBody.scrollTop || top + el.offsetHeight > pBody.scrollTop + pBody.clientHeight) {
      pBody.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
    }
  }, delay);
}

function togglePick(li) {
  const id = li.dataset.id;
  const on = build.toggle(keyOf(id));
  toast(on ? `Added ${SERVICES[id].name}` : `Removed ${SERVICES[id].name}`);
}

// Packages: one at a time. Choosing the one you already have clears it.
function choosePkg(id, { keep = false } = {}) {
  const was = chosenPkg();
  const next = was === id && !keep ? null : id;
  if (next === was) return;
  PACKAGES.forEach((p) => { if (p.id !== next && build.has(pkKey(p.id))) build.remove(pkKey(p.id)); });
  if (next) build.toggle(pkKey(next));
  toast(next ? `${pkById[next].full} selected` : `${pkById[was].full} removed`);
  if (next === "ultimate") carModel?.shine?.();
}
function openPk(id) {
  $$(".pk", content).forEach((el) => {
    const open = el.dataset.pk === id;
    el.classList.toggle("is-open", open);
    $(".pk-head", el).setAttribute("aria-expanded", String(open));
    $(".pk-body", el).inert = !open;
  });
  const el = $(`.pk[data-pk="${id}"]`, content);
  if (el) scrollIntoPanel(el, 360);
}
function syncPk() {
  const chosen = chosenPkg();
  $$(".pk", content).forEach((el) => {
    const p = pkById[el.dataset.pk], on = p.id === chosen;
    el.classList.toggle("is-on", on);
    const b = $(".pk-pick", el);
    b.setAttribute("aria-pressed", String(on));
    b.textContent = on ? `✓ ${p.full} selected` : `Choose ${p.name}`;
    $(".pk-state", el).textContent = on ? ", selected" : "";
  });
  $$(".pz-row", content).forEach((r) => {
    const on = r.dataset.pk === chosen;
    r.classList.toggle("is-on", on);
    r.setAttribute("aria-pressed", String(on));
  });
}

function syncPicked() {
  $$(".svc", content).forEach((li) => {
    const on = build.has(keyOf(li.dataset.id));
    li.classList.toggle("is-picked", on);
    const add = $(".svc-add", li);
    add.setAttribute("aria-pressed", String(on));
    add.textContent = on ? "✓" : "+";
    $(".svc-pick", li).textContent = on ? "✓ On your build sheet" : "+ Add to build sheet";
  });
  if (PK) syncPk();
  syncRailCounts();
  syncFoot();
}
build.on(syncPicked);

content.addEventListener("click", (e) => {
  const t = e.target;
  const pk = t.closest(".pk");
  if (pk) {
    if (t.closest(".pk-head")) { if (!pk.classList.contains("is-open")) openPk(pk.dataset.pk); }
    else if (t.closest(".pk-pick")) choosePkg(pk.dataset.pk);
    else if (t.closest(".pk-up")) { const to = t.closest(".pk-up").dataset.to; choosePkg(to, { keep: true }); openPk(to); }
    return;
  }
  const row = t.closest(".pz-row");
  if (row) { choosePkg(row.dataset.pk); return; }
  const li = t.closest(".svc");
  if (!li) return;
  if (t.closest(".svc-main")) toggleItem(li);
  else if (t.closest(".svc-add, .svc-pick")) togglePick(li);
});
// Pointing at a line in the packages window lights up that part of the car
content.addEventListener("pointerover", (e) => {
  if (e.pointerType !== "mouse" || (focus && focus !== "full")) return;
  const z = e.target.closest("[data-zone]")?.dataset.zone;
  hoverZone(zoneById[z] && z !== "full" ? z : null);
});
content.addEventListener("pointerleave", () => { if (!focus || focus === "full") hoverZone(null); });
$(".p-up").addEventListener("click", () => setFocus(narrow() ? "full" : null));

// Phones: a bar above the part rail opens the packages sheet
const pkBar = PK ? document.createElement("button") : null;
if (pkBar) {
  pkBar.className = "pk-bar";
  pkBar.type = "button";
  pkBar.innerHTML = `<span class="pk-bar-k">Packages</span><span class="pk-bar-v"></span><span class="pk-bar-go" aria-hidden="true">↑</span>`;
  pkBar.addEventListener("click", () => setFocus("full"));
  document.body.append(pkBar);
}
function syncPkBar(chosen, ex) {
  if (!pkBar) return;
  $(".pk-bar-v", pkBar).textContent = chosen ? `${pkById[chosen].full} ✓${ex ? ` + ${ex}` : ""}` : PACKAGES.map((p) => p.name).join(" · ");
  pkBar.classList.toggle("is-chosen", !!chosen);
}

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
  syncPanelInert();
  brk.classList.remove("is-on");
  if (id) $(".brk-tag").textContent = zoneById[id].name;
  if (isPkView(prev) && isPkView(id)) renderPanel(id, { headOnly: true });   // packages ↔ packages: keep the list as it is
  else if (id || PK) {
    // cross-fade when the panel was already on screen, otherwise just fill it before it slides in
    const wasShown = PK ? !narrow() || !!prev : !!prev;
    if (wasShown && !reduced) {
      pBody.classList.add("is-switching");
      setTimeout(() => { renderPanel(id); pBody.classList.remove("is-switching"); }, 180);
    } else renderPanel(id);
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
let freeRect = { x0: 0, y0: 0, x1: window.innerWidth, y1: window.innerHeight };
function updateInsets() {
  if (!viewer) return;
  const barH = $(".bar").getBoundingClientRect().height;
  // on car phones the packages bar sits on top of the rail
  const railH = window.innerHeight - (pkBar && narrow() ? pkBar : $(".rail-row")).getBoundingClientRect().top + 8;
  const intro = $(".g-intro").getBoundingClientRect();
  if (narrow()) {
    const sheetH = panel.getBoundingClientRect().height;
    const ins = { top: focus ? barH : Math.max(barH, intro.bottom + 8), right: 0, left: 0, bottom: focus ? sheetH : railH };
    viewer.setInsets(ins);
    freeRect = { x0: 0, y0: ins.top, x1: window.innerWidth, y1: window.innerHeight - ins.bottom };
  } else {
    const pr = panel.getBoundingClientRect();
    // the car's packages window floats beside the car, so the car centres in the space to its left
    const pw = PK ? window.innerWidth - pr.left + 16 : pr.width;
    // on mid-size screens keep the car clear of the intro text by sitting beside it; the car (whose
    // packages window takes the right side) sits a little lower instead
    const left = !focus && !PK && (veh === "moto" || window.innerWidth < 1250) ? intro.right + 12 : 0;
    const top = !focus && PK ? Math.max(barH, barH + (intro.bottom - barH) * 0.5) : barH;
    const ins = { top, right: focus || PK ? pw : 0, left, bottom: focus ? Math.min(railH, 90) : railH };
    viewer.setInsets(ins);
    freeRect = { x0: left, y0: ins.top, x1: window.innerWidth - ins.right, y1: window.innerHeight - ins.bottom };
  }
}
window.addEventListener("resize", () => { updateInsets(); Object.values(marks).forEach((m) => (m._w = 0)); });

// ---------------- Photo portal (zones the model can't show in 3D, like the car's cabin) ----------------
const portal = document.createElement("div");
portal.className = "g-portal";
portal.setAttribute("aria-hidden", "true");
portal.innerHTML = `<img alt="" />`;
document.body.append(portal);
function portalRect() {
  const f = freeRect, gx = Math.min(48, window.innerWidth * 0.04);
  const w = Math.min(f.x1 - f.x0 - gx * 2, 860), h = Math.min(f.y1 - f.y0 - 40, w * 0.68);
  const cx = (f.x0 + f.x1) / 2, cy = (f.y0 + f.y1) / 2;
  return { x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 };
}

// ---------------- Per-frame: markers + brackets ----------------
function onFrame({ anchors, rect, photo }) {
  if (focus && photo) {
    const img = portal.firstElementChild;
    if (img.dataset.src !== photo) { img.dataset.src = photo; img.src = photo; }
    rect = portalRect();
    Object.assign(portal.style, { left: rect.x0 + "px", top: rect.y0 + "px", width: rect.x1 - rect.x0 + "px", height: rect.y1 - rect.y0 + "px" });
    portal.classList.add("is-on");
  } else portal.classList.remove("is-on");
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

// The panel is hidden (and out of the tab order) unless a part is open; the car's packages window
// stays open beside the car on wider screens.
function syncPanelInert() { panel.inert = !(focus || (PK && !narrow())); }
matchMedia("(max-width: 860px)").addEventListener("change", () => { syncPanelInert(); updateInsets(); });

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
if (PK) renderPanel(null);
syncFoot();
syncPanelInert();

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
    carModel = model;
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
