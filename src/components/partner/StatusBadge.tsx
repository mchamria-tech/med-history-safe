import { cn } from "@/lib/utils";

type StatusType = "STABLE" | "MONITORING" | "CRITICAL" | "REVIEW";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  STABLE: {
    label: "STABLE",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  MONITORING: {
    label: "MONITORING",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  CRITICAL: {
    label: "CRITICAL",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  REVIEW: {
    label: "REVIEW",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};
