import TopNav from "@/components/layout/TopNav";
import HeroSection from "@/components/sections/HeroSection";
import LiveRoutingSection from "@/components/sections/LiveRoutingSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import CTASection from "@/components/sections/CTASection";
import CodeShowcaseSection from "@/components/sections/CodeShowcaseSection";   // ← added semicolon

export default function Home() {
  return (
    <main className="relative overflow-hidden bg-[#050505]">
      {/* Global background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[#050505]" />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[180px] opacity-[0.08]"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)",
          }}
        />
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute top-1/4 left-1/5 w-0.5 h-0.5 bg-white rounded-full"
            style={{ animation: "twinkle 3s infinite 0s" }}
          />
          <div
            className="absolute top-1/3 left-1/2 w-0.5 h-0.5 bg-white rounded-full"
            style={{ animation: "twinkle 3s infinite 1s" }}
          />
          <div
            className="absolute top-2/3 left-1/3 w-0.5 h-0.5 bg-white rounded-full"
            style={{ animation: "twinkle 3s infinite 2s" }}
          />
          <div
            className="absolute top-1/5 left-3/4 w-0.5 h-0.5 bg-white rounded-full"
            style={{ animation: "twinkle 3s infinite 0.5s" }}
          />
          <div
            className="absolute top-3/4 left-2/3 w-0.5 h-0.5 bg-white rounded-full"
            style={{ animation: "twinkle 3s infinite 1.5s" }}
          />
        </div>
      </div>

      <TopNav />
      <HeroSection />
      <LiveRoutingSection />
      <FeaturesSection />
      <CodeShowcaseSection />   {/* ← new */}
      <CTASection />
      {/* Footer removed as requested earlier – add it back if needed */}
    </main>
  );
}