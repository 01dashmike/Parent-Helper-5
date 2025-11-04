interface PostMetaProps {
  category: string;
  readingTimeMinutes?: number | null;
  createdAt?: string;
  locality?: string | null;
}

export default function PostMeta({ category, readingTimeMinutes, createdAt, locality }: PostMetaProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-slateSoft">
      {createdAt && <span>{new Date(createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</span>}
      {typeof readingTimeMinutes === "number" && (
        <span>{readingTimeMinutes} min read</span>
      )}
      <span className="rounded-full bg-sage/15 px-2 py-1 text-charcoal">{category}</span>
      {locality && <span className="rounded-full bg-terracotta/10 px-2 py-1 text-terracotta">{locality}</span>}
    </div>
  );
}
