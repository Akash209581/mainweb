"use client";

import { Menu, UserCircle, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/buttons/button";
import { CONFERENCE, NAVIGATION_ITEMS } from "@/constants/conference";
import { cn } from "@/lib/utils/cn";

interface HeaderProps {
  items?: Array<{ label: string; href: string }>;
}

export function Header({ items = NAVIGATION_ITEMS }: HeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 12);
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#") && pathname === "/") {
      e.preventDefault();
      const id = href.replace("/#", "");
      if (id === "home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.history.pushState(null, "", href);
        return;
      }
      const element = document.getElementById(id);
      if (element) {
        const headerHeight = 80;
        const viewportHeight = window.innerHeight;
        const rect = element.getBoundingClientRect();
        const elementTop = window.pageYOffset + rect.top;
        const elementHeight = rect.height;
        const availableHeight = viewportHeight - headerHeight;

        let targetY: number;
        if (elementHeight > 0 && elementHeight < availableHeight) {
          // Center the section neatly within the available visible space below fixed header
          targetY = elementTop - headerHeight - (availableHeight - elementHeight) / 2;
        } else {
          // For taller sections, offset downward so section title rests comfortably in the middle view area
          targetY = elementTop - headerHeight - 120;
        }

        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: "smooth"
        });
        window.history.pushState(null, "", href);
      }
    }
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition duration-300",
        scrolled
          ? "border-border/45 bg-background/80 shadow-soft backdrop-blur-2xl"
          : "border-transparent bg-background/35 backdrop-blur-lg"
      )}
    >
      <div className="container flex h-20 items-center justify-between gap-4">
        <Link href="/" className="focus-ring rounded-md" aria-label={`${CONFERENCE.name} home`}>
          <span className="block font-heading text-xl font-bold text-foreground">
            {CONFERENCE.name}
          </span>
          <span className="hidden text-xs text-muted sm:block">{CONFERENCE.mode}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              onClick={(e) => handleNavClick(e, item.href)}
              className={cn(
                "focus-ring rounded-md px-3 py-2 text-sm font-medium text-muted transition hover:bg-hover/10 hover:text-foreground",
                pathname === item.href && "bg-hover/10 text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button asChild size="sm" className="bg-violet-600 hover:bg-violet-500 text-white border-0 font-bold">
            <Link href="/registration">Register Now</Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="User profile">
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
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={(e) => {
                  handleNavClick(e, item.href);
                  setOpen(false);
                }}
                className={cn(
                  "focus-ring rounded-lg px-3 py-3 text-sm font-medium text-muted hover:bg-hover/10 hover:text-foreground",
                  pathname === item.href && "bg-hover/10 text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
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
