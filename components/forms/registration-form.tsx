"use client";

import { useActionState, useState } from "react";
import { Check, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/buttons/button";
import { GlassCard } from "@/components/cards/glass-card";
import { submitRegistrationAction } from "@/actions/registration.actions";

interface Package {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
}

interface Country {
  id: string;
  name: string;
}

interface RegistrationFormProps {
  packages: Package[];
  countries: Country[];
}

export function RegistrationForm({ packages, countries }: RegistrationFormProps) {
  const [selectedPackageId, setSelectedPackageId] = useState(packages[0]?.id ?? "");
  const [state, formAction, isPending] = useActionState(submitRegistrationAction, {
    ok: false,
    message: ""
  });

  const getPrice = (cents: number) => {
    return (cents / 100).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0
    });
  };

  return (
    <div className="space-y-10">
      {/* PRICING CARDS */}
      <div className="grid gap-6 md:grid-cols-2">
        {packages.map((pkg) => {
          const isSelected = selectedPackageId === pkg.id;
          return (
            <div
              key={pkg.id}
              onClick={() => setSelectedPackageId(pkg.id)}
              className={`relative cursor-pointer rounded-xl border p-6 transition duration-300 flex flex-col justify-between ${
                isSelected
                  ? "border-accent bg-accent/5 ring-1 ring-accent"
                  : "border-border/30 bg-surface/30 hover:border-border/60"
              }`}
            >
              {isSelected && (
                <span className="absolute -top-3 right-4 flex h-6 items-center gap-1 rounded-full bg-accent px-2.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-soft">
                  <Sparkles className="size-3" /> Selected
                </span>
              )}
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  {pkg.name}
                </h3>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  {pkg.description || "Access to all conference tracks and session formats."}
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">
                    {getPrice(pkg.priceCents)}
                  </span>
                  <span className="text-xs text-muted font-medium">/ delegate</span>
                </div>
              </div>
              <ul className="mt-6 space-y-2 text-xs text-muted mb-6">
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-accent" />
                  <span>Interactive parallel research tracks</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-accent" />
                  <span>Digital proceedings and certificate</span>
                </li>
                {pkg.name.toLowerCase().includes("onsite") ? (
                  <>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-accent" />
                      <span>Onsite lunches, teas, & social dinner in Dubai</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-accent" />
                      <span>Exhibition hall and delegate kit</span>
                    </li>
                  </>
                ) : (
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-accent" />
                    <span>Live virtual streams & video archives</span>
                  </li>
                )}
              </ul>
              <Button
                type="button"
                variant={isSelected ? "primary" : "outline"}
                className="w-full justify-center"
              >
                {isSelected ? "Selected" : "Choose Package"}
              </Button>
            </div>
          );
        })}
      </div>

      {/* REGISTRATION FIELDS */}
      <GlassCard className="p-6 md:p-8">
        <h3 className="font-heading text-xl font-bold text-foreground mb-6">
          Delegate Information
        </h3>

        <form action={formAction} className="space-y-5">
          <input type="hidden" name="packageId" value={selectedPackageId} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="fullName" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="e.g. John Doe"
                className="focus-ring w-full rounded-lg border border-border/45 bg-surface/65 px-4 py-2.5 text-sm text-foreground placeholder:text-muted"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="e.g. john@example.com"
                className="focus-ring w-full rounded-lg border border-border/45 bg-surface/65 px-4 py-2.5 text-sm text-foreground placeholder:text-muted"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="organization" className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Organization / Institution
              </label>
              <input
                id="organization"
                name="organization"
                type="text"
                placeholder="e.g. Dubai Technology Hub"
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
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {state.message && (
            <div
              className={`p-4 rounded-lg text-xs font-semibold ${
                state.ok
                  ? "bg-success/15 text-success border border-success/30"
                  : "bg-error/15 text-error border border-error/30"
              }`}
            >
              {state.ok ? (
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 shrink-0" />
                  <span>{state.message}</span>
                </div>
              ) : (
                state.message
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending || !selectedPackageId}
            className="w-full justify-center hover-lift mt-2"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Registering...
              </>
            ) : (
              "Confirm Registration"
            )}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
