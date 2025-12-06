"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProvider } from "react-hook-form";
import AdminEditorDrawer from "./AdminEditorDrawer";
import { EmptyState } from "@/components/ui/emptystate";
import { Button } from "@/components/ui/buttons";
import { FormField } from "@/components/ui/formfield";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/spinners/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/errormessage";
import { Sparkles, Plus, X } from "lucide-react";

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
  body_markdown?: string | null;
}

interface Props {
  posts: PostRecord[];
}

const blogCreationSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  category: z.string().min(1, "Category is required"),
  intent: z.string().optional(),
  target_locality: z.string().optional(),
  target_postcode_prefix: z.string().optional(),
  customGuidelines: z.string().optional(),
});

type BlogCreationFormData = z.infer<typeof blogCreationSchema>;

export default function AdminBlogsClient({ posts }: Props) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<string>("draft");
  const [selectedPost, setSelectedPost] = useState<PostRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showCreationForm, setShowCreationForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const creationForm = useForm<BlogCreationFormData>({
    resolver: zodResolver(blogCreationSchema),
    defaultValues: {
      topic: "",
      category: "Parenting Advice",
      intent: "",
      target_locality: "",
      target_postcode_prefix: "",
      customGuidelines: "",
    },
  });

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

  const handleCreateBlog = async (data: BlogCreationFormData) => {
    setGenerating(true);
    setGenerationError(null);
    try {
      const response = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customTopic: data.topic,
          category: data.category,
          intent: data.intent || undefined,
          target_locality: data.target_locality || undefined,
          target_postcode_prefix: data.target_postcode_prefix || undefined,
          customGuidelines: data.customGuidelines || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to generate post" }));
        throw new Error(errorData.error || "Failed to generate post");
      }

      const result = await response.json();
      if (!result.ok || !result.post) {
        throw new Error("Invalid response from API");
      }

      // Close creation form and open editor with new post
      setShowCreationForm(false);
      creationForm.reset();
      setSelectedPost(result.post as PostRecord);
      setDrawerOpen(true);
      router.refresh();
    } catch (error) {
      console.error("[AdminBlogsClient] Blog creation error:", error);
      setGenerationError(error instanceof Error ? error.message : "Failed to create blog post");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select className="ph-input w-48" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </select>
          {isPending && <span className="text-small text-slateSoft">Updating…</span>}
        </div>
        <Button
          onClick={() => setShowCreationForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Create New Blog</span>
        </Button>
      </div>

      {showCreationForm && (
        <div className="rounded-2xl border border-accent/20 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-charcoal">Create New Blog Post</h2>
            <button
              type="button"
              onClick={() => {
                setShowCreationForm(false);
                creationForm.reset();
                setGenerationError(null);
              }}
              className="rounded-full p-1 text-slateSoft transition hover:bg-sage/10 hover:text-charcoal"
              aria-label="Close creation form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <FormProvider {...creationForm}>
            <form onSubmit={creationForm.handleSubmit(handleCreateBlog)} className="space-y-4">
              {generationError && (
                <ErrorMessage
                  error={generationError}
                  title="Generation Error"
                  onRetry={() => setGenerationError(null)}
                />
              )}
              <FormField
                label="Topic/Title"
                required
                error={creationForm.formState.errors.topic?.message}
                id="topic"
              >
                <Input {...creationForm.register("topic")} placeholder="e.g., Gentle sleep strategies for newborns" />
              </FormField>
              <FormField
                label="Category"
                required
                error={creationForm.formState.errors.category?.message}
                id="category"
              >
                <Input {...creationForm.register("category")} placeholder="e.g., Parenting Advice" />
              </FormField>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FormField
                  label="Intent (optional)"
                  error={creationForm.formState.errors.intent?.message}
                  id="intent"
                  helpText="e.g., evergreen, local_guide"
                >
                  <Input {...creationForm.register("intent")} placeholder="evergreen" />
                </FormField>
                <FormField
                  label="Target Locality (optional)"
                  error={creationForm.formState.errors.target_locality?.message}
                  id="target_locality"
                >
                  <Input {...creationForm.register("target_locality")} placeholder="e.g., Andover" />
                </FormField>
              </div>
              <FormField
                label="Postcode Prefix (optional)"
                error={creationForm.formState.errors.target_postcode_prefix?.message}
                id="target_postcode_prefix"
              >
                <Input {...creationForm.register("target_postcode_prefix")} placeholder="e.g., SP10" />
              </FormField>
              <FormField
                label="Custom Guidelines/Instructions (optional)"
                error={creationForm.formState.errors.customGuidelines?.message}
                id="customGuidelines"
                helpText="Additional instructions for the AI to follow when generating the blog post"
              >
                <Textarea
                  {...creationForm.register("customGuidelines")}
                  rows={4}
                  placeholder="e.g., Focus on practical tips for first-time parents. Include information about local resources in the area."
                />
              </FormField>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreationForm(false);
                    creationForm.reset();
                    setGenerationError(null);
                  }}
                  className="rounded-full border border-sage/30 bg-white px-4 py-2 text-small font-medium text-forest transition hover:bg-sage/10"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  loading={generating}
                  loadingLabel="Generating..."
                  disabled={generating}
                  className="flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <LoadingSpinner size="sm" label="Generating blog post" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      <span>Generate Blog Post</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </FormProvider>
        </div>
      )}

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
