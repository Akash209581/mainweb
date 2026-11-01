"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, ArrowRight, ShieldCheck, User, Building, MapPin, X } from "lucide-react";

export interface CommitteeMember {
  id: string;
  name: string;
  group: string;
  role: string;
  affiliation: string;
  country: string;
  expertise: string;
  bio: string;
  photo: string | null;
}

export const DEFAULT_COMMITTEE_MEMBERS: CommitteeMember[] = [
  {
    id: "chair",
    name: "Conference Chair",
    group: "Conference leadership",
    role: "Conference Chair",
    affiliation: "Institution to be confirmed",
    country: "Country to be confirmed",
    expertise: "Conference leadership",
    bio: "This space is reserved for the confirmed Conference Chair. Add the member’s approved biography, institutional affiliation and research interests here.",
    photo: null
  },
  {
    id: "cochair",
    name: "Conference Co-Chair",
    group: "Conference leadership",
    role: "Conference Co-Chair",
    affiliation: "Institution to be confirmed",
    country: "Country to be confirmed",
    expertise: "Academic collaboration",
    bio: "This space is reserved for the confirmed Conference Co-Chair. Add an approved biography and the member’s contribution to the conference.",
    photo: null
  },
  {
    id: "scientific-chair",
    name: "Scientific Committee Chair",
    group: "Scientific committee",
    role: "Scientific Committee Chair",
    affiliation: "Institution to be confirmed",
    country: "Country to be confirmed",
    expertise: "Scientific programme",
    bio: "Add the confirmed Scientific Committee Chair’s approved biography and areas of expertise. The committee structure and responsibilities should be confirmed before publication.",
    photo: null
  },
  {
    id: "scientific-member-1",
    name: "Scientific Committee Member",
    group: "Scientific committee",
    role: "Scientific Committee Member",
    affiliation: "Institution to be confirmed",
    country: "Country to be confirmed",
    expertise: "Hematology research",
    bio: "Replace this placeholder with a confirmed scientific committee member. Include only approved professional details and an authorised photograph.",
    photo: null
  },
  {
    id: "scientific-member-2",
    name: "Scientific Committee Member",
    group: "Scientific committee",
    role: "Scientific Committee Member",
    affiliation: "Institution to be confirmed",
    country: "Country to be confirmed",
    expertise: "Clinical & translational research",
    bio: "Replace this placeholder with a confirmed scientific committee member and a concise approved description of their research and professional experience.",
    photo: null
  },
  {
    id: "organizing-member",
    name: "Organizing Committee Member",
    group: "Organizing committee",
    role: "Organizing Committee Member",
    affiliation: "Institution to be confirmed",
    country: "Country to be confirmed",
    expertise: "Conference coordination",
    bio: "Add the confirmed member’s approved profile and their role in conference planning, academic coordination or participant experience.",
    photo: null
  },
  {
    id: "local-chair",
    name: "Local Organizing Chair",
    group: "Local organizing team",
    role: "Local Organizing Chair",
    affiliation: "Host institution to be confirmed",
    country: "Country to be confirmed",
    expertise: "Local coordination",
    bio: "This space is reserved for the confirmed Local Organizing Chair. Add approved details about the member and their role at the host venue.",
    photo: null
  },
  {
    id: "local-member",
    name: "Local Organizing Member",
    group: "Local organizing team",
    role: "Local Organizing Member",
    affiliation: "Host institution to be confirmed",
    country: "Country to be confirmed",
    expertise: "Venue & participant coordination",
    bio: "Replace this placeholder with a confirmed local organizing member. Include their approved affiliation and a brief professional biography.",
    photo: null
  }
];

const GROUPS = [
  "All members",
  "Conference leadership",
  "Scientific committee",
  "Organizing committee",
  "Local organizing team"
];

function getGroupCode(group: string) {
  if (group === "Conference leadership") return "CL";
  if (group === "Scientific committee") return "SC";
  if (group === "Local organizing team") return "LO";
  return "OC";
}

