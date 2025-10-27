"use client";

import { useEffect } from "react";

type UTMData = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
};

const STORAGE_KEY = "ph_utm_data";

export function UTMTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const utmData: UTMData = {
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_term: params.get("utm_term"),
      utm_content: params.get("utm_content"),
    };

    const hasUtm = Object.values(utmData).some((value) => value !== null);
    if (hasUtm) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(utmData));
    } else {
      const existing = window.localStorage.getItem(STORAGE_KEY);
      if (!existing) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(utmData));
      }
    }
  }, []);

  return null;
}
