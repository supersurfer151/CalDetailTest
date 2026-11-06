// "Build Your Boat Detail": zone tabs, service checklist and quote email for the 3D boat.
// The 3D viewer (boat.js + three.js) only loads once the section is close to the viewport.
const EMAIL = "callahandetail@gmail.com";

const ZONE_DATA = {
  1: {
    key: "hull", name: "Hull", blurb: "Sides and bottom of the boat, from the waterline down.",
    services: [
      { id: "hull-clean", name: "Hull cleaning & polish", desc: "Waterline prep, machine compound and polish to remove oxidation and restore the gel coat." },
      { id: "hull-paint", name: "Hull painting & bottom paint", desc: "Bottom paint application after a light scuff and taped waterline." },
      { id: "hull-ceramic", name: "Marine ceramic coating", desc: "Long-term hydrophobic shine and UV protection, typically one to two boating seasons." },
      { id: "hull-ppf", name: "XPEL Marine paint protection film", desc: "Marine-grade film for high-wear areas prone to abrasion and staining. Certified XPEL Marine installer." },
    ],
  },
  2: {
    key: "topside", name: "Topside & Deck", blurb: "Deck, gunwales, cockpit and everything above the waterline you walk on.",
    services: [
      { id: "top-detail", name: "Topside detailing", desc: "Fiberglass compounding, metal polishing and vinyl conditioning." },
      { id: "top-teak", name: "Teak cleaning & varnishing", desc: "Cleaning and varnishing to bring weathered teak back." },
      { id: "top-ceramic", name: "Marine ceramic coating", desc: "Hydrophobic shine and UV protection for topside gel coat." },
    ],
  },
  3: {
    key: "console", name: "Console & Interior", blurb: "Helm, console, seating, cabins and enclosed compartments.",
    services: [
      { id: "int-detail", name: "Boat interior detailing", desc: "Cabins, hatches and enclosed compartments cleaned and detailed." },
      { id: "int-isinglass", name: "Isinglass polishing", desc: "Clears cloudy enclosures and windshields." },
    ],
  },
  4: {
    key: "metal", name: "Metal, Rails & T-Top", blurb: "Stainless and aluminum: rails, rod holders, towers and fittings.",
    services: [
      { id: "metal-restore", name: "Metal restoration", desc: "Tuna towers, bow rails and outriggers that have started to oxidize." },
      { id: "metal-polish", name: "Metal polishing", desc: "Polish for stainless and aluminum hardware and fittings." },
    ],
  },
  5: {
    key: "whole", name: "Whole Boat", blurb: "Off-season protection for the entire vessel: a tight, waterproof seal that keeps snow, ice, moisture, debris and pests out from November through spring launch. Book October to early November. Jet skis too.",
    services: [
      { id: "wrap", name: "Boat shrink wrapping", desc: "Measured and fitted to your boat, not stretched from a template: heat-sealed marine-grade film, built-in vents against mildew, reinforced strapping for wind and snow load, and support poles and padding to protect canvas, rails and antennas. $25/ft under 30 ft; $30/ft over 30 ft or with a tower or flybridge." },
      { id: "wrap-door", name: "Zippered access door", desc: "Add-on to the shrink wrap for gear retrieval during storage." },
    ],
  },
};

const section = document.querySelector(".explorer");
const stage = section.querySelector(".boat-stage");
const status = section.querySelector(".boat-status");
const tip = section.querySelector(".boat-tip");
const tabs = [...section.querySelectorAll(".zone-tab")];
const panel = section.querySelector(".zone-panel");
const form = section.querySelector(".quote-form");
const summary = section.querySelector(".quote-summary");
const estimate = section.querySelector(".wrap-estimate");

const selected = new Set();
let current = 1;
let viewer = null;

function renderZone(zone) {
  current = zone;
  const z = ZONE_DATA[zone];
  tabs.forEach((t) => t.setAttribute("aria-selected", String(+t.dataset.zone === zone)));
  panel.innerHTML = `
    <p class="eyebrow">Selected zone</p>
    <h3 class="zone-name">${z.name}</h3>
    <p class="zone-blurb">${z.blurb}</p>
    <ul class="service-list">
      ${z.services.map((s) => `
        <li>
          <label class="service">
            <input type="checkbox" value="${s.id}" ${selected.has(s.id) ? "checked" : ""} />
            <span class="check" aria-hidden="true"></span>
            <span class="service-text"><strong>${s.name}</strong><span>${s.desc}</span></span>
          </label>
        </li>`).join("")}
    </ul>`;
  viewer && viewer.select(zone);
}

