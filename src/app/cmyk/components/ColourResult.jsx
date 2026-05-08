'use client';
import { useState, useEffect } from 'react';
import { rgbToCmyk, buildGrid, rgbToHex, nearestPantone, cmykToRgb, useDarkText } from '../colourMath';
import Swatch from './Swatch';

function useColourData(r, g, b) {
  const [data, setData] = useState(null);
  useEffect(() => {
    const id = setTimeout(() => {
      const baseCmyk  = rgbToCmyk(r, g, b);
      const pantone   = nearestPantone(r, g, b);
      setData({ baseCmyk, pantone });
    }, 0);
    return () => clearTimeout(id);
  }, [r, g, b]);
  return data;
}

export default function ColourResult({ entry, step, spread }) {
  const colourData = useColourData(entry.r, entry.g, entry.b);
  const sourceHex  = rgbToHex(entry.r, entry.g, entry.b);

  if (!colourData) {
    return (
      <div className="colour-group" style={{
        marginBottom: 10, borderRadius: 5,
        background: 'var(--color-accent)',
        WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
        padding: 5,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 5px 8px' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 4, flexShrink: 0,
            background: sourceHex, outline: '1px solid rgba(0,0,0,0.15)',
            WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
          }} />
          <div style={{
            fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 12,
            fontWeight: 'bold', letterSpacing: '0.02rem', textTransform: 'uppercase',
            color: 'var(--color-fg)',
          }}>
            {entry.label || `RGB ${entry.r} ${entry.g} ${entry.b}`}
            <span style={{ opacity: 0.35, marginLeft: 8, fontSize: 10 }}>Computing…</span>
          </div>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 4, padding: '0 0 4px', opacity: 0.12,
        }}>
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} style={{ borderRadius: 4, background: sourceHex, minHeight: 80 }} />
          ))}
        </div>
      </div>
    );
  }

  const { baseCmyk, pantone } = colourData;
  const grid    = buildGrid(entry, baseCmyk, step, spread);
  const nearest = grid[0];

  // Pantone swatch preview colour
  const pantoneRgb  = cmykToRgb(pantone.c, pantone.m, pantone.y, pantone.k);
  const pantoneHex  = rgbToHex(pantoneRgb.r, pantoneRgb.g, pantoneRgb.b);
  const pantoneDark = useDarkText(pantoneRgb.r, pantoneRgb.g, pantoneRgb.b);

  return (
    <div className="colour-group" style={{
      marginBottom: 10, borderRadius: 5,
      background: 'var(--color-accent)',
      WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
      padding: 5,
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        gap: 8, marginBottom: 8, padding: '5px 5px 0',
      }}>
        {/* Source swatch */}
        <div style={{
          width: 28, height: 28, borderRadius: 4, flexShrink: 0,
          background: sourceHex,
          WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
          outline: '1px solid rgba(0,0,0,0.15)',
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Colour name + CMYK */}
          <div style={{
            fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 12,
            fontWeight: 'bold', letterSpacing: '0.02rem', textTransform: 'uppercase',
            color: 'var(--color-fg)',
          }}>
            {entry.label || `RGB ${entry.r} ${entry.g} ${entry.b}`}
          </div>
          <div style={{
            fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 10,
            fontWeight: 'bold', letterSpacing: '0.02rem', textTransform: 'uppercase',
            color: 'var(--color-fg)', opacity: 0.5, marginTop: 1,
          }}>
            {sourceHex.toUpperCase()}
            {' · '}Nearest C{baseCmyk.c} M{baseCmyk.m} Y{baseCmyk.y} K{baseCmyk.k}
          </div>

          {/* Pantone reference */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginTop: 5,
          }}>
            {/* Pantone colour chip */}
            <div style={{
              background: pantoneHex,
              WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
              borderRadius: 3, padding: '3px 7px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontSize: 9, fontWeight: 'bold',
              letterSpacing: '0.05rem', textTransform: 'uppercase',
              color: pantoneDark ? '#000' : '#fff',
              flexShrink: 0,
            }}>
              {pantone.name}
            </div>
            <div style={{
              fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 9,
              fontWeight: 'bold', letterSpacing: '0.02rem', textTransform: 'uppercase',
              color: 'var(--color-fg)', opacity: 0.45,
            }}>
              C{pantone.c} M{pantone.m} Y{pantone.y} K{pantone.k}
              {' · '}ΔE {pantone.deltaE.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Swatch grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 4, marginTop: 14, padding: '0 0 4px',
      }}>
        {grid.map((sw, i) => (
          <Swatch key={i} sw={sw} isCenter={i === 0} />
        ))}
      </div>
    </div>
  );
}
