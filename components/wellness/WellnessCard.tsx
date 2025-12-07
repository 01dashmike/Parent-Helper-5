import Image from "next/image";
import { safeImage } from "@/lib/images";

type WellnessCardProps = {
    title: string;
    description: string;
    icon?: string;
    iconAlt?: string;
};

export default function WellnessCard({
    title,
    description,
    icon,
    iconAlt,
}: WellnessCardProps) {
    const { src, alt } = safeImage({
        src: icon,
        alt: iconAlt || title,
    });

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

