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
