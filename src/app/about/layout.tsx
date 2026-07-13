import { createMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { webPageJsonLd } from "@/lib/structured-data";

const title = "About";
const description =
  "Learn how Netsyra AI routes every prompt to the best model, saves up to 70% on AI costs, and protects your privacy with real-time web search and intelligent orchestration.";

export const metadata = createMetadata({
  title,
  description,
  path: "/about",
  keywords: ["about Netsyra AI", "AI orchestration platform", "privacy-first AI"],
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={webPageJsonLd({ path: "/about", title: `${title} | Netsyra AI`, description })} />
      {children}
    </>
  );
}
