"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface CountdownUnit {
  label: string;
  value: number;
}

const LABELS = ["Days", "Hours", "Minutes", "Seconds"] as const;

// Always returns zeroed units — safe for SSR (no Date.now on server)
function zeroUnits(): CountdownUnit[] {
  return LABELS.map((label) => ({ label, value: 0 }));
}

function getCountdownUnits(targetDate?: string): CountdownUnit[] {
  const target = new Date(targetDate || "2026-12-08T09:00:00Z").getTime();
  const diff = Math.max(target - Date.now(), 0);
  const d = 864e5, h = 36e5, m = 6e4;
  return [
    { label: "Days",    value: Math.floor(diff / d) },
    { label: "Hours",   value: Math.floor((diff % d) / h) },
    { label: "Minutes", value: Math.floor((diff % h) / m) },
    { label: "Seconds", value: Math.floor((diff % m) / 1000) }
  ];
}

export function CountdownCard({ targetDate }: { targetDate?: string }) {
  // Start with zeros so SSR and initial client HTML match exactly
  const [units, setUnits] = useState<CountdownUnit[]>(zeroUnits);
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Set real values immediately on mount, then tick every second
    setUnits(getCountdownUnits(targetDate));
    setMounted(true);
    const id = window.setInterval(() => setUnits(getCountdownUnits(targetDate)), 1000);
    return () => window.clearInterval(id);
  }, [targetDate]);

  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl p-2 sm:grid-cols-4">
      {units.map((unit) => (
        <div
          key={unit.label}
          className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5 text-center"
        >
          <div className="h-12 overflow-hidden relative flex items-center justify-center">
            {!mounted || shouldReduceMotion ? (
              <span className="font-heading text-3xl font-black text-white sm:text-4xl tabular-nums">
                {unit.value.toString().padStart(2, "0")}
              </span>
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={unit.value}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="font-heading text-3xl font-black text-white sm:text-4xl tabular-nums block"
                >
                  {unit.value.toString().padStart(2, "0")}
                </motion.span>
              </AnimatePresence>
            )}
          </div>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
            {unit.label}
          </p>
        </div>
      ))}
    </div>
  );
}
