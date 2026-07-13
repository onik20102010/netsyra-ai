import { createMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { webPageJsonLd } from "@/lib/structured-data";

const title = "Terms of Service";
const description =
  "Read Netsyra AI's terms of service. Rules, acceptable use, AI output disclaimers, and contact information.";

export const metadata = createMetadata({
  title,
  description,
  path: "/terms",
  keywords: ["terms of service", "acceptable use", "AI disclaimer", "Netsyra AI terms"],
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={webPageJsonLd({ path: "/terms", title: `${title} | Netsyra AI`, description })} />
      {children}
    </>
  );
}
