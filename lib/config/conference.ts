/** This deployment serves one explicitly selected conference. */
export function publicConferenceWhere() {
  return {
    slug: { equals: process.env.PUBLIC_CONFERENCE_SLUG || "icgit-2026", mode: "insensitive" as const },
    deletedAt: null
  };
}
