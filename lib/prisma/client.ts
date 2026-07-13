/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { PrismaClient } from "@prisma/client";

const globalForMock = globalThis as unknown as {
  abstractSubmissions?: any[];
  registrations?: any[];
  contactMessages?: any[];
};

if (!globalForMock.abstractSubmissions) globalForMock.abstractSubmissions = [];
if (!globalForMock.registrations) globalForMock.registrations = [];
if (!globalForMock.contactMessages) globalForMock.contactMessages = [];

const abstractSubmissions = globalForMock.abstractSubmissions;
const registrations = globalForMock.registrations;
const contactMessages = globalForMock.contactMessages;

// Mock data definitions
const mockCountries = [
  { id: "ae-id", iso2: "AE", name: "United Arab Emirates" }
];

const mockPackages = [
  { id: "onsite-id", name: "Onsite Delegate", priceCents: 69900, attendanceMode: "ONSITE", currency: "USD", description: "Onsite participation in Dubai" },
  { id: "virtual-id", name: "Virtual Delegate", priceCents: 29900, attendanceMode: "VIRTUAL", currency: "USD", description: "Virtual access" }
];

const mockTracks = [
  { id: "track-1", name: "AI Systems", slug: "ai-systems", description: "Deep learning and neural architectures" },
  { id: "track-2", name: "Smart Cities", slug: "smart-cities", description: "Urban grid systems and IoT networks" },
  { id: "track-3", name: "Digital Health", slug: "digital-health", description: "Precision medicine and diagnostics" },
  { id: "track-4", name: "FinTech", slug: "fintech", description: "Decentralized finance systems" }
];

const mockSpeakers = [
  { id: "sp-1", name: "Dr. Amina Rahman", role: "Chief AI Scientist", topic: "Responsible AI for borderless innovation ecosystems", bio: "Dr. Amina Rahman is a pioneering scientist.", sortOrder: 1, isFeatured: true, organizationId: "org-1", organization: { id: "org-1", name: "Global Digital Futures Institute" } },
  { id: "sp-2", name: "Prof. Lucas Meyer", role: "Chair of Smart Systems", topic: "Resilient infrastructure for intelligent cities", bio: "Prof. Lucas Meyer leads smart systems research.", sortOrder: 2, isFeatured: true, organizationId: "org-2", organization: { id: "org-2", name: "European Institute of Technology" } },
  { id: "sp-3", name: "Dr. Sofia Chen", role: "Director of Health Innovation", topic: "Translational technology in digital health", bio: "Dr. Sofia Chen specializes in clinical bioinformatics.", sortOrder: 3, isFeatured: true, organizationId: "org-3", organization: { id: "org-3", name: "Pacific BioSystems Lab" } },
  { id: "sp-4", name: "Eng. Omar Al Nuaimi", role: "Innovation Strategy Lead", topic: "Scaling public-private innovation in the Gulf", bio: "Eng. Omar Al Nuaimi coordinates innovation strategy.", sortOrder: 4, isFeatured: true, organizationId: "org-4", organization: { id: "org-4", name: "Dubai Enterprise Technology Council" } }
];

const mockSponsors = [
  { id: "spons-1", name: "AstraGrid Technologies", focus: "Enterprise AI platforms", sortOrder: 1, sponsorTier: { id: "tier-1", name: "Platinum", priority: 1 } },
  { id: "spons-2", name: "Nexus Cloud Systems", focus: "Secure hybrid cloud", sortOrder: 2, sponsorTier: { id: "tier-2", name: "Gold", priority: 2 } },
  { id: "spons-3", name: "Verde Mobility Labs", focus: "Sustainable transport", sortOrder: 3, sponsorTier: { id: "tier-2", name: "Gold", priority: 2 } },
  { id: "spons-4", name: "HelioMed Analytics", focus: "Digital health intelligence", sortOrder: 4, sponsorTier: { id: "tier-3", name: "Silver", priority: 3 } }
];

const mockCommittee = [
  { id: "comm-1", name: "Prof. Nadia Al Mansoori", role: "Conference Chair", affiliation: "Middle East Institute for Advanced Technology" },
  { id: "comm-2", name: "Dr. Rafael Stein", role: "Technical Program Chair", affiliation: "International Society for Innovation Systems" },
  { id: "comm-3", name: "Prof. Meera Iyer", role: "Publication Chair", affiliation: "Global Research Council" },
  { id: "comm-4", name: "Dr. Hassan Karim", role: "Sponsorship Chair", affiliation: "Dubai Innovation Network" }
];

const mockAgenda = [
  { id: "ag-1", title: "Opening Keynote & Registration", description: "Welcome address", startsAt: new Date("2026-12-08T09:00:00Z"), endsAt: new Date("2026-12-08T10:30:00Z"), location: "Grand Ballroom A", agendaDayId: "day-1", agendaDay: { id: "day-1", title: "Day 1 - Global Innovation Strategy", date: new Date("2026-12-08") }, session: null },
  { id: "ag-2", title: "AI and Policy Roundtable", description: "Responsible AI", startsAt: new Date("2026-12-08T11:00:00Z"), endsAt: new Date("2026-12-08T12:30:00Z"), location: "Hall 4", agendaDayId: "day-1", agendaDay: { id: "day-1", title: "Day 1 - Global Innovation Strategy", date: new Date("2026-12-08") }, session: null },
  { id: "ag-3", title: "Parallel Research Track: AI Architectures", description: "Deep learning presentations", startsAt: new Date("2026-12-09T10:00:00Z"), endsAt: new Date("2026-12-09T12:00:00Z"), location: "Room 102", agendaDayId: "day-2", agendaDay: { id: "day-2", title: "Day 2 - Research and Applied Tech", date: new Date("2026-12-09") }, session: null }
];

