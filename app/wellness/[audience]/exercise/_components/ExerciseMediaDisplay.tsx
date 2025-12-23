"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2, Play, X } from "lucide-react";
import type { ExerciseMedia } from "@/lib/wellness/exercise-media";

interface ExerciseMediaDisplayProps {
  exerciseName: string;
  compact?: boolean;
}

export default function ExerciseMediaDisplay({
  exerciseName,
  compact = false,
}: ExerciseMediaDisplayProps) {
  const [media, setMedia] = useState<ExerciseMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      setError(false);

      try {
        const response = await fetch(
          `/api/wellness/exercise-media?name=${encodeURIComponent(exerciseName)}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch media");
        }

        const data = await response.json();
        setMedia(data.media);
      } catch (err) {
        console.error("Error fetching exercise media:", err);
        setError(true);
        // Log detailed error for debugging
        if (err instanceof Error) {
          console.error("Error details:", {
            message: err.message,
            exerciseName,
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [exerciseName]);

  // Loading state
  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-sage/5 rounded-lg ${
          compact ? "w-16 h-16" : "w-24 h-24"
        }`}
      >
        <Loader2 className="h-5 w-5 animate-spin text-sage/50" />
      </div>
    );
  }

  // No media available
  if (error || !media || (!media.gifUrl && !media.imageUrl) || imageError) {
    return null; // Don't show anything if no media
  }

  const mediaUrl = media.gifUrl || media.imageUrl;

  if (!mediaUrl) {
    return null;
  }

  // Compact view (thumbnail that expands on click)
  if (compact) {
    return (
      <>
        <button
          onClick={() => setExpanded(true)}
          className="relative group rounded-lg overflow-hidden bg-sage/5 hover:ring-2 hover:ring-sage/50 transition-all"
          title="Click to see exercise demonstration"
        >
          <img
            src={mediaUrl}
            alt={`${exerciseName} demonstration`}
            className="w-16 h-16 object-cover"
            onError={(e) => {
              console.error("Image failed to load:", {
                src: mediaUrl,
                exerciseName,
                error: e,
              });
              setImageError(true);
            }}
          />
          <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/30 transition-colors flex items-center justify-center">
            <Play className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>

        {/* Expanded Modal */}
        {expanded && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/70 p-4 backdrop-blur-sm"
            onClick={() => setExpanded(false)}
          >
            <div
              className="relative max-w-lg w-full bg-white rounded-2xl p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setExpanded(false)}
                className="absolute top-2 right-2 rounded-full p-2 hover:bg-charcoal/10 transition-colors z-10"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-charcoal/60" />
              </button>
              <h4 className="text-lg font-semibold text-charcoal mb-3 pr-8">
                {exerciseName}
              </h4>
              <div className="rounded-lg overflow-hidden bg-sage/5">
                <img
                  src={mediaUrl}
                  alt={`${exerciseName} demonstration`}
                  className="w-full h-auto"
                  onError={(e) => {
                    console.error("Image failed to load (expanded):", {
                      src: mediaUrl,
                      exerciseName,
                      error: e,
                    });
                    setImageError(true);
                  }}
                />
              </div>
              <p className="mt-3 text-xs text-charcoal/50 text-center">
                Click outside to close
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  // Full view
  return (
    <div className="rounded-lg overflow-hidden bg-sage/5">
      <img
        src={mediaUrl}
        alt={`${exerciseName} demonstration`}
        className="w-full h-auto max-h-48 object-contain"
        onError={(e) => {
          console.error("Image failed to load (full view):", {
            src: mediaUrl,
            exerciseName,
            error: e,
          });
          setImageError(true);
        }}
      />
    </div>
  );
}
