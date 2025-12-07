"use client";

import Carousel from "../Carousel";
import SafeBoundary from "../system/SafeBoundary";

type CarouselItem = {
  title: string;
  image: string;
  description: string;
};

export default function CarouselClient({ items }: { items?: CarouselItem[] }) {
    return (
        <SafeBoundary fallback={<div className="py-8 text-center text-slateSoft">Loading categories…</div>}>
            <Carousel items={items ?? []} />
        </SafeBoundary>
    );
}
