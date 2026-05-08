'use client';
import { hexToRgb, rgbToHex, clamp } from '../colourMath';
import { downloadCSV } from '../export';
import Dropdown from './Dropdown';
import { Btn, RangeRow, inputStyle, labelStyle } from './Ui';
import { useState } from 'react';

const PRESETS = [
  { label: 'Pantone 485', r: 218, g: 41, b: 28 },
  { label: 'Process Blue', r: 0, g: 133, b: 202 },
  { label: 'Cool Grey 9', r: 117, g: 120, b: 123 },
  { label: 'Pantone 368', r: 120, g: 190, b: 32 },
  { label: 'Pantone 109', r: 255, g: 209, b: 0 },
];

export default function Controls({
  colours, setColours,
  step, setStep,
  spread, setSpread,
  inverted, setInverted,
}) {
  const [inputMode, setInputMode] = useState('single');
  const [batchText, setBatchText] = useState('');
  const [batchError, setBatchError] = useState('');
  const [singleR, setSingleR] = useState(218);
  const [singleG, setSingleG] = useState(41);
  const [singleB, setSingleB] = useState(28);
  const [singleHex, setSingleHex] = useState('#da291c');
  const [singleLabel, setSingleLabel] = useState('');
  const [exportFlash, setExportFlash] = useState(false);

  function handleRgbChange(ch, val) {
    const v = Math.max(0, Math.min(255, parseInt(val) || 0));
    const nr = ch === 'r' ? v : singleR;
    const ng = ch === 'g' ? v : singleG;
    const nb = ch === 'b' ? v : singleB;
    if (ch === 'r') setSingleR(v);
    if (ch === 'g') setSingleG(v);
    if (ch === 'b') setSingleB(v);
    setSingleHex(rgbToHex(nr, ng, nb));
  }

  function handleHexChange(val) {
    setSingleHex(val);
    const rgb = hexToRgb(val);
    if (rgb) { setSingleR(rgb.r); setSingleG(rgb.g); setSingleB(rgb.b); }
  }

  function parseBatch() {
    setBatchError('');
    const lines = batchText.split('\n').filter(l => l.trim());
    const parsed = [], errors = [];
    lines.forEach((line, i) => {
      const parts = line.split(/[,\s]+/).filter(Boolean);
      const hexPart = parts.find(p => p.startsWith('#'));
      if (hexPart) {
        const rgb = hexToRgb(hexPart);
        if (rgb) {
          const label = parts.filter(p => !p.startsWith('#')).join(' ') || hexPart;
          parsed.push({ ...rgb, label }); return;
        }
      }
      const nums = parts.filter(p => !isNaN(parseInt(p))).map(Number);
      if (nums.length >= 3) {
        const [r, g, b] = nums;
        if ([r, g, b].every(n => n >= 0 && n <= 255)) {
          const label = parts.filter(p => isNaN(parseInt(p))).join(' ') || `RGB ${r} ${g} ${b}`;
          parsed.push({ r, g, b, label }); return;
        }
      }
      errors.push(`Line ${i + 1}: "${line}"`);
    });
    if (errors.length) setBatchError("Couldn't parse:\n" + errors.join('\n'));
    if (parsed.length) setColours(parsed);
  }

  function handleExportCSV() {
    downloadCSV(colours, step, spread);
    setExportFlash(true);
    setTimeout(() => setExportFlash(false), 1800);
  }

  const fg = inverted ? '#fff' : '#000';
  const bg = inverted ? '#000' : '#fff';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* Input */}
      <Dropdown title="Input" defaultOpen>
        <div style={{ display: 'flex', gap: 0, marginBottom: 8 }}>
          {['Single', 'Batch'].map(m => (
            <button key={m} onClick={() => setInputMode(m.toLowerCase())} style={{
              flex: 1, padding: '5px 0',
              background: inputMode === m.toLowerCase() ? 'var(--color-fg)' : 'var(--color-bg)',
              color: inputMode === m.toLowerCase() ? 'var(--color-bg)' : 'var(--color-fg)',
              border: 'none', borderRadius: 5,
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontSize: 11, fontWeight: 'bold',
              textTransform: 'uppercase', letterSpacing: '0.02rem',
              cursor: 'pointer', margin: '0 2px',
            }}>{m}</button>
          ))}
        </div>

        {inputMode === 'single' && (<>
          <label style={labelStyle}>Hex</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="color" value={singleHex}
              onChange={e => handleHexChange(e.target.value)}
              style={{ width: 28, height: 24, padding: 1, border: 'none', borderRadius: 5, cursor: 'pointer', background: 'var(--color-bg)', flexShrink: 0 }}
            />
            <input type="text" value={singleHex}
              onChange={e => handleHexChange(e.target.value)}
              style={{ ...inputStyle, marginTop: 0, flex: 1 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            {[['R', singleR, v => handleRgbChange('r', v)],
              ['G', singleG, v => handleRgbChange('g', v)],
              ['B', singleB, v => handleRgbChange('b', v)]].map(([ch, val, fn]) => (
              <div key={ch} style={{ flex: 1 }}>
                <label style={{ ...labelStyle, margin: '0 0 2px' }}>{ch}</label>
                <input type="number" min={0} max={255} value={val}
                  onChange={e => fn(e.target.value)}
                  style={{ ...inputStyle, textAlign: 'center', padding: '3px 2px', marginTop: 0 }}
                />
              </div>
            ))}
          </div>

          <label style={labelStyle}>Label</label>
          <input type="text" placeholder="Optional label"
            value={singleLabel} onChange={e => setSingleLabel(e.target.value)}
            style={inputStyle}
          />

          <div>
            <Btn onClick={() => setColours(p => [...p, { r: singleR, g: singleG, b: singleB, label: singleLabel }])}>
              + Add
            </Btn>
            <Btn onClick={() => setColours([{ r: singleR, g: singleG, b: singleB, label: singleLabel }])}>
              Replace All
            </Btn>
          </div>
        </>)}

        {inputMode === 'batch' && (<>
          <label style={labelStyle}>One per line</label>
          <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 6, lineHeight: 1.5 }}>
            #da291c Label<br />218 41 28 Label
          </div>
          <textarea
            value={batchText} onChange={e => setBatchText(e.target.value)}
            placeholder={'#da291c Pantone 485\n#0085ca Process Blue'}
            rows={6}
            style={{
              width: '100%', padding: 6,
              background: 'var(--color-bg)', color: 'var(--color-fg)',
              borderRadius: 5, border: 'none', marginTop: 4, resize: 'vertical',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontSize: 12, lineHeight: 1.4,
              letterSpacing: '0.02rem', textTransform: 'uppercase', fontWeight: 'bold',
            }}
          />
          {batchError && (
            <div style={{ fontSize: 10, color: 'red', marginTop: 4, whiteSpace: 'pre-line' }}>
              {batchError}
            </div>
          )}
          <Btn onClick={parseBatch}>Generate</Btn>
        </>)}
      </Dropdown>

      {/* Presets */}
      <Dropdown title="Presets">
        {PRESETS.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0' }}>
            <div style={{
              width: 16, height: 16, borderRadius: 3, flexShrink: 0,
              background: rgbToHex(p.r, p.g, p.b),
              outline: '1px solid var(--color-accent)',
            }} />
            <span style={{
              flex: 1, fontSize: 11,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              fontFamily: 'Helvetica, Arial, sans-serif',
              letterSpacing: '0.02rem', textTransform: 'uppercase',
            }}>
              {p.label}
            </span>
            <Btn onClick={() => setColours([p])} style={{ margin: 0, padding: '3px 7px', fontSize: 10 }}>
              Load
            </Btn>
          </div>
        ))}
      </Dropdown>

      {/* Grid settings */}
      <Dropdown title="Grid Settings" defaultOpen>
        <RangeRow label={`Step ±${step}%`} min={1} max={10} value={step} onChange={setStep} />
        <RangeRow
          label={`Spread ${spread} neighbour${spread > 1 ? 's' : ''}`}
          min={1} max={2} value={spread} onChange={setSpread}
        />
      </Dropdown>

      {/* Export */}
      <Dropdown title="Export" defaultOpen>
        <Btn onClick={handleExportCSV} red={exportFlash}>
          {exportFlash ? '✓ Exported' : 'Export CSV → InDesign'}
        </Btn>
        <Btn onClick={() => window.print()}>Print / PDF</Btn>
        <div style={{ fontSize: 10, opacity: 0.5, lineHeight: 1.6, marginTop: 4 }}>
          Download the InDesign script below, then run it with your exported CSV for FOGRA39/PDF X-4 output.
        </div>
        <a
          href="/CMYK_Fogra39_Swatches.jsx"
          download
          style={{
            display: 'inline-block',
            marginTop: 6,
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: 11,
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.02rem',
            color: 'var(--color-fg)',
            textDecoration: 'underline',
          }}
        >
          ↓ CMYK_Fogra39_Swatches.jsx
        </a>
      </Dropdown>

      {/* Display */}
      <Dropdown title="Display">
        <Btn onClick={() => setInverted(v => !v)}>
          {inverted ? 'Light Mode' : 'Invert Color'}
        </Btn>
      </Dropdown>

      {/* Queue */}
      <Dropdown title={`Queue (${colours.length})`} defaultOpen>
        {colours.length === 0 && (
          <div style={{ fontSize: 10, opacity: 0.4 }}>No colours added.</div>
        )}
        {colours.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '3px 0' }}>
            <div style={{
              width: 14, height: 14, borderRadius: 3, flexShrink: 0,
              background: rgbToHex(c.r, c.g, c.b),
              outline: '1px solid var(--color-accent)',
            }} />
            <span style={{
              flex: 1, fontSize: 10,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              fontFamily: 'Helvetica, Arial, sans-serif',
              letterSpacing: '0.02rem', textTransform: 'uppercase',
            }}>
              {c.label || `RGB ${c.r} ${c.g} ${c.b}`}
            </span>
            <Btn
              onClick={() => setColours(p => p.filter((_, j) => j !== i))}
              style={{ margin: 0, padding: '3px 7px', fontSize: 10 }}
            >
              ×
            </Btn>
          </div>
        ))}
      </Dropdown>

      {/* Footer */}
      <div style={{
        marginTop: 'auto', paddingTop: 10,
        fontSize: 10, opacity: 0.4, lineHeight: 1.5,
        fontFamily: 'Helvetica, Arial, sans-serif',
        letterSpacing: '0.02rem', textTransform: 'uppercase',
      }}>
        CMYK Grid Tester · Step ±{step}% · {new Date().toLocaleDateString('en-GB')}
      </div>
    </div>
  );
}
