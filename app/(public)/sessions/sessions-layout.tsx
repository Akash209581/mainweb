"use client";

import { useState } from "react";
import Link from "next/link";
import { BrainCircuit, Coins, Leaf, Building2, Network, HeartPulse, Sparkles, ArrowRight, User } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/buttons/button";
import { GlassCard } from "@/components/cards/glass-card";

interface Speaker {
  name: string;
  role: string;
  organization: string;
  topic: string;
}

interface SessionsLayoutProps {
  speakers: Speaker[];
}

const TRACKS_DETAIL = [
  {
    id: "ai",
    name: "AI & Neural Systems",
    icon: BrainCircuit,
    overview: "Covers computational modeling of neural designs, deep reinforcement learning, safety benchmarks, and ethics for borderless AI deployment.",
    topics: [
      "Large Language Models & Transformers",
      "Trustworthy & Explainable AI",
      "Distributed and Edge AI Implementations",
      "Generative Neural Architectures"
    ],
    keywords: ["LLMs", "Edge AI", "Neural Networks", "Explainability"],
    sessions: [
      "Keynote Forum: Responsible AI & Policy",
      "Parallel Technical Track: Deep Learning Architectures",
      "Interactive Session: Generative Art & Compute Scales"
    ],
    speakerName: "Dr. Amina Rahman"
  },
  {
    id: "blockchain",
    name: "Blockchain & Web3",
    icon: Coins,
    overview: "Focuses on consensus scalability, zero-knowledge proofs, smart contract security auditing, decentralized finance models, and governance structures.",
    topics: [
      "Consensus Protocol Optimization",
      "Zero-Knowledge Cryptography",
      "Secure Layer-2 Rollups",
      "DAO Frameworks & Token Economics"
    ],
    keywords: ["DeFi", "ZKP", "DAO", "Layer-2 Scale"],
    sessions: [
      "Roundtable: Decentralized Infrastructures",
      "Paper Presentation: Cryptographic Proofs & Audits"
    ],
    speakerName: "Prof. Nadia Al Mansoori" // fallback or other seeded info
  },
  {
    id: "greentech",
    name: "Green Technology",
    icon: Leaf,
    overview: "Explores energy-efficient high-performance compute architectures, virtualized carbon tracking, smart grid engineering, and industrial green transitions.",
    topics: [
      "Sustainable Computing & Datacenters",
      "IoT Carbon Emission Sensing",
      "Renewable Energy Distribution Networks",
      "Circular Material Supply Chains"
    ],
    keywords: ["Green Compute", "Carbon Tracking", "Smart Grids", "CleanTech"],
    sessions: [
      "Presentation: Decarbonizing Modern Datacenters",
      "Panel: Sustainable Microgrids & Distribution"
    ],
    speakerName: "Dr. Sofia Chen"
  },
  {
    id: "smart-cities",
    name: "Smart Cities & IoT",
    icon: Building2,
    overview: "Delves into vehicle-to-everything (V2X) connectivity, edge-native sensoring networks, municipality analytics, and autonomous infrastructure coordination.",
    topics: [
      "V2X Autonomous Communications",
      "Smart Water & Grid Management",
      "Real-time Spatial Intelligence",
      "Edge-to-Cloud Coordination Systems"
    ],
    keywords: ["IoT Edge", "V2X", "Spatial AI", "Smart Infrastructure"],
    sessions: [
      "Keynote Forum: Resilient Municipal Infrastructures",
      "Parallel Track: IoT Sensoring & Vehicle Coordination"
    ],
    speakerName: "Prof. Lucas Meyer"
  },
  {
    id: "digital-transformation",
    name: "Digital Transformation",
    icon: Network,
    overview: "Addresses high-performance enterprise architectures, hybrid cloud deployment optimization, API security controls, and enterprise-scale workflow automation.",
    topics: [
      "Hybrid & Multi-Cloud Infrastructure",
      "Zero-Trust API Security",
      "Enterprise Service Meshes",
      "Workflow Process Virtualization"
    ],
    keywords: ["Zero-Trust", "API Security", "Enterprise Cloud", "SaaS Scale"],
    sessions: [
      "Strategy Session: scaling private-public cloud systems",
      "Paper Session: Multi-Tenant Architecture & Performance"
    ],
    speakerName: "Eng. Omar Al Nuaimi"
  },
  {
    id: "healthtech",
    name: "HealthTech",
    icon: HeartPulse,
    overview: "Investigates deep-learning diagnostic assistant models, bioinformatic sequence pipelines, clinical trial management systems, and telemedicine frameworks.",
    topics: [
      "Neural Bio-Imaging Diagnosis",
      "Sequencing Pipeline Execution Scales",
      "Secure Electronic Health Records (EHR)",
      "Remote Patient Telemetry Protocols"
    ],
    keywords: ["Bioinformatics", "Imaging", "Clinical AI", "EHR Tech"],
    sessions: [
      "Keynote Panel: Translating Clinical Tech",
      "Paper Session: Deep Diagnostics & Image Processing"
    ],
    speakerName: "Dr. Sofia Chen"
  }
];

