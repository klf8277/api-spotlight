import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const BASE_URL = "https://api-spotlight.pages.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/method/", "/test/"].map((path) => ({
    url: `${BASE_URL}${path}`,
    changeFrequency: path === "/" ? "daily" : "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
