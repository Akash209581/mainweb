import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { CONFERENCE, NAVIGATION_ITEMS } from "@/constants/conference";

const resourceLinks = [
  { label: "Brochure", href: "/brochure" },
  { label: "Abstract Submission", href: "/abstracts" },
  { label: "Registration", href: "/registration" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" }
];

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-surface/35">
      <div className="container grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
        <div>
          <Link href="/" className="font-heading text-2xl font-bold text-foreground">
            {CONFERENCE.name}
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-muted">{CONFERENCE.fullName}</p>
          <p className="mt-4 text-sm text-muted">{CONFERENCE.dates}</p>
        </div>
        <div>
          <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.16em] text-foreground">
            Quick Links
          </h2>
          <div className="mt-4 grid gap-3">
            {NAVIGATION_ITEMS.slice(0, 5).map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-muted hover:text-accent">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.16em] text-foreground">
            Resources
          </h2>
          <div className="mt-4 grid gap-3">
            {resourceLinks.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-muted hover:text-accent">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.16em] text-foreground">
            Contact
          </h2>
          <div className="mt-4 grid gap-3 text-sm text-muted">
            <p className="flex gap-3">
              <MapPin className="size-4 shrink-0 text-accent" aria-hidden="true" />
              <span>
                {CONFERENCE.venue}, {CONFERENCE.city}, {CONFERENCE.country}
              </span>
            </p>
            <p className="flex gap-3">
              <Mail className="size-4 shrink-0 text-accent" aria-hidden="true" />
              <span>{CONFERENCE.email}</span>
            </p>
            <p className="flex gap-3">
              <Phone className="size-4 shrink-0 text-accent" aria-hidden="true" />
              <span>{CONFERENCE.phone}</span>
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-border/35 py-5">
        <div className="container text-sm text-muted">
          Copyright 2026 {CONFERENCE.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
