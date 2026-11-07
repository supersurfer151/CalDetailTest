// The menu (index.html): tabbed screens, background reels, theater, gallery and lightbox.
import { isSheetOpen, makeWipe, wipeOut } from "./ui.js";

// ---------------------------------------------------------------------------------------------
// VIDEO EDITS: add your edits here. They play one after another behind the menu, and all of them
// show up as choices in the "Watch" theater. Put the files in ../assets/video/.
//   src     the video file          poster  a still shown while it loads          title  button label
// ---------------------------------------------------------------------------------------------
const REELS = [
  { src: "../assets/video/reel.mp4", poster: "../assets/cd/lamborghini-roadster-open-door-detail-pembroke.jpg", title: "Shop reel" },
];

const ORDER = ["home", "services", "work", "reviews", "about", "faq", "contact"];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const screens = $$(".screen");
const tabs = $$(".tab");
const tabRow = $(".tab-row");
const ind = $(".tab-ind");
let current = null;

// ---------------- Screens ----------------
function show(id) {
  if (!ORDER.includes(id)) id = "home";
  if (id === current) return;
  const idx = ORDER.indexOf(id);
  screens.forEach((s) => {
    const on = s.id === id;
    s.classList.toggle("is-active", on);
    s.classList.toggle("is-left", ORDER.indexOf(s.id) < idx);
    s.inert = !on;
    if (on) $$("[data-nav], .screen-head, .home-hero, .ticker", s).forEach((el, i) => el.style.setProperty("--d", i));
  });
  document.body.dataset.screen = id;
  tabs.forEach((t) => (t.getAttribute("href") === "#" + id ? t.setAttribute("aria-current", "page") : t.removeAttribute("aria-current")));
  moveIndicator();
  if (id === "contact") { const f = $(".map iframe[data-src]"); if (f) { f.src = f.dataset.src; f.removeAttribute("data-src"); } }
  const sc = $(`#${id} .scroll`); if (sc) sc.scrollTop = 0;
  current = id;
}
function moveIndicator() {
  const t = tabs.find((x) => x.hasAttribute("aria-current"));
  if (!t) return;
  ind.style.left = t.offsetLeft + 8 + "px";
  ind.style.width = t.offsetWidth - 16 + "px";
  const nav = $(".tabs");
  if (nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: t.offsetLeft - nav.clientWidth / 2 + t.offsetWidth / 2, behavior: reduced ? "auto" : "smooth" });
}
const go = (id) => { if ("#" + id !== location.hash) location.hash = id; else show(id); };
window.addEventListener("hashchange", () => show(location.hash.slice(1)));
window.addEventListener("resize", moveIndicator);
show(location.hash.slice(1) || "home");
document.fonts?.ready.then(moveIndicator);

// ---------------- Keyboard: Q/E tabs, arrows move between tiles, Esc goes back ----------------
function spatial(dir) {
  const scr = $(".screen.is-active");
  const items = $$("[data-nav]", scr).filter((el) => el.offsetParent !== null);
  const cur = document.activeElement;
  if (!items.includes(cur)) { items[0]?.focus(); return true; }
  const r = cur.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let best = null, bestScore = Infinity;
  for (const el of items) {
    if (el === cur) continue;
    const b = el.getBoundingClientRect();
    const dx = b.left + b.width / 2 - cx, dy = b.top + b.height / 2 - cy;
    const horiz = dir === "ArrowLeft" || dir === "ArrowRight";
    const ok = { ArrowLeft: dx < -4, ArrowRight: dx > 4, ArrowUp: dy < -4, ArrowDown: dy > 4 }[dir];
    if (!ok) continue;
    const score = (horiz ? Math.abs(dx) : Math.abs(dy)) + (horiz ? Math.abs(dy) : Math.abs(dx)) * 2;
    if (score < bestScore) { bestScore = score; best = el; }
  }
  if (best) { best.focus(); return true; }
  return false;
}
document.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || isSheetOpen()) return;
  if (e.target.closest("input, textarea, select, video")) return;
  if (!theater.hidden || !lb.hidden) return;
  const k = e.key;
  const i = ORDER.indexOf(current);
  if (k === "q" || k === "Q" || k === "[") { go(ORDER[(i - 1 + ORDER.length) % ORDER.length]); e.preventDefault(); }
  else if (k === "e" || k === "E" || k === "]") { go(ORDER[(i + 1) % ORDER.length]); e.preventDefault(); }
  else if (k === "Escape" && current !== "home") { go("home"); }
  else if (k.startsWith("Arrow")) {
    // On scrolling screens, arrows keep scrolling unless a tile already has focus
    const onTile = document.activeElement?.matches?.("[data-nav]");
    const tileScreen = ["home", "services", "contact"].includes(current);
    if ((onTile || tileScreen) && spatial(k)) e.preventDefault();
  }
});

