import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/dashboard",
          "/history",
          "/profile",
          "/usage",
          "/a/",
          "/join/",
          "/chat",
          "/login",
          "/register",
          "/forgot-password",
          "/term",
          "/subscription",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/dashboard",
          "/history",
          "/profile",
          "/usage",
          "/a/",
          "/join/",
          "/chat",
          "/login",
          "/register",
          "/forgot-password",
          "/term",
          "/subscription",
        ],
      },
    ],
    host: "https://netsyraai.com",
    sitemap: ["https://netsyraai.com/sitemap.xml", "https://netsyraai.com/image-sitemap.xml"],
  };
}