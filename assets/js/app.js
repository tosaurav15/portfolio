/* ==========================================================================
   Motion layer: Lenis (smooth scroll) + GSAP ScrollTrigger + SplitText,
   driving the Three.js scene and the HTML around it.
   Libraries are loaded before this module (see index.html).
   ========================================================================== */
const root = document.documentElement;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const small = matchMedia("(max-width: 860px)").matches;
const { gsap, ScrollTrigger, SplitText, Lenis } = window;

/* show any runtime error on screen while this is a preview */
const showErr = (m) => { let d = document.getElementById("err"); if (!d) { d = document.createElement("pre"); d.id = "err"; document.body.appendChild(d); } d.textContent += m + "\n"; };
addEventListener("error", (e) => showErr("Error: " + e.message));
addEventListener("unhandledrejection", (e) => showErr("Promise: " + (e.reason?.message || e.reason)));

if (!gsap || !ScrollTrigger) showErr("GSAP did not load");
gsap.registerPlugin(ScrollTrigger, SplitText);
/* phones: the address bar showing or hiding must not recalculate every scroll animation */
ScrollTrigger.config({ ignoreMobileResize: true });
/* turning the phone across the 860px breakpoint reloads into the right layout */
matchMedia("(max-width: 860px)").addEventListener("change", () => location.reload());

/* ---------- smooth scroll, tied to ScrollTrigger ---------- */
let lenis = null;
if (!reduce && Lenis) {
  lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href"); if (id.length < 2) return; const el = document.querySelector(id); if (!el) return;
    e.preventDefault(); lenis.scrollTo(el, { offset: -8, duration: 1.4 }); el.setAttribute("tabindex", "-1"); el.focus({ preventScroll: true });
  }));
}

