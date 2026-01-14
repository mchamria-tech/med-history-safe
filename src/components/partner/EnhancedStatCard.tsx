import { ReactNode } from "react";
import { TrendingUp, TrendingDown, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EnhancedStatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: number;
  iconBgColor?: string;
  iconColor?: string;
  className?: string;
}

export const EnhancedStatCard = ({
  icon,
  label,
  value,
  trend,
  iconBgColor = "bg-primary/10",
  iconColor = "text-primary",
  className,
}: EnhancedStatCardProps) => {
  const isPositive = trend !== undefined && trend >= 0;
  
  return (
    <div className={cn(
      "bg-card rounded-2xl p-5 shadow-soft border border-border/50 hover:shadow-elevated transition-shadow",
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center",
          iconBgColor
        )}>
          <div className={iconColor}>{icon}</div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
      
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-foreground">{value}</span>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-0.5 text-sm font-medium",
            isPositive ? "text-emerald-600" : "text-red-500"
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
    </div>
  );
};
