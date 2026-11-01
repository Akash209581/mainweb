"use client";

import { useEffect, useState } from "react";
import { Check, CheckCircle2, Loader2, Sparkles, ShieldCheck, ArrowRight, ArrowLeft, Printer, ExternalLink, Calendar, MapPin, Building, User } from "lucide-react";
import Link from "next/link";
import { submitHansciRegistrationAction, type RegistrationActionResult } from "@/actions/registration.actions";

export const CATEGORIES: Record<string, {
  name: string;
  description: string;
  prices?: { EUR: number; USD: number; GBP: number };
  quote?: boolean;
}> = {
  student: {
    name: "Student",
    description: "For undergraduate, postgraduate and doctoral students.",
    prices: { EUR: 199, USD: 219, GBP: 179 }
  },
  academic: {
    name: "Academic delegate",
    description: "For faculty, researchers and scientific professionals.",
    prices: { EUR: 399, USD: 439, GBP: 359 }
  },
  industry: {
    name: "Industry delegate",
    description: "For professionals from companies and commercial organisations.",
    prices: { EUR: 499, USD: 549, GBP: 449 }
  },
  exhibition: {
    name: "Exhibition",
    description: "Showcase your products, services and research solutions.",
    quote: true
  },
  sponsorship: {
    name: "Sponsorship",
    description: "Choose a partnership that supports scientific exchange.",
    quote: true
  },
  accommodation: {
    name: "Accommodation",
    description: "Request a room at the conference venue. Conference admission is not included."
  }
};

export const ROOMS: Record<string, { EUR: number; USD: number; GBP: number }> = {
  single: { EUR: 120, USD: 135, GBP: 105 },
  double: { EUR: 160, USD: 180, GBP: 140 }
};

const INITIAL = {
  first: "",
  last: "",
  email: "",
  institution: "",
  country: "",
  role: "",
  abstract: "",
  package: "",
  representatives: "1",
  interests: "",
  stay: false,
  checkin: "",
  checkout: "",
  room: "single" as "single" | "double",
  rooms: "1",
  guests: "1",
  beds: "No preference",
  staynotes: "",
  invoice: false,
  billingOrg: "",
  address: "",
  taxid: "",
  po: "",
  terms: false,
  captcha: ""
};

interface CountryOption {
  id: string;
  name: string;
}

interface RegistrationFormProps {
  initialCountries?: CountryOption[];
  customPricing?: {
    registration?: {
      student?: { EUR: number; USD: number; GBP: number };
      academic?: { EUR: number; USD: number; GBP: number };
      industry?: { EUR: number; USD: number; GBP: number };
    };
    accommodation?: {
      single?: { EUR: number; USD: number; GBP: number };
      double?: { EUR: number; USD: number; GBP: number };
    };
  };
}

