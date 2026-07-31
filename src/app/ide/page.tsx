// d:\netsyra\src\app\ide\page.tsx

import { TitleBar } from "@/components/ide/TitleBar";
import { IdeShell } from "@/components/ide/IdeShell";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Netsyra IDE",
  description: "AI-native web IDE powered by Netsyra.",
  path: "/ide",
});

export default function IDEPage() {
  return (
    // Outer container locks to the viewport, preventing the "cut-off text" issues.
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d1117] text-[#e6edf3] font-sans">
      {/* Top Menu Bar (File, Edit, Selection, etc.) */}
      <TitleBar />
      
      {/* Main IDE Layout (Activity Bar, Sidebar, Editor, Bottom Panel, Status Bar) */}
      <IdeShell />
    </div>
  );
}