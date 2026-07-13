import type { LucideIcon } from "lucide-react";

export interface NavigationItem {
  label: string;
  href: string;
}

export interface Statistic {
  label: string;
  value: string;
}

export interface FeatureItem {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface Speaker {
  name: string;
  role: string;
  organization: string;
  topic: string;
}

export interface AgendaItem {
  day: string;
  date: string;
  title: string;
  sessions: string[];
}

export interface CommitteeMember {
  name: string;
  role: string;
  affiliation: string;
}

export interface Sponsor {
  name: string;
  tier: string;
  focus: string;
}
