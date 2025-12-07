"use client";

import { EmptyState } from "@/components/ui/emptystate";
import PostCard, { type PostCardProps } from "./PostCard";

interface BlogClientProps {
  posts?: PostCardProps[];
}

export default function BlogClient({ posts }: BlogClientProps) {
  const list = Array.isArray(posts) ? posts : [];

  if (list.length === 0) {
    return (
      <EmptyState
        title="No posts found"
        description="Try adjusting the filters above to find what you're looking for."
        iconVariant="inbox"
        size="default"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {list.map((post) => (
        <PostCard key={post.id} {...post} />
      ))}
    </div>
  );
}
