import { NextResponse } from "next/server";
// @ts-expect-error Untyped JS module from admin portal
import { INITIAL_TRACKS, INITIAL_COMMITTEE } from "@/hansci-novum-admin-portal/app/content-defaults";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

const SETTINGS_FILE = path.join(process.cwd(), "storage", "settings.json");

const DEFAULTS = {
  conference: {
    title: "ICGIT 2026 — International Conference on Global Innovation & Technology",
    dates: "December 8–10, 2026",
    venue: "Dubai World Trade Centre, Dubai, UAE",
    deadline: "October 1, 2026",
    supportEmail: "secretariat@icgit2026.org"
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
  committee: INITIAL_COMMITTEE
};

export async function GET() {
  let settings = DEFAULTS;
  let version = "v1.0";

  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
      settings = { ...DEFAULTS, ...data };
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
      // Prefer canonical database values over older local-file aliases.
      merged.pricing = {
        ...merged.registration,
        accommodation: merged.registration.accommodation || merged.accommodation
      };
      merged.accommodation = merged.pricing.accommodation;
      merged.abstractSettings = {
        ...merged.abstract,
        maxFileSizeMb: merged.abstract.maxFileSizeMb ?? merged.abstract.maxFileMB
      };
      for (const key of ["tracks", "committee"])
        if (Array.isArray(merged[key]))
          merged[key] = merged[key].filter((item: any) => item.published !== false);
      settings = merged as typeof DEFAULTS;
      version =
        conference.settings
          .map((row) => row.updatedAt.toISOString())
          .sort()
          .pop() || version;
    }
  } catch {
    // Retain the existing local/default read fallback while the database is unavailable.
  }
  return NextResponse.json(
    { settings, version },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Use the authenticated conference admin to publish settings." },
    { status: 403 }
  );
}
