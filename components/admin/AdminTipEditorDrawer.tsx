"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Close } from "@/components/icons";
import { Button, SecondaryButton } from "@/components/ui/buttons";

interface TipRecord {
    id: string;
    city_slug: string;
    author: string;
    role: string;
    content: string;
    image_url?: string | null;
    is_featured: boolean;
    is_published: boolean;
}

interface Props {
    open: boolean;
    tip: TipRecord | null;
    onClose: () => void;
    onSave: (tip: Partial<TipRecord>) => void;
    onDelete?: () => void;
}

export default function AdminTipEditorDrawer({ open, tip, onClose, onSave, onDelete }: Props) {
    const [formData, setFormData] = useState<Partial<TipRecord>>({
        city_slug: "",
        author: "",
        role: "Parent Helper Expert",
        content: "",
        image_url: null,
        is_featured: false,
        is_published: false,
    });

    useEffect(() => {
        if (tip) {
            setFormData({
                city_slug: tip.city_slug || "",
                author: tip.author || "",
                role: tip.role || "Parent Helper Expert",
                content: tip.content || "",
                image_url: tip.image_url || null,
                is_featured: tip.is_featured || false,
                is_published: tip.is_published || false,
            });
        } else {
            setFormData({
                city_slug: "",
                author: "",
                role: "Parent Helper Expert",
                content: "",
                image_url: null,
                is_featured: false,
                is_published: false,
            });
        }
    }, [tip]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <button
                type="button"
                aria-label="Close tip editor"
                className="absolute inset-0 h-full w-full cursor-default"
                onClick={onClose}
            />
            <div
                className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-heading flex items-center justify-between">
                    <h2 className="text-title font-semibold text-charcoal">
                        {tip?.id ? "Edit Tip" : "Create New Tip"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slateSoft transition hover:bg-cream"
                        aria-label="Close tip editor drawer"
                    >
                        <Close size={24} className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                        <p className="mt-1 text-small text-slateSoft">The city slug this tip is for (leave empty for national tips)</p>
                    </div>

                    <div>
                        <label className="block text-small font-medium text-charcoal">Author Name</label>
                        <input
                            type="text"
                            className="ph-input mt-1 w-full"
                            value={formData.author || ""}
                            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                            placeholder="Expert Name"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-small font-medium text-charcoal">Role</label>
                        <input
                            type="text"
                            className="ph-input mt-1 w-full"
                            value={formData.role || ""}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            placeholder="Parent Helper Expert"
                        />
                    </div>

                    <div>
                        <label className="block text-small font-medium text-charcoal">Content</label>
                        <textarea
                            className="ph-input mt-1 w-full"
                            rows={6}
                            value={formData.content || ""}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Enter the tip content..."
                            required
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
                            <div className="mt-2 aspect-square w-24">
                                <Image
                                    src={formData.image_url}
                                    alt="Preview"
                                    width={100}
                                    height={100}
                                    className="rounded-lg object-cover"
                                />
                            </div>
                        )}
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

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.is_published || false}
                                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                                className="rounded border-sage text-sage focus:ring-sage"
                            />
                            <span className="text-small text-charcoal">Published</span>
                        </label>
                    </div>

                    {/* Preview */}
                    {formData.content && (
                        <div className="mt-6 rounded-lg border border-sage/20 bg-cream/50 p-section">
                            <h3 className="mb-small text-small font-semibold text-charcoal">Preview</h3>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="h-16 w-16 overflow-hidden rounded-full bg-sage/20 aspect-square">
                                        {formData.image_url ? (
                                            <Image
                                                src={formData.image_url}
                                                alt={formData.author || "Author"}
                                                width={64}
                                                height={64}
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-title text-sage">
                                                {(formData.author || "A").charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="rounded-lg bg-white p-4 shadow-sm">
                                        <p className="text-small text-charcoal">{formData.content}</p>
                                        <div className="mt-3 flex items-center gap-2 border-t border-sage/10 pt-3">
                                            <cite className="not-italic font-semibold text-charcoal">{formData.author}</cite>
                                            <span className="text-small text-slateSoft">—</span>
                                            <span className="text-small text-slateSoft">{formData.role}</span>
                                        </div>
                                    </div>
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

