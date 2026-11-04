import { prisma } from "@/lib/prisma/client";
import { memoize } from "@/lib/cache";
import { DEFAULT_COUNTRIES } from "@/constants/conference";

/** Keep the existing registration page's database-backed country list. */
export async function registrationCountries(): Promise<string[]> {
  return memoize("registration_page_countries", 120000, async () => {
    try {
      const countries = await prisma.country.findMany({ orderBy: { name: "asc" } });
      return (countries.length ? countries : DEFAULT_COUNTRIES).map(
        (country) => country.name
      );
    } catch {
      return DEFAULT_COUNTRIES.map((country) => country.name);
    }
  });
}