/* ---------- one 3D world behind the page ---------- */
const canvas = document.getElementById("world");
const CASES = [
  { kind: "explain", screens: ["d-chi-dashboard.jpg", "d-chi-journey.jpg"],
    notes: [["The rule", "No score without its reason."], ["The decision", "AI explains. A person decides."], ["The wait", "Waiting is a designed state."]],
    anchors: [[1.95, 2.3, 0.9], [2.1, 1.48, 1.45], [1.9, 0.68, 2.0]], spots: [[0.9, 2.05], [-0.4, 1.25], [0.5, 0.55]] },
  { kind: "stack", layers: ["timesheet", "approvals", "billing", "projects", "health", "admin", "profile", "geo"].map((k) => [`r-${k}-l.jpg`, `r-${k}-d.jpg`]) },
  { kind: "roles", web: ["h-web-clubs.jpg", "h-web-onboard.jpg", "h-web-milestone.jpg", "h-web-clubs-dark.jpg"],
    phones: ["h-member.jpg", "h-owner.jpg", "h-event.jpg", "h-moderator.jpg", "h-admin.jpg"], roles: ["Member", "Club Owner", "Event Manager", "Moderator", "Admin"] },
  { kind: "board", screens: ["d-viatris-home-calendar.jpg", "d-viatris-event-detail.jpg", "d-viatris-add-booth.jpg", "d-viatris-approver-remarks.jpg", "d-viatris-report-date.jpg", "d-viatris-admin-users.jpg"] },
];
const caseEls = [...document.querySelectorAll(".chapters .case")];
const sel = document.querySelector(".piece-sel"), selState = sel?.querySelector("[data-v=state]"), selDim = sel?.querySelector("[data-v=dim]");
const dsel = document.querySelector(".dev-sel"), dFrame = dsel?.querySelector("[data-v=frame]"), dState = dsel?.querySelector("[data-v=state]"), dDim = dsel?.querySelector("[data-v=dim]");
const sb = document.querySelector(".statusbar");
const heroTag = document.querySelector(".redline .rl-tag .v"), heroRL = document.querySelector(".redline");
let scene = null;
let no3d = false; try { no3d = sessionStorage.getItem("no3d") === "1"; } catch (_) {}
const hasGL = !no3d && (() => { try { return !!document.createElement("canvas").getContext("webgl2"); } catch (_) { return false; } })();
/* if the phone reclaims the GPU, reload once into the full non-3D layout instead of a blank area */
canvas?.addEventListener("webglcontextlost", (e) => { e.preventDefault(); try { sessionStorage.setItem("no3d", "1"); } catch (_) {} location.reload(); }, { once: true });
if (canvas && hasGL) {
  try {
    const { createWorld } = await import("./world.js");
    scene = createWorld(canvas, { reduce, small, cases: CASES });
    root.classList.add("has-3d");
    const setDocked = (d) => {
      const s = d ? "designed" : "undefined";
      if (selState) selState.textContent = s; if (heroTag) heroTag.textContent = s;
      heroRL && (heroRL.dataset.state = d ? "designed" : "undefined");
      if (sb) { sb.dataset.state = s; const st = sb.querySelector("[data-i=state]"), ct = sb.querySelector("[data-i=count]"); if (st) st.textContent = s; if (ct) ct.textContent = d ? "35 of 35" : "34 of 35"; }
      sel && (sel.dataset.state = s);
    };
    setDocked(false);
    scene.on("dock", setDocked);
    const lastIdx = caseEls.map(() => -1);
    const headEl = document.querySelector(".site-head, header");
    scene.on("frame", ({ piece: [x0, y0, x1, y1], pieceVis, devices }) => {
      if (sel) {
        const pad = 8;
        sel.style.transform = `translate3d(${x0 - pad}px,${y0 - pad}px,0)`;
        sel.style.width = (x1 - x0 + pad * 2) + "px"; sel.style.height = (y1 - y0 + pad * 2) + "px";
        sel.style.opacity = Math.max(0, pieceVis).toFixed(3);
        selDim && (selDim.textContent = `${Math.round(x1 - x0)} × ${Math.round(y1 - y0)}`);
      }
      let best = null, bi = -1;
      devices.forEach((d, i) => { if (d && (!best || d.vis > best.vis)) { best = d; bi = i; } });
      if (dsel) {
        if (best && best.vis > 0.05) {
          const [a0, b0, a1, b1] = best.rect, pad = 6;
          dsel.style.transform = `translate3d(${a0 - pad}px,${b0 - pad}px,0)`;
          dsel.style.width = (a1 - a0 + pad * 2) + "px"; dsel.style.height = (b1 - b0 + pad * 2) + "px";
          const hb = (headEl?.getBoundingClientRect().bottom || 0) + 12;
          /* phones: the tag never sits on the card, and its label stays on screen */
          let cardFade = 1;
          if (small) {
            const ct = caseEls[bi].querySelector(".case-text")?.getBoundingClientRect();
            if (ct && ct.top < innerHeight && ct.bottom > 0) cardFade = Math.max(0, Math.min(1, (ct.top - b1 - 18) / 30));
            const tag = dsel.querySelector(".ds-tag"); if (tag) { const over = (a0 - pad) + tag.offsetWidth - (innerWidth - 8); tag.style.transform = over > 0 ? `translateX(${-over}px)` : ""; }
          }
          dsel.style.opacity = (cardFade * Math.min(1, best.vis * 1.4) * Math.max(0, Math.min(1, (b0 - 28 - hb) / 40))).toFixed(3);
          const caps = caseEls[bi].querySelectorAll(".screens li");
          if (dFrame) dFrame.textContent = `Frame ${String(bi + 1).padStart(2, "0")}`;
          if (dState) dState.textContent = caps[best.idx]?.textContent || "";
          if (dDim) dDim.textContent = `${Math.round(a1 - a0)} × ${Math.round(b1 - b0)}`;
        } else dsel.style.opacity = "0";
      }
      devices.forEach((d, i) => {
        if (!d || d.idx === lastIdx[i]) return; lastIdx[i] = d.idx;
        caseEls[i].querySelectorAll(".screens li").forEach((li, j) => li.classList.toggle("on", j === d.idx));
      });
    });
    const syncTheme = () => scene.setTheme(root.dataset.theme !== "light");
    syncTheme(); new MutationObserver(syncTheme).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  } catch (e) { showErr("World: " + e.message); }
}

