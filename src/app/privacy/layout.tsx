import { createMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { webPageJsonLd } from "@/lib/structured-data";

const title = "Privacy Policy";
const description =
  "Netsyra AI's privacy policy. Learn what data we collect, how we use it, and your rights.";

export const metadata = createMetadata({
  title,
  description,
  path: "/privacy",
  keywords: ["privacy policy", "data protection", "Netsyra AI privacy"],
});

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={webPageJsonLd({ path: "/privacy", title: `${title} | Netsyra AI`, description })} />
      {children}
    </>
  );
}
