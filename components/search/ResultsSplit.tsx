"use client";

import dynamic from "next/dynamic";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";

const MapPane = dynamic(() => import("./ResultsSplitMap"), {
  ssr: false,
  loading: () => <div className="h-[50vh] rounded-2xl bg-cream animate-pulse" />,
});

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ResultsSplit() {
  const params = useSearchParams();
  const query = params?.toString() ?? "";
  const { data, isLoading } = useSWR(`/api/search?${query}`, fetcher, {
    revalidateOnFocus: false,
  });

  const results = data?.results ?? [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-cream/70 animate-pulse" />
            ))
          : results.length
          ? results.map((r: any) => (
              <article
                key={r.id}
                className="overflow-hidden rounded-2xl border border-sage/20 bg-white shadow-sm"
              >
                <div className="flex">
                  <div className="h-28 w-40 shrink-0">
                    <img
                      src={r.image_url || "/images/categories/arts.jpg"}
                      alt={r.class_name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-3">
                    <h3 className="text-lg font-semibold text-charcoal">{r.class_name}</h3>
                    <p className="text-sm text-slateSoft line-clamp-2">{r.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-sage/15 px-2 py-1 text-charcoal">{r.category}</span>
                      <span className="rounded-full bg-terracotta/10 px-2 py-1 text-terracotta">
                        {typeof r.day_of_week === "number"
                          ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][r.day_of_week]
                          : ""}{" "}
                        {r.start_time?.slice(0, 5)}–{r.end_time?.slice(0, 5)}
                      </span>
                      {r.postcode && (
                        <span className="rounded-full bg-cream px-2 py-1 text-charcoal/70">{r.postcode}</span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))
          : (
              <div className="rounded-2xl border border-sage/20 bg-white p-6 text-center text-slateSoft">
                No classes match your filters yet. Try adjusting the day or distance.
              </div>
            )}
      </div>
      <MapPane results={results} />
    </div>
  );
}
