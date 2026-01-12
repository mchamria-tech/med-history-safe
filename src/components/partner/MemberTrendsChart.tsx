import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { mockMemberTrends } from "./mockData";
import { cn } from "@/lib/utils";

interface MemberTrendsChartProps {
  className?: string;
}

export const MemberTrendsChart = ({ className }: MemberTrendsChartProps) => {
  const [view, setView] = useState<"weekly" | "monthly">("weekly");
  
  const data = view === "weekly" 
    ? mockMemberTrends.weekly 
    : mockMemberTrends.monthly;
  
  const xKey = view === "weekly" ? "day" : "week";

  return (
    <div className={cn("bg-card rounded-xl p-5 shadow-soft border border-border/50", className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-foreground">Member Trends</h3>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("weekly")}
            className={cn(
              "h-7 px-3 text-xs",
              view === "weekly" && "bg-background shadow-sm"
            )}
          >
            Weekly
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("monthly")}
            className={cn(
              "h-7 px-3 text-xs",
              view === "monthly" && "bg-background shadow-sm"
            )}
          >
            Monthly
          </Button>
        </div>
      </div>
      
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="memberGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(220, 25%, 25%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(220, 25%, 25%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
            <XAxis 
              dataKey={xKey} 
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(220, 15%, 90%)",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />
            <Area
              type="monotone"
              dataKey="members"
              stroke="hsl(220, 25%, 25%)"
              strokeWidth={2}
              fill="url(#memberGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
