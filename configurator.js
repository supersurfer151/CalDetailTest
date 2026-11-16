// "Configure Your Detail": the 3D car with a packages window beside it.
// Packages, add-ons and other services all come from packages.js (shared with the v2 car garage), so to
// change what we offer, edit that file. EXTERIOR / INTERIOR (labels, or clicking the car) turn the car to
// that view and light up the matching half of the packages window.
// Any link with data-cfg-open="<id>" (menu, footer) scrolls here and opens that service; ids that aren't an
// add-on or service (like "exterior-detailing") open the packages.
import { ITEMS, PACKAGES, ADDONS, ADDON_GROUPS, MORE, PRICING_NOTE } from "./packages.js?v=20261112c";

const IMG_DIR = "assets/cd/";
const GROUP_CAT = { protect: "exterior", interior: "interior" };   // add-on group → the half of the car it belongs to
const catOfZone = (z) => (z === "interior" || z === "glass" ? "interior" : z === "full" ? "" : "exterior");

const root = document.querySelector(".cfg");
if (root) init(root);

function init(root) {
  const $ = (s, el = root) => el.querySelector(s);
  const $$ = (s, el = root) => [...el.querySelectorAll(s)];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const stage = $(".cfg-stage");
  const canvasBox = $(".cfg-canvas");
  const status = $(".cfg-status");
  const hots = $$(".cfg-hot");
  const body = $(".cfg-body");
  const box = $(".cfg-pk");
  const quoteBtn = $(".cfg-quote");
  const quoteCount = $(".cfg-quote-count");
  const backBtn = $(".cfg-back");
  const lines = Object.fromEntries(["exterior", "interior"].map((c) => [c, {
    path: $(`.cfg-lines [data-cat="${c}"] path`),
    dot: $(`.cfg-lines [data-cat="${c}"] .cfg-dot`),
    ring: $(`.cfg-lines [data-cat="${c}"] .cfg-ring`),
  }]));

  let state = "overview";
  let viewer = null;
  let chosen = null;           // package id
  const picked = new Set();    // add-on / service ids
  const services = Object.fromEntries([...ADDONS, ...MORE].map((s) => [s.id, s]));
  const pkById = Object.fromEntries(PACKAGES.map((p) => [p.id, p]));
  const pkItems = (p) => [...p.exterior, ...p.interior];

  $(".cfg-cat-blurb").textContent = `${PRICING_NOTE}. Pick a package and any extras, then request a quote.`;

  // ---------- Rendering ----------
  function itemHTML(s, i) {
    return `
      <li class="cfg-item" style="--i:${i}" data-id="${s.id}" data-cat="${catOfZone(s.zone)}">
        <button class="cfg-item-head" type="button" aria-expanded="false" aria-controls="cfg-d-${s.id}">
          <span class="cfg-item-num">${String(i + 1).padStart(2, "0")}</span>
          <span class="cfg-item-text"><span class="cfg-item-name">${s.name}</span><span class="cfg-item-short">${s.short}</span></span>
          <span class="cfg-item-added" aria-hidden="true"></span>
          <span class="cfg-item-icon" aria-hidden="true"></span>
        </button>
        <div class="cfg-item-detail" id="cfg-d-${s.id}" role="region" aria-label="${s.name}" hidden>
          <div class="cfg-item-inner">
            ${s.img ? `<figure class="cfg-item-img"><img data-src="${IMG_DIR}${s.img}" alt="" width="720" height="480" /></figure>` : ""}
            <p>${s.desc}</p>
            ${s.facts ? `<dl class="cfg-facts">${s.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>` : ""}
            ${s.incl ? `<p class="cfg-incl-title">What’s included</p><ul class="cfg-incl">${s.incl.map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}
            <div class="cfg-item-actions">
              <button type="button" class="cfg-add" aria-pressed="false"><span class="cfg-add-box" aria-hidden="true"></span><span class="cfg-add-label">Add to quote</span></button>
            </div>
          </div>
        </div>
      </li>`;
  }
  function pkLine(p, k, off) {
    const it = ITEMS[k];
    const star = it.star && !off;
    const only = star && PACKAGES.filter((q) => pkItems(q).includes(k)).length === 1;
    return `<li class="cpk-i${star ? " is-star" : ""}${off ? " is-off" : ""}"><span>${it.t}${only ? `<em>Only in ${p.name}</em>` : ""}${off ? `<span class="sr-only"> (not included)</span>` : ""}</span>${star && it.note ? `<small>${it.note}</small>` : ""}</li>`;
  }
  function pkHTML(p, i, openId) {
    const open = p.id === openId;
    const lacks = p.lacks || [];
    const col = (cat, title, keys) => `
      <div class="cpk-col" data-cat="${cat}"><p class="cpk-col-t">${title}</p>
        <ul>${keys.map((k) => pkLine(p, k, false)).join("")}${lacks.filter((k) => catOfZone(ITEMS[k].zone) === cat).map((k) => pkLine(p, k, true)).join("")}</ul></div>`;
    const up = p.upsell && pkById[p.upsell.to];
    return `
      <article class="cpk${p.badge ? " is-rec" : ""}${open ? " is-open" : ""}" data-pk="${p.id}" style="--i:${i}">
        ${p.badge ? `<span class="cpk-badge">${p.badge}</span>` : ""}
        <button class="cpk-head" type="button" aria-expanded="${open}" aria-controls="cpk-${p.id}">
          <span class="cpk-n">${pkItems(p).length} services</span>
          <span class="cpk-name">${p.name} <span>Detail</span></span>
          <span class="cpk-line">${p.line}</span>
          <span class="cpk-dot" aria-hidden="true"></span>
          <span class="sr-only cpk-state"></span>
        </button>
        <div class="cpk-body" id="cpk-${p.id}"${open ? "" : " inert"}><div class="cpk-in"><div class="cpk-pad">
          <div class="cpk-cols">${col("exterior", "Exterior", p.exterior)}${col("interior", "Interior", p.interior)}</div>
          <button class="cpk-pick" type="button" aria-pressed="false"></button>
          ${up ? `<button class="cpk-up" type="button" data-to="${up.id}"><span>${p.upsell.text}</span><b>Upgrade to ${up.name} →</b></button>` : ""}
        </div></div></div>
      </article>`;
  }
  function render() {
    const openId = chosen || PACKAGES[0].id;
    let n = 0;
    box.innerHTML = `
      <div class="cpk-list" role="group" aria-label="Detail packages">${PACKAGES.map((p, i) => pkHTML(p, i, openId)).join("")}</div>
      <p class="cpk-trust"><span aria-hidden="true">★★★★★</span> 4.8 average Google rating · Certified XPEL installer</p>
      <div class="cfg-addons">
        <h4 class="cfg-sec-t">Add-ons</h4>
        <p class="cfg-sec-sub">Add them to any package, or book them on their own.</p>
        ${Object.entries(ADDON_GROUPS).map(([g, label]) => `
          <p class="cfg-grp" data-cat="${GROUP_CAT[g] || ""}">${label}</p>
          <ol class="cfg-list">${ADDONS.filter((a) => a.group === g).map((a) => itemHTML(a, n++)).join("")}</ol>`).join("")}
      </div>
      <details class="cfg-more">
        <summary>More services <span>${MORE.length}</span></summary>
        <ol class="cfg-list">${MORE.map((m, i) => itemHTML(m, i)).join("")}</ol>
      </details>`;
    sync();
  }

  function sync() {
    $$(".cpk", box).forEach((el) => {
      const p = pkById[el.dataset.pk], on = p.id === chosen;
      el.classList.toggle("is-on", on);
      const b = $(".cpk-pick", el);
      b.setAttribute("aria-pressed", String(on));
      b.textContent = on ? `✓ ${p.full} selected` : `Choose ${p.name}`;
      $(".cpk-state", el).textContent = on ? ", selected" : "";
    });
    $$(".cfg-item", box).forEach((li) => {
      const on = picked.has(li.dataset.id);
      li.classList.toggle("is-picked", on);
      const add = $(".cfg-add", li);
      add.setAttribute("aria-pressed", String(on));
      $(".cfg-add-label", add).textContent = on ? "Added to quote" : "Add to quote";
    });
    const total = picked.size + (chosen ? 1 : 0);
    quoteCount.textContent = total ? String(total) : "";
    quoteBtn.classList.toggle("has-items", total > 0);
    const ex = picked.size ? `${picked.size} add-on${picked.size > 1 ? "s" : ""}` : "";
    const note = $(".cfg-foot-note");
    note.innerHTML = chosen ? `<b>${pkById[chosen].full}</b>${ex ? ` + ${ex}` : ""}` : ex ? `${ex} · no package yet` : "No package chosen yet";
  }

  function openPk(id) {
    $$(".cpk", box).forEach((el) => {
      const open = el.dataset.pk === id;
      el.classList.toggle("is-open", open);
      $(".cpk-head", el).setAttribute("aria-expanded", String(open));
      $(".cpk-body", el).inert = !open;
    });
    keepInView($(`.cpk[data-pk="${id}"]`, box), 380);
  }
  // Packages are one at a time; choosing the one you already have clears it
  function choosePkg(id, keep = false) {
    const next = chosen === id && !keep ? null : id;
    if (next === chosen) return;
    chosen = next;
    sync();
    if (chosen === "ultimate") viewer?.shine?.();
  }

  function keepInView(el, delay) {
    if (!el) return;
    setTimeout(() => {
      if (isNarrow()) return;   // on phones the panel is part of the page; don't yank the page around
      const top = el.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 8;
      if (top < body.scrollTop || top + el.offsetHeight > body.scrollTop + body.clientHeight) {
        body.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? "auto" : "smooth" });
      }
    }, delay);
  }

  function toggleItem(li, open) {
    const head = $(".cfg-item-head", li);
    const detail = $(".cfg-item-detail", li);
    const willOpen = open ?? head.getAttribute("aria-expanded") !== "true";
    // One open at a time keeps the panel calm
    if (willOpen) $$(".cfg-item.is-open", box).forEach((o) => o !== li && toggleItem(o, false));
    head.setAttribute("aria-expanded", String(willOpen));
    li.classList.toggle("is-open", willOpen);
    if (willOpen) {
      detail.hidden = false;
      const img = $("img[data-src]", detail);
      if (img) { img.src = img.dataset.src; img.removeAttribute("data-src"); img.onload = () => img.classList.add("is-loaded"); }
      requestAnimationFrame(() => detail.classList.add("is-shown"));
      keepInView(li, 260);
    } else {
      detail.classList.remove("is-shown");
      setTimeout(() => { if (head.getAttribute("aria-expanded") !== "true") detail.hidden = true; }, 320);
    }
  }

  box.addEventListener("click", (e) => {
    const t = e.target;
    const pk = t.closest(".cpk");
    if (pk) {
      if (t.closest(".cpk-head")) { if (!pk.classList.contains("is-open")) openPk(pk.dataset.pk); }
      else if (t.closest(".cpk-pick")) choosePkg(pk.dataset.pk);
      else if (t.closest(".cpk-up")) { const to = t.closest(".cpk-up").dataset.to; choosePkg(to, true); openPk(to); }
      return;
    }
    const li = t.closest(".cfg-item");
    if (!li) return;
    if (t.closest(".cfg-item-head")) toggleItem(li);
    else if (t.closest(".cfg-add")) {
      picked.has(li.dataset.id) ? picked.delete(li.dataset.id) : picked.add(li.dataset.id);
      sync();
    }
  });
  // Pointing at the exterior or interior half of the window lights up that part of the car
  box.addEventListener("pointerover", (e) => {
    if (e.pointerType !== "mouse") return;
    setHover(e.target.closest("[data-cat]")?.dataset.cat || null);
  });
  box.addEventListener("pointerleave", () => setHover(null));

  // ---------- State ----------
  function setState(next, { focus = false } = {}) {
    if (next === state) return;
    const prev = state;
    state = next;
    root.dataset.state = next;
    hots.forEach((h) => {
      const on = h.dataset.cat === next;
      h.setAttribute("aria-expanded", String(on));
      h.classList.toggle("is-active", on);
    });
    viewer && viewer.setState(next);
    if (focus && next === "overview") $(`.cfg-hot[data-cat="${prev}"]`)?.focus({ preventScroll: true });
  }
  const isNarrow = () => matchMedia("(max-width: 860px)").matches;

  function setHover(cat) {
    if ((root.dataset.hover || null) === (cat || null)) return;
    root.dataset.hover = cat || "";
    viewer && viewer.setHover(cat);
  }

  hots.forEach((h) => {
    // clicking the lit label again goes back to the whole car
    h.addEventListener("click", () => setState(state === h.dataset.cat ? "overview" : h.dataset.cat, { focus: state === h.dataset.cat }));
    h.addEventListener("pointerenter", () => setHover(h.dataset.cat));
    h.addEventListener("pointerleave", () => setHover(null));
    h.addEventListener("focus", () => setHover(h.dataset.cat));
    h.addEventListener("blur", () => setHover(null));
  });
  backBtn.addEventListener("click", () => setState("overview", { focus: true }));

  // Menu / footer links: open a specific service (main.js handles the scroll to #configurator)
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-cfg-open]");
    if (!a) return;
    const id = a.dataset.cfgOpen;
    const li = box.querySelector(`.cfg-item[data-id="${id}"]`);
    setTimeout(() => {
      if (!li) { body.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }); return; }
      const more = li.closest("details");
      if (more) more.open = true;
      if (!li.classList.contains("is-open")) toggleItem(li, true);
      else keepInView(li, 0);
    }, 260);
  });
  root.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state !== "overview") setState("overview", { focus: true });
  });

  // ---------- Quote: tick the matching boxes in the contact form and note the exact package + extras ----------
  quoteBtn.addEventListener("click", () => {
    const form = document.getElementById("quote");
    if (!form) return;
    const extras = [...ADDONS, ...MORE].filter((s) => picked.has(s.id));
    const tick = (svc) => { const b = form.querySelector(`input[data-svc="${svc}"]`); if (b) b.checked = true; };
    if (chosen || !extras.length) tick("auto-detailing");
    extras.forEach((s) => tick(s.quote));
    const msg = form.elements.message;
    if (msg && (chosen || extras.length)) {
      const parts = [];
      if (chosen) parts.push(`Package: ${pkById[chosen].full}.`);
      if (extras.length) parts.push(`${chosen ? "Add-ons" : "Services"}: ${extras.map((s) => s.name).join(", ")}.`);
      const line = `Car detail: ${parts.join(" ")}`;
      const kept = msg.value.split("\n").filter((l) => !l.startsWith("Car detail:") && !l.startsWith("Services I'm interested in:")).join("\n").trim();
      msg.value = kept ? `${line}\n${kept}` : line;
    }
    // main.js handles the smooth scroll to #contact
  });

  // ---------- Interior peek: the model has no cabin, so a round lens opens on a photo of a real one ----------
  const peek = document.createElement("div");
  peek.className = "cfg-peek";
  peek.setAttribute("aria-hidden", "true");
  peek.innerHTML = `<img src="assets/cd/cfg/porsche-interior-steering-wheel-dashboard-pembroke.jpg" alt="" loading="lazy" />`;
  stage.appendChild(peek);
  function placePeek(p) {
    const a = p.interior;
    peek.style.transform = `translate(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px)`;
  }

  // ---------- Connector lines (drawn each frame from the car's projected anchor points) ----------
  function drawLines(p) {
    if (isNarrow()) return;
    const sr = stage.getBoundingClientRect();
    for (const cat of ["exterior", "interior"]) {
      const hot = $(`.cfg-hot[data-cat="${cat}"]`);
      const r = $(".cfg-hot-name", hot).getBoundingClientRect();
      const a = p[cat];
      const labelLeftOfAnchor = r.left + r.width / 2 < a.x + sr.left;
      const ex = (labelLeftOfAnchor ? r.right + 14 : r.left - 14) - sr.left;
      const ey = r.top + r.height * 0.55 - sr.top;
      const dx = a.x - ex, dy = a.y - ey;
      // short horizontal run out of the label, then a straight diagonal into the anchor dot
      // (45° when there's room; never shorter than 28px so the elbow always reads)
      const run = Math.max(28, Math.abs(dx) - Math.abs(dy));
      const kx = ex + Math.sign(dx || 1) * Math.min(run, Math.max(28, Math.abs(dx) * 0.7));
      const l = lines[cat];
      l.path.setAttribute("d", `M${ex.toFixed(1)},${ey.toFixed(1)} L${kx.toFixed(1)},${ey.toFixed(1)} L${a.x.toFixed(1)},${a.y.toFixed(1)}`);
      l.dot.setAttribute("cx", a.x.toFixed(1)); l.dot.setAttribute("cy", a.y.toFixed(1));
      l.ring.setAttribute("cx", a.x.toFixed(1)); l.ring.setAttribute("cy", a.y.toFixed(1));
    }
  }

  // ---------- 3D viewer (loaded when the section is near the viewport) ----------
  function canUseWebGL() {
    try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; }
  }
  async function startViewer() {
    if (!canUseWebGL()) { root.classList.add("no-3d"); status.hidden = true; return; }
    const { createCarViewer } = await import("./car.js?v=20261112c");
    viewer = createCarViewer(canvasBox, {
      reducedMotion,
      onProgress: (f) => { status.textContent = `Loading vehicle ${Math.round(f * 100)}%`; },
      onReady: () => {
        status.hidden = true;
        root.classList.add("is-ready");
        viewer.setState(state);
        visible ? viewer.start() : null;
      },
      onError: (err) => { console.error(err); root.classList.add("no-3d"); status.hidden = true; },
      onHoverPart: (cat) => { if (!isNarrow()) setHover(cat); canvasBox.style.cursor = cat ? "pointer" : ""; },
      onClickPart: (cat) => setState(cat),
    });
    viewer.onFrame(drawLines);
    viewer.onFrame(placePeek);
  }

  let visible = false;
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (!viewer) return;
    visible ? viewer.start() : viewer.stop();
  }, { rootMargin: "100px 0px" }).observe(stage);

  const loadIO = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    loadIO.disconnect();
    startViewer().catch((err) => { console.error(err); root.classList.add("no-3d"); status.hidden = true; });
  }, { rootMargin: "900px 0px" });
  loadIO.observe(stage);

  root.dataset.state = "overview";
  render();
}
