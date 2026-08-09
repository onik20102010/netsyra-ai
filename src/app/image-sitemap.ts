import { MetadataRoute } from "next";

export default function imageSitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://netsyraai.com";

  const images: Array<{
    path: string;
    imageUrl: string;
    title: string;
    caption: string;
    license: string;
  }> = [
    {
      path: "",
      imageUrl: `${baseUrl}/logo.png`,
      title: "Netsyra AI Logo",
      caption: "Official Netsyra AI logo — advanced multi-model AI assistant",
      license: "https://netsyraai.com/legal",
    },
    {
      path: "/brand",
      imageUrl: `${baseUrl}/logo.png`,
      title: "Netsyra AI Logo",
      caption: "Official Netsyra AI logo — open source brand asset",
      license: "https://netsyraai.com/legal",
    },
    {
      path: "",
      imageUrl: `${baseUrl}/og-image.png`,
      title: "Netsyra AI — Advanced Multi-Model AI Assistant",
      caption: "Netsyra AI social share image",
      license: "https://netsyraai.com/legal",
    },
    {
      path: "",
      imageUrl: `${baseUrl}/favicon.svg`,
      title: "Netsyra AI Favicon",
      caption: "Netsyra AI favicon SVG",
      license: "https://netsyraai.com/legal",
    },
    {
      path: "",
      imageUrl: `${baseUrl}/apple-touch-icon.png`,
      title: "Netsyra AI Apple Touch Icon",
      caption: "Netsyra AI Apple touch icon",
      license: "https://netsyraai.com/legal",
    },
    {
      path: "",
      imageUrl: `${baseUrl}/web-app-manifest-192x192.png`,
      title: "Netsyra AI Icon 192px",
      caption: "Netsyra AI web app manifest icon 192x192",
      license: "https://netsyraai.com/legal",
    },
    {
      path: "",
      imageUrl: `${baseUrl}/web-app-manifest-512x512.png`,
      title: "Netsyra AI Icon 512px",
      caption: "Netsyra AI web app manifest icon 512x512",
      license: "https://netsyraai.com/legal",
    },
  ];

  return images.map(({ path, imageUrl, title, caption, license }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date().toISOString().split("T")[0],
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1.0 : 0.8,
    images: [
      {
        url: imageUrl,
        title,
        caption,
        license,
      },
    ],
  }));
}
