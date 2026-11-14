import { MetadataRoute } from "next";
import siteMetadata from "@/lib/seo/siteMetadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/auth", "/profile", "/collections", "/statistics", "/history", "/offline"],
    },
    sitemap: `${siteMetadata.siteUrl}/sitemap.xml`,
  };
}
