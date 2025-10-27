import type { MetadataRoute } from "next";

import { searchClasses } from "@/lib/db/supabase";

const BASE_URL = "https://parent-helper-app-parenthelper5.up.railway.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const popularTowns = ["london", "manchester", "bristol", "leeds", "birmingham"];
  const townPages = popularTowns.map((town) => ({
    url: `${BASE_URL}/classes/town/${town}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const classes = await searchClasses({});

  const classPages = classes.map((cls) => ({
    url: `${BASE_URL}/classes/${cls.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const staticPages = [
    { url: `${BASE_URL}/`, lastModified: new Date(), priority: 1.0 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), priority: 0.5 },
    { url: `${BASE_URL}/provider/signup`, lastModified: new Date(), priority: 0.5 },
    { url: `${BASE_URL}/provider/dashboard`, lastModified: new Date(), priority: 0.4 },
  ];

  return [...staticPages, ...townPages, ...classPages];
}
