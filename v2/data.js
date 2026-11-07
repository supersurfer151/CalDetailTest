// Every service on the site lives here: the garages (car / boat / motorcycle), the build sheet and the
// quote email all read from this one file. To change a service, edit it here and everything updates.
//
//   SERVICES[id]  name, short (one line), desc (2–3 sentences), img, optional facts [[label, value]], incl [bullets]
//   VEHICLES      each vehicle's parts ("zones"); a zone lists the service ids shown when you click that part.
//                 The same service can appear on more than one part (e.g. ceramic coating on hull and topside).

const CFG = "../assets/cd/cfg/";
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
  // ---------------- Car: paint ----------------
  "exterior-detailing": {
    name: "Exterior Detailing", short: "Hand wash, decontamination & sealant", img: CFG + "audi-rs7-covered-soap-wash-driveway-pembroke.jpg",
    desc: "A careful hand wash followed by clay bar and chemical decontamination to lift bonded dirt, tar and rail dust, then a one-step polish and sealant for gloss and protection. Wheels, tires, glass and door jambs included.",
    facts: [["Where", "Pembroke shop"], ["Vehicles", "Cars, trucks, SUVs, vans"], ["Pricing", "By size & condition"]],
    incl: ["Every job starts with an inspection so the process matches your car’s condition", "Clay bar and chemical decontamination for tar, bonded dirt and rail dust", "One-step polish and sealant for gloss and protection"],
  },
  "paint-correction": {
    name: "Paint Correction", short: "Remove swirls, scratches & oxidation", img: CFG + "orbital-polisher-paint-correction-pembroke-detailing.jpg",
    desc: "Multi-stage machine polishing that removes swirl marks, light scratches, water spots and oxidation. Every panel is inspected under LED lighting and corrected individually to restore deep gloss and colour clarity.",
    facts: [["Time", "Half day to 2 days"], ["Stages", "Single or multi-stage"], ["Best before", "Ceramic or PPF"]],
    incl: ["Wash, clay bar and chemical decontamination to lift bonded dirt, tar and rail dust", "Panel-by-panel inspection under LED lighting to map a correction plan", "Dual-action or rotary polishing matched to your paint’s hardness", "Removes swirl marks, spider webbing, water spots and light oxidation", "Restores deep gloss and colour clarity, especially on darker paint", "Creates a true surface for ceramic coating or paint protection film", "Deep scratches through the clear coat may reduce but not fully disappear; we’ll tell you up front"],
  },
  "ceramic-coating": {
    name: "Ceramic Coating", short: "XPEL Fusion, bonded to your paint", img: CFG + "yellow-corvette-detail-shop-pembroke.jpg",
    desc: "A liquid polymer that chemically bonds to your paint, forming a hard, glass-like layer that stays put season after season. We install XPEL Fusion after thorough prep, which is what makes a coating last years instead of months.",
    facts: [["Product", "XPEL Fusion"], ["Time", "1 to 3 days by tier"], ["For", "Cars, bikes & boats"]],
    incl: ["<strong>Tier 1:</strong> exterior-only coating, typically a full day", "<strong>Tiers 2 & 3:</strong> add paint correction, interior coating and wheel removal, two to three days", "Full exterior coating on paint, wheels, glass, plastic trim and door jambs", "Interior surface coating for added stain and UV resistance", "Engine bay detailing and coating", "Pairs with XPEL PPF on high-impact areas for maximum protection"],
  },
  ppf: {
    name: "Paint Protection Film", short: "Self-healing XPEL film against chips", img: CFG + "paint-protection-film-blue-car-pembroke.jpg",
    desc: "Genuine XPEL film, precision-cut for your make and model: a clear, self-healing barrier against rock chips, road salt, bug splatter and fine scratches. Protect high-impact areas like the hood, bumper and mirrors, or the full body.",
    facts: [["Film", "Genuine XPEL"], ["Time", "1 to 2 days full body"], ["Finish", "Self-healing, invisible"]],
    incl: ["Paint inspection and correction before film goes on", "Precision-cut patterns for your make and model", "Coverage for high-impact zones: hoods, bumpers, mirrors and rocker panels", "Self-healing topcoat that removes light scratches with heat", "UV and stain resistance that keeps paint from fading or yellowing", "Optional pairing with ceramic coating for gloss and easier washing"],
  },
  // ---------------- Car: wheels ----------------
  "wheels-off": {
    name: "Wheels-Off Cleaning", short: "Faces, barrels, calipers & wells", img: CFG + "mercedes-wheel-tire-detail-pembroke-detailing.jpg",
    desc: "The wheels come off so faces, inner barrels, calipers and wheel wells can be cleaned and decontaminated properly, lifting baked-on brake dust and road grime that a brush can’t reach with the wheel on the car.",
    incl: ["Wheel faces and inner barrels cleaned and decontaminated", "Calipers and wheel wells cleaned while the wheel is off", "Baked-on brake dust and road salt removed", "Wheels refitted and torqued back to spec"],
  },
  "wheel-ceramic": {
    name: "Wheel Ceramic Coating", short: "Brake dust & grime release easily", img: CFG + "gray-sedan-custom-wheel-red-caliper-pembroke.jpg",
    desc: "XPEL Fusion ceramic applied to clean, decontaminated wheels. The coating resists brake dust and road salt, so wheels stay cleaner longer and wash up in minutes. Higher coating tiers include wheel removal for full coverage.",
    facts: [["Product", "XPEL Fusion"], ["Part of", "Ceramic coating tiers"]],
  },
  "tire-shine": {
    name: "Tire Shine", short: "A clean, even satin finish", img: CFG + "black-pickup-truck-wheel-tire-detail-pembroke.jpg",
    desc: "Tires scrubbed clean of old dressing and browning, then finished with a dressing for a rich, even look that isn’t greasy and won’t sling onto your paint.",
  },
  // ---------------- Car: glass & lights ----------------
  "exterior-glass": {
    name: "Exterior Window Cleaning", short: "Streak-free, crystal-clear glass", img: CFG + "windshield-glass-detailing-pembroke-ma.jpg",
    desc: "Windshield, windows and mirrors cleaned streak-free, with water spots and bonded film lifted so visibility is crisp in sun, rain and night driving.",
  },
  "window-tinting": {
    name: "Window Tinting", short: "Heat, glare & UV rejection", img: CFG + "2023-Tesla-Model-Y-Grey-Black-HTX-XRP-WC-19-png.jpg",
    desc: "Optically clear film that blocks a significant portion of solar heat and UV, cuts glare and adds privacy. Fade-resistant film with a bubble-free finish, and guidance on shades that are legal on Massachusetts roads.",
    facts: [["Time", "2 to 4 hours"], ["Cure", "3 to 5 days before rolling down"], ["Where", "Pembroke shop"]],
    incl: ["Significant UV and heat rejection to protect skin and interior surfaces", "Reduced glare for safer, more comfortable driving", "Added privacy and security for your vehicle’s contents", "Bubble-free finish with properly trimmed edges", "Fade-resistant film that won’t turn purple after a few summers", "Massachusetts-legal shade guidance"],
  },
  "headlight-restoration": {
    name: "Headlight Restoration", short: "Clear, bright lenses in about an hour", img: CFG + "black-ram-pickup-front-angle-headlight-pembroke.jpg",
    desc: "Wet sanding removes yellowing, haze and pitting, machine polishing restores optical clarity, and a UV-resistant sealant keeps lenses clear for one to two years.",
    facts: [["Time", "45 to 60 minutes"], ["Lasts", "1 to 2 years"], ["Finish", "UV sealant"]],
    incl: ["Inspection of lens condition and oxidation depth", "Multi-stage wet sanding to remove yellowing, haze and pitting", "Machine polishing to restore optical clarity", "UV-resistant sealant to slow future oxidation", "Trim and surrounding paint protected throughout", "Before-and-after check of light output"],
  },
  // ---------------- Car: interior ----------------
  "interior-detailing": {
    name: "Interior Detailing", short: "Complete cabin clean & condition", img: CFG + "mercedes-amg-interior-dashboard-blue-ambient-pembroke.jpg",
    desc: "A full interior detail: every surface cleaned and conditioned, carpets and fabric steam-cleaned and shampooed, and interior glass left streak-free. The interior half of our Complete Detail package.",
    facts: [["Where", "Pembroke shop"], ["Part of", "Complete & Ultimate Detail"], ["Pricing", "By size & condition"]],
  },
  "deep-interior": {
    name: "Deep Interior Cleaning", short: "For heavy soiling, pet hair & stains", img: CFG + "car-door-open-detailing-bay-pembroke.jpg",
    desc: "For cabins that need more than a refresh: heavy soiling, pet hair, spills and set-in stains get the extra time, steam and extraction they need. We look over the condition with you before we start.",
  },
  leather: {
    name: "Leather Cleaning & Conditioning", short: "Clean, supple, protected leather", img: CFG + "porsche-interior-steering-wheel-dashboard-pembroke.jpg",
    desc: "Leather seats and trim gently cleaned to lift body oils and grime from the grain, then conditioned to keep them soft and help prevent cracking and fading.",
  },
  "carpet-upholstery": {
    name: "Carpet & Upholstery Cleaning", short: "Steam-cleaned & shampooed", img: CFG + "blue-ford-explorer-open-doors-garage-pembroke.jpg",
    desc: "Carpets, floor mats and fabric seats steam-cleaned and shampooed to pull out ground-in dirt, road-salt stains and odors that South Shore winters leave behind.",
  },
  "interior-protection": {
    name: "Interior Protection", short: "Stain & UV resistance for the cabin", img: CFG + "mercedes-steering-wheel-dashboard-display-pembroke.jpg",
    desc: "A protective interior coating that adds stain and UV resistance to seats, carpets and trim, so spills wipe up easily and surfaces don’t fade. Included in our higher ceramic coating tiers.",
    facts: [["Part of", "Higher ceramic tiers"], ["Protects", "Seats, carpet & trim"]],
  },
  // ---------------- Car: packages ----------------
  "complete-detail": {
    name: "Complete Detail Package", short: "Inside and out in a few hours", img: TH + "white-camaro-zl1-front-garage-pembroke-detailing.jpg",
    desc: "Our full inside-and-out detail: interior cleaning and conditioning, steam-cleaned and shampooed carpet and fabric, a decontamination wash, one-step polish and sealant, plus wheels, tires, glass and door jambs.",
    facts: [["Time", "A few hours"], ["Where", "Pembroke shop"], ["Pricing", "By size & condition"]],
    incl: ["Interior cleaning and conditioning", "Steam-cleaned and shampooed carpet and fabric", "Decontamination wash", "One-step polish and sealant", "Wheels, tires, glass and door jambs"],
  },
  "ultimate-detail": {
    name: "Ultimate Detail Package", short: "Complete + 3-step correction & ceramic sealant", img: TH + "black-porsche-911-garage-driveway-pembroke.jpg",
    desc: "Everything in the Complete Detail, plus engine bay cleaning, full three-step paint correction and a six-month ceramic spray sealant. It takes longer than the Complete; we’ll give you a time estimate at drop-off.",
    facts: [["Correction", "Full three-step"], ["Sealant", "6-month ceramic spray"], ["Time", "Estimated at drop-off"]],
    incl: ["Everything in the Complete Detail Package", "Engine bay cleaning", "Full three-step paint correction", "Six-month ceramic spray sealant"],
  },
  maintenance: {
    name: "Monthly Maintenance", short: "Keep it freshly detailed year-round", img: TH + "white-volvo-suv-three-quarter-angle-pembroke-wash.jpg",
    desc: "Monthly maintenance packages that keep your vehicle freshly detailed all year, so the finish never slides back to where it started.",
  },

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

