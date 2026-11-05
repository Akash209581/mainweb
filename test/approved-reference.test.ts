import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { source as registration } from "../components/approved-reference/registration-source";
import { source as abstracts } from "../components/approved-reference/abstracts-source";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { HtmlReferencePage } from "../components/approved-reference/html-page";

vi.mock("@/actions/registration.actions", () => ({
  submitHansciRegistrationAction: vi.fn()
}));
vi.mock("@/actions/abstract.actions", () => ({ submitHansciAbstractAction: vi.fn() }));
vi.mock("@/actions/contact.actions", () => ({
  submitBrochureRequestAction: vi.fn(),
  submitConferenceQueryAction: vi.fn()
}));
import { submitHansciRegistrationAction } from "@/actions/registration.actions";
import { submitHansciAbstractAction } from "@/actions/abstract.actions";
import {
  referenceFetch,
  referenceHref
} from "../components/approved-reference/transport";

describe("approved reference fidelity", () => {
  it("keeps entered values when a server refresh serializes equivalent page props", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const element = document.createElement("div");
    document.body.append(element);
    const root = createRoot(element);
    const fixture = { markup: '<input name="first"><select id="country"></select>', css: "", script: "" };
    try {
      await act(async () => root.render(createElement(HtmlReferencePage, { source: { ...fixture }, countries: ["India"] })));
      const shadow = element.querySelector("div")!.shadowRoot!;
      shadow.querySelector<HTMLInputElement>("input")!.value = "Draft participant";
      shadow.querySelector<HTMLSelectElement>("select")!.value = "India";
      await act(async () => root.render(createElement(HtmlReferencePage, { source: { ...fixture }, countries: ["India"] })));
      expect(shadow.querySelector<HTMLInputElement>("input")!.value).toBe("Draft participant");
      expect(shadow.querySelector<HTMLSelectElement>("select")!.value).toBe("India");
    } finally {
      await act(async () => root.unmount());
      element.remove();
      vi.unstubAllGlobals();
    }
  });
  for (const [file, source] of [
    ["index.html", registration],
    ["abstract.html", abstracts]
  ] as const) {
    it(`preserves the complete ${file} markup, CSS and script`, () => {
      const html = readFileSync(`Hansci_Novum/user-website/public/${file}`, "utf8");
      const body = html.match(/<body>([\s\S]*?)<\/body>/)![1];
      expect(source.markup).toBe(body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, ""));
      expect(source.css).toBe(
        [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n")
      );
      expect(source.script).toBe(
        [...body.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n") +
          "\n" +
          readFileSync("Hansci_Novum/user-website/public/site-content.js", "utf8")
      );
    });
  }
  for (const [name, slug] of [
    ["brochure", "brochure"],
    ["sessions", "scientific-tracks"],
    ["committee", "organizing-committee"]
  ]) {
    it(`preserves every ${name} JSX string and stylesheet`, () => {
      const folder = `Hansci_Novum/user-website/editable-page-sources/${slug}/app`;
      const original = readFileSync(`${folder}/page.jsx`, "utf8");
      const integrated = readFileSync(
        `components/approved-reference/${name}-design.tsx`,
        "utf8"
      )
        .replace(/^\/\/ @ts-nocheck[^\n]*\n/, "")
        .replace("\nimport {referenceFetch as fetch} from './transport';", "")
        .replace("\nimport {useReferenceDocument} from './surface';", "")
        .replace("\n const document=useReferenceDocument();", "");
      expect(integrated).toBe(original);
      const style = readFileSync(
        `components/approved-reference/${name}-style.ts`,
        "utf8"
      );
      expect(
        JSON.parse(
          style
            .slice(style.indexOf("=") + 1)
            .trim()
            .slice(0, -1)
        )
      ).toBe(readFileSync(`${folder}/globals.css`, "utf8"));
    });
  }
});

describe("existing submission boundaries", () => {
  beforeEach(() => vi.clearAllMocks());
  it("retains the existing editor's price, upload-limit and publication settings", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        settings: {
          registration: { student: { EUR: 199 } },
          accommodation: {},
          abstract: { maxFileMB: 5 },
          pricing: { student: { EUR: 250 }, accommodation: { single: { EUR: 150 } } },
          abstractSettings: { minWords: 250, maxWords: 500, maxFileSizeMb: 3 },
          tracks: [{ name: "Published by default" }, { name: "Hidden", published: false }]
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    try {
      const { settings } = await (await referenceFetch("/api/settings")).json();
      expect(fetchMock).toHaveBeenCalledWith("/ICGIT/api/settings", undefined);
      expect(settings.registration.student.EUR).toBe(250);
      expect(settings.accommodation.single.EUR).toBe(150);
      expect(settings.abstract).toMatchObject({
        minWords: 250,
        maxWords: 500,
        maxFileMB: 3
      });
      expect(
        settings.tracks.map((track: { published: boolean }) => track.published)
      ).toEqual([true, false]);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("maps reference terms, invoice, accommodation and partnership fields to the existing action", async () => {
    vi.mocked(submitHansciRegistrationAction).mockResolvedValue({
      ok: true,
      message: "Saved"
    });
    const body = new FormData();
    body.set("kind", "registration");
    body.set(
      "payload",
      JSON.stringify({
        first: "A",
        last: "Researcher",
        institution: "University",
        category: "exhibition",
        exhibition: "Tabletop display",
        stay: "on",
        invoice: "on",
        acceptTerms: "on"
      })
    );
    const response = await referenceFetch("/api/records", { method: "POST", body });
    expect(response.ok).toBe(true);
    expect(submitHansciRegistrationAction).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: "A Researcher",
        organization: "University",
        package: "Tabletop display",
        stay: true,
        invoice: true,
        terms: true
      })
    );
  });
  it("retains co-authors and sends the actual attachment for validated persistence", async () => {
    vi.mocked(submitHansciAbstractAction).mockResolvedValue({
      ok: true,
      message: "Saved"
    });
    const body = new FormData();
    const authors = [{ name: "Coauthor", affiliation: "University" }];
    body.set("kind", "abstract");
    body.set("payload", JSON.stringify({ authors }));
    body.set(
      "document",
      new File(["example"], "abstract.pdf", { type: "application/pdf" })
    );
    await referenceFetch("/api/records", { method: "POST", body });
    expect(submitHansciAbstractAction).toHaveBeenCalledWith(
      expect.objectContaining({
        coAuthors: authors,
        fileName: "abstract.pdf",
        fileSize: 7
      }), expect.any(File)
    );
  });
  it("returns action failures to the existing reference error UI", async () => {
    vi.mocked(submitHansciRegistrationAction).mockResolvedValue({
      ok: false,
      message: "Try again later"
    });
    const body = new FormData();
    body.set("kind", "registration");
    body.set("payload", "{}");
    const response = await referenceFetch("/api/records", { method: "POST", body });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Try again later" });
  });
  it("preserves track queries and fragment/external links", () => {
    expect(referenceHref("../abstract.html?track=AI%20%26%20Data")).toBe(
      "/ICGIT/abstracts?track=AI%20%26%20Data"
    );
    expect(referenceHref("#guidelines")).toBe("#guidelines");
    expect(referenceHref("https://hanscinovum.com")).toBe("https://hanscinovum.com");
  });
});
