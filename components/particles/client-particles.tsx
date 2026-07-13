"use client";

import dynamic from "next/dynamic";

const LazyParticles = dynamic(
  () => import("./particle-background").then((mod) => mod.ParticleBackground),
  { ssr: false }
);

export function ClientParticles() {
  return <LazyParticles />;
}