export function RegistrationForm({ initialCountries = [], customPricing }: RegistrationFormProps) {
  const [step, setStep] = useState<number>(0);
  const [currency, setCurrency] = useState<"EUR" | "USD" | "GBP">("EUR");
  const [category, setCategory] = useState<string>("academic");
  const [data, setData] = useState(INITIAL);
  const [countries, setCountries] = useState<string[]>([]);
  const [challenge, setChallenge] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<RegistrationActionResult | null>(null);

  const activeCategories: Record<string, {
    name: string;
    description: string;
    prices?: { EUR: number; USD: number; GBP: number };
    quote?: boolean;
  }> = {
    ...CATEGORIES,
    student: {
      ...CATEGORIES.student,
      prices: customPricing?.registration?.student || CATEGORIES.student.prices
    },
    academic: {
      ...CATEGORIES.academic,
      prices: customPricing?.registration?.academic || CATEGORIES.academic.prices
    },
    industry: {
      ...CATEGORIES.industry,
      prices: customPricing?.registration?.industry || CATEGORIES.industry.prices
    }
  };

  const activeRooms = {
    single: customPricing?.accommodation?.single || ROOMS.single,
    double: customPricing?.accommodation?.double || ROOMS.double
  };

  const current = activeCategories[category] || activeCategories.academic;
  const partner = Boolean(current.quote);
  const stay = category === "accommodation" || data.stay;
  const nights =
    data.checkin && data.checkout
      ? Math.max(0, Math.round((Date.parse(data.checkout) - Date.parse(data.checkin)) / 86400000))
      : 0;

  const lodging = stay ? nights * Number(data.rooms) * (activeRooms[data.room]?.[currency] || 0) : 0;
  const registration = current.prices?.[currency] || 0;

  const money = (value: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }).format(value);

  function refreshCaptcha() {
    const values = new Uint32Array(2);
    crypto.getRandomValues(values);
    setChallenge([2 + (values[0] % 8), 1 + (values[1] % 9)]);
    setData((d) => ({ ...d, captcha: "" }));
    setError("");
  }

  useEffect(() => {
    if (initialCountries.length > 0) {
      setCountries(initialCountries.map((c) => c.name));
    } else {
      try {
        const names = new Intl.DisplayNames(["en"], { type: "region" });
        const regions: string[] = [];
        for (let a = 65; a <= 90; a++) {
          for (let b = 65; b <= 90; b++) {
            const code = String.fromCharCode(a, b);
            const name = names.of(code);
            if (name && name !== code && !["EU", "UN", "EZ", "QO", "XA", "XB", "ZZ"].includes(code)) {
              regions.push(name);
            }
          }
        }
        setCountries([...new Set(regions)].sort());
      } catch {
        setCountries(["United Arab Emirates", "United Kingdom", "United States", "Germany", "India", "Canada", "Australia", "France"]);
      }
    }
    refreshCaptcha();
  }, [initialCountries]);

  function change(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const target = e.target;
    const name = target.name;
    const type = target.type;
    const value = target.value;
    const checked = (target as HTMLInputElement).checked;

    setData((d) => ({
      ...d,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "room" && value === "single" ? { guests: "1" } : {})
    }));
    setError("");
  }

  function go(n: number) {
    setStep(n);
    setError("");
    requestAnimationFrame(() => {
      document.getElementById("registration-container")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  function choose(key: string) {
    setCategory(key);
    setData((d) => ({ ...d, package: "" }));
    go(1);
  }

  function review(e: React.FormEvent) {
    e.preventDefault();
    if (stay && (!nights || Number(data.rooms) < 1)) {
      setError("Please choose a valid check-out date after check-in and at least 1 room.");
      return;
    }
    if (
      !challenge ||
      data.captcha.trim() === "" ||
      Number(data.captcha) !== challenge[0] + challenge[1]
    ) {
      setError("Please answer the arithmetic verification challenge correctly.");
      return;
    }
    if (!data.terms) {
      setError("Please accept the Terms & Conditions and Privacy Notice to proceed.");
      return;
    }
    go(2);
  }

  async function handleFinalSubmit() {
    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        conferenceSlug: "icgit-2026",
        first: data.first,
        last: data.last,
        fullName: `${data.first} ${data.last}`.trim(),
        email: data.email,
        institution: data.institution,
        organization: data.institution,
        country: data.country,
        category,
        currency,
        role: data.role || undefined,
        abstract: data.abstract || undefined,
        package: data.package || undefined,
        representatives: data.representatives ? Number(data.representatives) : undefined,
        interests: data.interests || undefined,
        stay,
        checkin: stay ? data.checkin : undefined,
        checkout: stay ? data.checkout : undefined,
        room: stay ? data.room : "single",
        rooms: stay ? Number(data.rooms) : 1,
        guests: stay ? data.guests : "1",
        beds: stay ? data.beds : "No preference",
        staynotes: stay ? data.staynotes : undefined,
        invoice: data.invoice,
        billingOrg: data.invoice ? data.billingOrg : undefined,
        address: data.invoice ? data.address : undefined,
        taxid: data.invoice ? data.taxid : undefined,
        po: data.invoice ? data.po : undefined,
        terms: data.terms
      };

      const res = await submitHansciRegistrationAction(payload);
      if (!res.ok) {
        throw new Error(res.message || "Failed to process registration.");
      }

      setSubmissionResult(res);
      setStep(3); // Success Screen
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred during submission.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  const summaryRows = [
    ["Currency", currency],
    ...(current.prices ? [["Registration", money(registration)]] : []),
    ...(partner ? [["Package", "Quote required"]] : []),
    ...(stay
      ? [
          ["Room", data.room === "single" ? "Single" : "Double / twin"],
          ["Rooms / nights", `${data.rooms} / ${nights || "Select dates"}`],
          ["Accommodation", nights ? money(lodging) : "Dates required"]
        ]
      : []),
    ...(category === "accommodation" ? [["Conference admission", "Not included"]] : [])
  ];

  const summary = (
    <aside className="panel summary" aria-live="polite">
      <div className="eyebrow">Your selection</div>
      <h3>{current.name}</h3>
      {summaryRows.map(([a, b]) => (
        <div className="sumrow" key={a}>
          <span>{a}</span>
          <span>{b}</span>
        </div>
      ))}
      <div className={"price" + (partner ? " quote" : "")}>
        {partner
          ? "Quote required"
          : category === "accommodation" && !nights
          ? "Select dates"
          : money(registration + lodging)}
      </div>
      <p>
        {partner
          ? "Package fees require a separate quote. Our secretariat will contact you."
          : "Registration fee and venue accommodation subtotal. Official invoice included."}
      </p>
    </aside>
  );

  return (
    <div id="registration-container" className="hansci-reg">
      {/* STEP PROGRESS INDICATOR */}
      <div className="progress" aria-label="Registration progress">
        {["Category & Currency", "Participant Details", "Review & Confirm"].map((label, i) => (
          <div
            className={"step" + (i <= step ? " active" : "")}
            aria-current={i === step ? "step" : undefined}
            key={label}
          >
            <span className="num">{i + 1}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* STEP 0: CATEGORY SELECTION */}
      {step === 0 && (
        <section>
          <div className="currencybar">
            <label htmlFor="currency">
              <b>Preferred currency:</b>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as "EUR" | "USD" | "GBP")}
              >
                <option value="EUR">EUR · Euro (€)</option>
                <option value="USD">USD · US Dollar ($)</option>
                <option value="GBP">GBP · British Pound (£)</option>
              </select>
            </label>
            <p>Direct pass rates in {currency}. Applicable globally.</p>
          </div>

          <h2 className="font-heading text-2xl font-bold text-foreground">
            A place for every scientific perspective.
          </h2>
          <p className="sub">
            Choose your registration category below. You can add official venue accommodation in the next step.
          </p>

          <div className="cards">
            {Object.entries(activeCategories).map(([key, c]) => {
              const isSelected = key === category;
              return (
                <article
                  key={key}
                  className={"ticket" + (isSelected ? " selected" : "")}
                >
                  <div className="eyebrow">
                    {c.quote
                      ? "Partnership"
                      : key === "accommodation"
                      ? "Venue Accommodation"
                      : "Delegate Registration"}
                  </div>
                  <h3>{c.name}</h3>
                  <p>{c.description}</p>
                  <div className={"price" + (c.quote ? " quote" : "")}>
                    {c.quote
                      ? "Request quote"
                      : money(c.prices?.[currency] ?? activeRooms.single[currency])}
                    <small>
                      {c.quote
                        ? ""
                        : key === "accommodation"
                        ? " / room / night"
                        : " / participant"}
                    </small>
                  </div>
                  <span className="tax">Includes digital certificate & proceedings</span>
                  <ul>
                    {(key === "accommodation"
                      ? [
                          "Single or double / twin room",
                          "Choose check-in and check-out",
                          "Conference admission not included"
                        ]
                      : c.quote
                      ? [
                          "Premium display space",
                          "Organisation profiling",
                          "Optional venue accommodation"
                        ]
                      : [
                          "All scientific sessions & keynotes",
                          "Conference kit & digital materials",
                          "Verified attendance certificate",
                          "Optional venue accommodation"
                        ]
                    ).map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className={"button" + (isSelected ? " primary" : "")}
                    onClick={() => choose(key)}
                  >
                    Select {c.name} →
                  </button>
                </article>
              );
            })}
          </div>

          <div className="helper">
            <div>
              <b>Presenting your research?</b> Abstract submission and conference registration are linked. If you have an abstract reference ID, you can include it during participant details.
            </div>
          </div>
        </section>
      )}

      {/* STEP 1: PARTICIPANT DETAILS */}
      {step === 1 && (
        <section>
          <h2 className="font-heading text-2xl font-bold text-foreground">
            Complete your registration details.
          </h2>
          <p className="sub">Fields marked with * are required.</p>

          <div className="layout">
            <form className="panel" onSubmit={review}>
              <h3 className="sectiontitle">Contact & Participant Information</h3>
              <div className="fields">
                <label>
                  First name *
                  <input
                    name="first"
                    type="text"
                    required
                    maxLength={80}
                    value={data.first}
                    onChange={change}
                    placeholder="e.g. Alex"
                  />
                </label>
                <label>
                  Last name *
                  <input
                    name="last"
                    type="text"
                    required
                    maxLength={80}
                    value={data.last}
                    onChange={change}
                    placeholder="e.g. Morgan"
                  />
                </label>
                <label>
                  Email address *
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={200}
                    value={data.email}
                    onChange={change}
                    placeholder="e.g. alex.morgan@institution.org"
                  />
                </label>
                <label>
                  Institution / Organisation *
                  <input
                    name="institution"
                    type="text"
                    required
                    maxLength={200}
                    value={data.institution}
                    onChange={change}
                    placeholder="e.g. University / Tech Institute"
                  />
                </label>
                <label>
                  Country / Region *
                  <select
                    name="country"
                    required
                    value={data.country}
                    onChange={change}
                  >
                    <option value="">Select country / region...</option>
                    {countries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>

                {!partner && category !== "accommodation" && (
                  <label>
                    Participation role *
                    <select
                      name="role"
                      required
                      value={data.role}
                      onChange={change}
                    >
                      <option value="">Select role...</option>
                      <option value="Attendee">Attendee</option>
                      <option value="Oral presenter">Oral presenter</option>
                      <option value="Poster presenter">Poster presenter</option>
                      <option value="Invited speaker">Invited speaker</option>
                    </select>
                  </label>
                )}

                {!partner && category !== "accommodation" && (
                  <label>
                    Abstract reference (optional)
                    <input
                      name="abstract"
                      type="text"
                      maxLength={80}
                      value={data.abstract}
                      onChange={change}
                      placeholder="e.g. ABS-2026-9281"
                    />
                  </label>
                )}
              </div>

              {category === "student" && (
                <p className="status">
                  Student eligibility: Please ensure you bring your valid student identification or proof of enrollment to the venue.
                </p>
              )}

              {/* PARTNER / EXHIBITION / SPONSORSHIP */}
              {partner && (
                <>
                  <h3 className="sectiontitle later">{current.name} Specifications</h3>
                  <div className="fields">
                    <label>
                      {category === "exhibition" ? "Exhibition format *" : "Sponsorship tier *"}
                      <select
                        name="package"
                        required
                        value={data.package}
                        onChange={change}
                      >
                        <option value="">Select package tier...</option>
                        {category === "exhibition" ? (
                          <>
                            <option value="Tabletop display">Tabletop display</option>
                            <option value="Standard exhibition stand">Standard exhibition stand</option>
                            <option value="Custom exhibition space">Custom exhibition space</option>
                          </>
                        ) : (
                          <>
                            <option value="Platinum">Platinum Partner</option>
                            <option value="Gold">Gold Partner</option>
                            <option value="Silver">Silver Partner</option>
                            <option value="Custom partnership">Custom partnership</option>
                          </>
                        )}
                      </select>
                    </label>
                    <label>
                      Number of representatives *
                      <input
                        name="representatives"
                        type="number"
                        min={1}
                        max={100}
                        required
                        value={data.representatives}
                        onChange={change}
                      />
                    </label>
                    <label className="full" style={{ gridColumn: "1 / -1" }}>
                      Products, services or partnership interests
                      <textarea
                        name="interests"
                        rows={3}
                        maxLength={1000}
                        value={data.interests}
                        onChange={change}
                        placeholder="Brief overview of your display focus or sponsorship goals..."
                      />
                    </label>
                  </div>
                  <p className="status">
                    Space allocation, booth specifications and branding benefits will be finalized upon proposal confirmation.
                  </p>
                </>
              )}

              {/* VENUE ACCOMMODATION */}
              <h3 className="sectiontitle later">
                {category === "accommodation"
                  ? "Conference Venue Accommodation"
                  : "Add Venue Accommodation"}
              </h3>
              <p className="stayintro">
                All room requests are hosted directly at the official conference venue hotel with complimentary breakfast.
              </p>

              {category !== "accommodation" && (
                <label className="check">
                  <input
                    name="stay"
                    type="checkbox"
                    checked={data.stay}
                    onChange={change}
                  />
                  <span>
                    <b>Include venue accommodation with registration</b>
                    <br />
                    Reserve guest room(s) at the conference venue.
                  </span>
                </label>
              )}

              {stay && (
                <>
                  <div className="fields" style={{ marginTop: 20 }}>
                    <label>
                      Check-in date *
                      <input
                        name="checkin"
                        type="date"
                        required
                        value={data.checkin}
                        onChange={change}
                      />
                    </label>
                    <label>
                      Check-out date *
                      <input
                        name="checkout"
                        type="date"
                        min={data.checkin || undefined}
                        required
                        value={data.checkout}
                        onChange={change}
                      />
                    </label>
                    <label>
                      Room type *
                      <select
                        name="room"
                        required
                        value={data.room}
                        onChange={change}
                      >
                        <option value="single">Single Room ({money(activeRooms.single[currency])}/night)</option>
                        <option value="double">Double / Twin Room ({money(activeRooms.double[currency])}/night)</option>
                      </select>
                    </label>
                    <label>
                      Number of rooms *
                      <input
                        name="rooms"
                        type="number"
                        min={1}
                        max={20}
                        required
                        value={data.rooms}
                        onChange={change}
                      />
                    </label>
                    <label>
                      Guests per room *
                      <select
                        name="guests"
                        required
                        value={data.guests}
                        onChange={change}
                      >
                        <option value="1">1 Guest</option>
                        {data.room === "double" && <option value="2">2 Guests</option>}
                      </select>
                    </label>
                    <label>
                      Bedding preference
                      <select
                        name="beds"
                        value={data.beds}
                        onChange={change}
                      >
                        <option value="No preference">No preference</option>
                        <option value="Double bed">Double bed</option>
                        <option value="Twin beds">Twin beds</option>
                      </select>
                    </label>
                    <label style={{ gridColumn: "1 / -1" }}>
                      Special accommodation requests
                      <textarea
                        name="staynotes"
                        rows={2}
                        maxLength={500}
                        value={data.staynotes}
                        onChange={change}
                        placeholder="e.g. Quiet room, late check-in, accessibility requirements..."
                      />
                    </label>
                  </div>
                  <p className="stay-preview">
                    {nights
                      ? `${money(lodging)} accommodation subtotal · ${nights} night(s)`
                      : `${money(ROOMS[data.room][currency])} per room / night · please select dates`}
                  </p>
                </>
              )}

              {/* INVOICE INFORMATION */}
              <h3 className="sectiontitle later">Invoice & Billing</h3>
              <label className="check">
                <input
                  name="invoice"
                  type="checkbox"
                  checked={data.invoice}
                  onChange={change}
                />
                <span>Generate official tax invoice addressed to my institution/company</span>
              </label>

              {data.invoice && (
                <div className="fields" style={{ marginTop: 20 }}>
                  <label>
                    Billing organisation name *
                    <input
                      name="billingOrg"
                      type="text"
                      required
                      maxLength={200}
                      value={data.billingOrg}
                      onChange={change}
                      placeholder="e.g. Oxford University Research Centre"
                    />
                  </label>
                  <label>
                    Tax / VAT / GST reference
                    <input
                      name="taxid"
                      type="text"
                      maxLength={80}
                      value={data.taxid}
                      onChange={change}
                      placeholder="e.g. GB123456789"
                    />
                  </label>
                  <label style={{ gridColumn: "1 / -1" }}>
                    Billing address *
                    <textarea
                      name="address"
                      required
                      rows={2}
                      maxLength={600}
                      value={data.address}
                      onChange={change}
                      placeholder="Street address, city, postal code, country..."
                    />
                  </label>
                  <label>
                    Purchase Order (PO) number
                    <input
                      name="po"
                      type="text"
                      maxLength={80}
                      value={data.po}
                      onChange={change}
                      placeholder="e.g. PO-8921"
                    />
                  </label>
                </div>
              )}

              {/* CAPTCHA & VERIFICATION */}
              <h3 className="sectiontitle later">Verification & Terms</h3>
              <div className="captcha-box">
                <div className="captcha-top">
                  <b>Security Verification Challenge *</b>
                  <button type="button" className="linkbutton" onClick={refreshCaptcha}>
                    Change challenge
                  </button>
                </div>
                <div className="fields">
                  <label>
                    {challenge ? `What is ${challenge[0]} + ${challenge[1]}?` : "Loading challenge..."}
                    <input
                      name="captcha"
                      type="number"
                      required
                      inputMode="numeric"
                      value={data.captcha}
                      onChange={change}
                      placeholder="Answer"
                    />
                  </label>
                </div>
                <p className="mini">Math challenge protects the registration registry from automated submissions.</p>
              </div>

              <label className="check">
                <input
                  name="terms"
                  type="checkbox"
                  required
                  checked={data.terms}
                  onChange={change}
                />
                <span>
                  I accept the <b>Terms & Conditions</b> and agree to the <b>Privacy Policy</b>. *
                </span>
              </label>

              {error && (
                <div className="status error" role="alert">
                  {error}
                </div>
              )}

              <div className="actions">
                <button
                  type="button"
                  className="button"
                  onClick={() => go(0)}
                >
                  <ArrowLeft className="size-4 mr-2" /> Back
                </button>
                <button
                  type="submit"
                  className="button primary"
                  disabled={!challenge}
                >
                  Review Details <ArrowRight className="size-4 ml-2" />
                </button>
              </div>
            </form>

            {summary}
          </div>
        </section>
      )}

      {/* STEP 2: REVIEW & SUBMIT */}
      {step === 2 && (
        <section>
          <h2 className="font-heading text-2xl font-bold text-foreground">
            Review and Confirm Your Registration.
          </h2>
          <p className="sub">
            Please inspect your participant information and selections before final confirmation.
          </p>

          <div className="layout">
            <div className="panel">
              <div className="reviewtitle">
                <h3 className="font-bold text-lg text-foreground">Participant Summary</h3>
                <button className="linkbutton" onClick={() => go(1)}>
                  Edit details
                </button>
              </div>

              <div className="reviewgrid">
                {[
                  ["Name", `${data.first} ${data.last}`],
                  ["Email", data.email],
                  ["Organisation", data.institution],
                  ["Country / region", data.country],
                  [
                    "Participation role / package",
                    partner ? data.package : category === "accommodation" ? "Accommodation only" : data.role
                  ],
                  ["Abstract reference", data.abstract || "None provided"],
                  ...(partner
                    ? [
                        ["Representatives", data.representatives],
                        ["Interests", data.interests || "None provided"]
                      ]
                    : [])
                ].map(([k, v]) => (
                  <dl key={k}>
                    <dt>{k}</dt>
                    <dd>{v || "Not provided"}</dd>
                  </dl>
                ))}
              </div>

              {stay && (
                <>
                  <h3 className="sectiontitle later">Venue Accommodation Details</h3>
                  <div className="reviewgrid">
                    {[
                      ["Check-in", data.checkin],
                      ["Check-out", data.checkout],
                      ["Room type", data.room === "single" ? "Single Room" : "Double / Twin Room"],
                      ["Rooms / Guests per room", `${data.rooms} room(s) / ${data.guests} guest(s)`],
                      ["Nights", `${nights} night(s)`],
                      ["Accommodation subtotal", money(lodging)],
                      ["Bed preference", data.beds],
                      ["Requests", data.staynotes || "None"]
                    ].map(([k, v]) => (
                      <dl key={k}>
                        <dt>{k}</dt>
                        <dd>{v || "Not provided"}</dd>
                      </dl>
                    ))}
                  </div>
                </>
              )}

              {data.invoice && (
                <>
                  <h3 className="sectiontitle later">Invoice Specifications</h3>
                  <div className="reviewgrid">
                    {[
                      ["Billing Organisation", data.billingOrg],
                      ["Billing Address", data.address],
                      ["Tax / VAT ID", data.taxid || "Not provided"],
                      ["Purchase Order", data.po || "Not provided"]
                    ].map(([k, v]) => (
                      <dl key={k}>
                        <dt>{k}</dt>
                        <dd>{v || "Not provided"}</dd>
                      </dl>
                    ))}
                  </div>
                </>
              )}

              {error && (
                <div className="status error" role="alert">
                  {error}
                </div>
              )}

              <div className="actions">
                <button
                  type="button"
                  className="button"
                  onClick={() => go(1)}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="size-4 mr-2" /> Edit Details
                </button>
                <button
                  type="button"
                  className="button primary"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Securing Registration...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4 mr-2" />
                      {partner ? "Submit Quote Request" : "Confirm & Complete Registration"}
                    </>
                  )}
                </button>
              </div>
            </div>

            {summary}
          </div>
        </section>
      )}

      {/* STEP 3: REGISTRATION SUCCESSFUL / CONFIRMED */}
      {step === 3 && submissionResult && (
        <section className="space-y-6">
          <div className="panel text-center py-10 px-6 border-success/30 bg-success/5 rounded-2xl max-w-2xl mx-auto shadow-sm">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/20 text-success mb-4">
              <CheckCircle2 className="size-10" />
            </div>

            <span className="text-xs font-bold uppercase tracking-widest text-success">
              {submissionResult.isQuoteRequired ? "Quote Request Submitted" : "Registration Confirmed"}
            </span>

            <h2 className="mt-2 text-2xl font-bold font-heading text-foreground">
              {submissionResult.isQuoteRequired
                ? "Your partnership inquiry is in progress!"
                : "Welcome to ICGIT 2026!"}
            </h2>

            <p className="mt-3 text-sm text-muted max-w-md mx-auto leading-relaxed">
              {submissionResult.isQuoteRequired
                ? "Our sponsorship and exhibition secretariat will review your requirements and follow up with a proposal."
                : `Thank you, ${data.first}. Your registration pass has been confirmed and stored in the conference registry.`}
            </p>

            <div className="my-6 p-4 rounded-xl border border-border bg-white inline-block text-left shadow-xs">
              <div className="text-[11px] uppercase tracking-wider text-muted font-bold">
                Registration Reference Number
              </div>
              <div className="text-xl font-mono font-bold text-accent mt-0.5">
                {submissionResult.referenceNumber}
              </div>
              <div className="text-xs text-muted mt-1">
                A confirmation summary has been sent to <b>{data.email}</b>.
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="button"
              >
                <Printer className="size-4 mr-2" /> Print Summary
              </button>

              <Link href="/abstracts" className="button primary">
                Submit Research Abstract <ArrowRight className="size-4 ml-2" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* FAQS SECTION */}
      <section className="faq" id="questions">
        <h3>Frequently Asked Questions</h3>
        {[
          ["Does registration confirm abstract acceptance?", "No. Abstract submissions are evaluated independently by our double-blind scientific review committee."],
          ["Can I include venue accommodation?", "Yes. You can add guest rooms directly at the conference hotel or book accommodation independently."],
          ["What currencies are supported?", "We provide official rates in EUR (€), USD ($), and GBP (£) to facilitate institutional reimbursements worldwide."],
          ["Can I receive an official invoice?", "Yes. If selected, a formal invoice specifying VAT/tax ID, PO number, and institution billing details is generated."],
          ["What are the cancellation and refund policies?", "Cancellations made up to 30 days before conference commencement are eligible for full refund minus processing fees."]
        ].map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
