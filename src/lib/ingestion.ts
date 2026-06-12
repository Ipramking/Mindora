import mammoth from "mammoth";

export type ExtractedPage = {
  text: string;
  pageNumber: number | null;
};

export type TextChunk = {
  content: string;
  pageNumber: number | null;
  chunkIndex: number;
};

const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;
const EMBEDDING_MODEL = "voyage-3";
const EMBEDDING_BATCH_SIZE = 100;

export async function extractPages(
  buffer: Buffer,
  fileType: string
): Promise<ExtractedPage[]> {
  switch (fileType) {
    case "pdf":
      return extractPdfPages(buffer);
    case "docx": {
      const result = await mammoth.extractRawText({ buffer });
      return [{ text: result.value, pageNumber: null }];
    }
    case "txt":
    case "md":
      return [{ text: buffer.toString("utf-8"), pageNumber: null }];
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

async function extractPdfPages(buffer: Buffer): Promise<ExtractedPage[]> {
  const { PDFParse } = await import("pdf-parse");

  // Avoid pdfjs-dist's dynamic import of a worker script, which Turbopack
  // can't resolve at runtime. Wire up the worker message handler directly
  // so pdfjs runs the "fake worker" on the main thread instead.
  const globalWithWorker = globalThis as typeof globalThis & {
    pdfjsWorker?: unknown;
  };
  if (!globalWithWorker.pdfjsWorker) {
    const workerModule = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
    globalWithWorker.pdfjsWorker = workerModule;
  }

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.pages.map((page) => ({ text: page.text, pageNumber: page.num }));
  } finally {
    await parser.destroy();
  }
}

export function chunkPages(pages: ExtractedPage[]): TextChunk[] {
  const chunks: TextChunk[] = [];
  let chunkIndex = 0;

  for (const page of pages) {
    const normalized = page.text.replace(/\s+/g, " ").trim();
    if (!normalized) continue;

    let start = 0;
    while (start < normalized.length) {
      const end = Math.min(start + CHUNK_SIZE, normalized.length);
      const content = normalized.slice(start, end).trim();

      if (content) {
        chunks.push({ content, pageNumber: page.pageNumber, chunkIndex: chunkIndex++ });
      }

      if (end >= normalized.length) break;
      start = end - CHUNK_OVERLAP;
    }
  }

  return chunks;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
    embeddings.push(...(await embed(batch, "document")));
  }

  return embeddings;
}

export async function embedQuery(text: string): Promise<number[]> {
  const [embedding] = await embed([text], "query");
  return embedding;
}

async function embed(input: string[], inputType: "document" | "query"): Promise<number[][]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input,
      model: EMBEDDING_MODEL,
      input_type: inputType,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Voyage embeddings request failed (${res.status}): ${body}`);
  }

  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data.map((d) => d.embedding);
}
