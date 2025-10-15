import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getClassesForTown, getSupportedTowns } from '@/app/lib/classes';

export function generateStaticParams() {
  return getSupportedTowns().map((town) => ({ town }));
}

function formatTownName(value) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function TownClassesPage({ params }) {
  const classes = getClassesForTown(params.town);

  if (!classes) {
    notFound();
  }

  const title = formatTownName(params.town);

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Classes in {title}</h2>
        <p className="text-slate-600">
          These curated sessions are sourced from the Parent Helper knowledge base and showcase the
          power of the new Next.js application architecture.
        </p>
      </div>

      <ul className="space-y-4">
        {classes.map((activity) => (
          <li key={activity.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">{activity.name}</h3>
            <p className="text-sm text-slate-500">Hosted by {activity.provider}</p>
            <p className="mt-2 text-sm font-medium text-slate-700">{activity.schedule}</p>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-slate-900 px-5 py-4 text-slate-100">
        <div>
          <p className="text-sm font-medium">Want to connect your own data?</p>
          <p className="text-sm text-slate-300">
            Hit the API endpoint below or explore more towns from the homepage.
          </p>
        </div>
        <Link href="/" className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900">
          ← Back to homepage
        </Link>
      </div>
    </section>
  );
}
