"use client";

import { memo } from "react";
import Image from "next/image";
import LinkComponent from "@/components/ui/link";
import { motion } from "framer-motion";
import { motionTokens } from "@/lib/motion/tokens";
import { useMotion } from "@/lib/hooks/useMotion";
import { safeImage } from "@/lib/images";
import PostMeta from "./PostMeta";
import { CardContainer, CardBody } from "@/components/cards";
import { MotionDiv } from "@/components/motion/MotionDiv";

export interface PostCardProps {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  category: string;
  hero_image?: string | null;
  reading_time_minutes?: number | null;
  locality?: string | null;
  created_at?: string;
}

function PostCard({
  slug,
  title,
  excerpt,
  category,
  hero_image,
  reading_time_minutes,
  locality,
  created_at,
  id: _id,
}: PostCardProps) {
  const { src, alt } = safeImage({ src: hero_image, alt: title });
  const { fadeInSlideUp, whileHover } = useMotion();

  return (
    <CardContainer
      as={motion.article}
      initial={fadeInSlideUp(0, 0.3).initial}
      animate={fadeInSlideUp(0, 0.3).animate}
      transition={fadeInSlideUp(0, 0.3).transition}
      whileHover={whileHover({ y: -4 })}
      className="overflow-hidden"
    >
      <LinkComponent 
        href={`/blog/${slug}`} 
        aria-label={title}
        className="block"
        prefetch={false}
      >
        <motion.div
          className="relative w-full h-48 md:h-56 overflow-hidden bg-cream/40 aspect-[16/9]"
          whileHover={whileHover({ scale: 1.05 })}
          transition={{ duration: motionTokens.medium }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover object-center"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={false}
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent p-4 text-white">
            <h3 className="text-title font-semibold leading-snug line-clamp-2" lang="en">{title}</h3>
          </div>
        </motion.div>
      </LinkComponent>
      <CardBody>
        <div className="space-y-3">
          <PostMeta
            category={category}
            readingTimeMinutes={reading_time_minutes ?? undefined}
            createdAt={created_at}
            locality={locality}
          />
          {excerpt && <p className="text-small text-slateSoft line-clamp-3" lang="en">{excerpt}</p>}
          <MotionDiv hoverAnimation={{ x: 4 }}>
            <LinkComponent
              href={`/blog/${slug}`}
              className="inline-flex items-center text-body font-medium text-forest motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none hover:text-terracotta rounded"
              prefetch={false}
            >
              Continue reading →
            </LinkComponent>
          </MotionDiv>
        </div>
      </CardBody>
    </CardContainer>
  );
}

// Memoize PostCard to prevent unnecessary re-renders
export default memo(PostCard);
