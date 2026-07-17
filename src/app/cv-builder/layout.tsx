import { createMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { webPageJsonLd } from "@/lib/structured-data";

const title = "AI Resume & CV Builder";
const description =
  "Build a professional resume or CV in minutes with Netsyra AI's free AI-powered CV builder.";

export const metadata = createMetadata({
  title,
  description,
  path: "/cv-builder",
  keywords: ["NetsyraAI CV builder", "Netsyra AI resume builder", "netsyraai", "CV builder", "resume builder", "AI resume builder", "free CV maker"],
});

export default function CVBuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={webPageJsonLd({ path: "/cv-builder", title: `${title} | Netsyra AI`, description })} />
      {children}
    </>
  );
}
