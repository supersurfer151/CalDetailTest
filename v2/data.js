// Every service on the site lives here: the garages (car / boat / motorcycle), the build sheet and the
// quote email all read from this one file. To change a service, edit it here and everything updates.
//
//   SERVICES[id]  name, short (one line), desc (2–3 sentences), img, optional facts [[label, value]], incl [bullets]
//   VEHICLES      each vehicle's parts ("zones"); a zone lists the service ids shown when you click that part.
//                 The same service can appear on more than one part (e.g. ceramic coating on hull and topside).
//
// Car packages and add-ons live in ../packages.js (shared with the main site) and are merged in below.
import { PACKAGES, ADDONS, MORE, ITEMS } from "../packages.js";

const CD = "../assets/cd/";
const TH = "../assets/cd/thumb/";

export const CONTACT = {
  phone: "781-635-2928",
  tel: "+17816352928",
  email: "callahandetail@gmail.com",
  address: "43 Mattakeesett St, Pembroke, MA 02359",
  maps: "https://maps.app.goo.gl/f5N8f3a1X69sGn969",
  hours: "Mon – Fri · 7:30 AM – 6:00 PM",
  instagram: "https://www.instagram.com/callahan_detail/",
  facebook: "https://www.facebook.com/CallahanDetail/",
};

