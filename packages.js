// Car detailing packages and add-ons: the one place to edit them.
// Both the main site's "Configure Your Detail" section (configurator.js) and the v2 car garage
// (v2/data.js) read this file, so a change here shows up on both.
//
//   PACKAGES  listed best-first: that is the order customers see them in. Each package has
//             exterior / interior checklist lines (keys of ITEMS below). `badge` puts a ribbon on the
//             card, `lacks` lists lines shown struck through (what you give up), and `upsell` is the
//             one-tap nudge to the next package up.
//   ADDONS    optional extras, with or without a package. `group` is the heading they sit under,
//             `zone` is the part of the 3D car they belong to (paint, wheels, glass, lights, interior).
//   MORE      other services we still offer; listed under "More services".
//   quote     which box to tick in the main site's contact form.
// Photos are paths inside assets/cd/.

export const ITEMS = {
  wash:      { t: "Exterior wash", zone: "paint" },
  washDecon: { t: "Exterior wash & decontamination", zone: "paint" },
  wheels:    { t: "Wheel & tire cleaning", zone: "wheels" },
  buff:      { t: "Buff wax", note: "A light paint correction that lifts fine swirls and brings back a deep gloss", zone: "paint", star: true },
  plastics:  { t: "Plastic scrubbing", zone: "interior" },
  vacuum:    { t: "Vacuum", zone: "interior" },
  mats:      { t: "Floor mats", zone: "interior" },
  leather:   { t: "Leather conditioning", zone: "interior" },
  windows:   { t: "Inside windows", zone: "glass" },
  jambs:     { t: "Door jambs", zone: "interior" },
  interior:  { t: "Interior detail", zone: "interior" },
};

export const PACKAGES = [
  {
    id: "ultimate", name: "Ultimate", full: "Ultimate Detail", badge: "Recommended",
    line: "Our full detail, finished with a buff wax for a deep, glossy shine.",
    exterior: ["washDecon", "wheels", "buff"],
    interior: ["plastics", "vacuum", "mats", "leather", "windows", "jambs"],
  },
  {
    id: "premium", name: "Premium", full: "Premium Detail",
    line: "Everything in Ultimate except the buff wax.",
    exterior: ["washDecon", "wheels"],
    interior: ["plastics", "vacuum", "mats", "leather", "windows", "jambs"],
    lacks: ["buff"],
    upsell: { to: "ultimate", text: "Add the buff wax for a deeper gloss" },
  },
  {
    id: "basic", name: "Basic", full: "Basic Detail",
    line: "The essentials: a wash, clean wheels and an interior detail.",
    exterior: ["wash", "wheels"],
    interior: ["interior"],
    upsell: { to: "premium", text: "Premium adds decontamination, leather conditioning, door jambs and more" },
  },
];

export const ADDON_GROUPS = { protect: "Protect the finish", interior: "Interior extras" };

