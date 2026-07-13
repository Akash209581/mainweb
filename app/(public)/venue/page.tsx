"use client";

import { useState } from "react";
import { MapPin, Plane, Thermometer, CheckSquare, Compass } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/buttons/button";
import { GlassCard } from "@/components/cards/glass-card";
import { PageHeader } from "@/components/common/page-header";
import { Section } from "@/components/common/section";

const GALLERY_IMGS = [
  { title: "Dubai World Trade Centre Entrance", desc: "Main convention entrance direct from Metro." },
  { title: "Grand Ballroom Hall", desc: "Primary venue for the opening keynote panels." },
  { title: "Technical Track Room", desc: "Sound-isolated breakout room for research papers." },
  { title: "Exhibition Innovation Hub", desc: "Corporate booths, demo areas, and coffee bars." }
];

const HOTELS = [
  { name: "Novotel World Trade Centre", distance: "Adjacent (2 min walk)", budget: "$$$", note: "Direct connection corridor to DWTC halls." },
  { name: "Ibis World Trade Centre", distance: "Adjacent (3 min walk)", budget: "$$", note: "Value pricing, highly recommended for student delegates." },
  { name: "The Ritz-Carlton, DIFC", distance: "5 min drive / 1 metro stop", budget: "$$$$", note: "Premium luxury near the financial center." }
];

