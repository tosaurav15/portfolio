/* ==========================================================================
   ONE WORLD · Three.js r187
   A single scene behind the whole page.
   Hero:  a wall of Saurabh's real product screens. One screen is missing.
          The missing screen (blank, hatched, "undefined") flies in on scroll
          and resolves into a designed screen.
   Work:  each case study is a real device (laptop or phone) that rises in,
          opens, turns, and steps through the product's actual screens.
   Everything shares one camera, one light rig and one material language.
   ========================================================================== */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const TEX_FULL = "assets/tex/", TEX_PHONE = "assets/tex-m/";
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const span = (a, b, x) => clamp((x - a) / (b - a));
const ease = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const easeOut = (x) => 1 - Math.pow(1 - x, 3);

/* rounded rectangle with 0..1 UVs, for screens */
function roundedPlane(w, h, r, seg = 6) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ShapeGeometry(s, seg), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - x) / w, (p.getY(i) - y) / h);
  return g;
}

/* a keyboard drawn once: key caps with gaps, for the laptop deck */
function keyboardTexture() {
  const c = document.createElement("canvas"); c.width = 1400; c.height = 500; const g = c.getContext("2d");
  g.fillStyle = "#0b0c0f"; g.fillRect(0, 0, 1400, 500);
  const rows = [[14, 1], [14, 1], [13, 1], [12, 1], [11, 1]], kh = 82, gap = 12;
  rows.forEach(([n], r) => { const kw = (1400 - gap * (n + 1)) / n; for (let i = 0; i < n; i++) { const x = gap + i * (kw + gap), y = gap + r * (kh + gap);
    const grd = g.createLinearGradient(0, y, 0, y + kh); grd.addColorStop(0, "#23252b"); grd.addColorStop(1, "#16171b");
    g.fillStyle = grd; g.beginPath(); g.roundRect(x, y, kw, kh, 10); g.fill(); } });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

/* the "undefined" screen: hatched, labeled, drawn once on a canvas */
function hatchTexture(dark) {
  const c = document.createElement("canvas"); c.width = 1024; c.height = 640;
  const g = c.getContext("2d");
  g.fillStyle = dark ? "#050b18" : "#eef3fc"; g.fillRect(0, 0, 1024, 640);
  const sg = g.createLinearGradient(0, 0, 1024, 640); sg.addColorStop(0, dark ? "#0a6ddd" : "#1251cc"); sg.addColorStop(1, dark ? "#10378d" : "#0d2769");
  g.strokeStyle = dark ? "rgba(101,167,250,.26)" : "rgba(10,70,185,.18)"; g.lineWidth = 6;
  for (let i = -700; i < 1100; i += 34) { g.beginPath(); g.moveTo(i, 640); g.lineTo(i + 640, 0); g.stroke(); }
  g.setLineDash([22, 16]); g.lineWidth = 8; g.strokeStyle = sg; g.strokeRect(24, 24, 976, 592);
  g.setLineDash([]); g.fillStyle = sg; g.fillRect(24, 24, 360, 86);
  g.fillStyle = "#ffffff"; g.font = "600 46px Inter, system-ui, sans-serif"; g.fillText("state: undefined", 44, 84);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

export function createWorld(canvas, { reduce = false, small = false, cases = [] } = {}) {
  /* phones get phone-sized textures: about a quarter of the GPU memory, still sharp at phone size */
  const TEX = small ? TEX_PHONE : TEX_FULL;
  const touch = matchMedia("(pointer: coarse)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;
  const camera = new THREE.PerspectiveCamera(small ? 38 : 30, 1, 0.1, 120);
  camera.position.set(0, 0, small ? 22 : 19);
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(-5, 7, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa9bcff, 1.3); rim.position.set(7, -3, -5); scene.add(rim);

  const loader = new THREE.TextureLoader();
  const tex = (name) => { const t = loader.load(TEX + name); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = small ? Math.min(4, renderer.capabilities.getMaxAnisotropy()) : renderer.capabilities.getMaxAnisotropy(); return t; };

  const M = {
    panel: new THREE.MeshPhysicalMaterial({ color: 0x0f1624, roughness: 0.3, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.12 }),
    alu: new THREE.MeshPhysicalMaterial({ color: 0xd3d6db, roughness: 0.28, metalness: 1, clearcoat: 0.4, clearcoatRoughness: 0.2, envMapIntensity: 1.8 }),
    aluDark: new THREE.MeshPhysicalMaterial({ color: 0xbfc2c8, roughness: 0.18, metalness: 1, envMapIntensity: 1.4 }),
    black: new THREE.MeshStandardMaterial({ color: 0x050507, roughness: 0.25, metalness: 0.2 }),
    keys: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, map: keyboardTexture() }),
    glow: new THREE.MeshBasicMaterial({ color: 0x65a7fa, toneMapped: false }),
  };
  const screenMat = (map, opacity = 1) => new THREE.MeshBasicMaterial({ map, transparent: true, opacity, toneMapped: false, depthWrite: false });

  /* ================= HERO: the wall of screens ================= */
  const wall = new THREE.Group(); scene.add(wall);
  const COLS = small ? 4 : 6, ROWS = small ? 4 : 5, PW = 1.6, PH = 1.0, GX = 1.76, GY = 1.14;
  const SLOT = { c: small ? 2 : 4, r: small ? 2 : 3 };
  const panelGeo = new RoundedBoxGeometry(PW, PH, 0.07, 4, 0.05);
  const scrGeo = roundedPlane(PW - 0.08, PH - 0.08, 0.035);
  const wallTex = [...Array(14)].map((_, i) => tex(`w${String(i).padStart(2, "0")}.jpg`));
  const panels = [];
  let ti = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const x = (c - (COLS - 1) / 2) * GX, y = (r - (ROWS - 1) / 2) * GY;
    if (c === SLOT.c && r === SLOT.r) continue;
    const g = new THREE.Group(); g.position.set(x, y, 0);
    g.add(new THREE.Mesh(panelGeo, M.panel));
    const s = new THREE.Mesh(scrGeo, screenMat(wallTex[ti++ % wallTex.length], 0.92)); s.position.z = 0.037; g.add(s);
    wall.add(g); panels.push({ g, x, y, z: 0, v: 0, d: (c * 13 + r * 7) % 5 });
  }
  const slotPos = new THREE.Vector3((SLOT.c - (COLS - 1) / 2) * GX, (SLOT.r - (ROWS - 1) / 2) * GY, 0);
  /* the empty socket: a thin glowing frame and a light that spills onto neighbors */
  const frame = new THREE.Group(); frame.position.copy(slotPos);
  [[PW, 0.025, 0, PH / 2], [PW, 0.025, 0, -PH / 2], [0.025, PH, PW / 2, 0], [0.025, PH, -PW / 2, 0]].forEach(([w, h, x, y]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.glow); m.position.set(x, y, -0.02); frame.add(m); });
  wall.add(frame);
  const glow = new THREE.PointLight(0x7fe08a, 8, 3.4, 1.5); glow.position.set(slotPos.x, slotPos.y, 0.35); wall.add(glow);

  /* the missing screen */
  const piece = new THREE.Group(); wall.add(piece);
  piece.add(new THREE.Mesh(panelGeo, M.panel));
  const hatchD = hatchTexture(true), hatchL = hatchTexture(false);
  const pieceUndef = new THREE.Mesh(scrGeo, screenMat(hatchD)); pieceUndef.position.z = 0.04; piece.add(pieceUndef);
  const pieceDesigned = new THREE.Mesh(scrGeo, screenMat(tex("d-chi-dashboard.jpg"), 0)); pieceDesigned.position.z = 0.038; piece.add(pieceDesigned);
  const pieceRim = new THREE.Mesh(new RoundedBoxGeometry(PW + 0.06, PH + 0.06, 0.04, 3, 0.06), M.glow); pieceRim.position.z = -0.03; piece.add(pieceRim);

  /* ================= WORK: four chapters, one story =================
     1 Flows    (Viatris)  screens gather on a canvas into a flow, joined by redlines
     2 Systems  (RCMS)     the flow lifts into a stack of modules; light sweeps to dark
     3 Roles    (The Hub)  one platform; five role phones fan out from behind it
     4 AI       (CHI)      one laptop; the explanation layer peels off the screen
     Each rig gets c: -1 before, 0..1 while its text is pinned, 2 after.      */
  const FONT_D = '"Inter Display", system-ui, sans-serif', FONT_T = '"Inter Text", system-ui, sans-serif';
  const canvasTex = (w, h, draw) => {
    const c = document.createElement("canvas"); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData.redraw = (d) => { draw(c.getContext("2d"), d); t.needsUpdate = true; };
    t.userData.redraw(true); return t;
  };
  const redrawables = [];
  const glowMat = () => new THREE.MeshBasicMaterial({ color: 0x65a7fa, toneMapped: false, transparent: true, opacity: 1, depthWrite: false });
  const glowMats = [], notesLines = [];
  const gm = () => { const m = glowMat(); glowMats.push(m); return m; };
  function slab(w, h, map, depth = 0.06) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, depth, 3, Math.min(0.04, depth / 2)), M.panel); g.add(body);
    const mat = screenMat(map); const scr = new THREE.Mesh(roundedPlane(w - 0.07, h - 0.07, 0.03), mat); scr.position.z = depth / 2 + 0.002; g.add(scr);
    return { g, mat, scr, w: w - 0.07, h: h - 0.07 };
  }
  const dotGrid = canvasTex(1024, 1024, (g, d) => {
    g.fillStyle = d ? "#121419" : "#eceef2"; g.fillRect(0, 0, 1024, 1024);
    g.fillStyle = d ? "rgba(255,255,255,.10)" : "rgba(10,12,20,.13)";
    for (let y = 16; y < 1024; y += 32) for (let x = 16; x < 1024; x += 32) { g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill(); }
  });
  dotGrid.wrapS = dotGrid.wrapT = THREE.RepeatWrapping; redrawables.push(dotGrid);
  const seg = (mat, thick = 0.03) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, thick).translate(0.5, 0, 0), mat); return m; };
  const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; };
  /* phone layout: the 3D fills the band between the header and the docked case card, edge to edge.
     The page measures that band (setZone) so every phone size gets the same framing */
  const zone = { top: 72, bottom: 420 };
  const visH = () => 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const zY = () => (0.5 - (zone.top + zone.bottom) / 2 / Math.max(1, vh)) * visH();
  const zK = (w, h) => Math.min((visH() * camera.aspect * 0.94) / w, (Math.max(80, zone.bottom - zone.top) / Math.max(1, vh)) * visH() * 0.92 / h);
  const fitK = () => small ? 1 : clamp((2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect * 0.56) / 8, 0.85, 1.3);
  const smoothTo = (o, key, target, dt, rate = 0.004) => { o[key] += (target - o[key]) * (reduce ? 1 : 1 - Math.pow(rate, dt)); return o[key]; };

  function laptop(screens) {
    const root = new THREE.Group();
    const base = new THREE.Mesh(new RoundedBoxGeometry(4.2, 0.13, 2.9, 4, 0.06), M.alu); base.position.y = 0.065; root.add(base);
    const deck = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.28), M.keys); deck.rotation.x = -Math.PI / 2; deck.position.set(0, 0.1315, -0.52); root.add(deck);
    const pad = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.004, 0.95, 2, 0.002), M.aluDark); pad.position.set(0, 0.131, 0.78); root.add(pad);
    const hinge = new THREE.Group(); hinge.position.set(0, 0.13, -1.45); root.add(hinge);
    const lid = new THREE.Group(); hinge.add(lid);
    const shell = new THREE.Mesh(new RoundedBoxGeometry(4.2, 2.72, 0.07, 4, 0.05), M.alu); shell.position.set(0, 1.36, -0.035); lid.add(shell);
    const bezel = new THREE.Mesh(roundedPlane(4.08, 2.6, 0.08), M.black); bezel.position.set(0, 1.36, 0.002); lid.add(bezel);
    const mats = screens.map((s, i) => screenMat(tex(s), i ? 0 : 1));
    mats.forEach((m, i) => { const sc = new THREE.Mesh(roundedPlane(3.84, 2.4, 0.02), m); sc.position.set(0, 1.4, 0.004 + i * 0.0006); lid.add(sc); });
    root.userData = { kind: "laptop", hinge, mats, screenCenter: new THREE.Vector3(0, 1.4, 0), screenSize: [3.84, 2.4], lidObj: lid };
    return root;
  }
  function phone(screens) {
    const root = new THREE.Group();
    const body = new THREE.Mesh(new RoundedBoxGeometry(1.36, 2.82, 0.13, 6, 0.2), M.alu); root.add(body);
    const glass = new THREE.Mesh(roundedPlane(1.3, 2.76, 0.18, 10), M.black); glass.position.z = 0.066; root.add(glass);
    const mats = screens.map((s, i) => screenMat(tex(s), i ? 0 : 1));
    mats.forEach((m, i) => { const sc = new THREE.Mesh(roundedPlane(1.22, 2.64, 0.15, 10), m); sc.position.z = 0.068 + i * 0.0006; root.add(sc); });
    const island = new THREE.Mesh(roundedPlane(0.36, 0.1, 0.05), M.black); island.position.set(0, 1.18, 0.072); root.add(island);
    root.userData = { kind: "phone", mats, screenCenter: new THREE.Vector3(0, 0, 0.07), screenSize: [1.22, 2.64] };
    return root;
  }

  /* ---------- 1 · Flows ---------- */
  function rigBoard(cfg) {
    const root = new THREE.Group(), tilt = new THREE.Group(); root.add(tilt);
    const n = cfg.screens.length, stair = n <= 3, cols = stair ? n : Math.min(3, n), rows = stair ? 1 : Math.ceil(n / cols), CW = stair ? 2.6 : 2.2, CH = CW / 1.6, GX = stair ? 2.75 : 2.42, GY = 1.78;
    const bw = cols * GX + 1.0, bh = (stair ? GY * 1.9 : rows * GY) + 1.0;
    const boardMat = new THREE.MeshBasicMaterial({ map: dotGrid, transparent: true, opacity: 1, toneMapped: false });
    dotGrid.repeat.set(bw / 3, bh / 3);
    const board = new THREE.Mesh(roundedPlane(bw, bh, 0.18), boardMat); board.position.z = -0.06; tilt.add(board);
    const cards = cfg.screens.map((s, i) => {
      const r = Math.floor(i / cols), k = i % cols, col = r % 2 ? cols - 1 - k : k;
      const sl = slab(CW, CH, tex(s), 0.05); tilt.add(sl.g);
      return { ...sl, hx: (col - (cols - 1) / 2) * GX, hy: stair ? ((cols - 1) / 2 - col) * 0.9 : ((rows - 1) / 2 - r) * GY, lift: 0, i };
    });
    const links = cards.slice(1).map((cd, i) => { const m = seg(gm(), 0.028); tilt.add(m); return { m, a: cards[i], b: cd }; });
    const dots = cards.map(() => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.055, 20), gm()); tilt.add(m); return m; });
    return { root, kind: "board", update(c, dt) {
      const gather = easeOut(span(-0.08, 0.2, c)), leave = ease(span(1.05, 1.62, c));
      const n1 = cards.length, pos = clamp(span(0.1, 0.95, c) * n1, 0, n1 - 0.0001), idx = Math.floor(pos);
      root.position.set(small ? 0 : -0.55, (small ? zY() : -0.05) + (1 - gather) * -1.2 + leave * 1.2, (1 - gather) * -2);
      root.scale.setScalar(small ? zK(7.9, 4.4) : 1.0 * fitK());
      tilt.rotation.set(-0.42 - leave * 0.6 - sm.y * 0.05, -0.32 + sm.x * 0.08, 0.04);
      boardMat.opacity = gather * (1 - leave);
      const act = cards[idx];
      cards.forEach((cd, i) => {
        const g = clamp(gather * 1.5 - i * 0.07);
        const sx = rnd(i, 1) * 3.2, sy = rnd(i, 2) * 2.2, sz = 1.4 + rnd(i, 3) * 1.2, sr = rnd(i, 4) * 0.5;
        const L = smoothTo(cd, "lift", i === idx && c > 0.05 && c < 1.1 ? 1 : 0, dt);
        const panX = -act.hx * 0.35 * clamp(c * 3);
        const pile = leave;
        cd.g.position.set((cd.hx * g + sx * (1 - g) + panX) * (1 - pile), (cd.hy * g + sy * (1 - g)) * (1 - pile), sz * (1 - g) + L * 0.5 + pile * i * 0.12);
        cd.g.rotation.set(-L * 0.12, 0, sr * (1 - g));
        cd.g.scale.setScalar(1 + L * 0.12);
        cd.mat.opacity = (0.62 + 0.38 * Math.max(L, c < 0.08 ? 1 : 0)) * (1 - span(0.5, 1, leave)) * clamp(g * 3);
        cd.g.visible = leave < 0.98;
      });
      links.forEach((l, i) => {
        const d = span(-0.05 + i * 0.1, 0.12 + i * 0.1, c) * (1 - leave);
        const ax = l.a.g.position.x, ay = l.a.g.position.y, bx = l.b.g.position.x, by = l.b.g.position.y;
        l.m.position.set(ax, ay, -0.02); l.m.rotation.z = Math.atan2(by - ay, bx - ax); l.m.scale.x = Math.hypot(bx - ax, by - ay) * d;
        l.m.material.opacity = d > 0 ? 1 : 0;
      });
      dots.forEach((m, i) => { const cd = cards[i]; m.position.set(cd.g.position.x - CW / 2 - 0.02, cd.g.position.y, cd.g.position.z + 0.04); m.material.opacity = gather * (1 - leave); });
      root.visible = c > -0.1 && c < 1.7;
      root.updateMatrixWorld(true);
      return { rect: project(act.scr, new THREE.Vector3(), act.w, act.h), idx, n: n1, vis: gather * (1 - leave) * clamp(c * 5 + 0.5) };
    } };
  }

  /* ---------- 2 · Systems ---------- */
  function rigStack(cfg) {
    const root = new THREE.Group(), tilt = new THREE.Group(); root.add(tilt);
    const W = 3.5, H = 2.19;
    const layers = cfg.layers.map(([l, d], j) => {
      const sl = slab(W, H, tex(l), 0.05);
      const dm = screenMat(tex(d), 0); const ds = new THREE.Mesh(roundedPlane(sl.w, sl.h, 0.03), dm); ds.position.z = 0.03; sl.g.add(ds);
      const holder = new THREE.Group(); holder.add(sl.g); tilt.add(holder);
      return { ...sl, holder, dm, out: 0, j };
    });
    const n = layers.length;
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.5, 0.035), gm()); tilt.add(edge);
    return { root, kind: "stack", update(c, dt) {
      const enter = easeOut(span(-0.5, 0.12, c)), leave = ease(span(1.05, 1.62, c));
      const darkP = span(0.64, 0.92, c);
      const pos = clamp(span(0.1, 0.62, c) * n, 0, n - 0.0001), idx = c < 0.63 ? Math.floor(pos) : n;
      root.position.set(small ? -0.3 * zK(5.2, 5.0) : -0.45, (small ? zY() : -0.5) + leave * 1.4, 0);
      root.scale.setScalar((small ? zK(5.2, 5.0) : 1.08 * fitK()) * (1 - leave * 0.35));
      tilt.rotation.set(-1.02 + span(0.64, 0.8, c) * 0.25 - sm.y * 0.05, 0, -0.55 + sm.x * 0.06);
      const spread = easeOut(span(-0.1, 0.18, c)) * (1 - span(0.66, 0.85, c) * 0.55) * (1 - leave);
      const gap = 0.12 + 0.42 * spread;
      layers.forEach((L, j) => {
        const e = easeOut(span(-0.5 + j * 0.035, 0.05 + j * 0.035, c));
        const o = smoothTo(L, "out", j === idx && c >= 0.08 ? 1 : 0, dt);
        const zz = (j - (n - 1) / 2) * gap;
        L.holder.position.set(o * 1.25, (1 - e) * -1.2 + o * 0.2, zz * e + o * 0.35);
        L.holder.rotation.set(o * 0.62, 0, 0);
        const dj = span(j / n * 0.7, j / n * 0.7 + 0.3, darkP);
        const fade = 1 - span(0.45, 1, leave);
        L.mat.opacity = clamp(e * 2) * fade * (1 - dj * 0.999);
        L.dm.opacity = clamp(e * 2) * fade * dj;
        L.g.visible = fade > 0.01 && e > 0.01;
      });
      const sweepZ = ((darkP * 1.2 - 0.1) * n - (n - 1) / 2) * gap;
      edge.position.set(0, -H / 2 - 0.02, sweepZ); edge.rotation.x = Math.PI / 2;
      edge.material.opacity = darkP > 0 && darkP < 1 ? 1 : 0;
      root.visible = c > -0.55 && c < 1.7;
      root.updateMatrixWorld(true);
      const R = layers[Math.min(idx, n - 1)] ;
      const top = idx >= n ? layers[n - 1] : R;
      return { rect: project(top.scr, new THREE.Vector3(), top.w, top.h), idx, n: n + 1, vis: enter * (1 - leave) * (idx >= n ? 0.0 : 1) };
    } };
  }

  /* ---------- 3 · Roles ---------- */
  function rigRoles(cfg) {
    const root = new THREE.Group();
    const web = new THREE.Group(); root.add(web);
    const WW = 4.7, WH = 2.94;
    const mon = new THREE.Mesh(new RoundedBoxGeometry(WW + 0.14, WH + 0.14, 0.08, 4, 0.04), M.panel); web.add(mon);
    const webMats = cfg.web.map((s, i) => { const m = screenMat(tex(s), i ? 0 : 1); const p = new THREE.Mesh(roundedPlane(WW, WH, 0.03), m); p.position.z = 0.042 + i * 0.0006; web.add(p); return m; });
    const webScr = web.children[1];
    const phones = cfg.phones.map((s, k) => {
      const ph = phone([s]); root.add(ph);
      const lab = canvasTex(512, 96, (g, d) => {
        g.clearRect(0, 0, 512, 96); g.font = `500 50px ${FONT_T}`; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillStyle = ph.userData.on ? (d ? "#65a7fa" : "#0a46b9") : (d ? "rgba(236,238,244,.82)" : "rgba(20,22,30,.78)");
        g.fillText(cfg.roles[k], 256, 50);
      });
      redrawables.push(lab);
      const lm = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.4), new THREE.MeshBasicMaterial({ map: lab, transparent: true, toneMapped: false, depthWrite: false }));
      root.add(lm);
      return { ph, lab, lm, lift: 0, k, on: false };
    });
    return { root, kind: "roles", update(c, dt) {
      const enter = easeOut(span(-0.5, 0.1, c)), leave = ease(span(1.05, 1.62, c));
      root.position.set(small ? 0 : -0.5, (small ? zY() + 0.55 * zK(7.2, 5.8) : -0.1) + (1 - enter) * -1.6 + leave * 7, 0);
      root.scale.setScalar((small ? zK(7.2, 5.8) : 1.02 * fitK()) * (0.7 + 0.3 * enter));
      web.visible = enter > 0.02;
      web.position.set(0, 1.05, -0.5); web.rotation.set(-0.06 - sm.y * 0.05, -0.22 + sm.x * 0.08, 0);
      const wn = webMats.length, wp = clamp(span(0.1, 0.95, c) * wn, 0, wn - 0.0001), wi = Math.floor(wp), wf = wp - wi;
      webMats.forEach((m, j) => { m.opacity = j < wi ? 0 : j === wi ? 1 : j === wi + 1 ? span(0.8, 1, wf) : 0; });
      const pn = phones.length, pp = clamp(span(0.15, 0.95, c) * pn, 0, pn - 0.0001), idx = Math.floor(pp);
      phones.forEach((P) => {
        const k = P.k, off = k - (pn - 1) / 2;
        const em = easeOut(span(0.0 + k * 0.05, 0.28 + k * 0.05, c)) * (1 - ease(span(1.0 + (pn - 1 - k) * 0.04, 1.35 + (pn - 1 - k) * 0.04, c)));
        const L = smoothTo(P, "lift", k === idx && c > 0.12 ? 1 : 0, dt);
        const tx = off * 1.42, ty = -1.5 + Math.abs(off) * 0.14 + L * 0.45, tz = 1.0 - Math.abs(off) * 0.22 + L * 0.75;
        P.ph.position.set(tx * em, 0.95 * (1 - em) + ty * em, -0.7 * (1 - em) + tz * em);
        P.ph.rotation.set(0.04 - sm.y * 0.05, -off * 0.14 - 0.18 + sm.x * 0.08, -off * 0.03 * (1 - L));
        P.ph.scale.setScalar((0.3 + 0.42 * em) * (1 + L * 0.26));
        P.lm.position.set(P.ph.position.x, P.ph.position.y - 1.41 * P.ph.scale.x - 0.24, P.ph.position.z + 0.05);
        P.lm.material.opacity = em * (0.55 + 0.45 * L);
        P.lm.rotation.copy(P.ph.rotation); P.lm.rotation.z = 0;
        const on = k === idx && c > 0.12; if (on !== P.on) { P.on = on; P.ph.userData.on = on; P.lab.userData.redraw(dark); }
      });
      root.visible = c > -0.55 && c < 1.7;
      root.updateMatrixWorld(true);
      const A = phones[idx].ph;
      return { rect: project(A, A.userData.screenCenter, ...A.userData.screenSize), idx, n: pn, vis: enter * (1 - leave) * clamp(c * 6) };
    } };
  }

  /* ---------- 4 · AI that explains ---------- */
  function rigExplain(cfg) {
    const root = laptop(cfg.screens);
    const lid = root.userData.lidObj;
    const notes = cfg.notes.map((t, k) => {
      const tx = canvasTex(1024, 256, (g, d) => {
        g.clearRect(0, 0, 1024, 256);
        g.fillStyle = d ? "rgba(12,19,33,.94)" : "rgba(255,255,255,.96)"; g.beginPath(); g.roundRect(4, 4, 1016, 248, 28); g.fill();
        const gr = g.createLinearGradient(0, 0, 1024, 256); gr.addColorStop(0, d ? "#0a6ddd" : "#1251cc"); gr.addColorStop(1, d ? "#10378d" : "#0d2769");
        g.strokeStyle = gr; g.lineWidth = 5; g.stroke();
        g.fillStyle = d ? "#65a7fa" : "#0a46b9"; g.font = `500 30px ${FONT_T}`; g.fillText(t[0].toUpperCase(), 44, 78);
        g.fillStyle = d ? "#eef0f5" : "#14161e"; g.font = `600 52px ${FONT_D}`; g.fillText(t[1], 44, 160);
        if (t[2]) { g.font = `400 34px ${FONT_T}`; g.fillStyle = d ? "rgba(238,240,245,.7)" : "rgba(20,22,30,.65)"; g.fillText(t[2], 44, 214); }
      });
      redrawables.push(tx);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.625), new THREE.MeshBasicMaterial({ map: tx, transparent: true, toneMapped: false, depthWrite: false }));
      lid.add(m);
      const lineG = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const line = new THREE.Line(lineG, new THREE.LineBasicMaterial({ color: 0x65a7fa, transparent: true, toneMapped: false })); notesLines.push(line.material);
      lid.add(line);
      const pin = new THREE.Mesh(new THREE.CircleGeometry(0.05, 20), gm()); lid.add(pin);
      return { m, line, pin, k, anchor: cfg.anchors[k], spot: cfg.spots[k] };
    });
    return { root, kind: "explain", update(c, dt) {
      const enter = easeOut(span(-0.5, 0.1, c)), leave = ease(span(1.05, 1.62, c));
      const turn = -0.5 + span(0, 1, c) * 0.35 + sm.x * 0.1;
      root.position.set(small ? -0.85 * zK(6.8, 4.4) : -1.05, (1 - enter) * -9 + leave * 9 + (small ? zY() - 1.3 * zK(6.8, 4.4) : -1.55 * fitK()), (1 - enter) * -3);
      root.rotation.set(0.34 - sm.y * 0.06, turn, 0); root.scale.setScalar(small ? zK(6.8, 4.4) : 1.12 * fitK());
      const open = easeOut(span(-0.35, 0.18, c));
      root.userData.hinge.rotation.x = (1 - open) * (Math.PI / 2 - 0.02) - open * 0.3;
      const mats = root.userData.mats, n = mats.length, pos = clamp(span(0.1, 0.95, c) * n, 0, n - 0.0001), idx = Math.floor(pos), f = pos - idx;
      mats.forEach((m, j) => { m.opacity = j < idx ? 0 : j === idx ? 1 : j === idx + 1 ? span(0.82, 1, f) : 0; });
      notes.forEach((N) => {
        const a = easeOut(span(0.22 + N.k * 0.16, 0.4 + N.k * 0.16, c)) * (1 - leave);
        const [ax, ay, az] = N.anchor, [sx, sy] = N.spot;
        N.m.position.set(sx + (ax - sx) * a, sy + (ay - sy) * a, 0.01 + az * a);
        N.m.scale.setScalar(0.4 + 0.6 * a); N.m.material.opacity = a;
        N.pin.position.set(sx, sy, 0.012); N.pin.material.opacity = a;
        const p = N.line.geometry.attributes.position; p.setXYZ(0, sx, sy, 0.012); p.setXYZ(1, N.m.position.x - 1.25 * N.m.scale.x, N.m.position.y, N.m.position.z); p.needsUpdate = true;
        N.line.material.opacity = a;
      });
      root.visible = c > -0.55 && c < 1.7;
      root.updateMatrixWorld(true);
      return { rect: project(lid, root.userData.screenCenter, ...root.userData.screenSize), idx: f > 0.9 ? Math.min(n - 1, idx + 1) : idx, n, vis: enter * (1 - leave) * easeOut(span(-0.2, 0.2, c)) };
    } };
  }

  const RIGS = { board: rigBoard, stack: rigStack, roles: rigRoles, explain: rigExplain };
  const rigs = cases.map((c) => { const r = RIGS[c.kind](c); r.root.visible = false; scene.add(r.root); return r; });

  /* ================= theme ================= */
  let dark = true;
  const setTheme = (isDark) => {
    dark = isDark;
    M.panel.color.set(isDark ? 0x0f1624 : 0xf1f2f5);
    M.alu.color.set(isDark ? 0x9fa3aa : 0xd3d6db); M.aluDark.color.set(isDark ? 0xa9acb2 : 0xc4c7cc);
    M.glow.color.set(isDark ? 0x65a7fa : 0x0a46b9); glow.color.set(isDark ? 0x3d8cf5 : 0x1251cc);
    pieceUndef.material.map = isDark ? hatchD : hatchL; pieceUndef.material.needsUpdate = true;
    scene.environmentIntensity = isDark ? 0.45 : 0.85;
    renderer.toneMappingExposure = isDark ? 1.05 : 0.98;
    key.intensity = isDark ? 2.4 : 1.8;
    redrawables.forEach((t) => t.userData.redraw(isDark));
    glowMats.forEach((m) => m.color.set(isDark ? 0x65a7fa : 0x0a46b9));
    notesLines.forEach((m) => m.color.set(isDark ? 0x65a7fa : 0x0a46b9));
  };

  /* ================= sizing ================= */
  let vw = 1, vh = 1;
  /* on touch screens the address bar changes innerHeight while scrolling. Size the canvas to the
     largest viewport once and ignore height-only changes, so the scene never jumps or re-renders */
  const lvh = () => { const d = document.createElement("div"); d.style.cssText = "position:fixed;top:0;height:100lvh;width:0;visibility:hidden"; document.body.appendChild(d); const h = d.getBoundingClientRect().height || innerHeight; d.remove(); return Math.max(h, innerHeight); };
  const resize = (e) => {
    if (e && touch && innerWidth === vw) return;
    vw = innerWidth; vh = touch ? lvh() : innerHeight;
    renderer.setSize(vw, vh, false); camera.aspect = vw / vh;
    if (small) camera.clearViewOffset(); else camera.setViewOffset(vw, vh, -vw * 0.21, 0, vw, vh);
    camera.updateProjectionMatrix();
  };
  addEventListener("resize", resize);

  /* ================= pointer ================= */
  const ndc = new THREE.Vector2(9, 9), sm = new THREE.Vector2(); let pOn = false;
  addEventListener("pointermove", (e) => { ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); pOn = true; }, { passive: true });
  document.addEventListener("pointerleave", () => { pOn = false; });
  const ray = new THREE.Raycaster(), hitW = new THREE.Vector3(), hitL = new THREE.Vector3(), inv = new THREE.Matrix4();

  /* ================= state ================= */
  const S = { hero: 0, heroS: 0, cases: cases.map(() => -1), casesS: cases.map(() => -1), t: 0, paused: reduce, docked: false, dockT: -9 };
  const L = { frame: [], dock: [] };
  const q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.22, -0.32, 0.1)), qI = new THREE.Quaternion();
  const v3 = new THREE.Vector3(), box = new THREE.Box3();
  const project = (obj, local, w, h) => {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      v3.set(local.x + sx * w / 2, local.y + sy * h / 2, local.z).applyMatrix4(obj.matrixWorld).project(camera);
      const px = (v3.x * .5 + .5) * vw, py = (1 - (v3.y * .5 + .5)) * vh;
      x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py);
    }
    return [x0, y0, x1, y1];
  };

  let last = performance.now();
  const frameFn = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!S.paused) S.t += dt;
    const k = reduce ? 1 : 1 - Math.pow(0.0012, dt);
    S.heroS += (S.hero - S.heroS) * k;
    S.casesS = S.casesS.map((v, i) => v + (S.cases[i] - v) * (reduce ? 1 : 1 - Math.pow(0.0025, dt)));
    sm.lerp(pOn && !S.paused ? ndc : new THREE.Vector2(), reduce ? 1 : 0.06);
    const p = S.heroS;

    /* ---- wall ---- */
    const exit = ease(span(0.82, 1.0, p));                     /* wall leaves as Work arrives */
    const face = ease(span(0.3, 0.8, p));
    wall.visible = exit < 0.999;
    wall.rotation.set(-0.3 + face * 0.22 - sm.y * 0.06 - exit * 0.5, -0.6 + face * 0.4 + sm.x * 0.1, 0.05 - face * 0.05);
    wall.position.set(small ? 0 : 0.2, (small ? 2.2 : 0) + exit * 9 + (S.paused ? 0 : Math.sin(S.t * .5) * .05), -exit * 6);
    const push = ease(span(0.08, 0.6, p)) * (1 - exit);
    wall.scale.setScalar(1 + push * 0.32);
    wall.updateMatrixWorld();

    /* piece: floats in front, travels into the slot, resolves */
    const travel = ease(span(0.12, 0.66, p));
    const a = 1 - travel, b = travel;
    const s0 = new THREE.Vector3(slotPos.x - 1.6, slotPos.y - 2.4, 3.6), c0 = new THREE.Vector3(slotPos.x - 0.6, slotPos.y - 0.6, 2.8);
    piece.position.set(a * a * s0.x + 2 * a * b * c0.x + b * b * slotPos.x, a * a * s0.y + 2 * a * b * c0.y + b * b * slotPos.y, a * a * s0.z + 2 * a * b * c0.z + b * b * 0.02);
    const idle = S.paused ? 0 : 1 - travel;
    piece.position.y += Math.sin(S.t * 1.2) * 0.07 * idle;
    piece.quaternion.copy(q0).slerp(qI, travel); piece.rotateY(Math.sin(S.t * 0.6) * 0.2 * idle);
    piece.position.z -= Math.sin(span(0.62, 0.72, p) * Math.PI) * 0.1;
    const resolve = span(0.66, 0.76, p);
    pieceDesigned.material.opacity = resolve; pieceUndef.material.opacity = 1 - resolve;
    pieceRim.visible = resolve < 1; pieceRim.material.opacity = 1;
    const gap = 1 - span(0.58, 0.7, p);
    glow.intensity = (dark ? 8 : 4.5) * gap * (0.85 + 0.15 * Math.sin(S.t * 2.2)); frame.visible = gap > 0.02;
    const docked = p > 0.7;
    if (docked !== S.docked) { S.docked = docked; if (docked) S.dockT = S.t; L.dock.forEach((f) => f(docked)); }

    /* panels lean toward the pointer, and ripple once when the piece docks */
    if (pOn && wall.visible) { ray.setFromCamera(ndc, camera); const pl = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0).applyMatrix4(wall.matrixWorld); if (ray.ray.intersectPlane(pl, hitW)) hitL.copy(hitW).applyMatrix4(inv.copy(wall.matrixWorld).invert()); }
    else hitL.set(99, 99, 0);
    const since = S.t - S.dockT;
    panels.forEach((P) => {
      const d = Math.hypot(P.x - hitL.x, P.y - hitL.y);
      const tgt = S.paused ? 0 : 0.32 * Math.exp(-d * d / 1.6);
      P.v += (tgt - P.z) * 150 * dt; P.v *= Math.pow(0.0008, dt); P.z += P.v * dt;
      const ds = Math.hypot(P.x - slotPos.x, P.y - slotPos.y);
      const wave = S.docked && since < 3 && !S.paused ? 0.35 * Math.exp(-Math.pow(ds - since * 7, 2) * 0.9) * Math.exp(-since * 1.2) : 0;
      P.g.position.z = P.z + wave + P.d * 0.01;
    });

    /* ---- chapters: each rig follows its case section ---- */
    const states = rigs.map((rg, i) => {
      const c = S.casesS[i];
      if (!(c > -0.55 && c < 1.7) || exit < 0.5) { rg.root.visible = false; return null; }
      rg.root.visible = true;
      return rg.update(c, dt);
    });

    renderer.render(scene, camera);

    /* hero selection box follows the piece */
    const pr = project(piece, new THREE.Vector3(0, 0, 0.04), PW, PH);
    L.frame.forEach((fn) => fn({ p, piece: pr, pieceVis: (1 - span(0.74, 0.82, p)) * (1 - exit), devices: states, docked }));
    requestAnimationFrame(frameFn);
  };

  setTheme(true); resize(); requestAnimationFrame(frameFn);
  document.fonts?.ready.then(() => redrawables.forEach((t) => t.userData.redraw(dark)));
  return {
    setHero: (v) => { S.hero = v; if (reduce) S.heroS = v; },
    setCase: (i, v) => { S.cases[i] = v; if (reduce) S.casesS[i] = v; },
    setZone: (top, bottom) => { zone.top = top; zone.bottom = Math.max(top + 140, bottom); },
    setTheme, setPaused: (v) => { S.paused = v; },
    on: (ev, f) => L[ev].push(f),
  };
}
