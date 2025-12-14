"use client";

import { useState, useMemo, useRef } from "react";
import type React from "react";
import Image from "next/image";
import { RefreshCw, X, Plus, Search, Upload } from "lucide-react";
import { LoadingSpinner } from "@/components/spinners/LoadingSpinner";

// List of whitelisted domains that are configured in next.config.mjs
const WHITELISTED_DOMAINS = ["images.unsplash.com"];

interface ImageMatch {
  fullMatch: string;
  altText: string;
  url: string;
  index: number;
}

interface ImageManagerProps {
  markdown: string;
  onUpdateMarkdown: (newMarkdown: string) => void;
  postId?: string | null;
}

export default function ImageManager({ markdown, onUpdateMarkdown, postId }: ImageManagerProps) {
  const [searchingIndex, setSearchingIndex] = useState<number | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [customSearchQuery, setCustomSearchQuery] = useState<Record<number, string>>({});
  const [showAddImage, setShowAddImage] = useState(false);
  const [newImageAlt, setNewImageAlt] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageSearchQuery, setNewImageSearchQuery] = useState("");
  const addImageFileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Parse markdown to find all images
  const images = useMemo(() => {
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const matches: ImageMatch[] = [];
    let match;
    let index = 0;
    while ((match = imageRegex.exec(markdown)) !== null) {
      matches.push({
        fullMatch: match[0],
        altText: match[1],
        url: match[2],
        index: index++,
      });
    }
    return matches;
  }, [markdown]);

  const handleFindNewImage = async (image: ImageMatch, customQuery?: string) => {
    setSearchingIndex(image.index);
    try {
      const searchQuery = customQuery || image.altText || "parenting family";
      console.log("Searching for image with query:", searchQuery);
      console.log("Current image to replace:", image.fullMatch);
      
      const response = await fetch("/api/blog/find-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: searchQuery }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API error:", response.status, errorData);
        throw new Error(errorData.error || "Failed to find image");
      }

      const result = await response.json();
      console.log("API response:", result);
      
      if (result.ok && result.imageUrl) {
        // Get fresh markdown from the prop (it's reactive via form.watch)
        const currentMarkdown = markdown;
        
        // Find all image matches in current markdown to get the exact position
        const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        const allMatches = [...currentMarkdown.matchAll(imageRegex)];
        
        // Find the match at the correct index
        if (allMatches[image.index]) {
          const exactMatch = allMatches[image.index][0];
          const newImageMarkdown = `![${image.altText}](${result.imageUrl})`;
          
          // Replace only the first occurrence of this exact match (in case there are duplicates)
          const newMarkdown = currentMarkdown.replace(exactMatch, newImageMarkdown);
          
          console.log("Replaced image:", {
            old: exactMatch,
            new: newImageMarkdown,
            index: image.index
          });
          
          onUpdateMarkdown(newMarkdown);
        } else {
          console.error("Could not find image at index", image.index, "in markdown");
          // Fallback: try replacing by the stored fullMatch
          const escapedMatch = image.fullMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const newMarkdown = currentMarkdown.replace(
            new RegExp(escapedMatch),
            `![${image.altText}](${result.imageUrl})`
          );
          onUpdateMarkdown(newMarkdown);
        }
      } else {
        console.warn("No image URL in response:", result);
        alert("Could not find a new image. Please try a different search query.");
      }
    } catch (error) {
      console.error("Error finding image:", error);
      alert(`Error finding image: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSearchingIndex(null);
    }
  };

  const handleRemoveImage = (image: ImageMatch) => {
    // Remove the image from markdown
    const newMarkdown = markdown.replace(image.fullMatch, "");
    onUpdateMarkdown(newMarkdown);
  };

  const handleAddImageManually = () => {
    if (newImageUrl.trim()) {
      const altText = newImageAlt.trim() || "Image";
      const imageMarkdown = `![${altText}](${newImageUrl})`;
      // Add image at the end of the markdown
      const newMarkdown = markdown + "\n\n" + imageMarkdown;
      onUpdateMarkdown(newMarkdown);
      setNewImageUrl("");
      setNewImageAlt("");
      setShowAddImage(false);
    }
  };

  const handleAddImageBySearch = async () => {
    if (!newImageSearchQuery.trim()) {
      return;
    }
    setSearchingIndex(-1); // Use -1 to indicate we're adding a new image
    try {
      const response = await fetch("/api/blog/find-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newImageSearchQuery }),
      });

      if (!response.ok) {
        throw new Error("Failed to find image");
      }

      const result = await response.json();
      if (result.ok && result.imageUrl) {
        const altText = newImageAlt.trim() || newImageSearchQuery;
        const imageMarkdown = `![${altText}](${result.imageUrl})`;
        // Add image at the end of the markdown
        const newMarkdown = markdown + "\n\n" + imageMarkdown;
        onUpdateMarkdown(newMarkdown);
        setNewImageSearchQuery("");
        setNewImageAlt("");
        setShowAddImage(false);
      }
    } catch (error) {
      console.error("Error finding image:", error);
    } finally {
      setSearchingIndex(null);
    }
  };

  const handleUploadImage = async (file: File, imageIndex?: number) => {
    if (!postId) {
      alert("Please select a post first");
      return;
    }

    const uploadIndex = imageIndex !== undefined ? imageIndex : -1;
    setUploadingIndex(uploadIndex);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("postId", postId);
      formData.append("imageType", "content");

      const response = await fetch("/api/blog/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to upload image" }));
        throw new Error(errorData.error || "Failed to upload image");
      }

      const result = await response.json();
      if (!result.ok || !result.url) {
        throw new Error("Upload failed - no URL returned");
      }

      if (imageIndex !== undefined) {
        // Replace existing image
        const image = images[imageIndex];
        if (image) {
          const newImageMarkdown = `![${image.altText}](${result.url})`;
          const newMarkdown = markdown.replace(image.fullMatch, newImageMarkdown);
          onUpdateMarkdown(newMarkdown);
        }
      } else {
        // Add new image
        const altText = newImageAlt.trim() || "Image";
        const imageMarkdown = `![${altText}](${result.url})`;
        const newMarkdown = markdown + "\n\n" + imageMarkdown;
        onUpdateMarkdown(newMarkdown);
        setNewImageAlt("");
        setShowAddImage(false);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert(`Error uploading image: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setUploadingIndex(null);
      // Reset file inputs
      if (addImageFileInputRef.current) {
        addImageFileInputRef.current.value = "";
      }
      if (imageIndex !== undefined && imageFileInputRefs.current[imageIndex]) {
        imageFileInputRefs.current[imageIndex]!.value = "";
      }
    }
  };

  const handleAddImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadImage(file);
    }
  };

  const handleReplaceImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, imageIndex: number) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadImage(file, imageIndex);
    }
  };

  return (
    <div className="space-y-3">
      {/* Add Image Section */}
      <div className="border-b border-sage/20 pb-3">
        {!showAddImage ? (
          <button
            type="button"
            onClick={() => setShowAddImage(true)}
            className="flex items-center gap-2 w-full rounded border border-sage/30 bg-white px-3 py-2 text-xs text-forest hover:bg-sage/10 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add New Image
          </button>
        ) : (
          <div className="space-y-2 rounded-lg border border-sage/20 bg-white p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-charcoal">Add New Image</span>
              <button
                type="button"
                onClick={() => {
                  setShowAddImage(false);
                  setNewImageUrl("");
                  setNewImageAlt("");
                  setNewImageSearchQuery("");
                }}
                className="text-xs text-slateSoft hover:text-charcoal"
              >
                Cancel
              </button>
            </div>
            
            {/* Upload Image */}
            {postId && (
              <div className="space-y-1.5">
                <label className="text-xs text-slateSoft">Upload image from your computer</label>
                <div className="flex gap-2">
                  <input
                    ref={addImageFileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleAddImageFileChange}
                    className="hidden"
                    id="add-image-file-input"
                  />
                  <label
                    htmlFor="add-image-file-input"
                    className={`flex items-center gap-1 flex-1 rounded border border-sage/30 bg-white px-2 py-1.5 text-xs text-forest hover:bg-sage/10 transition-colors cursor-pointer ${
                      uploadingIndex === -1 ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {uploadingIndex === -1 ? (
                      <>
                        <LoadingSpinner size="sm" label="Uploading" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-3 w-3" />
                        <span>Choose File</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            )}

            {/* Manual URL Input */}
            <div className="space-y-1.5">
              <label className="text-xs text-slateSoft">Or enter image URL</label>
              <input
                type="text"
                placeholder="https://example.com/image.jpg"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="w-full text-xs rounded border border-sage/30 px-2 py-1.5 focus:outline-none focus:border-sage"
              />
            </div>

            {/* Alt Text Input */}
            <div className="space-y-1.5">
              <label className="text-xs text-slateSoft">Alt Text</label>
              <input
                type="text"
                placeholder="Description of image"
                value={newImageAlt}
                onChange={(e) => setNewImageAlt(e.target.value)}
                className="w-full text-xs rounded border border-sage/30 px-2 py-1.5 focus:outline-none focus:border-sage"
              />
            </div>

            {/* Search for Image */}
            <div className="space-y-1.5">
              <label className="text-xs text-slateSoft">Or search for image</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search query (e.g., 'baby playing')"
                  value={newImageSearchQuery}
                  onChange={(e) => setNewImageSearchQuery(e.target.value)}
                  className="flex-1 text-xs rounded border border-sage/30 px-2 py-1.5 focus:outline-none focus:border-sage"
                />
                <button
                  type="button"
                  onClick={handleAddImageBySearch}
                  disabled={!newImageSearchQuery.trim() || searchingIndex === -1}
                  className="flex items-center gap-1 rounded border border-sage/30 bg-white px-2 py-1.5 text-xs text-forest hover:bg-sage/10 disabled:opacity-50"
                >
                  {searchingIndex === -1 ? (
                    <LoadingSpinner size="sm" label="Searching" />
                  ) : (
                    <>
                      <Search className="h-3 w-3" />
                      Search
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Add Button for Manual URL */}
            {newImageUrl.trim() && (
              <button
                type="button"
                onClick={handleAddImageManually}
                className="w-full rounded border border-sage/30 bg-sage/10 px-3 py-1.5 text-xs text-forest hover:bg-sage/20 transition-colors"
              >
                Add Image
              </button>
            )}
          </div>
        )}
      </div>

      {/* Existing Images */}
      {images.length === 0 ? (
        <div className="text-sm text-slateSoft text-center py-4">
          No images found in content
        </div>
      ) : (
        <>
          <div className="text-xs text-slateSoft">
            {images.length} image{images.length !== 1 ? "s" : ""} in content
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {images.map((image) => {
              const isValidUrl = image.url.startsWith("http");
              const isSearching = searchingIndex === image.index;

              // Check if the domain is whitelisted for Next.js Image
              let isWhitelisted = false;
              if (isValidUrl) {
                try {
                  const url = new URL(image.url);
                  isWhitelisted = WHITELISTED_DOMAINS.some(
                    (domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`)
                  );
                } catch {
                  // Invalid URL, treat as not whitelisted
                  isWhitelisted = false;
                }
              }

              return (
                <div
                  key={image.index}
                  className="rounded-lg border border-sage/20 bg-white p-3 space-y-2"
                >
                  {/* Image Preview */}
                  <div className="flex gap-3">
                    <div className="relative w-20 h-14 rounded bg-cream/50 overflow-hidden flex-shrink-0">
                      {isValidUrl ? (
                        isWhitelisted ? (
                          <Image
                            src={image.url}
                            alt={image.altText || "Blog image"}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <img
                            src={image.url}
                            alt={image.altText || "Blog image"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slateSoft">
                          Invalid
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-charcoal truncate">
                        {image.altText || "(no alt text)"}
                      </p>
                      <p className="text-xs text-slateSoft truncate mt-0.5">
                        {image.url.length > 50
                          ? `${image.url.slice(0, 50)}...`
                          : image.url}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {/* Upload Button */}
                    {postId && (
                      <>
                        <input
                          ref={(el) => {
                            imageFileInputRefs.current[image.index] = el;
                          }}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={(e) => handleReplaceImageFileChange(e, image.index)}
                          className="hidden"
                          id={`upload-image-${image.index}`}
                        />
                        <label
                          htmlFor={`upload-image-${image.index}`}
                          className={`flex items-center gap-1 rounded border border-sage/30 bg-white px-2 py-1.5 text-xs text-forest hover:bg-sage/10 transition-colors cursor-pointer ${
                            uploadingIndex === image.index ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          title="Upload image to replace this one"
                        >
                          {uploadingIndex === image.index ? (
                            <>
                              <LoadingSpinner size="sm" label="Uploading" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-3 w-3" />
                              <span>Upload</span>
                            </>
                          )}
                        </label>
                      </>
                    )}
                    {/* Quick Refresh - searches with current alt text */}
                    <button
                      type="button"
                      onClick={() => handleFindNewImage(image, image.altText)}
                      disabled={isSearching}
                      className="flex items-center gap-1 rounded border border-sage/30 bg-white px-2 py-1.5 text-xs text-forest hover:bg-sage/10 disabled:opacity-50"
                      title="Find new image using current description"
                    >
                      {isSearching ? (
                        <LoadingSpinner size="sm" label="Searching" />
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3" />
                          Find New
                        </>
                      )}
                    </button>

                    {/* Search Input for Custom Query */}
                    <input
                      type="text"
                      placeholder={image.altText || "Custom search..."}
                      value={customSearchQuery[image.index] || ""}
                      onChange={(e) =>
                        setCustomSearchQuery((prev) => ({
                          ...prev,
                          [image.index]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && customSearchQuery[image.index]) {
                          handleFindNewImage(image, customSearchQuery[image.index]);
                        }
                      }}
                      className="flex-1 text-xs rounded border border-sage/30 px-2 py-1.5 focus:outline-none focus:border-sage"
                    />

                    {/* Search Button for Custom Query */}
                    {customSearchQuery[image.index] && (
                      <button
                        type="button"
                        onClick={() =>
                          handleFindNewImage(image, customSearchQuery[image.index])
                        }
                        disabled={isSearching}
                        className="flex items-center gap-1 rounded border border-sage/30 bg-white px-2 py-1.5 text-xs text-forest hover:bg-sage/10 disabled:opacity-50"
                        title="Search with custom query"
                      >
                        {isSearching ? (
                          <LoadingSpinner size="sm" label="Searching" />
                        ) : (
                          <Search className="h-3 w-3" />
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveImage(image)}
                      className="flex items-center gap-1 rounded border border-red-200 bg-white px-2 py-1.5 text-xs text-red-500 hover:bg-red-50"
                      title="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}



