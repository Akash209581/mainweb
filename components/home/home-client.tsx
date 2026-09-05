"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  Building2,
  CalendarDays,
  Coins,
  Leaf,
  MapPin,
  Presentation,
  Mail,
  User,
  HelpCircle,
  Globe,
  Wifi,
  Heart
} from "lucide-react";
import { Button } from "@/components/buttons/button";
import { CountdownCard } from "@/components/countdown/countdown-card";
import { submitContactAction } from "@/actions/contact.actions";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface SpeakerInfo {
  id: string;
  name: string;
  role: string;
  topic: string;
  bio: string | null;
  imageAssetId: string | null;
  organizationName: string;
}

interface TrackInfo {
  id: string;
  name: string;
  description: string | null;
}

interface HomeClientProps {
  speakers: SpeakerInfo[];
  tracks: TrackInfo[];
  customContent?: Array<{
    id: string;
    name: string;
    visible?: boolean;
    fields: Record<string, string>;
  }>;
}

/* ------------------------------------------------------------------ */
/*  Static data                                                         */
/* ------------------------------------------------------------------ */

const TRACK_ICONS = [
  BrainCircuit,
  Coins,
  Leaf,
  Building2,
  Wifi,
  Heart
];

const BROCHURE_TRACKS = [
  { id: "t1", name: "AI & Neural Systems", description: "Deep learning architectures, large language models, neural interface research, and autonomous intelligence systems." },
  { id: "t2", name: "Blockchain & Web3", description: "Decentralised finance, smart contracts, NFT ecosystems, and the next evolution of the open web." },
  { id: "t3", name: "Green Technology", description: "Sustainable engineering, carbon-neutral computing, renewable energy integration, and circular economy models." },
  { id: "t4", name: "Smart Cities & IoT", description: "Urban intelligence platforms, sensor mesh networks, connected infrastructure, and civic data analytics." },
  { id: "t5", name: "Digital Transformation", description: "Enterprise modernisation, cloud-native strategies, platform engineering, and workforce upskilling models." },
  { id: "t6", name: "HealthTech", description: "Precision medicine, AI diagnostics, wearable biosensors, and regulatory frameworks for medical innovation." }
];

const REGISTRATION_FEES = [
  { category: "Early Bird Delegate", price: "$450 USD", highlight: true },
  { category: "Regular Onsite Delegate", price: "$550 USD", highlight: false },
  { category: "Student Delegate", price: "$250 USD", highlight: false },
  { category: "Virtual Delegate", price: "$150 USD", highlight: false }
];

