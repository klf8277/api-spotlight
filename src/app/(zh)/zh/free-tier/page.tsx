import FreeTierIndexView, { freeTierIndexMetadata } from "@/views/FreeTierIndexView";

export const metadata = freeTierIndexMetadata("zh");

export default function Page() {
  return <FreeTierIndexView locale="zh" />;
}
