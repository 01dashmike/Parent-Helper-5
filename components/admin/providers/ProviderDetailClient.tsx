"use client";

import { useState } from "react";
import Link from "next/link";
import ProviderTags from "./ProviderTags";
import ProviderNotes from "./ProviderNotes";

type ProviderDetailData = {
  provider: {
    id: number;
    name: string;
    contactEmail?: string | null;
    contactPhone?: string | null;
    addressLine1?: string | null;
    town?: string | null;
    postcode?: string | null;
    website?: string | null;
    createdAt: string;
    slug: string;
  };
  adminMeta: {
    status: "pending" | "approved" | "rejected" | "snoozed";
    verificationStatus: "unverified" | "in_review" | "verified" | "flagged";
    tier: "free" | "standard" | "premium" | "enterprise";
    tags: string[];
    notes?: string | null;
    lastContactedAt?: string | null;
  };
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
  classesSummary: {
    total: number;
    topClasses: Array<{
      id: number;
      name: string;
      town?: string | null;
      isPublished: boolean;
    }>;
  };
};

type ProviderDetailClientProps = {
  initialData: ProviderDetailData;
};

export default function ProviderDetailClient({ initialData }: ProviderDetailClientProps) {
  const [data, setData] = useState(initialData);
  const [saving, setSaving] = useState(false);

  const updateField = async (field: string, value: string | number | boolean | null) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/providers/${data.provider.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        const result = await response.json();
        setData({
          ...data,
          adminMeta: { ...data.adminMeta, ...result.adminMeta },
        });
      }
    } catch (error) {
      console.error("Error updating field:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    await updateField("status", "approved");
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
    <div className="min-h-screen bg-cream px-4 py-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-charcoal mb-2">{data.provider.name}</h1>
            <div className="flex gap-2">
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeColor(data.adminMeta.status)}`}>
                {data.adminMeta.status}
              </span>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                {data.adminMeta.verificationStatus}
              </span>
              <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
                {data.adminMeta.tier}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {data.adminMeta.status === "pending" && (
              <button
                onClick={handleApprove}
                disabled={saving}
                className="rounded-md bg-sage px-4 py-2 text-sm font-medium text-white hover:bg-forest disabled:opacity-50"
              >
                Approve Provider
              </button>
            )}
            <Link
              href={`/provider/${data.provider.slug}`}
              target="_blank"
              className="rounded-md border border-sage/30 px-4 py-2 text-sm font-medium text-charcoal hover:bg-cream"
            >
              View Live Page
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Details */}
            <div className="rounded-lg border border-sage/20 bg-white p-6">
              <h2 className="text-lg font-semibold text-charcoal mb-4">Contact Details</h2>
              <div className="space-y-2 text-sm">
                {data.provider.contactEmail && (
                  <div>
                    <span className="text-slateSoft">Email:</span>{" "}
                    <a href={`mailto:${data.provider.contactEmail}`} className="text-sage hover:text-forest">
                      {data.provider.contactEmail}
                    </a>
                  </div>
                )}
                {data.provider.contactPhone && (
                  <div>
                    <span className="text-slateSoft">Phone:</span>{" "}
                    <a href={`tel:${data.provider.contactPhone}`} className="text-sage hover:text-forest">
                      {data.provider.contactPhone}
                    </a>
                  </div>
                )}
                {data.provider.website && (
                  <div>
                    <span className="text-slateSoft">Website:</span>{" "}
                    <a href={data.provider.website} target="_blank" rel="noopener noreferrer" className="text-sage hover:text-forest">
                      {data.provider.website}
                    </a>
                  </div>
                )}
                {data.provider.addressLine1 && (
                  <div>
                    <span className="text-slateSoft">Address:</span> {data.provider.addressLine1}
                    {data.provider.town && `, ${data.provider.town}`}
                    {data.provider.postcode && ` ${data.provider.postcode}`}
                  </div>
                )}
              </div>
            </div>

            {/* Admin Controls */}
            <div className="rounded-lg border border-sage/20 bg-white p-6">
              <h2 className="text-lg font-semibold text-charcoal mb-4">Admin Controls</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Status</label>
                  <select
                    value={data.adminMeta.status}
                    onChange={(e) => updateField("status", e.target.value)}
                    className="w-full rounded-md border border-sage/30 px-3 py-2 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="snoozed">Snoozed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Verification Status</label>
                  <select
                    value={data.adminMeta.verificationStatus}
                    onChange={(e) => updateField("verificationStatus", e.target.value)}
                    className="w-full rounded-md border border-sage/30 px-3 py-2 text-sm"
                  >
                    <option value="unverified">Unverified</option>
                    <option value="in_review">In Review</option>
                    <option value="verified">Verified</option>
                    <option value="flagged">Flagged</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Tier</label>
                  <select
                    value={data.adminMeta.tier}
                    onChange={(e) => updateField("tier", e.target.value)}
                    className="w-full rounded-md border border-sage/30 px-3 py-2 text-sm"
                  >
                    <option value="free">Free</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tags */}
            <ProviderTags
              providerId={data.provider.id}
              initialTags={data.adminMeta.tags}
              onUpdate={(tags) => setData({ ...data, adminMeta: { ...data.adminMeta, tags } })}
            />

            {/* Notes */}
            <ProviderNotes
              providerId={data.provider.id}
              initialNotes={data.adminMeta.notes || ""}
              onUpdate={(notes) => setData({ ...data, adminMeta: { ...data.adminMeta, notes } })}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Metrics */}
            <div className="rounded-lg border border-sage/20 bg-white p-6">
              <h2 className="text-lg font-semibold text-charcoal mb-4">Metrics (30 days)</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-slateSoft">Views</div>
                  <div className="text-2xl font-semibold text-charcoal">{data.metrics30d.views}</div>
                </div>
                <div>
                  <div className="text-sm text-slateSoft">Bookings</div>
                  <div className="text-2xl font-semibold text-charcoal">{data.metrics30d.bookings}</div>
                </div>
                <div>
                  <div className="text-sm text-slateSoft">Revenue</div>
                  <div className="text-2xl font-semibold text-charcoal">£{data.metrics30d.revenue.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Onboarding */}
            <div className="rounded-lg border border-sage/20 bg-white p-6">
              <h2 className="text-lg font-semibold text-charcoal mb-4">Onboarding</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slateSoft">Progress</span>
                  <span className="font-medium text-charcoal">{data.onboarding.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-cream">
                  <div
                    className="h-2 rounded-full bg-sage"
                    style={{ width: `${data.onboarding.progress}%` }}
                  />
                </div>
                <div className="text-sm text-slateSoft">
                  {data.onboarding.isComplete ? "Complete" : data.onboarding.currentStep || "Not started"}
                </div>
              </div>
            </div>

            {/* Classes */}
            <div className="rounded-lg border border-sage/20 bg-white p-6">
              <h2 className="text-lg font-semibold text-charcoal mb-4">Classes</h2>
              <div className="text-sm text-slateSoft mb-2">Total: {data.classesSummary.total}</div>
              {data.classesSummary.topClasses.length > 0 && (
                <ul className="space-y-2">
                  {data.classesSummary.topClasses.map((cls) => (
                    <li key={cls.id} className="text-sm">
                      <Link href={`/class/${cls.id}`} className="text-sage hover:text-forest">
                        {cls.name}
                      </Link>
                      {cls.town && <span className="text-slateSoft"> • {cls.town}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


