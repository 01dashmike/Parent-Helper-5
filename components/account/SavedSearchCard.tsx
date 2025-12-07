"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { formatDistanceToNow as formatDistanceToNowUtil } from "@/lib/utils/date";
import { BellOff, Bell, Loader2, Play, Edit2, Trash2 } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";
import * as Select from "@radix-ui/react-select";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import type { SearchFilters } from "@/lib/types/search";

type SavedSearch = {
  id: string;
  query: string;
  town: string | null;
  filters: SearchFilters | null;
  created_at: string;
  last_alert_at: string | null;
  alert_frequency: "daily" | "weekly" | "none";
  is_active: boolean;
};

type SavedSearchCardProps = {
  search: SavedSearch;
  onDelete: (id: string) => Promise<void>;
  onUpdateFrequency: (id: string, frequency: "daily" | "weekly" | "none") => Promise<void>;
};

export function SavedSearchCard({
  search,
  onDelete,
  onUpdateFrequency,
}: SavedSearchCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentFrequency, setCurrentFrequency] = useState(search.alert_frequency);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this saved search?")) {
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete(search.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFrequencyChange = async (newFrequency: "daily" | "weekly" | "none") => {
    setIsUpdating(true);
    try {
      await onUpdateFrequency(search.id, newFrequency);
      setCurrentFrequency(newFrequency);
    } catch (error) {
      console.error("Failed to update frequency:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const router = useRouter();

  const buildSearchUrl = () => {
    return `/search?${search.query}`;
  };

  const handleRunSearch = () => {
    router.push(buildSearchUrl());
  };

  const handleEditSearch = () => {
    // Navigate to search page with prefilled params
    router.push(buildSearchUrl());
  };

  const parseQuery = () => {
    const params = new URLSearchParams(search.query);
    return {
      q: params.get("q") || "",
      town: search.town || params.get("town") || "",
      age: params.get("age") || "",
      category: params.get("category") || "",
    };
  };

  const parsed = parseQuery();
  const searchDescription = [
    parsed.q && `"${parsed.q}"`,
    parsed.town && `in ${parsed.town}`,
    parsed.age && `ages ${parsed.age}`,
    parsed.category && parsed.category,
  ]
    .filter(Boolean)
    .join(" • ") || "General search";

  const frequencyLabel = {
    daily: "Daily",
    weekly: "Weekly",
    none: "Off",
  }[currentFrequency];

  return (
    <article className="card rounded-xl bg-white border-l-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-small">
            <h3 className="text-title font-semibold text-charcoal">Search</h3>
            {!search.is_active && (
              <span className="text-small text-charcoal/60 bg-cream px-2 py-1 rounded">
                Inactive
              </span>
            )}
          </div>
          <p className="text-small text-slateSoft mb-small">{searchDescription}</p>
          <div className="flex flex-wrap items-center gap-2 text-small text-charcoal/60 mb-4">
            <span>Saved {format(new Date(search.created_at), "PPP")}</span>
            {search.last_alert_at && (
              <span>
                • Last checked {formatDistanceToNowUtil(search.last_alert_at)}
              </span>
            )}
          </div>

          {/* Alert Frequency Toggle */}
          <div className="flex items-center gap-3">
            <label className="text-small font-medium text-charcoal flex items-center gap-2">
              {currentFrequency === "none" ? (
                <BellOff size={iconSize.sm} className="text-charcoal/60" aria-hidden="true" />
              ) : (
                <Bell size={iconSize.sm} className="text-sage" aria-hidden="true" />
              )}
              Alert frequency:
            </label>
            <Select.Root
              value={currentFrequency}
              onValueChange={(value) =>
                handleFrequencyChange(value as "daily" | "weekly" | "none")
              }
              disabled={isUpdating}
            >
              <Select.Trigger
                className="input input-sm inline-flex items-center justify-between"
                aria-label="Alert frequency"
              >
                <Select.Value>{frequencyLabel}</Select.Value>
                {isUpdating && (
                  <span role="status" aria-live="polite" className="inline-flex items-center">
                    <Loader2 size={iconSize.sm} className="ml-2 motion-safe:animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    <VisuallyHidden>Updating alert frequency...</VisuallyHidden>
                  </span>
                )}
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="overflow-hidden rounded-lg border border-sage/30 bg-white shadow-elevated">
                  <Select.Viewport className="p-1">
                    <Select.Item
                      value="daily"
                      className="relative flex items-center rounded px-3 py-2 text-small text-charcoal hover:bg-cream focus:bg-cream focus:outline-none cursor-pointer"
                    >
                      <Select.ItemText>Daily</Select.ItemText>
                    </Select.Item>
                    <Select.Item
                      value="weekly"
                      className="relative flex items-center rounded px-3 py-2 text-small text-charcoal hover:bg-cream focus:bg-cream focus:outline-none cursor-pointer"
                    >
                      <Select.ItemText>Weekly</Select.ItemText>
                    </Select.Item>
                    <Select.Item
                      value="none"
                      className="relative flex items-center rounded px-3 py-2 text-small text-charcoal hover:bg-cream focus:bg-cream focus:outline-none cursor-pointer"
                    >
                      <Select.ItemText>Off</Select.ItemText>
                    </Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0">
          <motion.button
            onClick={handleRunSearch}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-sm btn-primary gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            aria-label="Run search again"
          >
            <Play size={iconSize.sm} aria-hidden="true" />
            <span className="hidden sm:inline">Run search</span>
          </motion.button>
          <div className="flex gap-2">
            <motion.button
              onClick={handleEditSearch}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="btn btn-sm btn-outline min-h-11 min-w-11 rounded-xl md:min-h-0 md:min-w-0 hover:bg-cream hover:border-sage/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              aria-label="Edit search"
            >
              <Edit2 size={iconSize.sm} aria-hidden="true" />
            </motion.button>
            <motion.button
              onClick={handleDelete}
              disabled={isDeleting}
              aria-busy={isDeleting ? "true" : "false"}
              whileHover={{ scale: isDeleting ? 1 : 1.1 }}
              whileTap={{ scale: isDeleting ? 1 : 0.9 }}
              className="btn btn-sm min-h-11 min-w-11 rounded-xl border border-terracotta/30 bg-white text-terracotta hover:bg-terracotta/10 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/50 focus-visible:ring-offset-2 md:min-h-0 md:min-w-0"
              aria-label="Delete search"
            >
              {isDeleting ? (
                <span role="status" aria-live="polite" className="inline-flex items-center">
                  <Loader2 size={iconSize.sm} className="motion-safe:animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  <VisuallyHidden>Deleting search...</VisuallyHidden>
                </span>
              ) : (
                <Trash2 size={iconSize.sm} aria-hidden="true" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </article>
  );
}

