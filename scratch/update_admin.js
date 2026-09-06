const fs = require('fs');

// 1. Update admin-sidebar.tsx
const sidebarPath = 'c:/Users/banda/Desktop/conference-admin/components/admin/layout/admin-sidebar.tsx';
const sidebarContent = `"use client";

import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Globe2,
  FileCheck2,
  Users,
  DollarSign,
  ShieldCheck,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import LinkComponent from "next/link";

interface AdminSidebarProps {
  slug: string;
}

export function AdminSidebar({ slug }: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Overview",
      href: \`/\${slug}\`,
      icon: LayoutDashboard,
      exact: true
    },
    {
      name: "Website Content",
      href: \`/\${slug}/content\`,
      icon: FileText
    },
    {
      name: "SEO & Metadata",
      href: \`/\${slug}/seo\`,
      icon: Globe2
    },
    {
      name: "Abstract Submissions",
      href: \`/\${slug}/submissions\`,
      icon: FileCheck2
    },
    {
      name: "Attendees & Registrations",
      href: \`/\${slug}/registrations\`,
      icon: Users
    },
    {
      name: "Revenue & Payments",
      href: \`/\${slug}/revenue\`,
      icon: DollarSign
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0 select-none shadow-sm">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-200">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/20">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 text-base tracking-tight leading-none">Super Admin</h1>
          <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-1">Multi-Conference Portal</p>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Conference Management
        </div>

        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href || pathname.endsWith(item.href)
            : pathname.includes(item.href);

          const Icon = item.icon;

          return (
            <LinkComponent
              key={item.href}
              href={item.href}
              className={\`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group \${
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-semibold shadow-sm border border-indigo-100/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }\`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={\`w-4 h-4 transition-colors \${
                    isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-600"
                  }\`}
                />
                <span>{item.name}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-indigo-600" />}
            </LinkComponent>
          );
        })}
      </div>

      {/* Public Site Link */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50">
        <a
          href="http://localhost:3000/ICGIT"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-white border border-slate-200/80 shadow-sm transition-all"
        >
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            View Public Website
          </span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </aside>
  );
}
`;
fs.writeFileSync(sidebarPath, sidebarContent, 'utf8');
console.log('1. Updated admin-sidebar.tsx');

// 2. Update seo-form.tsx (remove canonicalUrl input field)
const seoPath = 'c:/Users/banda/Desktop/conference-admin/components/admin/seo-form.tsx';
const seoContent = `"use client";

import { useState } from "react";
import { Save, CheckCircle2, AlertCircle, Globe2, Search } from "lucide-react";

interface SeoFormProps {
  conferenceId: string;
  slug: string;
  initialData: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    canonicalUrl: string;
    googleAnalyticsId: string;
  };
}

export function SeoForm({ conferenceId, slug, initialData }: SeoFormProps) {
  const [formData, setFormData] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus("idle");

    try {
      const res = await fetch(\`/api/admin/seo\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conferenceId, slug, seo: formData })
      });

      if (!res.ok) throw new Error("Failed to save SEO settings");

      setStatus("success");
      setMessage("SEO & Metadata settings updated successfully!");
      setTimeout(() => setStatus("idle"), 4000);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Failed to save SEO");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {status === "success" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium animate-in fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium animate-in fade-in shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Google Search Result Preview */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 lg:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 text-indigo-700 font-bold text-base pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Search className="w-5 h-5" />
          </div>
          <span>Google Search SERP Preview</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 max-w-2xl font-sans">
          <h3 className="text-base font-semibold text-blue-700 hover:underline cursor-pointer truncate">
            {formData.metaTitle || "ICGIT 2026 - Global Innovation & Technology Summit"}
          </h3>
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {formData.metaDescription || "Join global leaders, researchers, and engineers at ICGIT 2026 in Dubai."}
          </p>
        </div>
      </div>

      {/* SEO Fields */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 lg:p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5 text-indigo-700 font-bold text-base pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Globe2 className="w-5 h-5" />
          </div>
          <span>Page Metadata Configuration</span>
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Meta Title Tag</label>
              <span className="text-[11px] text-slate-400">{formData.metaTitle.length} / 60 chars</span>
            </div>
            <input
              type="text"
              name="metaTitle"
              value={formData.metaTitle}
              onChange={handleChange}
              placeholder="e.g. ICGIT 2026 - International Conference on Global Innovation & Technology"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Meta Description</label>
              <span className="text-[11px] text-slate-400">{formData.metaDescription.length} / 160 chars</span>
            </div>
            <textarea
              name="metaDescription"
              rows={3}
              value={formData.metaDescription}
              onChange={handleChange}
              placeholder="Concise summary for search engines and social cards..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Meta Keywords (comma-separated)</label>
            <input
              type="text"
              name="metaKeywords"
              value={formData.metaKeywords}
              onChange={handleChange}
              placeholder="AI, Innovation, Technology, Robotics, Dubai Conference"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 sticky bottom-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving SEO..." : "Save SEO & Meta Tags"}</span>
        </button>
      </div>
    </form>
  );
}
`;
fs.writeFileSync(seoPath, seoContent, 'utf8');
console.log('2. Updated seo-form.tsx');

