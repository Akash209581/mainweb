import {
  AttendanceMode,
  ConferenceMode,
  PermissionKey,
  PrismaClient,
  RoleName
} from "@prisma/client";

const prisma = new PrismaClient();

const rolePermissions: Record<RoleName, PermissionKey[]> = {
  GUEST: [
    PermissionKey.BROWSE_WEBSITE,
    PermissionKey.REGISTER,
    PermissionKey.SUBMIT_CONTACT_FORM
  ],
  AUTHOR: [
    PermissionKey.BROWSE_WEBSITE,
    PermissionKey.REGISTER,
    PermissionKey.SUBMIT_CONTACT_FORM,
    PermissionKey.SUBMIT_ABSTRACT,
    PermissionKey.EDIT_OWN_SUBMISSION,
    PermissionKey.UPLOAD_FINAL_PAPER,
    PermissionKey.DOWNLOAD_ACCEPTANCE_LETTER
  ],
  REVIEWER: [
    PermissionKey.BROWSE_WEBSITE,
    PermissionKey.VIEW_ASSIGNED_PAPERS,
    PermissionKey.SUBMIT_REVIEW
  ],
  COMMITTEE_MEMBER: [
    PermissionKey.BROWSE_WEBSITE,
    PermissionKey.MANAGE_ASSIGNED_TRACKS
  ],
  SPONSOR: [
    PermissionKey.BROWSE_WEBSITE,
    PermissionKey.REGISTER,
    PermissionKey.SUBMIT_CONTACT_FORM
  ],
  ADMIN: [
    PermissionKey.BROWSE_WEBSITE,
    PermissionKey.MANAGE_CONFERENCE_CONTENT,
    PermissionKey.MANAGE_SPEAKERS,
    PermissionKey.MANAGE_SPONSORS,
    PermissionKey.MANAGE_AGENDA,
    PermissionKey.APPROVE_SUBMISSIONS,
    PermissionKey.MANAGE_REGISTRATIONS,
    PermissionKey.MANAGE_USERS,
    PermissionKey.MANAGE_SETTINGS
  ],
  SUPER_ADMIN: [PermissionKey.FULL_ACCESS]
};

async function seedRolesAndPermissions() {
  const permissions = await Promise.all(
    Object.values(PermissionKey).map((key) =>
      prisma.permission.upsert({
        where: { key },
        update: {},
        create: {
          key,
          description: key
            .toLowerCase()
            .split("_")
            .map((part) => part[0]?.toUpperCase() + part.slice(1))
            .join(" ")
        }
      })
    )
  );

  const permissionByKey = new Map(permissions.map((permission) => [permission.key, permission]));

  for (const roleName of Object.values(RoleName)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: roleName
          .toLowerCase()
          .split("_")
          .map((part) => part[0]?.toUpperCase() + part.slice(1))
          .join(" ")
      }
    });

    for (const permissionKey of rolePermissions[roleName]) {
      const permission = permissionByKey.get(permissionKey);
      if (!permission) {
        continue;
      }
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id
        }
      });
    }
  }
}