const IMPORTANT_DATES = [
  { title: "Abstract Submission Opens", date: "July 15, 2026", status: "Open", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  { title: "Abstract Submission Deadline", date: "October 1, 2026", status: "Upcoming", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
  { title: "Acceptance Notification", date: "November 1, 2026", status: "Upcoming", color: "bg-white/5 text-white/50 border-white/10" },
  { title: "Camera-Ready Deadline", date: "November 15, 2026", status: "Upcoming", color: "bg-white/5 text-white/50 border-white/10" },
  { title: "Registration Deadline", date: "December 1, 2026", status: "Upcoming", color: "bg-white/5 text-white/50 border-white/10" },
  { title: "Conference Dates", date: "December 8\u201310, 2026", status: "Event", color: "bg-violet-500/10 text-violet-400 border-violet-500/30" }
];

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function HomeClient({ speakers, tracks, customContent }: HomeClientProps) {
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeTracks = tracks.length > 0 ? tracks : BROCHURE_TRACKS;

  function handleContactSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;
    startTransition(async () => {
      try {
        const res = await submitContactAction({ ok: false, message: "" }, formData);
        setFeedback({ ok: res.ok, msg: res.message });
        if (res.ok) form.reset();
      } catch {
        setFeedback({ ok: false, msg: "Failed to submit. Please try again." });
      }
    });
  }

  interface SectionItem {
    id: string;
    name: string;
    visible?: boolean;
    fields: Record<string, string>;
  }

  // Define default order and layouts of the sections
  const defaultSections: SectionItem[] = [
    { id: "hero", name: "Hero Section", visible: true, fields: {} },
    { id: "countdown", name: "Countdown Section", visible: true, fields: {} },
    { id: "about", name: "About Section", visible: true, fields: {} },
    { id: "sessions", name: "Conference Tracks", visible: true, fields: {} },
    { id: "speakers", name: "Featured Speakers", visible: true, fields: {} },
    { id: "venue", name: "Venue Section", visible: true, fields: {} },
    { id: "contact", name: "Contact Secretariat", visible: true, fields: {} }
  ];

  // Reorder and align dynamic sections with absolute fallback
  let sectionsList: SectionItem[] = [...defaultSections];
  if (customContent && Array.isArray(customContent) && customContent.length > 0) {
    const customIds = new Set(customContent.map((s) => s.id));
    const orderedCustom = customContent.filter((s) => defaultSections.some((ds) => ds.id === s.id));
    const missing = defaultSections.filter((ds) => !customIds.has(ds.id));
    sectionsList = [...orderedCustom, ...missing];
  }

  /* ------------------------------------------------------------------ */
  /*  Section Renderers                                                  */
  /* ------------------------------------------------------------------ */

  function renderHero(fields: Record<string, string>) {
    const badge = fields.badge || "DECEMBER 8–10, 2026  •  DUBAI, UAE";
    const title = fields.title || "8th International Conference on";
    const titleColor = fields.titleColor || "Global Innovation & Technology";
    const description = fields.description || "Bringing together 2,000+ visionaries, researchers, and industry leaders from 80+ countries to shape the future of global innovation and emerging technologies.";
    const ctaText1 = fields.ctaText1 || "Submit Abstract";
    const ctaLink1 = fields.ctaLink1 || "/abstracts";
    const ctaText2 = fields.ctaText2 || "Register Now";
    const ctaLink2 = fields.ctaLink2 || "/registration";
    const heroImage = fields.heroImage || "/about_banner.png";

    return (
      <section id="home" key="hero" className="home-hero flex items-center pt-20">
        <div className="container relative z-10 grid items-start gap-12 py-0 lg:grid-cols-[0.92fr_1.08fr] lg:py-0">
          <div className="max-w-2xl">
            <span className="mb-7 inline-flex w-fit items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-400">
              <CalendarDays className="mr-2 size-3.5 text-amber-600" /> {badge}
            </span>
            <h1 className="font-heading text-5xl font-bold leading-[0.98] text-white sm:text-6xl lg:text-[4.25rem]">
              {title}
              <span className="mt-2 block text-violet-400">{titleColor}</span>
            </h1>
            <div className="my-7 h-px w-20 bg-amber-500" />
            <p className="max-w-xl text-sm leading-7 text-white/60 sm:text-base">{description}</p>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-white/60">
              <span className="flex items-center gap-2"><MapPin className="size-4 text-amber-600" /> Dubai World Trade Centre, UAE</span>
              <span className="flex items-center gap-2"><CalendarDays className="size-4 text-amber-600" /> December 8–10, 2026</span>
              <span className="flex items-center gap-2"><Globe className="size-4 text-amber-600" /> Hybrid Event</span>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-violet-600 font-bold text-white shadow-lg shadow-violet-600/30">
                <Link href={ctaLink2}>{ctaText2} <ArrowRight className="ml-2 size-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border/70 bg-white/70 font-semibold text-foreground hover:bg-white">
                <Link href={ctaLink1}><Presentation className="mr-2 size-4" /> {ctaText1}</Link>
              </Button>
            </div>
          </div>

          <div className="relative lg:-mr-16">
            <div className="hero-art relative overflow-hidden border-l-8 border-amber-500/70 bg-violet-950">
              <img src={`/ICGIT${heroImage}`} alt="ICGIT 2026 conference experience" className="aspect-[1.2/0.86] w-full object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-950/35 via-transparent to-transparent" />
            </div>
            <div className="home-stat-bar absolute -bottom-8 left-8 right-4 grid grid-cols-2 gap-px rounded-xl bg-violet-950 p-4 text-white sm:grid-cols-4 sm:p-5">
              {[["2,000+", "Attendees"], ["80+", "Countries"], ["120+", "Speakers"], ["200+", "Organizations"]].map(([value, label]) => (
                <div key={label} className="border-white/20 px-3 py-2 text-center sm:border-r last:border-0">
                  <p className="font-heading text-2xl font-bold text-white">{value}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-white/60">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderCountdown(fields: Record<string, string>) {
    const badge = fields.badge || "\u23F3 Conference Begins In";
    const title = fields.title || "Don't Miss This Global Event";
    const targetDate = fields.targetDate || "2026-12-08T09:00:00Z";

    // Split title to style the last words or highlight "Global Event"
    const highlightIndex = title.toLowerCase().lastIndexOf("global event");
    let mainTitle = title;
    let highlightPart = "";
    if (highlightIndex !== -1) {
      mainTitle = title.substring(0, highlightIndex);
      highlightPart = title.substring(highlightIndex);
    }

    return (
      <section key="countdown" className="py-10">
        <div className="container">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 text-center space-y-6">
            <span className="inline-flex rounded-full bg-violet-500/10 border border-violet-500/20 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-400">
              {badge}
            </span>
            <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-white">
              {mainTitle} <span className="text-violet-400">{highlightPart}</span>
            </h2>
            <div className="max-w-3xl mx-auto">
              <CountdownCard targetDate={targetDate} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderAbout(fields: Record<string, string>) {
    const badge = fields.badge || "\uD83D\uDE80 About the Conference";
    const title = fields.title || "Shaping the Future Together";
    const paragraph1 = fields.paragraph1 || "ICGIT 2026 is the world's most anticipated gathering of global innovators, technology pioneers, academic researchers, and business leaders. Now in its 8th edition, this conference serves as a global platform for exchange of cutting-edge ideas across AI, blockchain, green technology, digital transformation, and sustainable innovation.";
    const paragraph2 = fields.paragraph2 || "Hosted in Dubai \u2014 the world's innovation hub \u2014 ICGIT 2026 features 120+ expert speakers, 40+ interactive sessions, live demos, startup showcases, and exclusive networking dinners bringing together 2,000+ delegates from 80+ countries.";
    const aboutImage = fields.aboutImage || "/about_banner.png";

    // Split highlight for styling "Future Together"
    const highlightIndex = title.toLowerCase().lastIndexOf("future together");
    let mainTitle = title;
    let highlightPart = "";
    if (highlightIndex !== -1) {
      mainTitle = title.substring(0, highlightIndex);
      highlightPart = title.substring(highlightIndex);
    }

    return (
      <section id="brochure" key="about" className="py-10">
        <div className="container grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start">
          {/* Left — about */}
          <div className="space-y-6">
            <span className="inline-flex rounded-full bg-violet-500/10 border border-violet-500/20 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-400">
              {badge}
            </span>
            <h2 className="font-heading text-3xl font-extrabold text-white leading-tight">
              {mainTitle} <span className="text-violet-400">{highlightPart}</span>
            </h2>
            <p className="text-sm leading-relaxed text-white/60">
              {paragraph1}
            </p>
            <p className="text-sm leading-relaxed text-white/60">
              {paragraph2}
            </p>
            <div className="rounded-xl overflow-hidden border border-white/10 relative h-52">
              <img
                src={`/ICGIT${aboutImage}`}
                alt="Conference venue"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>

          {/* Right — dates + fees */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 space-y-6">
            <h3 className="font-heading text-lg font-bold text-white">
              &#128197; Important Dates
            </h3>

            <div className="space-y-2.5">
              {IMPORTANT_DATES.map((d, i) => (
                <div key={i} className="flex justify-between items-center bg-white/5 border border-white/10 px-3 py-2.5 rounded-lg text-xs">
                  <div>
                    <p className="font-bold text-white">{d.title}</p>
                    <p className="text-white/40 text-[10px] mt-0.5">{d.date}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${d.color}`}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>

            <Button asChild size="lg" className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold border-0">
              <Link href="/abstracts">Submit Your Abstract &rarr;</Link>
            </Button>

            {/* Registration fees */}
            <div className="pt-2 border-t border-white/10">
              <h4 className="font-heading text-sm font-bold text-white mb-3">
                &#128179; Registration Fees
              </h4>
              <div className="space-y-2">
                {REGISTRATION_FEES.map((f) => (
                  <div
                    key={f.category}
                    className={`flex justify-between items-center px-3 py-2 rounded-lg text-xs border ${
                      f.highlight
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        : "bg-white/5 border-white/10 text-white"
                    }`}
                  >
                    <span className="font-semibold">{f.category}</span>
                    <span className={`font-black text-sm ${f.highlight ? "text-amber-400" : "text-white"}`}>{f.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderSessions(fields: Record<string, string>) {
    const badge = fields.badge || "\uD83E\uDDE9 Conference Tracks";
    const title = fields.title || "Featured Session Tracks";
    const description = fields.description || "6 specialized tracks covering the most critical areas of global innovation and emerging technologies.";

    const highlightIndex = title.toLowerCase().lastIndexOf("session tracks");
    let mainTitle = title;
    let highlightPart = "";
    if (highlightIndex !== -1) {
      mainTitle = title.substring(0, highlightIndex);
      highlightPart = title.substring(highlightIndex);
    }

    return (
      <section id="sessions" key="sessions" className="py-10">
        <div className="container space-y-10">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="inline-flex rounded-full bg-violet-500/10 border border-violet-500/20 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-400">
              {badge}
            </span>
            <h2 className="font-heading text-3xl font-extrabold text-white">
              {mainTitle} <span className="text-violet-400">{highlightPart}</span>
            </h2>
            <p className="text-sm text-white/50">
              {description}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {activeTracks.slice(0, 6).map((t, idx) => {
              const Icon = TRACK_ICONS[idx % TRACK_ICONS.length];
              return (
                <div
                  key={t.id}
                  className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 hover:border-violet-500/40 hover:bg-white/8 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="rounded-lg bg-violet-500/10 p-2.5 text-violet-400 w-fit mb-4 group-hover:bg-violet-500/20 transition">
                      <Icon className="size-5" />
                    </div>
                    <h4 className="font-heading text-sm font-bold text-white mb-2">{t.name}</h4>
                    <p className="text-xs text-white/50 leading-relaxed">
                      {t.description ?? "Deep dive analysis into technical frameworks, research methodologies, and industrial implementation challenges."}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
                    <Link href="/sessions" className="text-[10px] text-violet-400 font-bold uppercase tracking-wider hover:text-white transition">
                      Explore sessions &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  function renderSpeakers(fields: Record<string, string>) {
    const badge = fields.badge || "\uD83C\uDF99 Featured Speakers";
    const title = fields.title || "World-Class Keynote Speakers";
    const description = fields.description || "Meet the academic visionaries and industrial leaders delivering keynote addresses at ICGIT 2026.";

    const highlightIndex = title.toLowerCase().lastIndexOf("keynote speakers");
    let mainTitle = title;
    let highlightPart = "";
    if (highlightIndex !== -1) {
      mainTitle = title.substring(0, highlightIndex);
      highlightPart = title.substring(highlightIndex);
    }

    return (
      <section id="speakers" key="speakers" className="py-10">
        <div className="container space-y-10">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="inline-flex rounded-full bg-violet-500/10 border border-violet-500/20 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-400">
              {badge}
            </span>
            <h2 className="font-heading text-3xl font-extrabold text-white">
              {mainTitle} <span className="text-violet-400">{highlightPart}</span>
            </h2>
            <p className="text-sm text-white/50">
              {description}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {speakers.length === 0 ? (
              <div className="col-span-full py-12 text-center text-sm text-white/30 italic">
                Speaker announcements coming soon.
              </div>
            ) : (
              speakers.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 flex flex-col justify-between hover:border-violet-500/40 transition"
                >
                  <div className="space-y-3">
                    <div className="aspect-square rounded-xl bg-violet-500/10 border border-white/10 flex items-center justify-center overflow-hidden">
                      <User className="size-14 text-violet-400/50" />
                    </div>
                    <div>
                      <h4 className="font-heading text-sm font-bold text-white">{s.name}</h4>
                      <p className="text-violet-400 text-[10px] font-semibold mt-0.5">{s.role}</p>
                      <p className="text-[10px] text-white/40 mt-1">{s.organizationName}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <span className="text-[9px] uppercase font-bold text-white/30 block mb-1">Keynote Topic</span>
                    <p className="font-semibold text-white/80 text-xs italic">&quot;{s.topic}&quot;</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="text-center">
            <Button asChild className="bg-violet-600 hover:bg-violet-500 text-white font-bold border-0">
              <Link href="/speakers">View All Speakers &rarr;</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  function renderVenue(fields: Record<string, string>) {
    const badge = fields.badge || "\uD83D\uDCCD Venue Details";
    const title = fields.title || "Dubai World Trade Centre";
    const description = fields.description || "Sheikh Zayed Rd, Trade Centre 2, Dubai, United Arab Emirates. The DWTC is the premier venue in the Middle East for global technological events.";
    const format = fields.format || "Hybrid (Onsite & Online)";
    const mainHall = fields.mainHall || "Sheikh Maktoum Hall";

    const highlightIndex = title.toLowerCase().lastIndexOf("trade centre");
    let mainTitle = title;
    let highlightPart = "";
    if (highlightIndex !== -1) {
      mainTitle = title.substring(0, highlightIndex);
      highlightPart = title.substring(highlightIndex);
    }

    return (
      <section id="venue" key="venue" className="py-10">
        <div className="container grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="space-y-6">
            <span className="inline-flex rounded-full bg-violet-500/10 border border-violet-500/20 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-400">
              {badge}
            </span>
            <h2 className="font-heading text-3xl font-extrabold text-white">
              {mainTitle} <span className="text-violet-400">{highlightPart}</span>
            </h2>
            <p className="text-sm text-white/60 leading-relaxed">
              {description}
            </p>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
                <p className="text-violet-400 mb-1 uppercase tracking-wider font-bold text-[10px]">Format</p>
                <p className="text-white">{format}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
                <p className="text-violet-400 mb-1 uppercase tracking-wider font-bold text-[10px]">Main Hall</p>
                <p className="text-white">{mainHall}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 overflow-hidden h-80 relative group bg-surface/30">
            <iframe
              title="Dubai World Trade Centre location map"
              src="https://maps.google.com/maps?q=Dubai%20World%20Trade%20Centre,%20Dubai&t=&z=15&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full border-0 grayscale-[25%] contrast-[1.05] opacity-90 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-500"
              loading="lazy"
              allowFullScreen
            />

            {/* Overlay card */}
            <div className="absolute bottom-4 left-4 right-4 pointer-events-none z-10">
              <div className="rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/15 p-4 flex items-center justify-between gap-4 pointer-events-auto shadow-2xl">
                <div>
                  <p className="text-[10px] text-violet-400 font-bold uppercase tracking-wider mb-1">📍 Venue Location</p>
                  <p className="text-white font-semibold text-sm">Dubai World Trade Centre</p>
                  <p className="text-white/60 text-[11px] mt-0.5">Sheikh Zayed Rd, Trade Centre 2, Dubai, UAE</p>
                </div>
                <a
                  href="https://maps.google.com/?q=Dubai+World+Trade+Centre"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-lg bg-violet-600 hover:bg-violet-500 transition-colors px-3.5 py-2 text-white text-[11px] font-bold whitespace-nowrap shadow-lg hover-lift"
                >
                  Get Directions &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderContact(fields: Record<string, string>) {
    const badge = fields.badge || "\u2709 Contact Secretariat";
    const title = fields.title || "Get in Touch";
    const description = fields.description || "Questions on registration, submission, or corporate sponsorship? Send us an inquiry below or email secretariat@icgit2026.org.";

    const highlightIndex = title.toLowerCase().lastIndexOf("touch");
    let mainTitle = title;
    let highlightPart = "";
    if (highlightIndex !== -1) {
      mainTitle = title.substring(0, highlightIndex);
      highlightPart = title.substring(highlightIndex);
    }

    return (
      <section id="contact" key="contact" className="py-10">
        <div className="container max-w-4xl">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 space-y-6">
            <div className="text-center space-y-3">
              <span className="inline-flex rounded-full bg-violet-500/10 border border-violet-500/20 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-400">
                {badge}
              </span>
              <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-white">
                {mainTitle} <span className="text-violet-400">{highlightPart}</span>
              </h2>
              <p className="text-xs text-white/50 max-w-lg mx-auto">
                {description}
              </p>
            </div>

            {feedback && (
              <div className={`p-4 rounded-lg border text-xs font-semibold text-center ${feedback.ok ? "border-emerald-500/35 bg-emerald-500/5 text-emerald-400" : "border-red-500/35 bg-red-500/5 text-red-400"}`}>
                {feedback.msg}
              </div>
            )}

            <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-white/50 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 size-4 text-white/30 pointer-events-none" />
                    <input
                      required
                      type="text"
                      name="name"
                      suppressHydrationWarning
                      placeholder="Your full name"
                      className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 pl-10 text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-white/50 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 size-4 text-white/30 pointer-events-none" />
                    <input
                      required
                      type="email"
                      name="email"
                      suppressHydrationWarning
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 pl-10 text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-white/50 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">Inquiry Category</label>
                <div className="relative">
                  <HelpCircle className="absolute left-3 top-3 size-4 text-white/30 pointer-events-none" />
                  <select
                    required
                    name="category"
                    suppressHydrationWarning
                    className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 pl-10 text-white focus:outline-none focus:border-violet-500/60 transition"
                  >
                    <option value="delegate">Delegate Inquiry</option>
                    <option value="author">Author Submission</option>
                    <option value="sponsor">Corporate Sponsor</option>
                    <option value="committee">Committee Member</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/50 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">Message</label>
                <textarea
                  required
                  name="message"
                  rows={5}
                  suppressHydrationWarning
                  placeholder="Details of your inquiry (min. 12 characters)..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition resize-none"
                />
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  isLoading={isPending}
                  suppressHydrationWarning
                  className="bg-violet-600 hover:bg-violet-500 text-white font-bold border-0 shadow-lg shadow-violet-600/25"
                >
                  Send Inquiry Message
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div
      className="conference-home relative min-h-screen"
      style={{
        backgroundImage: "radial-gradient(circle at 80% 20%, rgb(242 232 211 / 0.35), transparent 24rem)"
      }}
    >
      <div className="relative z-10 space-y-0 pb-24">
        {sectionsList.map((sec) => {
          if (sec.visible === false) return null;
          switch (sec.id) {
            case "hero":
              return renderHero(sec.fields);
            case "countdown":
              return renderCountdown(sec.fields);
            case "about":
              return renderAbout(sec.fields);
            case "sessions":
              return renderSessions(sec.fields);
            case "speakers":
              return renderSpeakers(sec.fields);
            case "venue":
              return renderVenue(sec.fields);
            case "contact":
              return renderContact(sec.fields);
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
