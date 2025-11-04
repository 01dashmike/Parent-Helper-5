import Image from "next/image";
import Link from "next/link";
import PostMeta from "./PostMeta";

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

export default function PostCard({ slug, title, excerpt, category, hero_image, reading_time_minutes, locality, created_at }: PostCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-sage/20 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/blog/${slug}`} aria-label={title}>
        <div className="relative h-48 w-full">
          <Image
            src={hero_image || "/images/categories/arts.jpg"}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent p-4 text-white">
            <h3 className="text-lg font-semibold leading-snug">{title}</h3>
          </div>
        </div>
      </Link>
      <div className="space-y-3 p-4">
        <PostMeta
          category={category}
          readingTimeMinutes={reading_time_minutes ?? undefined}
          createdAt={created_at}
          locality={locality}
        />
        {excerpt && <p className="text-sm text-slateSoft line-clamp-3">{excerpt}</p>}
        <Link href={`/blog/${slug}`} className="inline-flex items-center text-sm font-medium text-sage transition hover:text-[#C97C5C]">
          Continue reading →
        </Link>
      </div>
    </article>
  );
}
