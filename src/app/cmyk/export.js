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
// Exports the Radix 12-step scale as a Figma variable collection JSON.
// Import via Figma → Assets → Libraries → Import Variables (requires Figma Pro).

import { generateRadixPalette, STEP_LABELS } from './radixPalette';

function rgbToHex255(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

export function exportFigmaVariables(colours) {
  const collection = {
    name: 'CMYK Colour System',
    modes: ['Light', 'Dark'],
    variables: [],
  };

  colours.forEach(entry => {
    const palette   = generateRadixPalette(entry.r, entry.g, entry.b);
    const groupName = (entry.label || `RGB ${entry.r} ${entry.g} ${entry.b}`)
      .replace(/[^a-zA-Z0-9 _-]/g, '').trim();

    for (let i = 0; i < 12; i++) {
      const lightHex = rgbToHex255(palette.light[i].r, palette.light[i].g, palette.light[i].b);
      const darkHex  = rgbToHex255(palette.dark[i].r,  palette.dark[i].g,  palette.dark[i].b);

      collection.variables.push({
        name:        `${groupName}/Step ${i + 1} – ${STEP_LABELS[i]}`,
        type:        'COLOR',
        description: `Radix step ${i + 1} (${STEP_LABELS[i]}) for ${groupName}`,
        valuesByMode: {
          Light: lightHex,
          Dark:  darkHex,
        },
      });
    }

    // Solid colour (step 9) as a top-level alias for easy reference
    const solidHex = rgbToHex255(entry.r, entry.g, entry.b);
    collection.variables.push({
      name:        `${groupName}/Brand Solid`,
      type:        'COLOR',
      description: `Source colour for ${groupName} — use for primary solid UI elements`,
      valuesByMode: {
        Light: solidHex,
        Dark:  solidHex,
      },
    });
  });

  return {
    version: '1.0',
    collections: [collection],
    meta: {
      generated:   new Date().toISOString(),
      tool:        'CMYK Grid Tester',
      description: 'Radix-style 12-step UI colour scales. Import via Figma Variables API or Tokens Studio.',
    },
  };
}

export function downloadFigmaVariables(colours) {
  const json = exportFigmaVariables(colours);
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `figma-variables-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
