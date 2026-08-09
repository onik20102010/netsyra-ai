import { MetadataRoute } from "next";

export default function imageSitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://netsyraai.com";

  const entries: Array<{
    path: string;
    priority: number;
    images: string[];
  }> = [
    {
      path: "",
      priority: 1.0,
      images: [
        `${baseUrl}/logo.png`,
        `${baseUrl}/og-image.png`,
        `${baseUrl}/favicon.svg`,
        `${baseUrl}/apple-touch-icon.png`,
        `${baseUrl}/web-app-manifest-192x192.png`,
        `${baseUrl}/web-app-manifest-512x512.png`,
      ],
    },
    {
      path: "/brand",
      priority: 0.9,
      images: [
        `${baseUrl}/logo.png`,
        `${baseUrl}/favicon.svg`,
        `${baseUrl}/apple-touch-icon.png`,
        `${baseUrl}/web-app-manifest-192x192.png`,
        `${baseUrl}/web-app-manifest-512x512.png`,
      ],
    },
    {
      path: "/about",
      priority: 0.8,
      images: [`${baseUrl}/logo.png`],
    },
  ];

  return entries.map(({ path, priority, images }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date().toISOString().split("T")[0],
    changeFrequency: "monthly" as const,
    priority,
    images,
  }));
}
