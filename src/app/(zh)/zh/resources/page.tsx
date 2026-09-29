import ResourcesIndexView, { resourcesIndexMetadata } from "@/views/ResourcesIndexView";

export const metadata = resourcesIndexMetadata("zh");

export default function Page() {
  return <ResourcesIndexView locale="zh" />;
}
