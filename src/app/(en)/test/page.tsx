import type { Metadata } from "next";
import TestView from "@/views/TestView";
import { getDictionary } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

const dictionary = getDictionary("en");

export const metadata: Metadata = pageMetadata({
  locale: "en",
  path: "/test",
  title: dictionary.seo.testTitle,
  description: dictionary.seo.testDescription,
});

export default function Page() {
  return <TestView locale="en" />;
}
