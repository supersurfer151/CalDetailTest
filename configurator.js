// "Configure Your Detail": interactive EXTERIOR / INTERIOR service selector around a 3D sports car.
// To add, remove or edit a service, change the SERVICES list below; everything else updates itself.
//   id     unique key            name   service name             short  one line under the name
//   desc   2–3 sentence summary  img    photo in assets/cd/cfg/  quote  which box to tick in the contact form
//   facts  (optional) [label, value] pairs shown as a small table   incl  (optional) "What's included" bullets
// Any link with data-cfg-open="<id>" (menu, footer) opens that service here.
const SERVICES = {
  exterior: {
    title: "Exterior",
    blurb: "Paint, wheels, glass and lights: everything the weather and the road reach first.",
    items: [
      { id: "exterior-detailing", name: "Exterior Detailing", short: "Hand wash, decontamination & sealant",
        desc: "A careful hand wash followed by clay bar and chemical decontamination to lift bonded dirt, tar and rail dust, then a one-step polish and sealant for gloss and protection. Wheels, tires, glass and door jambs included.",
        img: "audi-rs7-covered-soap-wash-driveway-pembroke.jpg", quote: "auto-detailing",
        facts: [["Where", "Pembroke shop"], ["Vehicles", "Cars, trucks, SUVs, vans"], ["Pricing", "By size & condition"]],
        incl: ["<strong>Complete Detail:</strong> interior cleaning and conditioning, steam-cleaned and shampooed carpet and fabric, decontamination wash, one-step polish and sealant, wheels, tires, glass and door jambs", "<strong>Ultimate Detail:</strong> everything in Complete, plus engine bay cleaning, full three-step paint correction and a six-month ceramic spray sealant", "Every job starts with an inspection so the process matches your car’s condition", "Monthly maintenance packages to keep your vehicle freshly detailed year-round"] },
      { id: "paint-correction", name: "Paint Correction", short: "Remove swirls, scratches & oxidation",
        desc: "Multi-stage machine polishing that removes swirl marks, light scratches, water spots and oxidation. Every panel is inspected under LED lighting and corrected individually to restore deep gloss and colour clarity.",
        img: "orbital-polisher-paint-correction-pembroke-detailing.jpg", quote: "paint-correction",
        facts: [["Time", "Half day to 2 days"], ["Stages", "Single or multi-stage"], ["Best before", "Ceramic or PPF"]],
        incl: ["Wash, clay bar and chemical decontamination to lift bonded dirt, tar and rail dust", "Panel-by-panel inspection under LED lighting to map a correction plan", "Dual-action or rotary polishing matched to your paint’s hardness", "Removes swirl marks, spider webbing, water spots and light oxidation", "Restores deep gloss and colour clarity, especially on darker paint", "Creates a true surface for ceramic coating or paint protection film"] },
      { id: "ceramic-coating", name: "Ceramic Coating", short: "XPEL Fusion, bonded to your paint",
        desc: "A liquid polymer that chemically bonds to your paint, forming a hard, glass-like layer that stays put season after season. We install XPEL Fusion after thorough prep, which is what makes a coating last years instead of months.",
        img: "yellow-corvette-detail-shop-pembroke.jpg", quote: "ceramic-coating",
        facts: [["Product", "XPEL Fusion"], ["Time", "1 to 3 days by tier"], ["For", "Cars, bikes & boats"]],
        incl: ["Multi-stage paint correction before coating on higher tiers", "Full exterior coating on paint, wheels, glass, plastic trim and door jambs", "Interior surface coating for added stain and UV resistance", "Engine bay detailing and coating"] },
      { id: "ppf", name: "Paint Protection Film (PPF)", short: "Self-healing XPEL film against chips",
        desc: "Genuine XPEL film, precision-cut for your make and model: a clear, self-healing barrier against rock chips, road salt, bug splatter and fine scratches. Protect high-impact areas like the hood, bumper and mirrors, or the full body.",
        img: "paint-protection-film-blue-car-pembroke.jpg", quote: "ppf",
        facts: [["Film", "Genuine XPEL"], ["Time", "1 to 2 days full body"], ["Finish", "Self-healing, invisible"]],
        incl: ["Paint inspection and correction before film goes on", "Precision-cut patterns for your make and model", "Coverage for high-impact zones: hoods, bumpers, mirrors and rocker panels", "Self-healing topcoat that removes light scratches with heat", "UV and stain resistance that keeps paint from fading or yellowing", "Optional pairing with ceramic coating for gloss and easier washing"] },
      { id: "wheel-detailing", name: "Wheel Detailing", short: "Faces, barrels & calipers deep-cleaned",
        desc: "Wheel faces, barrels and calipers cleaned and decontaminated to remove baked-on brake dust and road grime, so the finish underneath shines again.",
        img: "mercedes-wheel-tire-detail-pembroke-detailing.jpg", quote: "auto-detailing" },
      { id: "wheel-ceramic", name: "Wheel Ceramic Coating", short: "Brake dust & grime release easily",
        desc: "XPEL Fusion ceramic applied to clean, decontaminated wheels. The coating resists brake dust and road salt, so wheels stay cleaner longer and wash up in minutes. Higher coating tiers include wheel removal for full coverage.",
        img: "gray-sedan-custom-wheel-red-caliper-pembroke.jpg", quote: "ceramic-coating",
        facts: [["Product", "XPEL Fusion"], ["Part of", "Ceramic coating tiers"]] },
      { id: "tire-shine", name: "Tire Shine", short: "A clean, even satin finish",
        desc: "Tires scrubbed clean of old dressing and browning, then finished with a dressing for a rich, even look that isn't greasy and won't sling onto your paint.",
        img: "black-pickup-truck-wheel-tire-detail-pembroke.jpg", quote: "auto-detailing" },
      { id: "exterior-glass", name: "Exterior Window Cleaning", short: "Streak-free, crystal-clear glass",
        desc: "Windshield, windows and mirrors cleaned streak-free, with water spots and bonded film lifted so visibility is crisp in sun, rain and night driving.",
        img: "windshield-glass-detailing-pembroke-ma.jpg", quote: "auto-detailing" },
      { id: "window-tinting", name: "Window Tinting", short: "Heat, glare & UV rejection",
        desc: "Optically clear film that blocks a significant portion of solar heat and UV, cuts glare and adds privacy. Fade-resistant film with a bubble-free finish, and guidance on shades that are legal on Massachusetts roads.",
        img: "2023-Tesla-Model-Y-Grey-Black-HTX-XRP-WC-19-png.jpg", quote: "window-tinting",
        facts: [["Time", "2 to 4 hours"], ["Cure", "3 to 5 days before rolling down"], ["Where", "Pembroke shop"]],
        incl: ["Significant UV and heat rejection to protect skin and interior surfaces", "Reduced glare for safer, more comfortable driving", "Added privacy and security for your vehicle’s contents", "Bubble-free finish with properly trimmed edges", "Fade-resistant film that won’t turn purple after a few summers", "Massachusetts-legal shade guidance"] },
      { id: "headlight-restoration", name: "Headlight Restoration", short: "Clear, bright lenses in about an hour",
        desc: "Wet sanding removes yellowing, haze and pitting, machine polishing restores optical clarity, and a UV-resistant sealant keeps lenses clear for one to two years.",
        img: "black-ram-pickup-front-angle-headlight-pembroke.jpg", quote: "headlights",
        facts: [["Time", "45 to 60 minutes"], ["Lasts", "1 to 2 years"], ["Finish", "UV sealant"]],
        incl: ["Inspection of lens condition and oxidation depth", "Multi-stage wet sanding to remove yellowing, haze and pitting", "Machine polishing to restore optical clarity", "UV-resistant sealant to slow future oxidation", "Trim and surrounding paint protected throughout", "Before-and-after check of light output"] },
    ],
  },
  interior: {
    title: "Interior",
    blurb: "Seats, carpets and every surface you touch each time you drive.",
    items: [
      { id: "interior-detailing", name: "Interior Detailing", short: "Complete cabin clean & condition",
        desc: "A full interior detail: every surface cleaned and conditioned, carpets and fabric steam-cleaned and shampooed, and interior glass left streak-free. The interior half of our Complete Detail package.",
        img: "mercedes-amg-interior-dashboard-blue-ambient-pembroke.jpg", quote: "auto-detailing",
        facts: [["Where", "Pembroke shop"], ["Part of", "Complete & Ultimate Detail"], ["Pricing", "By size & condition"]] },
      { id: "deep-interior", name: "Deep Interior Cleaning", short: "For heavy soiling, pet hair & stains",
        desc: "For cabins that need more than a refresh: heavy soiling, pet hair, spills and set-in stains get the extra time, steam and extraction they need. We look over the condition with you before we start.",
        img: "car-door-open-detailing-bay-pembroke.jpg", quote: "auto-detailing" },
      { id: "leather", name: "Leather Cleaning & Conditioning", short: "Clean, supple, protected leather",
        desc: "Leather seats and trim gently cleaned to lift body oils and grime from the grain, then conditioned to keep them soft and help prevent cracking and fading.",
        img: "porsche-interior-steering-wheel-dashboard-pembroke.jpg", quote: "auto-detailing" },
      { id: "carpet-upholstery", name: "Carpet & Upholstery Cleaning", short: "Steam-cleaned & shampooed",
        desc: "Carpets, floor mats and fabric seats steam-cleaned and shampooed to pull out ground-in dirt, road-salt stains and odors that South Shore winters leave behind.",
        img: "blue-ford-explorer-open-doors-garage-pembroke.jpg", quote: "auto-detailing" },
      { id: "interior-protection", name: "Interior Protection", short: "Stain & UV resistance for the cabin",
        desc: "A protective interior coating that adds stain and UV resistance to seats, carpets and trim, so spills wipe up easily and surfaces don't fade. Included in our higher ceramic coating tiers.",
        img: "mercedes-steering-wheel-dashboard-display-pembroke.jpg", quote: "ceramic-coating",
        facts: [["Part of", "Higher ceramic tiers"], ["Protects", "Seats, carpet & trim"]] },
    ],
  },
};
const IMG_DIR = "assets/cd/cfg/";

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
  const tabs = $$(".cfg-tab");
  const panel = $(".cfg-panel");
  const body = $(".cfg-body");
  const list = $(".cfg-list");
  const quoteBtn = $(".cfg-quote");
  const quoteCount = $(".cfg-quote-count");
  const backBtn = $(".cfg-back");
  const lines = Object.fromEntries(["exterior", "interior"].map((c) => [c, {
    path: $(`.cfg-lines [data-cat="${c}"] path`),
    dot: $(`.cfg-lines [data-cat="${c}"] .cfg-dot`),
    ring: $(`.cfg-lines [data-cat="${c}"] .cfg-ring`),
    g: $(`.cfg-lines [data-cat="${c}"]`),
  }]));

  // Service counts on the labels and tabs come from the data
  $$("[data-cfg-count]").forEach((el) => {
    const n = SERVICES[el.dataset.cfgCount].items.length;
    el.textContent = `${n} services`;
  });

  let state = "overview";
  let viewer = null;
  const picked = new Set();

  // ---------- Rendering the panel ----------
  function renderList(cat) {
    const data = SERVICES[cat];
    $(".cfg-cat-title").textContent = data.title;
    $(".cfg-cat-blurb").textContent = data.blurb;
    list.innerHTML = data.items.map((s, i) => `
      <li class="cfg-item" style="--i:${i}" data-id="${s.id}">
        <button class="cfg-item-head" type="button" aria-expanded="false" aria-controls="cfg-d-${s.id}">
          <span class="cfg-item-num">${String(i + 1).padStart(2, "0")}</span>
          <span class="cfg-item-text"><span class="cfg-item-name">${s.name}</span><span class="cfg-item-short">${s.short}</span></span>
          <span class="cfg-item-added" aria-hidden="true"></span>
          <span class="cfg-item-icon" aria-hidden="true"></span>
        </button>
        <div class="cfg-item-detail" id="cfg-d-${s.id}" role="region" aria-label="${s.name}" hidden>
          <div class="cfg-item-inner">
            <figure class="cfg-item-img"><img data-src="${IMG_DIR}${s.img}" alt="" width="720" height="480" /></figure>
            <p>${s.desc}</p>
            ${s.facts ? `<dl class="cfg-facts">${s.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>` : ""}
            ${s.incl ? `<p class="cfg-incl-title">What’s included</p><ul class="cfg-incl">${s.incl.map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}
            <div class="cfg-item-actions">
              <button type="button" class="cfg-add" aria-pressed="false"><span class="cfg-add-box" aria-hidden="true"></span><span class="cfg-add-label">Add to quote</span></button>
            </div>
          </div>
        </div>
      </li>`).join("");
    syncPicked();
  }

  function syncPicked() {
    $$(".cfg-item", list).forEach((li) => {
      const on = picked.has(li.dataset.id);
      li.classList.toggle("is-picked", on);
      const add = $(".cfg-add", li);
      add.setAttribute("aria-pressed", String(on));
      $(".cfg-add-label", add).textContent = on ? "Added to quote" : "Add to quote";
    });
    quoteCount.textContent = picked.size ? String(picked.size) : "";
    quoteBtn.classList.toggle("has-items", picked.size > 0);
    $(".cfg-foot-note").textContent = picked.size
      ? `${picked.size} service${picked.size > 1 ? "s" : ""} selected`
      : "Add services to build your quote";
  }

  function toggleItem(li, open) {
    const head = $(".cfg-item-head", li);
    const detail = $(".cfg-item-detail", li);
    const willOpen = open ?? head.getAttribute("aria-expanded") !== "true";
    // One open at a time keeps the panel calm
    if (willOpen) $$(".cfg-item.is-open", list).forEach((o) => o !== li && toggleItem(o, false));
    head.setAttribute("aria-expanded", String(willOpen));
    li.classList.toggle("is-open", willOpen);
    if (willOpen) {
      detail.hidden = false;
      const img = $("img[data-src]", detail);
      if (img) { img.src = img.dataset.src; img.removeAttribute("data-src"); img.onload = () => img.classList.add("is-loaded"); }
      requestAnimationFrame(() => detail.classList.add("is-shown"));
      // keep the opened item in view inside the scrolling panel
      setTimeout(() => {
        const top = li.offsetTop - body.offsetTop;
        if (top < body.scrollTop || top + li.offsetHeight > body.scrollTop + body.clientHeight) {
          body.scrollTo({ top: Math.max(0, top - 8), behavior: reducedMotion ? "auto" : "smooth" });
        }
      }, 260);
    } else {
      detail.classList.remove("is-shown");
      setTimeout(() => { if (head.getAttribute("aria-expanded") !== "true") detail.hidden = true; }, 320);
    }
  }

  list.addEventListener("click", (e) => {
    const li = e.target.closest(".cfg-item");
    if (!li) return;
    if (e.target.closest(".cfg-item-head")) toggleItem(li);
    else if (e.target.closest(".cfg-add")) {
      picked.has(li.dataset.id) ? picked.delete(li.dataset.id) : picked.add(li.dataset.id);
      syncPicked();
    }
  });

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
    tabs.forEach((t) => {
      const on = t.dataset.cat === next;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on || (next === "overview" && t.dataset.cat === "exterior") ? 0 : -1;
    });
    syncInert();
    if (next !== "overview") {
      if (prev !== "overview" && !reducedMotion) {
        // cross-fade the list when switching categories
        body.classList.add("is-switching");
        setTimeout(() => { renderList(next); body.scrollTop = 0; body.classList.remove("is-switching"); }, 180);
      } else {
        renderList(next);
        body.scrollTop = 0;
      }
    }
    viewer && viewer.setState(next);
    if (focus && next !== "overview") setTimeout(() => $(`.cfg-tab[data-cat="${next}"]`).focus({ preventScroll: true }), 60);
    if (focus && next === "overview") $(`.cfg-hot[data-cat="${prev}"]`)?.focus({ preventScroll: true });
  }
  const isNarrow = () => matchMedia("(max-width: 860px)").matches;
  // On desktop the panel is off-screen in the overview, so keep keyboard focus out of it
  function syncInert() { panel.inert = state === "overview" && !isNarrow(); }

  function setHover(cat) {
    root.dataset.hover = cat || "";
    viewer && viewer.setHover(cat);
  }

  hots.forEach((h) => {
    h.addEventListener("click", () => setState(h.dataset.cat, { focus: true }));
    h.addEventListener("pointerenter", () => setHover(h.dataset.cat));
    h.addEventListener("pointerleave", () => setHover(null));
    h.addEventListener("focus", () => setHover(h.dataset.cat));
    h.addEventListener("blur", () => setHover(null));
  });
  tabs.forEach((t) => {
    t.addEventListener("click", () => setState(t.dataset.cat));
    t.addEventListener("pointerenter", () => setHover(t.dataset.cat));
    t.addEventListener("pointerleave", () => setHover(null));
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const other = tabs.find((x) => x !== t);
      other.focus();
      setState(other.dataset.cat);
    });
  });
  backBtn.addEventListener("click", () => setState("overview", { focus: true }));

  // Menu / footer links: open a specific service (main.js handles the scroll to #configurator)
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-cfg-open]");
    if (!a) return;
    const id = a.dataset.cfgOpen;
    const cat = Object.keys(SERVICES).find((c) => SERVICES[c].items.some((s) => s.id === id));
    if (!cat) return;
    setState(cat);
    setTimeout(() => {
      const li = list.querySelector(`.cfg-item[data-id="${id}"]`);
      if (li && !li.classList.contains("is-open")) toggleItem(li, true);
    }, 260);
  });
  root.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state !== "overview") setState("overview", { focus: true });
  });

  // ---------- Quote: tick the matching boxes in the contact form and note the exact services ----------
  quoteBtn.addEventListener("click", () => {
    const form = document.getElementById("quote");
    if (!form) return;
    const all = [...SERVICES.exterior.items.map((s) => ({ ...s, cat: "Exterior" })), ...SERVICES.interior.items.map((s) => ({ ...s, cat: "Interior" }))];
    const chosen = all.filter((s) => picked.has(s.id));
    chosen.forEach((s) => {
      const box = form.querySelector(`input[data-svc="${s.quote}"]`);
      if (box) box.checked = true;
    });
    if (!chosen.length) {
      const box = form.querySelector('input[data-svc="auto-detailing"]');
      if (box) box.checked = true;
    }
    const msg = form.elements.message;
    if (msg && chosen.length) {
      const groups = ["Exterior", "Interior"].map((c) => {
        const names = chosen.filter((s) => s.cat === c).map((s) => s.name);
        return names.length ? `${c}: ${names.join(", ")}` : "";
      }).filter(Boolean);
      const line = `Services I'm interested in: ${groups.join(". ")}.`;
      const kept = msg.value.split("\n").filter((l) => !l.startsWith("Services I'm interested in:")).join("\n").trim();
      msg.value = kept ? `${line}\n${kept}` : line;
    }
    // main.js handles the smooth scroll to #contact
  });

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
    const { createCarViewer } = await import("./car.js");
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
  syncPicked();
  syncInert();
  matchMedia("(max-width: 860px)").addEventListener("change", syncInert);
}
