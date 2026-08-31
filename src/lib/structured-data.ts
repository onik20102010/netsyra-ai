import { siteUrl } from "./seo";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "Brand"],
    name: "Netsyra AI",
    alternateName: [
      "NetsyraAI",
      "netsyraai",
      "netsyra ai",
      "netsyraai.com",
      "Netsyra",
      "Netsyra AI Assistant",
    ],
    url: siteUrl,
    slogan: "Advanced Multi-Model AI Assistant",
    description:
      "Netsyra AI is an intelligent AI orchestration platform that routes every prompt to the best AI model.",
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/logo.png`,
      width: 512,
      height: 512,
      caption: "Netsyra AI logo",
    },
    image: `${siteUrl}/logo.png`,
    sameAs: [
      "https://netsyraai.com",
      "https://netsyraai.com/brand",
      "https://netsyraai.com/about",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "supportnetsyra@gmail.com",
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
    alternateName: [
      "NetsyraAI",
      "netsyraai",
      "netsyra ai",
      "netsyraai.com",
      "Netsyra",
    ],
    url: siteUrl,
    image: `${siteUrl}/logo.png`,
    publisher: {
      "@type": "Organization",
      name: "Netsyra AI",
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
    },
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
    about: {
      "@type": "Brand",
      name: "Netsyra AI",
      alternateName: ["NetsyraAI", "netsyraai"],
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
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "120",
      bestRating: "5",
      worstRating: "1",
    },
  };
}

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Netsyra AI?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Netsyra AI (NetsyraAI) is an advanced multi-model AI assistant available at netsyraai.com. It intelligently routes every prompt to the best AI model for the task — providing real-time web search, coding assistance, deep reasoning, and autonomous intelligence in one platform.",
        },
      },
      {
        "@type": "Question",
        name: "How does Netsyra AI work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Netsyra AI uses an intelligent routing engine that analyzes your prompt and selects the optimal AI model tier. It supports multiple tiers including N Fast, N Plus, N Pro, N Code, N Live, and N AAI (Autonomous Agent Intelligence), each powered by different models like Groq, Gemini, Cerebras, and more.",
        },
      },
      {
        "@type": "Question",
        name: "Is Netsyra AI free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, Netsyra AI offers a free plan with up to 43 messages per day across all AI model tiers. Paid plans (Go Plus, Pro, and Plus Pro) are available for higher usage limits and access to premium models like Claude, GPT-5, and DeepSeek.",
        },
      },
      {
        "@type": "Question",
        name: "What makes NetsyraAI different from other AI assistants?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Netsyra AI automatically routes each prompt to the best-suited AI model, saving up to 70% on costs while delivering faster, more accurate responses. It also features real-time web search, an AI-native web IDE, a CV builder, and autonomous agent intelligence (AAI) for complex reasoning tasks.",
        },
      },
      {
        "@type": "Question",
        name: "Can Netsyra AI search the web in real-time?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, Netsyra AI has built-in real-time web search powered by Serper, Tavily, and Wikipedia. It can fetch current information, news, weather, and live data to provide up-to-date answers.",
        },
      },
      {
        "@type": "Question",
        name: "Does Netsyra AI have a coding IDE?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, Netsyra AI includes a full browser-based IDE at netsyraai.com/ide with AI coding agent, file system access, terminal, debugging, and code intelligence — all running locally in your browser.",
        },
      },
      {
        "@type": "Question",
        name: "Is Netsyra AI the same as Netstar AI?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Netsyra AI (netsyraai.com) is a unique brand and is not related to any other AI product. The correct spelling is Netsyra AI or NetsyraAI. The official website is netsyraai.com.",
        },
      },
      {
        "@type": "Question",
        name: "How do you spell NetsyraAI?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The brand name is spelled Netsyra AI (two words) or NetsyraAI (one word). The domain is netsyraai.com. It is not Netstar, Netsira, or NetSyra — the correct spelling is Netsyra AI.",
        },
      },
    ],
  };
}

export function breadcrumbJsonLd({
  path,
  title,
}: {
  path: string;
  title: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: title,
        item: `${siteUrl}${path}`,
      },
    ],
  };
}
