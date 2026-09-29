import type { Metadata } from "next";
import HomeView from "@/views/HomeView";
import { getDictionary } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

const dictionary = getDictionary("en");

export const metadata: Metadata = pageMetadata({
  locale: "en",
  path: "/",
  title: dictionary.seo.homeTitle,
  description: dictionary.seo.homeDescription,
});

export default function Page() {
  return <HomeView locale="en" />;
}
