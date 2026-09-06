import {
  BrainCircuit,
  Building2,
  CalendarDays,
  FileText,
  Globe2,
  Handshake,
  MapPin,
  Presentation,
  ShieldCheck,
  Users
} from "lucide-react";
import type {
  AgendaItem,
  CommitteeMember,
  FeatureItem,
  NavigationItem,
  Speaker,
  Sponsor,
  Statistic
} from "@/types/conference";

export const CONFERENCE = {
  name: "ICGIT 2026",
  fullName: "International Conference on Global Innovation and Technology 2026",
  dates: "December 8-10, 2026",
  startDate: "2026-12-08T09:00:00+04:00",
  venue: "Dubai World Trade Centre",
  city: "Dubai",
  country: "United Arab Emirates",
  mode: "Hybrid Conference",
  email: "secretariat@icgit2026.org",
  phone: "+971 4 000 2026"
} as const;

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Brochure", href: "/brochure" },
  { label: "Sessions", href: "/#sessions" },
  { label: "Speakers", href: "/#speakers" },
  { label: "Venue", href: "/#venue" },
  { label: "Contact Us", href: "/#contact" }
];

export const STATISTICS: Statistic[] = [
  { label: "Conference Days", value: "3" },
  { label: "Research Tracks", value: "12" },
  { label: "Global Speakers", value: "40+" },
  { label: "Hybrid Delegates", value: "1500+" }
];

export const HOME_FEATURES: FeatureItem[] = [
  {
    title: "Innovation Tracks",
    description: "Curated sessions across AI, sustainable cities, health tech, fintech, and enterprise transformation.",
    icon: BrainCircuit
  },
  {
    title: "Hybrid Participation",
    description: "A premium onsite experience in Dubai paired with accessible virtual attendance for global delegates.",
    icon: Globe2
  },
  {
    title: "Abstract Review",
    description: "Structured abstract submission and reviewer workflows will be activated after Part 2 defines the backend.",
    icon: FileText
  },
  {
    title: "Trusted Governance",
    description: "Committee-led program curation with clear roles for authors, reviewers, sponsors, and administrators.",
    icon: ShieldCheck
  }
];

export const ACTIONS: FeatureItem[] = [
  {
    title: "Register as Delegate",
    description: "Choose onsite or virtual participation and reserve access to all conference sessions.",
    icon: Users
  },
  {
    title: "Submit Abstract",
    description: "Prepare your research contribution for the ICGIT 2026 program tracks.",
    icon: Presentation
  },
  {
    title: "Partner With ICGIT",
    description: "Connect your organization with technology leaders, researchers, and policymakers.",
    icon: Handshake
  }
];

export const SPEAKERS: Speaker[] = [
  {
    name: "Dr. Amina Rahman",
    role: "Chief AI Scientist",
    organization: "Global Digital Futures Institute",
    topic: "Responsible AI for borderless innovation ecosystems"
  },
  {
    name: "Prof. Lucas Meyer",
    role: "Chair of Smart Systems",
    organization: "European Institute of Technology",
    topic: "Resilient infrastructure for intelligent cities"
  },
  {
    name: "Dr. Sofia Chen",
    role: "Director of Health Innovation",
    organization: "Pacific BioSystems Lab",
    topic: "Translational technology in digital health"
  },
  {
    name: "Eng. Omar Al Nuaimi",
    role: "Innovation Strategy Lead",
    organization: "Dubai Enterprise Technology Council",
    topic: "Scaling public-private innovation in the Gulf"
  }
];

export const AGENDA: AgendaItem[] = [
  {
    day: "Day 1",
    date: "December 8, 2026",
    title: "Global Innovation Strategy",
    sessions: ["Opening ceremony", "Keynote forum", "AI and policy roundtable", "Welcome reception"]
  },
  {
    day: "Day 2",
    date: "December 9, 2026",
    title: "Research, Industry, and Applied Technology",
    sessions: ["Parallel research tracks", "Sponsor showcases", "Reviewer panels", "Networking dinner"]
  },
  {
    day: "Day 3",
    date: "December 10, 2026",
    title: "Future Systems and Partnerships",
    sessions: ["Innovation labs", "Committee awards", "Industry partnerships", "Closing plenary"]
  }
];

