import type { Metadata } from "next";
import { BrochureLayout } from "./brochure-layout";

export const metadata: Metadata = {
  title: "Brochure & Author Guidelines",
  description: "Download the ICGIT 2026 conference brochure and review author guidelines."
};

export default function BrochurePage() {
  return <BrochureLayout />;
}
