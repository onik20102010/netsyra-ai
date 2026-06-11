import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "Netsyra AI – The Intelligent AI Orchestration Platform",
  description:
    "Automatically route every prompt to the smartest and most cost-efficient AI model.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="icon"
          type="image/svg+xml"
          href={`data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='192' height='192' viewBox='0 0 192 192'><defs><linearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%23111827'/><stop offset='100%25' stop-color='%23312e81'/></linearGradient></defs><circle cx='96' cy='96' r='96' fill='url(%23bg)' stroke='%234f46e5' stroke-width='4'/><g transform='translate(60,40) scale(3.2)'><polygon points='13,2 3,14 12,14 11,22 21,10 12,10' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></g></svg>`)}`}
        />
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