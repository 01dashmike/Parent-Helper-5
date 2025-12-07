"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useMemo } from "react";
import AdminPartnerEditorDrawer from "./AdminPartnerEditorDrawer";

interface PartnerRecord {
    id: string;
    city_slug: string;
    name: string;
    type: string;
    url: string;
    image_url?: string | null;
    summary?: string | null;
    is_featured: boolean;
    affiliate_code?: string | null;
    created_at?: string;
}

interface Props {
    partners: PartnerRecord[];
}

export default function AdminPartnersClient({ partners }: Props) {
    const router = useRouter();
    const [filterCity, setFilterCity] = useState<string>("");
    const [filterType, setFilterType] = useState<string>("");
    const [selectedPartner, setSelectedPartner] = useState<PartnerRecord | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const cities = useMemo(() => {
        const citySet = new Set(partners.map((p) => p.city_slug).filter(Boolean));
        return Array.from(citySet).sort();
    }, [partners]);

    const types = useMemo(() => {
        const typeSet = new Set(partners.map((p) => p.type).filter(Boolean));
        return Array.from(typeSet).sort();
    }, [partners]);

    const filtered = useMemo(() => {
        return partners.filter((partner) => {
            if (filterCity && partner.city_slug !== filterCity) return false;
            if (filterType && partner.type !== filterType) return false;
            return true;
        });
    }, [partners, filterCity, filterType]);

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch("/api/admin/partners", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete", id }),
            });
            if (!response.ok) {
                console.error("Failed to delete partner", await response.text());
                return;
            }
            setDrawerOpen(false);
            router.refresh();
        } catch (err) {
            console.error("Error deleting partner:", err);
        }
    };

    const handleSave = async (partner: Partial<PartnerRecord>) => {
        if (!selectedPartner) return;
        try {
            const response = await fetch("/api/admin/partners", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "update", id: selectedPartner.id, partner }),
            });
            if (!response.ok) {
                console.error("Failed to save partner", await response.text());
                return;
            }
            setDrawerOpen(false);
            router.refresh();
        } catch (err) {
            console.error("Error saving partner:", err);
        }
    };

    const handleCreate = () => {
        setSelectedPartner({
            id: "",
            city_slug: "",
            name: "",
            type: "cafe",
            url: "",
            image_url: null,
            summary: null,
            is_featured: false,
            affiliate_code: null,
        });
        setDrawerOpen(true);
    };

    const handleCreateSave = async (partner: Partial<PartnerRecord>) => {
        try {
            const response = await fetch("/api/admin/partners", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "create", partner }),
            });
            if (!response.ok) {
                console.error("Failed to create partner", await response.text());
                return;
            }
            setDrawerOpen(false);
            router.refresh();
        } catch (err) {
            console.error("Error creating partner:", err);
        }
    };

    const toggleFeatured = async (partner: PartnerRecord) => {
        startTransition(async () => {
            try {
                const response = await fetch("/api/admin/partners", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "update",
                    id: partner.id,
                    partner: { is_featured: !partner.is_featured },
                }),
            });
            if (!response.ok) {
                console.error("Failed to toggle featured", await response.text());
                return;
            }
            router.refresh();
            } catch (err) {
                console.error("Error toggling featured:", err);
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
                <select
                    className="ph-input w-48"
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                >
                    <option value="">All cities</option>
                    {cities.map((city) => (
                        <option key={city} value={city}>
                            {city}
                        </option>
                    ))}
                </select>
                <select
                    className="ph-input w-48"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="">All types</option>
                    {types.map((type) => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
                <button className="ph-btn" onClick={handleCreate}>
                    + New Partner
                </button>
                {isPending && <span className="text-small text-slateSoft">Updating…</span>}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-sage/20 bg-white">
                <table className="min-w-full divide-y divide-sage/20 text-left text-small">
                    <thead className="bg-cream/70 text-slateSoft">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">City</th>
                            <th className="px-4 py-3">URL</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sage/10">
                        {filtered.map((partner) => (
                            <tr key={partner.id} className="hover:bg-cream/60">
                                <td className="px-4 py-3">
                                    <div className="font-semibold text-charcoal">{partner.name}</div>
                                    {partner.summary && (
                                        <div className="text-small text-slateSoft line-clamp-1">{partner.summary}</div>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <span className="rounded-full bg-sage/10 px-2 py-1 text-small text-sage capitalize">
                                        {partner.type}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{partner.city_slug || "—"}</td>
                                <td className="px-4 py-3">
                                    <a
                                        href={partner.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-small text-sage hover:underline"
                                        aria-label={`Visit ${partner.name} website (opens in new tab)`}
                                    >
                                        {partner.url.length > 40 ? `${partner.url.slice(0, 40)}...` : partner.url}
                                    </a>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        {partner.is_featured && (
                                            <span className="rounded-full bg-yellow-100 px-2 py-1 text-small text-yellow-800">Featured</span>
                                        )}
                                        {partner.affiliate_code && (
                                            <span className="rounded-full bg-blue-100 px-2 py-1 text-small text-blue-800">Affiliate</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            className="rounded-full border border-sage px-3 py-1 text-small text-sage transition hover:bg-sage/10"
                                            onClick={() => {
                                                setSelectedPartner(partner);
                                                setDrawerOpen(true);
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className={`rounded-full px-3 py-1 text-small font-medium transition ${partner.is_featured
                                                ? "bg-gray-500 text-white hover:bg-gray-600"
                                                : "bg-sage text-white hover:bg-sage/90"
                                                }`}
                                            onClick={() => toggleFeatured(partner)}
                                        >
                                            {partner.is_featured ? "Unfeature" : "Feature"}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filtered.length === 0 && (
                <div className="rounded-2xl border border-sage/20 bg-white p-8 text-center text-slateSoft">
                    No partners found. Create your first partner to get started.
                </div>
            )}

            <AdminPartnerEditorDrawer
                open={drawerOpen}
                partner={selectedPartner}
                onClose={() => setDrawerOpen(false)}
                onSave={selectedPartner?.id ? handleSave : handleCreateSave}
                onDelete={selectedPartner?.id ? () => handleDelete(selectedPartner.id) : undefined}
            />
        </div>
    );
}

