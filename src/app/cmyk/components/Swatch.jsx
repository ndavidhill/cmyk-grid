'use client';
import { rgbToHex, useDarkText } from '../colourMath';

export default function Swatch({ sw, isNearest, isSelected, onClick }) {
  const hex  = rgbToHex(sw.r, sw.g, sw.b);
  const dark = useDarkText(sw.r, sw.g, sw.b);
  const textColor = dark ? '#000000' : '#ffffff';

  // Outline logic:
  // - Selected: solid 2px black outline (user chose this)
  // - Nearest (unselected): same visual weight as before
  // - Neither: no outline
  const outline = isSelected
    ? '2px solid var(--color-fg)'
    : isNearest && !isSelected
    ? '2px solid var(--color-fg)'
    : 'none';

  const outlineOffset = (isSelected || isNearest) ? 2 : 0;

  return (
    <div
      className="swatch-cell"
      onClick={onClick}
      style={{
        background: hex,
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        borderRadius: 4,
        padding: '7px 6px 6px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        outline,
        outlineOffset,
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontSize: 11,
        fontWeight: 'bold',
        lineHeight: 1.35,
        letterSpacing: '0.02rem',
        textTransform: 'uppercase',
        minHeight: 80,
        position: 'relative',
        cursor: 'pointer',
        transition: 'outline 0.1s, opacity 0.1s',
        userSelect: 'none',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
    >
      {/* Star marker — always on nearest regardless of selection */}
      {isNearest && (
        <div style={{
          position: 'absolute',
          top: -14, left: 0, right: 0,
          textAlign: 'center',
          fontSize: 8,
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 'bold',
          letterSpacing: '0.02rem',
          textTransform: 'uppercase',
          color: 'var(--color-fg)',
        }}>
          {isSelected ? '★ Selected' : '★ Nearest'}
        </div>
      )}

      {/* Selected marker on non-nearest swatches */}
      {isSelected && !isNearest && (
        <div style={{
          position: 'absolute',
          top: -14, left: 0, right: 0,
          textAlign: 'center',
          fontSize: 8,
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 'bold',
          letterSpacing: '0.02rem',
          textTransform: 'uppercase',
          color: 'var(--color-fg)',
        }}>
          Selected
        </div>
      )}

      <div style={{ color: textColor, fontSize: 8, opacity: 0.65 }}>CMYK</div>
      <div style={{ color: textColor }}>C{sw.c} M{sw.m}</div>
      <div style={{ color: textColor }}>Y{sw.y} K{sw.k}</div>
      <div style={{ color: textColor, opacity: 0.6, fontSize: 9, marginTop: 3 }}>
        {hex.toUpperCase()}
      </div>
    </div>
  );
}
