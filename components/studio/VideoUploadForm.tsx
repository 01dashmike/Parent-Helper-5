"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProvider } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { FormField } from "@/components/ui/formfield";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/errormessage";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

const videoUploadFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  script: z.string().optional(),
  tags: z.string().optional(),
  addBranding: z.boolean().default(true),
  file: z.instanceof(File, { message: "Video file is required" })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024} MB limit`,
    }),
});

type VideoUploadFormData = z.infer<typeof videoUploadFormSchema>;

export default function VideoUploadForm() {
    const router = useRouter();
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [announcement, setAnnouncement] = useState('');

    const form = useForm<VideoUploadFormData>({
        resolver: zodResolver(videoUploadFormSchema),
        defaultValues: {
            title: "",
            script: "",
            tags: "",
            addBranding: true,
            file: undefined as unknown as File,
        },
        mode: "onChange",
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0];
        if (!selectedFile) return;

        form.setValue("file", selectedFile, { shouldValidate: true });
        form.clearErrors("file");

        // Create preview URL
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
    }, [form]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "video/mp4": [".mp4"],
            "video/quicktime": [".mov"],
            "video/x-msvideo": [".avi"],
        },
        maxFiles: 1,
    });

    const onSubmit = async (data: VideoUploadFormData) => {
        setIsUploading(true);
        form.clearErrors();
        setUploadProgress(0);
        setAnnouncement('Submitting…');

        try {
            const formData = new FormData();
            formData.append("title", data.title.trim());
            if (data.script?.trim()) formData.append("script", data.script.trim());
            if (data.tags?.trim()) formData.append("tags", data.tags.trim());
            formData.append("file", data.file);
            formData.append("add_branding", data.addBranding.toString());

            // Simulate progress (actual upload progress would require XMLHttpRequest)
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            const response = await fetch("/api/videos", {
                method: "POST",
                body: formData,
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Upload failed");
            }

            const { video: _ } = await response.json();
            setAnnouncement('Saved');
            router.push(`/studio/videos`);
            router.refresh();
        } catch (err: unknown) {
            console.error("[VideoUploadForm] Unexpected error:", err);
            const errorMessage = err instanceof Error ? err.message : "Upload failed. Please try again.";
            form.setError("root", { message: errorMessage });
            setAnnouncement('Error saving changes');
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const file = form.watch("file");

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <VisuallyHidden as="div" aria-live="assertive" aria-atomic="true">
                    {announcement}
                </VisuallyHidden>

                <FormField
                    label="Title"
                    required
                    error={form.formState.errors.title?.message}
                    id="title"
                >
                    <Input {...form.register("title")} placeholder="e.g., Quick Tip: Getting Your Baby to Sleep" />
                </FormField>

                <FormField
                    label="Script (Optional)"
                    error={form.formState.errors.script?.message}
                    id="script"
                >
                    <Textarea {...form.register("script")} rows={4} placeholder="Optional script or notes for your video..." />
                </FormField>

                <FormField
                    label="Tags (Optional)"
                    error={form.formState.errors.tags?.message}
                    id="tags"
                    helpText="Separate tags with commas"
                >
                    <Input {...form.register("tags")} placeholder="e.g., sleep, baby, tips (comma-separated)" />
                </FormField>

                <FormField
                    label="Video File"
                    required
                    error={form.formState.errors.file?.message}
                    id="video-file"
                >
                    <div
                        {...getRootProps()}
                        className={cn(
                            "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                            isDragActive
                                ? "border-blue-500 bg-blue-50"
                                : "border-sage/20 bg-cream hover:border-sage/30",
                            form.formState.errors.file && "border-red-500"
                        )}
                    >
                        <input {...getInputProps()} />
                        {file ? (
                            <div className="space-y-2">
                                <p className="font-medium text-charcoal">{file.name}</p>
                                <p className="text-small text-slateSoft">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                {previewUrl && (
                                    <video
                                        src={previewUrl}
                                        controls
                                        className="mx-auto mt-4 max-h-64 rounded"
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        form.setValue("file", undefined as unknown as File);
                                        setPreviewUrl(null);
                                    }}
                                    className="mt-2 text-small text-red-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/50 focus-visible:ring-offset-2"
                                >
                                    Remove file
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p className="text-charcoal">
                                    {isDragActive
                                        ? "Drop the video file here"
                                        : "Drag & drop a video file here, or click to select"}
                                </p>
                                <p className="text-small text-text-tertiary mt-1">
                                    MP4, MOV, or AVI up to 100 MB
                                </p>
                            </div>
                        )}
                    </div>
                </FormField>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="add-branding"
                        {...form.register("addBranding")}
                        className="h-4 w-4"
                    />
                    <label htmlFor="add-branding" className="text-small">
                        Add branded opener/outro (2s each)
                    </label>
                </div>

                {form.formState.errors.root && (
                    <ErrorMessage error={form.formState.errors.root.message} />
                )}

            {isUploading && (
                <div className="space-y-2">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-cream">
                        <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                    <p className="text-small text-charcoal">Uploading... {uploadProgress}%</p>
                </div>
            )}

                <div className="flex gap-4">
                    <Button
                        type="submit"
                        disabled={isUploading || !file || !form.watch("title")?.trim()}
                    >
                        {isUploading ? "Uploading..." : "Upload Video"}
                    </Button>
                    <Link
                        href="/studio/videos"
                        className="rounded border border-sage/20 px-6 py-2 hover:bg-cream/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </FormProvider>
    );
}

