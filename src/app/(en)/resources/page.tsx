import ResourcesIndexView, { resourcesIndexMetadata } from "@/views/ResourcesIndexView";

export const metadata = resourcesIndexMetadata("en");

export default function Page() {
  return <ResourcesIndexView locale="en" />;
}
