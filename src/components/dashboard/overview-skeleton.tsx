import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";

export function OverviewSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading inverter data">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-2 h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <GlassCard className="min-w-0 p-5 sm:p-6 lg:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex gap-3">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <div className="mt-5 grid gap-8 lg:grid-cols-2">
            <div>
              <Skeleton className="h-3 w-28" />
              <Skeleton className="mt-3 h-20 w-60" />
              <Skeleton className="mt-4 h-4 w-44" />
              <Skeleton className="mt-7 h-1.5 w-full rounded-full" />
              <Skeleton className="mt-6 h-1.5 w-full rounded-full" />
            </div>
            <Skeleton className="h-[260px] w-full rounded-panel" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index}>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-2 h-5 w-24" />
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="min-w-0 p-5 lg:col-span-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="mt-6 flex justify-center">
            <Skeleton className="size-40 rounded-full" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index}>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-2 h-4 w-20" />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <GlassCard className="h-80 lg:col-span-7" />
        <GlassCard className="h-80 lg:col-span-5" />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <GlassCard className="h-64 lg:col-span-4" />
        <GlassCard className="h-64 lg:col-span-8" />
      </div>
    </div>
  );
}