export const ADDONS = [
  { id: "ceramic-coating", group: "protect", zone: "paint", quote: "ceramic-coating",
    name: "Exterior Ceramic Coating", short: "XPEL Fusion: years of gloss, easy washing",
    desc: "A liquid polymer that chemically bonds to your paint, forming a hard, glass-like layer that stays put season after season. We install XPEL Fusion after thorough prep, which is what makes a coating last years instead of months.",
    img: "cfg/yellow-corvette-detail-shop-pembroke.jpg",
    facts: [["Product", "XPEL Fusion"], ["Time", "1 to 3 days by tier"]],
    incl: ["<strong>Tier 1:</strong> exterior-only coating, typically a full day", "<strong>Tiers 2 & 3:</strong> add paint correction, interior coating and wheel removal, two to three days", "Coats paint, wheels, glass, plastic trim and door jambs"] },
  { id: "ppf", group: "protect", zone: "paint", quote: "ppf",
    name: "Exterior Paint Protection Film", short: "Self-healing XPEL film against rock chips",
    desc: "Genuine XPEL film, precision-cut for your make and model: a clear, self-healing barrier against rock chips, road salt, bug splatter and fine scratches.",
    img: "cfg/paint-protection-film-blue-car-pembroke.jpg",
    facts: [["Film", "Genuine XPEL"], ["Time", "1 to 2 days full body"], ["Finish", "Self-healing, invisible"]],
    incl: ["Paint inspection and correction before film goes on", "Precision-cut patterns for your make and model", "Self-healing topcoat that removes light scratches with heat", "UV and stain resistance that keeps paint from fading or yellowing"] },
  { id: "wheel-ceramic", group: "protect", zone: "wheels", quote: "ceramic-coating",
    name: "Wheel & Tire Ceramic Coating", short: "Brake dust & grime rinse right off",
    desc: "XPEL Fusion ceramic applied to clean, decontaminated wheels. The coating resists brake dust and road salt, so wheels stay cleaner longer and wash up in minutes.",
    img: "cfg/gray-sedan-custom-wheel-red-caliper-pembroke.jpg",
    facts: [["Product", "XPEL Fusion"]] },
  { id: "spot-protection", group: "protect", zone: "paint", quote: "ppf",
    name: "PPF or Ceramic on Chosen Parts", short: "Just the hood, bumper, mirrors or any part you pick",
    desc: "Protection exactly where you want it: XPEL paint protection film or ceramic coating on only the parts you choose, like the hood, front bumper, mirrors or rocker panels. Tell us which parts in your quote request.",
    img: "cfg/porsche-hood-headlight-reflection-pembroke-detail.jpg" },
  { id: "interior-coating", group: "interior", zone: "interior", quote: "ceramic-coating",
    name: "Interior Coating", short: "Stain & UV protection for seats, carpet and trim",
    desc: "A protective interior coating that adds stain and UV resistance to seats, carpets and trim, so spills wipe up easily and surfaces don't fade.",
    img: "cfg/mercedes-steering-wheel-dashboard-display-pembroke.jpg" },
  { id: "odor-removal", group: "interior", zone: "interior", quote: "auto-detailing",
    name: "Odor Removal", short: "For smoke, pet and food odors",
    desc: "For odors a regular cleaning doesn't get out, like smoke, pets and spilled food or drinks. Tell us what you're dealing with and we'll plan the treatment around it.",
    img: "cfg/car-door-open-detailing-bay-pembroke.jpg" },
  { id: "pet-hair", group: "interior", zone: "interior", quote: "auto-detailing",
    name: "Pet Hair Removal", short: "Fur worked out of carpet and seats",
    desc: "Embedded pet hair worked out of carpets, floor mats and fabric seats: the fur a regular vacuum leaves behind.",
    img: "cfg/blue-ford-explorer-open-doors-garage-pembroke.jpg" },
];

export const MORE = [
  { id: "paint-correction", zone: "paint", quote: "paint-correction",
    name: "Multi-Stage Paint Correction", short: "Deeper swirls, scratches & oxidation",
    desc: "Multi-stage machine polishing that removes swirl marks, light scratches, water spots and oxidation. Every panel is inspected under LED lighting and corrected individually to restore deep gloss and colour clarity.",
    img: "cfg/orbital-polisher-paint-correction-pembroke-detailing.jpg",
    facts: [["Time", "Half day to 2 days"], ["Best before", "Ceramic or PPF"]] },
  { id: "window-tinting", zone: "glass", quote: "window-tinting",
    name: "Window Tinting", short: "Heat, glare & UV rejection",
    desc: "Optically clear film that blocks a significant portion of solar heat and UV, cuts glare and adds privacy. Fade-resistant film with a bubble-free finish, and guidance on shades that are legal on Massachusetts roads.",
    img: "cfg/2023-Tesla-Model-Y-Grey-Black-HTX-XRP-WC-19-png.jpg",
    facts: [["Time", "2 to 4 hours"], ["Cure", "3 to 5 days before rolling down"]] },
  { id: "headlight-restoration", zone: "lights", quote: "headlights",
    name: "Headlight Restoration", short: "Clear, bright lenses in about an hour",
    desc: "Wet sanding removes yellowing, haze and pitting, machine polishing restores optical clarity, and a UV-resistant sealant keeps lenses clear for one to two years.",
    img: "cfg/black-ram-pickup-front-angle-headlight-pembroke.jpg",
    facts: [["Time", "45 to 60 minutes"], ["Lasts", "1 to 2 years"]] },
  { id: "maintenance", zone: "full", quote: "auto-detailing",
    name: "Monthly Maintenance", short: "Keep it freshly detailed year-round",
    desc: "Monthly maintenance visits that keep your vehicle freshly detailed all year, so the finish never slides back to where it started.",
    img: "thumb/white-volvo-suv-three-quarter-angle-pembroke-wash.jpg" },
];

export const PRICING_NOTE = "Priced by vehicle size and condition";

// What each package does for one part of the car, best package first: [{ pkg, items: [ITEMS…] }]
export function packagesFor(zone) {
  return PACKAGES.map((p) => ({ pkg: p, items: [...p.exterior, ...p.interior].map((k) => ITEMS[k]).filter((it) => it.zone === zone || (zone === "interior" && it.zone === "glass")) }))
    .filter((r) => r.items.length);
}
