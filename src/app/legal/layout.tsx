import { createMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { webPageJsonLd } from "@/lib/structured-data";

const title = "Legal Notice";
const description =
  "Netsyra AI legal notice. Intellectual property protection, rights, and how to report infringement.";

export const metadata = createMetadata({
  title,
  description,
  path: "/legal",
  keywords: ["legal notice", "intellectual property", "Netsyra AI rights"],
});

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={webPageJsonLd({ path: "/legal", title: `${title} | Netsyra AI`, description })} />
      {children}
    </>
  );
}
