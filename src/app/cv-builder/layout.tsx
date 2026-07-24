import { createMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { webPageJsonLd } from "@/lib/structured-data";

const title = "CV Builder Pro - Create Professional Resumes";
const description =
  "Build your perfect CV with our professional CV builder. Choose from 30+ templates, customize every detail, and export as PDF or PNG.";

export const metadata = createMetadata({
  title,
  description,
  path: "/cv-builder",
  keywords: ["CV builder", "resume builder", "professional CV", "CV templates", "resume templates", "CV maker"],
});

export default function CVBuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={webPageJsonLd({ path: "/cv-builder", title: `${title} | Netsyra AI`, description })} />
      {children}
    </>
  );
}
