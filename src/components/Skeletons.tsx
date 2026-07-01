import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton-broadcast rounded-md", className)} />;
}

export function HeroSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="relative overflow-hidden rounded-2xl carbon-texture border border-border p-6 sm:p-10 min-h-[420px]">
        <div className="absolute inset-y-0 left-0 w-1 accent-line opacity-40" />
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-4 h-14 w-3/4" />
        <Skeleton className="mt-2 h-10 w-1/2" />
        <Skeleton className="mt-4 h-4 w-64" />
        <div className="mt-8 grid grid-cols-4 gap-2 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <Skeleton className="h-11 w-40 rounded-full" />
          <Skeleton className="h-11 w-32 rounded-full" />
        </div>
      </div>
      <div className="glass rounded-2xl p-6 space-y-4 min-h-[420px]">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
        <Skeleton className="h-12 w-full mt-6" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6, cols = "sm:grid-cols-2 lg:grid-cols-3" }: { count?: number; cols?: string }) {
  return (
    <div className={cn("grid gap-4", cols)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-5 space-y-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="pt-2 flex gap-2">
            <Skeleton className="h-8 w-16 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RowListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="glass rounded-2xl divide-y divide-border overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-1 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-12" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10 space-y-8 animate-fade-in">
      <HeroSkeleton />
      <CardGridSkeleton />
    </div>
  );
}
