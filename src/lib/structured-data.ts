import { siteUrl } from "./seo";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Netsyra AI",
    alternateName: ["NetsyraAI", "netsyraai", "netsyra ai", "netsyraai.com"],
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [
      "https://netsyraai.com",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "netsyraai@gmail.com",
      contactType: "support",
      availableLanguage: "English",
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Netsyra AI",
    alternateName: ["NetsyraAI", "netsyraai", "netsyra ai", "netsyraai.com"],
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/chat?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function webPageJsonLd({
  path,
  title,
  description,
}: {
  path: string;
  title: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: `${siteUrl}${path}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Netsyra AI",
      url: siteUrl,
    },
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Netsyra AI",
    alternateName: ["NetsyraAI", "netsyraai", "netsyra ai", "netsyraai.com"],
    applicationCategory: "AIApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    url: siteUrl,
    description:
      "Netsyra AI routes every prompt to the best AI model with real-time web search, coding, and autonomous intelligence.",
  };
}
