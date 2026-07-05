// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: {
    default: "Netsyra AI – Advanced AI Assistant",
    template: "%s | Netsyra AI",
  },
  description:
    "Netsyra is a production‑grade AI assistant with real‑time web search, coding, and autonomous intelligence. Built for speed and accuracy.",
  keywords: ["AI", "chatbot", "Netsyra", "artificial intelligence", "web search", "LLM"],
  authors: [{ name: "Netsyra" }],
  openGraph: {
    title: "Netsyra AI",
    description: "Advanced AI assistant with real‑time web search and autonomous intelligence.",
    url: "https://netsyraai.com",
    siteName: "Netsyra AI",
    images: [{ url: "/logo.png", width: 512, height: 512 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Netsyra AI",
    description: "Advanced AI assistant with real‑time web search.",
    images: ["/logo.png"],
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
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-black text-white antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}