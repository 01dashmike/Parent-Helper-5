"use client";

import { useState } from "react";

type ProviderTagsProps = {
  providerId: number;
  initialTags: string[];
  onUpdate: (tags: string[]) => void;
};

export default function ProviderTags({ providerId, initialTags, onUpdate }: ProviderTagsProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);

  const addTag = async (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag || tags.includes(trimmedTag)) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/providers/${providerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: [...tags, trimmedTag] }),
      });

      if (response.ok) {
        const newTags = [...tags, trimmedTag];
        setTags(newTags);
        onUpdate(newTags);
        setInputValue("");
      }
    } catch (error) {
      console.error("Error adding tag:", error);
    } finally {
      setSaving(false);
    }
  };

  const removeTag = async (tagToRemove: string) => {
    setSaving(true);
    try {
      const newTags = tags.filter((t) => t !== tagToRemove);
      const response = await fetch(`/api/admin/providers/${providerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: newTags }),
      });

      if (response.ok) {
        setTags(newTags);
        onUpdate(newTags);
      }
    } catch (error) {
      console.error("Error removing tag:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  return (
    <div className="rounded-lg border border-sage/20 bg-white p-6">
      <h2 className="text-lg font-semibold text-charcoal mb-4">Tags</h2>
      <div className="space-y-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type and press Enter to add a tag"
          disabled={saving}
          className="w-full rounded-md border border-sage/30 px-3 py-2 text-sm disabled:opacity-50"
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-sage/15 px-3 py-1 text-sm text-forest"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  disabled={saving}
                  className="hover:text-charcoal disabled:opacity-50"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}








