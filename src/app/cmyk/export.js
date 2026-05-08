import { rgbToCmyk, buildGrid, rgbToHex } from './colourMath';

export function buildExportData(colours, step, spread) {
  const rows = [[
    'colour_group', 'label',
    'source_r', 'source_g', 'source_b', 'source_hex',
    'source_c', 'source_m', 'source_y', 'source_k',
    'swatch_index', 'is_nearest',
    'swatch_c', 'swatch_m', 'swatch_y', 'swatch_k',
    'swatch_hex', 'step_size', 'spread',
  ]];

  colours.forEach((entry, gi) => {
    const baseCmyk = rgbToCmyk(entry.r, entry.g, entry.b);
    const grid = buildGrid(entry, baseCmyk, step, spread);
    const sourceHex = rgbToHex(entry.r, entry.g, entry.b).toUpperCase();
    const groupLabel = (entry.label || `RGB(${entry.r},${entry.g},${entry.b})`).replace(/,/g, ' ');

    grid.forEach((sw, i) => {
      rows.push([
        gi + 1, groupLabel,
        entry.r, entry.g, entry.b, sourceHex,
        baseCmyk.c, baseCmyk.m, baseCmyk.y, baseCmyk.k,
        i + 1, i === 0 ? 'TRUE' : 'FALSE',
        sw.c, sw.m, sw.y, sw.k,
        rgbToHex(sw.r, sw.g, sw.b).toUpperCase(),
        step, spread,
      ]);
    });
  });

  return rows.map(r => r.join(',')).join('\n');
}

export function downloadCSV(colours, step, spread) {
  const csv = buildExportData(colours, step, spread);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cmyk-grid-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Figma Variables Export ───────────────────────────────────────────────────
// Exports the Radix 12-step scale as Figma Variables with Light + Dark modes.
//
// OUTPUT: Two DTCG-format JSON files — figma-light.json and figma-dark.json
//
// HOW TO IMPORT (native Figma — no plugin needed):
//   1. Open Figma → Variables panel (left sidebar or Edit menu)
//   2. Create a new collection named "CMYK Colour System"
//   3. Add a "Light" mode and a "Dark" mode
//   4. Right-click "Light" mode → Import mode → select figma-light.json
//   5. Right-click "Dark" mode → Import mode → select figma-dark.json
//   6. You now have the Light/Dark mode switcher on every variable
//
// ALTERNATIVELY — drag both files at once into the Variables modal.
// Figma creates one mode per file automatically.

import { generateRadixPalette, STEP_LABELS } from './radixPalette';

function toHex(r, g, b) {
  return '#' + [r, g, b].map(v =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  ).join('');
}

// DTCG color token — Figma native import format (2024)
function colorToken(r, g, b, description) {
  return {
    $type: 'color',
    $value: {
      colorSpace: 'srgb',
      components: [
        parseFloat((r / 255).toFixed(8)),
        parseFloat((g / 255).toFixed(8)),
        parseFloat((b / 255).toFixed(8)),
      ],
      alpha: 1,
      hex: toHex(r, g, b),
    },
    ...(description ? { $description: description } : {}),
  };
}

// Sanitise group name for Figma variable naming
function sanitise(str) {
  return str.replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/\s+/g, ' ') || 'Colour';
}

// Build one DTCG token file for a given mode
function buildModeTokens(colours, modeKey) {
  const root = {};

  colours.forEach(entry => {
    const palette   = generateRadixPalette(entry.r, entry.g, entry.b);
    const scale     = modeKey === 'light' ? palette.light : palette.dark;
    const groupName = sanitise(entry.label || `RGB ${entry.r} ${entry.g} ${entry.b}`);

    root[groupName] = { $type: 'color' };

    scale.forEach((step, i) => {
      // e.g. "Pantone 485/01 App BG"
      const stepNum = String(i + 1).padStart(2, '0');
      const key = `${stepNum} ${STEP_LABELS[i]}`;
      root[groupName][key] = colorToken(
        step.r, step.g, step.b,
        `Step ${i + 1} of 12 · ${STEP_LABELS[i]}`
      );
    });

    // Convenience alias — the raw source colour
    root[groupName]['00 Brand Solid'] = colorToken(
      entry.r, entry.g, entry.b,
      'Source colour — use as primary brand fill'
    );
  });

  return root;
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadFigmaVariables(colours) {
  const date = new Date().toISOString().slice(0, 10);
  downloadJSON(buildModeTokens(colours, 'light'), `figma-light-${date}.json`);
  // Stagger downloads so browser doesn't suppress the second
  setTimeout(() => {
    downloadJSON(buildModeTokens(colours, 'dark'), `figma-dark-${date}.json`);
  }, 400);
}
