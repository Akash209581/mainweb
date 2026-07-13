"use client";

import { useState, useTransition } from "react";
import { Sparkles, Shield, UserCircle, Save } from "lucide-react";
import { GlassCard } from "@/components/cards/glass-card";
import { Button } from "@/components/buttons/button";
import { updateProfileAction } from "@/actions/profile.actions";

interface ProfileUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  title: string;
  designation: string;
  phone: string;
  bio: string;
  countryId: string;
  organizationName: string;
  roles: string[];
}

interface CountryRow {
  id: string;
  name: string;
}

interface ProfileFormProps {
  user: ProfileUser;
  countries: CountryRow[];
}

export function ProfileForm({ user, countries }: ProfileFormProps) {
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = await updateProfileAction({ ok: false, message: "" }, formData);
        setFeedback({ ok: res.ok, msg: res.message });
      } catch (err) {
        setFeedback({ ok: false, msg: "Failed to update profile settings." });
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] items-start">
      {/* Roles & Account overview */}
      <GlassCard className="p-6 space-y-5">
        <div className="flex items-center gap-4 pb-4 border-b border-border/20">
          <div className="rounded-full bg-accent/15 p-3 text-accent">
            <UserCircle className="size-10" />
          </div>
          <div>
            <h4 className="font-heading text-lg font-bold text-foreground">
              {user.firstName || user.lastName ? `${user.firstName} ${user.lastName}` : "ICGIT Delegate"}
            </h4>
            <p className="text-xs text-muted mt-0.5">{user.email}</p>
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-muted tracking-wider block mb-2">
            Assigned RBAC Privileges
          </span>
          <div className="flex flex-wrap gap-1.5">
            {user.roles.map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-1 rounded bg-accent/15 px-2.5 py-0.5 border border-accent/25 text-[10px] text-accent font-bold uppercase tracking-wider"
              >
                <Shield className="size-3" /> {r.replace("_", " ")}
              </span>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-muted leading-relaxed">
          Dynamic dashboard permissions are linked directly to your database role mappings. To modify permissions or submit abstracts, contact the committee administrator.
        </p>
      </GlassCard>

      {/* Editor inputs */}
      <GlassCard className="p-6 md:p-8">
        <h3 className="font-heading text-md font-bold text-foreground mb-6 flex items-center gap-2">
          <Sparkles className="size-4 text-accent" /> Professional Qualifications
        </h3>

        {feedback && (
          <div
            className={`p-4 rounded-lg border text-xs font-semibold mb-6 ${
              feedback.ok ? "border-success/35 bg-success/5 text-success" : "border-danger/35 bg-danger/5 text-danger"
            }`}
          >
            {feedback.msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-muted font-semibold mb-1 uppercase tracking-wider">First Name</label>
              <input
                required
                type="text"
                name="firstName"
                defaultValue={user.firstName}
                placeholder="First Name"
                className="focus-ring w-full rounded border border-border/40 bg-surface/50 p-2.5 text-foreground"
              />
            </div>
            <div>
              <label className="block text-muted font-semibold mb-1 uppercase tracking-wider">Last Name</label>
              <input
                required
                type="text"
                name="lastName"
                defaultValue={user.lastName}
                placeholder="Last Name"
                className="focus-ring w-full rounded border border-border/40 bg-surface/50 p-2.5 text-foreground"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-muted font-semibold mb-1 uppercase tracking-wider">Academic Title</label>
              <input
                type="text"
                name="title"
                defaultValue={user.title}
                placeholder="e.g. Dr., Prof."
                className="focus-ring w-full rounded border border-border/40 bg-surface/50 p-2.5 text-foreground"
              />
            </div>
            <div>
              <label className="block text-muted font-semibold mb-1 uppercase tracking-wider">Designation</label>
              <input
                type="text"
                name="designation"
                defaultValue={user.designation}
                placeholder="e.g. Assistant Professor"
                className="focus-ring w-full rounded border border-border/40 bg-surface/50 p-2.5 text-foreground"
              />
            </div>
            <div>
              <label className="block text-muted font-semibold mb-1 uppercase tracking-wider">Organization Name</label>
              <input
                type="text"
                name="organizationName"
                defaultValue={user.organizationName}
                placeholder="e.g. MIT"
                className="focus-ring w-full rounded border border-border/40 bg-surface/50 p-2.5 text-foreground"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-muted font-semibold mb-1 uppercase tracking-wider">Contact Phone</label>
              <input
                type="tel"
                name="phone"
                defaultValue={user.phone}
                placeholder="+1-555-555-5555"
                className="focus-ring w-full rounded border border-border/40 bg-surface/50 p-2.5 text-foreground font-mono"
              />
            </div>
            <div>
              <label className="block text-muted font-semibold mb-1 uppercase tracking-wider">Resident Country</label>
              <select
                name="countryId"
                defaultValue={user.countryId}
                className="focus-ring w-full rounded border border-border/40 bg-surface/50 p-2.5 text-foreground font-semibold"
              >
                <option value="">Choose Country...</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-muted font-semibold mb-1 uppercase tracking-wider">Biographical Summary</label>
            <textarea
              name="bio"
              rows={4}
              defaultValue={user.bio}
              placeholder="Outline research interests, major publications..."
              className="focus-ring w-full rounded border border-border/40 bg-surface/50 p-2.5 text-foreground leading-relaxed resize-none"
            />
          </div>

          <div className="pt-4 border-t border-border/20 flex justify-end">
            <Button type="submit" isLoading={isPending} className="hover-lift">
              <Save className="size-4 mr-2" /> Save Profile Details
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
