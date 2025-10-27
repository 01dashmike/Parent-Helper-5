interface TagListProps {
  tags: string[];
}

export function TagList({ tags }: TagListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="bg-teal/10 text-teal-dark border border-teal/20 rounded-full px-3 py-1 text-sm"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
