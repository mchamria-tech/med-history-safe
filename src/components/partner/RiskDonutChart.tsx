import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { mockRiskData } from "./mockData";
import { cn } from "@/lib/utils";

interface RiskDonutChartProps {
  className?: string;
}

const COLORS = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

export const RiskDonutChart = ({ className }: RiskDonutChartProps) => {
  const data = [
    { name: "High Risk", value: mockRiskData.high.percentage, count: mockRiskData.high.count },
    { name: "Medium Risk", value: mockRiskData.medium.percentage, count: mockRiskData.medium.count },
    { name: "Low Risk", value: mockRiskData.low.percentage, count: mockRiskData.low.count },
  ];

  return (
    <div className={cn("bg-card rounded-xl p-5 shadow-soft border border-border/50", className)}>
      <h3 className="font-semibold text-foreground mb-4">Risk Level Analysis</h3>
      
      <div className="flex items-center gap-6">
        <div className="w-[180px] h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                <Cell fill={COLORS.high} />
                <Cell fill={COLORS.medium} />
                <Cell fill={COLORS.low} />
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(220, 15%, 90%)",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => [`${value}%`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">High Risk</p>
              <p className="text-xs text-muted-foreground">{mockRiskData.high.count} members</p>
            </div>
            <span className="text-sm font-semibold">{mockRiskData.high.percentage}%</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Medium Risk</p>
              <p className="text-xs text-muted-foreground">{mockRiskData.medium.count} members</p>
            </div>
            <span className="text-sm font-semibold">{mockRiskData.medium.percentage}%</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Low Risk</p>
              <p className="text-xs text-muted-foreground">{mockRiskData.low.count} members</p>
            </div>
            <span className="text-sm font-semibold">{mockRiskData.low.percentage}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
