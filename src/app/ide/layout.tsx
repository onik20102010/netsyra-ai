import { createMetadata } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { webPageJsonLd } from "@/lib/structured-data";

const title = "Netsyra IDE";
const description =
  "AI-native web IDE powered by Netsyra Runtime. Write, run, and deploy code with intelligent AI assistance in the browser.";

export const metadata = createMetadata({
  title,
  description,
  path: "/ide",
  keywords: ["AI IDE", "online code editor", "AI code assistant", "Netsyra IDE"],
});

export default function IDELayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={webPageJsonLd({ path: "/ide", title: `${title} | Netsyra AI`, description })} />
      <div className="h-screen w-screen bg-neutral-950 text-white overflow-hidden">
        {children}
      </div>
    </>
  );
}