export const SERVICES = {
  // ---------------- Car: packages, add-ons and more services come from ../packages.js (see CAR below) ----------------

  // ---------------- Boat ----------------
  "hull-clean": {
    name: "Hull Cleaning & Polish", short: "Oxidation out, gel coat restored", img: TH + "blue-boat-hull-lettering-pembroke-marina-detail.jpg",
    desc: "Waterline prep, machine compound and polish to remove oxidation and restore the gel coat. Boats with heavy oxidation or years without correction need extra compounding, which we price in up front.",
    facts: [["Pricing", "Per linear foot"], ["Where", "Your marina or yard"]],
  },
  "hull-paint": {
    name: "Hull Painting & Bottom Paint", short: "Scuffed, taped & painted", img: TH + "white-yacht-dry-dock-detail-pembroke-ma.jpg",
    desc: "Bottom paint application after a light scuff and a taped waterline, so the line stays crisp and the paint bonds properly.",
  },
  "marine-ceramic": {
    name: "Marine Ceramic Coating", short: "Hydrophobic shine & UV protection", img: TH + "boat-bow-hull-teal-stripe-detail-pembroke.jpg",
    desc: "Long-term hydrophobic shine and UV protection for hull and topside gel coat. Marine ceramic typically holds its protection and gloss for one to two boating seasons, depending on use and storage.",
    facts: [["Lasts", "1 to 2 seasons"], ["For", "Hull & topside"]],
  },
  "marine-ppf": {
    name: "XPEL Marine Paint Protection Film", short: "Film for high-wear areas", img: TH + "tiara-boat-cabin-side-stripe-pembroke-marina.jpg",
    desc: "Marine-grade film for high-wear areas prone to abrasion and staining. It lasts significantly longer than coatings and can be replaced in sections if an area takes damage. Certified XPEL Marine installer.",
    facts: [["Film", "XPEL Marine"], ["Repairs", "Replaceable in sections"]],
  },
  "top-detail": {
    name: "Topside Detailing", short: "Fiberglass, metal & vinyl", img: TH + "boat-gunwale-side-deck-sunset-pembroke-waterfront.jpg",
    desc: "Fiberglass compounding, metal polishing and vinyl conditioning for the deck, gunwales and cockpit: everything above the waterline you walk on and sit in.",
  },
  "top-teak": {
    name: "Teak Cleaning & Varnishing", short: "Weathered teak brought back", img: TH + "boat-cabin-exterior-wood-trim-pembroke-waterfront.jpg",
    desc: "Cleaning and varnishing to bring weathered, grey teak back to a warm, protected finish.",
  },
  "int-detail": {
    name: "Boat Interior Detailing", short: "Cabins, hatches & compartments", img: TH + "boat-helm-interior-wood-wheel-pembroke-marina.jpg",
    desc: "Cabins, helm, seating, hatches and enclosed compartments cleaned and detailed.",
  },
  "int-isinglass": {
    name: "Isinglass Polishing", short: "Cloudy enclosures cleared", img: TH + "boat-cockpit-seating-windshield-open-pembroke-marina.jpg",
    desc: "Polishing that clears cloudy isinglass enclosures and windshields so you can see out again.",
  },
  "metal-restore": {
    name: "Metal Restoration", short: "Towers, rails & outriggers", img: TH + "boat-t-top-canopy-seating-pembroke-waterfront.jpg",
    desc: "Restoration for tuna towers, bow rails and outriggers that have started to oxidize.",
  },
  "metal-polish": {
    name: "Metal Polishing", short: "Stainless & aluminum hardware", img: TH + "center-console-boat-bow-pembroke-dock.jpg",
    desc: "Polish for stainless and aluminum hardware, rod holders and fittings.",
  },
  wrap: {
    name: "Boat Shrink Wrapping", short: "Off-season protection, fitted to your boat", img: TH + "boat-shrink-wrap-storage-yard-pembroke.jpg",
    desc: "A tight, waterproof seal that keeps snow, ice, moisture, debris and pests out from November through spring launch. Measured and fitted to your boat, not stretched from a template. Jet skis too.",
    facts: [["Under 30 ft", "$25 per foot"], ["Over 30 ft / tower / flybridge", "$30 per foot"], ["Book", "October – early November"]],
    incl: ["Heat-sealed marine-grade film", "Built-in vents against mildew", "Reinforced strapping for wind and snow load", "Support poles and padding to protect canvas, rails and antennas", "Done at your marina, storage yard or driveway"],
  },
  "wrap-door": {
    name: "Zippered Access Door", short: "Get to your gear during storage", img: TH + "sailboat-wrapped-storage-detail-pembroke-marina.jpg",
    desc: "An add-on to the shrink wrap: a zippered door so you can get to gear inside the boat during storage without cutting the wrap.",
  },

  // ---------------- Motorcycle ----------------
  "moto-wash": {
    name: "Hand Wash & Decontamination", short: "Road film & brake dust, lifted safely", img: TH + "black-harley-cruiser-white-wall-autumn-pembroke.jpg",
    desc: "A careful hand wash and decontamination that removes road film, brake dust, salt air residue and bug splatter without scratching paint or chrome.",
  },
  "moto-correction": {
    name: "Paint Correction", short: "Light swirls & oxidation removed", img: TH + "blue-harley-davidson-fuel-tank-badge-pembroke-garage.jpg",
    desc: "Machine polishing on tanks, fenders and fairings to remove light swirls and oxidation and bring back depth and gloss.",
  },
  "moto-ceramic": {
    name: "XPEL Fusion Ceramic Coating", short: "Tank, fairings & chrome protected", img: TH + "blue-harley-davidson-tank-chrome-handlebar-pembroke.jpg",
    desc: "Ceramic protection for tanks, fairings and chrome that keeps the shine and makes the bike far easier to clean.",
    facts: [["Product", "XPEL Fusion"], ["Lasts", "1 to 2 riding seasons"]],
  },
  "moto-chrome": {
    name: "Chrome Polishing", short: "Pipes, bars & trim to a mirror finish", img: TH + "red-cruiser-motorcycle-polished-chrome-pembroke.jpg",
    desc: "Exhaust, handlebars, forks and trim polished to a mirror finish.",
  },
  "moto-wheels": {
    name: "Wheel & Spoke Polishing", short: "Brake dust out, rims to a shine", img: TH + "white-sport-motorcycle-front-wheel-brake-pembroke.jpg",
    desc: "Wheels, spokes and rims cleaned of brake dust and road grime, then polished to a mirror finish.",
  },
  "moto-leather": {
    name: "Leather & Vinyl Conditioning", short: "Seats cleaned & conditioned", img: TH + "black-harley-dyna-side-view-pembroke.jpg",
    desc: "Leather and vinyl seats cleaned and conditioned so they stay supple and resist cracking and fading.",
  },
  "moto-engine": {
    name: "Engine & Undercarriage Degreasing", short: "Where accessible, done safely", img: TH + "motorcycle-engine-chrome-detail-pembroke.jpg",
    desc: "Engine, cases and undercarriage degreased where accessible, so the motor looks as good as the paint.",
  },
  "moto-full": {
    name: "Complete Motorcycle Detail", short: "Every surface, 2 to 4 hours", img: TH + "blue-harley-davidson-engine-chrome-detail-pembroke-garage.jpg",
    desc: "Salt air off Duxbury Beach, Route 3 road grime and summer bug splatter settle into paint, chrome and leather in ways a garden hose can’t touch. Every surface gets the right tools and products for its material. Cruisers, sport bikes and touring models all welcome.",
    facts: [["Time", "2 to 4 hours"], ["Bikes", "Cruiser, sport, touring"], ["Where", "Pembroke shop"]],
    incl: ["Hand wash and decontamination to remove road film and brake dust", "Wheel, spoke and chrome polishing to a mirror finish", "Paint correction on light swirls and oxidation", "Leather and vinyl seat cleaning and conditioning", "Engine and undercarriage degreasing where accessible", "XPEL Fusion ceramic coating for tanks, fairings and chrome"],
  },
};

// Car packages, add-ons and more services from ../packages.js, in the same shape as the rest
for (const p of PACKAGES) {
  SERVICES["pkg-" + p.id] = { kind: "package", pkg: p.id, name: p.full, short: p.line };
}
for (const a of ADDONS) SERVICES[a.id] = { ...a, kind: "addon", img: a.img && CD + a.img };
for (const m of MORE) SERVICES[m.id] = { ...m, kind: "more", img: m.img && CD + m.img };
function zoneServices(zone) {
  return [...ADDONS, ...MORE].filter((s) => s.zone === zone).map((s) => s.id);
}
export { PACKAGES, ITEMS };

