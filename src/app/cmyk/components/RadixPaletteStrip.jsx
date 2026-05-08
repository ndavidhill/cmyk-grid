'use client';
import { useMemo } from 'react';
import { generateRadixPalette, STEP_LABELS } from '../radixPalette';
import { rgbToHex, useDarkText } from '../colourMath';

function PaletteStep({ step, index, mode }) {
  const hex  = rgbToHex(step.r, step.g, step.b);
  const dark = useDarkText(step.r, step.g, step.b);
  const textCol = dark ? '#000' : '#fff';
  const isSolid = index === 8; // step 9 (0-indexed: 8) = base colour

  return (
    <div
      title={`Step ${index + 1} · ${STEP_LABELS[index]}\n${hex.toUpperCase()}\nR${step.r} G${step.g} B${step.b}`}
      style={{
        flex: 1,
        background: hex,
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '4px 3px 3px',
        outline: isSolid ? '2px solid rgba(0,0,0,0.4)' : 'none',
        outlineOffset: -2,
        position: 'relative',
        cursor: 'default',
        minHeight: 48,
      }}
    >
      <div style={{
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontSize: 7,
        fontWeight: 'bold',
        letterSpacing: '0.03rem',
        textTransform: 'uppercase',
        color: textCol,
        opacity: 0.7,
        lineHeight: 1.3,
      }}>
        {index + 1}
      </div>
    </div>
  );
}

export default function RadixPaletteStrip({ r, g, b }) {
  const palette = useMemo(() => generateRadixPalette(r, g, b), [r, g, b]);

  const labelStyle = {
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: '0.05rem',
    textTransform: 'uppercase',
    color: 'var(--color-fg)',
    opacity: 0.4,
    marginBottom: 4,
    marginTop: 10,
  };

  return (
    <div style={{ padding: '0 0 4px' }}>
      {/* Step labels row */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
        <div style={{ width: 48, flexShrink: 0 }} />
        {STEP_LABELS.map((label, i) => (
          <div key={i} style={{
            flex: 1,
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: 6.5,
            fontWeight: 'bold',
            letterSpacing: '0.02rem',
            textTransform: 'uppercase',
            color: 'var(--color-fg)',
            opacity: 0.35,
            textAlign: 'center',
            lineHeight: 1.2,
          }}>
            {label}
          </div>
        ))}
      </div>

      {/* Light mode row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
        <div style={{
          width: 48,
          flexShrink: 0,
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: 8,
          fontWeight: 'bold',
          letterSpacing: '0.04rem',
          textTransform: 'uppercase',
          color: 'var(--color-fg)',
          opacity: 0.4,
        }}>
          Light
        </div>
        {palette.light.map((step, i) => (
          <PaletteStep key={i} step={step} index={i} mode="light" />
        ))}
      </div>

      {/* Dark mode row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <div style={{
          width: 48,
          flexShrink: 0,
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: 8,
          fontWeight: 'bold',
          letterSpacing: '0.04rem',
          textTransform: 'uppercase',
          color: 'var(--color-fg)',
          opacity: 0.4,
        }}>
          Dark
        </div>
        {palette.dark.map((step, i) => (
          <PaletteStep key={i} step={step} index={i} mode="dark" />
        ))}
      </div>
    </div>
  );
}
