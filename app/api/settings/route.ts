import { NextResponse } from "next/server";
// @ts-expect-error Untyped JS module from admin portal
import { INITIAL_TRACKS, INITIAL_COMMITTEE } from "@/hansci-novum-admin-portal/app/content-defaults";
import fs from "fs";
import path from "path";

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
    privacy: "Your personal details will be processed exclusively for conference management, registration, and certification in compliance with international privacy protocols.",
    terms: "All accepted abstracts are subject to double-blind scientific committee review and presentation requirements."
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

  return NextResponse.json({ settings, version });
}

export async function PUT(request: Request) {
  try {
    const { settings } = await request.json();
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf8");
    return NextResponse.json({ ok: true, version: "v1." + Date.now() });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to save settings";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
