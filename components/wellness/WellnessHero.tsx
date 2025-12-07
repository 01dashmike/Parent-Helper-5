import Image from "next/image";
import { safeImage } from "@/lib/images";

type WellnessHeroProps = {
    title: string;
    subtitle: string;
    image?: string;
    imageAlt?: string;
};

export default function WellnessHero({
    title,
    subtitle,
    image,
    imageAlt,
}: WellnessHeroProps) {
    const { src, alt } = safeImage({
        src: image,
        alt: imageAlt || title,
    });

    return (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sage/10 via-cream to-sage/5">
            <div className="section relative z-10 py-12 md:py-16">
                <div className="mx-auto max-w-3xl text-center">
                    <h1 className="text-display-1 font-bold tracking-tight text-charcoal">
                        {title}
                    </h1>
                    <p className="mt-4 text-body text-slateSoft md:text-title">{subtitle}</p>
                </div>
            </div>
            {image && (
                <div className="absolute inset-0 opacity-10">
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        className="object-cover object-center"
                        sizes="100vw"
                        priority={false}
                    />
                </div>
            )}
        </section>
    );
}

