/** Route historical placeholder links to the published document, retaining server filenames. */
export function normalizeDocumentDownloads(root: ShadowRoot | Element) {
  for (const anchor of root.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    const href = anchor.getAttribute("href")!;
    let url: URL;
    try {
      url = new URL(href, "https://reference.local/");
    } catch {
      continue;
    }
    const sample = /(^|\/)sample-abstract\.txt$/.test(url.pathname);
    const brochure = /(^|\/)icgit-2026-brochure\.txt$/.test(url.pathname);
    let target = sample
      ? "/ICGIT/api/assets?kind=sampleAbstract"
      : brochure
        ? "/ICGIT/api/assets?kind=brochure"
        : null;
    if (target && href !== target) anchor.setAttribute("href", target);
    const endpoint =
      (url.pathname === "/api/assets" || url.pathname === "/ICGIT/api/assets") &&
      ["brochure", "sampleAbstract"].includes(url.searchParams.get("kind") || "");
    if ((target || endpoint) && anchor.hasAttribute("download"))
      anchor.removeAttribute("download");
  }
}
