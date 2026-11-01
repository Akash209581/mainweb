"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, CheckCircle2, Mic, FileText, ChevronDown } from "lucide-react";

export const SCIENTIFIC_TRACKS = [
  {
    id: "01",
    name: "Hematologic Malignancies",
    category: "Clinical hematology",
    summary: "Research across blood cancers, from disease biology to clinical investigation.",
    topics: [
      "Leukemia biology & targeted therapies",
      "Lymphoma classifications & clinical trials",
      "Multiple myeloma & plasma cell disorders",
      "Myelodysplastic and myeloproliferative neoplasms"
    ]
  },
  {
    id: "02",
    name: "Hemostasis & Thrombosis",
    category: "Clinical hematology",
    summary: "Scientific exchange on coagulation, bleeding disorders and thrombosis.",
    topics: [
      "Inherited and acquired bleeding disorders",
      "Platelet biology and functional disorders",
      "Venous and arterial thrombosis management",
      "Coagulation testing and laboratory assessment"
    ]
  },
  {
    id: "03",
    name: "Anemia & Red Cell Disorders",
    category: "Clinical hematology",
    summary: "Investigations into red cell biology, anemia and inherited blood conditions.",
    topics: [
      "Iron metabolism and iron deficiency anemia",
      "Hemoglobinopathies (Sickle Cell Disease & Thalassemia)",
      "Hemolytic anemias and membrane defects",
      "Red cell physiology and diagnostic breakthroughs"
    ]
  },
  {
    id: "04",
    name: "Transfusion Medicine",
    category: "Clinical hematology",
    summary: "Research and practice discussions across blood donation and transfusion services.",
    topics: [
      "Blood component preparation & pathogen reduction",
      "Patient blood management (PBM) protocols",
      "Transfusion safety and hemovigilance systems",
      "Immunohematology & rare blood group genetics"
    ]
  },
  {
    id: "05",
    name: "Stem Cell Transplantation",
    category: "Translational research",
    summary: "Research on hematopoietic transplantation and related scientific challenges.",
    topics: [
      "Hematopoietic stem cell biology & mobilization",
      "Autologous and allogeneic transplantation protocols",
      "Graft-versus-host disease (GVHD) prevention & therapy",
      "Post-transplant immune reconstitution & monitoring"
    ]
  },
  {
    id: "06",
    name: "Cellular & Gene Therapies",
    category: "Translational research",
    summary: "Emerging research connecting cell engineering, gene technologies and hematology.",
    topics: [
      "CAR-T, CAR-NK, and engineered immune cell therapies",
      "CRISPR gene editing and gene transfer vectors",
      "Cell therapy biomanufacturing & quality control",
      "Translational biomarkers & persistence metrics"
    ]
  },
  {
    id: "07",
    name: "Molecular Hematology & Genomics",
    category: "Translational research",
    summary: "Methods and discoveries shaping the molecular understanding of blood disorders.",
    topics: [
      "Next-generation sequencing & genomic profiling",
      "Single-cell epigenomics & spatial transcriptomics",
      "Clonal hematopoiesis of indeterminate potential (CHIP)",
      "Disease disease models & functional genomics assays"
    ]
  },
  {
    id: "08",
    name: "Pediatric Hematology",
    category: "Clinical hematology",
    summary: "Scientific topics spanning blood disorders in children and adolescents.",
    topics: [
      "Pediatric acute leukemias & rare blood cancers",
      "Inherited bone marrow failure syndromes",
      "Pediatric vascular anomalies & thrombosis",
      "Survivorship, fertility preservation & late effects"
    ]
  },
  {
    id: "09",
    name: "Laboratory Hematology & Diagnostics",
    category: "Diagnostics & technology",
    summary: "Laboratory methods, quality and diagnostic research across hematology.",
    topics: [
      "High-parameter flow cytometry and immunophenotyping",
      "Digital morphology & automated bone marrow smears",
      "Molecular diagnostics assay validation",
      "ISO standards & laboratory quality assurance"
    ]
  },
  {
    id: "10",
    name: "AI & Digital Hematology",
    category: "Diagnostics & technology",
    summary: "Applications of computational methods and digital tools in hematology research.",
    topics: [
      "Deep learning for blood cell morphology classification",
      "Multimodal clinical data science & risk stratification",
      "Predictive modeling of treatment response",
      "Responsible AI governance & data privacy in oncology"
    ]
  },
  {
    id: "11",
    name: "Supportive Care & Patient Outcomes",
    category: "Care & collaboration",
    summary: "Research centred on patient experience, supportive care and outcomes.",
    topics: [
      "Quality of life & patient-reported outcome measures",
      "Infection prophylaxis & supportive oncology",
      "Palliative and survivorship multidisciplinary care",
      "Shared decision making and patient advocacy"
    ]
  },
  {
    id: "12",
    name: "Global Hematology & Collaboration",
    category: "Care & collaboration",
    summary: "Exchange on research partnerships, access and capacity building worldwide.",
    topics: [
      "International research partnerships & multicenter trials",
      "Resource-stratified guideline implementation",
      "Specialist workforce training and education",
      "Public health epidemiology in hematology"
    ]
  }
];

