/**
 * Dynamic Weather Card - 100% Original Engine Scoped to Weather Card
 * Extended with font Open Sans, Digital Clock, increased height
 */

const TAG = 'weather-card-dynamic-bg';
const VERSION = '1.0.0';

const DEFAULTS = {
  entity: '',
  weatherentity: '',
  sunentity: 'sun.sun',
  name: '',
  show_forecast: true,
  forecast_type: 'hourly',
  forecast_slots: 6,
  show_clock: true,
  show_date: true,
  card_min_height: 280,
  precipitationentity: '',
  pm25entity: '',
  kpentity: '',
  warningentity: '',
  animations: true,
  intensity: 100,
  hysteresis: 10,
  darkdim: 40,
  lightlift: 10,
  lightningflash: true,
  showmoon: true,
  showstars: true,
  showshootingstars: true,
  sunazimuth: true,
  showrainbow: true,
  showfrost: true,
};

// --- utils ---
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

const hex = (h) => {
  const s = h.startsWith('#') ? h.slice(1) : h;
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};

const mixRgb = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const mixPal = (p, q, t) => p.map((c, i) => mixRgb(c, q[i], t));
const rgb = (c, a) =>
  a === undefined
    ? `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`
    : `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
const luminance = (c) => {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
};
const num = (v) => {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
};
const mulberry = (seed) => {
  seed = seed | 0;
  seed = (seed + 0x6d2b79f5) | 0;
  return () => {
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    seed = (seed + 0x6d2b79f5) | 0;
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// --- palettes ---
const CLEARKEYS = [
  [-90, ['050b1e', '0a1430', '111f42', '1a2c55']],
  [-18, ['08122b', '0f1d3e', '172a52', '223a68']],
  [-12, ['0d1a3d', '162852', '223868', '334b7e']],
  [-6, ['17285a', '2c3f78', '5a5b8c', '9a7591']],
  [-2, ['26407e', '4e5e98', 'bb7f8b', 'f2a06f']],
  [2, ['2f58a8', '5f82c4', 'd1a296', 'f6c08a']],
  [6, ['2f62bd', '5689d2', '9db8dc', 'e9d2b4']],
  [12, ['2a63c6', '4384da', '72a8e6', 'a9cdf1']],
  [30, ['2560c8', '3b7edb', '5f9de8', '8cc0f2']],
  [90, ['235cc4', '387ad8', '5b98e6', '87bbf0']],
].map(([e, p]) => [e, p.map(hex)]);

const WEATHERPAL = {
  overcast: { day: ['6f7782', '646c78', '5d6570', '575f6a'], night: ['121a28', '192334', '212d40', '2a384d'] },
  rain: { day: ['4b525c', '454c56', '40474f', '3b424a'], night: ['0d131c', '141b26', '1b2431', '232d3b'] },
  storm: { day: ['232a35', '2e3643', '3c4553', '4d5663'], night: ['080b12', '0e131c', '151b26', '1c2330'] },
  snow: { day: ['6d82a0', '8699b2', 'a6b5c8', 'c8d3df'], night: ['18223a', '212d47', '2d3a56', '3b4966'] },
  fog: { day: ['8a96a4', '9da8b4', 'b1bac4', 'c5ccd4'], night: ['1b212b', '232a35', '2c3440', '363e4b'] },
};
for (const k of Object.keys(WEATHERPAL)) {
  WEATHERPAL[k].day = WEATHERPAL[k].day.map(hex);
  WEATHERPAL[k].night = WEATHERPAL[k].night.map(hex);
}

const CONDITIONS = {
  sunny: { cov: 5 },
  'clear-night': { cov: 5 },
  partlycloudy: { cov: 45 },
  cloudy: { cov: 85, pal: 'overcast' },
  fog: { cov: 80, pal: 'fog', fog: 1 },
  rainy: { cov: 90, pal: 'rain', rain: 0.55 },
  pouring: { cov: 100, pal: 'rain', rain: 1, k: 1 },
  lightning: { cov: 90, pal: 'storm', storm: 1 },
  'lightning-rainy': { cov: 100, pal: 'storm', rain: 0.85, storm: 1, k: 1 },
  snowy: { cov: 90, pal: 'snow', snow: 0.6 },
  'snowy-rainy': { cov: 95, pal: 'rain', rain: 0.35, snow: 0.35 },
  hail: { cov: 95, pal: 'storm', hail: 0.7 },
  windy: { cov: 30, wind: 40 },
  'windy-variant': { cov: 65, wind: 40 },
  exceptional: { cov: 75, pal: 'overcast' },
};

function clearPalette(e) {
  for (let i = 1; i < CLEARKEYS.length; i++) {
    const [e1, p1] = CLEARKEYS[i];
    if (e <= e1) {
      const [e0, p0] = CLEARKEYS[i - 1];
      return mixPal(p0, p1, smooth(0, 1, (e - e0) / (e1 - e0)));
    }
  }
  return CLEARKEYS[CLEARKEYS.length - 1][1];
}

function moonPhase(date) {
  const synodic = 29.530588853;
  const ref = Date.UTC(2000, 0, 6, 18, 14);
  let p = ((date.getTime() - ref) / 86400000 / synodic) % 1;
  return p < 0 ? p + 1 : p;
}

function computeScene(input, cfg) {
  const e = input.elevation;
  const info = CONDITIONS[input.condition] || { cov: 50 };
  const precip = !!(info.rain || info.snow || info.storm || info.hail || info.fog);
  let cov = num(input.coverage);
  cov = cov !== undefined ? cov : info.cov;
  if (precip) cov = Math.max(cov, 80);

  const day = smooth(-6, 6, e);
  const windKmh = Math.max(num(input.windKmh) ?? 0, info.wind ?? 0);
  const bearing = num(input.windBearing);
  const dirX = bearing !== undefined ? 0.6 * -Math.sin((bearing * Math.PI) / 180) : 0.6;

  let pal = clearPalette(e);
  const palKey = info.pal || 'overcast';
  const wp = mixPal(WEATHERPAL[palKey].night, WEATHERPAL[palKey].day, day);
  const k = precip ? (info.k ?? 0.85) : smooth(40, 95, cov) * 0.97;
  pal = mixPal(pal, wp, k);

  const fogVis = num(input.visibility);
  let fog = info.fog ? 1 : 0;
  if (fogVis !== undefined) fog = Math.max(fog, 1 - smooth(1, 8, fogVis));

  const skyLum = (luminance(pal[0]) + luminance(pal[1]) + luminance(pal[2])) / 3;
  const skyDark = 1 - smooth(0.06, 0.4, skyLum);
  const scale = (cfg.intensity || 100) / 100;
  let rain = (info.rain || 0) * scale;
  const rate = num(input.precipRate);
  if (rate !== undefined && info.rain) rain = clamp(rate / 6, 0.12, 1) * scale;

  const az = num(input.azimuth);
  const sunX = cfg.sunazimuth && az !== undefined ? lerp(0.08, 0.92, clamp((az - 90) / 180, 0, 1)) : 0.86;
  const sunY = lerp(0.34, -0.06, smooth(0, 35, e));
  const sunVis = day * (1 - smooth(45, 95, cov)) * (precip ? 0.15 : 1);

  return {
    condition: input.condition,
    gradient: `linear-gradient(180deg, ${rgb(pal[0])} 0%, ${rgb(pal[1])} 38%, ${rgb(pal[2])} 72%, ${rgb(pal[3])} 100%)`,
    skyLum,
    skyDark,
    day,
    sun: sunVis,
    sunX,
    sunY,
    sunWarm: 1 - smooth(4, 22, e),
    moon: cfg.showmoon ? (1 - smooth(-6, 3, e)) * (1 - smooth(35, 97, cov) * 0.92) * (info.storm ? 0.35 : 1) : 0,
    stars: cfg.showstars ? (1 - smooth(-14, -5, e)) * (1 - smooth(25, 70, cov)) : 0,
    sheet: Math.max(smooth(55, 98, cov), precip ? 0.9 : 0) * (1 - fog * 0.5),
    cloudCount: smooth(5, 45, cov) * (1 - fog * 0.85),
    cloudLow: smooth(45, 95, cov) * (1 - fog * 0.85),
    cloudAlpha: lerp(0.9, 1, day),
    cloudTone: clamp(Math.max(precip ? k * 0.9 : 0.25 + k * 0.5, palKey === 'snow' ? 0.4 : palKey === 'fog' ? 0.3 : 1 - day * 0.85), 0, 1),
    cloudSpeed: 3 + windKmh * 0.3 * (dirX >= 0 ? 1 : -1),
    rain,
    snow: (info.snow || 0) * scale,
    hail: (info.hail || 0) * scale,
    storm: info.storm ? 1 : 0,
    fog,
    tilt: clamp((dirX * windKmh) / 55, -0.5, 0.5),
    drift: dirX * windKmh * 0.7,
    phase: input.moonPhase,
    shooting: !!cfg.showshootingstars,
  };
}

function makeNoise(seed) {
  const r = mulberry(seed);
  const v = new Float32Array(256 * 256);
  for (let i = 0; i < v.length; i++) v[i] = r();
  return (x, y, px) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = x - xi;
    const fy = y - yi;
    const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
    const uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
    const p = px || 256;
    const x0 = ((xi % p) + p) % 255;
    const x1 = (((xi + 1) % p) + p) % 255;
    const y0 = yi % 255;
    const y1 = (yi + 1) % 255;
    const a = v[y0 * 256 + x0];
    const b = v[y0 * 256 + x1];
    const c = v[y1 * 256 + x0];
    const d = v[y1 * 256 + x1];
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  };
}

function fbm(noise, x, y, oct, px) {
  let sum = 0,
    amp = 0.5,
    norm = 0,
    f = 1;
  for (let i = 0; i < oct; i++) {
    sum += amp * noise(x * f, y * f, px ? px * f : 0);
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
}

class CloudDeck {
  constructor(seed, W, H, cover) {
    this.W = W;
    this.H = H;
    this.cover = cover;
    this.n = makeNoise(seed);
    this.n2 = makeNoise(71);
    this.S = new Float32Array(W * H);
    this.F = new Float32Array(W * H);
    this.row = 0;
  }
  get done() {
    return this.row >= this.H;
  }
  step(rows) {
    const { W, H, n, n2, S, F, cover } = this;
    const P = 6;
    const end = Math.min(H, this.row + rows);
    for (let y = this.row; y < end; y++) {
      const v = y / H;
      const vv = v * 2.6;
      const env = smooth(1, 0.1, v);
      for (let x = 0; x < W; x++) {
        const u = (x / W) * P;
        const wx = (fbm(n2, u, vv, 2, P) - 0.5) * 0.35;
        const wy = (fbm(n2, u + 9, vv + 4, 2, P) - 0.5) * 0.3;
        const lo = fbm(n, u + wx, vv + wy, 4, P);
        const bl = 1 - Math.abs(2 * fbm(n2, u + wx * 2, vv + wy * 2, 3, P * 2) - 1);
        const hi = fbm(n, u + wx * 5, vv + wy * 5, 4, P * 5);
        const base = (lo * 0.65 + bl * 0.35 - 0.5) * 3 + 0.5;
        const i = y * W + x;
        S[i] = base - (1 - cover * 0.8) * env * 0.08 - 0.14;
        F[i] = S[i] + (hi - 0.5) * 0.75;
      }
    }
    this.row = end;
    return this.done;
  }
  paint(pal, fadeTop) {
    const { W, H, S, F } = this;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    const img = g.createImageData(W, H);
    const px = img.data;
    const [lit, mid, shade] = pal;
    const k = H * 0.015;
    for (let y = 1; y < H - 1; y++) {
      const fadeV = smooth(1, 0.55, y / H) * (fadeTop ? smooth(0, 0.35, y / H) : 1);
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const d = smooth(-0.25, 0.75, F[i]);
        if (d <= 0) continue;
        const gx = (S[y * W + ((x + 1) % W)] - S[y * W + ((x - 1 + W) % W)]) * k;
        const gy = (S[i + W] - S[i - W]) * k;
        const l = clamp((gx * 0.25 + gy * 0.9 + 0.45) / Math.hypot(gx, gy, 1), 0, 1);
        const t = clamp(d * 0.95 + (l - 0.5) * 0.12, 0, 1);
        const a = t < 0.5 ? t * 2 : (t - 0.5) * 2;
        const c0 = t < 0.5 ? shade : mid;
        const c1 = t < 0.5 ? mid : lit;
        const o = i * 4;
        px[o] = c0[0] + (c1[0] - c0[0]) * a;
        px[o + 1] = c0[1] + (c1[1] - c0[1]) * a;
        px[o + 2] = c0[2] + (c1[2] - c0[2]) * a;
        px[o + 3] = 255 * Math.min(1, d * 1.6) * fadeV;
      }
    }
    g.putImageData(img, 0, 0);

    const out = document.createElement('canvas');
    out.width = W * 2;
    out.height = H;
    const og = out.getContext('2d');
    og.drawImage(c, 0, 0, W, H);
    og.drawImage(c, W, 0, W, H);
    return out;
  }
}

const DECKPAL = {
  white: [
    [250, 251, 253],
    [216, 224, 235],
    [168, 186, 212],
  ],
  grey: [
    [184, 189, 197],
    [143, 149, 158],
    [108, 116, 127],
  ],
  dark: [
    [138, 144, 152],
    [98, 105, 115],
    [72, 79, 89],
  ],
  night: [
    [86, 96, 116],
    [58, 68, 88],
    [38, 48, 68],
  ],
};

function makeWaterDropSprite() {
  const S = 64;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const rad = (x, y, r, stops) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    for (const [o, col] of stops) gr.addColorStop(o, col);
    g.fillStyle = gr;
    g.fillRect(0, 0, S, S);
  };
  rad(32, 34, 30, [
    [0, 'rgba(0,0,0,0)'],
    [0.76, 'rgba(0,0,0,0)'],
    [0.9, 'rgba(0,0,0,0.3)'],
    [1, 'rgba(0,0,0,0)'],
  ]);
  g.save();
  g.beginPath();
  g.arc(32, 32, 27, 0, Math.PI * 2);
  g.clip();
  rad(32, 32, 27, [
    [0, 'rgba(255,255,255,0.04)'],
    [1, 'rgba(255,255,255,0.12)'],
  ]);
  rad(32, 20, 16, [
    [0, 'rgba(0,0,0,0.14)'],
    [1, 'rgba(0,0,0,0)'],
  ]);
  rad(32, 44, 19, [
    [0, 'rgba(255,255,255,0.6)'],
    [1, 'rgba(255,255,255,0)'],
  ]);
  g.restore();
  rad(24, 20, 6, [
    [0, 'rgba(255,255,255,0.9)'],
    [1, 'rgba(255,255,255,0)'],
  ]);
  return c;
}

const LAYERCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600&display=swap');

  :host {
    display: block;
    position: relative;
    border-radius: var(--ha-card-border-radius, 12px);
    overflow: hidden;
  }
  ha-card {
    min-height: var(--card-min-height, 280px);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
    background: transparent;
  }
  .sky-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 1;
    border-radius: inherit;
  }
  .sun {
    position: absolute;
    border-radius: 50%;
    width: 140px;
    height: 140px;
    transform: translate(-50%, -50%);
    opacity: 0;
    transition: opacity 2.5s ease, left 5s ease, top 5s ease;
  }
  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .flash {
    position: absolute;
    inset: 0;
    opacity: 0;
    background: radial-gradient(ellipse at 30% 0%, rgba(232,238,255,.95) 0%, rgba(175,190,255,0) 80%);
  }
  .card-container {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .clock-container {
    font-family: 'Open Sans', sans-serif;
    color: #ffffff;
    text-align: center;
    padding: 16px;
    user-select: none;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
  }
  .clock-time {
    font-size: 3.2rem;
    font-weight: 300;
    line-height: 1;
    letter-spacing: -1px;
  }
  .clock-date {
    font-size: 0.95rem;
    font-weight: 400;
    margin-top: 6px;
    text-transform: none;
    opacity: 0.9;
  }
  hui-weather-forecast-card {
    --ha-card-background: transparent !important;
    --ha-card-box-shadow: none !important;
    --ha-card-border-width: 0px !important;
    color: #ffffff !important;
    --primary-text-color: #ffffff !important;
    --secondary-text-color: rgba(255, 255, 255, 0.85) !important;
  }
  .temp-attribute .temp {
    font-family: var(--primary-font-family) !important;
  }
`;

