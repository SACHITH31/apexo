import { useRouter } from "@tanstack/react-router";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { reportLovableError } from "@/lib/lovable-error-reporting";

export function DefaultErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "tanstack_default_error_component" });
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
      <div className="relative overflow-hidden rounded-2xl glass-elevated border border-destructive/40 p-8 sm:p-10 animate-page-in">
        <div className="absolute inset-y-0 left-0 w-1 accent-line" />
        <div className="flex items-center gap-3 text-destructive">
          <AlertTriangle className="h-6 w-6" />
          <span className="text-[10px] uppercase tracking-[0.3em]">Red flag</span>
        </div>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl">Something went off track</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This page didn't finish loading. It might be a temporary glitch — give it another lap.
        </p>
        {error?.message && (
          <pre className="mt-4 max-h-32 overflow-auto rounded-md border border-border bg-surface/60 p-3 text-xs text-muted-foreground">
            {error.message}
          </pre>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold uppercase tracking-widest text-accent-foreground shadow-broadcast transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundImage: "var(--gradient-accent)" }}
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center rounded-full border border-border bg-surface/60 px-5 py-2.5 text-sm font-semibold uppercase tracking-widest hover:border-accent/50 hover:bg-surface transition-colors"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
