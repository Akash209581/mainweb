import { NextResponse } from "next/server";
// @ts-expect-error Untyped JS module from admin portal
import { INITIAL_TRACKS, INITIAL_COMMITTEE } from "@/hansci-novum-admin-portal/app/content-defaults";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma/client";
import { invalidateCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

const SETTINGS_FILE = path.join(process.cwd(), "storage", "settings.json");

const DEFAULTS = {
  conference: {
    title: "ICGIT 2026 — International Conference on Global Innovation & Technology",
    dates: "December 8–10, 2026",
    venue: "Dubai World Trade Centre, Dubai, UAE",
    deadline: "October 1, 2026",
    supportEmail: "secretariat@icgit2026.org",
    phone: "+971 4 000 2026"
  },
  registration: {
    label: "Early-bird delegate rates",
    note: "All delegate tiers include digital proceedings and access to all hybrid tracks.",
    student: { EUR: 199, USD: 219, GBP: 179 },
    academic: { EUR: 399, USD: 439, GBP: 359 },
    industry: { EUR: 499, USD: 549, GBP: 449 }
  },
  accommodation: {
    single: { EUR: 120, USD: 135, GBP: 105 },
    double: { EUR: 160, USD: 180, GBP: 140 }
  },
  abstract: {
    minWords: 500,
    maxWords: 600,
    maxFileMB: 5
  },
  policies: {
    privacy:
      "Your personal details will be processed exclusively for conference management, registration, and certification in compliance with international privacy protocols.",
    terms:
      "All accepted abstracts are subject to double-blind scientific committee review and presentation requirements."
  },
  assets: {},
  tracks: INITIAL_TRACKS,
  committee: INITIAL_COMMITTEE,
  speakers: [],
  sections: []
};

export async function GET() {
  let settings: any = { ...DEFAULTS };
  let version = "v1.0";

  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
      settings = {
        ...DEFAULTS,
        ...data,
        conference: { ...DEFAULTS.conference, ...(data.conference || {}) },
        registration: { ...DEFAULTS.registration, ...(data.registration || {}) },
        accommodation: { ...DEFAULTS.accommodation, ...(data.accommodation || {}) },
        abstract: { ...DEFAULTS.abstract, ...(data.abstract || {}) },
        policies: { ...DEFAULTS.policies, ...(data.policies || {}) },
        assets: { ...(data.assets || {}) },
        tracks: data.tracks || DEFAULTS.tracks,
        committee: data.committee || DEFAULTS.committee,
        speakers: data.speakers || [],
        sections: data.sections || []
      };
      version = "v1." + fs.statSync(SETTINGS_FILE).mtimeMs;
    } catch {}
  }

  try {
    const conference = await prisma.conference.findFirst({
      where: {
        slug: {
          equals: process.env.PUBLIC_CONFERENCE_SLUG || "icgit-2026",
          mode: "insensitive"
        },
        deletedAt: null
      },
      include: { settings: true }
    });
    if (conference) {
      const merged: Record<string, any> = { ...settings };
      const keys: Record<string, string> = {
        conference_display: "conference",
        registration_pricing: "registration",
        accommodation_pricing: "accommodation",
        abstract_settings: "abstract",
        policies: "policies",
        scientific_tracks: "tracks",
        organizing_committee: "committee",
        document_assets: "assets",
        approved_page_copy: "pageCopy"
      };
      for (const row of conference.settings) {
        const key = keys[row.key];
        if (key)
          merged[key] = Array.isArray(row.value)
            ? row.value
            : { ...merged[key], ...(row.value as object) };
      }
      merged.pricing = {
        ...merged.registration,
        accommodation: merged.registration.accommodation || merged.accommodation
      };
      merged.accommodation = merged.pricing.accommodation;
      merged.abstractSettings = {
        ...merged.abstract,
        maxFileSizeMb: merged.abstract.maxFileSizeMb ?? merged.abstract.maxFileMB
      };
      for (const key of ["tracks", "committee"]) {
        if (Array.isArray(merged[key])) {
          merged[key] = merged[key].filter((item: any) => item.published !== false);
        }
      }
      settings = merged;
      version =
        conference.settings
          .map((row) => row.updatedAt.toISOString())
          .sort()
          .pop() || version;
    }
  } catch {
    // Retain local settings read fallback
  }

  return NextResponse.json(
    { settings, version },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PUT(request: Request): Promise<Response>;
export async function PUT(): Promise<Response>;
export async function PUT(request?: Request): Promise<Response> {
  if (!request) {
    return NextResponse.json(
      { error: "Use the authenticated conference admin to publish settings." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const incomingSettings = body?.settings;
    if (!incomingSettings || typeof incomingSettings !== "object") {
      return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
    }

    const storageDir = path.join(process.cwd(), "storage");
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    let current: Record<string, any> = { ...DEFAULTS };
    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        current = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
      } catch {}
    }

    const merged = {
      ...current,
      ...incomingSettings,
      conference: { ...(current.conference || DEFAULTS.conference), ...(incomingSettings.conference || {}) },
      registration: { ...(current.registration || DEFAULTS.registration), ...(incomingSettings.registration || {}) },
      accommodation: { ...(current.accommodation || DEFAULTS.accommodation), ...(incomingSettings.accommodation || {}) },
      abstract: { ...(current.abstract || DEFAULTS.abstract), ...(incomingSettings.abstract || {}) },
      policies: { ...(current.policies || DEFAULTS.policies), ...(incomingSettings.policies || {}) },
      assets: { ...(current.assets || {}), ...(incomingSettings.assets || {}) },
      tracks: incomingSettings.tracks ?? current.tracks ?? DEFAULTS.tracks,
      committee: incomingSettings.committee ?? current.committee ?? DEFAULTS.committee,
      speakers: incomingSettings.speakers ?? current.speakers ?? [],
      sections: incomingSettings.sections ?? current.sections ?? []
    };

    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), "utf8");

    // Invalidate memory cache so updates appear instantly on live website
    invalidateCache();

    // Optionally update database if available
    try {
      const conference = await prisma.conference.findFirst({
        where: {
          slug: {
            equals: process.env.PUBLIC_CONFERENCE_SLUG || "icgit-2026",
            mode: "insensitive"
          },
          deletedAt: null
        }
      });
      if (conference && incomingSettings.conference?.title) {
        await prisma.conference.update({
          where: { id: conference.id },
          data: { fullName: incomingSettings.conference.title }
        });
      }
    } catch {}

    const version = "v1." + Date.now();
    return NextResponse.json({ ok: true, version });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const kind = formData.get("kind") as string;
    const file = formData.get("file") as File | null;

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let current: Record<string, any> = { ...DEFAULTS };
    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        current = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
      } catch {}
    }

    if (kind === "brochure" || kind === "sampleAbstract") {
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "conference-documents");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const filePath = path.join(uploadsDir, safeName);
      fs.writeFileSync(filePath, buffer);

      if (!current.assets) current.assets = {};
      current.assets[kind] = {
        fileName: file.name,
        storageKey: safeName,
        url: `/uploads/conference-documents/${safeName}`
      };

      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(current, null, 2), "utf8");
      invalidateCache();

      return NextResponse.json({
        ok: true,
        version: "v1." + Date.now(),
        asset: current.assets[kind]
      });
    }

    if (kind === "committeePhoto") {
      const memberId = formData.get("memberId") as string;
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "committee");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const safeName = `${memberId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const filePath = path.join(uploadsDir, safeName);
      fs.writeFileSync(filePath, buffer);

      const photoObj = {
        fileName: file.name,
        key: safeName,
        url: `/uploads/committee/${safeName}`
      };

      if (Array.isArray(current.committee)) {
        current.committee = current.committee.map((m: any) =>
          m.id === memberId ? { ...m, photo: photoObj } : m
        );
      }

      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(current, null, 2), "utf8");
      invalidateCache();

      return NextResponse.json({
        ok: true,
        version: "v1." + Date.now(),
        photo: photoObj
      });
    }

    if (kind === "speakerPhoto") {
      const speakerId = formData.get("speakerId") as string;
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "speakers");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const safeName = `${speakerId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const filePath = path.join(uploadsDir, safeName);
      fs.writeFileSync(filePath, buffer);

      const photoObj = {
        fileName: file.name,
        key: safeName,
        url: `/uploads/speakers/${safeName}`
      };

      if (Array.isArray(current.speakers)) {
        current.speakers = current.speakers.map((s: any) =>
          s.id === speakerId ? { ...s, photo: photoObj } : s
        );
      }

      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(current, null, 2), "utf8");
      invalidateCache();

      return NextResponse.json({
        ok: true,
        version: "v1." + Date.now(),
        photo: photoObj
      });
    }

    return NextResponse.json({ error: "Unsupported upload kind" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
