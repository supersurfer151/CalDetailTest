(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Smooth scroll (Lenis, same library as the reference site) ----------
  let lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({ lerp: 0.09 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  // ---------- Anchor links ----------
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      closeMenu();
      lenis ? lenis.scrollTo(target, { offset: 0 }) : target.scrollIntoView({ behavior: "smooth" });
    });
  });

  // ---------- Menu ----------
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("menu");
  function closeMenu() {
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-hidden", "true");
    lenis && lenis.start();
  }
  toggle.addEventListener("click", () => {
    const open = !document.body.classList.contains("menu-open");
    if (!open) return closeMenu();
    document.body.classList.add("menu-open");
    toggle.setAttribute("aria-expanded", "true");
    menu.setAttribute("aria-hidden", "false");
    lenis && lenis.stop();
  });
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeMenu());

  // ---------- Header: transparent over hero, solid after, hides on scroll down ----------
  const header = document.getElementById("header");
  const hero = document.querySelector(".hero");
  let lastY = 0;
  function onScrollHeader() {
    const y = window.scrollY;
    const pastHero = y > hero.offsetHeight - header.offsetHeight;
    header.classList.toggle("is-solid", pastHero);
    header.classList.toggle("is-hidden", pastHero && y > lastY + 2);
    if (y < lastY - 2) header.classList.remove("is-hidden");
    lastY = y;
  }

  // ---------- Parallax ----------
  const parallaxEls = [...document.querySelectorAll("[data-parallax]")];
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

  const onScroll = () => { onScrollHeader(); onScrollParallax(); };
  lenis ? lenis.on("scroll", onScroll) : window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  // ---------- Reveal on scroll ----------
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // ---------- Hero video: hold on the poster frame for reduced-motion users ----------
  const heroVideo = document.querySelector(".hero-video");
  if (reduceMotion) { heroVideo.removeAttribute("autoplay"); heroVideo.pause(); }

  // ---------- Reel video: only show play button if a video file exists ----------
  const reel = document.querySelector(".reel");
  const video = reel.querySelector("video");
  const playBtn = reel.querySelector(".play-btn");
  fetch(video.querySelector("source").src, { method: "HEAD" })
    .then((r) => { if (r.ok) playBtn.hidden = false; })
    .catch(() => {});
  playBtn.addEventListener("click", () => {
    video.controls = true;
    video.play();
    reel.classList.add("is-playing");
  });

  // ---------- Packages carousel ----------
  const slides = [...document.querySelectorAll(".slide")];
  const bar = document.querySelector(".progress .bar");
  let index = 0;
  let timer;
  function show(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, n) => s.classList.toggle("is-active", n === index));
    bar.style.width = `${100 / slides.length}%`;
    bar.style.transform = `translateX(${index * 100}%)`;
    clearInterval(timer);
    timer = setInterval(() => show(index + 1), 5000);
  }
  document.querySelector(".car-nav.prev").addEventListener("click", () => show(index - 1));
  document.querySelector(".car-nav.next").addEventListener("click", () => show(index + 1));
  show(0);

  document.getElementById("year").textContent = new Date().getFullYear();
})();
