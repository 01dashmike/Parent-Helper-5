"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";

type AdminProviderListItem = {
  providerId: number;
  name: string;
  town?: string | null;
  createdAt: string;
  status: "pending" | "approved" | "rejected" | "snoozed";
  verificationStatus: "unverified" | "in_review" | "verified" | "flagged";
  tier: "free" | "standard" | "premium" | "enterprise";
  tags: string[];
  onboarding: {
    isComplete: boolean;
    progress: number;
    currentStep?: string | null;
  };
  metrics30d: {
    views: number;
    bookings: number;
    revenue: number;
  };
};

type ProviderListClientProps = {
  initialProviders: Array<Record<string, unknown>>;
};

export default function ProviderListClient({ initialProviders: _initialProviders }: ProviderListClientProps) {
  const [providers, setProviders] = useState<AdminProviderListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    verification: "",
    tier: "",
    onboarding: "",
  });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProviders();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, filters]);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (filters.status) params.set("status", filters.status);
      if (filters.verification) params.set("verification", filters.verification);
      if (filters.tier) params.set("tier", filters.tier);
      if (filters.onboarding) params.set("onboarding", filters.onboarding);

      const response = await fetch(`/api/admin/providers?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers || []);
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters]);

  const handleBulkAction = async (action: string, value?: string) => {
    if (selectedIds.size === 0) return;

    try {
      const response = await fetch("/api/admin/providers/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerIds: Array.from(selectedIds),
          action: value ? { type: action, [action === "setStatus" ? "status" : action === "setVerification" ? "verificationStatus" : "tier"]: value } : { type: action },
        }),
      });

      if (response.ok) {
        setSelectedIds(new Set());
        fetchProviders();
      }
    } catch (error) {
      console.error("Error performing bulk action:", error);
    }
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === providers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(providers.map((p) => p.providerId)));
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "snoozed":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="rounded-lg border border-sage/20 bg-white p-4">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name, town, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-sage/30 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="rounded-md border border-sage/30 px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="snoozed">Snoozed</option>
          </select>
          <select
            value={filters.verification}
            onChange={(e) => setFilters({ ...filters, verification: e.target.value })}
            className="rounded-md border border-sage/30 px-3 py-2 text-sm"
          >
            <option value="">All Verification</option>
            <option value="unverified">Unverified</option>
            <option value="in_review">In Review</option>
            <option value="verified">Verified</option>
            <option value="flagged">Flagged</option>
          </select>
          <select
            value={filters.tier}
            onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
            className="rounded-md border border-sage/30 px-3 py-2 text-sm"
          >
            <option value="">All Tiers</option>
            <option value="free">Free</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <select
            value={filters.onboarding}
            onChange={(e) => setFilters({ ...filters, onboarding: e.target.value })}
            className="rounded-md border border-sage/30 px-3 py-2 text-sm"
          >
            <option value="">All Onboarding</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="complete">Complete</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="rounded-lg border border-sage/20 bg-white p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slateSoft">{selectedIds.size} selected</span>
            <select
              onChange={(e) => {
                const [action, value] = e.target.value.split(":");
                if (action && value) handleBulkAction(action, value);
              }}
              className="rounded-md border border-sage/30 px-3 py-2 text-sm"
            >
              <option value="">Bulk Actions...</option>
              <option value="setStatus:approved">Approve</option>
              <option value="setStatus:rejected">Reject</option>
              <option value="setVerification:verified">Mark Verified</option>
              <option value="setTier:premium">Set Tier: Premium</option>
            </select>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-slateSoft hover:text-charcoal"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-sage/20 bg-white">
        <table className="w-full">
          <thead className="bg-cream/40">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.size === providers.length && providers.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-charcoal">Provider</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-charcoal">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-charcoal">Onboarding</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-charcoal">Metrics (30d)</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-charcoal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slateSoft">
                  Loading...
                </td>
              </tr>
            ) : providers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slateSoft">
                  No providers found
                </td>
              </tr>
            ) : (
              providers.map((provider) => (
                <tr key={provider.providerId} className="border-t border-sage/10 hover:bg-cream/20">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(provider.providerId)}
                      onChange={() => toggleSelect(provider.providerId)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <Link
                        href={`/admin/providers/${provider.providerId}`}
                        className="font-medium text-charcoal hover:text-sage"
                      >
                        {provider.name}
                      </Link>
                      {provider.town && (
                        <div className="text-xs text-slateSoft">{provider.town}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-block rounded-full px-2 py-1 text-xs ${getStatusBadgeColor(provider.status)}`}>
                        {provider.status}
                      </span>
                      <span className="text-xs text-slateSoft">{provider.verificationStatus}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      {provider.onboarding.isComplete ? (
                        <span className="text-green-600">Complete</span>
                      ) : provider.onboarding.progress > 0 ? (
                        <span className="text-yellow-600">{provider.onboarding.progress}%</span>
                      ) : (
                        <span className="text-gray-400">Not started</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slateSoft">
                    <div>Views: {provider.metrics30d.views}</div>
                    <div>Bookings: {provider.metrics30d.bookings}</div>
                  </td>
                  <td className="px-4 py-3">
                    {provider.status === "pending" && (
                      <button
                        onClick={async () => {
                          await fetch(`/api/admin/providers/${provider.providerId}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "approved" }),
                          });
                          fetchProviders();
                        }}
                        className="text-xs text-sage hover:text-forest"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


