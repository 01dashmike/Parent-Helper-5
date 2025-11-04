"use client";

import { useState, useEffect } from "react";

export interface AdminEditorDrawerProps {
  open: boolean;
  post: any | null;
  onClose: () => void;
  onSave: (updates: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const initialState = {
  title: "",
  excerpt: "",
  category: "Parenting Advice",
  tags: "",
  hero_image: "",
  locality: "",
  postcode_prefix: "",
  seo_title: "",
  seo_description: "",
};

export default function AdminEditorDrawer({ open, post, onClose, onSave, onDelete }: AdminEditorDrawerProps) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (post) {
      setForm({
        title: post.title ?? "",
        excerpt: post.excerpt ?? "",
        category: post.category ?? "Parenting Advice",
        tags: (post.tags ?? []).join(", "),
        hero_image: post.hero_image ?? "",
        locality: post.locality ?? "",
        postcode_prefix: post.postcode_prefix ?? "",
        seo_title: post.seo_title ?? post.title ?? "",
        seo_description: post.seo_description ?? post.excerpt ?? "",
      });
    } else {
      setForm(initialState);
    }
  }, [post]);

  const handleChange = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!post) return;
    setLoading(true);
    await onSave({
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setLoading(false);
  };

  if (!open || !post) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <aside className="w-full max-w-lg bg-cream shadow-xl">
        <header className="flex items-center justify-between border-b border-sage/20 px-6 py-4">
          <h2 className="text-lg font-semibold text-charcoal">Edit draft</h2>
          <button type="button" onClick={onClose} className="text-sm text-slateSoft hover:text-sage">Close</button>
        </header>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto px-6 py-4">
          <label className="block text-sm">
            <span className="text-slateSoft">Title</span>
            <input value={form.title} onChange={handleChange("title")} className="ph-input w-full" required />
          </label>
          <label className="block text-sm">
            <span className="text-slateSoft">Excerpt</span>
            <textarea value={form.excerpt} onChange={handleChange("excerpt")} className="ph-input w-full" rows={3} />
          </label>
          <label className="block text-sm">
            <span className="text-slateSoft">Category</span>
            <input value={form.category} onChange={handleChange("category")} className="ph-input w-full" />
          </label>
          <label className="block text-sm">
            <span className="text-slateSoft">Tags (comma separated)</span>
            <input value={form.tags} onChange={handleChange("tags")} className="ph-input w-full" />
          </label>
          <label className="block text-sm">
            <span className="text-slateSoft">Hero image URL</span>
            <input value={form.hero_image} onChange={handleChange("hero_image")} className="ph-input w-full" />
          </label>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block text-sm">
              <span className="text-slateSoft">Locality</span>
              <input value={form.locality} onChange={handleChange("locality")} className="ph-input w-full" />
            </label>
            <label className="block text-sm">
              <span className="text-slateSoft">Postcode prefix</span>
              <input value={form.postcode_prefix} onChange={handleChange("postcode_prefix")} className="ph-input w-full" />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-slateSoft">SEO title</span>
            <input value={form.seo_title} onChange={handleChange("seo_title")} className="ph-input w-full" />
          </label>
          <label className="block text-sm">
            <span className="text-slateSoft">SEO description</span>
            <textarea value={form.seo_description} onChange={handleChange("seo_description")} className="ph-input w-full" rows={2} />
          </label>
          <div className="flex items-center justify-between gap-3 pt-4">
            <button
              type="button"
              className="text-sm text-terracotta hover:underline"
              onClick={() => post && onDelete(post.id)}
            >
              Delete
            </button>
            <button
              type="submit"
              className="rounded-full bg-sage px-5 py-2 text-sm font-medium text-white transition hover:bg-sage/90"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
