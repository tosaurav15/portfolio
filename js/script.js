/* ==========================================================
   SAURABH KUMAR — Portfolio JS
   ========================================================== */

(function () {
  'use strict';

  // ── Cursor ─────────────────────────────────────────────
  const dot  = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');

  let mouseX = -100, mouseY = -100;
  let ringX  = -100, ringY  = -100;

  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX; mouseY = e.clientY;
    if (dot) { dot.style.left = mouseX + 'px'; dot.style.top = mouseY + 'px'; }
  });

  // Ring follows with lerp
  (function lerpRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    if (ring) { ring.style.left = ringX + 'px'; ring.style.top = ringY + 'px'; }
    requestAnimationFrame(lerpRing);
  })();

  // Hover state on links/buttons
  function bindCursorHover() {
    const els = document.querySelectorAll('a, button, .work-item, .domain-pill, .btn, .footer__email, .cs-next');
    els.forEach(function (el) {
      el.addEventListener('mouseenter', function () { document.body.classList.add('cursor-hover'); });
      el.addEventListener('mouseleave', function () { document.body.classList.remove('cursor-hover'); });
    });
  }

  // ── Progress bar ────────────────────────────────────────
  const progressBar = document.getElementById('progress');

  function updateProgress() {
    if (!progressBar) return;
    const s = window.scrollY;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (h > 0 ? (s / h) * 100 : 0) + '%';
  }

  // ── Nav scroll state ────────────────────────────────────
  const nav = document.querySelector('.nav');

  function updateNav() {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 60);
  }

  // ── Reveal on scroll ────────────────────────────────────
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { obs.observe(el); });
  }

  // ── Hero descriptor rotator ─────────────────────────────
  function initHeroRotator() {
    const words = document.querySelectorAll('.hero__descriptor-word');
    if (!words.length) return;
    let i = 0;

    function tick() {
      words.forEach(function (w, idx) {
        w.classList.remove('is-active', 'is-prev');
        if (idx === i) w.classList.add('is-active');
        else if (idx === (i - 1 + words.length) % words.length) w.classList.add('is-prev');
      });
      i = (i + 1) % words.length;
    }

    tick();
    setInterval(tick, 2000);
  }

  // ── Footer hello rotator ────────────────────────────────
  function initHelloRotator() {
    const slides = document.querySelectorAll('.footer__hello-slide');
    if (!slides.length) return;
    let i = 0;

    function tick() {
      slides.forEach(function (s, idx) {
        s.classList.remove('is-current', 'is-prev');
        if (idx === i) s.classList.add('is-current');
        else if (idx === (i - 1 + slides.length) % slides.length) s.classList.add('is-prev');
      });
      i = (i + 1) % slides.length;
    }

    tick();
    setInterval(tick, 1800);
  }

  // ── Work item hover preview (follows cursor) ────────────
  function initWorkPreviews() {
    const items = document.querySelectorAll('.work-item');
    const previews = document.querySelectorAll('.work-item__preview');

    items.forEach(function (item, idx) {
      const preview = item.querySelector('.work-item__preview');
      if (!preview) return;

      item.addEventListener('mouseenter', function () {
        preview.style.opacity = '1';
        preview.style.transform = 'translate(-50%, -50%) scale(1) rotate(-1deg)';
      });

      item.addEventListener('mouseleave', function () {
        preview.style.opacity = '0';
        preview.style.transform = 'translate(-50%, -50%) scale(0.85) rotate(-2deg)';
      });

      item.addEventListener('mousemove', function (e) {
        const x = e.clientX;
        const y = e.clientY;
        preview.style.left  = x + 'px';
        preview.style.top   = y - 30 + 'px';
        preview.style.transform = 'translate(-50%, -60%) scale(1) rotate(-1deg)';
      });
    });
  }

  // ── Smooth anchor links ─────────────────────────────────
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        const t = document.querySelector(this.getAttribute('href'));
        if (!t) return;
        e.preventDefault();
        t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  // ── RAF scroll handler ──────────────────────────────────
  let ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        updateProgress();
        updateNav();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // ── Init ────────────────────────────────────────────────
  function init() {
    updateNav();
    initReveal();
    initHeroRotator();
    initHelloRotator();
    initWorkPreviews();
    initAnchors();
    bindCursorHover();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
