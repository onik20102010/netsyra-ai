import { IdeShell } from "@/components/ide/IdeShell";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Netsyra IDE",
  description: "AI-native web IDE powered by Netsyra.",
  path: "/ide",
});

export default function IDEPage() {
  return <IdeShell />;
}
