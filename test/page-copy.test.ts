import { describe, expect, it } from "vitest";
import { applyPageCopy } from "../components/approved-reference/page-copy";
import catalog from "../lib/page-copy-catalog.json";
import { source } from "../components/approved-reference/registration-source";
function fixture() {
  const root = document.createElement("div");
  root.innerHTML = '<div class="reference-body"><div>' + source.markup + "</div></div>";
  return root;
}
describe("public page text publishing", () => {
  it("edits heading text without removing its line break or changing form values", () => {
    const root = fixture();
    const field = catalog.registration.find((f) => f.original === "Great ideas begin")!;
    const input = root.querySelector("input")!;
    input.value = "Unsaved participant";
    applyPageCopy(root, "registration", {
      registration: { [field.id]: "Research starts here" }
    });
    const heading = root.querySelector("h1")!;
    expect(heading.textContent).toContain("Research starts here");
    expect(heading.querySelector("br")).not.toBeNull();
    expect(input.value).toBe("Unsaved participant");
  });
  it("renders saved HTML-like content as plain text", () => {
    const root = fixture();
    const field = catalog.registration.find((f) => f.original === "Great ideas begin")!;
    const payload = "<img src=x onerror=alert(1)>";
    applyPageCopy(root, "registration", { registration: { [field.id]: payload } });
    expect(root.querySelector("h1")!.textContent).toContain(payload);
    expect(root.querySelector("h1 img")).toBeNull();
  });
  it("does not overwrite a dynamic value that has replaced the source text", () => {
    const root = fixture();
    const field = catalog.registration.find((f) => f.original === "Great ideas begin")!;
    root.querySelector("h1")!.firstChild!.textContent = "Current conference title";
    applyPageCopy(root, "registration", {
      registration: { [field.id]: "Saved override" }
    });
    expect(root.querySelector("h1")!.textContent).toContain("Current conference title");
  });
  it("is idempotent and isolates values by page", () => {
    const root = fixture();
    const field = catalog.registration.find((f) => f.original === "Great ideas begin")!;
    applyPageCopy(root, "registration", { abstracts: { [field.id]: "Other page" } });
    expect(root.querySelector("h1")!.textContent).toContain("Great ideas begin");
    const values = { registration: { [field.id]: "Published heading" } };
    applyPageCopy(root, "registration", values);
    const once = root.innerHTML;
    applyPageCopy(root, "registration", values);
    expect(root.innerHTML).toBe(once);
  });
});
