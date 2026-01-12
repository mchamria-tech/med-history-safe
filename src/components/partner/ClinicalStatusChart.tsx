import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { mockClinicalStatus } from "./mockData";
import { cn } from "@/lib/utils";

interface ClinicalStatusChartProps {
  className?: string;
}

const COLORS = {
  Stable: "#22c55e",
  Review: "#f97316",
  Monitoring: "#f59e0b",
  Critical: "#ef4444",
};

export const ClinicalStatusChart = ({ className }: ClinicalStatusChartProps) => {
  const data = [
    { name: "Stable", value: mockClinicalStatus.stable.count },
    { name: "Review", value: mockClinicalStatus.review.count },
    { name: "Monitoring", value: mockClinicalStatus.monitoring.count },
    { name: "Critical", value: mockClinicalStatus.critical.count },
  ];

  return (
    <div className={cn("bg-card rounded-xl p-5 shadow-soft border border-border/50", className)}>
      <h3 className="font-semibold text-foreground mb-4">Clinical Status Distribution</h3>
      
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" horizontal={false} />
            <XAxis 
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 12 }}
            />
            <YAxis 
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 12 }}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(220, 15%, 90%)",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [value, "Members"]}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry) => (
                <Cell 
                  key={entry.name} 
                  fill={COLORS[entry.name as keyof typeof COLORS]} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
