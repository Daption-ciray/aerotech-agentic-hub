import { cn } from "@/lib/utils";
import { Shield, BookOpen } from "lucide-react";

interface ReferenceCardProps {
  type: "AMM" | "EASA" | "FAA";
  title: string;
  reference: string;
  className?: string;
}

const TYPE_CONFIG = {
  AMM: {
    icon: BookOpen,
    label: "AMM",
    bg: "bg-slate-800/80 border-slate-700",
    accent: "text-emerald-400",
  },
  EASA: {
    icon: Shield,
    label: "EASA",
    bg: "bg-slate-800/80 border-slate-700",
    accent: "text-amber-400",
  },
  FAA: {
    icon: Shield,
    label: "FAA",
    bg: "bg-slate-800/80 border-slate-700",
    accent: "text-amber-400",
  },
};

export function ReferenceCard({
  type,
  title,
  reference,
  className,
}: ReferenceCardProps) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-lg border p-3 text-xs font-mono",
        config.bg,
        className
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("w-3.5 h-3.5", config.accent)} />
        <span className={cn("font-semibold uppercase", config.accent)}>
          {config.label}
        </span>
      </div>
      <p className="text-zinc-300 font-sans">{title}</p>
      <p className="text-zinc-500 mt-1 truncate">{reference}</p>
    </div>
  );
}