export function SessionsLayout({ speakers }: SessionsLayoutProps) {
  const [activeTab, setActiveTab] = useState("ai");
  const reduceMotion = useReducedMotion();

  const activeTrack = TRACKS_DETAIL.find((t) => t.id === activeTab) ?? TRACKS_DETAIL[0];
  const Icon = activeTrack.icon;

  // Find speaker matching the track
  const trackSpeaker = speakers.find((s) => s.name === activeTrack.speakerName);

  return (
    <div className="space-y-8">
      {/* Animated Tabs Headers */}
      <div className="flex flex-wrap gap-2 border-b border-border/25 pb-6">
        {TRACKS_DETAIL.map((track) => {
          const TabIcon = track.icon;
          const isActive = track.id === activeTab;
          return (
            <button
              key={track.id}
              onClick={() => setActiveTab(track.id)}
              className={`focus-ring relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200 ${
                isActive
                  ? "bg-accent text-white shadow-soft"
                  : "bg-surface/60 hover:bg-hover/10 text-muted hover:text-foreground border border-border/30"
              }`}
            >
              <TabIcon className="size-4" />
              <span>{track.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={reduceMotion ? {} : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
        >
          {/* Main Track Details */}
          <div className="space-y-6">
            <GlassCard>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-accent/15 p-3 text-accent">
                  <Icon className="size-6" />
                </div>
                <h2 className="font-heading text-2xl font-bold text-foreground">
                  {activeTrack.name} Track
                </h2>
              </div>
              <p className="mt-4 text-sm leading-7 text-muted">
                {activeTrack.overview}
              </p>

              <h3 className="mt-6 font-heading text-md font-bold text-foreground">
                Key Topics covered
              </h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-xs text-muted">
                {activeTrack.topics.map((topic) => (
                  <li key={topic} className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-accent" />
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>

              <h3 className="mt-6 font-heading text-md font-bold text-foreground">
                Keywords & Tags
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeTrack.keywords.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border/30 bg-surface/65 px-3 py-1 text-xs text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </GlassCard>

            {/* Sessions Timeline */}
            <GlassCard>
              <h3 className="font-heading text-lg font-bold text-foreground mb-4">
                Track Schedule & Sessions
              </h3>
              <div className="space-y-4">
                {activeTrack.sessions.map((session) => (
                  <div
                    key={session}
                    className="rounded-lg border border-border/30 bg-surface/40 p-4 text-xs font-semibold text-foreground flex items-center justify-between"
                  >
                    <span>{session}</span>
                    <span className="text-[10px] text-accent uppercase tracking-wider">Confirmed</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Featured Speaker & CTA */}
          <div className="space-y-6">
            {/* Featured Speaker Card */}
            {trackSpeaker ? (
              <GlassCard className="border-accent/35 bg-gradient-to-tr from-accent/5 to-transparent">
                <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider mb-4">
                  <Sparkles className="size-4" />
                  <span>Featured Track Speaker</span>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <User className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground">
                      {trackSpeaker.name}
                    </h3>
                    <p className="text-xs text-accent font-medium mt-0.5">{trackSpeaker.role}</p>
                    <p className="text-xs text-muted mt-0.5">{trackSpeaker.organization}</p>
                    <p className="mt-4 border-t border-border/25 pt-4 text-xs text-muted leading-5 italic">
                      &ldquo;{trackSpeaker.topic}&rdquo;
                    </p>
                  </div>
                </div>
              </GlassCard>
            ) : (
              <GlassCard>
                <p className="text-xs text-muted italic">Speaker assignments pending final schedules.</p>
              </GlassCard>
            )}

            {/* Track Call to Action */}
            <GlassCard className="bg-surface/30">
              <h3 className="font-heading text-lg font-bold text-foreground">
                Contribute Your Research
              </h3>
              <p className="mt-2 text-xs leading-5 text-muted">
                Submit your abstract for review and present your tech innovations at the Dubai World Trade Centre. Accepted papers will be featured in the final proceedings.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Button asChild className="hover-lift w-full justify-center">
                  <Link href="/abstracts">
                    Submit Abstract
                    <ArrowRight className="size-4 ml-1.5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="hover-lift w-full justify-center">
                  <Link href="/registration">Register as Delegate</Link>
                </Button>
              </div>
            </GlassCard>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
