"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { Swiper as SwiperType } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

type Item = {
  slug: string;
  title: string;
  blurb: string;
  image: string; // path under /public
  cta?: string;
};

const DEFAULT_ITEMS: Item[] = [
  { slug: "arts",      title: "Arts & Crafts",  blurb: "Paint, glue, glitter, create.", image: "/images/categories/arts.jpg" },
  { slug: "music",     title: "Music & Rhythm", blurb: "Sing, shake, and play together.", image: "/images/categories/music.jpg" },
  { slug: "dance",     title: "Dance & Drama",  blurb: "Confidence through movement.",   image: "/images/categories/dance.jpg" },
  { slug: "outdoor",   title: "Outdoor",        blurb: "Fresh air and nature play.",     image: "/images/categories/outdoor.jpg" },
  { slug: "sports",    title: "Sports",         blurb: "Burn energy, build skills.",     image: "/images/categories/sports.jpg" },
  { slug: "stem",      title: "STEM",           blurb: "Curious minds, hands-on fun.",   image: "/images/categories/stem.jpg" },
];

export default function Carousel({ items = DEFAULT_ITEMS }: { items?: Item[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const swiperRef = useRef<SwiperType | null>(null);

  // simple reveal-on-mount helper for .fade-in
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const on = () => el.classList.add("visible");
    requestAnimationFrame(on);
  }, []);

  return (
    <section className="section my-14">
      <div
        ref={containerRef}
        className="fade-in"
        onMouseEnter={() => swiperRef.current?.autoplay?.stop()}
        onMouseLeave={() => swiperRef.current?.autoplay?.start()}
      >
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Featured categories</h2>
        <p className="text-slate-600 mb-6">Swipe through the experiences trending right now across our most loved towns.</p>

        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 1800, disableOnInteraction: false }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onTouchStart={() => swiperRef.current?.autoplay?.stop()}
          onTouchEnd={() => swiperRef.current?.autoplay?.start()}
          spaceBetween={20}
          slidesPerView={1.1}
          breakpoints={{ 640: { slidesPerView: 1.4 }, 768: { slidesPerView: 2 }, 1024: { slidesPerView: 2.4 } }}
          className="!pb-10"
        >
          {items.map((it) => (
            <SwiperSlide key={it.slug}>
              <motion.article
                className="group overflow-hidden rounded-2xl shadow-soft transition-transform duration-200 ease-out hover:scale-[1.02] hover:shadow-glow"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                viewport={{ once: true }}
              >
                <div className="relative h-[240px] sm:h-[280px]">
                  <Image
                    src={it.image}
                    alt={it.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    priority={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/15 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-3 p-5 text-white">
                    <div className="text-sm leading-relaxed opacity-95">{it.blurb}</div>
                    <Link
                      href={`/classes/${it.slug}`}
                      className="inline-flex w-fit items-center rounded-full bg-sage px-4 py-2 text-sm font-semibold text-white transition-transform duration-200 ease-out hover:scale-105 hover:text-[#C97C5C]"
                    >
                      Explore {it.title.toLowerCase()}
                    </Link>
                  </div>
                </div>
              </motion.article>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