async function seedConference() {
  const countriesData = [
    { iso2: "AE", name: "United Arab Emirates" },
    { iso2: "US", name: "United States" },
    { iso2: "GB", name: "United Kingdom" },
    { iso2: "IN", name: "India" },
    { iso2: "SA", name: "Saudi Arabia" },
    { iso2: "CA", name: "Canada" },
    { iso2: "AU", name: "Australia" },
    { iso2: "DE", name: "Germany" },
    { iso2: "FR", name: "France" },
    { iso2: "JP", name: "Japan" },
    { iso2: "SG", name: "Singapore" },
    { iso2: "QA", name: "Qatar" },
    { iso2: "OM", name: "Oman" },
    { iso2: "KW", name: "Kuwait" },
    { iso2: "BH", name: "Bahrain" },
    { iso2: "EG", name: "Egypt" },
    { iso2: "ZA", name: "South Africa" },
    { iso2: "MY", name: "Malaysia" },
    { iso2: "KR", name: "South Korea" },
    { iso2: "CH", name: "Switzerland" },
    { iso2: "NL", name: "Netherlands" },
    { iso2: "IT", name: "Italy" },
    { iso2: "ES", name: "Spain" },
    { iso2: "BR", name: "Brazil" },
    { iso2: "CN", name: "China" }
  ];

  await prisma.country.createMany({
    data: countriesData,
    skipDuplicates: true
  });

  const country = await prisma.country.findUniqueOrThrow({
    where: { iso2: "AE" }
  });

  const venue = await prisma.venue.upsert({
    where: { id: "00000000-0000-0000-0000-000000000101" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000101",
      name: "Dubai World Trade Centre",
      address: "Sheikh Zayed Road",
      city: "Dubai",
      countryId: country.id,
      description: "Premium international venue for hybrid conference programming."
    }
  });

  const conference = await prisma.conference.upsert({
    where: { slug: "icgit-2026" },
    update: { venueId: venue.id },
    create: {
      name: "ICGIT 2026",
      slug: "icgit-2026",
      fullName: "International Conference on Global Innovation and Technology 2026",
      description:
        "Hybrid conference for global innovation, research, technology leadership, and public-private collaboration.",
      startDate: new Date("2026-12-08T09:00:00+04:00"),
      endDate: new Date("2026-12-10T18:00:00+04:00"),
      mode: ConferenceMode.HYBRID,
      venueId: venue.id
    }
  });

  const tracks = [
    ["ai-systems", "AI Systems"],
    ["smart-cities", "Smart Cities"],
    ["digital-health", "Digital Health"],
    ["fintech", "FinTech"]
  ] as const;

  for (const [slug, name] of tracks) {
    await prisma.track.upsert({
      where: { conferenceId_slug: { conferenceId: conference.id, slug } },
      update: {},
      create: { conferenceId: conference.id, slug, name }
    });
  }

  const tierNames = ["Platinum", "Gold", "Silver"];
  for (const [index, name] of tierNames.entries()) {
    await prisma.sponsorTier.upsert({
      where: { name },
      update: { priority: index + 1 },
      create: { name, priority: index + 1 }
    });
  }

  await prisma.registrationPackage.createMany({
    data: [
      {
        conferenceId: conference.id,
        name: "Onsite Delegate",
        attendanceMode: AttendanceMode.ONSITE,
        priceCents: 69900
      },
      {
        conferenceId: conference.id,
        name: "Virtual Delegate",
        attendanceMode: AttendanceMode.VIRTUAL,
        priceCents: 29900
      }
    ],
    skipDuplicates: true
  });

  await prisma.systemSetting.upsert({
    where: {
      conferenceId_key: {
        conferenceId: conference.id,
        key: "registration.enabled"
      }
    },
    update: { value: true },
    create: {
      conferenceId: conference.id,
      key: "registration.enabled",
      value: true
    }
  });

  await prisma.themeSetting.createMany({
    data: [
      {
        conferenceId: conference.id,
        name: "Tech & AI",
        tokens: { primary: "124 92 255", accent: "30 213 255" },
        isActive: true
      },
      {
        conferenceId: conference.id,
        name: "Health & Bio",
        tokens: { primary: "45 212 191", accent: "110 231 183" },
        isActive: false
      },
      {
        conferenceId: conference.id,
        name: "Corporate",
        tokens: { primary: "37 99 235", accent: "125 211 252" },
        isActive: false
      }
    ],
    skipDuplicates: true
  });
}

