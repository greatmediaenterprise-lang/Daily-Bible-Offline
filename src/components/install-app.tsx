import { useEffect, useState } from "react";
import { Download, Share, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    setIos(isIosDevice());
    setInstalled(isStandalone());

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);

    if ("serviceWorker" in navigator && import.meta.env.PROD) {
      void navigator.serviceWorker.ready.then(() => setOfflineReady(true));
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (installed) {
    return (
      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Smartphone className="size-4 text-gold" />
        Installed on this device{offlineReady ? " · Ready offline" : ""}
      </div>
    );
  }

  const install = async () => {
    if (prompt) {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") setPrompt(null);
      return;
    }
    setShowIosHelp(true);
  };

  return (
    <section className="mt-8 border-t border-border pt-6 text-center">
      <img
        src="/icons/icon-192.png"
        alt="Daily Bible logo"
        width={64}
        height={64}
        className="mx-auto size-16 rounded-xl"
      />
      <h2 className="mt-3 font-scripture text-2xl font-semibold">Install Daily Bible</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Add it to your phone or tablet, then open your downloaded Bibles without data.
      </p>
      <Button className="mt-4" onClick={() => void install()}>
        <Download className="size-4" /> Install app
      </Button>

      {showIosHelp && (
        <div className="mx-auto mt-4 max-w-sm rounded-lg border border-border bg-muted/40 p-4 text-left text-sm">
          {ios ? (
            <p>
              In Safari, tap <Share className="mx-1 inline size-4 text-primary" /> <strong>Share</strong>,
              then choose <strong>Add to Home Screen</strong> and tap <strong>Add</strong>.
            </p>
          ) : (
            <p>
              Open your browser menu and choose <strong>Install app</strong> or
              <strong> Add to Home screen</strong>.
            </p>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        {offlineReady
          ? "App ready offline. Download at least one Bible in Library."
          : "Open the published app online once to prepare offline use."}
      </p>
    </section>
  );
}