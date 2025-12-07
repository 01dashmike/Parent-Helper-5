"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useMemo } from "react";
import AdminTipEditorDrawer from "./AdminTipEditorDrawer";

interface TipRecord {
    id: string;
    city_slug: string;
    author: string;
    role: string;
    content: string;
    image_url?: string | null;
    is_featured: boolean;
    is_published: boolean;
    created_at?: string;
}

interface Props {
    tips: TipRecord[];
}

export default function AdminTipsClient({ tips }: Props) {
    const router = useRouter();
    const [filterCity, setFilterCity] = useState<string>("");
    const [filterPublished, setFilterPublished] = useState<string>("");
    const [selectedTip, setSelectedTip] = useState<TipRecord | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const cities = useMemo(() => {
        const citySet = new Set(tips.map((tip: { city_slug?: string | null }) => tip.city_slug).filter((city: string | null | undefined): city is string => typeof city === "string" && city.length > 0));
        return Array.from(citySet).sort();
    }, [tips]);

    const filtered = useMemo(() => {
        return tips.filter((tip: { city_slug?: string | null; is_published?: boolean }) => {
            if (filterCity && tip.city_slug !== filterCity) return false;
            if (filterPublished === "published" && !tip.is_published) return false;
            if (filterPublished === "draft" && tip.is_published) return false;
            return true;
        });
    }, [tips, filterCity, filterPublished]);

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch("/api/admin/tips", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete", id }),
            });
            if (!response.ok) {
                console.error("Failed to delete tip", await response.text());
                return;
            }
            setDrawerOpen(false);
            router.refresh();
        } catch (err) {
            console.error("Error deleting tip:", err);
        }
    };

    const handleSave = async (tip: Partial<TipRecord>) => {
        if (!selectedTip) return;
        try {
            const response = await fetch("/api/admin/tips", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "update", id: selectedTip.id, tip }),
            });
            if (!response.ok) {
                console.error("Failed to save tip", await response.text());
                return;
            }
            setDrawerOpen(false);
            router.refresh();
        } catch (err) {
            console.error("Error saving tip:", err);
        }
    };

    const handleCreate = () => {
        setSelectedTip({
            id: "",
            city_slug: "",
            author: "",
            role: "Parent Helper Expert",
            content: "",
            image_url: null,
            is_featured: false,
            is_published: false,
        });
        setDrawerOpen(true);
    };

    const handleCreateSave = async (tip: Partial<TipRecord>) => {
        try {
            const response = await fetch("/api/admin/tips", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "create", tip }),
            });
            if (!response.ok) {
                console.error("Failed to create tip", await response.text());
                return;
            }
            setDrawerOpen(false);
            router.refresh();
        } catch (err) {
            console.error("Error creating tip:", err);
        }
    };

    const togglePublish = async (tip: TipRecord) => {
        startTransition(async () => {
            try {
                const response = await fetch("/api/admin/tips", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "update",
                        id: tip.id,
                        tip: { is_published: !tip.is_published },
                    }),
                });
                if (!response.ok) {
                    console.error("Failed to toggle publish", await response.text());
                    return;
                }
                router.refresh();
            } catch (err) {
                console.error("Error toggling publish:", err);
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
                    {cities.map((city: string) => (
                        <option key={city} value={city}>
                            {city}
                        </option>
                    ))}
                </select>
                <select
                    className="ph-input w-48"
                    value={filterPublished}
                    onChange={(e) => setFilterPublished(e.target.value)}
                >
                    <option value="">All statuses</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                </select>
                <button className="ph-btn" onClick={handleCreate}>
                    + New Tip
                </button>
                {isPending && <span className="text-small text-slateSoft">Updating…</span>}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-sage/20 bg-white">
                <table className="min-w-full divide-y divide-sage/20 text-left text-small">
                    <thead className="bg-cream/70 text-slateSoft">
                        <tr>
                            <th className="px-4 py-3">Author</th>
                            <th className="px-4 py-3">City</th>
                            <th className="px-4 py-3">Content Preview</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sage/10">
                        {filtered.map((tip: TipRecord) => (
                            <tr key={tip.id} className="hover:bg-cream/60">
                                <td className="px-4 py-3">
                                    <div className="font-semibold text-charcoal">{tip.author}</div>
                                    <div className="text-small text-slateSoft">{tip.role}</div>
                                </td>
                                <td className="px-4 py-3">{tip.city_slug || "—"}</td>
                                <td className="px-4 py-3">
                                    <p className="text-small text-slateSoft line-clamp-2">{tip.content}</p>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        {tip.is_published ? (
                                            <span className="rounded-full bg-green-100 px-2 py-1 text-small text-green-800">Published</span>
                                        ) : (
                                            <span className="rounded-full bg-gray-100 px-2 py-1 text-small text-gray-800">Draft</span>
                                        )}
                                        {tip.is_featured && (
                                            <span className="rounded-full bg-yellow-100 px-2 py-1 text-small text-yellow-800">Featured</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            className="rounded-full border border-sage px-3 py-1 text-small text-sage transition hover:bg-sage/10"
                                            onClick={() => {
                                                setSelectedTip(tip);
                                                setDrawerOpen(true);
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className={`rounded-full px-3 py-1 text-small font-medium transition ${tip.is_published
                                                ? "bg-gray-500 text-white hover:bg-gray-600"
                                                : "bg-sage text-white hover:bg-sage/90"
                                                }`}
                                            onClick={() => togglePublish(tip)}
                                        >
                                            {tip.is_published ? "Unpublish" : "Publish"}
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
                    No tips found. Create your first tip to get started.
                </div>
            )}

            <AdminTipEditorDrawer
                open={drawerOpen}
                tip={selectedTip}
                onClose={() => setDrawerOpen(false)}
                onSave={selectedTip?.id ? handleSave : handleCreateSave}
                onDelete={selectedTip?.id ? () => handleDelete(selectedTip.id) : undefined}
            />
        </div>
    );
}

