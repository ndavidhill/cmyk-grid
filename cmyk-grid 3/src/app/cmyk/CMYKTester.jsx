'use client';
import { useState } from 'react';
import Controls from './components/Controls';
import ColourResult from './components/ColourResult';

export default function CMYKTester() {
  const [colours, setColours] = useState([{ r: 218, g: 41, b: 28, label: 'Pantone 485' }]);
  const [step, setStep] = useState(5);
  const [spread, setSpread] = useState(1);
  const [inverted, setInverted] = useState(false);

  const bg     = inverted ? '#000' : '#fff';
  const fg     = inverted ? '#fff' : '#000';
  const accent = inverted ? '#222' : '#e9e9e9';

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: bg,
      color: fg,
      fontFamily: 'Helvetica, Arial, sans-serif',
      fontSize: 12,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: '0.02rem',
      '--color-bg': bg,
      '--color-fg': fg,
      '--color-accent': accent,
    }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body, html { margin: 0; padding: 0; overflow: hidden; }
        input[type=range] { accent-color: ${fg}; }
        ::selection { background: ${fg}; color: ${bg}; }
        a { color: ${fg}; }
        a:hover { opacity: 0.25; text-decoration: none; }
        button:hover { opacity: 0.25; }

        @media (max-width: 800px) {
          body, html { overflow: auto; }
          .overlay-panel { position: relative !important; width: 100vw !important; height: auto !important; }
          .main-area { position: relative !important; width: calc(100vw - 20px) !important; height: auto !important; top: auto !important; right: auto !important; margin: 10px auto 0 !important; }
        }

        @media print {
          /* ── Force colour backgrounds to print ── */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* ── Reset page chrome ── */
          @page {
            size: A3 landscape;
            margin: 12mm;
          }

          body, html {
            overflow: visible !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* ── Hide the sidebar ── */
          .no-print { display: none !important; }

          /* ── Full-width print area ── */
          .print-area {
            position: static !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            top: auto !important;
            right: auto !important;
            left: auto !important;
          }

          /* ── Print header ── */
          .print-header {
            display: flex !important;
            justify-content: space-between;
            align-items: baseline;
            border-bottom: 1px solid #000;
            padding-bottom: 4mm;
            margin-bottom: 6mm;
          }

          /* ── Keep each colour group together ── */
          .colour-group {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          /* ── Swatch grid cells never break mid-row ── */
          .swatch-cell {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Overlay panel — hidden on print */}
      <div
        className="overlay-panel no-print"
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: 350,
          height: '100vh',
          padding: 10,
          paddingRight: 0,
          zIndex: 1000,
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          background: bg,
          color: fg,
        }}
      >
        <Controls
          colours={colours}
          setColours={setColours}
          step={step}
          setStep={setStep}
          spread={spread}
          setSpread={setSpread}
          inverted={inverted}
          setInverted={setInverted}
        />
      </div>

      {/* Main canvas */}
      <div
        className="main-area print-area"
        style={{
          position: 'absolute',
          top: 10, right: 10,
          width: 'calc(100vw - 370px)',
          height: 'calc(100vh - 20px)',
          overflowY: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {/* Print-only header */}
        <div className="print-header" style={{ display: 'none' }}>
          <div style={{
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: 14, fontWeight: 'bold',
            textTransform: 'uppercase', letterSpacing: '0.05rem',
          }}>
            CMYK Colour Reference — FOGRA39
          </div>
          <div style={{
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: 9, opacity: 0.5,
            textTransform: 'uppercase', letterSpacing: '0.02rem',
          }}>
            Step ±{step}% · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {colours.length === 0 && (
          <div style={{
            padding: 20, fontSize: 12, opacity: 0.3,
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.02rem',
          }}>
            Add colours to generate grids.
          </div>
        )}
        {colours.map((entry, i) => (
          <ColourResult key={i} entry={entry} step={step} spread={spread} />
        ))}
      </div>
    </div>
  );
}
