import { Skeleton } from "@/components/ui/skeleton";

export default function ClassPageLoading() {
  return (
    <div className="bg-cream/30 pb-20">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-3xl border border-sage/30 bg-white p-8 shadow-xl">
          <div className="space-y-4">
            <Skeleton className="h-6 w-32 rounded-full" />
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <Skeleton className="h-9 w-3/4" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
              </div>
              <Skeleton className="h-12 w-24 rounded-lg" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>

          <section className="mt-8 grid gap-6 md:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>

              <div className="space-y-3 rounded-2xl border border-sage/30 bg-cream/40 p-4">
                <Skeleton className="h-5 w-40" />
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-sage/30 bg-cream/40 p-4">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-20 w-full rounded-lg mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

