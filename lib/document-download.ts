import path from "path";
const types: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain; charset=utf-8"
};
/** Use the stored file extension, never an old placeholder's download attribute. */
export function documentDownloadHeaders(
  fileName: string,
  storageKey: string
): Record<string, string> {
  const extension = path.extname(storageKey).toLowerCase();
  if (!types[extension]) throw new Error("Unsupported document type");
  let name =
    String(fileName || "document")
      .split(/[\\/]/)
      .pop()!
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .trim() || "document";
  if (path.extname(name).toLowerCase() !== extension)
    name =
      (name.slice(0, name.length - path.extname(name).length) || "document") + extension;
  const ascii = name.replace(/[^\x20-\x7e]|["\\]/g, "_");
  const encoded = encodeURIComponent(name).replace(
    /['()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()
  );
  return {
    "Content-Type": types[extension],
    "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store"
  };
}
