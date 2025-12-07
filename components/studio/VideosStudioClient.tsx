"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/ui/emptystate";

interface VideoRecord {
    id: string;
    title: string;
    script?: string | null;
    video_url?: string | null;
    thumbnail_url?: string | null;
    status: string;
    tags?: string[];
    duration_seconds?: number;
    created_at?: string;
    published_at?: string | null;
}

interface Props {
    videos: VideoRecord[];
}

export default function VideosStudioClient({ videos }: Props) {
    const [filterStatus, setFilterStatus] = useState<string>("");
    const [formattedDates, setFormattedDates] = useState<Record<string, string>>({});

    // Format dates on client side to avoid hydration mismatches
    useEffect(() => {
        const formatted: Record<string, string> = {};
        videos.forEach((video) => {
            if (video.created_at) {
                formatted[video.id] = new Date(video.created_at).toLocaleDateString();
            }
        });
        setFormattedDates(formatted);
    }, [videos]);

    const filtered = videos.filter((video) => {
        if (filterStatus && video.status !== filterStatus) return false;
        return true;
    });

    const statusColors: Record<string, string> = {
        draft: "bg-cream text-charcoal",
        ready: "bg-blue-100 text-blue-800",
        published: "bg-green-100 text-green-800",
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="input input-md border-sage/20"
                    >
                        <option value="">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="ready">Ready</option>
                        <option value="published">Published</option>
                    </select>
                </div>
                <Link
                    href="/studio/videos/new"
                    className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                    Upload New Video
                </Link>
            </div>

            {filtered.length === 0 ? (
                <EmptyState
                    title="No videos found"
                    description={filterStatus ? `No videos found with status "${filterStatus}".` : "Upload your first video to get started."}
                    iconVariant="inbox"
                    actionLabel="Upload your first video"
                    actionHref="/studio/videos/new"
                />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((video) => (
                        <div
                            key={video.id}
                            className="group rounded-lg border border-sage/20 bg-white p-section shadow-card transition-shadow hover:shadow-md"
                        >
                            {video.thumbnail_url ? (
                                <div className="mb-3 aspect-[9/16] overflow-hidden rounded bg-cream relative">
                                    <Image
                                        src={video.thumbnail_url}
                                        alt={video.title || "Video thumbnail"}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    />
                                </div>
                            ) : (
                                <div className="mb-3 aspect-[9/16] flex items-center justify-center rounded bg-cream text-slateSoft">
                                    No thumbnail
                                </div>
                            )}
                            <h3 className="mb-small font-semibold line-clamp-2">{video.title}</h3>
                            <div className="mb-3 flex items-center gap-2">
                                <span
                                    className={`rounded-full px-2 py-1 text-small font-medium ${statusColors[video.status] || "bg-cream text-charcoal"}`}
                                >
                                    {video.status}
                                </span>
                                {video.duration_seconds && (
                                    <span className="text-small text-slateSoft">
                                        {video.duration_seconds}s
                                    </span>
                                )}
                            </div>
                            {video.tags && video.tags.length > 0 && (
                                <div className="mb-3 flex flex-wrap gap-1">
                                    {video.tags.slice(0, 3).map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded bg-cream px-2 py-1 text-small text-charcoal"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <div className="mt-4 flex items-center gap-2 text-small text-slateSoft">
                                {video.created_at && (
                                    <span>
                                        {formattedDates[video.id] || "Loading..."}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

