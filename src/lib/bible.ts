import { get, set, del, keys } from "idb-keyval";

export const API_BASE = "https://bible.helloao.org/api";

export type TranslationInfo = {
  id: string;
  abbr: string;
  name: string;
  language: string;
  approxMB: number;
};

/**
 * Only freely licensed translations can be bundled/downloaded.
 * NIV and The Message are commercially licensed and cannot be distributed.
 */
export const TRANSLATIONS: TranslationInfo[] = [
  { id: "eng_kjv", abbr: "KJV", name: "King James Version", language: "English", approxMB: 5 },
  { id: "eng_cpb", abbr: "KJV-P", name: "KJV Cambridge Paragraph (modernised spelling)", language: "English", approxMB: 5 },
  { id: "BSB", abbr: "BSB", name: "Berean Standard Bible (modern, NKJV/NLT-style)", language: "English", approxMB: 5 },
  { id: "eng_net", abbr: "NET", name: "NET Bible (contemporary)", language: "English", approxMB: 6 },
  { id: "eng_t4t", abbr: "T4T", name: "Translation for Translators (amplified meaning)", language: "English", approxMB: 6 },
  { id: "eng_fbv", abbr: "FBV", name: "Free Bible Version (easy-to-read)", language: "English", approxMB: 5 },
  { id: "eng_pev", abbr: "PEV", name: "Plain English Version (simple / pidgin-style)", language: "English", approxMB: 4 },
  { id: "eng_asv", abbr: "ASV", name: "American Standard Version", language: "English", approxMB: 5 },
  { id: "eng_web", abbr: "WEB", name: "World English Bible", language: "English", approxMB: 5 },
  { id: "eng_bbe", abbr: "BBE", name: "Bible in Basic English", language: "English", approxMB: 4 },
  { id: "eng_ylt", abbr: "YLT", name: "Young's Literal Translation", language: "English", approxMB: 5 },
  { id: "eng_dby", abbr: "DBY", name: "Darby Translation", language: "English", approxMB: 5 },

  { id: "yor_bib", abbr: "YOR", name: "Bíbélì Mímọ́ (Yorùbá Òde-Òní)", language: "Yorùbá", approxMB: 6 },
  { id: "ibo_bib", abbr: "IBO", name: "Baịbụlụ Nsọ nʼIgbo", language: "Igbo", approxMB: 6 },
  { id: "hau_bib", abbr: "HAU", name: "Littafi Mai Tsarki (Sabon Rai)", language: "Hausa", approxMB: 5 },
  { id: "hau_ulb", abbr: "HUL", name: "Litafi Mai-tsarki", language: "Hausa", approxMB: 5 },
  { id: "fra_lsg", abbr: "LSG", name: "Louis Segond 1910", language: "Français", approxMB: 5 },
  { id: "fra_ost", abbr: "OST", name: "La Sainte Bible (Ostervald)", language: "Français", approxMB: 5 },
  { id: "fra_jnd", abbr: "JND", name: "Bible J.N. Darby", language: "Français", approxMB: 5 },
];

export type StoredBook = {
  id: string;
  name: string;
  chapters: string[][]; // chapters[chapterIndex][verseIndex]
};

export type StoredBible = {
  id: string;
  name: string;
  abbr: string;
  language: string;
  books: StoredBook[];
  savedAt: number;
};

const keyFor = (id: string) => `bible:${id}`;

type RawNode = { type?: string; number?: number; content?: unknown[] };

function verseText(content: unknown[]): string {
  return content
    .filter((part) => typeof part === "string")
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/^¶\s*/, "")
    .trim();
}

export function parseComplete(raw: any, info: TranslationInfo): StoredBible {
  const books: StoredBook[] = (raw.books ?? []).map((b: any) => ({
    id: b.id,
    name: b.commonName ?? b.name,
    chapters: (b.chapters ?? []).map((c: any) => {
      const nodes: RawNode[] = c.chapter?.content ?? [];
      return nodes
        .filter((n) => n.type === "verse")
        .map((n) => verseText(n.content ?? []))
        .filter(Boolean);
    }),
  }));

  return {
    id: info.id,
    name: info.name,
    abbr: info.abbr,
    language: info.language,
    books,
    savedAt: Date.now(),
  };
}

