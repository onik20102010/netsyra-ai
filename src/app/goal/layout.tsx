import { createMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { webPageJsonLd } from "@/lib/structured-data";

const title = "Goals & Mission";
const description =
  "Discover the mission behind Netsyra AI: building the standard orchestration layer for AI-powered applications with multi-provider routing, cost efficiency, and privacy.";

export const metadata = createMetadata({
  title,
  description,
  path: "/goal",
  keywords: ["Netsyra AI mission", "AI orchestration", "multi-provider routing", "cost-efficient AI"],
});

export default function GoalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={webPageJsonLd({ path: "/goal", title: `${title} | Netsyra AI`, description })} />
      {children}
    </>
  );
}
