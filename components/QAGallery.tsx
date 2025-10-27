"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeftRight, Eye, EyeOff, ZoomIn, ZoomOut } from "lucide-react";

interface Screenshot {
  viewport: string;
  local: string;
  prod: string;
  diff?: string;
}

export default function QAGallery({ screenshots }: { screenshots: Screenshot[] }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showDiff, setShowDiff] = useState(false);

  const shot = screenshots[index];

  const next = () => setIndex((i) => (i + 1) % screenshots.length);
  const prev = () => setIndex((i) => (i - 1 + screenshots.length) % screenshots.length);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-teal-dark flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5" /> Visual Comparison
        </h2>
        <div className="flex gap-2">
          <button
            className="p-2 bg-gray-100 rounded-md hover:bg-gray-200"
            onClick={() => setZoom((z) => Math.min(z + 0.25, 2))}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            className="p-2 bg-gray-100 rounded-md hover:bg-gray-200"
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            className="p-2 bg-gray-100 rounded-md hover:bg-gray-200"
            onClick={() => setShowDiff((v) => !v)}
            aria-label="Toggle diff view"
          >
            {showDiff ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 text-sm text-gray-500">
        <button onClick={prev} className="hover:text-teal" aria-label="Previous screenshot">
          ← Prev
        </button>
        <span>{shot.viewport}</span>
        <button onClick={next} className="hover:text-teal" aria-label="Next screenshot">
          Next →
        </button>
      </div>

      <div className="flex justify-center gap-4 overflow-auto">
        {!showDiff ? (
          <>
            <div className="flex flex-col items-center">
              <p className="text-xs mb-1 text-sage">Local</p>
              <Image
                src={shot.local}
                alt={`${shot.viewport} local screenshot`}
                width={400}
                height={800}
                className="border rounded-lg"
                style={{ transform: `scale(${zoom})`, transformOrigin: "top" }}
              />
            </div>
            <div className="flex flex-col items-center">
              <p className="text-xs mb-1 text-sage">Prod</p>
              <Image
                src={shot.prod}
                alt={`${shot.viewport} production screenshot`}
                width={400}
                height={800}
                className="border rounded-lg"
                style={{ transform: `scale(${zoom})`, transformOrigin: "top" }}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <p className="text-xs mb-1 text-sage">Diff</p>
            <Image
              src={shot.diff || shot.prod}
              alt={`${shot.viewport} diff screenshot`}
              width={800}
              height={800}
              className="border rounded-lg"
              style={{ transform: `scale(${zoom})`, transformOrigin: "top" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
