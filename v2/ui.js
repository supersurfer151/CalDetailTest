// Shared pieces for every v2 page: the build sheet (services the visitor picked, kept between pages),
// the quote drawer that emails it, the toast, and the wipe transition between the menu and the garages.
import { VEHICLES, CONTACT, lookup } from "./data.js";

const KEY = "cd-build-v1";
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------------- Build sheet store ----------------
function read() {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
    return new Set(Array.isArray(arr) ? arr.filter((k) => lookup(k)) : []);
  } catch { return new Set(); }
}
let picked = read();
const subs = new Set();
function write() { try { localStorage.setItem(KEY, JSON.stringify([...picked])); } catch { /* private mode: keep in memory */ } }
function emit(changed) { subs.forEach((fn) => fn(changed)); }

export const build = {
  has: (k) => picked.has(k),
  list: () => [...picked],
  get size() { return picked.size; },
  toggle(k) {
    const on = !picked.has(k);
    on ? picked.add(k) : picked.delete(k);
    write(); emit(k);
    return on;
  },
  remove(k) { picked.delete(k); write(); emit(k); },
  on(fn) { subs.add(fn); return () => subs.delete(fn); },
};
window.addEventListener("storage", (e) => { if (e.key === KEY) { picked = read(); emit(null); } });

// ---------------- Toast ----------------
let toastEl, toastTimer;
export function toast(msg) {
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.className = "toast";
    toastEl.setAttribute("role", "status");
    document.body.append(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 2200);
}

// ---------------- Count badges ----------------
function syncCounts(bump) {
  document.querySelectorAll("[data-sheet-count]").forEach((el) => {
    el.textContent = String(picked.size);
    el.classList.toggle("has", picked.size > 0);
    if (bump && !reduced) {
      el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
      setTimeout(() => el.classList.remove("bump"), 300);
    }
  });
}

// ---------------- Drawer ----------------
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let sheet, scrim, lastFocus, madeInert = [];

function mountSheet() {
  scrim = document.createElement("div");
  scrim.className = "sheet-scrim";
  scrim.dataset.sheetClose = "";
  sheet = document.createElement("aside");
  sheet.className = "sheet";
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "true");
  sheet.setAttribute("aria-labelledby", "sheet-title");
  sheet.innerHTML = `
    <div class="sheet-head">
      <h2 id="sheet-title">Build sheet <span class="sheet-count" data-sheet-count>0</span></h2>
      <button class="sheet-close" type="button" data-sheet-close aria-label="Close build sheet">×</button>
    </div>
    <div class="sheet-body">
      <div class="sheet-list"></div>
      <form class="sheet-form" novalidate>
        <h3>Request a quote</h3>
        <div class="row">
          <label>Name<input name="name" type="text" autocomplete="name" required /></label>
          <label>Phone<input name="phone" type="tel" autocomplete="tel" /></label>
        </div>
        <label>Vehicle or boat<input name="vehicle" type="text" placeholder="Year, make and model" /></label>
        <div class="row" data-boat-only>
          <label>Boat length (ft)<input name="feet" type="number" min="5" max="150" inputmode="decimal" placeholder="e.g. 24" /></label>
          <label class="tick"><input name="tower" type="checkbox" /> Tower or flybridge</label>
        </div>
        <label data-boat-only>Where is it kept?<input name="location" type="text" placeholder="Marina, town or driveway" /></label>
        <label>Message<textarea name="message" rows="3" placeholder="Condition, timing, questions"></textarea></label>
        <p class="sheet-estimate" hidden></p>
        <button class="btn btn-accent" type="submit">Send quote request</button>
        <p class="sheet-note">Opens your email app with your request filled in, addressed to ${CONTACT.email}. Pricing depends on size, condition and the services you choose; we’ll confirm everything in your quote.</p>
        <p class="sheet-call">Prefer to talk? Call <a href="tel:${CONTACT.tel}">${CONTACT.phone}</a></p>
      </form>
    </div>`;
  document.body.append(scrim, sheet);

  const form = sheet.querySelector("form");
  form.addEventListener("input", renderEstimate);
  form.addEventListener("submit", (e) => { e.preventDefault(); send(form); });
  sheet.querySelector(".sheet-list").addEventListener("click", (e) => {
    const k = e.target.closest("[data-remove]")?.dataset.remove;
    if (k) build.remove(k);
  });
}

function renderSheet() {
  if (!sheet) return;
  const list = sheet.querySelector(".sheet-list");
  const items = build.list().map(lookup).filter(Boolean);
  if (!items.length) {
    list.innerHTML = `
      <div class="sheet-empty">
        <p>Nothing on your build sheet yet. Pick a vehicle, tap the part you want taken care of and add services. Or just send us a message below.</p>
        <div class="sheet-go">
          ${Object.values(VEHICLES).map((v) => `<a href="${v.page}" data-wipe="${v.name}">${v.name}<span aria-hidden="true">→</span></a>`).join("")}
        </div>
      </div>`;
  } else {
    const groups = {};
    items.forEach((s) => (groups[s.veh] ||= []).push(s));
    list.innerHTML = Object.entries(groups).map(([veh, arr]) => `
      <div class="sheet-group">
        <h3>${VEHICLES[veh].name}<a href="${VEHICLES[veh].page}" data-wipe="${VEHICLES[veh].name}">Edit</a></h3>
        ${arr.map((s) => `<div class="sheet-item"><span>${esc(s.name)}<small>${esc(s.short)}</small></span><button type="button" data-remove="${s.key}" aria-label="Remove ${esc(s.name)}">×</button></div>`).join("")}
      </div>`).join("");
  }
  const hasBoat = items.some((s) => s.veh === "boat");
  sheet.querySelectorAll("[data-boat-only]").forEach((el) => (el.hidden = !hasBoat));
  renderEstimate();
}

