"use client";

import { useState } from "react";
import { X, Volume2 } from "lucide-react";
import { Accessibility as Wheelchair } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";

type SendFilters = {
  town?: string;
  noiseLevel?: string;
  wheelchairAccess?: boolean;
};

interface SendFilterDrawerProps {
  filters: SendFilters;
  onFiltersChange: (filters: SendFilters) => void;
  onClose: () => void;
}

export function SendFilterDrawer({
  filters,
  onFiltersChange,
  onClose,
}: SendFilterDrawerProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <button
        type="button"
        aria-label="Close filters"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />
      <div
        className="absolute right-0 top-0 h-full w-full max-w-md bg-surface-alt shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-charcoal/10 px-6 py-4">
            <h2 className="text-title text-text-primary">Filters</h2>
            <button
              onClick={onClose}
              className="rounded p-1 text-text-tertiary hover:bg-text-primary/5"
            >
              <X size={iconSize.md} aria-hidden="true" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Noise Level */}
            <div className="mb-6">
              <label className="mb-2 flex items-center gap-2 text-small font-medium text-text-primary">
                <Volume2 size={iconSize.sm} aria-hidden="true" />
                Noise Level
              </label>
              <div className="space-y-2">
                {["quiet", "moderate", "loud"].map((level) => (
                  <label
                    key={level}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-charcoal/10 p-3 hover:bg-charcoal/5"
                  >
                    <input
                      type="radio"
                      name="noiseLevel"
                      value={level}
                      checked={localFilters.noiseLevel === level}
                      onChange={(e) =>
                        setLocalFilters({ ...localFilters, noiseLevel: e.target.value })
                      }
                      className="h-4 w-4 text-brand"
                    />
                    <span className="text-small text-text-primary capitalize">{level}</span>
                  </label>
                ))}
                <button
                  onClick={() =>
                    setLocalFilters({ ...localFilters, noiseLevel: undefined })
                  }
                  className="text-small text-text-tertiary hover:text-text-primary"
                >
                  Clear selection
                </button>
              </div>
            </div>

            {/* Wheelchair Access */}
            <div className="mb-6">
              <label className="mb-2 flex items-center gap-2 text-small font-medium text-text-primary">
                <Wheelchair size={iconSize.sm} aria-hidden="true" />
                Accessibility
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-charcoal/10 p-3 hover:bg-charcoal/5">
                <input
                  type="checkbox"
                  checked={localFilters.wheelchairAccess || false}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      wheelchairAccess: e.target.checked || undefined,
                    })
                  }
                  className="h-4 w-4 rounded text-brand"
                />
                <span className="text-small text-text-primary">Wheelchair accessible</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-charcoal/10 p-6">
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setLocalFilters({});
                  onFiltersChange({});
                  onClose();
                }}
                className="flex-1 rounded-lg border border-text-primary/20 px-4 py-2 text-small font-medium text-text-primary transition hover:bg-text-primary/5"
              >
                Clear All
              </button>
              <button
                onClick={handleApply}
                className="flex-1 rounded-lg bg-brand px-4 py-2 text-small font-medium text-white transition hover:bg-brand/90"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


