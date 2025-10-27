import Link from "next/link";

import type { Class } from "@/types";

interface ClassListProps {
  classes: Class[];
}

export default function ClassList({ classes }: ClassListProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {classes.map((item) => (
        <article
          key={item.id}
          className="flex h-full flex-col justify-between rounded-3xl border border-teal/10 bg-white p-6 shadow-md shadow-teal/10 transition-transform duration-300 hover:-translate-y-1"
        >
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">{item.name}</h2>
            <p className="text-sm font-medium text-teal-dark">
              {item.provider ?? "Featured Provider"}
            </p>
            <p className="text-sm text-slate-600">{item.schedule ?? "Schedule coming soon"}</p>
            {item.description ? (
              <p className="text-sm text-slate-500">{item.description}</p>
            ) : null}
          </div>
          <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
            <span>{item.town ? item.town.toUpperCase() : "Nationwide"}</span>
            <Link
              href={`/classes/${item.id}`}
              className="font-semibold text-coral transition-colors duration-200 hover:text-coral-dark"
            >
              View details →
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