export const VEHICLES = {
  car: {
    name: "Car", label: "Automotive", where: "Pembroke shop", page: "car.html",
    intro: "Paint correction, XPEL ceramic coating and paint protection film, tint, headlights and full interior detailing at our Pembroke shop.",
    tips: ["Paint correction before ceramic or PPF is what makes protection last years instead of months.", "Wait 3 to 5 days before rolling down freshly tinted windows.", "Many owners pair XPEL film on the front end with ceramic coating everywhere else."],
    zones: [
      { id: "paint", name: "Paint", blurb: "Wash, correct and protect the finish everyone sees first.", services: ["exterior-detailing", "paint-correction", "ceramic-coating", "ppf"] },
      { id: "wheels", name: "Wheels & Tires", blurb: "Brake dust, road salt and grime, gone from faces, barrels and calipers.", services: ["wheels-off", "wheel-ceramic", "tire-shine"] },
      { id: "glass", name: "Glass", blurb: "Crystal-clear glass, plus tint that cuts heat, glare and UV.", services: ["exterior-glass", "window-tinting"] },
      { id: "lights", name: "Headlights", blurb: "Yellowed, hazy lenses made clear and bright again.", services: ["headlight-restoration"] },
      { id: "interior", name: "Interior", blurb: "Seats, carpets and every surface you touch each time you drive.", services: ["interior-detailing", "deep-interior", "leather", "carpet-upholstery", "interior-protection"] },
      { id: "full", name: "Full Car", blurb: "Packages that take care of everything, inside and out.", services: ["complete-detail", "ultimate-detail", "ceramic-coating", "ppf", "maintenance"] },
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
