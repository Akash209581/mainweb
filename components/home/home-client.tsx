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

export interface SpeakerInfo {
  id: string;
  name: string;
  role: string;
  topic: string;
  bio: string | null;
  imageAssetId: string | null;
  organizationName: string;
}

export interface TrackInfo {
  id: string;
  name: string;
  description: string | null;
}

export interface ConferenceInfo {
  name: string;
  fullName: string;
  dates: string;
  startDateIso: string;
  venueName: string;
  venueAddress: string;
  venueCity: string;
  mode: string;
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
  conferenceInfo?: ConferenceInfo;
  themeTokens?: Record<string, string> | null;
}

/* ------------------------------------------------------------------ */
/*  Fallback Track Icons                                                */
/* ------------------------------------------------------------------ */

const TRACK_ICONS = [
  BrainCircuit,
  Coins,
  Leaf,
  Building2,
  Wifi,
  Heart
];

const DEFAULT_IMPORTANT_DATES = [
  { title: "Abstract Submission Opens", date: "July 15, 2026", status: "Open", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  { title: "Abstract Submission Deadline", date: "October 1, 2026", status: "Upcoming", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
  { title: "Acceptance Notification", date: "November 1, 2026", status: "Upcoming", color: "bg-white/5 text-white/50 border-white/10" },
  { title: "Camera-Ready Deadline", date: "November 15, 2026", status: "Upcoming", color: "bg-white/5 text-white/50 border-white/10" },
  { title: "Registration Deadline", date: "December 1, 2026", status: "Upcoming", color: "bg-white/5 text-white/50 border-white/10" },
  { title: "Conference Dates", date: "December 8–10, 2026", status: "Event", color: "bg-violet-500/10 text-violet-400 border-violet-500/30" }
];

function resolveImgSrc(src: string): string {
  if (!src) return "/ICGIT/about_banner.avif";
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
    return src;
  }
  if (src.startsWith("/ICGIT/") || src === "/ICGIT") {
    return src;
  }
  return src.startsWith("/") ? `/ICGIT${src}` : `/ICGIT/${src}`;
}

export const DEFAULT_FALLBACK_TRACKS: TrackInfo[] = [
  {
    id: "ai",
    name: "AI & Neural Systems",
    description: "Covers computational modeling of neural designs, deep reinforcement learning, safety benchmarks, and borderless AI deployment."
  },
  {
    id: "blockchain",
    name: "Blockchain & Web3",
    description: "Focuses on consensus scalability, zero-knowledge proofs, smart contract security auditing, and decentralized governance."
  },
  {
    id: "greentech",
    name: "Green Tech & Sustainability",
    description: "Addresses net-zero computing, algorithmic energy reduction, renewable-powered data centers, and ESG metrics."
  },
  {
    id: "smartcities",
    name: "Smart Cities & IoT",
    description: "Explores resilient urban IoT architectures, municipal digital twins, edge telemetry, and automated transit systems."
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity & Privacy",
    description: "Investigates post-quantum cryptography, zero-trust infrastructure, automated threat intelligence, and defense systems."
  },
  {
    id: "healthtech",
    name: "HealthTech & BioSystems",
    description: "Translates breakthroughs in digital health diagnostics, bioinformatics pipelines, and neural clinical interfaces."
  }
];

export const DEFAULT_FALLBACK_SPEAKERS: SpeakerInfo[] = [
  {
    id: "sp-1",
    name: "Dr. Amina Rahman",
    role: "Chief AI Scientist",
    organizationName: "Global Digital Futures Institute",
    topic: "Responsible AI for borderless innovation ecosystems",
    bio: "Pioneering researcher in neural safety and AI governance.",
    imageAssetId: null
  },
  {
    id: "sp-2",
    name: "Prof. Lucas Meyer",
    role: "Chair of Smart Systems",
    organizationName: "European Institute of Technology",
    topic: "Resilient infrastructure for intelligent cities",
    bio: "Expert in urban IoT and distributed municipal networks.",
    imageAssetId: null
  },
  {
    id: "sp-3",
    name: "Dr. Sofia Chen",
    role: "Director of Health Innovation",
    organizationName: "Pacific BioSystems Lab",
    topic: "Translational technology in digital health",
    bio: "Leader in computational genomics and clinical interfaces.",
    imageAssetId: null
  },
  {
    id: "sp-4",
    name: "Eng. Omar Al Nuaimi",
    role: "Innovation Strategy Lead",
    organizationName: "Dubai Enterprise Technology Council",
    topic: "Scaling public-private innovation in the Gulf",
    bio: "Strategist advancing smart governance and venture ecosystems.",
    imageAssetId: null
  }
];

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function HomeClient({ speakers, tracks, customContent, conferenceInfo, themeTokens }: HomeClientProps) {
  const activeTracks = tracks && tracks.length > 0 ? tracks : DEFAULT_FALLBACK_TRACKS;
  const activeSpeakers = speakers && speakers.length > 0 ? speakers : DEFAULT_FALLBACK_SPEAKERS;

  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const confName = conferenceInfo?.name || "ICGIT 2026";
  const confDates = conferenceInfo?.dates || "December 8–10, 2026";
  const confVenue = conferenceInfo?.venueName || "Dubai World Trade Centre";
  const confCity = conferenceInfo?.venueCity || "Dubai";
  const confMode = conferenceInfo?.mode || "Hybrid (Onsite & Online)";
  const confStartDate = conferenceInfo?.startDateIso || "2026-12-08T09:00:00Z";

  function handleContactSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    const formElement = e.currentTarget;
    const formData = new FormData(formElement);
    startTransition(async () => {
      const res = await submitContactAction({ ok: false, message: "" }, formData);
      if (!res.ok) {
        setFeedback({ ok: false, msg: res.message || "Failed to submit inquiry" });
      } else {
        setFeedback({ ok: true, msg: "Thank you for contacting us! We will respond shortly." });
        formElement.reset();
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Default sections fallback if customContent is empty              */
  /* ------------------------------------------------------------------ */

  const defaultSections: Array<{
    id: string;
    name: string;
    visible: boolean;
    fields: Record<string, string>;
  }> = [
    {
      id: "hero",
      name: "Hero Header",
      visible: true,
      fields: {
        badge: `${confDates.toUpperCase()}  •  ${confCity.toUpperCase()}, UAE`,
        title: `8th International Conference on`,
        titleColor: "Global Innovation & Technology",
        description:
          "Bringing together 2,000+ visionaries, researchers, and industry leaders from 80+ countries to shape the future of global innovation and emerging technologies.",
        ctaText1: "Submit Abstract",
        ctaLink1: "/abstracts",
        ctaText2: "Register Now",
        ctaLink2: "/registration",
        heroImage: themeTokens?.heroBannerUrl || "/about_banner.avif"
      }
    },
    {
      id: "countdown",
      name: "Event Countdown",
      visible: true,
      fields: {
        badge: "⏳ Conference Begins In",
        title: "Don't Miss This Global Event",
        targetDate: confStartDate
      }
    },
    {
      id: "about",
      name: "About Overview",
      visible: true,
      fields: {
        badge: "🚀 About the Conference",
        title: "Shaping the Future Together",
        paragraph1:
          `${confName} is the world's most anticipated gathering of global innovators, technology pioneers, academic researchers, and business leaders. Now in its 8th edition, this conference serves as a global platform for exchange of cutting-edge ideas across AI, blockchain, green technology, digital transformation, and sustainable innovation.`,
        paragraph2:
          `Hosted in ${confCity} — the world's innovation hub — ${confName} features 120+ expert speakers, 40+ interactive sessions, live demos, startup showcases, and exclusive networking dinners bringing together 2,000+ delegates from 80+ countries.`,
        aboutImage: "/about_banner.avif"
      }
    },
    {
      id: "sessions",
      name: "Tracks & Key Dates",
      visible: true,
      fields: {
        badge: "🎯 Conference Program",
        title: "Sessions, Tracks & Key Dates",
        description:
          "Explore the multifaceted agenda, research tracks, submission deadlines, and fee structures designed for global delegates."
      }
    },
    {
      id: "speakers",
      name: "Featured Speakers",
      visible: true,
      fields: {
        badge: "🎙 Visionary Thought Leaders",
        title: "World-Class Keynotes & Panelists",
        description:
          "Hear from the foremost minds in artificial intelligence, deep tech, smart cities, and digital policy."
      }
    },
    {
      id: "venue",
      name: "Venue & Location",
      visible: true,
      fields: {
        badge: "EVENT LOCATION",
        title: "Hosted in the Heart of",
        description:
          `${confVenue}, situated at the crossroads of international innovation in ${confCity}, United Arab Emirates.`,
        format: "Hybrid (Onsite & Online)",
        mainHall: "Sheikh Maktoum Hall"
      }
    },
    {
      id: "contact",
      name: "Contact & Secretariat",
      visible: true,
      fields: {
        badge: "✉ Contact Secretariat",
        title: "Get in Touch",
        description:
          `Questions on registration, submission, or corporate sponsorship? Send us an inquiry below or email secretariat@icgit2026.org.`
      }
    }
  ];

  const sectionsList = customContent && customContent.length > 0 ? customContent : defaultSections;

  /* ------------------------------------------------------------------ */
  /*  Section Renderers                                                  */
  /* ------------------------------------------------------------------ */

  function renderHero(fields: Record<string, string | undefined>) {
    const badge = fields.badge || `${confDates.toUpperCase()}  •  ${confCity.toUpperCase()}, UAE`;
    const title = fields.title || "8th International Conference on";
    const titleColor = fields.titleColor || "Global Innovation & Technology";
    const description = fields.description || "Bringing together 2,000+ visionaries, researchers, and industry leaders from 80+ countries to shape the future of global innovation and emerging technologies.";
    const ctaText1 = fields.ctaText1 || "Submit Abstract";
    const ctaLink1 = fields.ctaLink1 || "/abstracts";
    const ctaText2 = fields.ctaText2 || "Register Now";
    const ctaLink2 = fields.ctaLink2 || "/registration";
    const rawHeroImg = fields.heroImage || themeTokens?.heroBannerUrl || "/about_banner.avif";
    const heroImage = resolveImgSrc(rawHeroImg);
    const heroVenue = fields.heroVenue || `${confVenue}, ${confCity}`;
    const heroDates = fields.heroDates || confDates;
    const heroMode = fields.heroMode || confMode;

    return (
      <section id="home" key="hero" className="home-hero flex items-center pt-32 pb-14 sm:pt-36 sm:pb-20">
        <div className="container relative z-10 grid items-start gap-10 px-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
          <div className="max-w-2xl">
            <span className="mb-6 inline-flex w-fit items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#281b58]">
              <CalendarDays className="mr-2 size-3.5 text-amber-600" /> {badge}
            </span>
            <h1 className="font-heading text-4xl sm:text-6xl lg:text-[4.25rem] font-bold leading-[1.08] sm:leading-[0.98] text-[#1a153a] tracking-tight">
              {title}
              <span className="mt-2 block text-[#281b58]">{titleColor}</span>
            </h1>
            <div className="my-6 h-px w-20 bg-amber-500" />
            <p className="max-w-xl text-sm sm:text-base leading-relaxed sm:leading-7 text-[#4b4568] text-justify font-normal">{description}</p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-[#4b4568]">
              <span className="flex items-center gap-2"><MapPin className="size-4 text-amber-600 shrink-0" /> {heroVenue}</span>
              <span className="flex items-center gap-2"><CalendarDays className="size-4 text-amber-600 shrink-0" /> {heroDates}</span>
              <span className="flex items-center gap-2"><Globe className="size-4 text-amber-600 shrink-0" /> {heroMode}</span>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-[#281b58] hover:bg-[#382678] font-bold !text-white shadow-xl shadow-indigo-950/30">
                <Link href={ctaLink2} className="!text-white">{ctaText2} <ArrowRight className="ml-2 size-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-slate-300 bg-white/90 font-semibold text-[#1a153a] hover:bg-white shadow-sm">
                <Link href={ctaLink1}><Presentation className="mr-2 size-4 text-amber-600" /> {ctaText1}</Link>
              </Button>
            </div>
          </div>

          <div className="relative lg:-mr-16 mt-6 lg:mt-0">
            <div className="hero-art relative overflow-hidden rounded-3xl border-l-8 border-amber-500/70 bg-white shadow-2xl">
              <img src={heroImage} alt={`${confName} conference experience`} className="aspect-[1.2/0.86] w-full object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#1a153a]/25 via-transparent to-transparent" />
            </div>
            <div className="home-stat-bar relative sm:absolute sm:-bottom-8 sm:left-8 sm:right-4 mt-4 sm:mt-0 grid grid-cols-2 gap-2 sm:gap-px rounded-2xl bg-[#281b58] p-4 text-white sm:grid-cols-4 sm:p-5 shadow-2xl border border-indigo-900/50">
              {[["2,000+", "Attendees"], ["80+", "Countries"], [`${speakers.length || 40}+`, "Speakers"], ["200+", "Organizations"]].map(([value, label]) => (
                <div key={label} className="border-white/10 px-3 py-2 text-center sm:border-r last:border-0 bg-white/5 sm:bg-transparent rounded-lg sm:rounded-none">
                  <p className="font-heading text-xl sm:text-2xl font-bold text-white">{value}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-white/70">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderCountdown(fields: Record<string, string | undefined>) {
    const badge = fields.badge || "⏳ Conference Begins In";
    const title = fields.title || "Don't Miss This Global Event";
    const targetDate = fields.targetDate || confStartDate;

    const highlightIndex = title.toLowerCase().lastIndexOf("global event");
    let mainTitle = title;
    let highlightPart = "";
    if (highlightIndex !== -1) {
      mainTitle = title.substring(0, highlightIndex);
      highlightPart = title.substring(highlightIndex);
    }

    return (
      <section key="countdown" className="py-14 sm:py-20 scroll-mt-24">
        <div className="container px-4 sm:px-6">
          <div className="rounded-3xl border border-slate-200/90 bg-white/90 backdrop-blur-md p-6 sm:p-10 text-center space-y-6 shadow-xl">
            <span className="inline-flex rounded-full bg-violet-500/10 border border-violet-500/20 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#281b58]">
              {badge}
            </span>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-[#1a153a]">
              {mainTitle} <span className="text-[#281b58]">{highlightPart}</span>
            </h2>
            <div className="max-w-3xl mx-auto">
              <CountdownCard targetDate={targetDate} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderAbout(fields: Record<string, string | undefined>) {
    const badge = fields.badge || "About the Conference";
    const title = fields.title || "Pioneering the Next Era of";
    const titleColor = fields.titleColor || "Technological Breakthroughs";
    const paragraph1 = fields.paragraph1 || fields.desc1 || `${confName} is the world's most anticipated gathering of global innovators, technology pioneers, academic researchers, and business leaders.`;
    const paragraph2 = fields.paragraph2 || fields.desc2 || `Hosted in ${confCity} — the world's innovation hub — ${confName} features 120+ expert speakers, 40+ interactive sessions, live demos, startup showcases, and exclusive networking dinners.`;
    const rawAboutImg = fields.aboutImage || "/about_banner.avif";
    const aboutImage = resolveImgSrc(rawAboutImg);

    return (
      <section id="about" key="about" className="py-14 sm:py-20 scroll-mt-28">
        <div id="brochure" />
        <div className="container grid gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-[#d4af37]/40 bg-[#fdfaf2] px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#281b58] shadow-sm">
              {badge}
            </span>
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-[#1a153a] leading-tight tracking-tight">
              {title} <span className="text-[#281b58]">{titleColor}</span>
            </h2>
            <div className="space-y-4">
              <p className="text-sm sm:text-base leading-relaxed sm:leading-7 text-[#4b4568] text-justify font-normal">
                {paragraph1}
              </p>
              <p className="text-sm sm:text-base leading-relaxed sm:leading-7 text-[#4b4568] text-justify font-normal">
                {paragraph2}
              </p>
            </div>
            <div className="rounded-3xl overflow-hidden border border-slate-200/90 relative h-56 sm:h-64 shadow-xl mt-4">
              <img
                src={aboutImage}
                alt="Conference venue"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4 sm:p-5">
                <p className="text-xs sm:text-sm font-semibold text-white/95">
                  📍 {confVenue}, {confCity}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200/90 bg-white/90 backdrop-blur-md p-6 sm:p-8 space-y-4 shadow-xl">
              <h3 className="font-heading text-lg font-bold text-[#1a153a] flex items-center gap-2">
                <CalendarDays className="size-5 text-indigo-600" />
                Key Milestones & Dates
              </h3>
              <div className="space-y-3">
                {DEFAULT_IMPORTANT_DATES.slice(0, 4).map((d) => (
                  <div
                    key={d.title}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-[#1a153a]">{d.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{d.date}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${d.color}`}
                    >
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 text-center shadow-sm">
                <p className="font-heading text-3xl font-extrabold text-[#281b58]">{activeTracks.length}</p>
                <p className="text-[11px] text-slate-600 mt-1 uppercase font-bold tracking-wider">Research Tracks</p>
              </div>
              <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 text-center shadow-sm">
                <p className="font-heading text-3xl font-extrabold text-[#281b58]">{activeSpeakers.length}+</p>
                <p className="text-[11px] text-slate-600 mt-1 uppercase font-bold tracking-wider">Keynote Speakers</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderSessions(fields: Record<string, string | undefined>) {
    const badge = fields.badge || "🎯 Conference Program";
    const title = fields.title || "Sessions, Tracks & Topics";
    const description = fields.description || "Explore the multifaceted agenda and research tracks designed for global delegates.";

    return (
      <section id="sessions" key="sessions" className="py-14 sm:py-20 scroll-mt-28">
        <div className="container px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="inline-flex rounded-full border border-[#d4af37]/40 bg-[#fdfaf2] px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#281b58] shadow-sm">
              {badge}
            </span>
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-[#1a153a]">
              {title}
            </h2>
            <p className="text-sm sm:text-base text-[#4b4568] leading-relaxed text-pretty">{description}</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activeTracks.map((tr, idx) => {
              const IconComp = TRACK_ICONS[idx % TRACK_ICONS.length];
              return (
                <div
                  key={tr.id}
                  className="group rounded-3xl border border-slate-200/90 bg-white/90 backdrop-blur-md p-6 space-y-3 hover:border-indigo-400 hover:shadow-xl transition duration-300 shadow-sm"
                >
                  <div className="size-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition">
                    <IconComp className="size-5" />
                  </div>
                  <h3 className="font-heading text-base font-bold text-[#1a153a] group-hover:text-indigo-600 transition">
                    {tr.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4b4568] leading-relaxed line-clamp-3 text-pretty">
                    {tr.description || "Comprehensive research presentations, workshop panels, and interactive paper sessions."}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  function renderSpeakers(fields: Record<string, string | undefined>) {
    const badge = fields.badge || "🎙 Visionary Thought Leaders";
    const title = fields.title || "World-Class Keynotes & Panelists";
    const description = fields.description || "Hear from the foremost minds in artificial intelligence, deep tech, smart cities, and digital policy.";

    return (
      <section id="speakers" key="speakers" className="py-14 sm:py-20 scroll-mt-28">
        <div className="container px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="inline-flex rounded-full border border-[#d4af37]/40 bg-[#fdfaf2] px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#281b58] shadow-sm">
              {badge}
            </span>
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-[#1a153a]">
              {title}
            </h2>
            <p className="text-sm sm:text-base text-[#4b4568] leading-relaxed text-pretty">{description}</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {activeSpeakers.map((sp) => (
              <div
                key={sp.id}
                className="group rounded-3xl border border-slate-200/90 bg-white/90 backdrop-blur-md p-5 space-y-4 hover:border-indigo-400 hover:shadow-xl transition duration-300 flex flex-col shadow-sm"
              >
                <div className="aspect-square rounded-2xl bg-indigo-50 border border-slate-200 overflow-hidden relative flex items-center justify-center">
                  {sp.imageAssetId ? (
                    <img
                      src={resolveImgSrc(sp.imageAssetId)}
                      alt={sp.name}
                      className="size-full object-cover group-hover:scale-105 transition duration-500 absolute inset-0 z-0"
                    />
                  ) : null}
                  <div className="size-16 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-heading text-xl font-bold">
                    {sp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className="font-heading text-sm font-bold text-[#1a153a] group-hover:text-indigo-600 transition">
                    {sp.name}
                  </h3>
                  <p className="text-[11px] text-indigo-600 font-semibold">{sp.role}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{sp.organizationName}</p>
                  {sp.topic && (
                    <p className="text-[11px] text-[#4b4568] italic pt-2 line-clamp-2 border-t border-slate-100 mt-2 leading-relaxed">
                      &ldquo;{sp.topic}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function renderVenue(fields: Record<string, string | undefined>) {
    const badge = fields.badge || "EVENT LOCATION";
    const title = fields.title || "Hosted in the Heart of";
    const description = fields.description || `${confVenue}, situated at the crossroads of international innovation in ${confCity}, United Arab Emirates.`;
    const formatValue = fields.format || confMode || "Hybrid (Onsite & Online)";
    const mainHallValue = fields.mainHall || "Sheikh Maktoum Hall";
    
    // Dynamic Google Maps handling:
    const customMapLink = fields.mapLink || fields.mapLocationLink;
    let embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(`${confVenue}, ${confCity}`)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    let directMapLink = `https://maps.google.com/?q=${encodeURIComponent(`${confVenue}, ${confCity}`)}`;
    
    if (customMapLink && customMapLink.trim() !== "") {
      const trimmed = customMapLink.trim();
      if (trimmed.includes("output=embed") || trimmed.includes("google.com/maps/embed")) {
        embedSrc = trimmed;
        directMapLink = trimmed.replace("&output=embed", "").replace("?output=embed", "");
      } else {
        const q = encodeURIComponent(trimmed);
        embedSrc = `https://maps.google.com/maps?q=${q}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        directMapLink = trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://maps.google.com/?q=${q}`;
      }
    }

    return (
      <section id="venue" key="venue" className="py-14 sm:py-20 scroll-mt-28">
        <div className="container px-4 sm:px-6">
          <div className="grid lg:grid-cols-[1fr_1.18fr] gap-10 items-center">
            {/* Left Column: Venue Details */}
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af37]/40 bg-[#fdfaf2] px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#281b58] shadow-sm">
                <span>{badge}</span>
              </span>
              <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-[#1a153a] tracking-tight leading-tight">
                {title}
              </h2>
              <p className="text-sm sm:text-base leading-relaxed sm:leading-7 text-[#4b4568] max-w-lg mt-3 text-justify font-normal">
                {description}
              </p>

              {/* Format & Main Hall feature cards */}
              <div className="grid grid-cols-2 gap-4 pt-4 max-w-lg">
                <div className="rounded-2xl border border-slate-200/90 bg-white/80 backdrop-blur-md p-4 space-y-1.5 shadow-sm">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-[#5a489b]">FORMAT</span>
                  <p className="font-heading text-xs sm:text-sm font-extrabold text-[#1a153a]">{formatValue}</p>
                </div>
                <div className="rounded-2xl border border-slate-200/90 bg-white/80 backdrop-blur-md p-4 space-y-1.5 shadow-sm">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-[#5a489b]">MAIN HALL</span>
                  <p className="font-heading text-xs sm:text-sm font-extrabold text-[#1a153a]">{mainHallValue}</p>
                </div>
              </div>
            </div>

            {/* Right Column: Clean Light Google Map with 'Open in Maps' Button */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl bg-white h-[320px] sm:h-[400px]">
              <iframe
                title={`${confVenue} Location Map`}
                src={embedSrc}
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen
              />

              {/* Floating 'Open in Maps' badge in top-left */}
              <div className="absolute top-3 left-3 z-10">
                <a
                  href={directMapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white text-blue-600 text-xs font-semibold shadow-md border border-slate-200/80 transition-all hover:scale-105"
                >
                  <span>Open in Maps</span>
                  <span className="text-xs">↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderContact(fields: Record<string, string | undefined>) {
    const badge = fields.badge || "✉ Contact Secretariat";
    const title = fields.title || "Get in Touch";
    const description = fields.description || "Questions on registration, submission, or corporate sponsorship? Send us an inquiry below or email secretariat@icgit2026.org.";

    return (
      <section id="contact" key="contact" className="py-14 sm:py-20 scroll-mt-28">
        <div className="container max-w-4xl px-4 sm:px-6">
          <div className="rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-6 sm:p-10 space-y-6 shadow-2xl">
            <div className="text-center space-y-3">
              <span className="inline-flex rounded-full border border-[#d4af37]/40 bg-[#fdfaf2] px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#281b58] shadow-sm">
                {badge}
              </span>
              <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-[#1a153a]">
                {title}
              </h2>
              <p className="text-xs sm:text-sm text-[#4b4568] max-w-lg mx-auto leading-relaxed text-pretty">
                {description}
              </p>
            </div>

            {feedback && (
              <div className={`p-4 rounded-xl border text-xs font-semibold text-center ${feedback.ok ? "border-emerald-500/35 bg-emerald-50 text-emerald-800" : "border-red-500/35 bg-red-50 text-red-800"}`}>
                {feedback.msg}
              </div>
            )}

            <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 size-4 text-slate-400 pointer-events-none" />
                    <input
                      required
                      type="text"
                      name="name"
                      suppressHydrationWarning
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 pl-10 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 size-4 text-slate-400 pointer-events-none" />
                    <input
                      required
                      type="email"
                      name="email"
                      suppressHydrationWarning
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 pl-10 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">Inquiry Category</label>
                <div className="relative">
                  <HelpCircle className="absolute left-3 top-3 size-4 text-slate-400 pointer-events-none" />
                  <select
                    required
                    name="category"
                    suppressHydrationWarning
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 pl-10 text-slate-900 focus:outline-none focus:border-indigo-600 transition"
                  >
                    <option value="delegate">Delegate Inquiry</option>
                    <option value="author">Author Submission</option>
                    <option value="sponsor">Corporate Sponsor</option>
                    <option value="committee">Committee Member</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">Message</label>
                <textarea
                  required
                  name="message"
                  rows={5}
                  suppressHydrationWarning
                  placeholder="Details of your inquiry (min. 12 characters)..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition resize-none"
                />
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  isLoading={isPending}
                  suppressHydrationWarning
                  className="bg-[#281b58] hover:bg-[#382678] !text-white font-bold px-8 py-3 rounded-xl shadow-xl shadow-indigo-950/30"
                >
                  <span className="!text-white">Send Inquiry Message</span>
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
