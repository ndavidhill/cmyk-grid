'use client';
import { rgbToCmyk, buildGrid, rgbToHex } from '../colourMath';
import Swatch from './Swatch';

export default function ColourResult({ entry, step, spread }) {
  const baseCmyk = rgbToCmyk(entry.r, entry.g, entry.b);
  const grid = buildGrid(entry, baseCmyk, step, spread);
  const nearest = grid[0];

  return (
    <div style={{
      marginBottom: 10,
      borderRadius: 5,
      background: 'var(--color-accent)',
      padding: 5,
      pageBreakInside: 'avoid',
      breakInside: 'avoid',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
        padding: '5px 5px 0',
      }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 5,
          flexShrink: 0,
          background: rgbToHex(entry.r, entry.g, entry.b),
          outline: '1px solid var(--color-accent)',
        }} />
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: 12,
            fontWeight: 'bold',
            letterSpacing: '0.02rem',
            textTransform: 'uppercase',
            color: 'var(--color-fg)',
          }}>
            {entry.label || `RGB ${entry.r} ${entry.g} ${entry.b}`}
          </div>
          <div style={{
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: 10,
            fontWeight: 'bold',
            letterSpacing: '0.02rem',
            textTransform: 'uppercase',
            color: 'var(--color-fg)',
            opacity: 0.5,
            marginTop: 1,
          }}>
            {rgbToHex(entry.r, entry.g, entry.b).toUpperCase()}
            {' · '}Base C{baseCmyk.c} M{baseCmyk.m} Y{baseCmyk.y} K{baseCmyk.k}
            {' · '}Nearest C{nearest.c} M{nearest.m} Y{nearest.y} K{nearest.k}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 4,
        marginTop: 14,
        padding: '0 0 4px',
      }}>
        {grid.map((sw, i) => (
          <Swatch key={i} sw={sw} isCenter={i === 0} />
        ))}
      </div>
    </div>
  );
}