// ---------------- Background reels ----------------
const bgv = $(".bg-video");
let reelIdx = 0;
function playBg(i) {
  reelIdx = (i + REELS.length) % REELS.length;
  const r = REELS[reelIdx];
  bgv.loop = REELS.length === 1;
  bgv.src = r.src;
  bgv.play().catch(() => bgv.classList.add("is-on"));
}
bgv.addEventListener("playing", () => bgv.classList.add("is-on"));
bgv.addEventListener("ended", () => playBg(reelIdx + 1));
if (reduced) bgv.classList.add("is-on");
else playBg(0);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) bgv.pause();
  else if (!reduced && theater.hidden) bgv.play().catch(() => {});
});

// ---------------- Theater ----------------
const theater = $(".theater");
const tv = $(".theater-video");
const tlist = $(".theater-list");
function openTheater(i = 0) {
  theater.hidden = false;
  bgv.pause();
  tlist.innerHTML = REELS.length > 1 ? REELS.map((r, n) => `<button type="button" data-reel="${n}">${r.title}</button>`).join("") : "";
  playReel(i);
  $(".theater-close").focus();
}
function playReel(i) {
  tv.src = REELS[i].src;
  tv.poster = REELS[i].poster || "";
  tv.play().catch(() => {});
  $$("button", tlist).forEach((b) => b.classList.toggle("is-on", +b.dataset.reel === i));
}
function closeTheater() {
  tv.pause();
  theater.hidden = true;
  if (!reduced) bgv.play().catch(() => {});
}
document.addEventListener("click", (e) => { if (e.target.closest("[data-theater]")) openTheater(0); });
tlist.addEventListener("click", (e) => { const b = e.target.closest("[data-reel]"); if (b) playReel(+b.dataset.reel); });
$(".theater-close").addEventListener("click", closeTheater);
theater.addEventListener("click", (e) => { if (e.target === theater) closeTheater(); });
tv.addEventListener("ended", () => { if (REELS.length > 1) { const n = (REELS.findIndex((r) => tv.src.endsWith(r.src.replace("../", ""))) + 1) % REELS.length; playReel(n); } });

// ---------------- Gallery ----------------
const PAGE = 24;
const gItems = $$(".gallery .g");
let shown = PAGE;
let filter = "all";
const moreWrap = document.createElement("div");
moreWrap.className = "gallery-more";
moreWrap.innerHTML = `<button class="btn btn-line" type="button">Show more projects</button>`;
$(".gallery").after(moreWrap);
function renderGallery() {
  const match = gItems.filter((g) => filter === "all" || g.dataset.cat === filter);
  gItems.forEach((g) => { g.classList.add("is-out"); g.classList.remove("is-more"); });
  match.forEach((g, i) => { g.classList.remove("is-out"); if (i >= shown) g.classList.add("is-more"); });
  moreWrap.hidden = match.length <= shown;
}
$$(".chip[data-filter]").forEach((c) => c.addEventListener("click", () => {
  $$(".chip[data-filter]").forEach((x) => x.classList.toggle("is-on", x === c));
  filter = c.dataset.filter;
  shown = PAGE;
  renderGallery();
}));
moreWrap.querySelector("button").addEventListener("click", () => { shown += PAGE; renderGallery(); });
renderGallery();

// ---------------- Lightbox ----------------
const lb = $(".lightbox");
const lbImg = $("img", lb);
const lbCap = $("figcaption", lb);
let lbList = [], lbIdx = 0, lbReturn = null;
function lbShow(i) {
  lbIdx = (i + lbList.length) % lbList.length;
  const g = lbList[lbIdx];
  lbImg.src = g.dataset.full;
  lbImg.alt = g.querySelector("img").alt;
  lbCap.textContent = `${lbIdx + 1} / ${lbList.length}`;
}
$(".gallery").addEventListener("click", (e) => {
  const g = e.target.closest(".g");
  if (!g) return;
  lbReturn = g;
  lbList = gItems.filter((x) => !x.classList.contains("is-out"));
  lb.hidden = false;
  lbShow(lbList.indexOf(g));
  $(".lb-close").focus();
});
const lbClose = () => { lb.hidden = true; lbImg.removeAttribute("src"); lbReturn?.focus(); };
$(".lb-close").addEventListener("click", lbClose);
$(".lb-prev").addEventListener("click", () => lbShow(lbIdx - 1));
$(".lb-next").addEventListener("click", () => lbShow(lbIdx + 1));
lb.addEventListener("click", (e) => { if (e.target === lb) lbClose(); });
let touchX = null;
lb.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
lb.addEventListener("touchend", (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) lbShow(lbIdx + (dx < 0 ? 1 : -1));
  touchX = null;
});
document.addEventListener("keydown", (e) => {
  if (!lb.hidden) {
    if (e.key === "Escape") lbClose();
    else if (e.key === "ArrowLeft") lbShow(lbIdx - 1);
    else if (e.key === "ArrowRight") lbShow(lbIdx + 1);
  } else if (!theater.hidden && e.key === "Escape") closeTheater();
});

// ---------------- Arriving from a garage: finish the wipe ----------------
try {
  const label = sessionStorage.getItem("cd-wipe");
  if (label) {
    sessionStorage.removeItem("cd-wipe");
    if (!reduced) { const w = makeWipe(label === "1" ? "" : "Menu", ""); w.classList.add("wipe-cover"); setTimeout(() => wipeOut(w), 60); }
  }
} catch {}
