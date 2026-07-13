"use client";

import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import type { ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

export function ParticleBackground() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  const options = useMemo<ISourceOptions>(
    () => ({
      fullScreen: { enable: true, zIndex: -1 },
      fpsLimit: 40,
      detectRetina: true,
      particles: {
        number: { value: 36, density: { enable: true } },
        color: { value: ["#7c5cff", "#1ed5ff", "#38bdf8"] },
        links: {
          enable: true,
          distance: 140,
          color: "#7c5cff",
          opacity: 0.18,
          width: 1
        },
        move: {
          enable: true,
          speed: 0.35,
          direction: "none",
          outModes: { default: "bounce" }
        },
        opacity: { value: { min: 0.15, max: 0.35 } },
        size: { value: { min: 1, max: 3 } }
      },
      interactivity: {
        detectsOn: "window",
        events: { resize: { enable: true } }
      }
    }),
    []
  );

  if (!ready) {
    return null;
  }

  const onLoaded = async (): Promise<void> => undefined;

  return <Particles id="icgit-particles" options={options} particlesLoaded={onLoaded} />;
}
