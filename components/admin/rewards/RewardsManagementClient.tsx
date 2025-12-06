"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import DetailDrawer from "@/components/admin/DetailDrawer";

type Reward = {
  id: string;
  user_id: string;
  user_email: string | null;
  source: string;
  points: number;
  value_cents: number;
  status: "pending" | "available" | "redeemed" | "expired";
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type RewardFilters = {
  user_id: string;
  status: string;
  from_date: string;
  to_date: string;
};

export default function RewardsManagementClient() {
  const { toast } = useToast();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const [filters, setFilters] = useState<RewardFilters>({
    user_id: "",
    status: "",
    from_date: "",
    to_date: "",
  });

  const fetchRewards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (filters.user_id) searchParams.set("user_id", filters.user_id);
      if (filters.status) searchParams.set("status", filters.status);
      if (filters.from_date) searchParams.set("from_date", filters.from_date);
      if (filters.to_date) searchParams.set("to_date", filters.to_date);
      searchParams.set("limit", limit.toString());
      searchParams.set("offset", offset.toString());

      const response = await fetch(`/api/admin/rewards?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch rewards");
      }

      const data = await response.json();
      setRewards(data.rewards || []);
      setTotal(data.total || 0);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load rewards";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, offset, limit]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const handleUpdateReward = async (updates: {
    status?: string;
    value_cents?: number;
    points?: number;
    metadata?: Record<string, unknown>;
  }) => {
    if (!selectedReward) return;

    try {
      const response = await fetch("/api/admin/rewards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedReward.id,
          ...updates,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update reward");
      }

      await fetchRewards();
      setIsDrawerOpen(false);
      setSelectedReward(null);
      toast({
        title: "Success",
        description: "Reward updated successfully",
        variant: "success",
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update reward";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleCreateReward = async (data: {
    user_id: string;
    value_cents: number;
    points?: number;
    source?: string;
    status?: string;
    reason?: string;
  }) => {
    try {
      const response = await fetch("/api/admin/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create reward");
      }

      await fetchRewards();
      setIsAddModalOpen(false);
      toast({
        title: "Success",
        description: "Reward created successfully",
        variant: "success",
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create reward";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const statusColors: Record<string, string> = {
    available: "bg-green-100 text-green-800",
    redeemed: "bg-blue-100 text-blue-800",
    expired: "bg-gray-100 text-gray-800",
    pending: "bg-yellow-100 text-yellow-800",
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-lg border border-sage/20 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="block text-small font-medium text-charcoal mb-1">
              User ID
            </label>
            <input
              type="text"
              value={filters.user_id}
              onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
              placeholder="Filter by user ID"
              className="w-full rounded border border-sage/30 px-3 py-2 text-small"
            />
          </div>
          <div>
            <label className="block text-small font-medium text-charcoal mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full rounded border border-sage/30 px-3 py-2 text-small"
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="redeemed">Redeemed</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-small font-medium text-charcoal mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.from_date}
              onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
              className="w-full rounded border border-sage/30 px-3 py-2 text-small"
            />
          </div>
          <div>
            <label className="block text-small font-medium text-charcoal mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.to_date}
              onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
              className="w-full rounded border border-sage/30 px-3 py-2 text-small"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              setFilters({ user_id: "", status: "", from_date: "", to_date: "" });
              setOffset(0);
            }}
            className="rounded border border-sage/30 px-4 py-2 text-small font-medium text-charcoal hover:bg-cream"
          >
            Clear Filters
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="rounded bg-sage px-4 py-2 text-small font-medium text-white hover:bg-sageDark"
          >
            Add Reward
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-sage/20 bg-white p-4">
          <div className="text-small text-slateSoft">Total Rewards</div>
          <div className="text-title font-semibold text-charcoal">{total}</div>
        </div>
        <div className="rounded-lg border border-sage/20 bg-white p-4">
          <div className="text-small text-slateSoft">Available</div>
          <div className="text-title font-semibold text-green-600">
            {rewards.filter((r) => r.status === "available").length}
          </div>
        </div>
        <div className="rounded-lg border border-sage/20 bg-white p-4">
          <div className="text-small text-slateSoft">Redeemed</div>
          <div className="text-title font-semibold text-blue-600">
            {rewards.filter((r) => r.status === "redeemed").length}
          </div>
        </div>
        <div className="rounded-lg border border-sage/20 bg-white p-4">
          <div className="text-small text-slateSoft">Total Value</div>
          <div className="text-title font-semibold text-charcoal">
            {formatCurrency(rewards.reduce((sum, r) => sum + r.value_cents, 0))}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-lg border border-sage/20 bg-white p-8 text-center text-slateSoft">
          Loading rewards...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      ) : rewards.length === 0 ? (
        <div className="rounded-lg border border-sage/20 bg-white p-8 text-center text-slateSoft">
          No rewards found
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-sage/20 bg-white">
            <table className="w-full">
              <thead className="bg-cream">
                <tr>
                  <th className="px-4 py-3 text-left text-small font-medium text-charcoal">ID</th>
                  <th className="px-4 py-3 text-left text-small font-medium text-charcoal">User</th>
                  <th className="px-4 py-3 text-left text-small font-medium text-charcoal">Source</th>
                  <th className="px-4 py-3 text-left text-small font-medium text-charcoal">Value</th>
                  <th className="px-4 py-3 text-left text-small font-medium text-charcoal">Points</th>
                  <th className="px-4 py-3 text-left text-small font-medium text-charcoal">Status</th>
                  <th className="px-4 py-3 text-left text-small font-medium text-charcoal">Created</th>
                  <th className="px-4 py-3 text-left text-small font-medium text-charcoal">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/10">
                {rewards.map((reward) => (
                  <tr key={reward.id} className="hover:bg-cream/50">
                    <td className="px-4 py-3 text-small text-charcoal font-mono">
                      {reward.id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-small text-charcoal">
                      {reward.user_email || reward.user_id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-small text-slateSoft">{reward.source}</td>
                    <td className="px-4 py-3 text-small font-medium text-charcoal">
                      {formatCurrency(reward.value_cents)}
                    </td>
                    <td className="px-4 py-3 text-small text-slateSoft">{reward.points}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-small font-medium ${
                          statusColors[reward.status] || statusColors.available
                        }`}
                      >
                        {reward.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-small text-slateSoft">
                      {formatDate(reward.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedReward(reward);
                          setIsDrawerOpen(true);
                        }}
                        className="text-small font-medium text-sage hover:text-sageDark"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between">
              <div className="text-small text-slateSoft">
                Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="rounded border border-sage/30 px-4 py-2 text-small font-medium text-charcoal disabled:opacity-50 hover:bg-cream"
                >
                  Previous
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  className="rounded border border-sage/30 px-4 py-2 text-small font-medium text-charcoal disabled:opacity-50 hover:bg-cream"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Drawer */}
      {selectedReward && (
        <RewardEditDrawer
          reward={selectedReward}
          open={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedReward(null);
          }}
          onUpdate={handleUpdateReward}
        />
      )}

      {/* Add Modal */}
      <AddRewardModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreate={handleCreateReward}
      />
    </div>
  );
}

