import { useEffect, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * PageTransition — fades / slides route children on pathname change.
 * Purely presentational, does not affect routing state.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [key, setKey] = useState(pathname);

  useEffect(() => {
    setKey(pathname);
  }, [pathname]);

  return (
    <div key={key} className="w-full min-w-0 animate-page-in">
      {children}
    </div>
  );
}
