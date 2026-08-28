import type { MetadataRoute } from "next";
import { freeTiers, platformContents, resources } from "@/lib/content";

export const dynamic = "force-static";

const BASE_URL = "https://api-spotlight.pages.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/method/", "/test/", "/free-tier/", "/resources/", ...platformContents.map((item) => `/platform/${item.slug}/`), ...freeTiers.map((item) => `/free-tier/${item.slug}/`), ...resources.map((item) => `/resources/${item.slug}/`), ...[...new Set(resources.map((item) => item.category_slug))].map((slug) => `/resources/category/${slug}/`)];
  return pages.map((path) => ({
    url: `${BASE_URL}${path}`,
    changeFrequency: path === "/" ? "daily" : "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
