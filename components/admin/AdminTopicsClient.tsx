"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";

interface Topic {
  slug: string;
  title: string;
  description: string;
  hero_image?: string | null;
  created_at?: string;
}

interface Post {
  id: number;
  title: string;
  slug: string;
  status: string;
}

interface Class {
  id: number;
  name: string;
  town?: string | null;
  category?: string | null;
}

interface Props {
  topics: Topic[];
  posts: Post[];
  classes: Class[];
}

export default function AdminTopicsClient({ topics, posts, classes }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    description: "",
    hero_image: "",
    postIds: [] as number[],
    classIds: [] as number[],
  });

  const handleCreate = () => {
    setIsCreating(true);
    setEditingTopic(null);
    setFormData({
      slug: "",
      title: "",
      description: "",
      hero_image: "",
      postIds: [],
      classIds: [],
    });
  };

  const handleEdit = (topic: Topic) => {
    // Fetch associated posts and classes
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/topics?slug=${topic.slug}`);
        if (response.ok) {
          const data = await response.json();
          setFormData({
            slug: topic.slug,
            title: topic.title,
            description: topic.description,
            hero_image: topic.hero_image || "",
            postIds: data.postIds || [],
            classIds: data.classIds || [],
          });
          setIsCreating(false);
          setEditingTopic(topic);
        }
      } catch (err) {
        console.error("Error editing topic:", err);
      }
    });
  };

  const handleSave = async () => {
    if (!formData.slug || !formData.title || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in slug, title, and description",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        const action = editingTopic ? "update" : "create";
        const response = await fetch("/api/admin/topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            topicSlug: editingTopic?.slug,
            topic: {
              slug: formData.slug,
              title: formData.title,
              description: formData.description,
              hero_image: formData.hero_image || null,
            },
            postIds: formData.postIds,
            classIds: formData.classIds,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to save topic",
            variant: "destructive",
          });
          return;
        }

        setIsCreating(false);
        setEditingTopic(null);
        router.refresh();
        toast({
          title: "Success",
          description: editingTopic ? "Topic updated successfully" : "Topic created successfully",
          variant: "success",
        });
      } catch (err) {
        console.error("Error saving topic:", err);
      }
    });
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(`Delete topic "${slug}"?`)) return;

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", topicSlug: slug }),
        });

        if (!response.ok) {
          const error = await response.json();
          toast({
            title: "Error",
            description: error.error || "Failed to delete topic",
            variant: "destructive",
          });
          return;
        }

        router.refresh();
        toast({
          title: "Success",
          description: "Topic deleted successfully",
          variant: "success",
        });
      } catch (err) {
        console.error("Error deleting topic:", err);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleCreate}
          className="rounded-full bg-sage px-4 py-2 text-small font-medium text-white transition hover:bg-sage/90"
        >
          + Create Topic Hub
        </button>
        {isPending && <span className="text-small text-slateSoft">Saving…</span>}
      </div>

      {(isCreating || editingTopic) && (
        <div className="rounded-2xl border border-sage/20 bg-white p-6">
          <h2 className="mb-4 text-title font-semibold">{editingTopic ? "Edit Topic" : "Create Topic"}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-small font-medium text-charcoal">Slug *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="ph-input mt-1 w-full"
                placeholder="e.g., baby-sensory-classes"
                disabled={!!editingTopic}
              />
            </div>
            <div>
              <label className="block text-small font-medium text-charcoal">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="ph-input mt-1 w-full"
                placeholder="e.g., Baby Sensory Classes"
              />
            </div>
            <div>
              <label className="block text-small font-medium text-charcoal">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="ph-input mt-1 w-full"
                rows={4}
                placeholder="Describe this topic hub..."
              />
            </div>
            <div>
              <label className="block text-small font-medium text-charcoal">Hero Image URL</label>
              <input
                type="text"
                value={formData.hero_image}
                onChange={(e) => setFormData({ ...formData, hero_image: e.target.value })}
                className="ph-input mt-1 w-full"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-small font-medium text-charcoal">Attach Posts</label>
              <select
                multiple
                value={formData.postIds.map(String)}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (opt) => Number(opt.value));
                  setFormData({ ...formData, postIds: selected });
                }}
                className="ph-input mt-1 w-full"
                size={5}
              >
                {posts.map((post) => (
                  <option key={post.id} value={post.id}>
                    {post.title}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-small text-slateSoft">Hold Ctrl/Cmd to select multiple</p>
            </div>
            <div>
              <label className="block text-small font-medium text-charcoal">Attach Classes</label>
              <select
                multiple
                value={formData.classIds.map(String)}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (opt) => Number(opt.value));
                  setFormData({ ...formData, classIds: selected });
                }}
                className="ph-input mt-1 w-full"
                size={5}
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.town ? `(${cls.town})` : ""}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-small text-slateSoft">Hold Ctrl/Cmd to select multiple</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleSave} className="inline-flex items-center justify-center rounded-md px-4 py-2 text-small font-medium bg-sage text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none hover:bg-sage/90 hover:text-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 shadow-soft disabled:opacity-50 disabled:cursor-not-allowed" disabled={isPending}>
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingTopic(null);
                }}
                className="inline-flex items-center justify-center rounded-md px-4 py-2 text-small font-medium border border-sage/30 bg-white text-sage motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none hover:bg-sage/10 hover:text-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-sage/20 bg-white">
        <table className="min-w-full divide-y divide-sage/20 text-left text-small">
          <thead className="bg-cream/70 text-slateSoft">
            <tr>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sage/10">
            {topics.map((topic) => (
              <tr key={topic.slug} className="hover:bg-cream/60">
                <td className="px-4 py-3 font-mono text-small">{topic.slug}</td>
                <td className="px-4 py-3 font-semibold text-charcoal">{topic.title}</td>
                <td className="px-4 py-3 text-small text-slateSoft line-clamp-2">{topic.description}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <a
                      href={`/topics/${topic.slug}`}
                      className="rounded-full border border-sage px-3 py-1 text-small text-sage transition hover:bg-sage/10"
                    >
                      View
                    </a>
                    <button
                      type="button"
                      className="rounded-full border border-sage px-3 py-1 text-small text-sage transition hover:bg-sage/10"
                      onClick={() => handleEdit(topic)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-red-500 px-3 py-1 text-small font-medium text-white transition hover:bg-red-600"
                      onClick={() => handleDelete(topic.slug)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

