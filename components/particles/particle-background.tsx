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
      fpsLimit: 25,
      detectRetina: false,
      particles: {
        number: { value: 16, density: { enable: false } },
        color: { value: ["#7c5cff", "#1ed5ff", "#38bdf8"] },
        links: {
          enable: true,
          distance: 120,
          color: "#7c5cff",
          opacity: 0.12,
          width: 1
        },
        move: {
          enable: true,
          speed: 0.3,
          direction: "none",
          outModes: { default: "bounce" }
        },
        opacity: { value: { min: 0.12, max: 0.28 } },
        size: { value: { min: 1, max: 2.5 } }
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
