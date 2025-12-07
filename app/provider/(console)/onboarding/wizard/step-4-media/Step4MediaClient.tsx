"use client";

import { useFormState } from "react-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { saveStep4Media } from "../actions";
import type { OnboardingFormState } from "../../_lib/types";
import { WizardShell } from "../../components/WizardShell";
import { FormField } from "@/components/ui/formfield";
import { Button } from "@/components/ui/button";
import { useFormStatus } from "react-dom";
import { Image as ImageIcon, Upload, X, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Step4MediaClientProps {
  providerId: number;
  initialData: {
    logoUrl: string;
    imageUrls: string[];
  };
}

interface UploadingFile {
  file: File;
  preview: string;
  status: "uploading" | "success" | "error";
  url?: string;
  error?: string;
}

export function Step4MediaClient({ providerId, initialData }: Step4MediaClientProps) {
  const initialState: OnboardingFormState = {
    success: false,
    error: null,
    nextStep: null,
  };
  const [state, formAction] = useFormState(saveStep4Media, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [logoFile, setLogoFile] = useState<UploadingFile | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<UploadingFile[]>([]);
  const [existingLogoUrl, setExistingLogoUrl] = useState(initialData.logoUrl || "");
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(initialData.imageUrls || []);

  // Logo dropzone
  const onLogoDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setLogoFile({
      file,
      preview,
      status: "uploading",
    });

    // Upload logo
    uploadLogo(file);
  }, []);

  const { getRootProps: getLogoRootProps, getInputProps: getLogoInputProps, isDragActive: isLogoDragActive } = useDropzone({
    onDrop: onLogoDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  // Gallery dropzone
  const onGalleryDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: "uploading" as const,
    }));

    setGalleryFiles((prev) => [...prev, ...newFiles]);

    // Upload each file with correct index
    newFiles.forEach((uploadingFile, relativeIndex) => {
      const absoluteIndex = galleryFiles.length + relativeIndex;
      uploadGalleryImage(uploadingFile.file, absoluteIndex);
    });
  }, [galleryFiles.length]);

  const { getRootProps: getGalleryRootProps, getInputProps: getGalleryInputProps, isDragActive: isGalleryDragActive } = useDropzone({
    onDrop: onGalleryDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const uploadLogo = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("logo", file);
      formData.append("providerId", providerId.toString());
      formData.append("type", "logo");

      const response = await fetch("/api/provider/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.url) {
        setLogoFile((prev) => prev ? { ...prev, status: "success", url: result.url } : null);
        setExistingLogoUrl(result.url);
      } else {
        setLogoFile((prev) => prev ? { ...prev, status: "error", error: result.error || "Upload failed" } : null);
      }
    } catch (error) {
      setLogoFile((prev) => prev ? { ...prev, status: "error", error: "Upload failed" } : null);
    }
  };

  const uploadGalleryImage = async (file: File, fileIndex: number) => {
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("providerId", providerId.toString());
      formData.append("type", "gallery");
      formData.append("index", fileIndex.toString());

      const response = await fetch("/api/provider/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.url) {
        setGalleryFiles((prev) => {
          const updated = [...prev];
          const actualIndex = prev.findIndex((f, i) => i === fileIndex);
          if (actualIndex >= 0) {
            updated[actualIndex] = { ...updated[actualIndex], status: "success", url: result.url };
          }
          return updated;
        });
        setExistingImageUrls((prev) => {
          if (!prev.includes(result.url)) {
            return [...prev, result.url];
          }
          return prev;
        });
      } else {
        setGalleryFiles((prev) => {
          const updated = [...prev];
          const actualIndex = prev.findIndex((f, i) => i === fileIndex);
          if (actualIndex >= 0) {
            updated[actualIndex] = { ...updated[actualIndex], status: "error", error: result.error || "Upload failed" };
          }
          return updated;
        });
      }
    } catch (error) {
      setGalleryFiles((prev) => {
        const updated = [...prev];
        const actualIndex = prev.findIndex((f, i) => i === fileIndex);
        if (actualIndex >= 0) {
          updated[actualIndex] = { ...updated[actualIndex], status: "error", error: "Upload failed" };
        }
        return updated;
      });
    }
  };

  const removeLogo = () => {
    if (logoFile?.preview) {
      URL.revokeObjectURL(logoFile.preview);
    }
    setLogoFile(null);
    setExistingLogoUrl("");
  };

  const removeGalleryImage = (index: number) => {
    const file = galleryFiles[index];
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Wait for any pending uploads
    const pendingUploads = galleryFiles.filter(f => f.status === "uploading");
    if (pendingUploads.length > 0) {
      // Show message that uploads are in progress
      return;
    }

    // Collect all image URLs (existing + successfully uploaded)
    const uploadedUrls = galleryFiles
      .filter(f => f.status === "success" && f.url)
      .map(f => f.url!);
    const allImageUrls = [...new Set([...existingImageUrls, ...uploadedUrls])];

    const formData = new FormData();
    formData.set("logoUrl", existingLogoUrl || logoFile?.url || "");
    formData.set("imageUrls", JSON.stringify(allImageUrls));
    // Update hidden form fields and submit
    if (formRef.current) {
      const logoInput = formRef.current.querySelector<HTMLInputElement>('[name="logoUrl"]');
      const imagesInput = formRef.current.querySelector<HTMLInputElement>('[name="imageUrls"]');
      if (logoInput) logoInput.value = existingLogoUrl || logoFile?.url || "";
      if (imagesInput) imagesInput.value = JSON.stringify(allImageUrls);
      formRef.current.requestSubmit();
    }
  };

  // Count successful uploads and existing URLs (avoid duplicates)
  const uploadedUrls = galleryFiles
    .filter(f => f.status === "success" && f.url)
    .map(f => f.url!);
  const allImageUrls = [...new Set([...existingImageUrls, ...uploadedUrls])];
  const totalImages = allImageUrls.length;
  const hasMinimumImages = totalImages >= 3;

  return (
    <WizardShell
      title="Step 4 — Add Photos"
      description="Photos help parents discover your classes. Upload at least 3 class photos."
      currentStep={4}
      backHref="/provider/onboarding/wizard/step-3-class"
    >
      <form ref={formRef} action={formAction} className="space-y-8">
        {/* Logo Upload */}
        <div>
          <FormField
            label="Provider Logo"
            helpText="Upload your business logo (optional, but recommended)"
          >
            <div
              {...getLogoRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isLogoDragActive
                  ? "border-sage bg-sage/10"
                  : "border-sage/30 hover:border-sage/50"
              }`}
            >
              <input {...getLogoInputProps()} />
              {logoFile || existingLogoUrl ? (
                <div className="relative inline-block">
                  <img
                    src={logoFile?.preview || existingLogoUrl}
                    alt="Logo preview"
                    className="h-24 w-auto object-contain rounded"
                  />
                  {logoFile?.status === "uploading" && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded">
                      <Loader2 className="h-6 w-6 animate-spin text-sage" />
                    </div>
                  )}
                  {logoFile?.status === "success" && (
                    <div className="absolute -top-2 -right-2 bg-sage text-white rounded-full p-1">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 bg-red-500 text-white hover:bg-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLogo();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 text-sage/40 mx-auto mb-2" />
                  <p className="text-sm text-charcoal/70">
                    {isLogoDragActive ? "Drop logo here" : "Drag & drop logo or click to browse"}
                  </p>
                  <p className="text-xs text-charcoal/50 mt-1">JPG, PNG, or WEBP (max 5MB)</p>
                </div>
              )}
            </div>
          </FormField>
        </div>

        {/* Gallery Upload */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <FormField
              label="Class Photos"
              required
              helpText={`Upload at least 3 photos. ${totalImages}/3 minimum`}
              error={!hasMinimumImages && totalImages > 0 ? "At least 3 photos required" : undefined}
            >
              <div />
            </FormField>
          </div>

          <div
            {...getGalleryRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors mb-4 ${
              isGalleryDragActive
                ? "border-sage bg-sage/10"
                : "border-sage/30 hover:border-sage/50"
            }`}
          >
            <input {...getGalleryInputProps()} />
            <Upload className="h-12 w-12 text-sage/40 mx-auto mb-2" />
            <p className="text-sm text-charcoal/70">
              {isGalleryDragActive ? "Drop photos here" : "Drag & drop photos or click to browse"}
            </p>
            <p className="text-xs text-charcoal/50 mt-1">JPG, PNG, or WEBP (max 5MB each)</p>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <AnimatePresence>
              {existingImageUrls.map((url, index) => (
                <motion.div
                  key={`existing-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative aspect-square rounded-lg overflow-hidden border border-sage/20 group"
                >
                  <img
                    src={url}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-red-500 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}

              {galleryFiles.map((uploadingFile, index) => (
                <motion.div
                  key={`uploading-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative aspect-square rounded-lg overflow-hidden border border-sage/20"
                >
                  <img
                    src={uploadingFile.preview}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {uploadingFile.status === "uploading" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                  {uploadingFile.status === "success" && (
                    <div className="absolute top-2 right-2 bg-sage text-white rounded-full p-1">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  )}
                  {uploadingFile.status === "error" && (
                    <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center p-2">
                      <p className="text-xs text-white text-center">{uploadingFile.error}</p>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-red-500 text-white hover:bg-red-600"
                    onClick={() => removeGalleryImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {totalImages === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-sage/30 rounded-lg">
              <ImageIcon className="h-12 w-12 text-sage/40 mx-auto mb-2" />
              <p className="text-sm text-charcoal/60">No photos added yet</p>
            </div>
          )}
        </div>

        {!hasMinimumImages && (
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
            {totalImages === 0
              ? "Please upload at least 3 class photos to continue."
              : `Please upload ${3 - totalImages} more photo${3 - totalImages !== 1 ? "s" : ""} to continue.`}
          </div>
        )}

        {galleryFiles.some(f => f.status === "uploading") && (
          <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
            Uploading images... Please wait before continuing.
          </div>
        )}

        {state?.error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            {state.error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-sage/20">
          <SubmitButton hasMinimumImages={hasMinimumImages} />
        </div>
      </form>
    </WizardShell>
  );
}

function SubmitButton({ hasMinimumImages }: { hasMinimumImages: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button 
      type="submit" 
      disabled={pending || !hasMinimumImages} 
      className="min-w-[180px]"
      title={!hasMinimumImages ? "Please upload at least 3 photos" : undefined}
    >
      {pending ? "Saving..." : "Continue to Preview →"}
    </Button>
  );
}
