import { Mic2 } from "lucide-react";
import { GlassCard } from "@/components/cards/glass-card";

interface SpeakerCardProps {
  speaker: {
    id?: string;
    name: string;
    role: string;
    topic?: string;
    bio?: string | null;
    organization?: string;
    organizationId?: string | null;
    imageAsset?: { storageKey: string } | null;
    imageAssetId?: string | null;
  };
}

function resolveImgSrc(src?: string | null): string | null {
  if (!src) return null;
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
    return src;
  }
  if (src.startsWith("/ICGIT/") || src === "/ICGIT") {
    return src;
  }
  return src.startsWith("/") ? `/ICGIT${src}` : `/ICGIT/${src}`;
}

export function SpeakerCard({ speaker }: SpeakerCardProps) {
  const rawImgSrc = speaker.imageAsset?.storageKey || speaker.imageAssetId;
  const imgSrc = resolveImgSrc(rawImgSrc);

  return (
    <GlassCard className="h-full flex flex-col justify-between">
      <div>
        <div className="mb-5 size-16 rounded-2xl overflow-hidden bg-secondary/15 border border-border/30 flex items-center justify-center relative">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={speaker.name}
              className="size-full object-cover"
            />
          ) : (
            <Mic2 className="size-7 text-accent" aria-hidden="true" />
          )}
        </div>
        <h3 className="font-heading text-xl font-semibold text-foreground">{speaker.name}</h3>
        <p className="mt-1 text-sm font-medium text-accent">{speaker.role}</p>
        {speaker.organization && <p className="mt-1 text-sm text-muted">{speaker.organization}</p>}
      </div>
      {speaker.topic && (
        <p className="mt-5 border-t border-border/35 pt-5 text-sm leading-7 text-muted">
          &ldquo;{speaker.topic}&rdquo;
        </p>
      )}
    </GlassCard>
  );
}
