"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Upload, CheckCircle2, ShieldCheck, Loader2, ArrowRight, ArrowLeft, Plus, Trash2, FileText, Printer, Download } from "lucide-react";
import { submitHansciAbstractAction, type HansciAbstractResult } from "@/actions/abstract.actions";
import { SCIENTIFIC_TRACKS } from "@/app/(public)/sessions/sessions-layout";

const TRACK_NAMES = SCIENTIFIC_TRACKS.map((t) => t.name);

const INITIAL = {
  first: "",
  last: "",
  email: "",
  institution: "",
  phone: "",
  country: "",
  title: "",
  track: "",
  presentation: "Oral presentation",
  authorsConsent: false,
  ethics: false,
  terms: false,
  captcha: ""
};

interface CoAuthor {
  id: number;
  name: string;
  affiliation: string;
}

export interface AbstractFormSettings {
  minWords?: number;
  maxWords?: number;
  maxFileSizeMb?: number;
  guidelinesNote?: string;
}

export function AbstractSubmissionForm({
  defaultTrack,
  abstractSettings,
  availableTracks
}: {
  defaultTrack?: string;
  abstractSettings?: AbstractFormSettings;
  availableTracks?: string[];
}) {
  const maxMb = abstractSettings?.maxFileSizeMb || 5;
  const minWords = abstractSettings?.minWords || 500;
  const maxWords = abstractSettings?.maxWords || 600;
  const trackList = availableTracks && availableTracks.length > 0 ? availableTracks : TRACK_NAMES;

  const [step, setStep] = useState<number>(0);
  const [data, setData] = useState({ ...INITIAL, track: defaultTrack || "" });
  const [authors, setAuthors] = useState<CoAuthor[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [challenge, setChallenge] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<HansciAbstractResult | null>(null);
  const [policyOpen, setPolicyOpen] = useState<boolean>(false);

  const policyDialogRef = useRef<HTMLDialogElement>(null);
  const authorIdRef = useRef<number>(0);

  function newChallenge() {
    const v = new Uint32Array(2);
    crypto.getRandomValues(v);
    setChallenge([2 + (v[0] % 8), 1 + (v[1] % 9)]);
    setData((d) => ({ ...d, captcha: "" }));
    setError("");
  }

  useEffect(() => {
    try {
      const names = new Intl.DisplayNames(["en"], { type: "region" });
      const all: string[] = [];
      for (let a = 65; a <= 90; a++) {
        for (let b = 65; b <= 90; b++) {
          const code = String.fromCharCode(a, b);
          const name = names.of(code);
          if (name && name !== code && !["EU", "UN", "EZ", "QO", "XA", "XB", "ZZ"].includes(code)) {
            all.push(name);
          }
        }
      }
      setCountries([...new Set(all)].sort());
    } catch {
      setCountries(["United Arab Emirates", "United Kingdom", "United States", "Germany", "India", "Canada", "Australia", "France"]);
    }
    newChallenge();
  }, []);

  useEffect(() => {
    if (policyOpen && policyDialogRef.current && !policyDialogRef.current.open) {
      policyDialogRef.current.showModal();
    }
  }, [policyOpen]);

  function change(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, type, value } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setData((d) => ({ ...d, [name]: type === "checkbox" ? checked : value }));
    setError("");
  }

  function selectFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    let message = "";
    if (f && !/\.(pdf|doc|docx)$/i.test(f.name)) {
      message = "Please choose a PDF, DOC or DOCX document.";
    } else if (f && f.size > maxMb * 1024 * 1024) {
      message = `The document must be ${maxMb} MB or smaller.`;
    }
    setError(message);
  }

  function review(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please upload your abstract document.");
      return;
    }
    if (!/\.(pdf|doc|docx)$/i.test(file.name) || file.size > maxMb * 1024 * 1024) {
      setError(`Please upload a PDF, DOC or DOCX document no larger than ${maxMb} MB.`);
      return;
    }
    if (!challenge || data.captcha.trim() === "" || Number(data.captcha) !== challenge[0] + challenge[1]) {
      setError("Please answer the arithmetic challenge correctly.");
      return;
    }
    if (!data.authorsConsent || !data.ethics || !data.terms) {
      setError("Please confirm all declarations and terms to proceed.");
      return;
    }
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleFinalSubmit() {
    setIsSubmitting(true);
    setError("");

    try {
      const res = await submitHansciAbstractAction({
        first: data.first,
        last: data.last,
        email: data.email,
        institution: data.institution,
        phone: data.phone,
        country: data.country,
        title: data.title,
        track: data.track,
        presentation: data.presentation,
        coAuthors: authors.map((a) => ({ name: a.name, affiliation: a.affiliation })),
        fileName: file?.name,
        fileSize: file?.size
      });

      if (!res.ok) {
        throw new Error(res.message);
      }

      setResult(res);
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit abstract.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-10">
      {/* STEP INDICATOR */}
      {step < 2 && (
        <div className="flex items-center max-w-md mx-auto mb-8 text-xs text-muted">
          <div className={`flex items-center gap-2 font-bold ${step === 0 ? "text-accent" : "text-foreground"}`}>
            <span className={`size-6 rounded-full flex items-center justify-center text-white ${step === 0 ? "bg-accent" : "bg-foreground"}`}>1</span>
            <span>Prepare Abstract</span>
          </div>
          <div className="h-px bg-border flex-1 mx-4" />
          <div className={`flex items-center gap-2 font-bold ${step === 1 ? "text-accent" : "text-muted"}`}>
            <span className={`size-6 rounded-full flex items-center justify-center text-white ${step === 1 ? "bg-accent" : "bg-slate-300"}`}>2</span>
            <span>Review & Submit</span>
          </div>
        </div>
      )}

      {/* STEP 0: FORM */}
      {step === 0 && (
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={review} className="rounded-2xl border border-border/40 bg-surface/40 p-6 md:p-8 space-y-6 shadow-sm">
            {/* 01: PRESENTING AUTHOR */}
            <div className="space-y-4">
              <h3 className="font-heading text-sm font-bold text-foreground border-b border-border/20 pb-2">
                <span className="text-accent mr-2">01</span>Presenting Author & Correspondence
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">First Name *</label>
                  <input
                    name="first"
                    required
                    maxLength={80}
                    value={data.first}
                    onChange={change}
                    placeholder="e.g. Alex"
                    className="w-full rounded-xl border border-border/45 bg-surface/65 px-4 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Last Name *</label>
                  <input
                    name="last"
                    required
                    maxLength={80}
                    value={data.last}
                    onChange={change}
                    placeholder="e.g. Morgan"
                    className="w-full rounded-xl border border-border/45 bg-surface/65 px-4 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Email Address *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={200}
                    value={data.email}
                    onChange={change}
                    placeholder="e.g. alex@institution.org"
                    className="w-full rounded-xl border border-border/45 bg-surface/65 px-4 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Institution / Organisation *</label>
                  <input
                    name="institution"
                    required
                    maxLength={200}
                    value={data.institution}
                    onChange={change}
                    placeholder="e.g. National Research Laboratory"
                    className="w-full rounded-xl border border-border/45 bg-surface/65 px-4 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Phone with Country Code</label>
                  <input
                    name="phone"
                    type="tel"
                    value={data.phone}
                    onChange={change}
                    placeholder="+971 50 123 4567"
                    className="w-full rounded-xl border border-border/45 bg-surface/65 px-4 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Country / Region *</label>
                  <select
                    name="country"
                    required
                    value={data.country}
                    onChange={change}
                    className="w-full rounded-xl border border-border/45 bg-surface/65 px-4 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select country...</option>
                    {countries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 02: CO-AUTHORS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border/20 pb-2">
                <h3 className="font-heading text-sm font-bold text-foreground">
                  <span className="text-accent mr-2">02</span>Co-Authors (Optional)
                </h3>
                <button
                  type="button"
                  disabled={authors.length >= 20}
                  onClick={() => setAuthors((all) => [...all, { id: ++authorIdRef.current, name: "", affiliation: "" }])}
                  className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
                >
                  <Plus className="size-3.5" /> Add Co-Author
                </button>
              </div>

              {authors.map((a, idx) => (
                <div key={a.id} className="rounded-xl border border-border/30 bg-surface/60 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span>Co-Author {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setAuthors((all) => all.filter((x) => x.id !== a.id))}
                      className="text-red-500 hover:text-red-700 flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 className="size-3" /> Remove
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      required
                      placeholder="Co-author full name"
                      value={a.name}
                      onChange={(e) =>
                        setAuthors((all) => all.map((x) => (x.id === a.id ? { ...x, name: e.target.value } : x)))
                      }
                      className="rounded-lg border border-border/45 bg-surface/80 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <input
                      required
                      placeholder="Institution / affiliation"
                      value={a.affiliation}
                      onChange={(e) =>
                        setAuthors((all) => all.map((x) => (x.id === a.id ? { ...x, affiliation: e.target.value } : x)))
                      }
                      className="rounded-lg border border-border/45 bg-surface/80 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 03: RESEARCH & PRESENTATION */}
            <div className="space-y-4">
              <h3 className="font-heading text-sm font-bold text-foreground border-b border-border/20 pb-2">
                <span className="text-accent mr-2">03</span>Research & Presentation Preference
              </h3>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Abstract Title *</label>
                  <input
                    name="title"
                    required
                    maxLength={250}
                    value={data.title}
                    onChange={change}
                    placeholder="A clear, concise title for your research paper..."
                    className="w-full rounded-xl border border-border/45 bg-surface/65 px-4 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Scientific Track *</label>
                    <select
                      name="track"
                      required
                      value={data.track}
                      onChange={change}
                      className="w-full rounded-xl border border-border/45 bg-surface/65 px-4 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="">Select track...</option>
                      {trackList.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Presentation Preference *</label>
                    <select
                      name="presentation"
                      required
                      value={data.presentation}
                      onChange={change}
                      className="w-full rounded-xl border border-border/45 bg-surface/65 px-4 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="Oral presentation">Oral presentation</option>
                      <option value="Poster presentation">Poster presentation</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 04: UPLOAD DOCUMENT */}
            <div className="space-y-3">
              <h3 className="font-heading text-sm font-bold text-foreground border-b border-border/20 pb-2">
                <span className="text-accent mr-2">04</span>Upload Abstract Document
              </h3>

              <div className="rounded-xl border-2 border-dashed border-border/60 bg-surface/40 p-6 text-center space-y-2">
                <Upload className="size-8 text-accent mx-auto" />
                <label htmlFor="document-upload" className="block text-xs font-bold text-foreground cursor-pointer">
                  Click to select file or drag and drop
                </label>
                <input
                  id="document-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  required
                  onChange={selectFile}
                  className="hidden"
                />
                <p className="text-[11px] text-muted">
                  Supported formats: PDF, DOC, DOCX up to {maxMb} MB. Target word count: {minWords}–{maxWords} words.
                </p>
                {abstractSettings?.guidelinesNote && (
                  <p className="text-[11px] text-accent/90 italic">
                    {abstractSettings.guidelinesNote}
                  </p>
                )}
                {file && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/30 px-3 py-1.5 text-xs font-bold text-accent">
                    <FileText className="size-4" />
                    <span>{file.name}</span>
                    <span className="text-muted font-normal">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>
            </div>

            {/* 05: DECLARATIONS & CAPTCHA */}
            <div className="space-y-4">
              <h3 className="font-heading text-sm font-bold text-foreground border-b border-border/20 pb-2">
                <span className="text-accent mr-2">05</span>Declarations & Security Verification
              </h3>

              <div className="space-y-2 text-xs text-muted">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    name="authorsConsent"
                    type="checkbox"
                    required
                    checked={data.authorsConsent}
                    onChange={change}
                    className="mt-0.5 accent-accent"
                  />
                  <span>I confirm that all authors have approved this abstract and authorized its submission. *</span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    name="ethics"
                    type="checkbox"
                    required
                    checked={data.ethics}
                    onChange={change}
                    className="mt-0.5 accent-accent"
                  />
                  <span>I confirm that the work meets applicable scientific research ethics standards. *</span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    name="terms"
                    type="checkbox"
                    required
                    checked={data.terms}
                    onChange={change}
                    className="mt-0.5 accent-accent"
                  />
                  <span>
                    I accept the{" "}
                    <button
                      type="button"
                      onClick={() => setPolicyOpen(true)}
                      className="text-accent underline font-semibold"
                    >
                      Submission Terms
                    </button>{" "}
                    and Privacy Notice. *
                  </span>
                </label>
              </div>

              <div className="rounded-xl border border-border/40 bg-surface/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <b className="text-xs text-foreground">Security Challenge *</b>
                  <button
                    type="button"
                    onClick={newChallenge}
                    className="text-[11px] text-accent underline"
                  >
                    New challenge
                  </button>
                </div>
                <div className="max-w-xs">
                  <label className="text-[11px] text-muted block mb-1">
                    {challenge ? `What is ${challenge[0]} + ${challenge[1]}?` : "Loading..."}
                  </label>
                  <input
                    name="captcha"
                    type="number"
                    required
                    value={data.captcha}
                    onChange={change}
                    placeholder="Answer"
                    className="w-full rounded-lg border border-border/45 bg-surface/80 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!challenge}
                className="w-full rounded-xl bg-accent hover:bg-accent/90 py-3 text-xs font-bold text-white shadow-md transition flex items-center justify-center gap-2"
              >
                Review Abstract Submission <ArrowRight className="size-4" />
              </button>
            </div>
          </form>

          {/* SIDEBAR GUIDELINES */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/40 bg-surface/40 p-6 space-y-4">
              <span className="text-[10px] uppercase tracking-widest text-accent font-bold">Submission Guidelines</span>
              <h3 className="font-heading text-lg font-bold text-foreground">
                A clear abstract. A strong first impression.
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Ensure your abstract reflects original research and abides by double-blind review criteria.
              </p>

              <div className="space-y-2 border-t border-border/20 pt-3 text-xs text-muted">
                <div className="flex justify-between py-1 border-b border-border/10">
                  <span>Language</span>
                  <span className="font-semibold text-foreground">English</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/10">
                  <span>Target length</span>
                  <span className="font-semibold text-foreground">500–600 words</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/10">
                  <span>File format</span>
                  <span className="font-semibold text-foreground">PDF / DOC / DOCX</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Max file size</span>
                  <span className="font-semibold text-foreground">5 MB</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#102e4c] text-white p-6 space-y-3">
              <span className="text-[10px] uppercase tracking-wider text-amber-300 font-bold">Important Notice</span>
              <h4 className="font-heading text-sm font-bold text-white">Separate Registration Process</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Abstract submission and delegate conference registration are handled independently. Presentation confirmation requires at least one registered presenter.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: REVIEW */}
      {step === 1 && (
        <div className="max-w-3xl mx-auto rounded-2xl border border-border/40 bg-surface/40 p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/20 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent">Final Inspection</span>
              <h2 className="font-heading text-2xl font-bold text-foreground">
                Review Your Abstract Submission
              </h2>
            </div>
            <button
              onClick={() => setStep(0)}
              className="text-xs text-accent underline font-semibold"
            >
              Edit details
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="space-y-1">
              <span className="text-muted block text-[11px] uppercase tracking-wider">Presenting Author</span>
              <p className="font-bold text-foreground">{data.first} {data.last}</p>
            </div>

            <div className="space-y-1">
              <span className="text-muted block text-[11px] uppercase tracking-wider">Correspondence Email</span>
              <p className="font-bold text-foreground">{data.email}</p>
            </div>

            <div className="space-y-1">
              <span className="text-muted block text-[11px] uppercase tracking-wider">Institution</span>
              <p className="font-bold text-foreground">{data.institution}</p>
            </div>

            <div className="space-y-1">
              <span className="text-muted block text-[11px] uppercase tracking-wider">Country / Region</span>
              <p className="font-bold text-foreground">{data.country}</p>
            </div>

            <div className="space-y-1">
              <span className="text-muted block text-[11px] uppercase tracking-wider">Scientific Track</span>
              <p className="font-bold text-foreground">{data.track}</p>
            </div>

            <div className="space-y-1">
              <span className="text-muted block text-[11px] uppercase tracking-wider">Presentation Preference</span>
              <p className="font-bold text-foreground">{data.presentation}</p>
            </div>
          </div>

          <div className="border-t border-border/20 pt-4 space-y-1">
            <span className="text-muted block text-[11px] uppercase tracking-wider">Abstract Title</span>
            <h3 className="font-heading text-base font-bold text-foreground">{data.title}</h3>
          </div>

          <div className="border-t border-border/20 pt-4 space-y-1">
            <span className="text-muted block text-[11px] uppercase tracking-wider">Author Line</span>
            <p className="text-xs text-foreground">
              <b>{data.first} {data.last}</b> ({data.institution})
              {authors.map((a) => `; ${a.name} (${a.affiliation})`)}
            </p>
          </div>

          <div className="border-t border-border/20 pt-4 space-y-1">
            <span className="text-muted block text-[11px] uppercase tracking-wider">Attached Document</span>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-accent">
              <FileText className="size-4" />
              <span>{file?.name}</span>
              <span className="text-muted font-normal">({file ? (file.size / 1024).toFixed(1) : "0"} KB)</span>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-border/20">
            <button
              type="button"
              onClick={() => setStep(0)}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted"
            >
              <ArrowLeft className="size-3.5" /> Back to Edit
            </button>

            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-accent hover:bg-accent/90 px-6 py-2.5 text-xs font-bold text-white shadow-md transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Submitting Abstract...
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4" /> Confirm & Submit Abstract
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CONFIRMED */}
      {step === 2 && result && (
        <div className="max-w-2xl mx-auto rounded-2xl border border-success/40 bg-success/5 p-8 text-center space-y-5 shadow-sm">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/20 text-success">
            <CheckCircle2 className="size-8" />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-widest text-success">
            Submission Received
          </span>

          <h2 className="font-heading text-2xl font-bold text-foreground">
            Thank you for sharing your research!
          </h2>

          <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
            Your abstract <b>&ldquo;{data.title}&rdquo;</b> has been submitted for peer review. A confirmation has been dispatched to <b>{data.email}</b>.
          </p>

          <div className="my-4 p-4 rounded-xl border border-border bg-white inline-block text-left shadow-xs">
            <div className="text-[11px] uppercase tracking-wider text-muted font-bold">
              Abstract Reference Number
            </div>
            <div className="text-xl font-mono font-bold text-accent mt-0.5">
              {result.referenceNumber}
            </div>
            <div className="text-xs text-muted mt-1">
              Please quote this reference in any correspondence with the scientific committee.
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground"
            >
              <Printer className="size-3.5 inline mr-1.5" /> Print Submission Receipt
            </button>

            <Link
              href="/registration"
              className="rounded-lg bg-accent px-5 py-2 text-xs font-bold text-white shadow-sm"
            >
              Register for Conference Pass →
            </Link>
          </div>
        </div>
      )}

      {/* POLICY MODAL */}
      {policyOpen && (
        <dialog
          ref={policyDialogRef}
          onCancel={() => setPolicyOpen(false)}
          className="fixed inset-0 z-50 rounded-2xl border border-border/60 bg-white p-6 text-foreground shadow-2xl max-w-md w-[calc(100%-2rem)] backdrop:bg-slate-900/60"
        >
          <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-4">
            <h3 className="font-heading text-sm font-bold text-foreground">Submission Terms</h3>
            <button
              onClick={() => {
                policyDialogRef.current?.close();
                setPolicyOpen(false);
              }}
              className="rounded-md p-1 text-muted hover:text-foreground"
            >
              Close
            </button>
          </div>
          <div className="space-y-3 text-xs text-muted leading-relaxed">
            <p>
              By submitting this abstract, the author asserts that the material is original and not currently published or under review elsewhere.
            </p>
            <p>
              Submissions undergo double-blind scientific review. Accepted abstracts will appear in the official conference digital proceedings.
            </p>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                policyDialogRef.current?.close();
                setPolicyOpen(false);
              }}
              className="rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background"
            >
              Understood
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}