// Shrink wrap pricing: $25/ft under 30 ft, $30/ft at 30 ft and over or with a tower/flybridge
function renderEstimate() {
  const f = sheet.querySelector("form").elements;
  const out = sheet.querySelector(".sheet-estimate");
  const len = parseFloat(f.feet.value);
  if (build.has("boat:wrap") && len > 0) {
    const rate = len >= 30 || f.tower.checked ? 30 : 25;
    out.textContent = `Shrink wrap estimate: ${len} ft × $${rate}/ft = $${Math.round(len * rate).toLocaleString()} (add-ons quoted separately)`;
    out.hidden = false;
  } else out.hidden = true;
}

function send(form) {
  const f = form.elements;
  if (!f.name.value.trim()) {
    f.name.setAttribute("aria-invalid", "true");
    f.name.focus();
    toast("Add your name first");
    return;
  }
  f.name.removeAttribute("aria-invalid");
  const items = build.list().map(lookup).filter(Boolean);
  const lines = ["Hi Callahan Detail,", ""];
  if (items.length) {
    lines.push("I'd like a quote for:");
    const groups = {};
    items.forEach((s) => (groups[s.veh] ||= []).push(s));
    Object.entries(groups).forEach(([veh, arr]) => {
      lines.push("", `${VEHICLES[veh].name}:`, ...arr.map((s) => `- ${s.name}`));
    });
    lines.push("");
  } else {
    lines.push("I'd like to ask about a detail.", "");
  }
  if (f.vehicle.value) lines.push(`Vehicle / boat: ${f.vehicle.value}`);
  if (!f.feet.closest("[data-boat-only]").hidden) {
    lines.push(`Boat length: ${f.feet.value ? f.feet.value + " ft" : "not sure"}${f.tower.checked ? " (has tower/flybridge)" : ""}`);
    if (f.location.value) lines.push(`Where it's kept: ${f.location.value}`);
    const est = sheet.querySelector(".sheet-estimate");
    if (!est.hidden) lines.push(est.textContent);
  }
  if (f.message.value) lines.push("", f.message.value);
  lines.push("", "Thanks,", f.name.value.trim());
  if (f.phone.value) lines.push(f.phone.value);
  const subject = `Quote request${f.vehicle.value ? " – " + f.vehicle.value : ""}`;
  location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}

export function openSheet() {
  lastFocus = document.activeElement;
  renderSheet();
  document.documentElement.classList.add("sheet-open");
  madeInert = [...document.body.children].filter((el) => el !== sheet && el !== scrim && el !== toastEl && !el.matches("script") && !el.inert);
  madeInert.forEach((el) => (el.inert = true));
  setTimeout(() => sheet.querySelector(".sheet-close").focus(), 50);
}
export function closeSheet() {
  if (!isSheetOpen()) return;
  document.documentElement.classList.remove("sheet-open");
  madeInert.forEach((el) => (el.inert = false));
  madeInert = [];
  lastFocus?.focus?.({ preventScroll: true });
}
export const isSheetOpen = () => document.documentElement.classList.contains("sheet-open");

// ---------------- Wipe transitions ----------------
export function wipeTo(url, label) {
  if (reduced) { location.href = url; return; }
  const w = makeWipe(label, "Loading");
  w.classList.add("wipe-in");
  try { sessionStorage.setItem("cd-wipe", label || "1"); } catch {}
  setTimeout(() => (location.href = url), 520);
}
export function makeWipe(title, kicker, tip) {
  const w = document.createElement("div");
  w.className = "wipe";
  w.setAttribute("aria-hidden", "true");
  w.innerHTML = `<div class="wipe-inner"><p class="wipe-kicker">${esc(kicker || "")}</p><p class="wipe-title">${esc(title || "")}</p><div class="wipe-bar"><i></i></div>${tip ? `<p class="wipe-tip"><b>Tip</b>${esc(tip)}</p>` : ""}</div>`;
  document.body.append(w);
  return w;
}
export function wipeOut(w) {
  if (!w) return;
  w.classList.remove("wipe-in", "wipe-cover");
  void w.offsetWidth;
  w.classList.add("wipe-cover");
  requestAnimationFrame(() => {
    w.classList.remove("wipe-cover");
    w.classList.add("wipe-out");
    setTimeout(() => w.remove(), 750);
  });
}

// ---------------- Init (runs on every page) ----------------
mountSheet();
syncCounts(false);
build.on((k) => { syncCounts(k !== null); if (isSheetOpen()) renderSheet(); });

document.addEventListener("click", (e) => {
  if (e.target.closest("[data-sheet-open]")) { e.preventDefault(); openSheet(); return; }
  if (e.target.closest("[data-sheet-close]")) { closeSheet(); return; }
  const a = e.target.closest("a[data-wipe]");
  if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
    e.preventDefault();
    closeSheet();
    wipeTo(a.href, a.dataset.wipe);
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isSheetOpen()) { e.stopImmediatePropagation(); closeSheet(); }
}, true);

// Coming back with the browser's back button restores the page from cache with the wipe still drawn
window.addEventListener("pageshow", (e) => {
  if (e.persisted) document.querySelectorAll(".wipe").forEach((w) => w.remove());
  picked = read(); syncCounts(false);
});

document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