export const COMMITTEE: CommitteeMember[] = [
  {
    name: "Prof. Nadia Al Mansoori",
    role: "Conference Chair",
    affiliation: "Middle East Institute for Advanced Technology"
  },
  {
    name: "Dr. Rafael Stein",
    role: "Technical Program Chair",
    affiliation: "International Society for Innovation Systems"
  },
  {
    name: "Prof. Meera Iyer",
    role: "Publication Chair",
    affiliation: "Global Research Council"
  },
  {
    name: "Dr. Hassan Karim",
    role: "Sponsorship Chair",
    affiliation: "Dubai Innovation Network"
  }
];

export const SPONSORS: Sponsor[] = [
  { name: "AstraGrid Technologies", tier: "Platinum", focus: "Enterprise AI platforms" },
  { name: "Nexus Cloud Systems", tier: "Gold", focus: "Secure hybrid cloud" },
  { name: "Verde Mobility Labs", tier: "Gold", focus: "Sustainable transport" },
  { name: "HelioMed Analytics", tier: "Silver", focus: "Digital health intelligence" }
];

export const VENUE_HIGHLIGHTS: FeatureItem[] = [
  {
    title: "World-Class Venue",
    description: "Dubai World Trade Centre offers premium conference infrastructure, exhibition halls, and executive meeting spaces.",
    icon: Building2
  },
  {
    title: "Central Dubai Access",
    description: "Direct city connectivity for international delegates, local attendees, sponsors, and committee members.",
    icon: MapPin
  },
  {
    title: "December Program",
    description: "Three focused conference days designed for research exchange, industry collaboration, and policy dialogue.",
    icon: CalendarDays
  }
];

export const DEFAULT_PACKAGES = [
  {
    id: "00000000-0000-0000-0000-000000000301",
    name: "Standard Delegate Pass",
    description: "Full access to all keynote sessions, parallel research tracks, conference kit, lunches, and networking receptions.",
    priceCents: 49900
  },
  {
    id: "00000000-0000-0000-0000-000000000302",
    name: "Student & Academic Pass",
    description: "Discounted access for full-time students and academic researchers with valid university credentials.",
    priceCents: 29900
  },
  {
    id: "00000000-0000-0000-0000-000000000303",
    name: "VIP All-Access Pass",
    description: "Premium front-row seating, VIP gala dinner admission, exclusive speaker lounge access, and digital proceedings archive.",
    priceCents: 79900
  },
  {
    id: "00000000-0000-0000-0000-000000000304",
    name: "Virtual Hybrid Pass",
    description: "Live interactive streaming of all tracks, virtual networking portal, and on-demand session recordings for 90 days.",
    priceCents: 14900
  }
];

export const DEFAULT_COUNTRIES = [
  { id: "00000000-0000-0000-0000-000000000401", name: "United Arab Emirates" },
  { id: "00000000-0000-0000-0000-000000000402", name: "United States" },
  { id: "00000000-0000-0000-0000-000000000403", name: "United Kingdom" },
  { id: "00000000-0000-0000-0000-000000000404", name: "India" },
  { id: "00000000-0000-0000-0000-000000000405", name: "Saudi Arabia" },
  { id: "00000000-0000-0000-0000-000000000406", name: "Canada" },
  { id: "00000000-0000-0000-0000-000000000407", name: "Australia" },
  { id: "00000000-0000-0000-0000-000000000408", name: "Germany" },
  { id: "00000000-0000-0000-0000-000000000409", name: "France" },
  { id: "00000000-0000-0000-0000-000000000410", name: "Japan" },
  { id: "00000000-0000-0000-0000-000000000411", name: "Singapore" },
  { id: "00000000-0000-0000-0000-000000000412", name: "Qatar" },
  { id: "00000000-0000-0000-0000-000000000413", name: "Oman" },
  { id: "00000000-0000-0000-0000-000000000414", name: "Kuwait" },
  { id: "00000000-0000-0000-0000-000000000415", name: "Bahrain" },
  { id: "00000000-0000-0000-0000-000000000416", name: "Egypt" },
  { id: "00000000-0000-0000-0000-000000000417", name: "South Africa" },
  { id: "00000000-0000-0000-0000-000000000418", name: "Malaysia" },
  { id: "00000000-0000-0000-0000-000000000419", name: "South Korea" },
  { id: "00000000-0000-0000-0000-000000000420", name: "Switzerland" },
  { id: "00000000-0000-0000-0000-000000000421", name: "Netherlands" },
  { id: "00000000-0000-0000-0000-000000000422", name: "Italy" },
  { id: "00000000-0000-0000-0000-000000000423", name: "Spain" },
  { id: "00000000-0000-0000-0000-000000000424", name: "Brazil" },
  { id: "00000000-0000-0000-0000-000000000425", name: "China" }
];