export const VEHICLES = {
  car: {
    name: "Car", label: "Automotive", where: "Pembroke shop", page: "car.html",
    intro: "Three detail packages, plus ceramic coating, XPEL paint protection film and interior add-ons, at our Pembroke shop.",
    tips: ["The buff wax in our Ultimate Detail is a light paint correction: it lifts fine swirls and brings back the gloss.", "Add-ons work with any package, or on their own.", "Many owners pair XPEL film on the front end with ceramic coating everywhere else."],
    packages: PACKAGES.map((p) => p.id),
    zones: [
      { id: "paint", name: "Paint", blurb: "Wash, polish and protect the finish everyone sees first.", services: zoneServices("paint") },
      { id: "wheels", name: "Wheels & Tires", blurb: "Brake dust, road salt and grime, gone from faces, barrels and tires.", services: zoneServices("wheels") },
      { id: "glass", name: "Glass", blurb: "Clear glass inside and out, plus tint that cuts heat, glare and UV.", services: zoneServices("glass") },
      { id: "lights", name: "Headlights", blurb: "Yellowed, hazy lenses made clear and bright again.", services: zoneServices("lights") },
      { id: "interior", name: "Interior", blurb: "Seats, carpets and every surface you touch each time you drive.", services: zoneServices("interior") },
      { id: "full", name: "Packages", blurb: "Pick a package, then add any extras.", services: zoneServices("full") },
    ],
  },
  boat: {
    name: "Boat", label: "Marine", where: "Mobile: we come to you", page: "boat.html",
    intro: "Hull cleaning, topside detailing, ceramic coatings, XPEL Marine film and custom shrink wrap, delivered dockside or at your storage yard. We bring the water, equipment and marine-grade products to you.",
    tips: ["Book shrink wrapping in October or early November, before the first hard freeze.", "Detailing is priced per linear foot and adjusted for condition.", "XPEL Marine film can be replaced in sections if an area takes damage."],
    facts: [["Where", "Mobile: we come to you"], ["Detailing", "Priced per linear foot"], ["Shrink wrap", "$25–$30 per foot"], ["Certified", "XPEL Marine installer"]],
    zones: [
      { id: "hull", name: "Hull", blurb: "Sides and bottom of the boat, from the waterline down.", services: ["hull-clean", "hull-paint", "marine-ceramic", "marine-ppf"] },
      { id: "topside", name: "Topside & Deck", blurb: "Deck, gunwales and cockpit: everything above the waterline you walk on.", services: ["top-detail", "top-teak", "marine-ceramic"] },
      { id: "console", name: "Console & Interior", blurb: "Helm, console, seating, cabins and enclosed compartments.", services: ["int-detail", "int-isinglass"] },
      { id: "metal", name: "Metal & T-Top", blurb: "Stainless and aluminum: rails, rod holders, towers and fittings.", services: ["metal-restore", "metal-polish"] },
      { id: "whole", name: "Shrink Wrap", blurb: "Off-season protection for the whole boat, November through spring launch.", services: ["wrap", "wrap-door"] },
    ],
  },
  moto: {
    name: "Motorcycle", label: "Motorcycle", where: "Pembroke shop", page: "motorcycle.html",
    intro: "Cruisers, sport bikes and touring models: paint, chrome, leather and engine, each with the right tools and products for its material.",
    tips: ["A full motorcycle detail takes 2 to 4 hours.", "Ceramic on the tank and chrome lasts 1 to 2 riding seasons."],
    zones: [
      { id: "paint", name: "Paint & Tank", blurb: "Tank, fenders and fairings: where swirls and oxidation show first.", services: ["moto-wash", "moto-correction", "moto-ceramic"] },
      { id: "chrome", name: "Chrome & Exhaust", blurb: "Pipes, bars, forks and trim polished to a mirror finish.", services: ["moto-chrome", "moto-ceramic"] },
      { id: "engine", name: "Engine", blurb: "Cases, cylinders and undercarriage, degreased where accessible.", services: ["moto-engine"] },
      { id: "seat", name: "Seat & Leather", blurb: "Leather and vinyl kept supple, clean and protected.", services: ["moto-leather"] },
      { id: "wheels", name: "Wheels", blurb: "Rims, spokes and hubs free of brake dust and road grime.", services: ["moto-wheels", "moto-wash"] },
      { id: "full", name: "Full Bike", blurb: "Every surface, start to finish, in 2 to 4 hours.", services: ["moto-full"] },
    ],
  },
};

// Build-sheet keys look like "car:paint-correction" so the same service id can be picked for different vehicles.
export function lookup(key) {
  const [veh, id] = key.split(":");
  const s = SERVICES[id];
  const v = VEHICLES[veh];
  return s && v ? { key, veh, id, vehicle: v, ...s } : null;
}
