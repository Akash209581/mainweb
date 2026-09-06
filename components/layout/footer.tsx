import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { CONFERENCE, NAVIGATION_ITEMS } from "@/constants/conference";

const defaultResourceLinks = [
  { label: "Brochure", href: "/brochure" },
  { label: "Abstract Submission", href: "/abstracts" },
  { label: "Registration", href: "/registration" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" }
];

export interface FooterConferenceInfo {
  name?: string;
  fullName?: string;
  dates?: string;
  venue?: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
}

export interface FooterProps {
  conference?: FooterConferenceInfo;
  navItems?: Array<{ label: string; href: string }>;
  footerContent?: {
    tagline?: string;
    contactEmail?: string;
    email?: string;
    contactPhone?: string;
    phone?: string;
    contactAddress?: string;
    footerCopyright?: string;
    copyright?: string;
    quickLinks?: Array<{ label: string; href: string }>;
    resourceLinks?: Array<{ label: string; href: string }>;
    [key: string]: unknown;
  };
}

export function Footer({ conference, navItems, footerContent }: FooterProps) {
  const name = conference?.name || CONFERENCE.name;
  const fullName = footerContent?.tagline || conference?.fullName || CONFERENCE.fullName;
  const dates = conference?.dates || CONFERENCE.dates;
  const venue = conference?.venue || CONFERENCE.venue;
  const city = conference?.city || CONFERENCE.city;
  const country = conference?.country || CONFERENCE.country;
  const email = footerContent?.contactEmail || footerContent?.email || conference?.email || CONFERENCE.email;
  const phone = footerContent?.contactPhone || footerContent?.phone || conference?.phone || CONFERENCE.phone;
  const address = footerContent?.contactAddress || `${venue}, ${city}, ${country}`;
  const copyright = footerContent?.footerCopyright || footerContent?.copyright || `Copyright 2026 ${name}. All rights reserved.`;

  const quickLinks =
    footerContent?.quickLinks && Array.isArray(footerContent.quickLinks) && footerContent.quickLinks.length > 0
      ? footerContent.quickLinks
      : navItems && navItems.length > 0
      ? navItems.slice(0, 7)
      : NAVIGATION_ITEMS.slice(0, 7);

  const resourceLinks =
    footerContent?.resourceLinks && Array.isArray(footerContent.resourceLinks) && footerContent.resourceLinks.length > 0
      ? footerContent.resourceLinks
      : defaultResourceLinks;

  return (
    <footer className="border-t border-border/40 bg-[#f7f4ee]">
      <div className="container grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
        <div>
          <Link href="/" className="font-heading text-2xl font-bold text-foreground">
            {name}
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-muted">{fullName}</p>
          <p className="mt-4 text-sm text-muted">{dates}</p>
        </div>
        <div>
          <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.16em] text-foreground">
            Quick Links
          </h2>
          <div className="mt-4 grid gap-3">
            {quickLinks.map((item, idx) => (
              <Link key={`${item.href}-${idx}`} href={item.href} className="text-sm text-muted hover:text-accent transition-colors">
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
            {resourceLinks.map((item, idx) => (
              <Link key={`${item.href}-${idx}`} href={item.href} className="text-sm text-muted hover:text-accent transition-colors">
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
              <span>{address}</span>
            </p>
            <p className="flex gap-3">
              <Mail className="size-4 shrink-0 text-accent" aria-hidden="true" />
              <span>{email}</span>
            </p>
            <p className="flex gap-3">
              <Phone className="size-4 shrink-0 text-accent" aria-hidden="true" />
              <span>{phone}</span>
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-border/35 py-5">
        <div className="container text-sm text-muted">
          {copyright}
        </div>
      </div>
    </footer>
  );
}
