import { cn } from "@/lib/utils";

type RiskLevel = "Low" | "Medium" | "High";

interface RiskLevelBarProps {
  level: RiskLevel;
  percentage: number;
  showLabel?: boolean;
  className?: string;
}

const riskConfig: Record<RiskLevel, { color: string; bgColor: string }> = {
  Low: {
    color: "bg-emerald-500",
    bgColor: "bg-emerald-100",
  },
  Medium: {
    color: "bg-amber-500",
    bgColor: "bg-amber-100",
  },
  High: {
    color: "bg-red-500",
    bgColor: "bg-red-100",
  },
};

export const RiskLevelBar = ({
  level,
  percentage,
  showLabel = true,
  className,
}: RiskLevelBarProps) => {
  const config = riskConfig[level];
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {showLabel && (
        <span className={cn(
          "text-xs font-medium w-14",
          level === "Low" && "text-emerald-600",
          level === "Medium" && "text-amber-600",
          level === "High" && "text-red-600"
        )}>
          {level}
        </span>
      )}
      <div className="flex-1 flex items-center gap-2">
        <div className={cn("h-2 flex-1 rounded-full", config.bgColor)}>
          <div
            className={cn("h-full rounded-full transition-all", config.color)}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground w-10 text-right">
          {percentage}%
        </span>
      </div>
    </div>
  );
};
