/**
 * Upload validation utilities
 * Validates MIME types, file sizes, and strips EXIF data
 */

import sharp from "sharp";
import { Readable } from "stream";

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
  image: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
} as const;

// Maximum file sizes (in bytes)
export const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
} as const;

export interface ValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: string;
  size?: number;
}

/**
 * Validate file MIME type
 */
export function validateMimeType(
  mimeType: string,
  allowedTypes: readonly string[] = ALLOWED_MIME_TYPES.image
): boolean {
  return allowedTypes.includes(mimeType.toLowerCase());
}

/**
 * Validate file size
 */
export function validateFileSize(
  size: number,
  maxSize: number = MAX_FILE_SIZES.image
): boolean {
  return size <= maxSize;
}

/**
 * Strip EXIF data from image
 */
export async function stripExif(buffer: Buffer): Promise<Buffer> {
  try {
    // Use sharp to process image and remove EXIF
    const processed = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF, then remove EXIF
      .toBuffer();
    return processed;
  } catch (error) {
    // If processing fails, return original buffer
    console.warn("[upload-validation] Failed to strip EXIF:", error);
    return buffer;
  }
}

/**
 * Validate and process uploaded file
 */
export async function validateAndProcessUpload(
  file: File | Buffer,
  options: {
    allowedMimeTypes?: readonly string[];
    maxSize?: number;
    stripExifData?: boolean;
  } = {}
): Promise<ValidationResult & { processedBuffer?: Buffer }> {
  const {
    allowedMimeTypes = ALLOWED_MIME_TYPES.image,
    maxSize = MAX_FILE_SIZES.image,
    stripExifData = true,
  } = options;

  // Get file buffer and metadata
  const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
  const mimeType = file instanceof File ? file.type : "application/octet-stream";
  const size = buffer.length;

  // Validate MIME type
  if (!validateMimeType(mimeType, allowedMimeTypes)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedMimeTypes.join(", ")}`,
      mimeType,
      size,
    };
  }

  // Validate file size
  if (!validateFileSize(size, maxSize)) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
      mimeType,
      size,
    };
  }

  // Strip EXIF if image
  let processedBuffer = buffer;
  if (stripExifData && mimeType.startsWith("image/")) {
    processedBuffer = await stripExif(buffer);
  }

  return {
    valid: true,
    mimeType,
    size,
    processedBuffer,
  };
}

/**
 * Scan file with VirusTotal (optional)
 * Requires VIRUSTOTAL_API_KEY environment variable
 */
export async function scanWithVirusTotal(buffer: Buffer): Promise<{
  safe: boolean;
  scanId?: string;
  error?: string;
}> {
  const apiKey = process.env["VIRUSTOTAL_API_KEY"];
  if (!apiKey) {
    // If VirusTotal not configured, assume safe
    return { safe: true };
  }

  try {
    // Upload file to VirusTotal
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(buffer)]);
    formData.append("file", blob);

    const uploadResponse = await fetch("https://www.virustotal.com/api/v3/files", {
      method: "POST",
      headers: {
        "x-apikey": apiKey,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      return { safe: true, error: "VirusTotal upload failed" };
    }

    const uploadData = await uploadResponse.json();
    const scanId = uploadData.data.id;

    // Wait a bit for scan to complete
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get scan results
    const resultsResponse = await fetch(
      `https://www.virustotal.com/api/v3/analyses/${scanId}`,
      {
        headers: {
          "x-apikey": apiKey,
        },
      }
    );

    if (!resultsResponse.ok) {
      return { safe: true, error: "VirusTotal results fetch failed" };
    }

    const resultsData = await resultsResponse.json();
    const stats = resultsData.data.attributes.stats;

    // Consider safe if no malicious detections
    const safe = stats.malicious === 0;

    return { safe, scanId };
  } catch (error) {
    console.error("[upload-validation] VirusTotal scan error:", error);
    // On error, assume safe (fail open)
    return { safe: true, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

