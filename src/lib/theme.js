// Runtime brand-accent theming. The amber-* Tailwind scale and the shadcn
// primary/ring vars read from CSS variables (defaults in index.css); these
// helpers generate a full ramp from one accent color and apply it live.

export const DEFAULT_ACCENT = '#ff4d1c';
const STORAGE_KEY = 'gmos_accent';
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
// Lightness targets mirror the default signal-orange ramp so any accent keeps
// the same light→dark feel.
const L_TARGETS = [96, 92, 84, 73, 62, 55, 49, 40, 34, 28, 17];

function hexToRgb(hex) {
  const h = String(hex).replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(v, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgbStr(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
  }
  return `${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)}`;
}

export function rampFromHex(hex) {
  const { r, g, b } = hexToRgb(hex);
  const { h, s } = rgbToHsl(r, g, b);
  const ramp = {};
  STEPS.forEach((step, i) => { ramp[step] = hslToRgbStr(h, s, L_TARGETS[i]); });
  ramp[500] = `${r} ${g} ${b}`; // the picked color is the accent (500) itself
  return ramp;
}

export function applyAccent(hex) {
  if (!hex) return;
  const ramp = rampFromHex(hex);
  const root = document.documentElement;
  STEPS.forEach((step) => root.style.setProperty(`--accent-${step}`, ramp[step]));
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const hsl = `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
  ['--primary', '--ring', '--sidebar-primary', '--sidebar-ring'].forEach((v) => root.style.setProperty(v, hsl));
}

export function clearAccent() {
  const root = document.documentElement;
  STEPS.forEach((step) => root.style.removeProperty(`--accent-${step}`));
  ['--primary', '--ring', '--sidebar-primary', '--sidebar-ring'].forEach((v) => root.style.removeProperty(v));
}

// Apply + cache (so it persists instantly across loads). Pass null to reset.
export function setAccentCached(hex) {
  try {
    if (hex) localStorage.setItem(STORAGE_KEY, hex);
    else localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
  if (hex) applyAccent(hex); else clearAccent();
}

// Called once at startup to apply the cached accent before paint (no flash).
export function initAccent() {
  try {
    const hex = localStorage.getItem(STORAGE_KEY);
    if (hex) applyAccent(hex);
  } catch { /* ignore */ }
}
