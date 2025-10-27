import type { MetadataRoute } from "next";

const BASE_URL = "https://parent-helper-app-parenthelper5.up.railway.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/provider/dashboard"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
