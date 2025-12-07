"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { isPersonalizationEnabled } from "@/lib/env";

// Helper function to check if child profiles feature is enabled
// Uses robust boolean check to prevent crashes when env var is undefined
function isChildProfilesEnabled(): boolean {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_CHILD_PROFILES_ENABLED === "true";
  }
  return process.env.CHILD_PROFILES_ENABLED === "true";
}

type Child = {
  id: string;
  first_name: string;
};

export function ChildContextSwitcher(): React.ReactNode {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [children, setChildren] = useState<Child[]>([]);
    const [activeChildId, setActiveChildId] = useState<string | null>(
        searchParams?.get("childId") || null
    );

    useEffect(() => {
        // Only fetch if both personalization and child profiles are enabled
        if (!isPersonalizationEnabled() || !isChildProfilesEnabled()) {
            return;
        }

        const fetchChildren = async () => {
            try {
                const response = await fetch("/api/children");
                if (response.ok) {
                    const data = await response.json();
                    setChildren(data.data || []);
                }
            } catch (error) {
                console.error("[ChildContextSwitcher] Unexpected error:", error);
            }
        };

        fetchChildren();
        // eslint-disable-next-line react-hooks/exhaustive-deps
        // Reason: effect should only run once on mount to fetch children list
    }, []);

    useEffect(() => {
        if (!searchParams) return;
        const childId = searchParams.get("childId");
        setActiveChildId(childId);
    }, [searchParams]);

    // Hide component if features are disabled or no children available
    if (!isPersonalizationEnabled() || !isChildProfilesEnabled() || children.length === 0) {
        return null;
    }

    const handleChildChange = (childId: string | null) => {
        if (!searchParams) return;
        const params = new URLSearchParams(searchParams.toString());
        
        if (childId) {
            params.set("childId", childId);
        } else {
            params.delete("childId");
        }

        router.push(`?${params.toString()}`);
    };

    const activeChild = activeChildId
        ? children.find((c) => c.id === activeChildId)
        : null;

    return (
        <div className="rounded-lg border border-sage/20 bg-cream/40 p-4">
            <label className="block text-small font-medium text-charcoal mb-2">
                Filter for Child
            </label>
            <select
                value={activeChildId || ""}
                onChange={(e) => handleChildChange(e.target.value || null)}
                className="w-full rounded-lg border border-sage/30 bg-white px-4 py-2 text-small text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
            >
                <option value="">All Children</option>
                {children.map((child) => (
                    <option key={child.id} value={child.id}>
                        {child.first_name}
                    </option>
                ))}
            </select>
            {activeChild && (
                <p className="mt-2 text-small text-slateSoft">
                    Showing personalized recommendations for {activeChild.first_name}
                </p>
            )}
        </div>
    );
}

