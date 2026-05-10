const canvas = document.getElementById('space');
const ctx = canvas.getContext('2d');
const greeting = document.getElementById('greeting');
const formulasContainer = document.getElementById('formulas');

let W, H, time = 0;
const mouse = { x: -9999, y: -9999 };

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);

// ── RESIZE ───────────────────────────────────────────────
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  init();
}

// ── SPACE FORMULAS (easter eggs) ─────────────────────────
// All real physics/math formulas — Ci(x) is the hidden one
const FORMULAS = [
  { tex: 'F = GMm / r²',          label: 'Newton\'s gravity' },
  { tex: 'E = mc²',               label: 'Mass-energy' },
  { tex: 'Ci(x) = −∫ cos(t)/t dt', label: 'Cosine Integral', isCi: true },
  { tex: 'v_esc = √(2GM/r)',       label: 'Escape velocity' },
  { tex: 'T² ∝ a³',               label: 'Kepler\'s 3rd law' },
  { tex: 'ds² = −c²dt² + dr²',    label: 'Spacetime interval' },
  { tex: 'L = r × p',             label: 'Angular momentum' },
  { tex: 'Φ = −GM/r',             label: 'Grav. potential' },
  { tex: 'a = v²/r',              label: 'Centripetal accel.' },
  { tex: 'E_k = ½mv²',            label: 'Kinetic energy' },
  { tex: 'ω = 2π/T',              label: 'Angular frequency' },
  { tex: 'g = GM/r²',             label: 'Surface gravity' },
];

const COS_URL = 'https://arkanz4idan.github.io/cospersent/index.html';

// Fixed positions (as % of screen), spread out, avoiding top center where Hello World sits
const POSITIONS = [
  { x: 4,  y: 28 }, { x: 80, y: 18 }, { x: 6,  y: 55 },
  { x: 76, y: 48 }, { x: 2,  y: 75 }, { x: 70, y: 72 },
  { x: 18, y: 88 }, { x: 55, y: 85 }, { x: 88, y: 88 },
  { x: 42, y: 18 }, { x: 25, y: 45 }, { x: 60, y: 38 },
];

function buildFormulas() {
  formulasContainer.innerHTML = '';
  FORMULAS.forEach((f, i) => {
    const pos = POSITIONS[i % POSITIONS.length];
    const chip = document.createElement('a');
    chip.className = 'formula-chip';
    chip.href = COS_URL;
    chip.target = '_blank';
    chip.rel = 'noopener';
    chip.textContent = f.tex;
    chip.title = f.label;

    if (f.isCi) {
      chip.dataset.ci = '1';
    }

    chip.style.left = pos.x + 'vw';
    chip.style.top  = pos.y + 'vh';

    formulasContainer.appendChild(chip);

    // Each chip gets its own independent show/hide cycle
    scheduleChip(chip, i * 1800);
  });
}

function scheduleChip(chip, initialDelay) {
  // Show duration: 4–10 seconds. Hidden duration: 8–22 seconds.
  // Ci chip stays visible slightly longer as a subtle extra hint.
  const isCi = chip.dataset.ci === '1';

  function show() {
    chip.classList.add('visible');
    if (isCi) {
      chip.style.color = 'rgba(79,156,249,0.45)';
      chip.style.borderColor = 'rgba(79,156,249,0.25)';
    }
    const visibleFor = isCi
      ? (7000 + Math.random() * 6000)
      : (4000 + Math.random() * 6000);
    setTimeout(hide, visibleFor);
  }

  function hide() {
    chip.classList.remove('visible');
    if (isCi) {
      chip.style.color = '';
      chip.style.borderColor = '';
    }
    const hiddenFor = 9000 + Math.random() * 14000;
    setTimeout(show, hiddenFor);
  }

  // Stagger the first appearance so they don't all pop at once
  setTimeout(show, initialDelay + Math.random() * 3000);
}

// ── STARS ────────────────────────────────────────────────
let stars = [];
function makeStars() {
  stars = [];
  const count = Math.floor((W * H) / 900);
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rand(0, W), y: rand(0, H),
      r: rand(0.2, 1.4),
      twinkle: rand(0, TAU),
      speed: rand(0.004, 0.018),
      color: ['#ffffff','#cce0ff','#ffe8cc','#e8ccff'][Math.floor(rand(0,4))]
    });
  }
}