// 3. Update app/[slug]/content/page.tsx (fetch faviconUrl and pass to ContentForm)
const contentPagePath = 'c:/Users/banda/Desktop/conference-admin/app/[slug]/content/page.tsx';
const contentPageContent = `import { prisma } from "@/lib/prisma/client";
import { ContentForm } from "@/components/admin/content-form";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContentEditorPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams.slug;

  const conference = await prisma.conference.findFirst({
    where: { slug, deletedAt: null },
    include: {
      venue: true,
      settings: true,
      speakers: {
        where: { deletedAt: null },
        include: { organization: true, imageAsset: true },
        orderBy: { sortOrder: "asc" }
      }
    }
  });

  const conferenceId = conference?.id || "";

  const homeSetting = conference?.settings?.find((s) => s.key === "page_content_home");
  const footerSetting = conference?.settings?.find((s) => s.key === "page_content_footer");
  const brandingSetting = conference?.settings?.find((s) => s.key === "branding_assets");
  const activeTheme = await prisma.themeSetting.findFirst({
    where: { conferenceId, isActive: true }
  });

  const brandingVal = (brandingSetting?.value as any) || {};
  const themeTokens = (activeTheme?.tokens as any) || {};
  const initialFaviconUrl = brandingVal.faviconUrl || themeTokens.faviconUrl || "/favicon.ico";

  const initialSections = (homeSetting?.value as any) || [];
  const initialFooter = (footerSetting?.value as any) || {
    tagline: conference?.fullName || "International Conference on Global Innovation and Technology",
    contactEmail: "secretariat@icgit2026.org",
    contactPhone: "+971 4 000 2026",
    contactAddress: "Dubai World Trade Centre, Dubai, United Arab Emirates",
    footerCopyright: "Copyright 2026 ICGIT. All rights reserved.",
    quickLinks: [
      { label: "Home", href: "/#home" },
      { label: "About", href: "/#about" },
      { label: "Brochure", href: "/#brochure" },
      { label: "Sessions", href: "/#sessions" },
      { label: "Speakers", href: "/#speakers" },
      { label: "Venue", href: "/#venue" },
      { label: "Contact Us", href: "/#contact" }
    ],
    resourceLinks: [
      { label: "Brochure", href: "/brochure" },
      { label: "Abstract Submission", href: "/abstracts" },
      { label: "Registration", href: "/registration" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" }
    ]
  };

  const initialSpeakers = (conference?.speakers || []).map((s) => ({
    id: s.id,
    name: s.name,
    role: s.role,
    topic: s.topic,
    bio: s.bio,
    organizationName: s.organization?.name || "Independent",
    imageAssetId: s.imageAsset?.storageKey || s.imageAssetId || null,
    sortOrder: s.sortOrder
  }));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
          <FileText className="w-4 h-4" />
          <span>Live Website Content Editor</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">Homepage Sections & Footer</h1>
        <p className="text-sm text-slate-500 mt-1">
          Customize and toggle all visible sections on the public portal for{" "}
          <span className="text-slate-900 font-semibold">{conference?.name}</span>.
        </p>
      </div>

      <ContentForm
        conferenceId={conferenceId}
        slug={slug}
        initialSections={initialSections}
        initialFooter={initialFooter}
        initialSpeakers={initialSpeakers}
        initialFaviconUrl={initialFaviconUrl}
      />
    </div>
  );
}
`;
fs.writeFileSync(contentPagePath, contentPageContent, 'utf8');
console.log('3. Updated app/[slug]/content/page.tsx');

// 4. Update app/api/admin/content/route.ts (handle faviconUrl updates)
const contentRoutePath = 'c:/Users/banda/Desktop/conference-admin/app/api/admin/content/route.ts';
const contentRouteContent = `import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function POST(request: Request) {
  try {
    const { conferenceId, slug, sections, footer, faviconUrl } = await request.json();

    let targetConfId = conferenceId;
    if (!targetConfId && slug) {
      const conf = await prisma.conference.findUnique({ where: { slug } });
      targetConfId = conf?.id;
    }

    if (!targetConfId) {
      return NextResponse.json({ error: "Conference not found" }, { status: 404 });
    }

    // Save page_content_home setting (all sections array with visibility and fields)
    if (sections) {
      await prisma.systemSetting.upsert({
        where: {
          conferenceId_key: {
            conferenceId: targetConfId,
            key: "page_content_home"
          }
        },
        update: {
          value: sections
        },
        create: {
          conferenceId: targetConfId,
          key: "page_content_home",
          value: sections
        }
      });
    }

    // Save page_content_footer setting
    if (footer) {
      await prisma.systemSetting.upsert({
        where: {
          conferenceId_key: {
            conferenceId: targetConfId,
            key: "page_content_footer"
          }
        },
        update: {
          value: footer
        },
        create: {
          conferenceId: targetConfId,
          key: "page_content_footer",
          value: footer
        }
      });
    }

    // Save faviconUrl if provided
    if (faviconUrl !== undefined) {
      const existingBranding = await prisma.systemSetting.findFirst({
        where: { conferenceId: targetConfId, key: "branding_assets" }
      });
      const currentBrandingVal = (existingBranding?.value as Record<string, any>) || {};
      
      await prisma.systemSetting.upsert({
        where: {
          conferenceId_key: {
            conferenceId: targetConfId,
            key: "branding_assets"
          }
        },
        update: {
          value: {
            ...currentBrandingVal,
            faviconUrl
          }
        },
        create: {
          conferenceId: targetConfId,
          key: "branding_assets",
          value: {
            ...currentBrandingVal,
            faviconUrl
          }
        }
      });

      // Update active theme tokens
      const activeTheme = await prisma.themeSetting.findFirst({
        where: { conferenceId: targetConfId, isActive: true }
      });
      if (activeTheme) {
        const tokens = (activeTheme.tokens as Record<string, any>) || {};
        await prisma.themeSetting.update({
          where: { id: activeTheme.id },
          data: {
            tokens: {
              ...tokens,
              faviconUrl
            }
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin content save error:", error);
    return NextResponse.json({ error: error.message || "Failed to update content" }, { status: 500 });
  }
}
`;
fs.writeFileSync(contentRoutePath, contentRouteContent, 'utf8');
console.log('4. Updated app/api/admin/content/route.ts');
