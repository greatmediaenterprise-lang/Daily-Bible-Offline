import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Columns2, Download, List } from "lucide-react";
import { z } from "zod";
import { TRANSLATIONS, useBible } from "@/components/bible-provider";
import { loadTranslation, type StoredBible } from "@/lib/bible";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const COMPARE_KEY = "daily-bible:compare";
const COMPARE_ON_KEY = "daily-bible:compare-on";

const searchSchema = z.object({
  book: z.string().optional(),
  chapter: z.number().optional(),
});

export const Route = createFileRoute("/read")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Read the Bible offline — Daily Bible" },
      {
        name: "description",
        content:
          "A calm, printed-page Bible reader that works fully offline in KJV, ASV, WEB, Yorùbá, Igbo, Hausa and French.",
      },
      { property: "og:title", content: "Read the Bible offline — Daily Bible" },
      {
        property: "og:description",
        content: "Chapter-by-chapter Bible reading with no internet connection required.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reader,
});

function Reader() {
  const { bible, installed, activeId, setActive, loadingBible, ready } = useBible();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/read" });
  const [booksOpen, setBooksOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);

  const [compareOn, setCompareOn] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(COMPARE_ON_KEY) === "1",
  );
  const [compareIds, setCompareIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(COMPARE_KEY) ?? "[]") as string[];
    } catch {
      return [];
    }
  });
  const [compareBibles, setCompareBibles] = useState<Record<string, StoredBible>>({});

  // Versions shown in compare mode (active one always included)
  const shownIds = useMemo(() => {
    const ids = compareOn ? compareIds.filter((id) => installed.includes(id)) : [];
    const list = activeId ? [activeId, ...ids.filter((i) => i !== activeId)] : ids;
    return compareOn ? list : activeId ? [activeId] : [];
  }, [compareOn, compareIds, installed, activeId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const missing = shownIds.filter((id) => !compareBibles[id]);
      if (missing.length === 0) return;
      const loaded = await Promise.all(missing.map((id) => loadTranslation(id)));
      if (cancelled) return;
      setCompareBibles((prev) => {
        const next = { ...prev };
        missing.forEach((id, i) => {
          if (loaded[i]) next[id] = loaded[i]!;
        });
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [shownIds, compareBibles]);

  const toggleCompareId = (id: string) => {
    setCompareIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const toggleCompareOn = () => {
    setCompareOn((prev) => {
      localStorage.setItem(COMPARE_ON_KEY, prev ? "0" : "1");
      return !prev;
    });
  };

  const bookId = search.book ?? bible?.books[0]?.id;
  const chapterNo = search.chapter ?? 1;
  const book = useMemo(
    () => bible?.books.find((b) => b.id === bookId) ?? bible?.books[0],
    [bible, bookId],
  );
  const verses = book?.chapters[chapterNo - 1] ?? [];

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, [bookId, chapterNo, activeId]);

  const go = (nextBook: string, nextChapter: number) => {
    navigate({ search: { book: nextBook, chapter: nextChapter } });
  };

  const step = (dir: 1 | -1) => {
    if (!bible || !book) return;
    const idx = bible.books.findIndex((b) => b.id === book.id);
    const target = chapterNo + dir;
    if (target >= 1 && target <= book.chapters.length) return go(book.id, target);
    const nb = bible.books[idx + dir];
    if (!nb) return;
    go(nb.id, dir === 1 ? 1 : nb.chapters.length);
  };

  if (ready && installed.length === 0) {
    return (
      <div className="mx-auto max-w-md px-6 pb-28 pt-24 text-center">
        <h1 className="font-scripture text-3xl">Nothing to read yet</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Download a translation once and it stays on your device forever.
        </p>
        <Button asChild className="mt-6">
          <Link to="/library">
            <Download className="size-4" /> Open library
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
          <Sheet open={booksOpen} onOpenChange={setBooksOpen}>
            <SheetTrigger asChild>
              <Button variant="secondary" size="sm" className="gap-2">
                <List className="size-4" />
                <span className="max-w-[9rem] truncate">
                  {book ? `${book.name} ${chapterNo}` : "Books"}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto p-0">
              <SheetHeader className="px-5 py-4">
                <SheetTitle className="font-scripture text-2xl">Books</SheetTitle>
              </SheetHeader>
              <div className="px-3 pb-10">
                {bible?.books.map((b) => (
                  <details key={b.id} open={b.id === book?.id} className="group">
                    <summary className="cursor-pointer list-none rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">
                      {b.name}
                    </summary>
                    <div className="grid grid-cols-6 gap-1.5 px-3 py-2">
                      {b.chapters.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            go(b.id, i + 1);
                            setBooksOpen(false);
                          }}
                          className={cn(
                            "rounded-md border border-border py-1.5 text-xs transition-colors hover:border-gold",
                            b.id === book?.id && i + 1 === chapterNo && "bg-primary text-primary-foreground",
                          )}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant={compareOn ? "default" : "secondary"}
              size="sm"
              onClick={toggleCompareOn}
              aria-pressed={compareOn}
              title="Read several versions side by side"
            >
              <Columns2 className="size-4" />
              <span className="hidden sm:inline">Compare</span>
            </Button>

            {compareOn ? (
              <Sheet open={versionsOpen} onOpenChange={setVersionsOpen}>
                <SheetTrigger asChild>
                  <Button variant="secondary" size="sm">
                    Versions ({shownIds.length})
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] max-w-xs overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="font-scripture text-2xl">Compare versions</SheetTitle>
                  </SheetHeader>
                  <p className="px-1 text-xs text-muted-foreground">
                    Pick any of your downloaded versions to read together, verse by verse.
                  </p>
                  <div className="mt-4 space-y-2 px-1 pb-10">
                    {installed.map((id) => {
                      const info = TRANSLATIONS.find((t) => t.id === id);
                      const selected = shownIds.includes(id);
                      return (
                        <button
                          key={id}
                          onClick={() => (id === activeId ? undefined : toggleCompareId(id))}
                          disabled={id === activeId}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                            selected
                              ? "border-gold bg-accent"
                              : "border-border hover:border-gold/60",
                            id === activeId && "opacity-70",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-4 items-center justify-center rounded-sm border",
                              selected ? "border-gold bg-gold text-background" : "border-border",
                            )}
                          >
                            {selected && "✓"}
                          </span>
                          <span>
                            <span className="font-medium">{info?.abbr ?? id}</span>{" "}
                            <span className="text-muted-foreground">
                              {id === activeId ? "(main)" : (info?.name ?? "")}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <Select value={activeId ?? ""} onValueChange={(v) => void setActive(v)}>
                <SelectTrigger className="h-9 w-[7.5rem]">
                  <SelectValue placeholder="Version" />
                </SelectTrigger>
                <SelectContent>
                  {installed.map((id) => (
                    <SelectItem key={id} value={id}>
                      {TRANSLATIONS.find((t) => t.id === id)?.abbr ?? id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </header>

      <article className="mx-auto max-w-2xl px-6 pt-8">
        {loadingBible ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <h1 className="font-scripture text-3xl font-semibold">
              {book?.name} <span className="text-gold">{chapterNo}</span>
            </h1>
            <div className="gilt-rule mt-4 w-24" />
            <div className="scripture mt-6 space-y-3 text-foreground">
              {verses.map((v, i) => (
                <p key={i}>
                  <span className="verse-num">{i + 1}</span>
                  {v}
                </p>
              ))}
            </div>
          </>
        )}

        <div className="mt-10 flex items-center justify-between">
          <Button variant="secondary" size="sm" onClick={() => step(-1)}>
            <ChevronLeft className="size-4" /> Previous
          </Button>
          <Button variant="secondary" size="sm" onClick={() => step(1)}>
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
      </article>
    </div>
  );
}
