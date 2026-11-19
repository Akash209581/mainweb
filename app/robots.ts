import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/ICGIT/admin", "/ICGIT/profile", "/ICGIT/reviewer", "/ICGIT/checkout/", "/ICGIT/committee/manage", "/ICGIT/api/", "/ICGIT/hanvo/"]
    },
    sitemap: "https://hanscinovum.com/ICGIT/sitemap.xml"
  };
}
