"use client";

import { useActionState, useState } from "react";
import { useAuth } from "@/lib/auth/client";
import { Loader2, Upload, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/buttons/button";
import { GlassCard } from "@/components/cards/glass-card";
import { submitAbstractAction } from "@/actions/abstract.actions";

interface Track {
  id: string;
  name: string;
}

interface Country {
  id: string;
  name: string;
}

interface AbstractSubmissionFormProps {
  tracks: Track[];
  countries: Country[];
}

export function AbstractSubmissionForm({ tracks, countries }: AbstractSubmissionFormProps) {
  const { isSignedIn } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileAssetId, setFileAssetId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [state, formAction, isPending] = useActionState(submitAbstractAction, {
    ok: false,
    message: ""
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setUploadError("Only PDF files are allowed.");
      return;
    }

    setFile(selectedFile);
    setUploadError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/ICGIT/hanvo/upload", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to upload file.");
      }

      const data = await res.json();
      setFileAssetId(data.id);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to upload file.";
      setUploadError(errMsg);
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <GlassCard className="text-center p-8 border-warning/30 bg-warning/5">
        <h3 className="font-heading text-lg font-bold text-foreground">Authentication Required</h3>
        <p className="mt-2 text-xs text-muted leading-5">
          Please sign in to submit research abstracts for ICGIT 2026.
        </p>
        <div className="mt-5">
          <Button asChild>
            <Link href="/sign-in?redirect_url=/abstracts">Sign In to Submit</Link>
          </Button>
        </div>
      </GlassCard>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {fileAssetId && <input type="hidden" name="fileAssetId" value={fileAssetId} />}

      <div className="space-y-1.5">
        <label htmlFor="title" className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Abstract Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="e.g. Robust Neural Networks for Autonomous Edge Control"
          className="focus-ring w-full rounded-lg border border-border/45 bg-surface/65 px-4 py-2.5 text-sm text-foreground placeholder:text-muted"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="trackId" className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Research Track
          </label>
          <select
            id="trackId"
            name="trackId"
            required
            className="focus-ring w-full rounded-lg border border-border/45 bg-surface/65 px-4 py-2.5 text-sm text-foreground"
          >
            <option value="">Select track...</option>
            {tracks.map((track) => (
              <option key={track.id} value={track.id}>
                {track.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="presentationType" className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Presentation Type
          </label>
          <select
            id="presentationType"
            name="presentationType"
            required
            className="focus-ring w-full rounded-lg border border-border/45 bg-surface/65 px-4 py-2.5 text-sm text-foreground"
          >
            <option value="ORAL">Oral Presentation</option>
            <option value="POSTER">Poster Presentation</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="institution" className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Institution / Affiliation
          </label>
          <input
            id="institution"
            name="institution"
            type="text"
            required
            placeholder="e.g. Dubai Institute of Technology"
            className="focus-ring w-full rounded-lg border border-border/45 bg-surface/65 px-4 py-2.5 text-sm text-foreground placeholder:text-muted"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="countryId" className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Country
          </label>
          <select
            id="countryId"
            name="countryId"
            required
            className="focus-ring w-full rounded-lg border border-border/45 bg-surface/65 px-4 py-2.5 text-sm text-foreground"
          >
            <option value="">Select country...</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="keywords" className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Keywords (comma separated)
        </label>
        <input
          id="keywords"
          name="keywords"
          type="text"
          required
          placeholder="e.g. neural networks, edge computing, security"
          className="focus-ring w-full rounded-lg border border-border/45 bg-surface/65 px-4 py-2.5 text-sm text-foreground placeholder:text-muted"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="abstractText" className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Abstract Body (80 - 5000 characters)
        </label>
        <textarea
          id="abstractText"
          name="abstractText"
          required
          rows={6}
          placeholder="Provide a summary of your research, methodologies, and findings..."
          className="focus-ring w-full rounded-lg border border-border/45 bg-surface/65 px-4 py-2.5 text-sm text-foreground placeholder:text-muted"
        />
      </div>

      {/* PDF Upload */}
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
          Upload PDF Manuscript
        </span>
        <div className="relative flex flex-col items-center justify-center border border-dashed border-border/40 bg-surface/30 rounded-lg p-6 hover:bg-surface/50 transition">
          <input
            id="pdf-upload"
            type="file"
            accept="application/pdf"
            required
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="size-8 text-accent animate-spin" />
              <span className="mt-2 text-xs text-muted">Uploading PDF...</span>
            </div>
          ) : file ? (
            <div className="flex flex-col items-center">
              <CheckCircle className="size-8 text-success" />
              <span className="mt-2 text-xs font-semibold text-foreground">{file.name}</span>
              <span className="text-[10px] text-muted">Click or drag to replace</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="size-8 text-muted" />
              <span className="mt-2 text-xs text-foreground font-medium">Click to upload or drag & drop</span>
              <span className="text-[10px] text-muted">PDF file only (max 10MB)</span>
            </div>
          )}
        </div>
        {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
      </div>

      {state.message && (
        <div className={`p-4 rounded-lg text-xs font-semibold ${state.ok ? "bg-success/15 text-success border border-success/30" : "bg-error/15 text-error border border-error/30"}`}>
          {state.message}
        </div>
      )}

      <Button type="submit" disabled={isPending || uploading || !fileAssetId} className="w-full justify-center hover-lift">
        {isPending ? (
          <>
            <Loader2 className="size-4 mr-2 animate-spin" />
            Submitting Abstract...
          </>
        ) : (
          "Submit Abstract"
        )}
      </Button>
    </form>
  );
}
