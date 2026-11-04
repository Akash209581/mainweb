import { beforeEach, describe, expect, it, vi } from "vitest";
const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock("@/lib/prisma/client", () => ({ prisma: { conference: { findFirst } } }));
vi.mock("fs", () => ({ default: { existsSync: () => false } }));
import { GET, PUT } from "../app/api/settings/route";
describe("shared public settings boundary", () => {
  beforeEach(() => {
    findFirst.mockReset();
  });
  it("reads canonical database settings and does not expose draft entries", async () => {
    findFirst.mockResolvedValue({
      settings: [
        {
          key: "registration_pricing",
          value: {
            student: { EUR: 321, USD: 350, GBP: 290 },
            accommodation: {
              single: { EUR: 80, USD: 90, GBP: 70 },
              double: { EUR: 100, USD: 110, GBP: 90 }
            }
          },
          updatedAt: new Date("2026-11-05")
        },
        {
          key: "abstract_settings",
          value: { minWords: 100, maxWords: 300, maxFileSizeMb: 8 },
          updatedAt: new Date("2026-11-05")
        },
        {
          key: "scientific_tracks",
          value: [
            { id: "live", published: true },
            { id: "draft", published: false }
          ],
          updatedAt: new Date("2026-11-05")
        },
        {
          key: "approved_page_copy",
          value: { registration: { "1": "Published heading" } },
          updatedAt: new Date("2026-11-05")
        }
      ]
    });
    const r = await GET(),
      d = await r.json();
    expect(d.settings.registration.student.EUR).toBe(321);
    expect(d.settings.pricing.student.EUR).toBe(321);
    expect(d.settings.accommodation.single.EUR).toBe(80);
    expect(d.settings.abstractSettings.maxFileSizeMb).toBe(8);
    expect(d.settings.tracks).toEqual([{ id: "live", published: true }]);
    expect(d.settings.pageCopy.registration["1"]).toBe("Published heading");
    expect(r.headers.get("Cache-Control")).toBe("no-store");
  });
  it("rejects publishing through the public endpoint", async () => {
    const r = await PUT();
    expect(r.status).toBe(403);
    expect(findFirst).not.toHaveBeenCalled();
  });
  it("keeps public pages readable when the database is unavailable", async () => {
    findFirst.mockRejectedValue(new Error("Unavailable"));
    const r = await GET();
    expect(r.status).toBe(200);
    expect((await r.json()).settings.conference.title).toBeTruthy();
  });
});