function drawStars() {
  for (const s of stars) {
    s.twinkle += s.speed;
    const a = 0.4 + 0.6 * Math.abs(Math.sin(s.twinkle));
    ctx.globalAlpha = a;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ── NEBULAE ───────────────────────────────────────────────
let nebulae = [];
function makeNebulae() {
  const nebulaConfigs = [
    { px: 0.15, py: 0.2,  rxF: 0.22, ryF: 0.14, angle: 0.4, hue: 220, alpha: 0.04  },
    { px: 0.78, py: 0.65, rxF: 0.26, ryF: 0.18, angle: 1.1, hue: 260, alpha: 0.035 },
    { px: 0.55, py: 0.85, rxF: 0.18, ryF: 0.12, angle: 2.8, hue: 190, alpha: 0.05  },
    { px: 0.88, py: 0.18, rxF: 0.14, ryF: 0.10, angle: 0.9, hue: 300, alpha: 0.03  },
  ];
  nebulae = nebulaConfigs.map(n => ({
    x: W * n.px, y: H * n.py,
    rx: W * n.rxF, ry: H * n.ryF,
    angle: n.angle, hue: n.hue, alpha: n.alpha
  }));
}

function drawNebulae() {
  for (const n of nebulae) {
    ctx.save();
    ctx.translate(n.x, n.y);
    ctx.rotate(n.angle);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, n.rx);
    g.addColorStop(0, `hsla(${n.hue},70%,60%,${n.alpha})`);
    g.addColorStop(0.5, `hsla(${n.hue},60%,40%,${n.alpha * 0.5})`);
    g.addColorStop(1, `hsla(${n.hue},50%,20%,0)`);
    ctx.scale(1, n.ry / n.rx);
    ctx.beginPath();
    ctx.arc(0, 0, n.rx, 0, TAU);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  }
}

// ── BLACK HOLE ────────────────────────────────────────────
const bh = { x: 0, y: 0, r: 0, accretionParticles: [] };

function initBlackHole() {
  bh.x = W * 0.5;
  bh.y = H * 0.5;
  bh.r = Math.min(W, H) * 0.055;
  bh.accretionParticles = [];
  for (let i = 0; i < 180; i++) {
    const angle = rand(0, TAU);
    const dist  = bh.r * rand(1.3, 3.2);
    bh.accretionParticles.push({
      angle, dist,
      speed: rand(0.004, 0.016) * (Math.random() > 0.5 ? 1 : -1),
      alpha: rand(0.2, 0.9),
      hue: rand(15, 55),
      r: rand(0.5, 2.0)
    });
  }
}

function drawBlackHole() {
  for (let ring = 3; ring >= 1; ring--) {
    const g = ctx.createRadialGradient(bh.x, bh.y, bh.r * 0.9, bh.x, bh.y, bh.r * (1 + ring * 0.6));
    g.addColorStop(0, `rgba(255,180,60,${0.07/ring})`);
    g.addColorStop(0.4, `rgba(180,100,255,${0.04/ring})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(bh.x, bh.y, bh.r * (1 + ring * 0.6), 0, TAU);
    ctx.fillStyle = g;
    ctx.fill();
  }

  ctx.save();
  ctx.translate(bh.x, bh.y);
  ctx.scale(1, 0.28);
  for (const p of bh.accretionParticles) {
    p.angle += p.speed * (bh.r / p.dist);
    const x = Math.cos(p.angle) * p.dist;
    const y = Math.sin(p.angle) * p.dist;
    const fade = Math.max(0, 1 - (p.dist - bh.r) / (bh.r * 2.2));
    ctx.beginPath();
    ctx.arc(x, y, p.r, 0, TAU);
    ctx.fillStyle = `hsla(${p.hue},90%,70%,${p.alpha * fade})`;
    ctx.fill();
  }
  ctx.restore();

  const eg = ctx.createRadialGradient(bh.x, bh.y, 0, bh.x, bh.y, bh.r);
  eg.addColorStop(0, '#000000');
  eg.addColorStop(0.85, '#000000');
  eg.addColorStop(1, 'rgba(0,0,0,0.92)');
  ctx.beginPath();
  ctx.arc(bh.x, bh.y, bh.r, 0, TAU);
  ctx.fillStyle = eg;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(bh.x, bh.y, bh.r * 1.06, 0, TAU);
  ctx.strokeStyle = 'rgba(255,200,80,0.55)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

// ── PLANETS ───────────────────────────────────────────────
let planets = [];

function ci(x) {
  if (x <= 0) return 0;
  const gamma = 0.5772156649;
  let sum = 0, term = 1;
  for (let n = 1; n <= 20; n++) {
    term *= -(x * x) / (2 * n * (2 * n - 1));
    sum += term / (2 * n);
  }
  return gamma + Math.log(x) + sum;
}

function initPlanets() {
  planets = [
    { baseR: 0.14, size: 5,  color: '#a0c8ff', speed: 0.00042, name: 'Velion',   rings: false, useCi: false, angle: 0.8, moonAngle: 0.0, moonSpeed: 0.008, moonDist: 0,  moons: 0 },
    { baseR: 0.22, size: 9,  color: '#f5c842', speed: 0.00028, name: 'Aurantia', rings: true,  useCi: false, angle: 2.1, moonAngle: 1.2, moonSpeed: 0.006, moonDist: 28, moons: 1 },
    { baseR: 0.31, size: 6,  color: '#7de8b0', speed: 0.00018, name: 'Xyris',    rings: false, useCi: false, angle: 4.0, moonAngle: 0.5, moonSpeed: 0.007, moonDist: 0,  moons: 0 },
    { baseR: 0.40, size: 16, color: '#e0f4ff', speed: 0.00011, name: 'Magnara',  rings: true,  useCi: false, angle: 1.0, moonAngle: 2.4, moonSpeed: 0.005, moonDist: 44, moons: 2 },
    { baseR: 0.50, size: 4,  color: '#ff9f7a', speed: 0.00007, name: 'Cosphi',   rings: false, useCi: true,  angle: 5.2, moonAngle: 0.0, moonSpeed: 0.008, moonDist: 0,  moons: 0 },
  ];
}

function getPlanetPos(p) {
  let r = (Math.min(W, H) * 0.5 - bh.r * 1.1) * p.baseR + bh.r * 1.1;
  if (p.useCi) {
    const ciVal = ci(Math.abs(p.angle % TAU) + 0.5);
    r += ciVal * bh.r * 0.18;
  }
  return { x: bh.x + Math.cos(p.angle) * r, y: bh.y + Math.sin(p.angle) * r };
}

const planetLabel = document.createElement('div');
planetLabel.id = 'planet-label';
document.body.appendChild(planetLabel);

function drawPlanets() {
  for (const p of planets) {
    p.angle += p.speed;
    p.moonAngle += p.moonSpeed;
    const pos = getPlanetPos(p);
    const orbitR = (Math.min(W, H) * 0.5 - bh.r * 1.1) * p.baseR + bh.r * 1.1;

    ctx.beginPath();
    ctx.arc(bh.x, bh.y, orbitR, 0, TAU);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    if (p.rings) {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.scale(1, 0.32);
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 2.1, 0, TAU);
      ctx.strokeStyle = p.color + '55';
      ctx.lineWidth = p.size * 0.6;
      ctx.stroke();
      ctx.restore();
    }

    const glow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, p.size * 2.5);
    glow.addColorStop(0, p.color + 'aa');
    glow.addColorStop(0.4, p.color + '33');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, p.size * 2.5, 0, TAU);
    ctx.fillStyle = glow;
    ctx.fill();

    const body = ctx.createRadialGradient(pos.x - p.size * 0.3, pos.y - p.size * 0.3, 0, pos.x, pos.y, p.size);
    body.addColorStop(0, '#ffffff');
    body.addColorStop(0.3, p.color);
    body.addColorStop(1, '#111');
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, p.size, 0, TAU);
    ctx.fillStyle = body;
    ctx.fill();

    for (let m = 0; m < p.moons; m++) {
      const mAngle = p.moonAngle + (TAU / p.moons) * m;
      const mx = pos.x + Math.cos(mAngle) * p.moonDist;
      const my = pos.y + Math.sin(mAngle) * p.moonDist;
      ctx.beginPath();
      ctx.arc(mx, my, 1.8, 0, TAU);
      ctx.fillStyle = 'rgba(200,210,230,0.7)';
      ctx.fill();
    }

    p._sx = pos.x; p._sy = pos.y;
  }
}

// ── METEORS ───────────────────────────────────────────────
let meteors = [];
function spawnMeteor() {
  const side = Math.random() > 0.5;
  meteors.push({
    x: side ? rand(0, W) : (Math.random() > 0.5 ? -10 : W + 10),
    y: side ? -10 : rand(0, H * 0.5),
    vx: rand(3, 9) * (Math.random() > 0.5 ? 1 : -1),
    vy: rand(2, 6),
    len: rand(60, 180),
    alpha: rand(0.5, 1),
    width: rand(0.8, 2),
    life: 1
  });
}

function drawMeteors() {
  meteors = meteors.filter(m => m.life > 0);
  for (const m of meteors) {
    m.x += m.vx; m.y += m.vy;
    m.life -= 0.012;
    const angle = Math.atan2(m.vy, m.vx);
    const tx = m.x - Math.cos(angle) * m.len;
    const ty = m.y - Math.sin(angle) * m.len;
    const g = ctx.createLinearGradient(tx, ty, m.x, m.y);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.7, `rgba(200,220,255,${m.alpha * m.life * 0.6})`);
    g.addColorStop(1, `rgba(255,255,255,${m.alpha * m.life})`);
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(m.x, m.y);
    ctx.strokeStyle = g;
    ctx.lineWidth = m.width;
    ctx.stroke();
    if (m.x < -200 || m.x > W + 200 || m.y > H + 200) m.life = 0;
  }
}

// ── LENSING ───────────────────────────────────────────────
function drawLensing() {
  const t = time * 0.0008;
  for (let i = 1; i <= 3; i++) {
    const pulse = 1 + 0.04 * Math.sin(t * 3 + i);
    ctx.beginPath();
    ctx.arc(bh.x, bh.y, bh.r * (1.8 + i * 0.5) * pulse, 0, TAU);
    ctx.strokeStyle = `rgba(100,160,255,${0.04/i})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// ── PLANET HOVER ─────────────────────────────────────────
canvas.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  let found = false;
  for (const p of planets) {
    if (!p._sx) continue;
    const d = Math.hypot(e.clientX - p._sx, e.clientY - p._sy);
    if (d < p.size + 10) {
      planetLabel.textContent = p.useCi ? `${p.name}  ·  Ci(θ) orbit` : p.name;
      planetLabel.style.left = (p._sx + p.size + 12) + 'px';
      planetLabel.style.top  = (p._sy - 10) + 'px';
      planetLabel.classList.add('show');
      canvas.style.cursor = 'default';
      found = true;
      break;
    }
  }
  if (!found) {
    planetLabel.classList.remove('show');
    canvas.style.cursor = 'crosshair';
  }
});

canvas.addEventListener('mouseleave', () => {
  mouse.x = -9999; mouse.y = -9999;
  planetLabel.classList.remove('show');
});

// ── MAIN LOOP ─────────────────────────────────────────────
function init() {
  makeStars();
  makeNebulae();
  initBlackHole();
  initPlanets();
  buildFormulas();
}

function loop() {
  time++;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#02030a';
  ctx.fillRect(0, 0, W, H);

  drawNebulae();
  drawStars();
  drawLensing();
  drawBlackHole();
  drawPlanets();
  drawMeteors();

  const mdist = Math.hypot(mouse.x - bh.x, mouse.y - bh.y);
  if (mdist < bh.r * 4 && mdist > bh.r) {
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 3, 0, TAU);
    ctx.fillStyle = `rgba(255,200,80,${0.6 * (1 - mdist / (bh.r * 4))})`;
    ctx.fill();
  }

  if (time % 220 === 0) spawnMeteor();
  if (time % 380 === 0 && Math.random() > 0.4) spawnMeteor();

  requestAnimationFrame(loop);
}

// ── BOOT ─────────────────────────────────────────────────
window.addEventListener('resize', () => {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  makeStars();
  makeNebulae();
  initBlackHole();
});

resize();
loop();
setTimeout(() => greeting.classList.add('visible'), 700);
setTimeout(spawnMeteor, 1200);
setTimeout(spawnMeteor, 2800);
