import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Download, Sparkles, WifiOff } from "lucide-react";
import { useBible } from "@/components/bible-provider";
import { verseOfTheDay } from "@/lib/bible";
import { Button } from "@/components/ui/button";
import { InstallApp } from "@/components/install-app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Daily Bible — Offline Bible in KJV, Yoruba, Igbo, Hausa & French" },
      {
        name: "description",
        content:
          "Read the Bible anywhere, with no internet. Download KJV, ASV, WEB, Yorùbá, Igbo, Hausa and French Bibles once and read, search and study offline.",
      },
      { property: "og:title", content: "Daily Bible — Offline Bible App" },
      {
        property: "og:description",
        content:
          "Download full Bible translations to your phone and read offline: KJV, ASV, WEB, Yorùbá, Igbo, Hausa, Français.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Today,
});

function Today() {
  const { ready, bible, installed } = useBible();
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    );
  }, []);

  const votd = useMemo(() => (bible ? verseOfTheDay(bible) : null), [bible]);

  return (
    <div className="mx-auto max-w-2xl px-5 pb-28 pt-8">
      <header className="text-center">
        <img
          src="/icons/icon-192.png"
          alt="Daily Bible logo"
          width={72}
          height={72}
          className="mx-auto size-[72px] rounded-2xl shadow-page"
        />
        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">{today}</p>
        <h1 className="mt-3 font-scripture text-4xl font-semibold tracking-tight">Daily Bible</h1>
        <div className="gilt-rule mx-auto mt-4 w-32" />
      </header>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-page">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
          <Sparkles className="size-4" />
          Verse of the day
        </div>

        {!ready ? (
          <p className="mt-4 text-sm text-muted-foreground">Opening your library…</p>
        ) : votd ? (
          <>
            <p className="scripture mt-4">{votd.text}</p>
            <p className="mt-4 text-sm font-medium text-primary">
              {votd.reference} · {bible?.abbr}
            </p>
            <Button asChild variant="secondary" className="mt-5">
              <Link to="/read" search={{ book: votd.bookId, chapter: votd.chapter }}>
                Read the chapter
              </Link>
            </Button>
          </>
        ) : (
          <>
            <p className="mt-4 text-sm text-muted-foreground">
              Download a translation once and the whole Bible lives on your device — no internet
              needed after that.
            </p>
            <Button asChild className="mt-5">
              <Link to="/library">
                <Download className="size-4" /> Get your first Bible
              </Link>
            </Button>
          </>
        )}
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          to="/read"
          className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-gold"
        >
          <BookOpen className="size-5 text-primary" />
          <p className="mt-3 font-medium">Continue reading</p>
          <p className="text-sm text-muted-foreground">Full chapters in a calm, printed layout.</p>
        </Link>
        <Link
          to="/library"
          className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-gold"
        >
          <WifiOff className="size-5 text-primary" />
          <p className="mt-3 font-medium">
            {installed.length} offline {installed.length === 1 ? "version" : "versions"}
          </p>
          <p className="text-sm text-muted-foreground">
            KJV, ASV, WEB, Yorùbá, Igbo, Hausa, Français.
          </p>
        </Link>
      </section>

      <InstallApp />
    </div>
  );
}
