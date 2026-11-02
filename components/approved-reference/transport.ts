"use client";

import { submitHansciRegistrationAction } from "@/actions/registration.actions";
import { submitHansciAbstractAction } from "@/actions/abstract.actions";
import {
  submitBrochureRequestAction,
  submitConferenceQueryAction
} from "@/actions/contact.actions";

const basePath = "/ICGIT";

/** Translate reference form requests without changing any existing API contract. */
export async function referenceFetch(
  input: string,
  init?: RequestInit
): Promise<Response> {
  if (input === "/api/settings") {
    const response = await fetch(basePath + input, init);
    if (!response.ok) return response;
    const data = await response.json();
    const settings = data.settings;
    // The existing editor stores these under different keys than the reference.
    if (settings.pricing) {
      settings.registration = { ...settings.registration, ...settings.pricing };
      settings.accommodation = settings.pricing.accommodation || settings.accommodation;
    }
    if (settings.abstractSettings)
      settings.abstract = {
        ...settings.abstract,
        ...settings.abstractSettings,
        maxFileMB: settings.abstractSettings.maxFileSizeMb ?? settings.abstract.maxFileMB
      };
    for (const key of ["tracks", "committee"]) {
      if (Array.isArray(settings[key]))
        settings[key] = settings[key].map((item: Record<string, unknown>) => ({
          ...item,
          published: item.published !== false
        }));
    }
    return Response.json(data);
  }
  if (input === "/api/records" && init?.method === "POST") {
    const body = init.body as FormData;
    const kind = String(body.get("kind"));
    const payload = JSON.parse(String(body.get("payload")));
    let result;
    if (kind === "registration") {
      const stay = payload.category === "accommodation" || payload.stay === "on";
      const invoice = payload.invoice === "on";
      result = await submitHansciRegistrationAction({
        ...payload,
        conferenceSlug: "icgit-2026",
        fullName: `${payload.first} ${payload.last}`.trim(),
        organization: payload.institution,
        package: payload.exhibition || payload.sponsorship || undefined,
        stay,
        invoice,
        terms: payload.acceptTerms === "on",
        checkin: stay ? payload.checkin : undefined,
        checkout: stay ? payload.checkout : undefined,
        billingOrg: invoice ? payload.billingOrg : undefined,
        address: invoice ? payload.address : undefined
      });
    } else if (kind === "abstract") {
      // The existing action stores attachment metadata only. Do not invent a
      // document API or alter the schema to emulate the separate reference backend.
      const file = body.get("document") as File | null;
      result = await submitHansciAbstractAction({
        ...payload,
        coAuthors: payload.authors,
        fileName: file?.name,
        fileSize: file?.size
      });
    } else if (kind === "brochure") {
      result = await submitBrochureRequestAction(payload);
    } else if (kind === "query") {
      result = await submitConferenceQueryAction(payload);
    } else {
      return Response.json({ error: "Unsupported submission kind" }, { status: 400 });
    }
    return Response.json(result.ok ? result : { error: result.message }, {
      status: result.ok ? 200 : 400
    });
  }
  return fetch(input.startsWith("/api/") ? basePath + input : input, init);
}

/** Keep the existing canonical routes, including the track query parameter. */
export function referenceHref(href: string): string {
  if (/^(https?:|mailto:|tel:|data:|blob:|#)/.test(href)) return href;
  const split = href.search(/[?#]/);
  const path = split < 0 ? href : href.slice(0, split);
  const suffix = split < 0 ? "" : href.slice(split);
  const routes: Record<string, string> = {
    "": "registration",
    ".": "registration",
    "./": "registration",
    "../": "registration",
    "/": "registration",
    "/index.html": "registration",
    "index.html": "registration",
    "abstract.html": "abstracts",
    "../abstract.html": "abstracts",
    "brochure/": "brochure",
    "../brochure/": "brochure",
    "scientific-tracks/": "sessions",
    "../scientific-tracks/": "sessions",
    "organizing-committee/": "committee",
    "../organizing-committee/": "committee",
    "/admin": "admin"
  };
  if (path in routes) return `${basePath}/${routes[path]}${suffix}`;
  if (path === "sample-abstract.txt")
    return `${basePath}/approved-reference/sample-abstract.txt${suffix}`;
  if (path.startsWith("/api/")) return basePath + href;
  return href;
}
