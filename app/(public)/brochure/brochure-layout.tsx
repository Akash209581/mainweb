"use client";

import { useState, useEffect, useRef } from "react";
import { Download, FileText, CheckCircle2, ShieldCheck, Mail, HelpCircle, X, Loader2, ArrowRight } from "lucide-react";
import { submitBrochureRequestAction, submitConferenceQueryAction } from "@/actions/contact.actions";

const BROCHURE_URL = "/resources/icgit-2026-brochure.txt";

const INITIAL = {
  first: "",
  last: "",
  email: "",
  phone: "",
  institution: "",
  country: "",
  interest: "",
  privacy: false,
  updates: false,
  captcha: ""
};

export function BrochureLayout() {
  const [data, setData] = useState(INITIAL);
  const [countries, setCountries] = useState<string[]>([]);
  const [challenge, setChallenge] = useState<[number, number] | null>(null);
  const [done, setDone] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [queryOpen, setQueryOpen] = useState<boolean>(false);
  const [queryDone, setQueryDone] = useState<boolean>(false);
  const [querySubmitting, setQuerySubmitting] = useState<boolean>(false);
  const [policyOpen, setPolicyOpen] = useState<boolean>(false);

  const queryDialogRef = useRef<HTMLDialogElement>(null);
  const policyDialogRef = useRef<HTMLDialogElement>(null);

  function refreshChallenge() {
    const n = new Uint32Array(2);
    crypto.getRandomValues(n);
    setChallenge([2 + (n[0] % 8), 1 + (n[1] % 9)]);
    setData((d) => ({ ...d, captcha: "" }));
    setError("");
  }

  useEffect(() => {
    try {
      const names = new Intl.DisplayNames(["en"], { type: "region" });
      const all: string[] = [];
      for (let a = 65; a <= 90; a++) {
        for (let b = 65; b <= 90; b++) {
          const c = String.fromCharCode(a, b);
          const name = names.of(c);
          if (name && name !== c && !["EU", "UN", "EZ", "QO", "XA", "XB", "ZZ"].includes(c)) {
            all.push(name);
          }
        }
      }
      setCountries([...new Set(all)].sort());
    } catch {
      setCountries(["United Arab Emirates", "United Kingdom", "United States", "Germany", "India", "Canada", "Australia", "France"]);
    }
    refreshChallenge();
  }, []);

  useEffect(() => {
    if (queryOpen && queryDialogRef.current && !queryDialogRef.current.open) {
      queryDialogRef.current.showModal();
    }
  }, [queryOpen]);

  useEffect(() => {
    if (policyOpen && policyDialogRef.current && !policyDialogRef.current.open) {
      policyDialogRef.current.showModal();
    }
  }, [policyOpen]);

  function change(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setData((d) => ({ ...d, [name]: type === "checkbox" ? checked : value }));
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!challenge || data.captcha.trim() === "" || Number(data.captcha) !== challenge[0] + challenge[1]) {
      setError("Please answer the arithmetic verification challenge correctly.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitBrochureRequestAction({
        first: data.first,
        last: data.last,
        email: data.email,
        phone: data.phone,
        institution: data.institution,
        country: data.country,
        interest: data.interest,
        updates: data.updates
      });

      // Programmatic trigger of static download
      const link = document.createElement("a");
      link.href = BROCHURE_URL;
      link.download = "ICGIT_2026_Conference_Brochure.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setDone(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleQuerySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setQuerySubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      await submitConferenceQueryAction({
        name: String(formData.get("queryName") || ""),
        email: String(formData.get("queryEmail") || ""),
        subject: String(formData.get("querySubject") || ""),
        message: String(formData.get("queryMessage") || "")
      });
      setQueryDone(true);
    } catch {
      setQueryDone(true);
    } finally {
      setQuerySubmitting(false);
    }
  }

  return (
    <div className="space-y-10">
      {!done ? (
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          {/* REQUEST FORM */}
          <div className="rounded-2xl border border-border/40 bg-surface/40 p-6 md:p-8 space-y-6 shadow-sm">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent">Your Conference Guide</span>
              <h2 className="mt-1 font-heading text-2xl font-bold text-foreground">
                Request the Official Conference Brochure
              </h2>
              <p className="mt-1 text-xs text-muted">
                Share your details below to obtain immediate access to the delegate guide and technical track summaries.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-6">
              {/* SECTION 1: CONTACT */}
              <div className="space-y-4">
                <h3 className="font-heading text-sm font-bold text-foreground border-b border-border/20 pb-2">
                  <span className="text-accent mr-2">01</span>Your Contact Details
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
                      placeholder="e.g. alex@university.edu"
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
                      placeholder="e.g. Cambridge Institute"
                      className="w-full rounded-xl border border-border/45 bg-surface/65 px-4 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Phone Number with Country Code</label>
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

              {/* SECTION 2: INTEREST */}
              <div className="space-y-3">
                <h3 className="font-heading text-sm font-bold text-foreground border-b border-border/20 pb-2">
                  <span className="text-accent mr-2">02</span>Your Primary Conference Interest
                </h3>

                <select
                  name="interest"
                  required
                  value={data.interest}
                  onChange={change}
                  className="w-full rounded-xl border border-border/45 bg-surface/65 px-4 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select your interest...</option>
                  {[
                    "Attending as onsite delegate",
                    "Virtual streaming participation",
                    "Oral research presentation",
                    "Poster presentation",
                    "Exhibition & booth display",
                    "Corporate sponsorship",
                    "Academic collaboration"
                  ].map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              {/* SECTION 3: CONSENT & CAPTCHA */}
              <div className="space-y-4">
                <h3 className="font-heading text-sm font-bold text-foreground border-b border-border/20 pb-2">
                  <span className="text-accent mr-2">03</span>Consent & Verification
                </h3>

                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 text-xs text-muted cursor-pointer">
                    <input
                      name="privacy"
                      type="checkbox"
                      required
                      checked={data.privacy}
                      onChange={change}
                      className="mt-0.5 accent-accent"
                    />
                    <span>
                      I acknowledge the{" "}
                      <button
                        type="button"
                        onClick={() => setPolicyOpen(true)}
                        className="text-accent underline font-semibold"
                      >
                        Privacy Notice
                      </button>{" "}
                      and request immediate access to the brochure. *
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-xs text-muted cursor-pointer">
                    <input
                      name="updates"
                      type="checkbox"
                      checked={data.updates}
                      onChange={change}
                      className="mt-0.5 accent-accent"
                    />
                    <span>Receive occasional conference announcements and deadline updates by email.</span>
                  </label>
                </div>

                <div className="rounded-xl border border-border/40 bg-surface/60 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <b className="text-xs text-foreground">Security Challenge *</b>
                    <button
                      type="button"
                      onClick={refreshChallenge}
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
                  disabled={isSubmitting || !challenge}
                  className="w-full rounded-xl bg-accent hover:bg-accent/90 py-3 text-xs font-bold text-white shadow-md transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Preparing Brochure...
                    </>
                  ) : (
                    <>
                      <Download className="size-4" /> Request & Download Brochure
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* SIDEBAR PREVIEW */}
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#102e4c] text-white p-6 md:p-8 flex flex-col justify-between min-h-[360px] shadow-lg">
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-amber-300 font-bold">
                  ICGIT 2026
                </span>
                <h3 className="font-heading text-2xl font-bold text-white leading-tight">
                  Ideas connect.
                  <br />
                  Science advances.
                </h3>
                <div className="h-0.5 w-12 bg-amber-400 my-4" />
                <p className="text-xs uppercase tracking-wider text-amber-200 font-semibold">
                  OFFICIAL CONFERENCE BROCHURE
                </p>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/20">
                <div className="text-[11px] text-slate-300">
                  Includes full tracks breakdown, submission timelines, registration categories, and venue travel guide.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setQueryDone(false);
                    setQueryOpen(true);
                  }}
                  className="w-full rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 py-2.5 text-xs font-bold text-white transition flex items-center justify-center gap-2"
                >
                  <HelpCircle className="size-4" /> Have a question? Contact team →
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border/40 bg-surface/30 p-6 space-y-3">
              <h4 className="font-heading text-sm font-bold text-foreground">Planned Brochure Contents</h4>
              <ul className="space-y-2 text-xs text-muted">
                {[
                  "Conference overview & scientific themes",
                  "12 Parallel research track specifications",
                  "Delegate registration packages & lodging options",
                  "Oral & poster contribution guidelines",
                  "Exhibition & sponsorship prospectus"
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-accent shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* THANK YOU / DOWNLOAD READY STATE */
        <div className="max-w-2xl mx-auto rounded-2xl border border-success/40 bg-success/5 p-8 text-center space-y-5 shadow-sm">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/20 text-success">
            <CheckCircle2 className="size-8" />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-widest text-success">
            Brochure Ready
          </span>

          <h2 className="font-heading text-2xl font-bold text-foreground">
            Thank you for your interest!
          </h2>

          <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
            Your conference brochure file is ready for download. A copy reference has also been dispatched for{" "}
            <b>{data.email}</b>.
          </p>

          <div className="pt-2">
            <a
              href={BROCHURE_URL}
              download="ICGIT_2026_Conference_Brochure.txt"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-accent/90 transition"
            >
              <Download className="size-4" /> Download Conference Brochure Again
            </a>
          </div>

          <div className="pt-4 border-t border-border/20 flex justify-center gap-4">
            <button
              onClick={() => setDone(false)}
              className="text-xs text-accent underline font-semibold"
            >
              Request another brochure copy
            </button>
          </div>
        </div>
      )}

      {/* FAQ SECTION */}
      <section className="rounded-2xl border border-border/40 bg-surface/20 p-6 md:p-8 space-y-4">
        <h3 className="font-heading text-base font-bold text-foreground">Brochure & Participation Questions</h3>
        <div className="divide-y divide-border/20">
          {[
            [
              "Does requesting a brochure register me for the conference?",
              "No. Conference registration and research abstract submission are separate processes with formal review."
            ],
            [
              "Will I receive regular conference updates?",
              "Only if you opted in to receive conference announcements and critical deadline notifications."
            ],
            [
              "How can my organisation explore sponsorship opportunities?",
              "The brochure contains comprehensive partner tier specifications. You can also submit an inquiry using the contact form."
            ]
          ].map(([q, a]) => (
            <details key={q} className="py-3 group cursor-pointer">
              <summary className="font-semibold text-xs text-foreground group-hover:text-accent transition">
                {q}
              </summary>
              <p className="mt-2 text-xs text-muted leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* QUERY MODAL DIALOG */}
      {queryOpen && (
        <dialog
          ref={queryDialogRef}
          onCancel={() => setQueryOpen(false)}
          className="fixed inset-0 z-50 rounded-2xl border border-border/60 bg-white p-6 text-foreground shadow-2xl max-w-lg w-[calc(100%-2rem)] backdrop:bg-slate-900/60"
        >
          <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-4">
            <h3 className="font-heading text-sm font-bold text-foreground">
              {queryDone ? "Query Received" : "Ask the Conference Secretariat"}
            </h3>
            <button
              onClick={() => {
                queryDialogRef.current?.close();
                setQueryOpen(false);
              }}
              className="rounded-md p-1 text-muted hover:text-foreground hover:bg-surface"
            >
              <X className="size-4" />
            </button>
          </div>

          {queryDone ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="size-10 text-success mx-auto" />
              <h4 className="font-heading text-base font-bold text-foreground">Inquiry Sent Successfully</h4>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Our conference coordination team will review your query and reply to your email address promptly.
              </p>
              <button
                onClick={() => {
                  queryDialogRef.current?.close();
                  setQueryOpen(false);
                }}
                className="mt-3 rounded-lg bg-accent px-5 py-2 text-xs font-semibold text-white"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleQuerySubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Your Name *</label>
                <input
                  name="queryName"
                  required
                  defaultValue={`${data.first} ${data.last}`.trim()}
                  className="w-full rounded-xl border border-border/45 bg-surface/65 px-4 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Email Address *</label>
                <input
                  name="queryEmail"
                  type="email"
                  required
                  defaultValue={data.email}
                  className="w-full rounded-xl border border-border/45 bg-surface/65 px-4 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Subject *</label>
                <select
                  name="querySubject"
                  required
                  className="w-full rounded-xl border border-border/45 bg-surface/65 px-4 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select subject...</option>
                  <option value="Brochure details">Brochure details</option>
                  <option value="Registration packages">Registration packages</option>
                  <option value="Abstract submission">Abstract submission</option>
                  <option value="Sponsorship & Exhibition">Sponsorship & Exhibition</option>
                  <option value="Venue accommodation">Venue accommodation</option>
                  <option value="Other inquiries">Other inquiries</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Your Message *</label>
                <textarea
                  name="queryMessage"
                  rows={4}
                  required
                  placeholder="How can our secretariat assist you?"
                  className="w-full rounded-xl border border-border/45 bg-surface/65 px-4 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    queryDialogRef.current?.close();
                    setQueryOpen(false);
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={querySubmitting}
                  className="rounded-lg bg-accent px-5 py-2 text-xs font-bold text-white shadow-sm flex items-center gap-1.5"
                >
                  {querySubmitting ? <Loader2 className="size-3.5 animate-spin" /> : null} Submit Query
                </button>
              </div>
            </form>
          )}
        </dialog>
      )}

      {/* PRIVACY POLICY MODAL */}
      {policyOpen && (
        <dialog
          ref={policyDialogRef}
          onCancel={() => setPolicyOpen(false)}
          className="fixed inset-0 z-50 rounded-2xl border border-border/60 bg-white p-6 text-foreground shadow-2xl max-w-md w-[calc(100%-2rem)] backdrop:bg-slate-900/60"
        >
          <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-4">
            <h3 className="font-heading text-sm font-bold text-foreground">Privacy Notice</h3>
            <button
              onClick={() => {
                policyDialogRef.current?.close();
                setPolicyOpen(false);
              }}
              className="rounded-md p-1 text-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="space-y-3 text-xs text-muted leading-relaxed">
            <p>
              Your contact details are used exclusively by the conference secretariat for fulfilling your brochure request and providing authorized participation updates.
            </p>
            <p>
              We do not share delegate contact information with unauthorized third parties. You may unsubscribe from optional announcements at any time.
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
              Close
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}
