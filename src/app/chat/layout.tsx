import { noindexMetadata } from "@/lib/seo";

export const metadata = noindexMetadata("AI Chat");

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