class ScopedSkyRenderer {
  constructor(root) {
    this.root = root;
    this.sky = root.getElementById('sky');
    this.sun = root.getElementById('sun');
    this.flash = root.getElementById('flash');
    this.canvas = root.getElementById('fx-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.skyCanvas = root.getElementById('sky-canvas');
    this.sctx = this.skyCanvas.getContext('2d');
    this.cloudCanvas = root.getElementById('cloud-canvas');
    this.cctx = this.cloudCanvas.getContext('2d');
    this.glassCanvas = root.getElementById('glass-canvas');
    this.gctx = this.glassCanvas.getContext('2d');

    this.dropSprite = makeWaterDropSprite();
    this.decks = [new CloudDeck(4100, 480, 200, 0.45), new CloudDeck(4200, 480, 200, 0.62)];
    this.deckImg = {};
    this.sheetX = [0, 0];
    this.glass = [];
    this.glassAcc = 0;
    this.running = false;
    this.w = 360;
    this.h = 280;
  }

  resize(w, h) {
    this.w = w;
    this.h = h;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const [cv, cx] of [
      [this.canvas, this.ctx],
      [this.skyCanvas, this.sctx],
      [this.cloudCanvas, this.cctx],
      [this.glassCanvas, this.gctx],
    ]) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const r = mulberry(1234);
    this.drops = Array.from({ length: 65 }, () => {
      const q = r();
      const z = q < 0.5 ? 0 : q < 0.82 ? 1 : 2;
      const L = [
        [9, 7, 620, 160],
        [16, 12, 880, 220],
        [30, 26, 1250, 320],
      ][z];
      return {
        x: r() * this.w,
        y: r() * this.h,
        len: L[0] + r() * L[1],
        sp: L[2] + r() * L[3],
        z,
      };
    });

    this.flakes = Array.from({ length: 45 }, () => ({
      x: r() * this.w,
      y: r() * this.h,
      sz: 1.5 + Math.pow(r(), 2) * 4.2,
      sp: 22 + r() * 18,
      a: 0.55 + r() * 0.45,
    }));

    this.stars = Array.from({ length: 50 }, () => ({
      x: r() * this.w,
      y: r() * this.h * 0.75,
      s: r() < 0.88 ? 0.7 + r() * 0.8 : 1.6 + r() * 0.9,
      a: 0.4 + r() * 0.6,
    }));

    const stepGen = () => {
      let pending = false;
      for (const d of this.decks) {
        if (!d.done) {
          d.step(24);
          pending = true;
        }
      }
      if (pending) setTimeout(stepGen, 16);
    };
    stepGen();
  }

