import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://netsyraai.com";

  const routes: Array<{
    path: string;
    priority: number;
    freq: MetadataRoute.Sitemap[number]["changeFrequency"];
  }> = [
    { path: "", priority: 1.0, freq: "weekly" },
    { path: "/about", priority: 0.9, freq: "weekly" },
    { path: "/goal", priority: 0.9, freq: "weekly" },
    { path: "/brand", priority: 0.9, freq: "monthly" },
    { path: "/pricing", priority: 0.8, freq: "weekly" },
    { path: "/terms", priority: 0.7, freq: "monthly" },
    { path: "/privacy", priority: 0.7, freq: "monthly" },
    { path: "/legal", priority: 0.6, freq: "monthly" },
  ];

  return routes.map(({ path, priority, freq }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date().toISOString().split("T")[0],
    changeFrequency: freq,
    priority,
  }));
}