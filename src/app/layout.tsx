// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import JsonLd from "@/components/JsonLd";
import {
  organizationJsonLd,
  websiteJsonLd,
  softwareApplicationJsonLd,
  faqJsonLd,
} from "@/lib/structured-data";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
  ],
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://netsyraai.com"),
  title: {
    default: "Netsyra AI – Advanced Multi-Model AI Assistant | netsyraai.com",
    template: "%s | Netsyra AI",
  },
  description:
    "Netsyra AI is an intelligent AI orchestration layer that routes every prompt to the best AI model. Get real-time web search, coding, deep reasoning, and up to 70% cost savings.",
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
    "AI assistant",
    "AI orchestration",
    "multi-model AI",
    "LLM routing",
    "AI chatbot",
    "real-time web search",
    "AI coding assistant",
    "autonomous AI",
  ],
  authors: [{ name: "Netsyra AI", url: "https://netsyraai.com" }],
  creator: "Netsyra AI",
  publisher: "Netsyra AI",
  robots: {
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
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "Netsyra AI",
    description:
      "Netsyra AI routes every prompt to the best AI model. Real-time web search, coding, reasoning, and up to 70% cost savings.",
    url: "https://netsyraai.com",
    siteName: "Netsyra AI",
    images: [
      {
        url: "https://netsyraai.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Netsyra AI – Advanced Multi-Model AI Assistant",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Netsyra AI",
    description:
      "Netsyra AI routes every prompt to the best AI model with real-time web search and autonomous intelligence.",
    images: ["https://netsyraai.com/og-image.png"],
  },
  verification: {
    google: "GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE",
    other: {
      "msvalidate.01": "BING_VERIFICATION_CODE",
    },
  },
  other: {
    "msapplication-TileImage": "/web-app-manifest-192x192.png",
    "msapplication-TileColor": "#6366f1",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="
            default-src 'self';
            script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.paddle.com blob:;
            style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://sandbox-cdn.paddle.com https://cdn.paddle.com;
            connect-src 'self' https://cdn.jsdelivr.net https://*.netsyraai.com https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://sandbox-api.paddle.com https://api.paddle.com https://cdn.paddle.com;
            frame-src 'self' https://sandbox-checkout.paddle.com https://checkout.paddle.com https://sandbox-buy.paddle.com https://buy.paddle.com https://sandbox-checkout-service.paddle.com;
            img-src 'self' data: https:;
            font-src 'self' data: https://cdn.jsdelivr.net https://cdn.paddle.com;
          "
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-black text-white antialiased`}
      >
        <JsonLd
          data={[
            organizationJsonLd(),
            websiteJsonLd(),
            softwareApplicationJsonLd(),
            faqJsonLd(),
          ]}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}