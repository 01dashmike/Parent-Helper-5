"use client";

import { useState } from "react";

type ProviderNotesProps = {
  providerId: number;
  initialNotes: string;
  onUpdate: (notes: string) => void;
};

export default function ProviderNotes({ providerId, initialNotes, onUpdate }: ProviderNotesProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/providers/${providerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (response.ok) {
        onUpdate(notes);
      }
    } catch (error) {
      console.error("Error saving notes:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-sage/20 bg-white p-6">
      <h2 className="text-lg font-semibold text-charcoal mb-4">Internal Notes</h2>
      <div className="space-y-3">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          placeholder="Add internal notes about this provider..."
          className="w-full rounded-md border border-sage/30 px-3 py-2 text-sm"
        />
        <button
          onClick={handleSave}
          disabled={saving || notes === initialNotes}
          className="rounded-md bg-sage px-4 py-2 text-sm font-medium text-white hover:bg-forest disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Notes"}
        </button>
      </div>
    </div>
  );
}








