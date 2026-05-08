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
// Exports the Radix 12-step scale in DTCG (Design Tokens Community Group) format.
// Native import: Figma → Variables panel → right-click mode → Import mode
// Each mode (Light / Dark) is a separate JSON file for native import.
// Also exports a combined file for Tokens Studio plugin.

import { generateRadixPalette, STEP_LABELS } from './radixPalette';

function toHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}

// DTCG color token — Figma native format
function colorToken(r, g, b, description) {
  return {
    $type: 'color',
    $value: {
      colorSpace: 'srgb',
      components: [
        parseFloat((r / 255).toFixed(6)),
        parseFloat((g / 255).toFixed(6)),
        parseFloat((b / 255).toFixed(6)),
      ],
      alpha: 1,
      hex: toHex(r, g, b),
    },
    $description: description || '',
  };
}

// Build one DTCG token set for a given mode (light or dark)
function buildModeTokens(colours, modeKey) {
  const tokens = {};

  colours.forEach(entry => {
    const palette   = generateRadixPalette(entry.r, entry.g, entry.b);
    const scale     = modeKey === 'light' ? palette.light : palette.dark;
    const groupName = (entry.label || `RGB ${entry.r} ${entry.g} ${entry.b}`)
      .replace(/[^a-zA-Z0-9 _-]/g, '').trim();

    tokens[groupName] = {};

    scale.forEach((step, i) => {
      const key = `${i + 1}-${STEP_LABELS[i].replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
      tokens[groupName][key] = colorToken(
        step.r, step.g, step.b,
        `Step ${i + 1} · ${STEP_LABELS[i]} · ${groupName}`
      );
    });

    // Brand solid alias (step 9)
    tokens[groupName]['brand-solid'] = colorToken(
      entry.r, entry.g, entry.b,
      `Source colour · ${groupName}`
    );
  });

  return tokens;
}

export function exportFigmaLight(colours) {
  return buildModeTokens(colours, 'light');
}

export function exportFigmaDark(colours) {
  return buildModeTokens(colours, 'dark');
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
  // Export two files — one per mode — for Figma's native Import mode
  downloadJSON(exportFigmaLight(colours), `figma-light-${date}.json`);
  // Small delay so browsers don't block the second download
  setTimeout(() => {
    downloadJSON(exportFigmaDark(colours), `figma-dark-${date}.json`);
  }, 300);
}
