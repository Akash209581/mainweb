const fs = require('fs');

const contentFormPath = 'c:/Users/banda/Desktop/conference-admin/components/admin/content-form.tsx';
let fileContent = fs.readFileSync(contentFormPath, 'utf8');

// Let's check ContentFormProps:
// Add initialFaviconUrl?: string to ContentFormProps
fileContent = fileContent.replace(
  'interface ContentFormProps {',
  'interface ContentFormProps {\n  initialFaviconUrl?: string;'
);

// Add initialFaviconUrl = "/favicon.ico" to parameters
fileContent = fileContent.replace(
  'initialSpeakers = []\n}: ContentFormProps',
  'initialSpeakers = [],\n  initialFaviconUrl = "/favicon.ico"\n}: ContentFormProps'
);

// Add favicon state inside ContentForm component
fileContent = fileContent.replace(
  'const [saving, setSaving] = useState(false);',
  'const [saving, setSaving] = useState(false);\n  const [faviconUrl, setFaviconUrl] = useState(initialFaviconUrl);\n  const [uploadingFavicon, setUploadingFavicon] = useState(false);'
);

// Update handleSubmit to include faviconUrl
fileContent = fileContent.replace(
  'body: JSON.stringify({ conferenceId, slug, sections, footer })',
  'body: JSON.stringify({ conferenceId, slug, sections, footer, faviconUrl })'
);

// Add handleFaviconUpload helper function:
const uploadFunc = `  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFavicon(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("conferenceId", conferenceId);
      data.append("category", "branding");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: data
      });

      if (!res.ok) throw new Error("Failed to upload favicon");
      const result = await res.json();
      setFaviconUrl(result.url);
      setStatus("success");
      setMessage("Favicon uploaded successfully! Click 'Publish All Section Changes' to save.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Favicon upload failed");
    } finally {
      setUploadingFavicon(false);
    }
  };
`;

fileContent = fileContent.replace(
  'const handleSpeakerPhotoUpload =',
  uploadFunc + '\n  const handleSpeakerPhotoUpload ='
);

// Add Favicon & Brand Tab / Card at the top of content form (above tabs or in the section tabs)
// Let's add a clean Favicon & Tab Icon card directly above the tab selector:
const faviconCard = `      {/* Favicon & Browser Tab Icon Card */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 lg:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              Browser Favicon
            </span>
            <span className="text-sm font-bold text-slate-800">Website Tab Icon</span>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">
            Upload or provide the image link for the browser tab icon of the conference website.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {faviconUrl && (
            <div className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 p-1 flex items-center justify-center shrink-0 shadow-sm">
              <img
                src={faviconUrl}
                alt="Favicon preview"
                className="w-full h-full object-contain"
                onError={(e) => ((e.target as HTMLElement).style.display = "none")}
              />
            </div>
          )}
          <input
            type="text"
            value={faviconUrl}
            onChange={(e) => setFaviconUrl(e.target.value)}
            placeholder="/favicon.ico or /uploads/..."
            className="w-48 sm:w-64 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 transition"
          />
          <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold cursor-pointer border border-indigo-200 transition shrink-0 shadow-sm">
            {uploadingFavicon ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
            )}
            <span>Upload</span>
            <input
              type="file"
              accept="image/*,.ico,.png,.svg,.avif,.webp"
              onChange={handleFaviconUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>
`;

fileContent = fileContent.replace(
  '{/* Section Tabs Navigation */}',
  faviconCard + '\n      {/* Section Tabs Navigation */}'
);

fs.writeFileSync(contentFormPath, fileContent, 'utf8');
console.log('Successfully updated content-form.tsx with Favicon management');
