"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface AuditData {
  classesMissingLocation: { count: number; items: Array<Record<string, unknown>> };
  classesMissingAgeRanges: { count: number; items: Array<Record<string, unknown>> };
  providersWithNoPublishedClasses: { count: number; items: Array<Record<string, unknown>> };
  usersWithNoEmail: { count: number; items: Array<Record<string, unknown>> };
  walletsWithNegativeBalance: { count: number; items: Array<Record<string, unknown>> };
  referralsMissingUserId: { count: number; items: Array<Record<string, unknown>> };
  rewardsWithoutMetadata: { count: number; items: Array<Record<string, unknown>> };
  errors?: Record<string, string | undefined>;
}

import { themeColors } from "@/lib/theme-colors";

export default function AuditDashboardClient() {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAuditData() {
      try {
        const response = await fetch("/api/admin/audit");
        if (!response.ok) {
          throw new Error("Failed to fetch audit data");
        }
        const auditData = await response.json();
        setData(auditData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchAuditData();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-sage/20 bg-white p-8 text-center text-slateSoft">
        <p>Loading audit data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center text-red-600">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-sage/20 bg-white p-8 text-center text-slateSoft">
        <p>No audit data available</p>
      </div>
    );
  }

  const totalIssues =
    data.classesMissingLocation.count +
    data.classesMissingAgeRanges.count +
    data.providersWithNoPublishedClasses.count +
    data.usersWithNoEmail.count +
    data.walletsWithNegativeBalance.count +
    data.referralsMissingUserId.count +
    data.rewardsWithoutMetadata.count;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Issues"
          value={totalIssues}
          color={totalIssues > 0 ? themeColors.terracotta : themeColors.sage.alt}
        />
        <KPICard
          title="Classes Missing Location"
          value={data.classesMissingLocation.count}
          color={themeColors.sage.alt}
        />
        <KPICard
          title="Classes Missing Age Ranges"
          value={data.classesMissingAgeRanges.count}
          color={themeColors.sage.alt}
        />
        <KPICard
          title="Providers No Classes"
          value={data.providersWithNoPublishedClasses.count}
          color={themeColors.sage.alt}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Users No Email"
          value={data.usersWithNoEmail.count}
          color={data.usersWithNoEmail.count > 0 ? themeColors.terracotta : themeColors.sage.alt}
        />
        <KPICard
          title="Negative Wallets"
          value={data.walletsWithNegativeBalance.count}
          color={data.walletsWithNegativeBalance.count > 0 ? themeColors.terracotta : themeColors.sage.alt}
        />
        <KPICard
          title="Referrals Missing User ID"
          value={data.referralsMissingUserId.count}
          color={themeColors.sage.alt}
        />
        <KPICard
          title="Rewards No Metadata"
          value={data.rewardsWithoutMetadata.count}
          color={themeColors.sage.alt}
        />
      </div>

      {/* Tables */}
      <div className="space-y-6">
        {data.classesMissingLocation.count > 0 && (
          <AuditTable
            title="Classes Missing Location"
            items={data.classesMissingLocation.items}
            columns={[
              { key: "id", label: "ID" },
              { key: "name", label: "Name" },
              { key: "town", label: "Town" },
              { key: "venue", label: "Venue" },
            ]}
            getEditUrl={(item) => `/admin/classes?edit=${item.id}`}
          />
        )}

        {data.classesMissingAgeRanges.count > 0 && (
          <AuditTable
            title="Classes Missing Age Ranges"
            items={data.classesMissingAgeRanges.items}
            columns={[
              { key: "id", label: "ID" },
              { key: "name", label: "Name" },
              { key: "age_group_min", label: "Min Age" },
              { key: "age_group_max", label: "Max Age" },
            ]}
            getEditUrl={(item) => `/admin/classes?edit=${item.id}`}
          />
        )}

        {data.providersWithNoPublishedClasses.count > 0 && (
          <AuditTable
            title="Providers with No Published Classes"
            items={data.providersWithNoPublishedClasses.items}
            columns={[
              { key: "id", label: "ID" },
              { key: "name", label: "Name" },
              { key: "email", label: "Email" },
            ]}
            getEditUrl={(item) => `/admin/providers?edit=${item.id}`}
          />
        )}

        {data.usersWithNoEmail.count > 0 && (
          <AuditTable
            title="Users with No Email (Critical)"
            items={data.usersWithNoEmail.items}
            columns={[
              { key: "id", label: "User ID" },
              { key: "created_at", label: "Created At" },
            ]}
            getEditUrl={(item) => `/admin/users?user=${item.id}`}
          />
        )}

        {data.walletsWithNegativeBalance.count > 0 && (
          <AuditTable
            title="Wallets with Negative Balance (Critical)"
            items={data.walletsWithNegativeBalance.items}
            columns={[
              { key: "id", label: "Wallet ID" },
              { key: "user_id", label: "User ID" },
              { key: "balance_cents", label: "Balance (cents)" },
            ]}
            getEditUrl={(item) => `/admin/wallet?wallet=${item.id}`}
          />
        )}

        {data.referralsMissingUserId.count > 0 && (
          <AuditTable
            title="Referrals Missing User ID"
            items={data.referralsMissingUserId.items}
            columns={[
              { key: "id", label: "ID" },
              { key: "referral_code", label: "Code" },
              { key: "referred_email", label: "Email" },
              { key: "table", label: "Table" },
              { key: "created_at", label: "Created At" },
            ]}
            getEditUrl={(item) => `/admin/referrals?referral=${item.id}`}
          />
        )}

        {data.rewardsWithoutMetadata.count > 0 && (
          <AuditTable
            title="Rewards Without Metadata"
            items={data.rewardsWithoutMetadata.items}
            columns={[
              { key: "id", label: "ID" },
              { key: "user_id", label: "User ID" },
              { key: "source", label: "Source" },
              { key: "points", label: "Points" },
              { key: "value_cents", label: "Value (cents)" },
            ]}
            getEditUrl={(item) => `/admin/rewards?reward=${item.id}`}
          />
        )}
      </div>
    </div>
  );
}

function KPICard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-sage/20 bg-white p-6 shadow-soft">
      <h3 className="text-small font-medium text-slateSoft">{title}</h3>
      <p className="mt-2 text-display-2 font-semibold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function AuditTable({
  title,
  items,
  columns,
  getEditUrl,
}: {
  title: string;
  items: Array<Record<string, unknown>>;
  columns: { key: string; label: string }[];
  getEditUrl: (item: Record<string, unknown>) => string;
}) {
  return (
    <div className="rounded-xl border border-sage/20 bg-white p-6 shadow-soft">
      <h2 className="mb-4 text-title font-semibold text-charcoal">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-sage/20">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-2 text-left text-small font-medium text-charcoal">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-2 text-left text-small font-medium text-charcoal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-sage/10 hover:bg-cream/50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2 text-small text-charcoal">
                    {String(item[col.key] ?? "—")}
                  </td>
                ))}
                <td className="px-4 py-2">
                  <Link
                    href={getEditUrl(item)}
                    className="text-small text-sage hover:text-sageDark hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

