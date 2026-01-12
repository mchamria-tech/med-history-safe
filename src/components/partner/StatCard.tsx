import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  iconBgColor?: string;
  className?: string;
}

export const StatCard = ({
  icon,
  label,
  value,
  trend,
  trendLabel,
  iconBgColor = "bg-primary/10",
  className,
}: StatCardProps) => {
  const isPositive = trend !== undefined && trend >= 0;
  
  return (
    <div className={cn(
      "bg-card rounded-xl p-5 shadow-soft border border-border/50",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center",
          iconBgColor
        )}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
            isPositive 
              ? "text-emerald-600 bg-emerald-50" 
              : "text-red-600 bg-red-50"
          )}>
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
        {trendLabel && (
          <p className="text-xs text-muted-foreground mt-1">{trendLabel}</p>
        )}
      </div>
    </div>
  );
};