export function CommitteeClient({ initialMembers = DEFAULT_COMMITTEE_MEMBERS }: { initialMembers?: CommitteeMember[] }) {
  const [group, setGroup] = useState<string>("All members");
  const [query, setQuery] = useState<string>("");
  const [selected, setSelected] = useState<CommitteeMember | null>(null);
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (selected && modalRef.current && !modalRef.current.open) {
      modalRef.current.showModal();
    }
  }, [selected]);

  const visible = initialMembers.filter((m) => {
    const matchesGroup = group === "All members" || m.group === group;
    const searchTarget = `${m.name} ${m.role} ${m.affiliation} ${m.country} ${m.expertise}`.toLowerCase();
    const matchesQuery = searchTarget.includes(query.trim().toLowerCase());
    return matchesGroup && matchesQuery;
  });

  return (
    <div className="space-y-10">
      {/* FILTER & SEARCH CONTROLS */}
      <div className="rounded-2xl border border-border/40 bg-surface/40 p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
          <div className="space-y-1.5">
            <label htmlFor="member-search" className="text-xs font-semibold uppercase tracking-wider text-muted">
              Search the Committee
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 size-4 text-muted pointer-events-none" />
              <input
                id="member-search"
                type="search"
                placeholder="Search name, role, institution or expertise..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-border/45 bg-surface/65 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="member-group" className="text-xs font-semibold uppercase tracking-wider text-muted">
              Committee Role / Section
            </label>
            <select
              id="member-group"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="w-full rounded-xl border border-border/45 bg-surface/65 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-muted border-t border-border/20 pt-3">
          <span>Showing <b>{visible.length}</b> committee profile(s)</span>
          {(group !== "All members" || query) && (
            <button
              onClick={() => {
                setGroup("All members");
                setQuery("");
              }}
              className="text-accent underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* MEMBER GRID */}
      {visible.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((m) => (
            <article
              key={m.id}
              className="group rounded-2xl border border-border/30 bg-surface/30 p-5 space-y-4 hover:border-accent hover:shadow-lg transition duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] text-muted font-bold border-b border-border/20 pb-2 mb-3">
                  <span>{m.group}</span>
                  <span className="bg-amber-500/10 text-amber-700 border border-amber-500/30 rounded-full px-2 py-0.5 text-[9px]">
                    To be confirmed
                  </span>
                </div>

                <div className="aspect-[4/3] rounded-xl bg-surface/60 border border-border/30 flex flex-col items-center justify-center gap-1 text-muted mb-4">
                  <span className="font-heading text-3xl font-bold text-foreground/70">
                    {getGroupCode(m.group)}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-muted">Photo Pending</span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent block">
                    {m.role}
                  </span>
                  <h3 className="font-heading text-base font-bold text-foreground">
                    Member name to be announced
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">{m.affiliation}</p>
                  <p className="text-[11px] text-muted/80">{m.country}</p>
                  <div className="pt-2 border-t border-border/20 mt-2 text-xs font-semibold text-accent">
                    {m.expertise}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelected(m)}
                className="mt-4 w-full rounded-lg border border-border/40 bg-surface/80 py-2 text-xs font-semibold text-foreground hover:bg-accent hover:text-white transition"
              >
                View profile details →
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/40 p-12 text-center space-y-3">
          <h3 className="font-heading text-lg font-bold text-foreground">No matching committee profiles</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Try adjusting your search keywords or switch to &quot;All members&quot; to review the full team.
          </p>
          <button
            onClick={() => {
              setGroup("All members");
              setQuery("");
            }}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white mt-2"
          >
            Show all committee profiles
          </button>
        </div>
      )}

      {/* COMMITTEE PRINCIPLES */}
      <section className="rounded-2xl border border-border/40 bg-surface/20 p-8 space-y-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent">Working Together</span>
          <h2 className="mt-1 font-heading text-2xl font-bold text-foreground">
            A considered approach to conference organisation.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <article className="border-t border-border/30 pt-4 space-y-2">
            <span className="font-heading text-2xl font-bold text-accent">01</span>
            <h3 className="font-heading text-base font-bold text-foreground">Scientific Programme</h3>
            <p className="text-xs leading-relaxed text-muted">
              Proposed remit: help define themes, oversee double-blind peer reviews, and curate rigorous technical sessions.
            </p>
          </article>

          <article className="border-t border-border/30 pt-4 space-y-2">
            <span className="font-heading text-2xl font-bold text-accent">02</span>
            <h3 className="font-heading text-base font-bold text-foreground">Academic Collaboration</h3>
            <p className="text-xs leading-relaxed text-muted">
              Proposed remit: connect participating university laboratories, research institutes, and scientific societies worldwide.
            </p>
          </article>

          <article className="border-t border-border/30 pt-4 space-y-2">
            <span className="font-heading text-2xl font-bold text-accent">03</span>
            <h3 className="font-heading text-base font-bold text-foreground">Conference Experience</h3>
            <p className="text-xs leading-relaxed text-muted">
              Proposed remit: coordinate venue logistics, hybrid streaming protocols, and meaningful delegate engagements.
            </p>
          </article>
        </div>
      </section>

      {/* CTA BANNER */}
      <div className="rounded-2xl bg-[#102e4c] text-white p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
            Join the Scientific Conversation
          </span>
          <h2 className="font-heading text-2xl font-bold text-white">
            Share your research with the global community.
          </h2>
          <p className="text-xs text-slate-300 max-w-lg">
            Review the 12 scientific conference tracks and prepare your abstract contribution.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/sessions"
            className="rounded-lg bg-amber-600 hover:bg-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-md transition"
          >
            Explore Scientific Tracks →
          </Link>
          <Link
            href="/abstracts"
            className="rounded-lg border border-white/30 bg-white/10 hover:bg-white/20 px-5 py-2.5 text-xs font-bold text-white transition"
          >
            Submit Abstract
          </Link>
        </div>
      </div>

      {/* PROFILE MODAL */}
      {selected && (
        <dialog
          ref={modalRef}
          onCancel={() => setSelected(null)}
          className="fixed inset-0 z-50 rounded-2xl border border-border/60 bg-white p-6 text-foreground shadow-2xl max-w-xl w-[calc(100%-2rem)] backdrop:bg-slate-900/60"
        >
          <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
              Committee Profile Details
            </span>
            <button
              onClick={() => {
                modalRef.current?.close();
                setSelected(null);
              }}
              className="rounded-md p-1 text-muted hover:text-foreground hover:bg-surface"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <div className="size-20 rounded-xl bg-slate-100 flex items-center justify-center font-heading text-2xl font-bold text-slate-500 shrink-0">
                {getGroupCode(selected.group)}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent block">
                  {selected.role}
                </span>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  Member name to be announced
                </h3>
                <p className="text-xs text-muted">{selected.affiliation}</p>
                <p className="text-[11px] text-muted/70">{selected.country}</p>
              </div>
            </div>

            <div className="space-y-2 border-t border-border/20 pt-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Biography</h4>
              <p className="text-xs text-muted leading-relaxed">{selected.bio}</p>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Area of Contribution</h4>
              <p className="text-xs font-semibold text-accent">{selected.expertise}</p>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 leading-relaxed">
              Placeholder profile layout. Official appointments and approved biographies will be announced following committee ratification.
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  modalRef.current?.close();
                  setSelected(null);
                }}
                className="rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background"
              >
                Close
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}

