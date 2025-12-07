"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * TopLoader - Global loading bar for route transitions
 * Similar to NProgress but styled to match brand colors (sage green to terracotta)
 */
export function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Start loading when route changes
    setIsVisible(true);
    setProgress(0);

    // Simulate progress with acceleration curve
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress > 90) {
        currentProgress = 90;
        clearInterval(interval);
      }
      setProgress(currentProgress);
    }, 100);

    // Complete loading
    const timeout = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 200);
    }, 500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pathname, searchParams]);

  if (!isVisible && progress === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent pointer-events-none"
      aria-hidden="true"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-gradient-to-r from-sage via-sage/90 to-terracotta transition-all duration-300 ease-out shadow-lg"
        style={{
          width: `${progress}%`,
          transition: progress === 100 
            ? "width 0.2s ease-out, opacity 0.2s ease-out" 
            : "width 0.1s linear",
          opacity: isVisible ? 1 : 0,
        }}
      >
        {/* Shimmer effect */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          style={{
            animation: "shimmer 1.5s infinite",
          }}
        />
      </div>
    </div>
  );
}

