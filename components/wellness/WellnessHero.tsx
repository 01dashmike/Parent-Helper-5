type WellnessHeroProps = {
    title: string;
    subtitle: string;
};

export default function WellnessHero({
    title,
    subtitle,
}: WellnessHeroProps) {
    return (
        <section className="relative overflow-hidden rounded-hero bg-gradient-to-br from-primary via-accent to-secondary p-10 shadow-glow sm:p-14">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_55%)]" />
            <div className="relative z-10">
                <div className="mx-auto max-w-3xl text-center">
                    <h1 className="text-display-1 font-bold tracking-tight text-emerald-900">
                        {title}
                    </h1>
                    <p className="mt-4 text-body text-emerald-800 md:text-title">{subtitle}</p>
                </div>
            </div>
        </section>
    );
}


