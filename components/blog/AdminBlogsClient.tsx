"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import AdminEditorDrawer from "./AdminEditorDrawer";
import { EmptyState } from "@/components/ui/emptystate";

interface PostRecord {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  tags?: string[];
  created_at?: string;
  excerpt?: string | null;
  locality?: string | null;
  hero_image?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  postcode_prefix?: string | null;
}

interface Props {
  posts: PostRecord[];
}

export default function AdminBlogsClient({ posts }: Props) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<string>("draft");
  const [selectedPost, setSelectedPost] = useState<PostRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return posts.filter((post) =>
      filterStatus ? post.status === filterStatus : true,
    );
  }, [posts, filterStatus]);

  const publishPost = (id: string) => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/blog/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "publish", id }),
        });
        if (!response.ok) {
          console.error("Failed to publish post", await response.text());
          return;
        }
        router.refresh();
      } catch (err) {
        console.error("Error publishing post:", err);
      }
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch("/api/blog/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      if (!response.ok) {
        console.error("Failed to delete post", await response.text());
        return;
      }
      setDrawerOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  const handleSave = async (updates: Partial<PostRecord>) => {
    if (!selectedPost) return;
    try {
      const response = await fetch("/api/blog/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", id: selectedPost.id, updates }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to save post", errorText);
        throw new Error(errorText || "Failed to save post");
      }
      const result = await response.json();
      if (!result.ok) {
        throw new Error("Save failed");
      }
      setDrawerOpen(false);
      setSelectedPost(null);
      router.refresh();
    } catch (err) {
      console.error("Error saving post:", err);
      throw err; // Re-throw so AdminEditorDrawer can handle it
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <select className="ph-input w-48" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
        </select>
        {isPending && <span className="text-small text-slateSoft">Updating…</span>}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-accent/20 bg-white">
        <table className="min-w-full divide-y divide-accent/20 text-left text-small">
          <thead className="bg-surface/70 text-slateSoft">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Locality</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage/10">
            {filtered.map((post) => (
              <tr key={post.id} className="hover:bg-surface/60">
                <td className="px-4 py-3">
                  <div className="font-semibold text-primary">{post.title}</div>
                  {post.excerpt && <p className="text-small text-slateSoft line-clamp-1">{post.excerpt}</p>}
                </td>
                <td className="px-4 py-3 capitalize">{post.status}</td>
                <td className="px-4 py-3">{post.category}</td>
                <td className="px-4 py-3">{post.locality ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-accent px-3 py-1 text-small text-accent transition hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2"
                      onClick={() => {
                        setSelectedPost(post);
                        setDrawerOpen(true);
                      }}
                      aria-label={`Edit ${post.title}`}
                    >
                      Edit
                    </button>
                    {post.status !== "published" && (
                      <button
                        type="button"
                        className="rounded-full bg-accent px-3 py-1 text-small font-medium text-white transition hover:bg-accent/90 hover:text-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2"
                        onClick={() => publishPost(post.id)}
                        aria-label={`Approve and publish ${post.title}`}
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8">
            <EmptyState
              title="No posts found"
              description={filterStatus ? `No posts found with status "${filterStatus}".` : "No posts found."}
              iconVariant="inbox"
              size="default"
            />
          </div>
        )}
      </div>

      <AdminEditorDrawer
        open={drawerOpen}
        post={selectedPost}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedPost(null);
        }}
        onSave={handleSave}
        onDelete={handleDelete}
        onPostGenerated={(newPost) => {
          // Update selected post and refresh list
          setSelectedPost(newPost as PostRecord);
          router.refresh();
        }}
      />
    </div>
  );
}
