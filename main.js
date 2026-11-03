(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EMAIL = "callahandetail@gmail.com";

  // ---------- Smooth scroll (Lenis) ----------
  let lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({ lerp: 0.1 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const header = $("#header");
  const chapterNav = $(".chapter-nav");

  function scrollToEl(target) {
    // leave room for the fixed header, plus the sticky chapter bar inside the services chapters
    const inChapters = target.closest(".chapters") && target !== $(".chapters");
    const offset = -(header.offsetHeight + (inChapters ? chapterNav.offsetHeight : 0));
    lenis ? lenis.scrollTo(target, { offset }) : window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY + offset, behavior: "smooth" });
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    const target = id === "#top" ? document.body : $(id);
    if (!target) return;
    e.preventDefault();
    closeMenu(); closeMega();
    if (a.dataset.quote) preselectService(a.dataset.quote);
    id === "#top" ? (lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: "smooth" })) : scrollToEl(target);
  });

  // ---------- Mobile menu ----------
  const toggle = $(".menu-toggle");
  const menu = $("#menu");
  function closeMenu() {
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-hidden", "true");
    lenis && lenis.start();
  }
  toggle.addEventListener("click", () => {
    if (document.body.classList.contains("menu-open")) return closeMenu();
    document.body.classList.add("menu-open");
    toggle.setAttribute("aria-expanded", "true");
    menu.setAttribute("aria-hidden", "false");
    lenis && lenis.stop();
  });

  // ---------- Services mega menu ----------
  const mega = $(".has-mega");
  const megaBtn = $(".mega-toggle");
  let megaTimer;
  function openMega() { clearTimeout(megaTimer); mega.classList.add("is-open"); megaBtn.setAttribute("aria-expanded", "true"); header.classList.add("is-solid"); }
  function closeMega() { mega.classList.remove("is-open"); megaBtn.setAttribute("aria-expanded", "false"); onScrollHeader(); }
  megaBtn.addEventListener("click", () => (mega.classList.contains("is-open") ? closeMega() : openMega()));
  if (window.matchMedia("(hover: hover)").matches) {
    mega.addEventListener("mouseenter", openMega);
    mega.addEventListener("mouseleave", () => (megaTimer = setTimeout(closeMega, 180)));
  }
  document.addEventListener("click", (e) => { if (!mega.contains(e.target)) closeMega(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeMenu(); closeMega(); closeLightbox(); } });

  // ---------- Header: transparent over the hero, solid afterwards ----------
  const hero = $(".hero");
  function onScrollHeader() {
    if (mega.classList.contains("is-open")) return;
    header.classList.toggle("is-solid", window.scrollY > hero.offsetHeight - header.offsetHeight - 10);
  }

  // ---------- Parallax ----------
  const parallaxEls = $$("[data-parallax]");
  function onScrollParallax() {
    if (reduceMotion) return;
    const vh = window.innerHeight;
    for (const el of parallaxEls) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      const center = r.top + r.height / 2 - vh / 2;
      el.style.transform = `translate3d(0, ${(-center * parseFloat(el.dataset.parallax)).toFixed(1)}px, 0)`;
    }
  }

  // ---------- Chapter bar: highlight the service in view ----------
  const chLinks = $$(".chapter-nav a");
  const chBar = $(".chapter-nav-inner");
  const chapters = $$("[data-chapter]");
  function onScrollChapters() {
    const line = header.offsetHeight + chapterNav.offsetHeight + window.innerHeight * 0.25;
    let current = null;
    for (const c of chapters) if (c.getBoundingClientRect().top <= line) current = c.id;
    chLinks.forEach((a) => {
      const on = a.dataset.ch === current;
      // keep the active tab visible on narrow screens; only scroll the bar sideways, never the page
      if (on && !a.classList.contains("is-active")) chBar.scrollTo({ left: a.offsetLeft - (chBar.clientWidth - a.offsetWidth) / 2, behavior: "smooth" });
      a.classList.toggle("is-active", on);
    });
  }

  const onScroll = () => { onScrollHeader(); onScrollParallax(); onScrollChapters(); };
  lenis ? lenis.on("scroll", onScroll) : window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  // ---------- Reveal + count-up on scroll ----------
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("is-visible");
      io.unobserve(en.target);
    });
  }, { threshold: 0.12 });
  $$(".reveal").forEach((el) => io.observe(el));

  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      countIO.unobserve(en.target);
      const el = en.target, end = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0);
      if (reduceMotion) return;
      const t0 = performance.now(), dur = 1400;
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur), eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (end * eased).toFixed(dec);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach((el) => countIO.observe(el));

  // ---------- Videos ----------
  const heroVideo = $(".hero-video");
  if (reduceMotion) { heroVideo.removeAttribute("autoplay"); heroVideo.pause(); }
  const reel = $(".reel");
  const reelVideo = reel.querySelector("video");
  const playBtn = reel.querySelector(".play-btn");
  const reelSrc = reelVideo.querySelector("source");
  if (reelSrc) fetch(reelSrc.src, { method: "HEAD" }).then((r) => { if (r.ok) playBtn.hidden = false; }).catch(() => {});
  playBtn.addEventListener("click", () => { reelVideo.controls = true; reelVideo.play(); reel.classList.add("is-playing"); });

  // ---------- Chapter photo thumbnails ----------
  $$(".ch-media").forEach((media) => {
    const main = $(".ch-main img", media);
    $$(".ch-thumb", media).forEach((btn) => btn.addEventListener("click", () => {
      if (btn.classList.contains("is-active")) return;
      $$(".ch-thumb", media).forEach((b) => b.classList.toggle("is-active", b === btn));
      main.classList.add("is-swapping");
      const next = new Image();
      next.onload = () => { main.src = next.src; main.alt = $("img", btn).alt; main.classList.remove("is-swapping"); };
      next.src = btn.dataset.full;
    }));
  });

  // ---------- Shrink-wrap estimator (published pricing: $25/ft under 30 ft, $30/ft over 30 ft or with tower/flybridge) ----------
  const calc = $(".wrap-calc");
  if (calc) {
    const len = $("input[type=number]", calc), tower = $("input[type=checkbox]", calc), out = $(".wrap-calc-out", calc);
    const update = () => {
      const ft = parseFloat(len.value);
      if (!(ft > 0)) { out.textContent = "Enter your boat's length for an estimate."; return; }
      const rate = ft >= 30 || tower.checked ? 30 : 25;
      out.innerHTML = `<strong>$${Math.round(ft * rate).toLocaleString()}</strong> estimated · ${ft} ft × $${rate}/ft. Add-ons like access doors are quoted separately.`;
    };
    len.addEventListener("input", update); tower.addEventListener("change", update);
  }

  // ---------- Quote form ----------
  const form = $("#quote");
  function preselectService(id) {
    const box = $(`input[data-svc="${id}"]`, form);
    if (box) box.checked = true;
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = form.elements;
    const services = $$("input[name=svc]:checked", form).map((c) => c.value);
    const lines = ["Hi Callahan Detail,", "", "I'd like a quote.", ""];
    if (services.length) lines.push("Services:", ...services.map((s) => `- ${s}`), "");
    if (f.vehicle.value) lines.push(`Vehicle / boat: ${f.vehicle.value}`);
    if (f.message.value) lines.push("", f.message.value);
    lines.push("", "Thanks,", f.custname.value || "");
    if (f.phone.value) lines.push(f.phone.value);
    const subject = `Quote request${services.length ? " – " + services.join(", ") : ""}`;
    location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  });

  // ---------- Gallery: filter, show more, lightbox ----------
  const items = $$(".g-item");
  const moreWrap = $(".gallery-more");
  const PAGE = 16;
  let filter = "all", shown = PAGE;
  const matches = () => items.filter((it) => filter === "all" || it.dataset.cat === filter);
  function renderGallery() {
    const list = matches();
    items.forEach((it) => (it.hidden = true));
    list.slice(0, shown).forEach((it) => (it.hidden = false));
    moreWrap.hidden = shown >= list.length;
  }
  $$(".filter").forEach((b) => b.addEventListener("click", () => {
    $$(".filter").forEach((x) => x.classList.toggle("is-active", x === b));
    filter = b.dataset.filter; shown = PAGE; renderGallery();
  }));
  $("button", moreWrap).addEventListener("click", () => { shown += PAGE; renderGallery(); });
  renderGallery();

  const lb = $("#lightbox"), lbImg = $("img", lb), lbCap = $("figcaption", lb);
  let lbList = [], lbIndex = 0;
  function showLb(i) {
    lbIndex = (i + lbList.length) % lbList.length;
    const it = lbList[lbIndex], img = $("img", it);
    lbImg.src = it.dataset.full; lbImg.alt = img.alt;
    lbCap.textContent = `${img.alt} · ${lbIndex + 1} / ${lbList.length}`;
  }
  function closeLightbox() { if (lb.hidden) return; lb.hidden = true; lenis && lenis.start(); }
  items.forEach((it) => it.addEventListener("click", () => {
    lbList = items.filter((x) => !x.hidden);
    lb.hidden = false; lenis && lenis.stop();
    showLb(lbList.indexOf(it));
  }));
  $(".lb-prev", lb).addEventListener("click", () => showLb(lbIndex - 1));
  $(".lb-next", lb).addEventListener("click", () => showLb(lbIndex + 1));
  $(".lb-close", lb).addEventListener("click", closeLightbox);
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "ArrowLeft") showLb(lbIndex - 1);
    if (e.key === "ArrowRight") showLb(lbIndex + 1);
  });

  // ---------- Reviews slider ----------
  const track = $(".review-track");
  const step = () => track.clientWidth * 0.9;
  $(".rv-btn.prev").addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
  $(".rv-btn.next").addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));

  // ---------- Instagram: live Behold.so feed when a feed ID is configured, otherwise keep the photo grid ----------
  const ig = $(".ig-feed");
  const feedId = ig.dataset.beholdFeed;
  if (feedId) {
    const s = document.createElement("script");
    s.type = "module"; s.src = "https://w.behold.so/widget.js";
    document.head.appendChild(s);
    ig.innerHTML = `<behold-widget feed-id="${feedId}"></behold-widget>`;
  }

  $("#year").textContent = new Date().getFullYear();
})();
