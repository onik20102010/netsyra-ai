import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { createMetadata } from "@/lib/seo";
import { organizationJsonLd, breadcrumbJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = createMetadata({
  title: "Netsyra AI Brand Assets & Logo",
  description:
    "Download the official Netsyra AI logo and brand assets. NetsyraAI logo in PNG and SVG format for press, media, and partner use.",
  path: "/brand",
  keywords: [
    "Netsyra AI logo",
    "NetsyraAI logo",
    "netsyraai logo",
    "Netsyra AI brand",
    "Netsyra AI icon",
    "NetsyraAI brand assets",
  ],
});

export default function BrandPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name: "Netsyra AI Logo",
    description: "Official Netsyra AI logo — advanced multi-model AI assistant",
    url: "https://netsyraai.com/logo.png",
    contentUrl: "https://netsyraai.com/logo.png",
    width: 512,
    height: 512,
    format: "image/png",
    license: "https://netsyraai.com/legal",
    acquireLicensePage: "https://netsyraai.com/legal",
    creator: {
      "@type": "Organization",
      name: "Netsyra AI",
      url: "https://netsyraai.com",
    },
    copyrightNotice: "© Netsyra AI. All rights reserved.",
    creditText: "Netsyra AI",
    isFamilyFriendly: true,
    representativeOfPage: true,
  };

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          jsonLd,
          breadcrumbJsonLd({ path: "/brand", title: "Brand Assets" }),
        ]}
      />
      <main className="min-h-screen bg-[#050505] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4">
              <span className="bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
                Netsyra AI Brand Assets
              </span>
            </h1>
            <p className="text-white/50 text-base sm:text-lg max-w-2xl mx-auto">
              Official Netsyra AI (NetsyraAI) logo and brand assets for press,
              media, partners, and open-source use.
            </p>
          </div>

          {/* Logo Showcase */}
          <section className="space-y-12">
            {/* Primary Logo */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 sm:p-12">
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">
                Primary Logo
              </h2>
              <p className="text-white/40 text-sm mb-8">
                The official Netsyra AI logo. PNG format, 512×512 pixels.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="bg-white rounded-2xl p-8 flex items-center justify-center">
                  <img
                    src="/logo.png"
                    alt="Netsyra AI logo"
                    width={160}
                    height={160}
                    className="object-contain"
                  />
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div className="flex items-center justify-between bg-black/40 rounded-lg px-4 py-3 border border-white/5">
                    <span className="text-white/60 text-sm">Format</span>
                    <span className="text-white text-sm font-mono">PNG</span>
                  </div>
                  <div className="flex items-center justify-between bg-black/40 rounded-lg px-4 py-3 border border-white/5">
                    <span className="text-white/60 text-sm">Dimensions</span>
                    <span className="text-white text-sm font-mono">
                      512 × 512
                    </span>
                  </div>
                  <a
                    href="/logo.png"
                    download="netsyra-ai-logo.png"
                    className="inline-flex items-center justify-center w-full bg-white text-black font-medium px-6 py-3 rounded-lg hover:bg-white/90 transition-all"
                  >
                    Download Logo (PNG)
                  </a>
                </div>
              </div>
            </div>

            {/* Favicon / SVG */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 sm:p-12">
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">
                SVG Favicon
              </h2>
              <p className="text-white/40 text-sm mb-8">
                Scalable vector version of the Netsyra AI icon.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="bg-white rounded-2xl p-8 flex items-center justify-center">
                  <img
                    src="/favicon.svg"
                    alt="Netsyra AI favicon SVG"
                    width={96}
                    height={96}
                    className="object-contain"
                  />
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div className="flex items-center justify-between bg-black/40 rounded-lg px-4 py-3 border border-white/5">
                    <span className="text-white/60 text-sm">Format</span>
                    <span className="text-white text-sm font-mono">SVG</span>
                  </div>
                  <div className="flex items-center justify-between bg-black/40 rounded-lg px-4 py-3 border border-white/5">
                    <span className="text-white/60 text-sm">Scalable</span>
                    <span className="text-white text-sm font-mono">Yes</span>
                  </div>
                  <a
                    href="/favicon.svg"
                    download="netsyra-ai-favicon.svg"
                    className="inline-flex items-center justify-center w-full bg-white text-black font-medium px-6 py-3 rounded-lg hover:bg-white/90 transition-all"
                  >
                    Download Favicon (SVG)
                  </a>
                </div>
              </div>
            </div>

            {/* App Icons */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 sm:p-12">
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">
                App Icons
              </h2>
              <p className="text-white/40 text-sm mb-8">
                Icons for web app manifests and mobile home screen.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-white rounded-xl p-4">
                    <img
                      src="/apple-touch-icon.png"
                      alt="Netsyra AI Apple touch icon"
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </div>
                  <span className="text-white/40 text-xs">180×180 Apple</span>
                  <a
                    href="/apple-touch-icon.png"
                    download="netsyra-ai-apple-touch.png"
                    className="text-blue-400 hover:text-blue-300 text-xs"
                  >
                    Download
                  </a>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-white rounded-xl p-4">
                    <img
                      src="/web-app-manifest-192x192.png"
                      alt="Netsyra AI icon 192px"
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </div>
                  <span className="text-white/40 text-xs">192×192</span>
                  <a
                    href="/web-app-manifest-192x192.png"
                    download="netsyra-ai-192.png"
                    className="text-blue-400 hover:text-blue-300 text-xs"
                  >
                    Download
                  </a>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-white rounded-xl p-4">
                    <img
                      src="/web-app-manifest-512x512.png"
                      alt="Netsyra AI icon 512px"
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </div>
                  <span className="text-white/40 text-xs">512×512</span>
                  <a
                    href="/web-app-manifest-512x512.png"
                    download="netsyra-ai-512.png"
                    className="text-blue-400 hover:text-blue-300 text-xs"
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>

            {/* Usage Guidelines */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 sm:p-12">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4">
                Usage Guidelines
              </h2>
              <ul className="space-y-3 text-white/50 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>
                    Use the Netsyra AI logo for press articles, blog posts, and
                    media coverage about NetsyraAI.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>
                    Use the logo to link back to netsyraai.com from partner
                    sites and directories.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>
                    Use in open-source projects that integrate with the Netsyra
                    AI platform.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>
                    Do not modify, recolor, or distort the logo. Always
                    maintain original proportions.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-0.5">✗</span>
                  <span>
                    Do not use the logo in a way that implies endorsement
                    without permission.
                  </span>
                </li>
              </ul>
            </div>

            {/* Brand Info */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 sm:p-12">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4">
                About Netsyra AI
              </h2>
              <p className="text-white/50 text-sm leading-relaxed mb-4">
                Netsyra AI, also known as NetsyraAI or netsyraai, is an
                advanced multi-model AI assistant platform available at
                netsyraai.com. It intelligently routes every prompt to the best
                AI model for the task — providing real-time web search, coding
                assistance via the built-in web IDE, deep reasoning with
                autonomous agent intelligence (AAI), and up to 70% cost savings
                compared to single-model AI assistants.
              </p>
              <p className="text-white/40 text-xs leading-relaxed mb-4">
                The brand name &quot;Netsyra&quot; is a unique trademark of
                netsyraai.com. It is not related to any other AI company or
                product. Common alternative spellings include NetsyraAI,
                netsyraai, and netsyra ai. The correct spelling is Netsyra AI.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-black/40 rounded-lg px-4 py-3 border border-white/5">
                  <div className="text-white/40 text-xs mb-1">Brand Name</div>
                  <div className="text-white text-sm font-mono">Netsyra AI</div>
                </div>
                <div className="bg-black/40 rounded-lg px-4 py-3 border border-white/5">
                  <div className="text-white/40 text-xs mb-1">Domain</div>
                  <div className="text-white text-sm font-mono">
                    netsyraai.com
                  </div>
                </div>
                <div className="bg-black/40 rounded-lg px-4 py-3 border border-white/5">
                  <div className="text-white/40 text-xs mb-1">Also Known As</div>
                  <div className="text-white text-sm font-mono">NetsyraAI</div>
                </div>
                <div className="bg-black/40 rounded-lg px-4 py-3 border border-white/5">
                  <div className="text-white/40 text-xs mb-1">Category</div>
                  <div className="text-white text-sm font-mono">
                    AI Assistant
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
