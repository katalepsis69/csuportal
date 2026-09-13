'use client';

import { useEffect, useRef, useState } from 'react';

export type Point = { x: number; y: number };
export type Strokes = Point[][];

/**
 * Canvas signature pad. Stores strokes as normalized (0..1) coordinates —
 * a few KB of JSON, ~100× smaller than a base64 PNG, redrawable on PDF.
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const stroke of strokes) {
      if (stroke.length === 0) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x * canvas.width, stroke[0].y * canvas.height);
      for (const p of stroke.slice(1)) ctx.lineTo(p.x * canvas.width, p.y * canvas.height);
      if (stroke.length === 1) ctx.lineTo(stroke[0].x * canvas.width + 0.5, stroke[0].y * canvas.height);
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
    <div>
      <canvas
        ref={canvasRef}
        width={600}
        height={180}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        className="w-full cursor-crosshair touch-none rounded-md border border-slate-300 bg-white"
        style={{ aspectRatio: '600 / 180' }}
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {hasDrawn ? 'Signature captured' : 'Sign inside the box'}
        </span>
        <button
          type="button"
          className="btn-danger"
          onClick={() => {
            onChange([]);
            setHasDrawn(false);
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
