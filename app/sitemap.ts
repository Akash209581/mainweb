import type { MetadataRoute } from "next";

const routes = [
  "",
  "/about",
  "/speakers",
  "/schedule",
  "/sessions",
  "/committee",
  "/sponsors",
  "/venue",
  "/registration",
  "/abstracts",
  "/brochure",
  "/contact",
  "/privacy",
  "/terms"
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `https://hanscinovum.com/ICGIT${route}`,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8
  }));
}
