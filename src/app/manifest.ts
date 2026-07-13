import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Netsyra AI",
    short_name: "Netsyra",
    description:
      "Netsyra AI routes every prompt to the best AI model with real-time web search, coding, and autonomous intelligence.",
    start_url: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#6366f1",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
