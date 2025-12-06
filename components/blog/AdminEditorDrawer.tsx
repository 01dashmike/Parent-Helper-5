"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProvider } from "react-hook-form";
import { Sparkles, Eye, Edit } from "lucide-react";
import Image from "next/image";
import { slugify } from "@/lib/slug";
import { Skeleton } from "@/components/ui/skeleton";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { LoadingSpinner } from "@/components/spinners/LoadingSpinner";
import { FormField } from "@/components/ui/formfield";
import { ErrorMessage } from "@/components/ui/errormessage";
import { Button, GhostButton } from "@/components/ui/buttons";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type BlogPost = {
  id: string;
  title?: string | null;
  excerpt?: string | null;
  category?: string | null;
  tags?: string[] | null;
  hero_image?: string | null;
  locality?: string | null;
  postcode_prefix?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  body_markdown?: string | null;
};

type BlogPostUpdate = {
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  hero_image: string;
  locality: string;
  postcode_prefix: string;
  seo_title: string;
  seo_description: string;
  body_markdown: string;
};

interface AdminEditorDrawerProps {
  open: boolean;
  post: BlogPost | null;
  onClose: () => void;
  onSave: (updates: BlogPostUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onPostGenerated?: (post: BlogPost) => void;
}

const blogPostFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  excerpt: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  tags: z.string().optional(),
  hero_image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  locality: z.string().optional(),
  postcode_prefix: z.string().optional(),
  seo_title: z.string().max(60, "SEO title must be 60 characters or less").optional(),
  seo_description: z.string().max(160, "SEO description must be 160 characters or less").optional(),
  body_markdown: z.string().optional(),
});

type BlogPostFormData = z.infer<typeof blogPostFormSchema>;

