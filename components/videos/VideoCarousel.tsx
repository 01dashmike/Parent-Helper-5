"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { motionTokens } from "@/lib/motion/tokens";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { iconSize } from "@/lib/icons/tokens";
import { cn } from "@/lib/utils";

interface VideoRecord {
    id: string;
    title: string;
    video_url?: string | null;
    thumbnail_url?: string | null;
    duration_seconds?: number;
    tags?: string[];
}

interface Props {
    videos: VideoRecord[];
    autoPlay?: boolean;
    autoPlayInterval?: number;
}

export default function VideoCarousel({ videos, autoPlay = true, autoPlayInterval = 5000 }: Props) {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: true,
        align: "start",
        skipSnaps: false,
    });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

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

    // Auto-play video when it becomes visible
    useEffect(() => {
        if (videos.length === 0) return;
        const currentVideo = videos[selectedIndex];
        if (currentVideo) {
            setPlayingVideoId(currentVideo.id);
        }
    }, [selectedIndex, videos]);

    // Auto-advance carousel
    useEffect(() => {
        if (!autoPlay || !emblaApi || videos.length <= 1) return;
        const interval = setInterval(() => {
            emblaApi.scrollNext();
        }, autoPlayInterval);
        return () => clearInterval(interval);
    }, [emblaApi, autoPlay, autoPlayInterval, videos.length]);

    if (videos.length === 0) {
        return (
            <div className="py-8 text-center text-slateSoft">
                <p>No tip videos available at the moment.</p>
            </div>
        );
    }

    return (
        <div className="relative w-full">
            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex gap-4">
                    {videos.map((video, index) => (
                        <div
                            key={video.id}
                            className="relative flex-[0_0_100%] min-w-0"
                            style={{ aspectRatio: "9/16" }}
                        >
                            <AnimatePresence mode="wait">
                                {selectedIndex === index && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: motionTokens.medium }}
                                        className="relative h-full w-full overflow-hidden rounded-lg bg-black"
                                    >
                                        {video.video_url ? (
                                            <video
                                                key={video.id}
                                                src={video.video_url}
                                                autoPlay
                                                loop
                                                muted
                                                playsInline
                                                className="h-full w-full object-cover"
                                                onPlay={() => setPlayingVideoId(video.id)}
                                                onPause={() => {
                                                    if (playingVideoId === video.id) {
                                                        setPlayingVideoId(null);
                                                    }
                                                }}
                                            />
                                        ) : video.thumbnail_url ? (
                                            <Image
                                                src={video.thumbnail_url}
                                                alt={video.title || "Video thumbnail"}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 100vw, 540px"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-cream text-slateSoft">
                                                <p>No video available</p>
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                            <h3 className="mb-1 text-title font-semibold text-white">{video.title}</h3>
                                            {video.duration_seconds && (
                                                <p className="text-small text-white/80">{video.duration_seconds}s</p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>

            {videos.length > 1 && (
                <>
                    <button
                        onClick={scrollPrev}
                        className="min-h-11 min-w-11 flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-lg hover:bg-white md:min-h-0 md:min-w-0"
                        aria-label="Previous video"
                    >
                        <ChevronLeft size={iconSize.lg} aria-hidden="true" />
                    </button>
                    <button
                        onClick={scrollNext}
                        className="min-h-11 min-w-11 flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-lg hover:bg-white md:min-h-0 md:min-w-0"
                        aria-label="Next video"
                    >
                        <ChevronRight size={iconSize.lg} aria-hidden="true" />
                    </button>

                    <div className="mt-4 flex justify-center gap-2">
                        {/* No stable ID available; index key acceptable here - carousel position indicators */}
                        {videos.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => emblaApi?.scrollTo(index)}
                                className={cn(
                                    "h-2 rounded-full transition-all",
                                    index === selectedIndex ? "w-8 bg-blue-600" : "w-2 bg-cream"
                                )}
                                aria-label={`Go to video ${index + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

