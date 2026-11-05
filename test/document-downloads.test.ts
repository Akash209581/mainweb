import { describe, expect, it } from "vitest";
import { documentDownloadHeaders } from "../lib/document-download";
import { normalizeDocumentDownloads } from "../components/approved-reference/document-downloads";
describe("uploaded conference document downloads", () => {
  it("returns PDF type and a PDF filename even when legacy metadata names a TXT placeholder", () => {
    const h = documentDownloadHeaders("ICGIT_Brochure.txt", "uploaded-file.pdf");
    expect(h["Content-Type"]).toBe("application/pdf");
    expect(h["Content-Disposition"]).toContain('filename="ICGIT_Brochure.pdf"');
    expect(h["Content-Disposition"]).not.toContain(".txt");
    expect(h["Cache-Control"]).toBe("no-store");
  });
  it("preserves uploaded Unicode names without permitting header injection", () => {
    const h = documentDownloadHeaders('Donn�es "2026"\r\n.pdf', "stored.pdf");
    expect(h["Content-Disposition"]).toContain("filename*=UTF-8");
    expect(h["Content-Disposition"]).not.toContain("\r");
    expect(h["Content-Disposition"]).not.toContain("\n");
  });
  it("replaces old sample and brochure links and removes forced TXT filenames", () => {
    const root = document.createElement("div");
    root.innerHTML =
      '<a href="/ICGIT/approved-reference/sample-abstract.txt" download="Sample.txt">Sample</a><a href="/resources/icgit-2026-brochure.txt" download="Brochure.txt">Brochure</a>';
    normalizeDocumentDownloads(root);
    const links = root.querySelectorAll("a");
    expect(links[0].getAttribute("href")).toBe("/ICGIT/api/assets?kind=sampleAbstract");
    expect(links[1].getAttribute("href")).toBe("/ICGIT/api/assets?kind=brochure");
    expect(root.querySelector("[download]")).toBeNull();
    const once = root.innerHTML;
    normalizeDocumentDownloads(root);
    expect(root.innerHTML).toBe(once);
  });
  it("does not rewrite unrelated downloads or their filenames", () => {
    const root = document.createElement("div");
    root.innerHTML = '<a href="/other/report.txt" download="report.txt">Other</a>';
    normalizeDocumentDownloads(root);
    expect(root.querySelector("a")!.getAttribute("download")).toBe("report.txt");
  });
  it("removes a late-rendered brochure download override", () => {
    const root = document.createElement("div");
    root.innerHTML =
      '<a href="/ICGIT/api/assets?kind=brochure" download="old.txt">PDF</a>';
    normalizeDocumentDownloads(root);
    expect(root.querySelector("a")!.hasAttribute("download")).toBe(false);
  });
});