export default function AdminEditorDrawer({ open, post, onClose, onSave, onDelete, onPostGenerated }: AdminEditorDrawerProps) {
  const form = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostFormSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      category: "Parenting Advice",
      tags: "",
      hero_image: "",
      locality: "",
      postcode_prefix: "",
      seo_title: "",
      seo_description: "",
      body_markdown: "",
    },
  });

  const [markdownPreview, setMarkdownPreview] = useState(false);

  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  // Reset form when post changes
  useEffect(() => {
    if (post) {
      const title = post.title ?? "";
      const excerpt = post.excerpt ?? "";
      form.reset({
        title,
        excerpt,
        category: post.category ?? "Parenting Advice",
        tags: (post.tags ?? []).join(", "),
        hero_image: post.hero_image ?? "",
        locality: post.locality ?? "",
        postcode_prefix: post.postcode_prefix ?? "",
        seo_title: post.seo_title ?? title,
        seo_description: post.seo_description ?? excerpt,
        body_markdown: post.body_markdown ?? "",
      });
      setAiError(null);
    } else {
      form.reset();
      setAiError(null);
    }
  }, [post, form]);

  // Auto-update SEO title if empty when title changes
  const titleValue = form.watch("title");
  const seoTitleValue = form.watch("seo_title");
  useEffect(() => {
    if (titleValue?.trim() && !seoTitleValue?.trim()) {
      form.setValue("seo_title", titleValue);
    }
  }, [titleValue, seoTitleValue, form]);

  // Auto-update SEO description if empty when excerpt changes
  const excerptValue = form.watch("excerpt");
  const seoDescriptionValue = form.watch("seo_description");
  useEffect(() => {
    if (excerptValue?.trim() && !seoDescriptionValue?.trim()) {
      form.setValue("seo_description", excerptValue);
    }
  }, [excerptValue, seoDescriptionValue, form]);

  // Auto-generate slug preview from title
  const slugPreview = useMemo(() => {
    if (!titleValue?.trim()) return "";
    const slug = slugify(titleValue);
    return slug || `post-${Date.now()}`;
  }, [titleValue]);

  const onSubmit = async (data: BlogPostFormData) => {
    if (!post) {
      setAiError("Please select a post to edit or generate a new one with AI");
      return;
    }
    setLoading(true);
    setAiError(null);
    setAnnouncement('Submitting…');
    try {
      const updates: BlogPostUpdate = {
        title: data.title.trim() || "Untitled Post",
        excerpt: data.excerpt?.trim() || "",
        category: data.category.trim() || "Parenting Advice",
        tags: data.tags?.split(",").map((t) => t.trim()).filter(Boolean) || [],
        hero_image: data.hero_image?.trim() || "",
        locality: data.locality?.trim() || "",
        postcode_prefix: data.postcode_prefix?.trim() || "",
        seo_title: data.seo_title?.trim() || data.title.trim() || "Untitled Post",
        seo_description: data.seo_description?.trim() || data.excerpt?.trim() || "",
        body_markdown: data.body_markdown?.trim() || "",
      };
      await onSave(updates);
      setAnnouncement('Saved');
    } catch (error) {
      console.error("Error saving:", error);
      setAiError(error instanceof Error ? error.message : "Failed to save post");
      setAnnouncement('Error saving changes');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWithAI = async () => {
    setAiGenerating(true);
    setAiError(null);
    try {
      const response = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to generate post" }));
        throw new Error(errorData.error || "Failed to generate post");
      }

      const result = await response.json();
      if (!result.ok || !result.post) {
        throw new Error("Invalid response from API");
      }

      const generated = result.post;
      
      // Populate form with generated content
      form.reset({
        title: generated.title || "",
        excerpt: generated.excerpt || "",
        category: generated.category || "Parenting Advice",
        tags: Array.isArray(generated.tags) ? generated.tags.join(", ") : "",
        hero_image: generated.hero_image || "",
        locality: generated.locality || "",
        postcode_prefix: generated.postcode_prefix || "",
        seo_title: generated.seo_title || generated.title || "",
        seo_description: generated.seo_description || generated.excerpt || "",
        body_markdown: generated.body_markdown || "",
      });

      // The generated post is already saved to the database
      // Update the parent component with the new post so user can edit it
      if (onPostGenerated && generated.id) {
        onPostGenerated({
          id: generated.id,
          title: generated.title || null,
          excerpt: generated.excerpt || null,
          category: generated.category || null,
          tags: generated.tags || null,
          hero_image: generated.hero_image || null,
          locality: generated.locality || null,
          postcode_prefix: generated.postcode_prefix || null,
          seo_title: generated.seo_title || null,
          seo_description: generated.seo_description || null,
          body_markdown: generated.body_markdown || null,
        });
      } else {
        // Fallback: refresh page to show new post in list
        onClose();
        setTimeout(() => {
          window.location.reload();
        }, 300);
      }
    } catch (error) {
      console.error("[AdminEditorDrawer] AI generation error:", error);
      setAiError(error instanceof Error ? error.message : "Failed to generate post");
    } finally {
      setAiGenerating(false);
    }
  };

  // Safe preview values that won't crash on empty fields
  const previewTitle = (form.watch("seo_title")?.trim() || form.watch("title")?.trim() || "Untitled Post").slice(0, 60);
  const previewDescription = (form.watch("seo_description")?.trim() || form.watch("excerpt")?.trim() || "No description available.").slice(0, 160);
  const previewImage = form.watch("hero_image")?.trim() || null;

  // Allow AI generation even when no post is selected (creates new post)
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Close editor"
        className="flex-1 bg-black/40 cursor-default"
        onClick={onClose}
      />
      <div className="flex w-full max-w-5xl bg-cream shadow-xl">
        {/* Editor Panel */}
        <aside className="w-full max-w-lg border-r border-sage/20">
          <header className="flex items-center justify-between border-b border-sage/20 px-6 py-4">
            <h2 className="text-title font-semibold text-charcoal">Edit draft</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateWithAI}
                disabled={aiGenerating || loading}
                aria-disabled={aiGenerating || loading}
                aria-busy={aiGenerating ? "true" : "false"}
                className="flex items-center gap-2 rounded-full border border-sage/30 bg-white px-4 py-2 text-small font-medium text-forest transition hover:bg-sage/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiGenerating ? (
                  <>
                    <LoadingSpinner size="sm" label="Generating blog content with AI" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    <span>Generate with AI</span>
                  </>
                )}
              </button>
              <GhostButton onClick={onClose}>Close</GhostButton>
            </div>
          </header>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto px-6 py-4 max-h-[calc(100vh-80px)]" aria-busy={loading || aiGenerating}>
              <VisuallyHidden as="div" aria-live="assertive" aria-atomic="true">
                {announcement}
              </VisuallyHidden>
              {aiError && (
                <ErrorMessage
                  error={aiError}
                  title="Error"
                  onRetry={() => {
                    setAiError(null);
                  }}
                />
              )}
              <FormField
                label="Title"
                required
                error={form.formState.errors.title?.message}
                id="title"
              >
                <Input {...form.register("title")} placeholder="Enter post title" />
              </FormField>
              {slugPreview && (
                <div className="rounded-lg border border-sage/20 bg-white/50 p-2 text-small">
                  <span className="text-slateSoft">Slug preview: </span>
                  <code className="text-forest break-all">{slugPreview}</code>
                </div>
              )}
              <FormField
                label="Excerpt"
                error={form.formState.errors.excerpt?.message}
                id="excerpt"
              >
                <Textarea {...form.register("excerpt")} rows={3} placeholder="Brief summary of the post" />
              </FormField>
              <FormField
                label="Category"
                error={form.formState.errors.category?.message}
                id="category"
              >
                <Input {...form.register("category")} />
              </FormField>
              <FormField
                label="Tags (comma separated)"
                error={form.formState.errors.tags?.message}
                id="tags"
              >
                <Input {...form.register("tags")} />
              </FormField>
              <FormField
                label="Hero image URL"
                error={form.formState.errors.hero_image?.message}
                id="hero_image"
              >
                <Input {...form.register("hero_image")} type="url" />
              </FormField>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FormField
                  label="Locality"
                  error={form.formState.errors.locality?.message}
                  id="locality"
                >
                  <Input {...form.register("locality")} />
                </FormField>
                <FormField
                  label="Postcode prefix"
                  error={form.formState.errors.postcode_prefix?.message}
                  id="postcode_prefix"
                >
                  <Input {...form.register("postcode_prefix")} />
                </FormField>
              </div>
              <div className="border-t border-sage/20 pt-4">
                <h3 className="mb-3 text-small font-semibold text-charcoal">SEO Fields</h3>
                <FormField
                  label="SEO title"
                  error={form.formState.errors.seo_title?.message}
                  helpText={`${form.watch("seo_title")?.length || 0} / 60 characters`}
                  id="seo_title"
                >
                  <Input {...form.register("seo_title")} placeholder={form.watch("title") || "SEO title (defaults to title)"} />
                </FormField>
                <FormField
                  label="SEO description"
                  error={form.formState.errors.seo_description?.message}
                  helpText={`${form.watch("seo_description")?.length || 0} / 160 characters`}
                  id="seo_description"
                >
                  <Textarea {...form.register("seo_description")} rows={2} placeholder={form.watch("excerpt") || "SEO description (defaults to excerpt)"} />
                </FormField>
              </div>
              <div className="border-t border-sage/20 pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-small font-semibold text-charcoal">Blog Content</h3>
                  <button
                    type="button"
                    onClick={() => setMarkdownPreview(!markdownPreview)}
                    className="flex items-center gap-2 rounded-full border border-sage/30 bg-white px-3 py-1.5 text-small font-medium text-forest transition hover:bg-sage/10"
                  >
                    {markdownPreview ? (
                      <>
                        <Edit className="h-4 w-4" aria-hidden="true" />
                        <span>Edit</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        <span>Preview</span>
                      </>
                    )}
                  </button>
                </div>
                {markdownPreview ? (
                  <div className="min-h-[400px] rounded-lg border border-sage/20 bg-white p-4 prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {form.watch("body_markdown") || "*No content yet. Generate a blog post with AI or start writing.*"}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <FormField
                    label="Markdown Content"
                    error={form.formState.errors.body_markdown?.message}
                    id="body_markdown"
                  >
                    <Textarea
                      {...form.register("body_markdown")}
                      rows={20}
                      placeholder="Blog content in Markdown format. Use the 'Generate with AI' button to create content automatically."
                      className="font-mono text-sm"
                    />
                  </FormField>
                )}
              </div>
          <div className="flex items-center justify-between gap-3 pt-4">
            {post && (
              <button
                type="button"
                className="text-small text-terracotta hover:underline"
                onClick={() => post && onDelete(post.id)}
                disabled={loading || aiGenerating}
              >
                Delete
              </button>
            )}
            {!post && <div />}
            <Button
              type="submit"
              loading={loading}
              loadingLabel="Saving changes"
              disabled={loading || aiGenerating || !post}
              aria-label={loading ? "Saving changes" : post ? "Save changes" : "Generate a post with AI first"}
            >
              {loading ? "Saving..." : post ? "Save changes" : "Generate a post with AI first"}
            </Button>
              </div>
            </form>
          </FormProvider>
        </aside>

        {/* Preview Panel */}
        <aside className="hidden w-full max-w-md border-l border-sage/20 lg:block">
          <header className="border-b border-sage/20 px-6 py-4">
            <h2 className="text-title font-semibold text-charcoal">Preview</h2>
          </header>
          <div className="overflow-y-auto px-6 py-4 max-h-[calc(100vh-80px)]">
            {loading ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <div className="rounded-lg border border-sage/20 bg-white p-4 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <div className="rounded-lg border border-sage/20 bg-white overflow-hidden">
                    <Skeleton className="aspect-video w-full" />
                    <div className="p-3 space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <div className="rounded-2xl border border-sage/20 bg-white overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Google Search Result Preview */}
                <div className="mb-6 space-y-2">
                  <h3 className="text-small font-semibold text-charcoal">Search Result Preview</h3>
                  <div className="rounded-lg border border-sage/20 bg-white p-4">
                    <div className="mb-1 text-small text-slateSoft">parenthelper.co.uk</div>
                    <span className="block text-title text-blue-600 line-clamp-1">
                      {previewTitle}
                    </span>
                    <p className="mt-1 text-small text-charcoal/80 line-clamp-2">
                      {previewDescription}
                    </p>
                  </div>
                </div>

                {/* Social Media Preview */}
                <div className="mb-6 space-y-2">
                  <h3 className="text-small font-semibold text-charcoal">Social Media Preview</h3>
                  <div className="rounded-lg border border-sage/20 bg-white overflow-hidden">
                    {previewImage ? (
                      <div className="relative aspect-video bg-cream/40 overflow-hidden">
                        <Image 
                          src={previewImage} 
                          alt={previewTitle}
                          fill
                          className="object-cover"
                          loading="lazy"
                          sizes="(max-width: 768px) 100vw, 400px"
                          onError={(e) => {
                            // Hide image on error to prevent broken image display
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('bg-cream/60');
                          }}
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-cream/40 flex items-center justify-center text-small text-slateSoft">
                        No image
                      </div>
                    )}
                    <div className="p-3">
                      <div className="mb-1 text-small text-slateSoft uppercase">Parent Helper</div>
                      <h4 className="text-body font-semibold text-charcoal line-clamp-2">
                        {previewTitle}
                      </h4>
                      <p className="mt-1 text-small text-slateSoft line-clamp-2">
                        {previewDescription}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Blog Card Preview */}
                <div className="space-y-2">
                  <h3 className="text-small font-semibold text-charcoal">Blog Card Preview</h3>
                  <article className="overflow-hidden rounded-2xl border border-sage/20 bg-white shadow-sm">
                    {previewImage ? (
                      <div className="relative w-full h-48 overflow-hidden bg-cream/40 aspect-[16/9]">
                        <Image 
                          src={previewImage} 
                          alt={previewTitle}
                          fill
                          className="object-cover"
                          loading="lazy"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('bg-cream/60');
                          }}
                        />
                      </div>
                    ) : (
                      <div className="relative w-full h-48 bg-cream/40 flex items-center justify-center text-small text-slateSoft">
                        No image
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-title font-semibold text-charcoal line-clamp-2">
                        {previewTitle}
                      </h3>
                      <p className="mt-2 text-small text-slateSoft line-clamp-3">
                        {previewDescription}
                      </p>
                    </div>
                  </article>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
