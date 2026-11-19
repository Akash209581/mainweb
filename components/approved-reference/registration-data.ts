import { prisma } from "@/lib/prisma/client";
import { memoize } from "@/lib/cache";
import { COUNTRY_NAMES, isCountryName } from "@/lib/validation/countries";

/** A partial country seed must never restrict public registration choices. */
export async function registrationCountries(): Promise<string[]> {
  return memoize("registration_page_countries", 120000, async () => {
    const names = new Set(COUNTRY_NAMES);
    try {
      const countries = await prisma.country.findMany({ orderBy: { name: "asc" } });
      for (const country of countries) {
        const name = country.name.trim();
        if (isCountryName(name)) names.add(name);
      }
    } catch {
      // Registration still has the complete validated catalogue during an outage.
    }
    return [...names].sort((a, b) => a.localeCompare(b, "en"));
  });
}
