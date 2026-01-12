import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { mockAgeDemographics } from "./mockData";
import { cn } from "@/lib/utils";

interface DemographicsBarChartProps {
  className?: string;
}

export const DemographicsBarChart = ({ className }: DemographicsBarChartProps) => {
  return (
    <div className={cn("bg-card rounded-xl p-5 shadow-soft border border-border/50", className)}>
      <h3 className="font-semibold text-foreground mb-4">Age Demographics</h3>
      
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockAgeDemographics}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" vertical={false} />
            <XAxis 
              dataKey="ageGroup"
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
              }}
              formatter={(value: number) => [value, "Members"]}
            />
            <Bar 
              dataKey="count" 
              fill="hsl(220, 25%, 25%)" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
