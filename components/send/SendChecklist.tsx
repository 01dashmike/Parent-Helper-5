"use client";

import { useState } from "react";
import { Check, Circle } from "lucide-react";
import { iconSize } from "@/lib/icons/tokens";

type ChecklistItem = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
};

interface SendChecklistProps {
  items?: ChecklistItem[];
  onItemChange?: (id: string, checked: boolean) => void;
}

const defaultItems: ChecklistItem[] = [
  {
    id: "sensory-friendly",
    label: "Sensory-friendly environment",
    description: "Quiet spaces, reduced lighting options, sensory tools available",
    checked: false,
  },
  {
    id: "small-groups",
    label: "Small group sizes",
    description: "Maximum 8-10 children per session for better support",
    checked: false,
  },
  {
    id: "trained-staff",
    label: "SEND-trained staff",
    description: "Staff with experience or training in supporting children with additional needs",
    checked: false,
  },
  {
    id: "flexible-schedule",
    label: "Flexible scheduling",
    description: "Ability to accommodate different needs and break times",
    checked: false,
  },
  {
    id: "accessible-venue",
    label: "Accessible venue",
    description: "Wheelchair accessible, clear signage, accessible toilets",
    checked: false,
  },
  {
    id: "visual-supports",
    label: "Visual supports available",
    description: "Visual schedules, picture cards, or communication aids",
    checked: false,
  },
  {
    id: "parent-welcome",
    label: "Parent/carer welcome",
    description: "Parents can stay and support their child during sessions",
    checked: false,
  },
  {
    id: "quiet-space",
    label: "Quiet space available",
    description: "Designated area for children who need a break",
    checked: false,
  },
];

export default function SendChecklist({
  items = defaultItems,
  onItemChange,
}: SendChecklistProps) {
  const [localItems, setLocalItems] = useState<ChecklistItem[]>(items);

  const handleToggle = (id: string) => {
    const updated = localItems.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setLocalItems(updated);
    const item = updated.find((i) => i.id === id);
    if (item && onItemChange) {
      onItemChange(id, item.checked);
    }
  };

  const checkedCount = localItems.filter((item) => item.checked).length;
  const progress = (checkedCount / localItems.length) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-title text-text-primary">SEND-Friendly Checklist</h3>
        <span className="text-small text-text-tertiary">
          {checkedCount} of {localItems.length} completed
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-sage/20">
        <div
          className="h-full bg-sage transition-all duration-300"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={checkedCount}
          aria-valuemin={0}
          aria-valuemax={localItems.length}
          aria-label={`${checkedCount} of ${localItems.length} checklist items completed`}
        />
      </div>

      <div className="space-y-3">
        {localItems.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-sage/20 bg-surface-alt p-4 transition-all hover:border-sage/40 hover:shadow-card"
          >
            <div className="mt-0.5 shrink-0">
              {item.checked ? (
                <Check size={iconSize.md} className="text-sage" aria-hidden="true" />
              ) : (
                <Circle size={iconSize.md} className="text-charcoal/30" aria-hidden="true" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => handleToggle(item.id)}
                  className="sr-only"
                  aria-label={item.label}
                />
                <span className="font-medium text-text-primary">{item.label}</span>
              </div>
              <p className="mt-1 text-small text-text-tertiary">{item.description}</p>
            </div>
          </label>
        ))}
      </div>

      {checkedCount === localItems.length && (
        <div className="rounded-lg bg-brand/10 border border-sage/30 p-4 text-center">
          <p className="text-small font-medium text-brand">
            🎉 Great work! Your class meets SEND-friendly criteria.
          </p>
        </div>
      )}
    </div>
  );
}

