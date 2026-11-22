/* REDLINE · case study and index pages: motion and small behaviors.
   Content is complete without this file; it only adds motion. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const { gsap, ScrollTrigger, SplitText, Lenis } = window;
  let paused = false, lenis = null;
  try { paused = localStorage.getItem("motion") === "off"; } catch (_) {}
  if (reduce) paused = true;

  /* ---- pause control (WCAG 2.2.2), shared with the home page ---- */
  const pauseBtns = [...document.querySelectorAll(".motion-btn")];
  const setPaused = (v, save = true) => {
    paused = v; root.classList.toggle("motion-paused", v);
    pauseBtns.forEach((b) => { b.setAttribute("aria-pressed", String(v)); b.setAttribute("aria-label", v ? "Play motion" : "Pause motion"); });
    if (save) try { localStorage.setItem("motion", v ? "off" : "on"); } catch (_) {}
    if (v) { lenis?.stop(); document.querySelectorAll(".rv").forEach((el) => gsap?.set(el, { clearProps: "all" })); } else lenis?.start();
  };
  pauseBtns.forEach((b) => b.addEventListener("click", () => setPaused(!paused)));

  /* ---- work index filters ---- */
  const fbar = document.querySelector(".ix-filters");
  if (fbar) {
    const items = [...document.querySelectorAll(".ix-grid > li")];
    const live = document.querySelector(".ix-count");
    fbar.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      fbar.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      const f = b.dataset.f; let n = 0;
      items.forEach((li) => { const on = f === "all" || (li.dataset.tags || "").split("|").includes(f); li.hidden = !on; if (on) n++; });
      if (live) live.textContent = `${n} case ${n === 1 ? "study" : "studies"}`;
      ScrollTrigger?.refresh();
    });
  }

  /* ---- chapter rail: where you are, and how far ---- */
  const rail = document.querySelector(".cs-rail");
  if (rail) {
    const links = [...rail.querySelectorAll("a")];
    const map = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.removeAttribute("aria-current"));
      map.get(e.target.id)?.setAttribute("aria-current", "true");
    }), { rootMargin: "-35% 0px -60% 0px" });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
    const body = document.querySelector(".cs-body"), prog = rail.querySelector(".prog");
    const upd = () => { if (!body || !prog) return; const r = body.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (innerHeight * 0.4 - r.top) / r.height)); prog.style.setProperty("--p", p.toFixed(3)); };
    addEventListener("scroll", upd, { passive: true }); upd();
  }

  if (!gsap || !ScrollTrigger || reduce) return;
  gsap.registerPlugin(ScrollTrigger, SplitText);

  /* ---- smooth scroll ---- */
  if (Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href"); if (id.length < 2) return; const el = document.querySelector(id); if (!el) return;
      e.preventDefault(); lenis.scrollTo(el, { offset: -90, duration: 1.2 }); el.setAttribute("tabindex", "-1"); el.focus({ preventScroll: true });
    }));
  }
  root.classList.add("js-motion");
  if (paused) setPaused(true, false);

  document.fonts.ready.then(() => {
    /* hero: the title rises out of a mask, line by line */
    /* split only the main title line: the subtitle has its own size, so splitting it with the
       title gave its lines the title's line height (a large gap on phones). It fades up instead */
    const t = document.querySelector(".cs-title .cs-title-row") || document.querySelector(".cs-title, .ix-title, .nf .code");
    if (t && SplitText && !paused) {
      const s = SplitText.create(t, { type: "lines", mask: "lines", aria: "auto" });
      gsap.from(s.lines, { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.08, delay: 0.1 });
      const sub = document.querySelector(".cs-title .cs-title-sub");
      if (sub) gsap.from(sub, { autoAlpha: 0, y: 14, duration: 1, ease: "expo.out", delay: 0.3 });
    }
    gsap.from([".cs-eye", ".cs-stats", ".ix-lede", ".ix-filters", ".crumbs"].filter((q) => document.querySelector(q)), { autoAlpha: 0, y: 16, duration: 1, ease: "expo.out", stagger: 0.06, delay: 0.35 });

    /* the cover: unmasks, then tilts with the pointer and drifts with scroll */
    const cover = document.querySelector(".cs-cover .frame");
    if (cover) {
      gsap.fromTo(cover, { clipPath: "inset(18% 12% 18% 12% round 24px)", scale: 0.94 }, { clipPath: "inset(0% 0% 0% 0% round 20px)", scale: 1, ease: "none", scrollTrigger: { trigger: ".cs-cover", start: "top 92%", end: "top 25%", scrub: 0.6 } });
      let rx = 0, ry = 0, tx = 0, ty = 0;
      addEventListener("pointermove", (e) => { if (paused || e.pointerType !== "mouse") return; const r = cover.getBoundingClientRect(); tx = ((e.clientY - (r.top + r.height / 2)) / innerHeight) * -2.5; ty = ((e.clientX - (r.left + r.width / 2)) / innerWidth) * 3.5; }, { passive: true });
      gsap.ticker.add(() => { rx += (tx - rx) * 0.06; ry += (ty - ry) * 0.06; cover.style.transform = paused ? "" : `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`; });
    }

    /* chapters: each block arrives as it enters */
    document.querySelectorAll(".ch-eye, .ch-title, .ch-body > *, .ix-grid > li, .cs-next, .nf > *:not(.code)").forEach((el) => {
      el.classList.add("rv");
      gsap.to(el, { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });
    /* screens: the frame unmasks from the label down, like a frame being placed */
    document.querySelectorAll(".scr-frame, .ann-phone").forEach((f) => {
      gsap.fromTo(f, { clipPath: "inset(0% 0% 100% 0% round 14px)" }, { clipPath: "inset(0% 0% 0% 0% round 14px)", duration: 1.3, ease: "expo.inOut", scrollTrigger: { trigger: f, start: "top 85%", once: true } });
      const img = f.querySelector("img"); if (img) gsap.fromTo(img, { scale: 1.08 }, { scale: 1, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: f, start: "top 85%", once: true } });
    });
    /* the big numbers count their way in */
    document.querySelectorAll(".ch-num").forEach((n) => gsap.from(n, { backgroundPosition: "-200% 0", duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: n, start: "top 85%", once: true } }));
    ScrollTrigger.refresh();
  });
})();
