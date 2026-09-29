import FreeTierIndexView, { freeTierIndexMetadata } from "@/views/FreeTierIndexView";

export const metadata = freeTierIndexMetadata("en");

export default function Page() {
  return <FreeTierIndexView locale="en" />;
}
