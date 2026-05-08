'use client';
import { rgbToHex, useDarkText } from '../colourMath';

export default function Swatch({ sw, isCenter }) {
  const hex = rgbToHex(sw.r, sw.g, sw.b);
  const dark = useDarkText(sw.r, sw.g, sw.b);
  const textColor = dark ? '#000000' : '#ffffff';

  return (
    <div
      className="swatch-cell"
      style={{
        background: hex,
        // Force background to print in all browsers
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        borderRadius: 4,
        padding: '7px 6px 6px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        outline: isCenter ? '2px solid var(--color-fg)' : 'none',
        outlineOffset: 2,
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontSize: 11,
        fontWeight: 'bold',
        lineHeight: 1.35,
        letterSpacing: '0.02rem',
        textTransform: 'uppercase',
        minHeight: 90,
        position: 'relative',
        cursor: 'default',
      }}
    >
      {isCenter && (
        <div style={{
          position: 'absolute',
          top: -15, left: 0, right: 0,
          textAlign: 'center',
          fontSize: 8,
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 'bold',
          letterSpacing: '0.02rem',
          textTransform: 'uppercase',
          color: 'var(--color-fg)',
        }}>
          ★ Nearest
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
