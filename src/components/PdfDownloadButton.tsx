'use client';

import { useState } from 'react';

/**
 * Renders the PDF entirely in the browser via @react-pdf/renderer —
 * no serverless function time, no cost. Both modules load lazily.
 */
export default function PdfDownloadButton({
  type,
  data,
  filename,
  label = 'Download PDF',
}: {
  type: string;
  data: unknown;
  filename: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const [{ buildDocument }, { pdf }] = await Promise.all([
        import('@/components/pdf/documents'),
        import('@react-pdf/renderer'),
      ]);
      const blob = await pdf(buildDocument(type, data)).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted active:scale-[0.98] shadow-xs min-h-[38px] disabled:cursor-not-allowed disabled:opacity-50"
      onClick={download}
      disabled={busy}
    >
      {busy ? 'Generating…' : label}
    </button>
  );
}