async function seedSpeakersCommitteeSponsors() {
  const conference = await prisma.conference.findUniqueOrThrow({
    where: { slug: "icgit-2026" }
  });

  const orgsData = [
    { name: "Global Digital Futures Institute", type: "Research" },
    { name: "European Institute of Technology", type: "Academic" },
    { name: "Pacific BioSystems Lab", type: "Research" },
    { name: "Dubai Enterprise Technology Council", type: "Government" },
    { name: "Middle East Institute for Advanced Technology", type: "Academic" },
    { name: "International Society for Innovation Systems", type: "Non-profit" },
    { name: "Global Research Council", type: "Academic" },
    { name: "Dubai Innovation Network", type: "Industry" },
    { name: "AstraGrid Technologies", type: "Corporate" },
    { name: "Nexus Cloud Systems", type: "Corporate" },
    { name: "Verde Mobility Labs", type: "Corporate" },
    { name: "HelioMed Analytics", type: "Corporate" }
  ];

  const orgByName = new Map<string, string>();
  for (const orgData of orgsData) {
    let org = await prisma.organization.findFirst({ where: { name: orgData.name } });
    if (!org) {
      org = await prisma.organization.create({ data: orgData });
    }
    orgByName.set(orgData.name, org.id);
  }

  const speakersData = [
    {
      name: "Dr. Amina Rahman",
      role: "Chief AI Scientist",
      orgName: "Global Digital Futures Institute",
      topic: "Responsible AI for borderless innovation ecosystems",
      bio: "Dr. Amina Rahman is a pioneering computer scientist focusing on responsible artificial intelligence, neural model safety, and cross-border research collaborations.",
      isFeatured: true
    },
    {
      name: "Prof. Lucas Meyer",
      role: "Chair of Smart Systems",
      orgName: "European Institute of Technology",
      topic: "Resilient infrastructure for intelligent cities",
      bio: "Prof. Lucas Meyer leads research in responsive sensory networks, vehicle-to-everything (V2X) communications, and intelligent municipal grids.",
      isFeatured: true
    },
    {
      name: "Dr. Sofia Chen",
      role: "Director of Health Innovation",
      orgName: "Pacific BioSystems Lab",
      topic: "Translational technology in digital health",
      bio: "Dr. Sofia Chen specializes in clinical bioinformatics, sequence analysis pipelines, and neural assist models for automated diagnostic environments.",
      isFeatured: true
    },
    {
      name: "Eng. Omar Al Nuaimi",
      role: "Innovation Strategy Lead",
      orgName: "Dubai Enterprise Technology Council",
      topic: "Scaling public-private innovation in the Gulf",
      bio: "Eng. Omar Al Nuaimi coordinates municipal innovation strategies, enterprise partnerships, and VC alignments within the UAE tech hub.",
      isFeatured: true
    }
  ];

  for (const speaker of speakersData) {
    const orgId = orgByName.get(speaker.orgName);
    const existing = await prisma.speaker.findFirst({
      where: { name: speaker.name, conferenceId: conference.id }
    });
    if (!existing) {
      await prisma.speaker.create({
        data: {
          conferenceId: conference.id,
          organizationId: orgId,
          name: speaker.name,
          role: speaker.role,
          topic: speaker.topic,
          bio: speaker.bio,
          isFeatured: speaker.isFeatured
        }
      });
    }
  }

  const committeeData = [
    {
      name: "Prof. Nadia Al Mansoori",
      role: "Honorary Chair",
      affiliation: "Middle East Institute for Advanced Technology",
      orgName: "Middle East Institute for Advanced Technology",
      email: "nadia.almansoori@meiat.ac.ae"
    },
    {
      name: "Dr. Rafael Stein",
      role: "General Chair",
      affiliation: "International Society for Innovation Systems",
      orgName: "International Society for Innovation Systems",
      email: "rafael.stein@isis.org"
    },
    {
      name: "Prof. Meera Iyer",
      role: "Program Chair",
      affiliation: "Global Research Council",
      orgName: "Global Research Council",
      email: "meera.iyer@grc.edu"
    },
    {
      name: "Dr. Hassan Karim",
      role: "Organizing Committee",
      affiliation: "Dubai Innovation Network",
      orgName: "Dubai Innovation Network",
      email: "hassan.karim@din.org"
    },
    {
      name: "Dr. Elena Petrova",
      role: "Technical Committee",
      affiliation: "Sofia University of Science",
      orgName: "European Institute of Technology",
      email: "elena.petrova@sus.bg"
    },
    {
      name: "Prof. Kenji Sato",
      role: "International Advisory Board",
      affiliation: "Tokyo Advanced Science Institute",
      orgName: "Global Research Council",
      email: "kenji.sato@tasi.jp"
    }
  ];

  for (const member of committeeData) {
    const orgId = orgByName.get(member.orgName);
    const existing = await prisma.committeeMember.findFirst({
      where: { name: member.name, conferenceId: conference.id }
    });
    if (!existing) {
      await prisma.committeeMember.create({
        data: {
          conferenceId: conference.id,
          organizationId: orgId,
          name: member.name,
          role: member.role,
          affiliation: member.affiliation,
          email: member.email
        }
      });
    }
  }

  const platinumTier = await prisma.sponsorTier.findUniqueOrThrow({ where: { name: "Platinum" } });
  const goldTier = await prisma.sponsorTier.findUniqueOrThrow({ where: { name: "Gold" } });
  const silverTier = await prisma.sponsorTier.findUniqueOrThrow({ where: { name: "Silver" } });

  const sponsorsData = [
    {
      name: "AstraGrid Technologies",
      tierId: platinumTier.id,
      orgName: "AstraGrid Technologies",
      focus: "Enterprise AI platforms"
    },
    {
      name: "Nexus Cloud Systems",
      tierId: goldTier.id,
      orgName: "Nexus Cloud Systems",
      focus: "Secure hybrid cloud"
    },
    {
      name: "Verde Mobility Labs",
      tierId: goldTier.id,
      orgName: "Verde Mobility Labs",
      focus: "Sustainable transport"
    },
    {
      name: "HelioMed Analytics",
      tierId: silverTier.id,
      orgName: "HelioMed Analytics",
      focus: "Digital health intelligence"
    }
  ];

  for (const sponsor of sponsorsData) {
    const orgId = orgByName.get(sponsor.orgName);
    const existing = await prisma.sponsor.findFirst({
      where: { name: sponsor.name, conferenceId: conference.id }
    });
    if (!existing) {
      await prisma.sponsor.create({
        data: {
          conferenceId: conference.id,
          sponsorTierId: sponsor.tierId,
          organizationId: orgId,
          name: sponsor.name,
          focus: sponsor.focus
        }
      });
    }
  }

  const day1 = await prisma.agendaDay.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      conferenceId: conference.id,
      title: "Day 1 - Global Innovation Strategy",
      date: new Date("2026-12-08T00:00:00Z"),
      sortOrder: 1
    }
  });

  const day2 = await prisma.agendaDay.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      conferenceId: conference.id,
      title: "Day 2 - Research and Applied Tech",
      date: new Date("2026-12-09T00:00:00Z"),
      sortOrder: 2
    }
  });

  const day3 = await prisma.agendaDay.upsert({
    where: { id: "00000000-0000-0000-0000-000000000003" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000003",
      conferenceId: conference.id,
      title: "Day 3 - Future Partnerships",
      date: new Date("2026-12-10T00:00:00Z"),
      sortOrder: 3
    }
  });

  const agendaItems = [
    {
      agendaDayId: day1.id,
      title: "Opening Keynote & Registration",
      description: "Welcome address and registration details.",
      startsAt: new Date("2026-12-08T09:00:00Z"),
      endsAt: new Date("2026-12-08T10:30:00Z"),
      location: "Grand Ballroom A",
      sortOrder: 1
    },
    {
      agendaDayId: day1.id,
      title: "AI and Policy Roundtable",
      description: "Responsible AI deployments globally.",
      startsAt: new Date("2026-12-08T11:00:00Z"),
      endsAt: new Date("2026-12-08T12:30:00Z"),
      location: "Hall 4",
      sortOrder: 2
    },
    {
      agendaDayId: day2.id,
      title: "Parallel Research Track: AI Architectures",
      description: "Presentations of accepted abstract papers on deep learning.",
      startsAt: new Date("2026-12-09T10:00:00Z"),
      endsAt: new Date("2026-12-09T12:00:00Z"),
      location: "Room 102",
      sortOrder: 1
    },
    {
      agendaDayId: day2.id,
      title: "Smart Cities Sensory Tech",
      description: "Sensory grid alignments and IoT deployments.",
      startsAt: new Date("2026-12-09T14:00:00Z"),
      endsAt: new Date("2026-12-09T15:30:00Z"),
      location: "Room 104",
      sortOrder: 2
    },
    {
      agendaDayId: day3.id,
      title: "Future Partnerships Plenary",
      description: "Public-private tech initiatives for scaling Gulf innovation.",
      startsAt: new Date("2026-12-10T10:00:00Z"),
      endsAt: new Date("2026-12-10T12:00:00Z"),
      location: "Grand Ballroom A",
      sortOrder: 1
    }
  ];

  for (const item of agendaItems) {
    const existing = await prisma.agendaItem.findFirst({
      where: { title: item.title, agendaDayId: item.agendaDayId }
    });
    if (!existing) {
      await prisma.agendaItem.create({ data: item });
    }
  }
}

async function main() {
  await seedRolesAndPermissions();
  await seedConference();
  await seedSpeakersCommitteeSponsors();
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

