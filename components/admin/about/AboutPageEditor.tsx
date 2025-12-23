"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/spinners/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/errormessage";
import { Upload, Save, Plus, Trash2, Eye } from "lucide-react";
import Image from "next/image";

interface AboutPageContent {
  id: number;
  hero_title: string;
  hero_description: string;
  story_title: string;
  story_content: string;
  story_image_url: string | null;
  story_image_url_2: string | null;
  mission_title: string;
  mission_content: string;
  features_title: string;
  features_subtitle: string | null;
  features: Array<{ title: string; description: string; icon: string }>;
  values_title: string;
  values_subtitle: string | null;
  values: Array<{ title: string; description: string; icon: string }>;
  impact_title: string;
  impact_content: string | null;
  impact_stats: Array<{ value: string; label: string }>;
  cta_label: string | null;
  cta_title: string | null;
  cta_content: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  initialContent: AboutPageContent;
}

export default function AboutPageEditor({ initialContent }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // State for all form fields
  const [heroTitle, setHeroTitle] = useState(initialContent.hero_title);
  const [heroDescription, setHeroDescription] = useState(initialContent.hero_description);
  const [storyTitle, setStoryTitle] = useState(initialContent.story_title);
  const [storyContent, setStoryContent] = useState(initialContent.story_content);
  const [storyImageUrl, setStoryImageUrl] = useState(initialContent.story_image_url || "");
  const [storyImageUrl2, setStoryImageUrl2] = useState(initialContent.story_image_url_2 || "");
  const [isUploading2, setIsUploading2] = useState(false);
  const [missionTitle, setMissionTitle] = useState(initialContent.mission_title);
  const [missionContent, setMissionContent] = useState(initialContent.mission_content);
  const [featuresTitle, setFeaturesTitle] = useState(initialContent.features_title);
  const [featuresSubtitle, setFeaturesSubtitle] = useState(initialContent.features_subtitle || "");
  const [features, setFeatures] = useState(initialContent.features);
  const [valuesTitle, setValuesTitle] = useState(initialContent.values_title);
  const [valuesSubtitle, setValuesSubtitle] = useState(initialContent.values_subtitle || "");
  const [values, setValues] = useState(initialContent.values);
  const [impactTitle, setImpactTitle] = useState(initialContent.impact_title);
  const [impactContent, setImpactContent] = useState(initialContent.impact_content || "");
  const [impactStats, setImpactStats] = useState(initialContent.impact_stats);
  const [ctaLabel, setCtaLabel] = useState(initialContent.cta_label || "");
  const [ctaTitle, setCtaTitle] = useState(initialContent.cta_title || "");
  const [ctaContent, setCtaContent] = useState(initialContent.cta_content || "");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageNumber: 1 | 2 = 1) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imageNumber === 1) {
      setIsUploading(true);
    } else {
      setIsUploading2(true);
    }
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("imageType", "story");

      const response = await fetch("/api/admin/about/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      if (imageNumber === 1) {
        setStoryImageUrl(data.url);
      } else {
        setStoryImageUrl2(data.url);
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      if (imageNumber === 1) {
        setIsUploading(false);
      } else {
        setIsUploading2(false);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Helper to convert empty strings to null for optional fields
      const toNullIfEmpty = (value: string) => (value.trim() === "" ? null : value);
      
      const updates = {
        hero_title: heroTitle,
        hero_description: heroDescription,
        story_title: storyTitle,
        story_content: storyContent,
        story_image_url: storyImageUrl || null,
        story_image_url_2: toNullIfEmpty(storyImageUrl2),
        mission_title: missionTitle,
        mission_content: missionContent,
        features_title: featuresTitle,
        features_subtitle: toNullIfEmpty(featuresSubtitle),
        features: features,
        values_title: valuesTitle,
        values_subtitle: toNullIfEmpty(valuesSubtitle),
        values: values,
        impact_title: impactTitle,
        impact_content: toNullIfEmpty(impactContent),
        impact_stats: impactStats,
        cta_label: toNullIfEmpty(ctaLabel),
        cta_title: toNullIfEmpty(ctaTitle),
        cta_content: toNullIfEmpty(ctaContent),
      };

      const response = await fetch("/api/admin/about", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        const data = await response.json();
        // Include details if available (for development debugging)
        const errorMessage = data.details 
          ? `${data.error || "Save failed"}: ${data.details}`
          : data.error || "Save failed";
        throw new Error(errorMessage);
      }

      setSuccess(true);
      startTransition(() => {
        router.refresh();
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving content:", err);
      setError(err instanceof Error ? err.message : "Failed to save content");
    } finally {
      setIsSaving(false);
    }
  };

  const addFeature = () => {
    setFeatures([...features, { title: "", description: "", icon: "🎨" }]);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, field: keyof typeof features[0], value: string) => {
    const updated = [...features];
    updated[index] = { ...updated[index], [field]: value };
    setFeatures(updated);
  };

  const addValue = () => {
    setValues([...values, { title: "", description: "", icon: "⭐" }]);
  };

  const removeValue = (index: number) => {
    setValues(values.filter((_, i) => i !== index));
  };

  const updateValue = (index: number, field: keyof typeof values[0], value: string) => {
    const updated = [...values];
    updated[index] = { ...updated[index], [field]: value };
    setValues(updated);
  };

  const addStat = () => {
    setImpactStats([...impactStats, { value: "", label: "" }]);
  };

  const removeStat = (index: number) => {
    setImpactStats(impactStats.filter((_, i) => i !== index));
  };

  const updateStat = (index: number, field: keyof typeof impactStats[0], value: string) => {
    const updated = [...impactStats];
    updated[index] = { ...updated[index], [field]: value };
    setImpactStats(updated);
  };

  return (
    <div className="space-y-8">
      {/* Action Bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between rounded-2xl border border-sage/30 bg-white p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <a
            href="/about"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-sage/10 px-4 py-2 text-sm font-medium text-sage hover:bg-sage/20 transition-colors"
          >
            <Eye className="h-4 w-4" />
            Preview Page
          </a>
        </div>
        <div className="flex items-center gap-3">
          {success && (
            <span className="text-sm text-green-600">Saved successfully!</span>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving || isPending}
            className="flex items-center gap-2 bg-sage text-white hover:bg-sage/90"
          >
            {isSaving ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {error && (
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
      )}

      {/* Hero Section */}
      <section className="rounded-2xl border border-sage/30 bg-white p-6 shadow-soft">
        <h2 className="mb-4 text-xl font-semibold text-charcoal">Hero Section</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal">Title</label>
            <Input
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="About Parent Helper"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal">Description</label>
            <Textarea
              value={heroDescription}
              onChange={(e) => setHeroDescription(e.target.value)}
              placeholder="A family-founded platform..."
              rows={3}
            />
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="rounded-2xl border border-sage/30 bg-white p-6 shadow-soft">
        <h2 className="mb-4 text-xl font-semibold text-charcoal">Our Story Section</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal">Title</label>
            <Input
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
              placeholder="Our Story"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal">Content (supports multiple paragraphs)</label>
            <Textarea
              value={storyContent}
              onChange={(e) => setStoryContent(e.target.value)}
              placeholder="Parent Helper was born from..."
              rows={12}
              className="font-mono text-xs"
            />
            <p className="mt-1 text-xs text-charcoal/60">Use double line breaks to separate paragraphs</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Image 1 */}
            <div>
              <label className="mb-2 block text-sm font-medium text-charcoal">Image 1 (Top)</label>
              {storyImageUrl && (
                <div className="mb-3 relative aspect-square w-full max-w-md overflow-hidden rounded-lg">
                  <Image
                    src={storyImageUrl}
                    alt="Story section image 1"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              )}
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => handleImageUpload(e, 1)}
                  disabled={isUploading}
                  className="flex-1"
                />
                {isUploading && <LoadingSpinner size="sm" />}
              </div>
              <p className="mt-1 text-xs text-charcoal/60">Or enter a URL below</p>
              <Input
                value={storyImageUrl}
                onChange={(e) => setStoryImageUrl(e.target.value)}
                placeholder="/images/categories/family-hero.png"
                className="mt-2"
              />
            </div>

            {/* Image 2 */}
            <div>
              <label className="mb-2 block text-sm font-medium text-charcoal">Image 2 (Bottom) - Optional</label>
              {storyImageUrl2 && (
                <div className="mb-3 relative aspect-square w-full max-w-md overflow-hidden rounded-lg">
                  <Image
                    src={storyImageUrl2}
                    alt="Story section image 2"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              )}
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => handleImageUpload(e, 2)}
                  disabled={isUploading2}
                  className="flex-1"
                />
                {isUploading2 && <LoadingSpinner size="sm" />}
              </div>
              <p className="mt-1 text-xs text-charcoal/60">Or enter a URL below (leave empty to show only one image)</p>
              <Input
                value={storyImageUrl2}
                onChange={(e) => setStoryImageUrl2(e.target.value)}
                placeholder="Optional second image URL"
                className="mt-2"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="rounded-2xl border border-sage/30 bg-white p-6 shadow-soft">
        <h2 className="mb-4 text-xl font-semibold text-charcoal">Mission Section</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal">Title</label>
            <Input
              value={missionTitle}
              onChange={(e) => setMissionTitle(e.target.value)}
              placeholder="Our Mission"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal">Content</label>
            <Textarea
              value={missionContent}
              onChange={(e) => setMissionContent(e.target.value)}
              placeholder="To support families across the nation..."
              rows={4}
            />
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="rounded-2xl border border-sage/30 bg-white p-6 shadow-soft">
        <h2 className="mb-4 text-xl font-semibold text-charcoal">What We Do Section</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal">Title</label>
            <Input
              value={featuresTitle}
              onChange={(e) => setFeaturesTitle(e.target.value)}
              placeholder="What We Do"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal">Subtitle</label>
            <Textarea
              value={featuresSubtitle}
              onChange={(e) => setFeaturesSubtitle(e.target.value)}
              placeholder="We're here to make finding and booking classes simple..."
              rows={2}
            />
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-medium text-charcoal">Features</label>
              <Button
                onClick={addFeature}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Feature
              </Button>
            </div>
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="rounded-lg border border-sage/20 bg-sage/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-charcoal">Feature {index + 1}</span>
                    <Button
                      onClick={() => removeFeature(index)}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs text-charcoal/70">Icon (emoji)</label>
                      <Input
                        value={feature.icon}
                        onChange={(e) => updateFeature(index, "icon", e.target.value)}
                        placeholder="🔍"
                        className="text-2xl"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-charcoal/70">Title</label>
                      <Input
                        value={feature.title}
                        onChange={(e) => updateFeature(index, "title", e.target.value)}
                        placeholder="Discover Classes"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-charcoal/70">Description</label>
                      <Textarea
                        value={feature.description}
                        onChange={(e) => updateFeature(index, "description", e.target.value)}
                        placeholder="Search through thousands..."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="rounded-2xl border border-sage/30 bg-white p-6 shadow-soft">
        <h2 className="mb-4 text-xl font-semibold text-charcoal">Our Values Section</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal">Title</label>
            <Input
              value={valuesTitle}
              onChange={(e) => setValuesTitle(e.target.value)}
              placeholder="Our Values"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal">Subtitle</label>
            <Textarea
              value={valuesSubtitle}
              onChange={(e) => setValuesSubtitle(e.target.value)}
              placeholder="These core principles guide everything we do..."
              rows={2}
            />
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-medium text-charcoal">Values</label>
              <Button
                onClick={addValue}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Value
              </Button>
            </div>
            <div className="space-y-4">
              {values.map((value, index) => (
                <div key={index} className="rounded-lg border border-sage/20 bg-sage/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-charcoal">Value {index + 1}</span>
                    <Button
                      onClick={() => removeValue(index)}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs text-charcoal/70">Icon (emoji)</label>
                      <Input
                        value={value.icon}
                        onChange={(e) => updateValue(index, "icon", e.target.value)}
                        placeholder="Icon"
                        className="text-2xl"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-charcoal/70">Title</label>
                      <Input
                        value={value.title}
                        onChange={(e) => updateValue(index, "title", e.target.value)}
                        placeholder="Family First"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-charcoal/70">Description</label>
                      <Textarea
                        value={value.description}
                        onChange={(e) => updateValue(index, "description", e.target.value)}
                        placeholder="We understand the challenges parents face..."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="rounded-2xl border border-sage/30 bg-white p-6 shadow-soft">
        <h2 className="mb-4 text-xl font-semibold text-charcoal">Impact Section</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal">Title</label>
            <Input
              value={impactTitle}
              onChange={(e) => setImpactTitle(e.target.value)}
              placeholder="Making a Difference"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal">Content</label>
            <Textarea
              value={impactContent}
              onChange={(e) => setImpactContent(e.target.value)}
              placeholder="We're proud to be part of a community..."
              rows={3}
            />
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-medium text-charcoal">Statistics</label>
              <Button
                onClick={addStat}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Stat
              </Button>
            </div>
            <div className="space-y-3">
              {impactStats.map((stat, index) => (
                <div key={index} className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-charcoal/70">Value</label>
                    <Input
                      value={stat.value}
                      onChange={(e) => updateStat(index, "value", e.target.value)}
                      placeholder="5,000+"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-charcoal/70">Label</label>
                    <Input
                      value={stat.label}
                      onChange={(e) => updateStat(index, "label", e.target.value)}
                      placeholder="Classes Listed"
                    />
                  </div>
                  <Button
                    onClick={() => removeStat(index)}
                    size="sm"
                    variant="ghost"
                    className="h-10 w-10 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="rounded-2xl border border-sage/30 bg-white p-6 shadow-soft">
        <h2 className="mb-4 text-xl font-semibold text-charcoal">Call to Action Section</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal">Label</label>
            <Input
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder="Get started"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal">Title</label>
            <Input
              value={ctaTitle}
              onChange={(e) => setCtaTitle(e.target.value)}
              placeholder="Ready to discover amazing classes?"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal">Content</label>
            <Textarea
              value={ctaContent}
              onChange={(e) => setCtaContent(e.target.value)}
              placeholder="Start exploring classes near you..."
              rows={2}
            />
          </div>
        </div>
      </section>

      {/* Bottom Save Button */}
      <div className="flex items-center justify-end rounded-2xl border border-sage/30 bg-white p-4 shadow-soft">
        <Button
          onClick={handleSave}
          disabled={isSaving || isPending}
          className="flex items-center gap-2 bg-sage text-white hover:bg-sage/90"
          size="lg"
        >
          {isSaving ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

