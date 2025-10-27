"use client";

import { useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";

interface ClassDetailClientProps {
  classId: string;
}

export function ClassDetailClient({ classId }: ClassDetailClientProps) {
  const normalizedId = useMemo(() => {
    const parsed = Number(classId);
    return Number.isNaN(parsed) ? classId : parsed;
  }, [classId]);

  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    const existing = localStorage.getItem("ph_session_id");
    const newSession = existing || nanoid();
    localStorage.setItem("ph_session_id", newSession);
    setSessionId(newSession);
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const controller = new AbortController();

    const utmData =
      typeof window !== "undefined" ? window.localStorage.getItem("ph_utm_data") : null;
    const geoData =
      typeof window !== "undefined" ? window.localStorage.getItem("ph_geo_data") : null;

    fetch("/api/class-view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-utm-data": utmData || "{}",
        "x-geo-data": geoData || "{}",
      },
      body: JSON.stringify({
        class_id: normalizedId,
        referrer: document.referrer || undefined,
        session_id: sessionId,
      }),
      signal: controller.signal,
    }).catch(() => {});

    return () => controller.abort();
  }, [normalizedId, sessionId]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <h1 className="text-3xl font-semibold text-brand-teal">Class #{normalizedId}</h1>
      <p className="text-brand-textMuted">
        This is a placeholder class detail page. Replace this content with real class information
        and booking actions once connected to your data source.
      </p>
    </div>
  );
}
