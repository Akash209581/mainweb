"use client";

import { useState } from "react";
import { Clock, MapPin, Search } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { GlassCard } from "@/components/cards/glass-card";
import { EmptyState } from "@/components/common/empty-state";

interface ScheduleItem {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  location: string;
  dayId: string;
  dayTitle: string;
  dayDate: string;
  track: string;
}

interface Day {
  id: string;
  title: string;
  date: string;
}

interface ScheduleLayoutProps {
  initialItems: ScheduleItem[];
  days: Day[];
}

export function ScheduleLayout({ initialItems, days }: ScheduleLayoutProps) {
  const [activeDayId, setActiveDayId] = useState(days[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const reduceMotion = useReducedMotion();

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC"
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  // Filter items based on active day and search query
  const filteredItems = initialItems.filter((item) => {
    const matchesDay = item.dayId === activeDayId;
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase());
    return matchesDay && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Search and Day Tabs */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between border-b border-border/25 pb-6">
        {/* Day Tabs */}
        <div className="flex flex-wrap gap-2">
          {days.map((day) => (
            <button
              key={day.id}
              onClick={() => setActiveDayId(day.id)}
              className={`focus-ring rounded-lg px-4 py-2 text-sm font-semibold transition duration-200 ${
                activeDayId === day.id
                  ? "bg-accent text-white shadow-soft"
                  : "bg-surface/60 hover:bg-hover/10 text-muted hover:text-foreground border border-border/30"
              }`}
            >
              <div>{day.title.split(" - ")[0]}</div>
              <div className="text-[10px] opacity-75 font-normal">{formatDate(day.date)}</div>
            </button>
          ))}
        </div>

        {/* Local Search Input */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder="Search sessions or rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="focus-ring w-full rounded-lg border border-border/45 bg-surface/65 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted"
          />
        </div>
      </div>

      {/* Timeline List */}
      <div className="relative border-l border-border/30 pl-6 ml-4 space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredItems.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="-ml-10 pt-4"
            >
              <EmptyState title="No sessions found" message="Try searching for a different keyword or check another day." />
            </motion.div>
          ) : (
            filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={reduceMotion ? {} : { opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                className="relative"
              >
                {/* Timeline node */}
                <div className="absolute -left-[31px] top-1.5 flex size-4 items-center justify-center rounded-full border border-border/50 bg-background">
                  <div className="size-2 rounded-full bg-accent" />
                </div>

                <GlassCard className="hover:border-accent/30 transition duration-300">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Time & Room */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1.5 font-semibold text-accent">
                        <Clock className="size-3.5" />
                        {formatTime(item.startsAt)} - {formatTime(item.endsAt)} UTC
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-muted" />
                        {item.location}
                      </span>
                    </div>
                    {/* Track Badge */}
                    <div>
                      <span className="rounded-full border border-border/40 bg-surface/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                        {item.track}
                      </span>
                    </div>
                  </div>

                  <h3 className="mt-3 font-heading text-lg font-bold text-foreground">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-2 text-xs leading-5 text-muted">
                      {item.description}
                    </p>
                  )}
                </GlassCard>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