  setScene(scene) {
    this.cur = scene;
    if (this.sky) this.sky.style.background = scene.gradient;
    this.sun.style.opacity = scene.sun.toFixed(3);
    this.sun.style.left = `${(scene.sunX * 100).toFixed(1)}%`;
    this.sun.style.top = `${(scene.sunY * 100).toFixed(1)}%`;
    this.sun.style.background = 'radial-gradient(circle, rgba(255,250,232,0.95) 0%, rgba(255,226,180,0.5) 20%, rgba(255,196,140,0) 60%)';
  }

  getDeck(i, pal) {
    const d = this.decks[i];
    if (!d.done) return null;
    const key = `${i}-${pal}`;
    if (!this.deckImg[key]) this.deckImg[key] = d.paint(DECKPAL[pal], false);
    return this.deckImg[key];
  }

  newGlassDrop(r) {
    return {
      x: r() * this.w,
      y: r() * this.h,
      r: 2.2 + Math.pow(r(), 2.5) * 8.5,
      life: 0,
      max: 6 + r() * 12,
      slide: false,
      vy: 0,
    };
  }

  stepGlass(dt, c) {
    const cap = 35;
    const r = Math.random;
    if (c.rain > 0.05 && this.glass.length < cap) {
      this.glassAcc += dt * c.rain * 6;
      while (this.glassAcc >= 1) {
        this.glassAcc -= 1;
        this.glass.push(this.newGlassDrop(r));
      }
    }
    const trail = [];
    this.glass = this.glass.filter((d) => {
      d.life += dt;
      if (!d.slide && d.r > 4.6 && r() * dt > 0.12) d.slide = true;
      if (d.slide) {
        d.vy = Math.min(d.vy + 45 * dt, 70);
        d.y += d.vy * dt;
        if (r() * dt > 0.22) {
          trail.push({ x: d.x, y: d.y - d.r, r: d.r * 0.25, life: 0, max: 2 + r() * 3, slide: false, vy: 0 });
        }
      }
      return d.y < this.h + 20 && d.life < d.max;
    });
    if (this.glass.length < cap * 1.3) this.glass.push(...trail);
  }

