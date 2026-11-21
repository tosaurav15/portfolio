/* ==========================================================
   SAURABH KUMAR · Portfolio v5 — main.js
   Motion & FX implementation:
     → God Rays WebGL (Three.js, teal #3DFFC0 + blue #57B8FF)
     → Lenis smooth scroll + GSAP ScrollTrigger proxy
     → GSAP SplitText hero name reveal
     → Cinematic preloader
     → Mouse-reactive light source
     → Enhanced page transitions
   Three.js r128 · GSAP 3.12 · Lenis 1.x
   ========================================================== */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  const THREE  = window.THREE   || null;
  const gsap   = window.gsap    || null;
  const ST     = window.ScrollTrigger || null;
  const Split  = window.SplitText    || null;

  if (gsap && ST) gsap.registerPlugin(ST);

  const PAGE    = document.body.dataset.page || 'index';
  const IS_IDX  = PAGE === 'index';
  const IS_CS   = PAGE === 'case-study';
  const ACCENT  = parseInt((document.body.dataset.accent || '#FFFFFF').replace('#',''), 16);
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IS_MOB  = window.innerWidth < 768;
  const HAS_GL  = !!window.WebGLRenderingContext;
  const FINE_PTR = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Motion: paused by the system setting, or by the visitor with the nav toggle (remembered) */
  let MOTION_PAUSED = REDUCED;
  try { const v = localStorage.getItem('sk-motion'); if (v === 'paused') MOTION_PAUSED = true; if (v === 'on') MOTION_PAUSED = false; } catch (e) {}
  function applyMotion() {
    document.documentElement.classList.toggle('motion-paused', MOTION_PAUSED);
    document.querySelectorAll('[data-motion-toggle]').forEach(b => {
      b.setAttribute('aria-pressed', MOTION_PAUSED ? 'true' : 'false');
      const label = MOTION_PAUSED ? 'Play motion' : 'Pause motion';
      b.setAttribute('aria-label', label); b.setAttribute('title', label);
    });
  }
  function initMotionToggle() {
    applyMotion();
    document.querySelectorAll('[data-motion-toggle]').forEach(b => {
      b.addEventListener('click', () => {
        MOTION_PAUSED = !MOTION_PAUSED;
        try { localStorage.setItem('sk-motion', MOTION_PAUSED ? 'paused' : 'on'); } catch (e) {}
        applyMotion();
      });
    });
  }

  const MOUSE = { x: 0, y: 0, nx: 0, ny: 0 };
  window.addEventListener('mousemove', e => {
    MOUSE.x  = e.clientX; MOUSE.y  = e.clientY;
    MOUSE.nx = (e.clientX / window.innerWidth)  * 2 - 1;
    MOUSE.ny = (e.clientY / window.innerHeight) * 2 - 1;
  });

  function lerp(a, b, t) { return a + (b - a) * t; }

  /* shared RAF */
  const _loops = [];
  let _raf = null, _ts = 0;
  function _tick(t) {
    _raf = requestAnimationFrame(_tick);
    const dt = Math.min((t - _ts) / 1000, 0.05); _ts = t;
    if (MOTION_PAUSED) return;
    for (let i = 0; i < _loops.length; i++) _loops[i](dt, t);
  }
  function startLoop() { if (!_raf) _raf = requestAnimationFrame(_tick); }

  /* ── INIT ─────────────────────────────────────────────── */
  function init() {
    initMotionToggle();
    initPreloader();
    if (!REDUCED) initLenis();
    initCursor();
    initNav();
    initProgress();
    initReveal();
    initLabelRotator();
    initFooterReel();
    initAnchors();
    initPageTransition();
    initMagnetic();
    initScramble();

    if (!REDUCED && HAS_GL && THREE && gsap) {
      initGodRays();
      if (!IS_MOB) {
        initParticles();
        if (IS_IDX) initHeroGL();
        if (IS_CS)  initCsGL();
        if (IS_IDX) initCardTilt();
      }
    }

    if (IS_IDX && !REDUCED) initSplitText();
  }

  /* ── PRELOADER ─────────────────────────────────────────── */
  function initPreloader() {
    const loader = document.getElementById('preloader');
    if (!loader) return;
    if (REDUCED) { loader.style.display = 'none'; return; }

    const letters = loader.querySelectorAll('.pl-letter');
    const bar     = loader.querySelector('.pl-bar-fill');
    const label   = loader.querySelector('.pl-label');

    if (gsap && letters.length) {
      gsap.fromTo(letters,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.12, ease: 'power3.out', delay: 0.1 }
      );
      if (bar) gsap.to(bar, { scaleX: 1, duration: 1.1, ease: 'power2.inOut', delay: 0.2, transformOrigin: 'left' });
      if (label) gsap.to(label, { opacity: 1, duration: 0.5, delay: 0.45 });
    }

    function hideLoader() {
      if (!gsap) { loader.style.display = 'none'; return; }
      gsap.to(loader, {
        yPercent: -100,
        duration: 0.8,
        ease: 'power3.inOut',
        delay: 0.3,
        onComplete: () => { loader.style.display = 'none'; }
      });
    }

    if (document.readyState === 'complete') {
      setTimeout(hideLoader, 200);
    } else {
      window.addEventListener('load', () => setTimeout(hideLoader, 200), { once: true });
      setTimeout(hideLoader, 3200); /* safety fallback */
    }
  }

  /* ── LENIS SMOOTH SCROLL ──────────────────────────────── */
  function initLenis() {
    if (typeof Lenis === 'undefined') return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    window.__lenis = lenis;

    if (gsap && ST) {
      lenis.on('scroll', ST.update);
      gsap.ticker.add(time => { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0);
    }
  }

  /* ── GOD RAYS — WebGL atmospheric volumetric light ──────
     Technique: fullscreen orthographic quad + GLSL fragment shader
     Two lights:
       Light 1 — teal #3DFFC0, mouse-driven (indicator-strong)
       Light 2 — blue #57B8FF, autonomous orbital (indicator-medium)
     Hue shifted ~120° from the reference gold #ECD06F for an original palette
  ─────────────────────────────────────────────────────────── */
  function initGodRays() {
    if (!THREE) return;
    const canvas = document.getElementById('godray-canvas');
    if (!canvas) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(1);
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);

    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const geo = new THREE.PlaneGeometry(2, 2);

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uLight1:    { value: new THREE.Vector2(0.28, 0.70) },
        uLight2:    { value: new THREE.Vector2(0.72, 0.48) },
        uAspect:    { value: W / H },
        uTime:      { value: 0.0 },
        uIntensity: { value: 0.0 },
      },
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = vec4(position.xy, 0.0, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision mediump float;',
        'uniform vec2  uLight1;',
        'uniform vec2  uLight2;',
        'uniform float uAspect;',
        'uniform float uTime;',
        'uniform float uIntensity;',
        'varying vec2  vUv;',
        '',
        'float godRay(vec2 uv, vec2 lPos, float strength) {',
        '  vec2 delta = uv - lPos;',
        '  delta.x   *= uAspect;',
        '  float dist  = length(delta);',
        '  float angle = atan(delta.y, delta.x);',
        '  float core    = exp(-dist * 4.8) * 1.4;',
        '  float spoke   = 0.5 + 0.5 * sin(angle * 9.0 + uTime * 0.18);',
        '  spoke = pow(max(0.0, spoke), 7.0);',
        '  float rays    = exp(-dist * 2.0) * spoke * 0.65;',
        '  float scatter = exp(-dist * 0.85) * 0.12;',
        '  return (core + rays + scatter) * strength;',
        '}',
        '',
        'void main() {',
        '  float r1 = godRay(vUv, uLight1, 1.00);',
        '  float r2 = godRay(vUv, uLight2, 0.58);',
        '  vec3 col  = vec3(0.239, 1.000, 0.752) * r1;',
        '  col      += vec3(0.341, 0.722, 1.000) * r2;',
        '  col      *= uIntensity;',
        '  float alpha = max(col.r, max(col.g, col.b));',
        '  gl_FragColor = vec4(col, alpha * 0.80);',
        '}'
      ].join('\n'),
      transparent: true,
      depthTest:   false,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    });

    scene.add(new THREE.Mesh(geo, mat));

    let l1x = 0.28, l1y = 0.70;
    let intensity = 0;

    window.addEventListener('resize', () => {
      const nw = window.innerWidth, nh = window.innerHeight;
      renderer.setSize(nw, nh);
      mat.uniforms.uAspect.value = nw / nh;
    });

    _loops.push((dt, t) => {
      intensity = Math.min(intensity + dt * 0.20, 0.19);

      /* Light 1 — mouse-driven with heavy cinematic damping */
      l1x += (0.5 + MOUSE.nx * 0.28 - l1x) * 0.016;
      l1y += (0.5 - MOUSE.ny * 0.22 - l1y) * 0.016;

      /* Light 2 — slow autonomous orbit */
      const l2x = 0.68 + Math.cos(t * 0.00028) * 0.14;
      const l2y = 0.44 + Math.sin(t * 0.00035) * 0.10;

      mat.uniforms.uLight1.value.set(l1x, l1y);
      mat.uniforms.uLight2.value.set(l2x, l2y);
      mat.uniforms.uTime.value      = t * 0.001;
      mat.uniforms.uIntensity.value = intensity;

      renderer.render(scene, camera);
    });

    startLoop();
  }

  /* ── SPLIT TEXT — hero name character reveal ──────────── */
  function initSplitText() {
    if (!gsap || !Split) return;
    const rows = document.querySelectorAll('.hero-name-row');
    if (!rows.length) return;

    rows.forEach((row, i) => {
      row.style.animation = 'none';
      row.style.transform = 'translateY(0)';
      row.style.opacity   = '1';

      const split = new Split(row, { type: 'chars' });

      gsap.from(split.chars, {
        y:        '115%',
        opacity:  0,
        duration: 1.05,
        ease:     'power4.out',
        stagger:  0.030,
        delay:    0.20 + i * 0.08,
      });
    });
  }

  /* ── CURSOR ───────────────────────────────────────────── */
  function initCursor() {
    const dot  = document.querySelector('.c-dot');
    const view = document.querySelector('.c-view');
    if (!dot) return;
    if (!FINE_PTR || REDUCED) return;            /* touch, pen and reduced motion keep the system cursor */
    document.documentElement.classList.add('has-custom-cursor');

    let mx = -200, my = -200, vx = -200, vy = -200;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top  = my + 'px';
    });

    (function loop() {
      vx += (mx - vx) * 0.09;
      vy += (my - vy) * 0.09;
      if (view) { view.style.left = vx + 'px'; view.style.top = vy + 'px'; }
      requestAnimationFrame(loop);
    })();

    document.querySelectorAll('.w-card').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('on-card'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('on-card'));
    });
    document.querySelectorAll('a:not(.w-card), button').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('on-link'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('on-link'));
    });
  }

  /* ── NAV ──────────────────────────────────────────────── */
  function initNav() {
    const nav = document.querySelector('.l-nav');
    function update() { if (nav) nav.classList.toggle('scrolled', window.scrollY > 48); }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ── PROGRESS ─────────────────────────────────────────── */
  function initProgress() {
    const bar = document.getElementById('scroll-bar');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const s = window.scrollY;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (s / h) * 100 : 0) + '%';
    }, { passive: true });
  }

  /* ── SCROLL REVEAL ────────────────────────────────────── */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('shown'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.07, rootMargin: '0px 0px -32px 0px' });
    els.forEach(el => obs.observe(el));
  }

  /* ── LABEL ROTATOR ────────────────────────────────────── */
  function initLabelRotator() {
    const items = document.querySelectorAll('.hero-label');
    if (!items.length) return;
    let i = 0;
    function tick() {
      if (MOTION_PAUSED && i !== 0) return;
      items.forEach((w, idx) => {
        w.classList.remove('on', 'out');
        if (idx === i) w.classList.add('on');
        else if (idx === (i - 1 + items.length) % items.length) w.classList.add('out');
      });
      i = (i + 1) % items.length;
    }
    tick(); setInterval(tick, 2100);
  }

  /* ── FOOTER REEL ──────────────────────────────────────── */
  function initFooterReel() {
    const slides = document.querySelectorAll('.footer-slide');
    if (!slides.length) return;
    let i = 0;
    function tick() {
      if (MOTION_PAUSED && i !== 0) return;
      slides.forEach((s, idx) => {
        s.classList.remove('on', 'off');
        if (idx === i) s.classList.add('on');
        else if (idx === (i - 1 + slides.length) % slides.length) s.classList.add('off');
      });
      i = (i + 1) % slides.length;
    }
    tick(); setInterval(tick, 2000);
  }

  /* ── ANCHORS ──────────────────────────────────────────── */
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', function(e) {
        const t = document.querySelector(this.getAttribute('href'));
        if (!t) return;
        e.preventDefault();
        if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
        if (REDUCED || !window.__lenis) { t.scrollIntoView({ block: 'start' }); t.focus({ preventScroll: true }); return; }
        t.focus({ preventScroll: true });
        if (window.__lenis) {
          window.__lenis.scrollTo(t, { duration: 1.4, easing: x => Math.min(1, 1.001 - Math.pow(2, -10 * x)) });
        } else {
          t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ── PAGE TRANSITION ──────────────────────────────────── */
  function initPageTransition() {
    if (!gsap) return;
    const cover = document.getElementById('page-cover');
    if (!cover) return;

    if (REDUCED) { cover.style.display = 'none'; return; }
    gsap.set(cover, { scaleY: 1, transformOrigin: 'top' });
    gsap.to(cover, { scaleY: 0, duration: 0.7, ease: 'power3.out', delay: 0.05, transformOrigin: 'top' });

    /* Back/forward cache: never come back to a covered page */
    window.addEventListener('pageshow', ev => { if (ev.persisted) gsap.set(cover, { scaleY: 0 }); });

    document.addEventListener('click', e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http') || !href.endsWith('.html')) return;
      const cur = window.location.pathname.split('/').pop() || 'index.html';
      if (href === cur) return;
      e.preventDefault();
      gsap.set(cover, { scaleY: 0, transformOrigin: 'bottom' });
      gsap.to(cover, {
        scaleY: 1, duration: 0.52, ease: 'power3.inOut', transformOrigin: 'bottom',
        onComplete: () => { window.location.href = href; }
      });
    });
  }

  /* ── MAGNETIC ─────────────────────────────────────────── */
  function initMagnetic() {
    if (!gsap || !FINE_PTR || REDUCED) return;
    document.querySelectorAll('.btn, .cs-next-ico').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width  / 2);
        const dy = e.clientY - (r.top  + r.height / 2);
        if (Math.sqrt(dx*dx + dy*dy) < 80) {
          gsap.to(el, { x: dx * 0.3, y: dy * 0.3, duration: 0.25, ease: 'power2.out' });
        }
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.45)' });
      });
    });
  }

  /* ── TEXT SCRAMBLE ────────────────────────────────────── */
  function initScramble() {
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?#';
    const seen  = new Set();
    if (REDUCED || MOTION_PAUSED) return;
    function scramble(el) {
      if (seen.has(el)) return; seen.add(el);
      const final = el.textContent.trim();
      let f = 0, TOTAL = 22;
      const iv = setInterval(() => {
        el.textContent = final.split('').map((ch, i) => {
          if (ch === ' ') return ' ';
          if (f / TOTAL > i / final.length) return ch;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join('');
        if (++f > TOTAL) { el.textContent = final; clearInterval(iv); }
      }, 48);
    }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) scramble(en.target); });
    }, { threshold: 0.3 });
    document.querySelectorAll('.works-title, .cs-title-row').forEach(el => obs.observe(el));
  }

  /* ── CARD 3D TILT ─────────────────────────────────────── */
  function initCardTilt() {
    if (!gsap) return;
    document.querySelectorAll('.w-card').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r  = el.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width  - 0.5;
        const dy = (e.clientY - r.top)  / r.height - 0.5;
        gsap.to(el, { rotateX: -dy * 3, rotateY: dx * 3, duration: 0.3, ease: 'power2.out', overwrite: 'auto', transformStyle: 'preserve-3d', perspective: 1000 });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
      });
    });
  }

  /* ── PARTICLE FIELD ───────────────────────────────────── */
  let PTCL = null;
  function initParticles() {
    if (!THREE) return;
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 10;

    const COUNT = 2200;
    const pos = new Float32Array(COUNT * 3);
    const vx = new Float32Array(COUNT), vy = new Float32Array(COUNT);
    const bvx = new Float32Array(COUNT), bvy = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      pos[i*3]   = (Math.random()-0.5)*38;
      pos[i*3+1] = (Math.random()-0.5)*22;
      pos[i*3+2] = (Math.random()-0.5)*8;
      bvx[i] = (Math.random()-0.5)*0.0012;
      bvy[i] = (Math.random()-0.5)*0.0008;
      vx[i] = bvx[i]; vy[i] = bvy[i];
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.022, transparent: true, opacity: 0.28, sizeAttenuation: true });
    scene.add(new THREE.Points(geo, mat));
    PTCL = { mat, vx, vy, bvx, bvy, COUNT };

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    _loops.push(() => {
      const a = geo.attributes.position.array;
      const cwx = MOUSE.nx * 19, cwy = -MOUSE.ny * 11;
      for (let i = 0; i < COUNT; i++) {
        const ix = i*3, iy = i*3+1;
        const dx = a[ix]-cwx, dy = a[iy]-cwy, d2 = dx*dx+dy*dy;
        if (d2 < 9) { const d = Math.sqrt(d2)+0.001; vx[i]+=(dx/d)*0.0012; vy[i]+=(dy/d)*0.0012; }
        vx[i] = vx[i]*0.978+bvx[i]*0.022;
        vy[i] = vy[i]*0.978+bvy[i]*0.022;
        a[ix]+=vx[i]; a[iy]+=vy[i];
        if(a[ix]>19)a[ix]=-19; if(a[ix]<-19)a[ix]=19;
        if(a[iy]>11)a[iy]=-11; if(a[iy]<-11)a[iy]=11;
      }
      geo.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    });

    startLoop();
  }

  /* ── HERO 3D — Icosahedron (teal-tinted) ─────────────── */
  function initHeroGL() {
    if (!THREE || !gsap) return;
    const canvas = document.getElementById('hero-canvas');
    const hero   = document.querySelector('.l-hero');
    if (!canvas || !hero) return;

    const sz = () => { const r = hero.getBoundingClientRect(); return { w: r.width || window.innerWidth, h: r.height || window.innerHeight }; };
    const s  = sz();
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(s.w, s.h);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, s.w / s.h, 0.1, 100);
    camera.position.z = 5;

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const key = new THREE.DirectionalLight(0xffffff, 1.0); key.position.set(4, 4, 5); scene.add(key);
    /* Teal point light — matches god rays, unifies the atmosphere */
    const pt = new THREE.PointLight(0x3DFFC0, 2.2, 14); scene.add(pt);

    const group = new THREE.Group(); scene.add(group);

    const geo = new THREE.IcosahedronGeometry(1.6, 1);
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xFFFFFF, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat); group.add(mesh);

    const wmat = new THREE.MeshBasicMaterial({ color: 0x3DFFC0, wireframe: true, transparent: true, opacity: 0 });
    const wire = new THREE.Mesh(geo, wmat); group.add(wire);

    gsap.to(mat,  { opacity: 0.10, duration: 1.4, ease: 'power2.out', delay: 0.5 });
    gsap.to(wmat, { opacity: 0.04, duration: 1.4, ease: 'power2.out', delay: 0.5 });

    if (ST) {
      gsap.to(group.position, {
        y: -2,
        scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 1.2 }
      });
      const ws = document.querySelector('.works');
      if (ws) gsap.to(canvas, { opacity: 0, scrollTrigger: { trigger: ws, start: 'top 82%', end: 'top 30%', scrub: 1 } });
    }

    window.addEventListener('resize', () => {
      const ns = sz();
      camera.aspect = ns.w / ns.h;
      camera.updateProjectionMatrix();
      renderer.setSize(ns.w, ns.h);
    });

    let autoY = 0, autoX = 0, sRX = 0, sRY = 0, orbitT = 0;
    let hovered = false;
    hero.addEventListener('mouseenter', () => { hovered = true;  });
    hero.addEventListener('mouseleave', () => { hovered = false; });

    _loops.push(dt => {
      orbitT += 0.4 * dt;
      pt.position.set(Math.cos(orbitT)*3, Math.sin(orbitT*0.7)*2, Math.sin(orbitT)*3);
      autoY += 0.0022; autoX += 0.0007;
      sRX = lerp(sRX, hovered ? MOUSE.ny * 0.2 : 0, 0.04);
      sRY = lerp(sRY, hovered ? MOUSE.nx * 0.2 : 0, 0.04);
      group.rotation.x = autoX + sRX;
      group.rotation.y = autoY + sRY;
      renderer.render(scene, camera);
    });

    startLoop();
  }

  /* ── CS HERO 3D — Octahedron ──────────────────────────── */
  function initCsGL() {
    if (!THREE || !gsap) return;
    const canvas = document.querySelector('.cs-canvas');
    const hero   = document.querySelector('.cs-hero');
    if (!canvas || !hero) return;

    const sz = () => { const r = hero.getBoundingClientRect(); return { w: r.width || window.innerWidth, h: r.height || window.innerHeight }; };
    const s  = sz();
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(s.w, s.h);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, s.w/s.h, 0.1, 100);
    camera.position.z = 7;

    scene.add(new THREE.AmbientLight(0xffffff, 0.2));
    const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(5,5,5); scene.add(key);
    const rim = new THREE.PointLight(ACCENT, 2.5, 20); rim.position.set(-3,3,4); scene.add(rim);

    const geo  = new THREE.OctahedronGeometry(2, 2);
    const mat  = new THREE.MeshPhysicalMaterial({ color: ACCENT, metalness:0.1, roughness:0.05, transparent:true, opacity:0, side:THREE.DoubleSide });
    const wmat = new THREE.MeshBasicMaterial({ color: ACCENT, wireframe:true, transparent:true, opacity:0 });
    const mesh = new THREE.Mesh(geo, mat);
    const wire = new THREE.Mesh(geo, wmat);
    mesh.position.x = wire.position.x = 3;
    scene.add(mesh); scene.add(wire);

    gsap.to(mat,  { opacity:0.6,  duration:1.1, ease:'power2.out', delay:0.3 });
    gsap.to(wmat, { opacity:0.06, duration:1.1, ease:'power2.out', delay:0.3 });

    window.addEventListener('resize', () => {
      const ns = sz();
      camera.aspect = ns.w/ns.h;
      camera.updateProjectionMatrix();
      renderer.setSize(ns.w,ns.h);
    });

    _loops.push(() => {
      mesh.rotation.x += 0.003; mesh.rotation.y += 0.005;
      wire.rotation.x = mesh.rotation.x; wire.rotation.y = mesh.rotation.y;
      mesh.position.x = lerp(mesh.position.x, 3 - MOUSE.nx*0.7, 0.04);
      mesh.position.y = lerp(mesh.position.y, -MOUSE.ny*0.7, 0.04);
      wire.position.x = mesh.position.x; wire.position.y = mesh.position.y;
      renderer.render(scene, camera);
    });

    startLoop();
  }

  /* ── FOOTER PARTICLE SHIFT ────────────────────────────── */
  if (IS_IDX && ST && gsap) {
    (function() {
      const footer = document.querySelector('.l-footer');
      if (!footer) return;
      let done = false;
      ST.create({
        trigger: footer, start: 'top 82%',
        onEnter: () => {
          if (done || !PTCL) return; done = true;
          gsap.to(PTCL.mat, { opacity: 0.55, duration: 1.4, ease: 'power2.inOut' });
        },
        onLeaveBack: () => {
          done = false;
          if (!PTCL) return;
          gsap.to(PTCL.mat, { opacity: 0.28, duration: 1.1, ease: 'power2.inOut' });
        }
      });
    })();
  }

  /* ── BOOT ─────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
