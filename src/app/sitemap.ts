import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://netsyraai.com";

  const staticPages = ["", "/chat", "/login", "/dashboard", "/ide", "/profile", "/history"].map(
    (path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date().toISOString().split("T")[0],
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1.0 : 0.8,
    })
  );

  return staticPages;
}