function serviceById(id) {
  for (const [zone, z] of Object.entries(ZONE_DATA)) {
    const s = z.services.find((x) => x.id === id);
    if (s) return { ...s, zone: z.name };
  }
}

function updateSummary() {
  const items = [...selected].map(serviceById);
  summary.innerHTML = items.length
    ? items.map((s) => `<li><span>${s.zone}</span>${s.name}<button type="button" data-remove="${s.id}" aria-label="Remove ${s.name}">×</button></li>`).join("")
    : `<li class="empty">Click a part of the boat and tick the services you want.</li>`;
  form.querySelector("button[type=submit]").disabled = !items.length;

  // Shrink wrap pricing published on the current site: $25/ft under 30 ft, $30/ft over 30 ft or with a tower/flybridge
  const len = parseFloat(form.elements.feet.value);
  if (selected.has("wrap") && len > 0) {
    const rate = len >= 30 || form.elements.tower.checked ? 30 : 25;
    estimate.textContent = `Shrink wrap estimate: ${len} ft × $${rate}/ft = $${Math.round(len * rate).toLocaleString()} (add-ons quoted separately)`;
    estimate.hidden = false;
  } else {
    estimate.hidden = true;
  }
}

panel.addEventListener("change", (e) => {
  if (e.target.type !== "checkbox") return;
  e.target.checked ? selected.add(e.target.value) : selected.delete(e.target.value);
  updateSummary();
});
summary.addEventListener("click", (e) => {
  const id = e.target.dataset.remove;
  if (!id) return;
  selected.delete(id);
  renderZone(current);
  updateSummary();
});
tabs.forEach((t) => t.addEventListener("click", () => renderZone(+t.dataset.zone)));
// Menu / footer links with data-boat-zone="N" jump straight to that zone (e.g. shrink wrap = 5)
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-boat-zone]");
  if (a) renderZone(+a.dataset.boatZone);
});
form.addEventListener("input", updateSummary);

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const items = [...selected].map(serviceById);
  const f = form.elements;
  const lines = [
    "Hi Callahan Detail,", "",
    "I'd like a quote for marine detailing.", "",
    "Services:",
    ...items.map((s) => `- ${s.zone}: ${s.name}`), "",
    `Boat length: ${f.feet.value ? f.feet.value + " ft" : "not sure"}${f.tower.checked ? " (has tower/flybridge)" : ""}`,
  ];
  if (f.boat.value) lines.push(`Boat: ${f.boat.value}`);
  if (f.location.value) lines.push(`Where it's kept: ${f.location.value}`);
  if (f.notes.value) lines.push(`Notes: ${f.notes.value}`);
  if (f.custname.value) lines.push("", "Thanks,", f.custname.value);
  const subject = `Marine detailing quote${f.boat.value ? " – " + f.boat.value : ""}`;
  location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
});

renderZone(1);
updateSummary();

// ---------- Lazy-load the 3D viewer ----------
function canUseWebGL() {
  try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; }
}

async function startViewer() {
  if (!canUseWebGL()) {
    status.textContent = "3D view isn't supported on this device. Use the zone buttons to explore services.";
    return;
  }
  status.textContent = "Loading 3D boat…";
  const { createBoatViewer, ZONES } = await import("./boat.js");
  viewer = createBoatViewer(stage, {
    onProgress: (p) => (status.textContent = `Loading 3D boat… ${Math.round(p * 100)}%`),
    onReady: () => { status.hidden = true; stage.classList.add("is-ready"); viewer.select(current); },
    onZoneClick: (zone) => {
      renderZone(zone);
      panel.classList.remove("flash"); void panel.offsetWidth; panel.classList.add("flash");
    },
    onHover: (zone, e) => {
      if (!zone || zone === ZONES.NONE) { tip.hidden = true; return; }
      const r = stage.getBoundingClientRect();
      tip.textContent = ZONE_DATA[zone].name;
      tip.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top + 14}px)`;
      tip.hidden = false;
    },
  });
}

const io = new IntersectionObserver(([en]) => {
  if (!en.isIntersecting) return;
  io.disconnect();
  startViewer().catch((err) => {
    console.error(err);
    status.textContent = "The 3D boat couldn't load. Use the zone buttons to explore services.";
  });
}, { rootMargin: "800px 0px" });
io.observe(stage);
