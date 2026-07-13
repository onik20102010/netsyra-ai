import type { Metadata } from "next";

export const siteUrl = "https://netsyraai.com";

export const defaultTitle = "Netsyra AI – Advanced Multi-Model AI Assistant";

export const defaultDescription =
  "Netsyra AI is an intelligent AI orchestration layer that routes every prompt to the best AI model. Get real-time web search, coding, deep reasoning, and up to 70% cost savings.";

export const keywords = [
  "AI assistant",
  "AI orchestration",
  "multi-model AI",
  "Netsyra AI",
  "LLM routing",
  "AI chatbot",
  "real-time web search",
  "AI coding assistant",
  "autonomous AI",
];

export const defaultOpenGraph = {
  siteName: "Netsyra AI",
  locale: "en_US",
  type: "website" as const,
  images: [
    {
      url: "/logo.png",
      width: 512,
      height: 512,
      alt: "Netsyra AI logo",
    },
  ],
};

export function createMetadata({
  title,
  description,
  path,
  keywords: pageKeywords,
  noindex = false,
  openGraph,
}: {
  title: string;
  description?: string;
  path: string;
  keywords?: string[];
  noindex?: boolean;
  openGraph?: Metadata["openGraph"];
}): Metadata {
  const canonical = path;
  return {
    title: `${title} | Netsyra AI`,
    description: description || defaultDescription,
    keywords: pageKeywords ? [...keywords, ...pageKeywords] : keywords,
    alternates: {
      canonical,
    },
    robots: noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      title: `${title} | Netsyra AI`,
      description: description || defaultDescription,
      url: canonical,
      ...defaultOpenGraph,
      ...openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Netsyra AI`,
      description: description || defaultDescription,
      images: ["/logo.png"],
    },
  };
}

export function noindexMetadata(title: string): Metadata {
  return {
    title: `${title} | Netsyra AI`,
    robots: { index: false, follow: false },
  };
}
