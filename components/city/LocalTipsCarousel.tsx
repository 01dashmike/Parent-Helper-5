"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import { cn } from "@/lib/utils";
import { safeImage } from "@/lib/images";

type LocalTip = {
    id: string;
    city_slug: string;
    author: string;
    role: string;
    content: string;
    image_url?: string | null;
    created_at?: string;
};

type LocalTipsCarouselProps = {
    citySlug: string;
};

export default function LocalTipsCarousel({ citySlug }: LocalTipsCarouselProps) {
    const [tips, setTips] = useState<LocalTip[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: true,
        duration: 20,
        align: "center",
    });

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on("select", onSelect);
        emblaApi.on("reInit", onSelect);
    }, [emblaApi, onSelect]);

    useEffect(() => {
        async function fetchTips() {
            try {
                const response = await fetch(`/api/tips?city_slug=${encodeURIComponent(citySlug)}`);
                if (!response.ok) {
                    console.error("Failed to fetch tips");
                    return;
                }
                const data = await response.json();
                setTips(data.tips || []);
            } catch (error) {
                console.error("Error fetching tips:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchTips();
    }, [citySlug]);

    // Auto-advance carousel
    useEffect(() => {
        if (!emblaApi || tips.length <= 1) return;

        const interval = setInterval(() => {
            emblaApi.scrollNext();
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(interval);
    }, [emblaApi, tips.length]);

    if (loading) {
        return null; // Don't render anything while loading to keep LCP low
    }

    if (tips.length === 0) {
        return null; // Don't render if no tips
    }

    return (
        <section className="w-full py-block" aria-label="Local Expert Tips">
            <div className="container mx-auto px-4">
                <h2 className="mb-heading text-title font-semibold text-charcoal">Local Expert Tips</h2>
                <div className="relative overflow-hidden rounded-2xl bg-cream/50">
                    <div className="overflow-hidden" ref={emblaRef}>
                        <div className="flex">
                            {tips.map((tip) => (
                                <div key={tip.id} className="min-w-0 flex-[0_0_100%]">
                                    <div className="flex flex-col gap-4 p-6 md:flex-row md:p-8">
                                        {/* Author Avatar */}
                                        <div className="flex-shrink-0">
                                            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-sage/20 md:h-20 md:w-20 aspect-square">
                                                {tip.image_url ? (
                                                    <Image
                                                        src={safeImage({ src: tip.image_url, alt: tip.author || "Local tip author" }).src}
                                                        alt={tip.author || "Local tip author"}
                                                        fill
                                                        className="object-cover"
                                                        loading="lazy"
                                                        sizes="(max-width: 768px) 64px, 80px"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-display-2 text-sage">
                                                        {tip.author.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Quote Bubble */}
                                        <div className="flex-1">
                                            <div className="relative rounded-2xl bg-white p-6 shadow-card">
                                                {/* Quote mark decoration */}
                                                <div className="absolute -left-2 -top-2 text-display-2 text-sage/20">&quot;</div>
                                                <blockquote className="relative text-body leading-relaxed text-charcoal md:text-body">
                                                    {tip.content}
                                                </blockquote>
                                                <div className="mt-4 flex items-center gap-2 border-t border-sage/10 pt-4">
                                                    <cite className="not-italic font-semibold text-charcoal">{tip.author}</cite>
                                                    <span className="text-small text-slateSoft">—</span>
                                                    <span className="text-small text-slateSoft">{tip.role}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation buttons */}
                    {tips.length > 1 && (
                        <>
                            <button
                                className="min-h-11 min-w-11 flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md transition hover:bg-white md:min-h-0 md:min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                onClick={scrollPrev}
                                aria-label="Previous tip"
                            >
                                <ChevronLeft size={iconSize.md} className="text-charcoal" aria-hidden="true" />
                            </button>
                            <button
                                className="min-h-11 min-w-11 flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md transition hover:bg-white md:min-h-0 md:min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                                onClick={scrollNext}
                                aria-label="Next tip"
                            >
                                <ChevronRight size={iconSize.md} className="text-charcoal" aria-hidden="true" />
                            </button>

                            {/* Dots indicator */}
                            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                                {/* No stable ID available; index key acceptable here - carousel position indicators */}
                                {tips.map((_, index) => (
                                    <button
                                        key={index}
                                        className={cn(
                                            "h-2 w-2 rounded-full transition min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2",
                                            index === selectedIndex ? "bg-sage" : "bg-sage/30"
                                        )}
                                        onClick={() => emblaApi?.scrollTo(index)}
                                        aria-label={`Go to tip ${index + 1}`}
                                        aria-pressed={index === selectedIndex}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

        </section>
    );
}

