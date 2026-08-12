import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { useBible } from "@/components/bible-provider";
import { searchBible } from "@/lib/bible";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search the Bible offline — Daily Bible" },
      {
        name: "description",
        content:
          "Search every verse of your downloaded Bible translations instantly, with no internet connection.",
      },
      { property: "og:title", content: "Search the Bible offline — Daily Bible" },
      {
        property: "og:description",
        content: "Instant verse search across your offline Bible translations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { bible } = useBible();
  const [q, setQ] = useState("");

  const hits = useMemo(() => (bible ? searchBible(bible, q) : []), [bible, q]);

  return (
    <div className="mx-auto max-w-2xl px-5 pb-28 pt-8">
      <h1 className="font-scripture text-3xl font-semibold">Search</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {bible ? `Searching ${bible.abbr} on your device` : "Download a version first"}
      </p>

      <div className="relative mt-5">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="love, faith, Bethlehem…"
          className="pl-9"
        />
      </div>

      <div className="mt-6 space-y-3">
        {q.trim().length >= 2 && hits.length === 0 && (
          <p className="text-sm text-muted-foreground">No verses found.</p>
        )}
        {hits.map((h, i) => (
          <Link
            key={`${h.bookId}-${h.chapter}-${h.verse}-${i}`}
            to="/read"
            search={{ book: h.bookId, chapter: h.chapter }}
            className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-gold"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">
              {h.book} {h.chapter}:{h.verse}
            </p>
            <p className="scripture mt-2 text-base">{h.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
