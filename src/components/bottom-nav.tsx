import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Download, Search, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Today", icon: Home },
  { to: "/read", label: "Read", icon: BookOpen },
  { to: "/search", label: "Search", icon: Search },
  { to: "/library", label: "Library", icon: Download },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-stretch">
        {items.map(({ to, label, icon: Icon }) => {
          const active = path === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("size-5", active && "text-gold")} strokeWidth={active ? 2.4 : 1.8} />
              {label}
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
