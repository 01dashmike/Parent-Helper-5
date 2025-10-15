import Link from 'next/link';

const FEATURED_TOWNS = [
  { name: 'London', slug: 'london', summary: 'A thriving hub of sensory and music classes for babies.' },
  { name: 'Manchester', slug: 'manchester', summary: 'Creative playgroups and outdoor adventures in the North West.' },
  { name: 'Bristol', slug: 'bristol', summary: 'Sustainable, community-driven activities for little explorers.' },
];

export default function HomePage() {
  return (
    <section className="space-y-10">
      <div className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Plan unforgettable days with your little one
        </h2>
        <p className="max-w-2xl text-lg text-slate-600">
          Parent Helper curates the best baby and toddler classes across the United Kingdom.
          Explore by town, compare activities, and bookmark your favourites—all powered by a
          modern Next.js experience.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURED_TOWNS.map((town) => (
          <article
            key={town.slug}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <h3 className="text-xl font-semibold text-slate-900">{town.name}</h3>
            <p className="mt-2 text-sm text-slate-600">{town.summary}</p>
            <Link
              href={`/classes/${town.slug}`}
              className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Browse classes<span aria-hidden="true" className="ml-1">→</span>
            </Link>
          </article>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        Looking for a different town? Try editing the URL manually or connect the API endpoint at
        <code className="mx-2 rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">/api/classes?town=&lt;name&gt;</code>
        to power your own integrations.
      </div>
    </section>
  );
}
