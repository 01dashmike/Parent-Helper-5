"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { sendTransactional } from "@/lib/emails/sendTransactional";
import { postToReel } from "@/lib/social/postToReel";
import { formatDateDefault } from "@/lib/utils/date";

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
    uploader_id?: string;
}

interface Props {
    videos: VideoRecord[];
}

export default function AdminVideosClient({ videos }: Props) {
    const { toast } = useToast();
    const router = useRouter();
    const [formattedDates, setFormattedDates] = useState<Record<string, string>>({});

    // Format dates on client side to avoid hydration mismatches
    useEffect(() => {
        const formatted: Record<string, string> = {};
        videos.forEach((video) => {
            if (video.created_at) {
                formatted[video.id] = formatDateDefault(video.created_at);
            }
        });
        setFormattedDates(formatted);
    }, [videos]);
    const [filterStatus, setFilterStatus] = useState<string>("");
    const [_, startTransition] = useTransition();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [sendingToReels, setSendingToReels] = useState<string | null>(null);

    const filtered = videos.filter((video) => {
        if (filterStatus && video.status !== filterStatus) return false;
        return true;
    });

    const statusColors: Record<string, string> = {
        draft: "bg-gray-100 text-gray-800",
        ready: "bg-blue-100 text-blue-800",
        published: "bg-green-100 text-green-800",
    };

    const handlePublish = async (video: VideoRecord) => {
        if (video.status !== "ready" && video.status !== "draft") {
            toast({
              title: "Invalid Status",
              description: "Only videos with 'ready' or 'draft' status can be published",
              variant: "destructive",
            });
            return;
        }

        setProcessingId(video.id);
        try {
            const response = await fetch(`/api/videos/${video.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "published" }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to publish");
            }

            // Send email notification to uploader (if we have their email)
            // Note: In production, you'd fetch the uploader's email from auth.users
            try {
                await sendTransactional({
                    to: "uploader@example.com", // Replace with actual uploader email
                    subject: "Your tip video is live!",
                    html: `
            <h2>Great news!</h2>
            <p>Your tip video "<strong>${video.title}</strong>" has been published and is now live on Parent Helper.</p>
            <p>Thank you for contributing to our community!</p>
          `,
                    text: `Your tip video "${video.title}" has been published and is now live on Parent Helper.`,
                    type: "video_published",
                });
            } catch (emailError) {
                console.warn("Failed to send notification email:", emailError);
                // Don't fail the publish if email fails
            }

            startTransition(() => {
                router.refresh();
            });
            toast({
              title: "Published",
              description: "Video published successfully",
              variant: "success",
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to publish video";
            toast({
              title: "Publish Failed",
              description: errorMessage,
              variant: "destructive",
            });
        } finally {
            setProcessingId(null);
        }
    };

    const handleSendToReels = async (video: VideoRecord) => {
        if (!video.video_url) {
            toast({
              title: "Missing URL",
              description: "Video URL is required",
              variant: "destructive",
            });
            return;
        }

        setSendingToReels(video.id);
        try {
            const result = await postToReel({
                videoUrl: video.video_url,
                caption: video.title + (video.script ? `\n\n${video.script}` : ""),
                thumbnailUrl: video.thumbnail_url || undefined,
            });

            if (result.success) {
                toast({
                  title: "Sent to Reels",
                  description: "Video sent to Reels (stub - check console for details)",
                  variant: "success",
                });
            } else {
                toast({
                  title: "Failed",
                  description: `Failed to send to Reels: ${result.error}`,
                  variant: "destructive",
                });
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            toast({
              title: "Error",
              description: errorMessage,
              variant: "destructive",
            });
        } finally {
            setSendingToReels(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="rounded border border-gray-300 px-3 py-2 text-small"
                >
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="published">Published</option>
                </select>
            </div>

            {filtered.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
                    <p className="text-gray-500">No videos found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map((video) => (
                        <div
                            key={video.id}
                            className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                        >
                            {video.thumbnail_url ? (
                                <div className="h-32 w-20 flex-shrink-0 overflow-hidden rounded bg-gray-100 aspect-[5/8]">
                                    <Image
                                        src={video.thumbnail_url}
                                        alt={video.title || "Video thumbnail"}
                                        className="h-full w-full object-cover"
                                        width={80}
                                        height={128}
                                    />
                                </div>
                            ) : (
                                <div className="h-32 w-20 flex-shrink-0 flex items-center justify-center rounded bg-gray-100 text-gray-400 text-small">
                                    No thumbnail
                                </div>
                            )}
                            <div className="flex-1">
                                <h3 className="mb-1 font-semibold">{video.title}</h3>
                                {video.script && (
                                    <p className="mb-2 text-small text-gray-600 line-clamp-2">{video.script}</p>
                                )}
                                <div className="mb-2 flex items-center gap-2">
                                    <span
                                        className={`rounded-full px-2 py-1 text-small font-medium ${statusColors[video.status] || "bg-gray-100 text-gray-800"}`}
                                    >
                                        {video.status}
                                    </span>
                                    {video.duration_seconds && (
                                        <span className="text-small text-gray-500">
                                            {video.duration_seconds}s
                                        </span>
                                    )}
                                    {video.created_at && (
                                        <span className="text-small text-gray-500">
                                            {formattedDates[video.id] || "Loading..."}
                                        </span>
                                    )}
                                </div>
                                {video.tags && video.tags.length > 0 && (
                                    <div className="mb-2 flex flex-wrap gap-1">
                                        {video.tags.map((tag, idx) => (
                                            <span
                                                key={idx}
                                                className="rounded bg-gray-100 px-2 py-1 text-small text-gray-600"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {video.video_url && (
                                    <a
                                        href={video.video_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-small text-blue-600 hover:underline"
                                        aria-label={`View ${video.title || "video"} (opens in new tab)`}
                                    >
                                        View video →
                                    </a>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                {video.status !== "published" && (
                                    <button
                                        onClick={() => handlePublish(video)}
                                        disabled={processingId === video.id || (video.status !== "ready" && video.status !== "draft")}
                                        className="rounded bg-green-600 px-4 py-2 text-small text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {processingId === video.id ? "Publishing..." : "Publish"}
                                    </button>
                                )}
                                {video.status === "published" && (
                                    <>
                                        <span className="text-small text-green-600">Published</span>
                                        {video.video_url && (
                                            <button
                                                onClick={() => handleSendToReels(video)}
                                                disabled={sendingToReels === video.id}
                                                className="rounded bg-purple-600 px-4 py-2 text-small text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {sendingToReels === video.id ? "Sending..." : "Send to Reels"}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

