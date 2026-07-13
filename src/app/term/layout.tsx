import { noindexMetadata } from "@/lib/seo";

export const metadata = noindexMetadata("Terms of Service");

export default function TermLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