function RewardEditDrawer({
  reward,
  open,
  onClose,
  onUpdate,
}: {
  reward: Reward;
  open: boolean;
  onClose: () => void;
  onUpdate: (updates: { status?: string; value_cents?: number; points?: number; metadata?: Record<string, unknown> }) => Promise<void>;
}) {
  const [status, setStatus] = useState(reward.status);
  const [valueCents, setValueCents] = useState(reward.value_cents.toString());
  const [points, setPoints] = useState(reward.points.toString());
  const [reason, setReason] = useState(
    (reward.metadata as Record<string, unknown> | null)?.reason as string | undefined || (reward.metadata as Record<string, unknown> | null)?.created_reason as string | undefined || ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate({
      status,
      value_cents: parseInt(valueCents, 10),
      points: parseInt(points, 10),
      metadata: {
        ...reward.metadata,
        reason,
        updated_at: new Date().toISOString(),
      },
    });
  };

  return (
    <DetailDrawer title="Edit Reward" open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-small font-medium text-charcoal mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "pending" | "available" | "redeemed" | "expired")}
            className="w-full rounded border border-sage/30 px-3 py-2"
          >
            <option value="pending">Pending</option>
            <option value="available">Available</option>
            <option value="redeemed">Redeemed</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div>
          <label className="block text-small font-medium text-charcoal mb-1">
            Value (pence)
          </label>
          <input
            type="number"
            value={valueCents}
            onChange={(e) => setValueCents(e.target.value)}
            min="0"
            className="w-full rounded border border-sage/30 px-3 py-2"
          />
          <p className="mt-1 text-small text-slateSoft">
            {new Intl.NumberFormat("en-GB", {
              style: "currency",
              currency: "GBP",
            }).format(parseInt(valueCents || "0", 10) / 100)}
          </p>
        </div>

        <div>
          <label className="block text-small font-medium text-charcoal mb-1">Points</label>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            min="0"
            className="w-full rounded border border-sage/30 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-small font-medium text-charcoal mb-1">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded border border-sage/30 px-3 py-2"
            placeholder="Reason for reward or update..."
          />
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            className="flex-1 rounded bg-sage px-4 py-2 font-medium text-white hover:bg-sageDark"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-sage/30 px-4 py-2 font-medium text-charcoal hover:bg-cream"
          >
            Cancel
          </button>
        </div>
      </form>
    </DetailDrawer>
  );
}

function AddRewardModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { user_id: string; value_cents: number; points: number; source: string; metadata?: Record<string, unknown>; status?: string; reason?: string }) => Promise<void>;
}) {
  const [userId, setUserId] = useState("");
  const [valueCents, setValueCents] = useState("");
  const [points, setPoints] = useState("");
  const [source, setSource] = useState("manual");
  const [status, setStatus] = useState("available");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreate({
      user_id: userId,
      value_cents: parseInt(valueCents, 10),
      points: points ? parseInt(points, 10) : 0,
      source,
      metadata: reason ? { reason, status } : { status },
    });
    // Reset form
    setUserId("");
    setValueCents("");
    setPoints("");
    setSource("manual");
    setStatus("available");
    setReason("");
  };

  if (!open) return null;

  return (
    <DetailDrawer title="Add Manual Reward" open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-small font-medium text-charcoal mb-1">
            User ID (UUID) *
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            className="w-full rounded border border-sage/30 px-3 py-2"
            placeholder="00000000-0000-0000-0000-000000000000"
          />
        </div>

        <div>
          <label className="block text-small font-medium text-charcoal mb-1">
            Value (pence) *
          </label>
          <input
            type="number"
            value={valueCents}
            onChange={(e) => setValueCents(e.target.value)}
            required
            min="0"
            className="w-full rounded border border-sage/30 px-3 py-2"
          />
          <p className="mt-1 text-small text-slateSoft">
            {valueCents
              ? new Intl.NumberFormat("en-GB", {
                  style: "currency",
                  currency: "GBP",
                }).format(parseInt(valueCents, 10) / 100)
              : ""}
          </p>
        </div>

        <div>
          <label className="block text-small font-medium text-charcoal mb-1">Points</label>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            min="0"
            className="w-full rounded border border-sage/30 px-3 py-2"
            placeholder="Defaults to value_cents if not set"
          />
        </div>

        <div>
          <label className="block text-small font-medium text-charcoal mb-1">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full rounded border border-sage/30 px-3 py-2"
          >
            <option value="manual">Manual</option>
            <option value="referral">Referral</option>
            <option value="booking">Booking</option>
            <option value="milestone">Milestone</option>
          </select>
        </div>

        <div>
          <label className="block text-small font-medium text-charcoal mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded border border-sage/30 px-3 py-2"
          >
            <option value="pending">Pending</option>
            <option value="available">Available</option>
            <option value="redeemed">Redeemed</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div>
          <label className="block text-small font-medium text-charcoal mb-1">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded border border-sage/30 px-3 py-2"
            placeholder="Reason for creating this reward..."
          />
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            className="flex-1 rounded bg-sage px-4 py-2 font-medium text-white hover:bg-sageDark"
          >
            Create Reward
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-sage/30 px-4 py-2 font-medium text-charcoal hover:bg-cream"
          >
            Cancel
          </button>
        </div>
      </form>
    </DetailDrawer>
  );
}

