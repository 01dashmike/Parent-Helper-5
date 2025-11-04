import Link from "next/link";

const HIGHLIGHTS = [
  { label: "Curated activities", value: "5,000+" },
  { label: "Trusted providers", value: "320" },
  { label: "Cities covered", value: "75" },
];

export default function HomeHero() {
  return (
    <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-primary via-accent to-secondary p-10 text-white shadow-glow sm:p-14">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_55%)]" />
      <div className="relative grid gap-12 md:grid-cols-[1.2fr,0.8fr] md:items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center rounded-full bg-white/20 px-4 py-1 text-xs font-semibold tracking-wide uppercase text-white/90 shadow-sm backdrop-blur">
            For joyful childhood adventures
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Discover magical days out with Parent Helper
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
            Search inspiring parent-and-child classes, compare warm community
            spaces, and save the experiences that light up your little one&apos;s
            world. We deliver beautifully organised recommendations every week.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/classes/london"
              className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            >
              Browse featured towns
            </Link>
            <Link
              href="#join"
              className="inline-flex items-center rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white/90 transition hover:border-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            >
              Join the family newsletter
            </Link>
          </div>
        </div>

        <div className="rounded-3xl bg-white/15 p-6 shadow-inner backdrop-blur">
          <div className="grid gap-6">
            {HIGHLIGHTS.map((highlight) => (
              <div
                key={highlight.label}
                className="rounded-2xl border border-white/30 bg-white/10 p-6 shadow-soft transition hover:bg-white/15"
              >
                <p className="text-sm font-medium uppercase tracking-widest text-white/80">
                  {highlight.label}
                </p>
                <p className="mt-2 text-3xl font-semibold">{highlight.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