export async function downloadTranslation(
  info: TranslationInfo,
  onProgress?: (pct: number) => void,
): Promise<StoredBible> {
  const res = await fetch(`${API_BASE}/${info.id}/complete.json`);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);

  const total = Number(res.headers.get("content-length") ?? 0);
  let text: string;

  if (res.body && total > 0) {
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        received += value.length;
        onProgress?.(Math.min(95, Math.round((received / total) * 95)));
      }
    }
    const merged = new Uint8Array(received);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.length;
    }
    text = new TextDecoder().decode(merged);
  } else {
    text = await res.text();
  }

  onProgress?.(97);
  const parsed = parseComplete(JSON.parse(text), info);
  await set(keyFor(info.id), parsed);
  onProgress?.(100);
  return parsed;
}

export async function loadTranslation(id: string): Promise<StoredBible | undefined> {
  return (await get(keyFor(id))) as StoredBible | undefined;
}

export async function removeTranslation(id: string): Promise<void> {
  await del(keyFor(id));
}

export async function installedTranslationIds(): Promise<string[]> {
  const all = await keys();
  return all
    .filter((k): k is string => typeof k === "string" && k.startsWith("bible:"))
    .map((k) => k.slice("bible:".length));
}

export type SearchHit = {
  book: string;
  bookId: string;
  chapter: number;
  verse: number;
  text: string;
};

export function searchBible(bible: StoredBible, query: string, limit = 150): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const hits: SearchHit[] = [];
  for (const book of bible.books) {
    for (let c = 0; c < book.chapters.length; c++) {
      const chapter = book.chapters[c] ?? [];
      for (let v = 0; v < chapter.length; v++) {
        const text = chapter[v] ?? "";
        if (text.toLowerCase().includes(q)) {
          hits.push({
            book: book.name,
            bookId: book.id,
            chapter: c + 1,
            verse: v + 1,
            text,
          });
          if (hits.length >= limit) return hits;
        }
      }
    }
  }
  return hits;
}

/** Curated daily readings: [bookId, chapter, verse] */
export const DAILY_VERSES: Array<[string, number, number]> = [
  ["JHN", 3, 16],
  ["PSA", 23, 1],
  ["PRO", 3, 5],
  ["ISA", 41, 10],
  ["ROM", 8, 28],
  ["PHP", 4, 13],
  ["JOS", 1, 9],
  ["JER", 29, 11],
  ["MAT", 6, 33],
  ["PSA", 46, 1],
  ["2CO", 5, 17],
  ["HEB", 11, 1],
  ["1CO", 13, 4],
  ["GAL", 5, 22],
  ["EPH", 2, 8],
  ["PSA", 119, 105],
  ["MAT", 11, 28],
  ["ROM", 12, 2],
  ["1PE", 5, 7],
  ["JHN", 14, 6],
  ["PSA", 27, 1],
  ["PRO", 18, 10],
  ["ISA", 40, 31],
  ["COL", 3, 23],
  ["JAS", 1, 5],
  ["PSA", 34, 8],
  ["MIC", 6, 8],
  ["2TI", 1, 7],
  ["LAM", 3, 22],
  ["REV", 21, 4],
  ["PSA", 91, 1],
];

export function dayIndex(date = new Date()): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const diff = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start;
  return Math.floor(diff / 86400000);
}

export function verseOfTheDay(bible: StoredBible, date = new Date()) {
  const entry = DAILY_VERSES[dayIndex(date) % DAILY_VERSES.length]!;
  const [bookId, chapter, verse] = entry;
  const book = bible.books.find((b) => b.id === bookId);
  const text = book?.chapters?.[chapter - 1]?.[verse - 1];
  if (!book || !text) return null;
  return { reference: `${book.name} ${chapter}:${verse}`, text, bookId, chapter, verse };
}