export function SessionsLayout({ initialTracks = SCIENTIFIC_TRACKS }: { initialTracks?: typeof SCIENTIFIC_TRACKS }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All tracks");

  const tracks = initialTracks && initialTracks.length > 0 ? initialTracks : SCIENTIFIC_TRACKS;
  const researchGroups = ["All tracks", ...Array.from(new Set(tracks.map((t) => t.category).filter(Boolean)))];

  const filtered = tracks.filter((t) => {
    const matchesGroup = group === "All tracks" || t.category === group;
    const searchTarget = `${t.name} ${t.summary} ${Array.isArray(t.topics) ? t.topics.join(" ") : ""}`.toLowerCase();
    const matchesQuery = searchTarget.includes(query.trim().toLowerCase());
    return matchesGroup && matchesQuery;
  });

  return (
    <div className="space-y-12">
      {/* FILTER & SEARCH */}
      <div className="rounded-2xl border border-border/40 bg-surface/40 p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
          <div className="space-y-1.5">
            <label htmlFor="track-search" className="text-xs font-semibold uppercase tracking-wider text-muted">
              Search Tracks and Research Topics
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 size-4 text-muted pointer-events-none" />
              <input
                id="track-search"
                type="search"
                placeholder="Search leukemia, gene editing, diagnostics, AI..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-border/45 bg-surface/65 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="track-group" className="text-xs font-semibold uppercase tracking-wider text-muted">
              Research Discipline / Area
            </label>
            <select
              id="track-group"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="w-full rounded-xl border border-border/45 bg-surface/65 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {researchGroups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-muted border-t border-border/20 pt-3">
          <span>Showing <b>{filtered.length}</b> of {SCIENTIFIC_TRACKS.length} proposed scientific tracks</span>
          {(group !== "All tracks" || query) && (
            <button
              onClick={() => {
                setGroup("All tracks");
                setQuery("");
              }}
              className="text-accent underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* TRACKS GRID */}
      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <article
              key={t.id}
              className="group rounded-2xl border border-border/30 bg-surface/30 p-6 space-y-4 hover:border-accent hover:shadow-lg transition duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-3">
                  <span className="font-heading text-2xl font-bold text-accent">
                    Track {t.id}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted bg-surface/80 px-2.5 py-1 rounded-full border border-border/30">
                    {t.category}
                  </span>
                </div>

                <h3 className="font-heading text-lg font-bold text-foreground">
                  {t.name}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted min-h-[44px]">
                  {t.summary}
                </p>

                <details className="mt-4 border-t border-border/20 pt-3 text-xs text-muted group/details cursor-pointer">
                  <summary className="font-semibold text-foreground flex items-center justify-between hover:text-accent">
                    <span>Explore Session Topics</span>
                    <ChevronDown className="size-3.5 transition group-open/details:rotate-180" />
                  </summary>
                  <ul className="mt-3 space-y-1.5 pl-3 border-l-2 border-accent/40 text-[11px] leading-relaxed">
                    {t.topics.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </details>
              </div>

              <div className="pt-4 border-t border-border/20 mt-4">
                <Link
                  href={`/abstracts?track=${encodeURIComponent(t.name)}`}
                  className="inline-flex items-center text-xs font-bold text-accent hover:underline gap-1"
                >
                  Submit Abstract to Track {t.id} <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/40 p-12 text-center space-y-3">
          <h3 className="font-heading text-lg font-bold text-foreground">No matching tracks found</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Try a broader topic search term or select &quot;All tracks&quot; to review the complete scientific agenda.
          </p>
          <button
            onClick={() => {
              setQuery("");
              setGroup("All tracks");
            }}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white mt-2"
          >
            Show all scientific tracks
          </button>
        </div>
      )}

      {/* PRESENTATION FORMATS */}
      <section className="rounded-2xl border border-border/40 bg-surface/20 p-8 space-y-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent">Ways to Contribute</span>
          <h2 className="mt-1 font-heading text-2xl font-bold text-foreground">
            Choose your presentation preference.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-xl border border-border/30 bg-surface/60 p-6 space-y-3">
            <div className="flex items-center gap-2 text-accent">
              <Mic className="size-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Oral Presentation</span>
            </div>
            <h3 className="font-heading text-lg font-bold text-foreground">
              Present your findings. Open the discussion.
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Share your research in a spoken parallel scientific session with dedicated Q&A opportunities and academic moderator synthesis.
            </p>
          </article>

          <article className="rounded-xl border border-border/30 bg-surface/60 p-6 space-y-3">
            <div className="flex items-center gap-2 text-accent">
              <FileText className="size-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Poster Presentation</span>
            </div>
            <h3 className="font-heading text-lg font-bold text-foreground">
              Make your research visible. Connect in person.
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Communicate your data through interactive printed poster display boards and exchange in-depth insights during designated networking teas.
            </p>
          </article>
        </div>
      </section>

      {/* CTA BANNER */}
      <div className="rounded-2xl bg-[#102e4c] text-white p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
            Contribute to the Conversation
          </span>
          <h2 className="font-heading text-2xl font-bold text-white">
            Bring your scientific perspective to Dubai.
          </h2>
          <p className="text-xs text-slate-300 max-w-lg">
            Prepare your 500–600 word research abstract document and indicate your preferred track and format.
          </p>
        </div>
        <Link
          href="/abstracts"
          className="rounded-lg bg-amber-600 hover:bg-amber-500 px-6 py-3 text-xs font-bold text-white shadow-md transition"
        >
          Submit Abstract Online →
        </Link>
      </div>

      {/* PROGRAM FAQ */}
      <section className="rounded-2xl border border-border/40 bg-surface/20 p-6 md:p-8 space-y-4">
        <h3 className="font-heading text-base font-bold text-foreground">Scientific Programme Questions</h3>
        <div className="divide-y divide-border/20">
          {[
            [
              "Are these the final session tracks?",
              "These represent our core approved thematic tracks. Parallel session times, chairs, and room assignments will be announced with the final schedule."
            ],
            [
              "Can I submit interdisciplinary research bridging two tracks?",
              "Yes. Select the primary track closest to your work during submission. The scientific committee will ensure it is reviewed by relevant peers."
            ],
            [
              "Does track selection guarantee oral presentation?",
              "Authors select their preferred format (Oral or Poster). Final allocations are confirmed by the Scientific Committee based on peer review scores."
            ]
          ].map(([q, a]) => (
            <details key={q} className="py-3 group cursor-pointer">
              <summary className="font-semibold text-xs text-foreground group-hover:text-accent transition">
                {q}
              </summary>
              <p className="mt-2 text-xs text-muted leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
