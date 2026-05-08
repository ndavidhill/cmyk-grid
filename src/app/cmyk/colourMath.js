// ─── Conversion ───────────────────────────────────────────────────────────────

export function rgbToCmyk(r, g, b) {
  const rp = r / 255, gp = g / 255, bp = b / 255;
  const k = 1 - Math.max(rp, gp, bp);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  const c = (1 - rp - k) / (1 - k);
  const m = (1 - gp - k) / (1 - k);
  const y = (1 - bp - k) / (1 - k);
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

export function cmykToRgb(c, m, y, k) {
  return {
    r: Math.round(255 * (1 - c / 100) * (1 - k / 100)),
    g: Math.round(255 * (1 - m / 100) * (1 - k / 100)),
    b: Math.round(255 * (1 - y / 100) * (1 - k / 100)),
  };
}

export function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if ([r, g, b].some(isNaN)) return null;
  return { r, g, b };
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

// ─── Grid generation ──────────────────────────────────────────────────────────

export function clamp(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

function deltaE(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function generateNeighbours(baseCmyk, step, range) {
  const { c, m, y, k } = baseCmyk;
  const offsets = [];
  for (let dc = -range; dc <= range; dc++)
    for (let dm = -range; dm <= range; dm++)
      for (let dy = -range; dy <= range; dy++)
        for (let dk = -range; dk <= range; dk++)
          offsets.push([dc, dm, dy, dk]);

  return offsets.map(([dc, dm, dy, dk]) => {
    const nc = clamp(c + dc * step);
    const nm = clamp(m + dm * step);
    const ny = clamp(y + dy * step);
    const nk = clamp(k + dk * step);
    const rgb = cmykToRgb(nc, nm, ny, nk);
    return { c: nc, m: nm, y: ny, k: nk, ...rgb };
  });
}

export function buildGrid(sourceRgb, baseCmyk, step, spread) {
  const neighbours = generateNeighbours(baseCmyk, step, spread);
  const seen = new Set();
  const unique = neighbours.filter(sw => {
    const key = `${sw.c}-${sw.m}-${sw.y}-${sw.k}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  unique.sort((a, b) =>
    deltaE(a.r, a.g, a.b, sourceRgb.r, sourceRgb.g, sourceRgb.b) -
    deltaE(b.r, b.g, b.b, sourceRgb.r, sourceRgb.g, sourceRgb.b)
  );
  return unique.slice(0, 25);
}

// ─── Readability ──────────────────────────────────────────────────────────────

export function useDarkText(r, g, b) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.45;
}
