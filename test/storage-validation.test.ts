// @vitest-environment node
import { describe, expect, it } from "vitest";
import { validateDocumentContents } from "../lib/services/storage.service";

describe("document content validation", () => {
  it("rejects an executable renamed and labeled as a PDF", () => {
    expect(() => validateDocumentContents({ name: "paper.pdf", type: "application/pdf" }, Buffer.from("MZ executable"))).toThrow();
  });
  it("rejects a PDF stored with an executable extension", () => {
    expect(() => validateDocumentContents({ name: "paper.exe", type: "application/pdf" }, Buffer.from("%PDF-1.7"))).toThrow();
  });
  it("rejects arbitrary ZIP files labeled as Word documents", () => {
    expect(() => validateDocumentContents({ name: "paper.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }, Buffer.from([80, 75, 3, 4]))).toThrow();
  });
  it("accepts a matching PDF signature", () => {
    expect(() => validateDocumentContents({ name: "paper.pdf", type: "application/pdf" }, Buffer.from("%PDF-1.7"))).not.toThrow();
  });
});