const mockUser = {
  id: "mock_user_id",
  clerkUserId: "mock_local_clerk_id",
  email: "admin@icgit2026.org",
  firstName: "Local",
  lastName: "Admin",
  isActive: true,
  roles: [
    {
      id: "ur-1",
      role: {
        id: "r-1",
        name: "SUPER_ADMIN",
        permissions: [
          {
            id: "rp-1",
            permission: { id: "p-1", key: "FULL_ACCESS", description: "Full Access" }
          }
        ]
      }
    }
  ],
  profile: {
    id: "prof-1",
    title: "Dr.",
    designation: "Chief Scientist",
    bio: "Research lead",
    phone: "+97140002026",
    organization: { id: "org-1", name: "Global Digital Futures Institute" }
  }
};

const mockSettings: Record<string, any> = {
  navigation_menu: [
    { label: "Home", href: "/#home" },
    { label: "Brochure", href: "/#brochure" },
    { label: "Sessions", href: "/#sessions" },
    { label: "Speakers", href: "/#speakers" },
    { label: "Venue", href: "/#venue" },
    { label: "Contact Us", href: "/#contact" }
  ],
  "registration.enabled": true
};

const mockTheme = {
  id: "theme-1",
  name: "Tech & AI",
  tokens: { primary: "124 92 255", accent: "30 213 255" },
  isActive: true
};

const mockClient: any = {
  $transaction: async (queries: any) => {
    if (Array.isArray(queries)) {
      return Promise.all(queries);
    }
    if (typeof queries === "function") {
      return queries(mockClient);
    }
    return queries;
  },
  systemSetting: {
    findFirst: async ({ where }: any) => {
      const key = where?.key;
      if (key && key in mockSettings) {
        return { id: "set-" + key, key, value: mockSettings[key] };
      }
      return null;
    }
  },
  themeSetting: {
    findFirst: async () => mockTheme
  },
  speaker: {
    findMany: async () => mockSpeakers,
    count: async () => mockSpeakers.length
  },
  track: {
    findMany: async () => mockTracks,
    count: async () => mockTracks.length
  },
  registrationPackage: {
    findMany: async () => mockPackages
  },
  country: {
    findMany: async () => mockCountries
  },
  sponsor: {
    findMany: async () => mockSponsors,
    count: async () => mockSponsors.length
  },
  committeeMember: {
    findMany: async () => mockCommittee,
    count: async () => mockCommittee.length
  },
  agendaItem: {
    findMany: async () => mockAgenda,
    count: async () => mockAgenda.length
  },
  user: {
    findFirst: async () => mockUser,
    findUnique: async () => mockUser,
    create: async ({ data }: any) => ({ ...mockUser, ...data }),
    update: async ({ data }: any) => ({ ...mockUser, ...data })
  },
  profile: {
    upsert: async ({ create }: any) => ({ ...mockUser.profile, ...create })
  },
  userRole: {
    upsert: async () => ({ id: "ur-mocked" }),
    create: async () => ({ id: "ur-mocked" })
  },
  role: {
    findFirst: async () => mockUser.roles[0].role,
    findUnique: async () => mockUser.roles[0].role,
    findUniqueOrThrow: async () => mockUser.roles[0].role
  },
  contactMessage: {
    create: async ({ data }: any) => {
      const msg = { id: "msg-" + Date.now(), ...data };
      contactMessages.push(msg);
      return msg;
    }
  },
  abstractSubmission: {
    create: async ({ data }: any) => {
      const sub = { id: "sub-" + Date.now(), status: "SUBMITTED", ...data };
      abstractSubmissions.push(sub);
      return sub;
    },
    findMany: async () => abstractSubmissions,
    update: async ({ where, data }: any) => {
      const sub = abstractSubmissions.find((s) => s.id === where?.id);
      if (sub) Object.assign(sub, data);
      return sub || { id: where?.id, ...data };
    }
  },
  registration: {
    create: async ({ data }: any) => {
      const reg = { id: "reg-" + Date.now(), status: "PENDING", ...data };
      registrations.push(reg);
      return reg;
    },
    findMany: async () => registrations,
    update: async ({ where, data }: any) => {
      const reg = registrations.find((r) => r.id === where?.id);
      if (reg) Object.assign(reg, data);
      return reg || { id: where?.id, ...data };
    }
  },
  reviewerAssignment: {
    findMany: async () => [],
    upsert: async () => ({ id: "ra-mocked" })
  },
  auditLog: {
    create: async () => ({ id: "audit-mocked" })
  }
};

export const prisma = mockClient as unknown as PrismaClient;
