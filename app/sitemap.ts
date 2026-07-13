import type { MetadataRoute } from "next";

const routes = [
  "",
  "/about",
  "/speakers",
  "/schedule",
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
    lastModified: new Date("2026-07-03"),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8
  }));
}
