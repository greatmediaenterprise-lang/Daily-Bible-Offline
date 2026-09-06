/**
 * Guarded service-worker registration.
 * Never registers in dev, in an iframe, or in Lovable preview hosts.
 */
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const host = window.location.hostname;
  const blockedHost =
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev");

  const refused =
    !import.meta.env.PROD ||
    window.self !== window.top ||
    blockedHost ||
    new URL(window.location.href).searchParams.get("sw") === "off";

  if (refused) {
    void navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const reg of regs) {
        if (reg.active?.scriptURL.endsWith("/sw.js")) void reg.unregister();
      }
    });
    return;
  }

  // This function is called from a React effect, which may run after the
  // window load event. Register immediately so first-time mobile visitors do
  // not miss the only event listener and leave without an offline app shell.
  void navigator.serviceWorker
    .register("/sw.js", { scope: "/", updateViaCache: "none" })
    .then((registration) => registration.update())
    .catch((error: unknown) => {
      console.error("Daily Bible offline setup failed", error);
    });
}
