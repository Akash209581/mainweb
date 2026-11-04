import catalog from "@/lib/page-copy-catalog.json";
type CopyValues = Record<string, Record<string, string>>;
/** Apply plain text only, preserving controls, links, layout and event handlers. */
export function applyPageCopy(
  root: ShadowRoot | Element,
  page: string,
  values: CopyValues
) {
  const fields = catalog[page as keyof typeof catalog];
  if (!fields || !values?.[page]) return;
  for (const field of fields) {
    const value = values[page][field.id];
    if (typeof value !== "string" || value === field.original) continue;
    const element = root.querySelector(field.selector);
    if (!element) continue;
    const node = Array.from(element.childNodes).filter((n) => n.nodeType === 3)[
      field.textIndex
    ];
    if (
      node &&
      (node.textContent === field.original || node.textContent === value) &&
      node.textContent !== value
    )
      node.textContent = value;
  }
}
export function attachPageCopy(root: ShadowRoot) {
  let stopped = false;
  let values: CopyValues = {};
  const page =
    window.location.pathname.replace(/\/$/, "").split("/").pop() || "registration";
  const apply = () => applyPageCopy(root, page, values);
  const observer = new MutationObserver(apply);
  observer.observe(root, { childList: true, characterData: true, subtree: true });
  fetch("/ICGIT/api/settings", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (stopped || !data) return;
      values = data.settings.pageCopy || {};
      apply();
      if (data.settings.assets?.sampleAbstract) {
        const link = root.querySelector<HTMLAnchorElement>(
          'a[href="/ICGIT/approved-reference/sample-abstract.txt"],a[href="sample-abstract.txt"]'
        );
        if (link) {
          link.href = "/ICGIT/api/assets?kind=sampleAbstract";
          link.removeAttribute("download");
        }
      }
    })
    .catch(() => {});
  return () => {
    stopped = true;
    observer.disconnect();
  };
}
