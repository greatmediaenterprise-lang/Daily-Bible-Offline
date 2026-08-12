import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  TRANSLATIONS,
  downloadTranslation,
  installedTranslationIds,
  loadTranslation,
  removeTranslation,
  type StoredBible,
  type TranslationInfo,
} from "@/lib/bible";

type Progress = Record<string, number>;

type BibleContextValue = {
  ready: boolean;
  installed: string[];
  progress: Progress;
  activeId: string | null;
  bible: StoredBible | null;
  loadingBible: boolean;
  setActive: (id: string) => Promise<void>;
  install: (info: TranslationInfo) => Promise<void>;
  uninstall: (id: string) => Promise<void>;
};

const BibleContext = createContext<BibleContextValue | null>(null);

const ACTIVE_KEY = "daily-bible:active";

export function BibleProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState<string[]>([]);
  const [progress, setProgress] = useState<Progress>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [bible, setBible] = useState<StoredBible | null>(null);
  const [loadingBible, setLoadingBible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ids = await installedTranslationIds();
      if (cancelled) return;
      setInstalled(ids);
      const stored = localStorage.getItem(ACTIVE_KEY);
      const next = stored && ids.includes(stored) ? stored : (ids[0] ?? null);
      setActiveId(next);
      if (next) {
        setLoadingBible(true);
        const b = await loadTranslation(next);
        if (!cancelled) setBible(b ?? null);
        setLoadingBible(false);
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setActive = useCallback(async (id: string) => {
    setActiveId(id);
    localStorage.setItem(ACTIVE_KEY, id);
    setLoadingBible(true);
    const b = await loadTranslation(id);
    setBible(b ?? null);
    setLoadingBible(false);
  }, []);

  const install = useCallback(
    async (info: TranslationInfo) => {
      setProgress((p) => ({ ...p, [info.id]: 1 }));
      try {
        await downloadTranslation(info, (pct) => setProgress((p) => ({ ...p, [info.id]: pct })));
        setInstalled((prev) => (prev.includes(info.id) ? prev : [...prev, info.id]));
        if (!activeId) await setActive(info.id);
      } finally {
        setProgress((p) => {
          const next = { ...p };
          delete next[info.id];
          return next;
        });
      }
    },
    [activeId, setActive],
  );

  const uninstall = useCallback(
    async (id: string) => {
      await removeTranslation(id);
      const remaining = installed.filter((i) => i !== id);
      setInstalled(remaining);
      if (activeId === id) {
        const next = remaining[0] ?? null;
        setActiveId(next);
        if (next) {
          localStorage.setItem(ACTIVE_KEY, next);
          setBible((await loadTranslation(next)) ?? null);
        } else {
          localStorage.removeItem(ACTIVE_KEY);
          setBible(null);
        }
      }
    },
    [activeId, installed],
  );

  const value = useMemo(
    () => ({
      ready,
      installed,
      progress,
      activeId,
      bible,
      loadingBible,
      setActive,
      install,
      uninstall,
    }),
    [ready, installed, progress, activeId, bible, loadingBible, setActive, install, uninstall],
  );

  return <BibleContext.Provider value={value}>{children}</BibleContext.Provider>;
}

export function useBible() {
  const ctx = useContext(BibleContext);
  if (!ctx) throw new Error("useBible must be used inside BibleProvider");
  return ctx;
}

export { TRANSLATIONS };
