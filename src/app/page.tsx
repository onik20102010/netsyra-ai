import type { Metadata } from "next";
import TopNav from "@/components/layout/TopNav";
import HeroSection from "@/components/sections/HeroSection";
import LiveRoutingSection from "@/components/sections/LiveRoutingSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import CTASection from "@/components/sections/CTASection";
import CodeShowcaseSection from "@/components/sections/CodeShowcaseSection";
import FooterSection from "@/components/sections/FooterSection";
import JsonLd from "@/components/JsonLd";
import { webPageJsonLd, breadcrumbJsonLd } from "@/lib/structured-data";
import { createMetadata } from "@/lib/seo";

const title = "Netsyra AI – Advanced Multi-Model AI Assistant";
const description =
  "Netsyra AI (NetsyraAI) is an intelligent AI orchestration platform at netsyraai.com that routes every prompt to the best AI model. Get real-time web search, coding, deep reasoning, and up to 70% cost savings.";

export const metadata: Metadata = createMetadata({
  title: "Netsyra AI – Advanced Multi-Model AI Assistant",
  description,
  path: "/",
  keywords: [
    "NetsyraAI",
    "Netsyra AI",
    "netsyraai",
    "netsyra ai",
    "netsyraai.com",
    "NetsyraAI.com",
    "what is netsyra ai",
    "netsyra ai assistant",
    "netsyraai platform",
  ],
});

export default function Home() {
  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({ path: "/", title, description }),
          breadcrumbJsonLd({ path: "/", title: "Home" }),
        ]}
      />
      <main className="relative overflow-hidden bg-[#050505]">
        {/* SEO: Brand-rich intro paragraph (visible, crawlable) */}
        <section className="sr-only">
          <h2>About Netsyra AI</h2>
          <p>
            Netsyra AI, also known as NetsyraAI or netsyraai, is an advanced
            multi-model AI assistant platform available at netsyraai.com. It
            intelligently routes every prompt to the best AI model for the task,
            offering real-time web search, AI coding assistance via the built-in
            web IDE, deep reasoning with autonomous agent intelligence (AAI),
            and up to 70% cost savings compared to single-model AI assistants.
            Netsyra AI supports multiple model tiers including N Fast, N Plus,
            N Pro, N Code, N Live, and N AAI, powered by providers like Groq,
            Google Gemini, Cerebras, DeepSeek, Anthropic, and OpenAI.
          </p>
        </section>
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
      <CodeShowcaseSection />
      <CTASection />
      <FooterSection />
    </main>
    </>
  );
}