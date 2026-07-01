import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** Small banner that appears when the browser reports offline. */
export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online) return null;

  return (
    <div className="sticky top-16 z-30 mx-auto max-w-7xl px-4 sm:px-6 pt-3">
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 rounded-full border border-track-yellow/40 bg-track-yellow/10 px-4 py-2 text-xs uppercase tracking-widest text-track-yellow backdrop-blur-md"
      >
        <WifiOff className="h-3.5 w-3.5" />
        You're offline · Showing last-known data
      </div>
    </div>
  );
}
