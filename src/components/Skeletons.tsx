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

function PageHeaderSkeleton() {
  return (
    <div className="mb-8 space-y-3">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-12 w-2/3 max-w-lg" />
      <Skeleton className="h-4 w-1/2 max-w-md" />
    </div>
  );
}

export function DriversPageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <PageHeaderSkeleton />
      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-surface/40 p-3">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-10 w-1 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-8 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StandingsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <PageHeaderSkeleton />
      <div className="mb-8 grid grid-cols-3 gap-3 items-end">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <div className="mb-6 flex gap-2">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>
      <RowListSkeleton count={10} />
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <PageHeaderSkeleton />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-surface/40 p-5">
            <div className="w-16 space-y-1"><Skeleton className="h-3 w-10 mx-auto" /><Skeleton className="h-9 w-12 mx-auto" /></div>
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="text-right space-y-1"><Skeleton className="h-6 w-24" /><Skeleton className="h-3 w-16" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CircuitsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <PageHeaderSkeleton />
      <CardGridSkeleton count={9} />
    </div>
  );
}

export function ConstructorsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <PageHeaderSkeleton />
      <CardGridSkeleton count={10} cols="sm:grid-cols-2" />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10 animate-fade-in space-y-8">
      <Skeleton className="h-3 w-24" />
      <div className="relative overflow-hidden rounded-2xl carbon-texture border border-border p-6 sm:p-10 min-h-[280px] space-y-4">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-14 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  );
}
