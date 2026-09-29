import type { Metadata } from "next";
import MethodView from "@/views/MethodView";
import { getDictionary } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

const dictionary = getDictionary("en");

export const metadata: Metadata = pageMetadata({
  locale: "en",
  path: "/method",
  title: dictionary.seo.methodTitle,
  description: dictionary.seo.methodDescription,
});

export default function Page() {
  return <MethodView locale="en" />;
}
