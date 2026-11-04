"use client";

import { Menu, UserCircle, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/buttons/button";
import { CONFERENCE, NAVIGATION_ITEMS } from "@/constants/conference";
import { cn } from "@/lib/utils/cn";

export interface HeaderBranding {
  logoUrl?: string;
  logoText?: string;
  brandName?: string;
  brandSubtitle?: string;
}

interface HeaderProps {
  items?: Array<{ label: string; href: string }>;
  branding?: HeaderBranding;
}

export function Header({ items = NAVIGATION_ITEMS, branding }: HeaderProps) {
  const brandLogoUrl = branding?.logoUrl;
  const brandLogoText = branding?.logoText || "ICGIT";
  const brandName = branding?.brandName || CONFERENCE.name;
  const brandSubtitle = branding?.brandSubtitle || "GLOBAL INNOVATION & TECHNOLOGY";
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHref, setActiveHref] = useState<string>("");

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 12);
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  // Sync active nav item with route and hash
  useEffect(() => {
    if (typeof window === "undefined") return;
    const currentHash = window.location.hash;
    if (pathname === "/" || pathname === "/ICGIT" || pathname === "/ICGIT/") {
      if (currentHash) {
        const match = items.find((i) => i.href.endsWith(currentHash));
        if (match) {
          setActiveHref(match.href);
          return;
        }
      }
      setActiveHref(items[0]?.href || "/#home");
    } else {
      const match = items.find(
        (i) => i.href === pathname || i.href === pathname + "/" || (pathname.startsWith(i.href) && i.href !== "/" && !i.href.startsWith("/#"))
      );
      if (match) {
        setActiveHref(match.href);
      } else {
        setActiveHref(pathname);
      }
    }
  }, [pathname, items]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setActiveHref(href);
    if (href.startsWith("/#")) {
      const id = href.replace("/#", "");
      if (pathname === "/" || pathname === "/ICGIT" || pathname === "/ICGIT/") {
        e.preventDefault();
        if (id === "home") {
          window.scrollTo({ top: 0, behavior: "smooth" });
          window.history.pushState(null, "", href);
          return;
        }
        const element = document.getElementById(id);
        if (element) {
          const headerHeight = 80;
          const rect = element.getBoundingClientRect();
          const targetY = window.pageYOffset + rect.top - headerHeight - 12;

          window.scrollTo({
            top: Math.max(0, targetY),
            behavior: "smooth"
          });
          window.history.pushState(null, "", href);
        }
      } else {
        // Save target in session so home page auto-scrolls directly to the section heading
        if (typeof window !== "undefined") {
          sessionStorage.setItem("target_nav_hash", id);
        }
      }
    }
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition duration-300",
        scrolled
          ? "border-border/60 bg-white/95 shadow-soft backdrop-blur-2xl"
          : "border-transparent bg-white/90 backdrop-blur-lg"
      )}
    >
      <div className="container max-w-[1440px] flex h-20 items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6">
        <Link href="/" className="focus-ring flex items-center gap-2.5 sm:gap-3 rounded-md shrink-0 mr-1 xl:mr-2" aria-label={`${brandName} home`}>
          {brandLogoUrl ? (
            <img
              src={brandLogoUrl}
              alt={brandName}
              className="size-9 sm:size-10 rounded-xl object-contain shadow-md shadow-violet-600/20 bg-white border border-slate-200 shrink-0"
            />
          ) : (
            <div className="grid size-9 sm:size-10 place-items-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-violet-600/20 tracking-wider shrink-0">
              {brandLogoText}
            </div>
          )}
          <span className="flex flex-col justify-center shrink-0">
            <span className="block font-heading text-lg sm:text-xl font-bold text-foreground leading-tight whitespace-nowrap">{brandName}</span>
            <span className="hidden text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted sm:block leading-tight whitespace-nowrap mt-0.5">{brandSubtitle}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 xl:gap-2 lg:flex shrink-0 flex-nowrap" aria-label="Primary navigation">
          {items.map((item) => {
            const isCurrent =
              activeHref === item.href ||
              (!activeHref.includes("#") && (pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/" && !item.href.startsWith("/#"))));

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={(e) => handleNavClick(e, item.href)}
                className={cn(
                  "focus-ring px-2 xl:px-2.5 py-1 text-[13px] xl:text-[14px] font-medium transition-all duration-200 border-b-2 whitespace-nowrap shrink-0",
                  isCurrent
                    ? "border-[#b4935b] text-[#102e4c] font-semibold"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 xl:gap-3 lg:flex shrink-0">
          <Button asChild size="sm" className="bg-violet-600 hover:bg-violet-500 text-white border-0 font-bold whitespace-nowrap shrink-0 px-3.5 py-2">
            <Link href="/registration" className="whitespace-nowrap flex items-center gap-1.5">
              <span>Register Now</span>
              <span aria-hidden="true">→</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="User profile" className="shrink-0 size-9">
            <Link href="/profile">
              <UserCircle className="size-5" />
            </Link>
          </Button>
        </div>

        <button
          type="button"
          className="focus-ring inline-flex size-11 items-center justify-center rounded-lg border border-border/45 bg-surface/60 text-foreground lg:hidden"
          aria-label="Open navigation menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-border/40 bg-background/95 px-4 pb-6 pt-3 backdrop-blur-2xl lg:hidden">
          <nav className="mx-auto flex max-w-[1400px] flex-col gap-1" aria-label="Mobile navigation">
            {items.map((item) => {
              const isCurrent =
                activeHref === item.href ||
                (!activeHref.includes("#") && (pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/" && !item.href.startsWith("/#"))));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onClick={(e) => {
                    handleNavClick(e, item.href);
                    setOpen(false);
                  }}
                  className={cn(
                    "focus-ring rounded-lg px-3 py-3 text-sm font-medium transition-all",
                    isCurrent
                      ? "bg-amber-500/10 text-[#102e4c] font-semibold border-l-4 border-[#b4935b] pl-3"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-4 flex flex-col gap-3">
              <Button asChild className="bg-violet-600 hover:bg-violet-500 text-white border-0 font-bold">
                <Link href="/registration">Register Now</Link>
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
