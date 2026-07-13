import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ClientParticles } from "@/components/particles/client-particles";
import { ThemeScript } from "@/components/theme/theme-script";
import { DynamicTheme } from "@/components/theme/dynamic-theme";
import { CONFERENCE } from "@/constants/conference";
import { prisma } from "@/lib/prisma/client";
import { memoize } from "@/lib/cache";
import { ClientBlocker } from "@/components/security/client-blocker";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hanscinovum.com/ICGIT"),
  title: {
    default: `${CONFERENCE.name} | ${CONFERENCE.fullName}`,
    template: `%s | ${CONFERENCE.name}`
  },
  description:
    "Explore ICGIT 2026, the International Conference on Global Innovation and Technology in Dubai.",
  openGraph: {
    title: CONFERENCE.fullName,
    description:
      "Hybrid conference in Dubai for global innovation, technology research, industry collaboration, and policy dialogue.",
    url: "https://hanscinovum.com/ICGIT",
    siteName: CONFERENCE.name,
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: CONFERENCE.fullName,
    description: "December 8-10, 2026 at Dubai World Trade Centre."
  },
  alternates: {
    canonical: "/"
  }
};

interface RootLayoutProps {
  children: ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const { menuItems, themeTokens } = await memoize("layout_settings", 15000, async () => {
    const [dbMenuSetting, activeTheme] = await Promise.all([
      prisma.systemSetting.findFirst({
        where: { key: "navigation_menu" }
      }),
      prisma.themeSetting.findFirst({
        where: { isActive: true }
      })
    ]);
    return {
      menuItems: (dbMenuSetting?.value as Array<{ label: string; href: string }>) || undefined,
      themeTokens: activeTheme?.tokens || null
    };
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: CONFERENCE.fullName,
    startDate: "2026-12-08",
    endDate: "2026-12-10",
    eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: CONFERENCE.venue,
      address: {
        "@type": "PostalAddress",
        addressLocality: CONFERENCE.city,
        addressCountry: CONFERENCE.country
      }
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <DynamicTheme tokens={themeTokens} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <AuthProvider>
          <ClientBlocker />
          <ClientParticles />
          <Header items={menuItems} />
          <main>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
