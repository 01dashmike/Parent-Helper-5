"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, Clock, Loader2, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

interface ClassDetailRecord {
  id: number;
  name: string;
  description: string | null;
  price: string | null;
  day_of_week: string | null;
  time: string | null;
  town: string | null;
  image_urls: string[] | null;
}

export default function ClassDetail() {
  const params = useParams<{ id: string }>();
  const classId = params?.id;
  const supabase = useMemo(() => {
    if (typeof window === "undefined") return null;
    return getSupabaseBrowserClient();
  }, []);

  const [cls, setCls] = useState<ClassDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !classId) return;

    let active = true;
    async function fetchClass() {
      setLoading(true);
      const client = supabase!;
      const { data } = await client.from("classes").select("*").eq("id", classId).single();
      if (active) {
        setCls((data as ClassDetailRecord) ?? null);
        setLoading(false);
      }
    }
    fetchClass();

    return () => {
      active = false;
    };
  }, [supabase, classId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-teal" />
      </div>
    );
  }

  if (!cls) {
    return <p className="mt-20 text-center text-brand-textMuted">Class not found.</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative h-64 w-full overflow-hidden rounded-xl bg-brand-cream shadow md:h-80">
          <Image
            src={cls.image_urls?.[0] || "/placeholder.jpg"}
            alt={cls.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
          />
        </div>

        <h1 className="mt-6 text-3xl font-bold text-brand-teal">{cls.name}</h1>
        <p className="mt-2 text-brand-textMuted">{cls.description}</p>

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-brand-textMuted">
          {cls.day_of_week ? (
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-coral" />
              {cls.day_of_week}
            </span>
          ) : null}
          {cls.time ? (
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-coral" />
              {cls.time}
            </span>
          ) : null}
          {cls.town ? (
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-coral" />
              {cls.town}
            </span>
          ) : null}
        </div>

        <div className="mt-6">
          <p className="text-lg font-semibold text-brand-coral">£{cls.price || "TBA"}</p>
        </div>

        <Link href={`/class/${classId}/book`}>
          <Button className="mt-6 bg-brand-teal text-white transition hover:bg-brand-coral">
            Book This Class
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
