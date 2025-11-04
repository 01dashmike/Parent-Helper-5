"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import AdminEditorDrawer from "./AdminEditorDrawer";

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
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return posts.filter((post) =>
      filterStatus ? post.status === filterStatus : true,
    );
  }, [posts, filterStatus]);

  const publishPost = (id: string) => {
    startTransition(async () => {
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
    });
  };

  const handleDelete = async (id: string) => {
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
  };

  const handleSave = async (updates: any) => {
    if (!selectedPost) return;
    const response = await fetch("/api/blog/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", id: selectedPost.id, updates }),
    });
    if (!response.ok) {
      console.error("Failed to save post", await response.text());
      return;
    }
    setDrawerOpen(false);
    router.refresh();
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
        {isPending && <span className="text-sm text-slateSoft">Updating…</span>}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-sage/20 bg-white">
        <table className="min-w-full divide-y divide-sage/20 text-left text-sm">
          <thead className="bg-cream/70 text-slateSoft">
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
              <tr key={post.id} className="hover:bg-cream/60">
                <td className="px-4 py-3">
                  <div className="font-semibold text-charcoal">{post.title}</div>
                  {post.excerpt && <p className="text-xs text-slateSoft line-clamp-1">{post.excerpt}</p>}
                </td>
                <td className="px-4 py-3 capitalize">{post.status}</td>
                <td className="px-4 py-3">{post.category}</td>
                <td className="px-4 py-3">{post.locality ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-sage px-3 py-1 text-xs text-sage transition hover:bg-sage/10"
                      onClick={() => {
                        setSelectedPost(post);
                        setDrawerOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    {post.status !== "published" && (
                      <button
                        type="button"
                        className="rounded-full bg-sage px-3 py-1 text-xs font-medium text-white transition hover:bg-sage/90 hover:text-[#C97C5C]"
                        onClick={() => publishPost(post.id)}
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
      </div>

      <AdminEditorDrawer
        open={drawerOpen}
        post={selectedPost}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
