"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Close } from "@/components/icons";
import { Button, SecondaryButton } from "@/components/ui/buttons";

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
}

interface Props {
    open: boolean;
    partner: PartnerRecord | null;
    onClose: () => void;
    onSave: (partner: Partial<PartnerRecord>) => void;
    onDelete?: () => void;
}

const PARTNER_TYPES = ["cafe", "park", "museum", "restaurant", "playground", "library", "other"];

export default function AdminPartnerEditorDrawer({ open, partner, onClose, onSave, onDelete }: Props) {
    const [formData, setFormData] = useState<Partial<PartnerRecord>>({
        city_slug: "",
        name: "",
        type: "cafe",
        url: "",
        image_url: null,
        summary: null,
        is_featured: false,
        affiliate_code: null,
    });

    useEffect(() => {
        if (partner) {
            setFormData({
                city_slug: partner.city_slug || "",
                name: partner.name || "",
                type: partner.type || "cafe",
                url: partner.url || "",
                image_url: partner.image_url || null,
                summary: partner.summary || null,
                is_featured: partner.is_featured || false,
                affiliate_code: partner.affiliate_code || null,
            });
        } else {
            setFormData({
                city_slug: "",
                name: "",
                type: "cafe",
                url: "",
                image_url: null,
                summary: null,
                is_featured: false,
                affiliate_code: null,
            });
        }
    }, [partner]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <button
                type="button"
                aria-label="Close partner editor"
                className="absolute inset-0 h-full w-full cursor-default"
                onClick={onClose}
            />
            <div
                className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-heading flex items-center justify-between">
                    <h2 className="text-title font-semibold text-charcoal">
                        {partner?.id ? "Edit Partner" : "Create New Partner"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="min-h-11 min-w-11 flex items-center justify-center rounded-full p-2 text-slateSoft transition hover:bg-cream md:min-h-0 md:min-w-0"
                        aria-label="Close partner editor drawer"
                    >
                        <Close size={24} className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-small font-medium text-charcoal">Partner Name</label>
                        <input
                            type="text"
                            className="ph-input mt-1 w-full"
                            value={formData.name || ""}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., The Coffee House"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-small font-medium text-charcoal">Type</label>
                        <select
                            className="ph-input mt-1 w-full"
                            value={formData.type || "cafe"}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            required
                        >
                            {PARTNER_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-small font-medium text-charcoal">City Slug</label>
                        <input
                            type="text"
                            className="ph-input mt-1 w-full"
                            value={formData.city_slug || ""}
                            onChange={(e) => setFormData({ ...formData, city_slug: e.target.value })}
                            placeholder="e.g., london, manchester"
                            required
                        />
                        <p className="mt-1 text-small text-slateSoft">The city slug this partner is for</p>
                    </div>

                    <div>
                        <label className="block text-small font-medium text-charcoal">URL</label>
                        <input
                            type="url"
                            className="ph-input mt-1 w-full"
                            value={formData.url || ""}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            placeholder="https://example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-small font-medium text-charcoal">Summary (optional)</label>
                        <textarea
                            className="ph-input mt-1 w-full"
                            rows={3}
                            value={formData.summary || ""}
                            onChange={(e) => setFormData({ ...formData, summary: e.target.value || null })}
                            placeholder="Brief description of the partner..."
                        />
                    </div>

                    <div>
                        <label className="block text-small font-medium text-charcoal">Image URL (optional)</label>
                        <input
                            type="url"
                            className="ph-input mt-1 w-full"
                            value={formData.image_url || ""}
                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value || null })}
                            placeholder="https://example.com/image.jpg"
                        />
                        {formData.image_url && (
                            <div className="mt-2 aspect-[4/3] w-48">
                                <Image
                                    src={formData.image_url}
                                    alt="Preview"
                                    width={200}
                                    height={150}
                                    className="rounded-lg object-cover"
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-small font-medium text-charcoal">Affiliate Code (optional)</label>
                        <input
                            type="text"
                            className="ph-input mt-1 w-full"
                            value={formData.affiliate_code || ""}
                            onChange={(e) => setFormData({ ...formData, affiliate_code: e.target.value || null })}
                            placeholder="e.g., AFF123"
                        />
                        <p className="mt-1 text-small text-slateSoft">Optional affiliate tracking code</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.is_featured || false}
                                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                className="rounded border-sage text-sage focus:ring-sage"
                            />
                            <span className="text-small text-charcoal">Featured</span>
                        </label>
                    </div>

                    {/* Preview */}
                    {formData.name && (
                        <div className="mt-6 rounded-lg border border-sage/20 bg-cream/50 p-section">
                            <h3 className="mb-small text-small font-semibold text-charcoal">Preview</h3>
                            <div className="rounded-lg bg-white p-4 shadow-sm">
                                {formData.image_url && (
                                    <div className="mb-3 aspect-video w-full overflow-hidden rounded-lg relative">
                                        <Image
                                            src={formData.image_url}
                                            alt={formData.name || "Partner image"}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 400px"
                                        />
                                    </div>
                                )}
                                <h4 className="text-title text-charcoal">{formData.name}</h4>
                                {formData.summary && (
                                    <p className="mt-2 text-small text-slateSoft">{formData.summary}</p>
                                )}
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="rounded-full bg-sage/10 px-2 py-1 text-small text-forest capitalize">
                                        {formData.type}
                                    </span>
                                    {formData.is_featured && (
                                        <span className="rounded-full bg-yellow-100 px-2 py-1 text-small text-yellow-800">
                                            Featured
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        {onDelete && (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="rounded-full border border-red-300 px-4 py-2 text-small font-medium text-red-600 transition hover:bg-red-50"
                            >
                                Delete
                            </button>
                        )}
                        <SecondaryButton
                            type="button"
                            onClick={onClose}
                        >
                            Cancel
                        </SecondaryButton>
                        <Button type="submit">
                            Save
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

