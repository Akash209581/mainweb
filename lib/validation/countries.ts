/** Keep displayed country choices and server-side validation on the same catalogue. */
const names = new Set<string>();
const display = new Intl.DisplayNames(["en"], { type: "region" });
for (let a = 65; a <= 90; a++) {
  for (let b = 65; b <= 90; b++) {
    const code = String.fromCharCode(a, b);
    const name = display.of(code);
    if (
      name &&
      name !== code &&
      !["EU", "UN", "EZ", "QO", "XA", "XB", "ZZ"].includes(code)
    )
      names.add(name);
  }
}
export const COUNTRY_NAMES: readonly string[] = Object.freeze(
  [...names].sort((a, b) => a.localeCompare(b, "en"))
);
// Continue accepting familiar names used by existing forms and saved records.
for (const name of [
  "United States of America",
  "South Korea",
  "North Korea",
  "Russia",
  "Vietnam",
  "Turkey",
  "Czech Republic",
  "Ivory Coast",
  "Vatican City"
])
  names.add(name);
export function isCountryName(name: string): boolean {
  return names.has(name);
}
