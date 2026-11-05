import { PublicInputValidation } from '@/components/public-input-validation';
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Footer, type FooterConferenceInfo, type FooterProps } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ClientParticles } from "@/components/particles/client-particles";
import { ThemeScript } from "@/components/theme/theme-script";
import { DynamicTheme } from "@/components/theme/dynamic-theme";
import { CONFERENCE } from "@/constants/conference";
import { prisma } from "@/lib/prisma/client";
import { memoize } from "@/lib/cache";
import { ClientBlocker } from "@/components/security/client-blocker";
import { LiveContentWatcher } from "@/components/common/live-content-watcher";
import { PageChrome } from "@/components/layout/page-chrome";
import "./globals.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function resolveFaviconUrl(src?: string): string {
  if (!src) return "/ICGIT/favicon.ico";
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
    return src;
  }
  if (src.startsWith("/ICGIT/") || src === "/ICGIT") {
    return src;
  }
  return src.startsWith("/") ? `/ICGIT${src}` : `/ICGIT/${src}`;
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { conf, seoVal, themeTokens, brandingVal } = await memoize(
      "layout_metadata_live",
      60000,
      async () => {
        const [c, sSetting, aTheme, bSetting] = await Promise.all([
          prisma.conference.findFirst({
            where: { deletedAt: null },
            include: { venue: true }
          }),
          prisma.systemSetting.findFirst({
            where: { key: "seo_metadata" }
          }),
          prisma.themeSetting.findFirst({
            where: { isActive: true }
          }),
          prisma.systemSetting.findFirst({
            where: { key: "branding_assets" }
          })
        ]);
        return {
          conf: c,
          seoVal: (sSetting?.value as Record<string, string>) || {},
          themeTokens: (aTheme?.tokens as Record<string, string>) || {},
          brandingVal: (bSetting?.value as Record<string, string>) || {}
        };
      }
    );

    const confName = conf?.name || CONFERENCE.name;
    const confFullName = conf?.fullName || CONFERENCE.fullName;
    const metaTitle = seoVal.metaTitle || `${confName} | ${confFullName}`;
    const metaDescription =
      seoVal.metaDescription ||
      conf?.description ||
      "Explore international innovation and technology conference keynotes, workshops, and exhibitions.";
    const canonicalUrl = seoVal.canonicalUrl || "https://hanscinovum.com/ICGIT";
    const rawFavicon =
      brandingVal.faviconUrl ||
      themeTokens.faviconUrl ||
      seoVal.faviconUrl ||
      "/favicon.ico";
    const faviconUrl = resolveFaviconUrl(rawFavicon);

    return {
      metadataBase: new URL(canonicalUrl),
      title: {
        default: metaTitle,
        template: `%s | ${confName}`
      },
      description: metaDescription,
      keywords: seoVal.metaKeywords ? seoVal.metaKeywords.split(",").map((k) => k.trim()) : undefined,
      icons: {
        icon: faviconUrl,
        shortcut: faviconUrl,
        apple: faviconUrl
      },
      openGraph: {
        title: metaTitle,
        description: metaDescription,
        url: canonicalUrl,
        siteName: confName,
        images: themeTokens.ogImageUrl ? [{ url: themeTokens.ogImageUrl }] : undefined,
        locale: "en_US",
        type: "website"
      },
      twitter: {
        card: "summary_large_image",
        title: metaTitle,
        description: metaDescription,
        images: themeTokens.ogImageUrl ? [themeTokens.ogImageUrl] : undefined
      },
      alternates: {
        canonical: "/"
      }
    };
  } catch (error) {
    console.error("Error generating dynamic metadata:", error);
    return {
      title: `${CONFERENCE.name} | ${CONFERENCE.fullName}`,
      description: CONFERENCE.fullName,
      icons: {
        icon: "/ICGIT/favicon.ico"
      }
    };
  }
}