export default function VenuePage() {
  const [activeTab, setActiveTab] = useState("venue");
  const [activeImg, setActiveImg] = useState(0);
  const reduceMotion = useReducedMotion();

  return (
    <>
      <PageHeader
        eyebrow="Venue"
        title="Dubai World Trade Centre"
        description="Explore the location coordinates, travel connections, hotel partnerships, and tourist guides for ICGIT 2026."
      />
      <Section className="pt-0">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-border/25 pb-6 mb-8">
          <button
            onClick={() => setActiveTab("venue")}
            className={`focus-ring rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200 ${
              activeTab === "venue"
                ? "bg-accent text-white shadow-soft"
                : "bg-surface/60 hover:bg-hover/10 text-muted border border-border/30"
            }`}
          >
            DWTC & Gallery
          </button>
          <button
            onClick={() => setActiveTab("travel")}
            className={`focus-ring rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200 ${
              activeTab === "travel"
                ? "bg-accent text-white shadow-soft"
                : "bg-surface/60 hover:bg-hover/10 text-muted border border-border/30"
            }`}
          >
            Travel & Visa Guide
          </button>
          <button
            onClick={() => setActiveTab("hotels")}
            className={`focus-ring rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200 ${
              activeTab === "hotels"
                ? "bg-accent text-white shadow-soft"
                : "bg-surface/60 hover:bg-hover/10 text-muted border border-border/30"
            }`}
          >
            Hotel Partners
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "venue" && (
            <motion.div
              key="venue"
              initial={reduceMotion ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
            >
              {/* Left Column: Gallery & Description */}
              <div className="space-y-6">
                <GlassCard className="p-4 overflow-hidden">
                  <div className="relative aspect-video rounded-lg bg-surface/40 flex items-center justify-center border border-border/30 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent z-10" />
                    
                    {/* Simulated Gallery Render */}
                    <div className="absolute inset-0 flex flex-col justify-between p-6 z-20">
                      <span className="text-[10px] font-mono text-accent uppercase tracking-wider">DWTC Slide {activeImg + 1}</span>
                      <div>
                        <h4 className="font-heading text-lg font-bold text-foreground">{GALLERY_IMGS[activeImg].title}</h4>
                        <p className="text-xs text-muted mt-1">{GALLERY_IMGS[activeImg].desc}</p>
                      </div>
                    </div>

                    {/* Decorative grid lines */}
                    <div className="absolute inset-0 border border-dashed border-border/10 m-10 pointer-events-none" />
                  </div>
                  <div className="grid grid-cols-4 gap-2.5 mt-3">
                    {GALLERY_IMGS.map((img, idx) => (
                      <button
                        key={img.title}
                        onClick={() => setActiveImg(idx)}
                        className={`aspect-video rounded border text-[10px] font-semibold flex items-center justify-center p-1 text-center transition ${
                          activeImg === idx
                            ? "border-accent bg-accent/10 text-accent font-bold"
                            : "border-border/30 bg-surface/50 text-muted hover:border-border/60"
                        }`}
                      >
                        Slide {idx + 1}
                      </button>
                    ))}
                  </div>
                </GlassCard>

                <GlassCard>
                  <h3 className="font-heading text-lg font-bold text-foreground">Dubai World Trade Centre (DWTC)</h3>
                  <p className="mt-3 text-xs leading-6 text-muted">
                    Located along Sheikh Zayed Road, DWTC has stood as the epicenter of Middle East business exchange since 1979. It features state-of-the-art acoustics, digital connectivity, hybrid broadcast arrays, and flexible convention setups, catering to ICGIT 2026&apos;s concurrent track sessions.
                  </p>
                </GlassCard>
              </div>

              {/* Right Column: High-tech Map Placeholder */}
              <div className="space-y-6">
                <GlassCard className="border-accent/35 bg-gradient-to-tr from-accent/5 to-transparent relative overflow-hidden min-h-[300px] flex flex-col justify-between p-6">
                  {/* Grid Graphic */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,92,255,0.08),transparent)] pointer-events-none" />
                  
                  <div className="flex justify-between items-start z-10">
                    <div className="flex items-center gap-2">
                      <MapPin className="size-5 text-accent animate-bounce" />
                      <div>
                        <h4 className="font-heading text-sm font-bold text-foreground">Coordinates</h4>
                        <span className="text-[10px] text-muted font-mono">25.2285° N, 55.2891° E</span>
                      </div>
                    </div>
                    <span className="rounded bg-success/15 px-2 py-0.5 border border-success/30 text-[9px] font-bold text-success uppercase tracking-wider">Active</span>
                  </div>

                  {/* Stylized UI map layout */}
                  <div className="my-8 border border-dashed border-border/40 rounded-lg p-5 bg-surface/20 relative z-10">
                    <div className="flex items-center justify-between text-xs text-muted mb-2">
                      <span>SHEIKH ZAYED RD</span>
                      <span className="font-mono text-[10px]">L1 METRO</span>
                    </div>
                    <div className="h-1 bg-border/20 rounded-full w-full relative mb-4">
                      <div className="absolute left-1/3 top-0 h-1 w-8 bg-accent rounded-full animate-pulse" />
                    </div>
                    <p className="text-[10px] text-muted leading-relaxed font-mono">
                      DWTC Metro Station, Red Line. Directly connects to Terminal 1 & 3 of Dubai International Airport (DXB).
                    </p>
                  </div>

                  <div className="z-10 flex justify-between items-end border-t border-border/20 pt-4">
                    <span className="text-[10px] text-muted uppercase font-mono">Dubai World Trade Centre</span>
                    <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">Open in Google Maps</span>
                  </div>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {activeTab === "travel" && (
            <motion.div
              key="travel"
              initial={reduceMotion ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="grid gap-6 md:grid-cols-3"
            >
              <GlassCard>
                <div className="flex items-center gap-2 text-foreground font-bold font-heading text-lg mb-4">
                  <Plane className="size-5 text-accent animate-pulse" />
                  <span>Airport & Transit</span>
                </div>
                <div className="space-y-3 text-xs leading-5 text-muted">
                  <p>
                    <strong>Dubai International Airport (DXB):</strong> Located only 12 minutes from the venue. Directly linked via the Metro Red Line (Terminal 1/3 to DWTC Station).
                  </p>
                  <p>
                    <strong>Al Maktoum Airport (DWC):</strong> Located approximately 45 minutes south of the city; best accessed via taxi or airport shuttles.
                  </p>
                </div>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center gap-2 text-foreground font-bold font-heading text-lg mb-4">
                  <Compass className="size-5 text-accent" />
                  <span>Visa & Entry Rules</span>
                </div>
                <div className="space-y-3 text-xs leading-5 text-muted">
                  <p>
                    <strong>GCC Citizens:</strong> Do not require a visa to enter the United Arab Emirates.
                  </p>
                  <p>
                    <strong>Visa on Arrival:</strong> Available for citizens of 70+ countries including EU nations, USA, UK, Canada, Australia, and Japan.
                  </p>
                  <p>
                    <strong>Pre-Arranged Visa:</strong> Other passport holders must arrange a transit or tourist visa in advance. Email our secretariat for an official invitation letter.
                  </p>
                </div>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center gap-2 text-foreground font-bold font-heading text-lg mb-4">
                  <Thermometer className="size-5 text-accent" />
                  <span>Climate & Tourism</span>
                </div>
                <div className="space-y-3 text-xs leading-5 text-muted">
                  <p>
                    <strong>Weather:</strong> December is the absolute premium month in Dubai. Average daily highs are 26°C (79°F) and evening lows reach 16°C (61°F). Very low humidity and minimal rainfall.
                  </p>
                  <p>
                    <strong>Tourism:</strong> Major highlights near the venue include the Burj Khalifa, the Museum of the Future, and the Dubai Frame.
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === "hotels" && (
            <motion.div
              key="hotels"
              initial={reduceMotion ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="grid gap-5 md:grid-cols-3">
                {HOTELS.map((hotel) => (
                  <GlassCard key={hotel.name} className="flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="font-heading text-lg font-bold text-foreground">{hotel.name}</h4>
                        <span className="rounded bg-accent/15 px-2 py-0.5 border border-accent/25 text-[10px] text-accent font-bold">{hotel.budget}</span>
                      </div>
                      <p className="mt-2 text-xs text-accent font-medium flex items-center gap-1">
                        <MapPin className="size-3.5" /> {hotel.distance}
                      </p>
                      <p className="mt-4 text-xs leading-relaxed text-muted">{hotel.note}</p>
                    </div>
                    <Button variant="outline" size="sm" className="mt-6 hover-lift justify-center">Book Partner Rate</Button>
                  </GlassCard>
                ))}
              </div>

              <GlassCard className="flex items-center gap-4 bg-surface/20 border-border/20">
                <CheckSquare className="size-8 text-accent shrink-0" />
                <div>
                  <h4 className="font-heading text-sm font-bold text-foreground">Important Note on Bookings</h4>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    Partner rates are only valid for registered ICGIT 2026 delegates. Ensure you obtain your registration badge confirmation voucher code before booking directly with hotel portals.
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </Section>
    </>
  );
}
