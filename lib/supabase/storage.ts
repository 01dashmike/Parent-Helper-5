/**
 * Supabase Storage utilities for file uploads
 */

import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB default
const MAX_ABOUT_PAGE_FILE_SIZE = 15 * 1024 * 1024; // 15MB for about page images
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Validate file before upload
 */
export function validateImageFile(file: File, maxSize: number = MAX_FILE_SIZE): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
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
  file: File,
  maxSize: number = MAX_FILE_SIZE
): Promise<UploadResult> {
  try {
    const validation = validateImageFile(file, maxSize);
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
 * Uses larger file size limit (15MB) for hero/large images
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
  // Use larger file size limit for about page images
  return uploadFile("about-page", path, file, MAX_ABOUT_PAGE_FILE_SIZE);
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








