/**
 * Client-side sentiment via transformers.js (WASM) — $0, no API key.
 * Model: twn39/multilingual-sentiment-analysis-ONNX (tabularisai base)
 * — 23 languages incl. Tagalog + English, handles Taglish.
 *
 * Loads lazily on first comment; model (~136MB quantized) is cached by the
 * browser after the first download. NEVER blocks submit: any failure → null.
 */

export type SentimentResult = { label: 'positive' | 'neutral' | 'negative'; score: number };

type ClassificationOutput = { label: string; score: number }[];

let pipelinePromise: Promise<{
  (text: string): Promise<ClassificationOutput>;
}> | null = null;

async function getPipeline() {
  const { pipeline, env } = await import('@huggingface/transformers');
  env.allowLocalModels = false;
  if (!pipelinePromise) {
    pipelinePromise = pipeline('text-classification', 'twn39/multilingual-sentiment-analysis-ONNX', {
      dtype: 'q8',
    }) as Promise<(text: string) => Promise<ClassificationOutput>>;
  }
  return pipelinePromise;
}

export async function classifyComment(text: string): Promise<SentimentResult | null> {
  const trimmed = text.trim();
  if (trimmed.length < 3) return null;
  try {
    const classify = await getPipeline();
    const [out] = await classify(trimmed);
    if (!out) return null;
    const raw = String(out.label).toLowerCase().replace('very ', '').trim();
    const label = (['positive', 'neutral', 'negative'] as const).includes(
      raw as SentimentResult['label'],
    )
      ? (raw as SentimentResult['label'])
      : 'neutral';
    return { label, score: Math.round(out.score * 1000) / 1000 };
  } catch {
    return null; // model failed → store raw comment, classify as Neutral (§7 fallback)
  }
}
