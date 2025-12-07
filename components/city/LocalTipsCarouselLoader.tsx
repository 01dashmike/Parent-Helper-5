"use client";

import LocalTipsCarousel from "@/components/city/LocalTipsCarousel";

type Props = {
  citySlug: string;
};

export default function LocalTipsCarouselLoader(props: Props) {
  return <LocalTipsCarousel {...props} />;
}

