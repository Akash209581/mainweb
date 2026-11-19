// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const { countries } = vi.hoisted(() => ({ countries: vi.fn() }));
vi.mock("@/lib/prisma/client", () => ({ prisma: { country: { findMany: countries } } }));
vi.mock("@/lib/cache", () => ({
  memoize: (_key: string, _ttl: number, read: () => Promise<unknown>) => read()
}));
import { registrationCountries } from "../components/approved-reference/registration-data";
import { countryNameSchema } from "../lib/validation/public-inputs";
beforeEach(() => vi.resetAllMocks());
describe("public registration country options", () => {
  it("keeps worldwide options when the database only contains the venue country", async () => {
    countries.mockResolvedValue([{ name: "United Arab Emirates" }]);
    const options = await registrationCountries();
    expect(options.length).toBeGreaterThan(200);
    expect(options).toEqual(
      expect.arrayContaining([
        "United Arab Emirates",
        "United States",
        "India",
        "United Kingdom",
        "Canada",
        "Australia"
      ])
    );
    expect(options.filter((name) => name === "United Arab Emirates")).toHaveLength(1);
  });
  it.each(["empty", "unavailable"])(
    "keeps the full list when the database is %s",
    async (state) => {
      if (state === "empty") countries.mockResolvedValue([]);
      else countries.mockRejectedValue(new Error("Database offline"));
      const options = await registrationCountries();
      expect(options.length).toBeGreaterThan(200);
      expect(options).toContain("United States");
    }
  );
  it("only displays names the submission validator accepts and preserves supported aliases", async () => {
    countries.mockResolvedValue([
      { name: " United States of America " },
      { name: "Not a real country" },
      { name: "United Arab Emirates" }
    ]);
    const options = await registrationCountries();
    expect(options).toContain("United States of America");
    expect(options).not.toContain("Not a real country");
    expect(options.every((name) => countryNameSchema.safeParse(name).success)).toBe(true);
    expect(new Set(options).size).toBe(options.length);
    expect(options).toEqual([...options].sort((a, b) => a.localeCompare(b, "en")));
  });
});