/* ---------- scroll drives the world ---------- */
const heroCopy = document.querySelector(".hero-copy");
if (scene) {
  const heroST = ScrollTrigger.create({
    trigger: ".hero", start: "top top", end: reduce ? "+=1" : (small ? "+=140%" : "+=190%"),
    pin: ".hero-pin", pinSpacing: true,
  });
  /* phones: measure the band between the header and the docked case card; the 3D fills it */
  if (small && scene.setZone) {
    const cards = [...document.querySelectorAll(".case-text")];
    const measureZone = () => {
      const hb = document.querySelector(".site-head")?.getBoundingClientRect().bottom || 64;
      const cardH = Math.max(...cards.map((t) => t.offsetHeight), 0);
      cards.forEach((t) => t.style.setProperty("--dock", Math.round(innerHeight - t.offsetHeight - 16) + "px"));
      scene.setZone(hb + 10, innerHeight - cardH - 16 - 14);
    };
    measureZone(); document.fonts?.ready.then(measureZone);
    let zw = innerWidth; addEventListener("resize", () => { if (innerWidth !== zw) { zw = innerWidth; measureZone(); } });
  }
  /* the wall hands over to the first device as Work arrives */
  const workST = ScrollTrigger.create({ trigger: "#work", start: "top bottom", end: "top 30%" });
  const tick = () => {
    const vh = innerHeight;
    scene.setHero(workST.progress > 0 ? 0.86 + workST.progress * 0.14 : heroST.progress * 0.86);
    caseEls.forEach((el, i) => { const r = el.getBoundingClientRect(); scene.setCase(i, (vh * 0.35 - r.top) / Math.max(1, r.height - vh * 0.7)); });
  };
  gsap.ticker.add(tick);
  if (!reduce) {
    gsap.to(".scroll-cue", { autoAlpha: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "+=12%", scrub: true } });
    gsap.to(heroCopy, { yPercent: -8, autoAlpha: 0, ease: "power1.in", scrollTrigger: { trigger: "#work", start: "top 95%", end: "top 45%", scrub: true } });
  }
}

/* ---------- pause control (WCAG 2.2.2) ---------- */
const pauseBtns = [...document.querySelectorAll(".motion-btn")];
const setPaused = (v, save = true) => {
  root.classList.toggle("motion-paused", v); scene?.setPaused(v);
  pauseBtns.forEach((b) => { b.setAttribute("aria-pressed", String(v)); b.setAttribute("aria-label", v ? "Play motion" : "Pause motion"); const s = b.querySelector("span"); if (s) s.textContent = v ? "Play motion" : "Pause motion"; });
  if (save) try { localStorage.setItem("motion", v ? "off" : "on"); } catch (_) {}
};
pauseBtns.forEach((b) => b.addEventListener("click", () => setPaused(!root.classList.contains("motion-paused"))));
try { if (localStorage.getItem("motion") === "off") setPaused(true, false); } catch (_) {}
if (reduce) setPaused(true, false);

/* ---------- type and image motion ---------- */
if (!reduce) {
  document.fonts.ready.then(() => {
    /* hero headline: lines rise out of a mask, once */
    const h1 = document.querySelector(".display");
    if (h1 && SplitText) {
      const split = SplitText.create(h1, { type: "lines", mask: "lines", linesClass: "ln", aria: "auto" });
      gsap.from(split.lines, { yPercent: 110, duration: 1.15, ease: "expo.out", stagger: 0.09, delay: 0.15 });
      gsap.from([".hero-meta", ".lede", ".actions", ".statusbar"], { autoAlpha: 0, y: 18, duration: 1, ease: "expo.out", stagger: 0.08, delay: 0.55 });
    }
    /* section headings */
    document.querySelectorAll(".sec-head h2, .contact h2, .about .quote").forEach((el) => {
      const s = SplitText.create(el, { type: "lines", mask: "lines", aria: "auto" });
      gsap.from(s.lines, { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: el, start: "top 85%" } });
    });
    /* case chapters: text arrives as each device rises */
    document.querySelectorAll(".case-text").forEach((t) => {
      gsap.from(t.children, { autoAlpha: 0, y: 26, duration: 1, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: t.parentElement, start: "top 70%" } });
    });
    /* method: the line draws, the states arrive in order, the missing one last */
    const states = document.querySelector(".states");
    if (states) {
      const tl = gsap.timeline({ scrollTrigger: { trigger: states, start: "top 75%" } });
      tl.fromTo(states, { "--line": 0 }, { "--line": 1, duration: 1.2, ease: "power2.inOut" })
        .from(states.querySelectorAll(".state:not(.missing)"), { autoAlpha: 0, y: 16, duration: 0.7, ease: "expo.out", stagger: 0.12 }, 0.2)
        .from(states.querySelector(".state.missing"), { autoAlpha: 0, scale: 0.9, duration: 0.8, ease: "back.out(2)" }, ">-0.1");
    }
    ScrollTrigger.refresh();
  });
}