interface RootLayoutProps {
  children: ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const { menuItems, branding, themeTokens, conferenceInfo, footerContent, faviconUrl } = await memoize(
    "layout_settings_live",
    60000,
    async () => {
      try {
        const [dbMenuSetting, activeTheme, conf, footerSetting, brandingSetting] = await Promise.all([
          prisma.systemSetting.findFirst({
            where: { key: "navigation_menu" }
          }),
          prisma.themeSetting.findFirst({
            where: { isActive: true }
          }),
          prisma.conference.findFirst({
            where: { deletedAt: null },
            include: { venue: true }
          }),
          prisma.systemSetting.findFirst({
            where: { key: "page_content_footer" }
          }),
          prisma.systemSetting.findFirst({
            where: { key: "branding_assets" }
          })
        ]);

        const brandingVal = (brandingSetting?.value as Record<string, string>) || {};
        const themeTokens = (activeTheme?.tokens as Record<string, string>) || {};
        const rawFavicon = brandingVal.faviconUrl || themeTokens.faviconUrl || "/favicon.ico";
        const faviconUrl = resolveFaviconUrl(rawFavicon);

        const conferenceInfo: FooterConferenceInfo = {
          name: conf?.name,
          fullName: conf?.fullName,
          dates: conf?.startDate && conf?.endDate
            ? `${conf.startDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}-${conf.endDate.toLocaleDateString("en-US", { day: "numeric", year: "numeric" })}`
            : undefined,
          venue: conf?.venue?.name,
          city: conf?.venue?.city,
          country: "United Arab Emirates",
          email: "secretariat@icgit2026.org",
          phone: "+971 4 000 2026"
        };

        let rawMenuItems = dbMenuSetting?.value as Array<{ label: string; href: string }> | undefined;
        let fileBranding: any = null;
        try {
          const fs = await import("fs");
          const path = await import("path");
          const settingsFile = path.join(process.cwd(), "storage", "settings.json");
          if (fs.existsSync(settingsFile)) {
            const saved = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
            if ((!rawMenuItems || !Array.isArray(rawMenuItems) || rawMenuItems.length === 0) && Array.isArray(saved.navigation) && saved.navigation.length > 0) {
              rawMenuItems = saved.navigation;
            }
            if (saved.branding) {
              fileBranding = saved.branding;
            }
          }
        } catch {}

        const branding = {
          logoUrl: brandingVal.logoUrl || fileBranding?.logoUrl || undefined,
          logoText: brandingVal.logoText || fileBranding?.logoText || "ICGIT",
          brandName: brandingVal.brandName || fileBranding?.brandName || conf?.name || CONFERENCE.name,
          brandSubtitle: brandingVal.brandSubtitle || fileBranding?.brandSubtitle || "GLOBAL INNOVATION & TECHNOLOGY"
        };

        const menuItems = rawMenuItems && Array.isArray(rawMenuItems) && rawMenuItems.length > 0
          ? rawMenuItems.map((item) => {
              if (item.label === "Committee" && item.href === "/#committee") return { ...item, href: "/committee" };
              if (item.label === "Speakers" && item.href === "/#speakers") return { ...item, href: "/speakers" };
              return item;
            })
          : undefined;

        return {
          menuItems,
          branding,
          themeTokens: activeTheme?.tokens || null,
          conferenceInfo,
          footerContent: (footerSetting?.value as FooterProps["footerContent"]) || undefined,
          faviconUrl
        };
      } catch (e) {
        console.error("Layout fetch error:", e);
        let fallbackMenu = undefined;
        let fallbackBranding = undefined;
        try {
          const fs = await import("fs");
          const path = await import("path");
          const settingsFile = path.join(process.cwd(), "storage", "settings.json");
          if (fs.existsSync(settingsFile)) {
            const saved = JSON.parse(fs.readFileSync(settingsFile, "utf8"));
            if (Array.isArray(saved.navigation) && saved.navigation.length > 0) {
              fallbackMenu = saved.navigation;
            }
            if (saved.branding) {
              fallbackBranding = saved.branding;
            }
          }
        } catch {}

        return {
          menuItems: fallbackMenu,
          branding: fallbackBranding,
          themeTokens: null,
          conferenceInfo: undefined,
          footerContent: undefined,
          faviconUrl: "/ICGIT/favicon.ico"
        };
      }
    }
  );

  const confName = conferenceInfo?.fullName || CONFERENCE.fullName;
  const venueName = conferenceInfo?.venue || CONFERENCE.venue;
  const cityName = conferenceInfo?.city || CONFERENCE.city;
  const countryName = conferenceInfo?.country || CONFERENCE.country;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: confName,
    startDate: "2026-12-08",
    endDate: "2026-12-10",
    eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: venueName,
      address: {
        "@type": "PostalAddress",
        addressLocality: cityName,
        addressCountry: countryName
      }
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <DynamicTheme tokens={themeTokens} />
        <link rel="icon" href={faviconUrl} />
        <link rel="shortcut icon" href={faviconUrl} />
        <link rel="apple-touch-icon" href={faviconUrl} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Libre+Caslon+Display&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <AuthProvider>
          <PublicInputValidation/>
          <LiveContentWatcher intervalMs={30000} />
          <ClientBlocker />
          <PageChrome
            particles={<ClientParticles />}
            header={<Header items={menuItems} branding={branding} />}
            footer={<Footer conference={conferenceInfo} navItems={menuItems} footerContent={footerContent} />}
          >{children}</PageChrome>
        </AuthProvider>
      </body>
    </html>
  );
}
