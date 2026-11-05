import { File as NodeFile } from "node:buffer";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const { conference, settings, create, audit } = vi.hoisted(() => ({
  conference: vi.fn(),
  settings: vi.fn(),
  create: vi.fn(),
  audit: vi.fn()
}));
vi.mock("@/lib/prisma/client", () => ({
  prisma: {
    conference: { findFirst: conference },
    systemSetting: { findMany: settings },
    $transaction: (fn: any) =>
      fn({ publicAbstractSubmission: { create }, auditLog: { create: audit } })
  }
}));
import { savePublicAbstract } from "../lib/services/public-abstract.service";
const payload = {
  first: "Ana",
  last: "Doe",
  email: "ana@example.test",
  phone: "+919876543210",
  institution: "University",
  country: "India",
  title: "A valid research contribution",
  track: "Other",
  presentation: "Oral presentation",
  coAuthors: [{ name: "Co Author", affiliation: "Institute" }],
  authorsConsent: true,
  ethics: true,
  terms: true
};
describe("public abstract persistence", () => {
  beforeEach(() => {
    vi.stubGlobal("File", NodeFile);
    conference.mockReset();
    settings.mockReset();
    create.mockReset();
    audit.mockReset();
    conference.mockResolvedValue({ id: "conference" });
    settings.mockResolvedValue([]);
    create.mockResolvedValue({ id: "submission", referenceNumber: "reference" });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  const file = (data = "%PDF-1.7\nDocument", name = "research.pdf") =>
    new NodeFile([data], name, { type: "application/pdf" }) as unknown as File;
  it("saves all metadata and the real document bytes in one transaction", async () => {
    const f = file();
    await savePublicAbstract(payload, f);
    const { data } = create.mock.calls[0][0];
    expect(data.payload.coAuthors).toEqual(payload.coAuthors);
    expect(data.payload.phone).toBe(payload.phone);
    expect(data.payload.terms).toBe(true);
    expect(data.fileData).toEqual(Buffer.from(await f.arrayBuffer()));
    expect(data.fileName).toBe("research.pdf");
    expect(audit).toHaveBeenCalledOnce();
  });
  it("rejects invalid consent before any database call", async () => {
    await expect(
      savePublicAbstract({ ...payload, terms: false }, file())
    ).rejects.toThrow();
    expect(conference).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
  it("rejects a renamed executable or invalid document signature", async () => {
    await expect(
      savePublicAbstract(payload, file("not a PDF", "research.pdf"))
    ).rejects.toThrow(/valid PDF/);
    expect(create).not.toHaveBeenCalled();
  });
  it("enforces the configured backend upload limit", async () => {
    settings.mockResolvedValue([{ key: "abstract_settings", value: { maxFileMB: 1 } }]);
    await expect(
      savePublicAbstract(payload, file("x".repeat(1024 * 1024 + 1)))
    ).rejects.toThrow(/Maximum/);
    expect(create).not.toHaveBeenCalled();
  });
  it("rejects unpublished tracks", async () => {
    settings.mockResolvedValue([
      { key: "scientific_tracks", value: [{ name: "Hidden", published: false }] }
    ]);
    await expect(
      savePublicAbstract({ ...payload, track: "Hidden" }, file())
    ).rejects.toThrow(/published/);
    expect(create).not.toHaveBeenCalled();
  });
  it("does not report success when the database transaction fails", async () => {
    create.mockRejectedValue(new Error("offline"));
    await expect(savePublicAbstract(payload, file())).rejects.toThrow("offline");
    expect(audit).not.toHaveBeenCalled();
  });
});