  start() {
    if (this.running) return;
    this.running = true;
    let last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      this.step(dt);
      this.draw(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
  }

  step(dt) {
    const c = this.cur;
    if (!c) return;
    const r = Math.random;

    if (c.rain > 0.01 && this.drops) {
      for (const d of this.drops) {
        d.y += d.sp * dt;
        d.x += d.sp * dt * c.tilt;
        if (d.y > this.h) {
          d.y = -d.len;
          d.x = r() * this.w;
        }
      }
    }

    if (c.snow > 0.01 && this.flakes) {
      for (const p of this.flakes) {
        p.y += p.sp * dt;
        p.x += Math.sin(p.y * 0.05) * 0.5;
        if (p.y > this.h) {
          p.y = -10;
          p.x = r() * this.w;
        }
      }
    }

    this.stepGlass(dt, c);

    if (c.cloudCount > 0.01) {
      this.sheetX[0] += c.cloudSpeed * 0.35 * dt * 15;
      this.sheetX[1] += c.cloudSpeed * 0.5 * dt * 15;
    }
  }

  draw(dt) {
    const c = this.cur;
    if (!c) return;

    this.sctx.clearRect(0, 0, this.w, this.h);
    if (c.stars > 0.01 && this.stars) {
      this.sctx.fillStyle = '#ffffff';
      for (const s of this.stars) {
        this.sctx.globalAlpha = s.a * c.stars;
        this.sctx.fillRect(s.x, s.y, s.s, s.s);
      }
      this.sctx.globalAlpha = 1;
    }

    this.cctx.clearRect(0, 0, this.w, this.h);
    if (c.cloudCount > 0.01) {
      const pal = c.day > 0.5 ? (c.cloudTone > 0.6 ? 'grey' : 'white') : 'night';
      const img0 = this.getDeck(0, pal);
      const img1 = this.getDeck(1, pal);
      const blit = (img, xs, y0, hh) => {
        const T = img.width / 2;
        let ox = ((-xs % T) + T) % T;
        this.cctx.drawImage(img, ox, 0, T, img.height, 0, y0, this.w, hh);
      };
      if (img0) {
        this.cctx.globalAlpha = c.cloudCount * c.cloudAlpha * 0.65;
        blit(img0, this.sheetX[0], -0.05 * this.h, this.h * 0.7);
      }
      if (img1) {
        this.cctx.globalAlpha = c.cloudLow * c.cloudAlpha * 0.75;
        blit(img1, this.sheetX[1], -0.1 * this.h, this.h * 0.85);
      }
      this.cctx.globalAlpha = 1;
    }

    this.gctx.clearRect(0, 0, this.w, this.h);
    if (this.glass.length) {
      for (const d of this.glass) {
        const fade = Math.min(1, d.life / 2, (d.max - d.life) / 1.2);
        if (fade <= 0.01) continue;
        this.gctx.globalAlpha = fade * 0.95;
        const s = d.r * 2.3;
        this.gctx.drawImage(this.dropSprite, d.x - s / 2, d.y - s / 2, s, s);
      }
      this.gctx.globalAlpha = 1;
    }

    this.ctx.clearRect(0, 0, this.w, this.h);
    if (c.rain > 0.01 && this.drops) {
      this.ctx.lineCap = 'round';
      const col = c.day > 0.5 ? '215,230,248' : '176,194,222';
      for (const d of this.drops) {
        this.ctx.strokeStyle = `rgba(${col},0.32)`;
        this.ctx.lineWidth = d.z === 0 ? 0.8 : d.z === 1 ? 1.1 : 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(d.x, d.y);
        this.ctx.lineTo(d.x - d.len * c.tilt, d.y + d.len);
        this.ctx.stroke();
      }
    }
  }
}

class WeatherCardDynamicBg extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._clockTimer = null;
  }

  setConfig(config) {
    const entity = config.entity || config.weatherentity;
    if (!entity) throw new Error('Podaj entity');
    this._config = { ...DEFAULTS, ...config, entity };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._forecastCard) this._forecastCard.hass = hass;
    this._updateScene();
  }

  _updateClock() {
    const timeEl = this.shadowRoot.getElementById('clock-time');
    const dateEl = this.shadowRoot.getElementById('clock-date');
    if (!timeEl) return;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    timeEl.textContent = `${hours}:${minutes}`;

    if (dateEl && this._config.show_date) {
      dateEl.textContent = now.toLocaleDateString('pl-PL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }
  }

  _startClock() {
    if (this._clockTimer) clearInterval(this._clockTimer);
    this._updateClock();
    this._clockTimer = setInterval(() => this._updateClock(), 1000);
  }

  _stopClock() {
    if (this._clockTimer) {
      clearInterval(this._clockTimer);
      this._clockTimer = null;
    }
  }

  _render() {
    const minHeight = this._config.card_min_height || 280;
    this.shadowRoot.innerHTML = `
      <style>
        ${LAYERCSS}
        :host {
          --card-min-height: ${minHeight}px;
        }
      </style>
      <ha-card>
        <div class="sky-layer">
          <div class="sun" id="sun"></div>
          <canvas id="sky-canvas"></canvas>
          <canvas id="cloud-canvas"></canvas>
          <canvas id="glass-canvas"></canvas>
          <canvas id="fx-canvas"></canvas>
          <div class="flash" id="flash"></div>
        </div>
        <div class="card-container">
          ${
            this._config.show_clock
              ? `
            <div class="clock-container">
              <div class="clock-time" id="clock-time">--:--</div>
              ${this._config.show_date ? `<div class="clock-date" id="clock-date"></div>` : ''}
            </div>
          `
              : ''
          }
          <div id="content"></div>
        </div>
      </ha-card>
    `;

    const el = document.createElement('hui-weather-forecast-card');
    el.setConfig({
      type: 'weather-forecast',
      entity: this._config.entity,
      name: this._config.name,
      show_forecast: this._config.show_forecast,
      forecast_type: this._config.forecast_type,
      forecast_slots: num(this._config.forecast_slots) ?? 6,
    });
    if (this._hass) el.hass = this._hass;

    const cont = this.shadowRoot.getElementById('content');
    cont.innerHTML = '';
    cont.appendChild(el);
    this._forecastCard = el;

    const injectTransparentStyle = () => {
      if (el.shadowRoot) {
        const s = document.createElement('style');
        s.textContent = `
          ha-card {
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            color: #ffffff !important;
            font-family: 'Open Sans', sans-serif !important;
            font-weight: 300;
            --primary-text-color: #ffffff !important;
            --secondary-text-color: rgba(255, 255, 255, 0.85) !important;
          }
        `;
        el.shadowRoot.appendChild(s);
      } else {
        setTimeout(injectTransparentStyle, 50);
      }
    };
    injectTransparentStyle();

    this._renderer = new ScopedSkyRenderer(this.shadowRoot);
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        if (width > 0 && height > 0) {
          this._renderer.resize(width, height);
        }
      }
    });
    ro.observe(this);

    if (this._config.show_clock) this._startClock();
    if (this._config.animations) this._renderer.start();
  }

  _updateScene() {
    if (!this._hass || !this._config || !this._renderer) return;
    const w = this._hass.states[this._config.entity];
    const s = this._hass.states[this._config.sunentity || 'sun.sun'];
    if (!w) return;

    const elevation = s ? num(s.attributes?.elevation) : 25;
    const now = new Date();

    const scene = computeScene(
      {
        condition: w.state,
        elevation: elevation !== undefined ? elevation : 20,
        coverage: num(w.attributes?.cloud_coverage),
        windKmh: num(w.attributes?.wind_speed),
        windBearing: num(w.attributes?.wind_bearing),
        moonPhase: moonPhase(now),
      },
      this._config,
    );

    this._renderer.setScene(scene);
  }

  connectedCallback() {
    if (this._renderer && this._config?.animations) this._renderer.start();
    if (this._config?.show_clock) this._startClock();
  }

  disconnectedCallback() {
    if (this._renderer) this._renderer.stop();
    this._stopClock();
  }

  getCardSize() {
    return 6;
  }
}

customElements.define(TAG, WeatherCardDynamicBg);
