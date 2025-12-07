/**
 * Upload validation tests
 */

import {
  validateMimeType,
  validateFileSize,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZES,
} from "@/lib/security/upload-validation";

describe("Upload Validation", () => {
  describe("MIME Type Validation", () => {
    it("should allow valid image MIME types", () => {
      expect(validateMimeType("image/jpeg")).toBe(true);
      expect(validateMimeType("image/png")).toBe(true);
      expect(validateMimeType("image/webp")).toBe(true);
    });

    it("should reject invalid MIME types", () => {
      expect(validateMimeType("application/javascript")).toBe(false);
      expect(validateMimeType("text/html")).toBe(false);
    });

    it("should be case-insensitive", () => {
      expect(validateMimeType("IMAGE/JPEG")).toBe(true);
      expect(validateMimeType("Image/Png")).toBe(true);
    });
  });

  describe("File Size Validation", () => {
    it("should allow files within size limit", () => {
      expect(validateFileSize(1024 * 1024, MAX_FILE_SIZES.image)).toBe(true); // 1MB
      expect(validateFileSize(MAX_FILE_SIZES.image, MAX_FILE_SIZES.image)).toBe(true);
    });

    it("should reject files exceeding size limit", () => {
      expect(validateFileSize(MAX_FILE_SIZES.image + 1, MAX_FILE_SIZES.image)).toBe(false);
      expect(validateFileSize(10 * 1024 * 1024, MAX_FILE_SIZES.image)).toBe(false); // 10MB
    });
  });
});

