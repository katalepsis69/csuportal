'use client';

import { useEffect, useRef } from 'react';

export type Point = { x: number; y: number };
export type Strokes = Point[][];

/**
 * Canvas signature pad. Stores normalized 0..1 stroke vectors (no image),
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary')
      .trim() || '#7f1d1d';
    ctx.shadowColor = 'rgba(127, 29, 29, 0.4)';
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
      <div className="relative bg-white border border-border rounded-xl p-4 min-h-[180px] flex flex-col justify-between overflow-hidden shadow-inner">
        {/* Grid hairline guidelines */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#a1a1aa 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* Top Canvas Header Badges */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Draw your signature below</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange([]);
            }}
            className="flex items-center gap-1.5 px-2 py-1 min-h-[36px] rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
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
        <div className="relative z-10 border-t border-dashed border-border pt-1.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[11px] text-muted-foreground">
          <span>Sign above using trackpad, mouse, or stylus</span>
          <span className="text-[10px] sm:text-[11px] text-muted-foreground/70">Stored as normalized vectors, never an image</span>
        </div>
      </div>
    </div>
  );
}
