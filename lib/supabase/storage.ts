/**
 * Supabase Storage utilities for file uploads
 */

import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Validate file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<UploadResult> {
  try {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Upload provider logo
 */
export async function uploadProviderLogo(
  providerId: number,
  file: File
): Promise<UploadResult> {
  const timestamp = Date.now();
  const extension = file.name.split(".").pop();
  const path = `providers/${providerId}/logo/${timestamp}.${extension}`;
  return uploadFile("provider-assets", path, file);
}

/**
 * Upload class gallery image
 */
export async function uploadClassImage(
  providerId: number,
  file: File,
  index: number
): Promise<UploadResult> {
  const timestamp = Date.now();
  const extension = file.name.split(".").pop();
  const uuid = `${timestamp}-${index}`;
  const path = `providers/${providerId}/gallery/${uuid}.${extension}`;
  return uploadFile("provider-assets", path, file);
}

/**
 * Upload blog image (hero or content)
 */
export async function uploadBlogImage(
  postId: string,
  file: File,
  imageType: "hero" | "content"
): Promise<UploadResult> {
  const timestamp = Date.now();
  const extension = file.name.split(".").pop() || "jpg";
  // Sanitize filename - remove special characters, keep only alphanumeric, dash, underscore
  const sanitizedName = file.name
    .replace(/\.[^/.]+$/, "") // Remove extension
    .replace(/[^a-zA-Z0-9-_]/g, "-") // Replace special chars with dash
    .substring(0, 50); // Limit length
  const path = `blog/${postId}/${imageType}/${timestamp}-${sanitizedName}.${extension}`;
  return uploadFile("blog", path, file);
}

/**
 * Upload about page image (story section)
 */
export async function uploadAboutPageImage(
  file: File,
  imageType: "story" | "general" = "story"
): Promise<UploadResult> {
  const timestamp = Date.now();
  const extension = file.name.split(".").pop() || "jpg";
  // Sanitize filename - remove special characters, keep only alphanumeric, dash, underscore
  const sanitizedName = file.name
    .replace(/\.[^/.]+$/, "") // Remove extension
    .replace(/[^a-zA-Z0-9-_]/g, "-") // Replace special chars with dash
    .substring(0, 50); // Limit length
  const path = `about-page/${imageType}/${timestamp}-${sanitizedName}.${extension}`;
  return uploadFile("about-page", path, file);
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.storage.from(bucket).remove([path]);
    return !error;
  } catch {
    return false;
  }
}








