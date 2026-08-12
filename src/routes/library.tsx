import { createFileRoute } from "@tanstack/react-router";
import { Check, Download, Loader2, Trash2, WifiOff } from "lucide-react";
import { TRANSLATIONS, useBible } from "@/components/bible-provider";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Bible versions library — Daily Bible" },
      {
        name: "description",
        content:
          "Download full Bible translations for offline use: KJV, ASV, WEB, BBE, YLT, Darby, Yorùbá, Igbo, Hausa and French.",
      },
      { property: "og:title", content: "Bible versions library — Daily Bible" },
      {
        property: "og:description",
        content: "Store complete Bibles on your device and read them without internet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Library,
});

function Library() {
  const { installed, progress, install, uninstall, activeId, setActive } = useBible();

  const groups = TRANSLATIONS.reduce<Record<string, typeof TRANSLATIONS>>((acc, t) => {
    (acc[t.language] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-2xl px-5 pb-28 pt-8">
      <header>
        <h1 className="font-scripture text-3xl font-semibold">Library</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Download once on Wi-Fi. Everything you download is stored on your device and works with
          the network off.
        </p>
        <div className="gilt-rule mt-4 w-24" />
      </header>

      {Object.entries(groups).map(([language, list]) => (
        <section key={language} className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            {language}
          </h2>
          <div className="mt-3 space-y-2">
            {list.map((t) => {
              const isInstalled = installed.includes(t.id);
              const pct = progress[t.id];
              return (
                <div key={t.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {t.abbr} · {t.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isInstalled ? "Saved on this device" : `About ${t.approxMB} MB`}
                      </p>
                    </div>
                    {pct !== undefined ? (
                      <Loader2 className="size-5 animate-spin text-gold" />
                    ) : isInstalled ? (
                      <div className="flex items-center gap-1">
                        {activeId !== t.id && (
                          <Button variant="ghost" size="sm" onClick={() => void setActive(t.id)}>
                            Use
                          </Button>
                        )}
                        {activeId === t.id && <Check className="size-5 text-gold" />}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${t.abbr}`}
                          onClick={async () => {
                            await uninstall(t.id);
                            toast.success(`${t.abbr} removed`);
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await install(t);
                            toast.success(`${t.abbr} ready offline`);
                          } catch {
                            toast.error("Download failed. Check your connection.");
                          }
                        }}
                      >
                        <Download className="size-4" /> Get
                      </Button>
                    )}
                  </div>
                  {pct !== undefined && <Progress value={pct} className="mt-3 h-1.5" />}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="mt-10 rounded-xl border border-border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <WifiOff className="size-4" /> About versions
        </p>
        <p className="mt-2">
          NIV and The Message are commercially licensed and cannot legally be downloaded or
          distributed inside an app, so they are not offered here. Every translation above is
          freely licensed and includes the whole Bible.
        </p>
      </div>
    </div>
  );
}
