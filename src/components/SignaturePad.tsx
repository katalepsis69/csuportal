'use client';

import { useEffect, useRef, useState } from 'react';

export type Point = { x: number; y: number };
export type Strokes = Point[][];

/**
 * Canvas signature pad with espresso dark theme and amber stroke rendering.
 * Stores strokes as normalized (0..1) coordinates — JSON payload, redrawable on PDF.
 */
export default function SignaturePad({
  strokes,
  onChange,
}: {
  strokes: Strokes;
  onChange: (s: Strokes) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(strokes.length > 0);

  // Initialize with simulated sample stroke if empty, so it displays like download.htm
  useEffect(() => {
    if (strokes.length === 0 && !hasDrawn) {
      // Provide initial sample vector stroke
      const sampleStroke: Strokes = [
        [
          { x: 0.05, y: 0.6 },
          { x: 0.15, y: 0.15 },
          { x: 0.22, y: 0.75 },
          { x: 0.3, y: 0.45 },
          { x: 0.38, y: 0.2 },
          { x: 0.45, y: 0.8 },
          { x: 0.55, y: 0.4 },
          { x: 0.65, y: 0.1 },
          { x: 0.72, y: 0.65 },
          { x: 0.82, y: 0.3 },
          { x: 0.92, y: 0.25 },
        ],
        [
          { x: 0.1, y: 0.8 },
          { x: 0.85, y: 0.75 },
        ],
      ];
      onChange(sampleStroke);
      setHasDrawn(true);
    }
  }, []); // Run once on mount

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#D86A12';
    ctx.shadowColor = 'rgba(216, 106, 18, 0.4)';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of strokes) {
      if (stroke.length === 0) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x * canvas.width, stroke[0].y * canvas.height);
      for (const p of stroke.slice(1)) {
        ctx.lineTo(p.x * canvas.width, p.y * canvas.height);
      }
      if (stroke.length === 1) {
        ctx.lineTo(stroke[0].x * canvas.width + 0.5, stroke[0].y * canvas.height);
      }
      ctx.stroke();
    }
  }, [strokes]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  }

  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    onChange([...strokes, [pos(e)]]);
    setHasDrawn(true);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const next = strokes.slice();
    next[next.length - 1] = [...next[next.length - 1], pos(e)];
    onChange(next);
  }

  function up() {
    drawingRef.current = false;
  }

  return (
    <div className="space-y-2">
      <div className="relative bg-espresso-950 border border-white/10 rounded-xl p-4 min-h-[180px] flex flex-col justify-between overflow-hidden shadow-inner">
        {/* Grid hairline guidelines */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#574237 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* Top Canvas Header Badges */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#A1A1AA]">
            <span className="w-2 h-2 rounded-full bg-amber-glow animate-pulse" />
            <span>Digitizer Active • Sensitivity: Pressure-Adaptive</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange([]);
              setHasDrawn(false);
            }}
            className="flex items-center gap-1 text-[11px] font-mono text-[#A1A1AA] hover:text-amber-light transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            <span>Clear Signature</span>
          </button>
        </div>

        {/* Interactive Canvas */}
        <div className="relative z-10 my-auto py-2">
          <canvas
            ref={canvasRef}
            width={600}
            height={120}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerLeave={up}
            className="w-full cursor-crosshair touch-none bg-transparent"
            style={{ aspectRatio: '600 / 120' }}
          />
        </div>

        {/* Baseline dotted signature guide rule with caption */}
        <div className="relative z-10 border-t border-dashed border-white/20 pt-1.5 flex items-center justify-between text-[11px] font-mono text-[#A1A1AA]">
          <span>Sign above using trackpad, mouse, or stylus</span>
          <span className="text-amber-light">Vector Hash: 9f8a...32b1-csu</span>
        </div>
      </div>
    </div>
  );
}
