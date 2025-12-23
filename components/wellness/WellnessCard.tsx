import Image from "next/image";
import { safeImage } from "@/lib/images";

type WellnessCardProps = {
    title: string;
    description: string;
    icon?: string;
    iconAlt?: string;
    backgroundImage?: string;
    imagePosition?: string;
    imageScale?: number;
};

export default function WellnessCard({
    title,
    description,
    icon,
    iconAlt,
    backgroundImage,
    imagePosition = "center",
    imageScale,
}: WellnessCardProps) {
    const { src, alt } = safeImage({
        src: icon,
        alt: iconAlt || title,
    });

    const { src: bgSrc } = safeImage({
        src: backgroundImage,
        alt: `${title} background`,
    });

    if (backgroundImage) {
        return (
            <article className="group relative h-full min-h-[240px] overflow-hidden rounded-2xl shadow-soft transition-all duration-300 hover:shadow-soft-lg hover:scale-[1.02]">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <Image
                        src={bgSrc}
                        alt={alt}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        style={{ 
                            objectPosition: imagePosition,
                        }}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 20vw"
                    />
                </div>
                {/* Gradient Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/70 to-charcoal/50" />
                
                {/* Content */}
                <div className="relative flex h-full flex-col justify-end p-6 text-white">
                    <h3 className="mb-2 text-xl font-semibold text-white drop-shadow-lg">
                        {title}
                    </h3>
                    <p className="text-sm leading-relaxed text-white/95 drop-shadow-md">
                        {description}
                    </p>
                </div>
            </article>
        );
    }

    return (
        <article className="rounded-2xl bg-white shadow-soft p-4 border border-slate-200/60 transition-shadow duration-200 hover:shadow-soft-lg">
            {icon && (
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sage/10">
                    <Image
                        src={src}
                        alt={alt}
                        width={32}
                        height={32}
                        className="h-8 w-8 object-contain"
                    />
                </div>
            )}
            <h3 className="text-title font-semibold text-charcoal">{title}</h3>
            <p className="mt-2 text-small leading-relaxed text-slateSoft">{description}</p>
        </article>
    );
}

