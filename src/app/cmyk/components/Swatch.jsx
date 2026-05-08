'use client';
import { rgbToHex, useDarkText } from '../colourMath';

export default function Swatch({ sw, isCenter }) {
  const hex = rgbToHex(sw.r, sw.g, sw.b);
  const dark = useDarkText(sw.r, sw.g, sw.b);
  const textColor = dark ? '#000000' : '#ffffff';

  return (
    <div style={{
      background: hex,
      borderRadius: 5,
      padding: '6px 5px 5px',
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      outline: isCenter ? '2px solid var(--color-fg)' : 'none',
      outlineOffset: 2,
      fontFamily: 'Helvetica, Arial, sans-serif',
      fontSize: 10,
      fontWeight: 'bold',
      lineHeight: 1.3,
      letterSpacing: '0.02rem',
      textTransform: 'uppercase',
      minHeight: 80,
      position: 'relative',
      cursor: 'default',
    }}>
      {isCenter && (
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
          ★ Nearest
        </div>
      )}
      <div style={{ color: textColor, fontSize: 9, opacity: 0.6 }}>CMYK</div>
      <div style={{ color: textColor }}>C{sw.c} M{sw.m}</div>
      <div style={{ color: textColor }}>Y{sw.y} K{sw.k}</div>
      <div style={{ color: textColor, opacity: 0.55, fontSize: 8, marginTop: 2 }}>
        {hex.toUpperCase()}
      </div>
    </div>
  );
}
